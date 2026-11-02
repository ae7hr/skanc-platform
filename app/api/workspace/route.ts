import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";
import {
  applySave,
  emptyWorkspace,
  visibleWorkspace,
  type Member,
  type Workspace,
} from "../../../src/skanc-model";
export const dynamic = "force-dynamic";
type Bindings = { DB?: D1Database; SKANC_OWNER_EMAIL?: string };
const respond = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
async function context() {
  const user = await getChatGPTUser();
  if (!user) throw new Error("Sign in required.");
  const bindings = env as unknown as Bindings;
  if (!bindings.DB || !bindings.SKANC_OWNER_EMAIL)
    throw new Error("Workspace configuration is incomplete.");
  const db = bindings.DB,
    email = user.email.toLowerCase();
  let member: Member | null =
    email === bindings.SKANC_OWNER_EMAIL.toLowerCase()
      ? { email, role: "admin", department: "", employeeId: "", active: 1 }
      : await db
          .prepare(
            "SELECT email,role,department,employee_id AS employeeId,active FROM members WHERE email=? AND active=1",
          )
          .bind(email)
          .first<Member>();
  if (!member) throw new Error("Access denied.");
  return { db, user, member, owner: bindings.SKANC_OWNER_EMAIL.toLowerCase() };
}
async function snapshot(db: D1Database) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO workspace (id,payload,revision,mutation) VALUES (?,?,0,?)",
    )
    .bind("skanc", JSON.stringify(emptyWorkspace()), "")
    .run();
  const row = await db
    .prepare("SELECT payload,revision FROM workspace WHERE id=?")
    .bind("skanc")
    .first<{ payload: string; revision: number }>();
  if (!row) throw new Error("Workspace unavailable.");
  return {
    state: JSON.parse(row.payload) as Workspace,
    revision: row.revision,
  };
}
export async function GET() {
  try {
    const { db, member } = await context(),
      { state, revision } = await snapshot(db);
    const audit =
      member.role === "admin"
        ? (
            await db
              .prepare(
                "SELECT id,actor,action,created_at AS createdAt FROM audit ORDER BY created_at DESC LIMIT 100",
              )
              .all()
          ).results
        : [];
    const members =
      member.role === "admin"
        ? (
            await db
              .prepare(
                "SELECT email,role,department,employee_id AS employeeId,active FROM members ORDER BY email",
              )
              .all()
          ).results
        : [];
    return respond({
      state: visibleWorkspace(state, member),
      revision,
      member,
      audit,
      members,
    });
  } catch (e) {
    const message = (e as Error).message;
    return respond(
      { error: message },
      message === "Sign in required."
        ? 401
        : message === "Access denied."
          ? 403
          : 503,
    );
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return respond({ error: "Invalid request origin." }, 403);
    if (!request.headers.get("content-type")?.includes("application/json"))
      return respond({ error: "JSON required." }, 415);
    const raw = await request.text();
    if (raw.length > 64000)
      return respond({ error: "Request too large." }, 413);
    const body = JSON.parse(raw);
    const { db, member, user, owner } = await context();
    const { state, revision } = await snapshot(db);
    const mutation = crypto.randomUUID(),
      at = new Date().toISOString();
    let next: Workspace = state;
    let action: string;
    let memberStatement: D1PreparedStatement | undefined;
    if (body.action === "save") {
      if (body.revision !== revision)
        return respond({ error: "Data changed. Reload and try again." }, 409);
      next = applySave(state, member, String(body.module), body.item);
      action = `Saved ${body.module}: ${body.item.id}`;
    } else if (body.action === "member") {
      if (member.role !== "admin") throw new Error("Access denied.");
      const target = body.member as Member;
      if (
        !target ||
        !["admin", "manager", "employee"].includes(target.role) ||
        !/^\S+@\S+\.\S+$/.test(target.email) ||
        target.email.length > 254 ||
        ![
          "",
          "Design",
          "Engineering",
          "Events",
          "Marketing",
          "People",
        ].includes(target.department) ||
        ![0, 1].includes(target.active)
      )
        throw new Error("Invalid member.");
      if (target.email.toLowerCase() === owner)
        throw new Error("The owner cannot be changed here.");
      if (target.role !== "admin" && !target.department)
        throw new Error("Department is required.");
      if (
        target.role === "employee" &&
        !state.data.employees.some(
          (e) =>
            e.id === target.employeeId && e.department === target.department,
        )
      )
        throw new Error("Select the matching employee profile.");
      memberStatement = db
        .prepare(
          "INSERT INTO members (email,role,department,employee_id,active) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM workspace WHERE id=? AND mutation=?) ON CONFLICT(email) DO UPDATE SET role=excluded.role,department=excluded.department,employee_id=excluded.employee_id,active=excluded.active",
        )
        .bind(
          target.email.toLowerCase(),
          target.role,
          target.department,
          target.employeeId || "",
          target.active,
          "skanc",
          mutation,
        );
      action = `Updated membership: ${target.email.toLowerCase()}`;
    } else return respond({ error: "Unknown action." }, 400);
    const statements = [
      db
        .prepare(
          "UPDATE workspace SET payload=?,revision=revision+1,mutation=? WHERE id=? AND revision=?",
        )
        .bind(JSON.stringify(next), mutation, "skanc", revision),
    ];
    if (memberStatement) statements.push(memberStatement);
    statements.push(
      db
        .prepare(
          "INSERT INTO audit (id,actor,action,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM workspace WHERE id=? AND mutation=?)",
        )
        .bind(mutation, user.email, action, at, "skanc", mutation),
    );
    const results = await db.batch(statements);
    if (results[0].meta.changes !== 1)
      return respond({ error: "Data changed. Reload and try again." }, 409);
    return respond({ ok: true });
  } catch (e) {
    const message = (e as Error).message;
    const safe = [
      "Access denied.",
      "Sign in required.",
      "Workspace configuration is incomplete.",
    ];
    return respond(
      {
        error:
          safe.includes(message) ||
          (!message.includes("SQL") && !message.includes("D1"))
            ? message
            : "Unable to save record.",
      },
      message === "Access denied." ? 403 : 400,
    );
  }
}
