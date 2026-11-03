"use client";
import { useWorkspaceAuth } from "./AuthGate";
import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Clapperboard,
  Contact,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  definitions,
  emptyWorkspace,
  canEdit,
  type Workspace,
  type RecordItem,
  type Member,
  type Field,
} from "./skanc-model";
import { getLanguage, setLanguage, t, locale, type Language } from "./i18n";
type Audit = { id: string; actor: string; action: string; createdAt: string };
type Snapshot = {
  state: Workspace;
  revision: number;
  member: Member;
  members: Member[];
  audit: Audit[];
};
const icons: Record<string, typeof Users> = {
  clients: Contact,
  projects: BriefcaseBusiness,
  orders: Building2,
  events: Clapperboard,
  employees: Users,
  candidates: BriefcaseBusiness,
  interviews: CalendarDays,
  courses: GraduationCap,
  payroll: Wallet,
  cases: HeartHandshake,
  reviews: Activity,
};
const departments = ["Design", "Engineering", "Events", "Marketing", "People"];
const money = (n: unknown) =>
  new Intl.NumberFormat(locale(), {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`sk-badge ${["Active", "Approved", "Completed", "Delivered", "Hired", "Resolved"].includes(value) ? "success" : ["Rejected", "Cancelled", "Inactive"].includes(value) ? "muted" : ""}`}
    >
      {t(value)}
    </span>
  );
}
function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className="sk-dialog-head">
        <div>
          <span className="sk-eyebrow">SKANC / WORKSPACE</span>
          <h2>{title}</h2>
        </div>
        <button className="sk-icon" aria-label={t("Close")} onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function Skanc() {
  const workspaceAuth = useWorkspaceAuth();
  const [language, changeLanguage] = useState<Language>("en");
  const [loaded, setLoaded] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [page, setPage] = useState("dashboard");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [mobile, setMobile] = useState(false);
  const [editing, setEditing] = useState<RecordItem | null>(null);
  const [memberDialog, setMemberDialog] = useState(false);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    changeLanguage(getLanguage());
    setLoaded(true);
    void reload();
  }, []);
  useEffect(() => {
    if (loaded) setLanguage(language);
  }, [language, loaded]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function reload() {
    try {
      setError("");
      const response = await workspaceAuth.request("/api/workspace", { cache: "no-store" });
      const data = (await response.json()) as Snapshot & { error?: string };
      if (!response.ok)
        throw new Error(data.error || "Unable to load workspace.");
      setSnapshot(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function mutate(body: object) {
    setBusy(true);
    setFormError("");
    try {
      const response = await workspaceAuth.request("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, revision: snapshot?.revision }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status === 409) await reload();
        throw new Error(result.error || "Unable to save record.");
      }
      await reload();
      setToast("Changes saved.");
      return true;
    } catch (e) {
      setFormError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const navigate = (p: string) => {
    setPage(p);
    setQuery("");
    setStatus("all");
    setMobile(false);
    setFormError("");
  };
  if (!snapshot)
    return (
      <div className="sk-loading">
        <div className="sk-logo">
          SKANC<span>↗</span>
        </div>
        {error ? (
          <>
            <h2>{t(error)}</h2>
            <p>{t("Contact the workspace owner to configure access.")}</p>
            <button className="sk-button primary" onClick={() => void reload()}>
              {t("Try again")}
            </button>
            <button className="sk-button" onClick={()=>void workspaceAuth.logout()}>{t("Use another account")}</button>
          </>
        ) : (
          <>
            <LoaderCircle className="sk-spin" />
            <p>Loading workspace…</p>
          </>
        )}
      </div>
    );
  const { state, member } = snapshot;
  const admin = member.role === "admin";
  const modules = Object.keys(definitions).filter((m) =>
    admin || member.role === "manager"
      ? !["payroll", "cases"].includes(m) || admin
      : ["employees", "courses", "reviews", "projects", "events"].includes(m),
  );
  const rows = (state.data[page] || []).filter(
    (r) =>
      (status === "all" || r.status === status) &&
      Object.values(r).join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  const create = () => {
    const fields = definitions[page].fields;
    setEditing({
      id: crypto.randomUUID(),
      name: "",
      status: definitions[page].statuses[0],
      department: member.department || "Design",
      ...Object.fromEntries(
        fields
          .filter((f) => !["name", "department"].includes(f.key))
          .map((f) => [
            f.key,
            f.options?.[0] ?? (f.type === "number" ? 0 : ""),
          ]),
      ),
    });
    setFormError("");
  };
  const writable =
    definitions[page] &&
    member.role !== "employee" &&
    (admin || page !== "employees");
  const exportData = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              organization: "SKANC",
              exportedAt: new Date().toISOString(),
              data: state.data,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "skanc-records.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="sk-shell">
      {mobile && (
        <button
          className="sk-scrim"
          aria-label={t("Close navigation")}
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={`sk-sidebar ${mobile ? "open" : ""}`}>
        <a
          href="#"
          className="sk-logo"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          SKANC<span>↗</span>
        </a>
        <div className="sk-studio-mark">
          <span className="sk-live-dot" />
          {t("CREATIVE STUDIO")}
          <small>WEB · GRAPHICS · LIVE</small>
        </div>
        <nav aria-label={t("Main navigation")}>
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard size={18} />
            {t("Overview")}
          </button>
          <p>{t("STUDIO OPERATIONS")}</p>
          {modules
            .filter((k) =>
              ["clients", "projects", "orders", "events"].includes(k),
            )
            .map((k) => (
              <NavItem
                key={k}
                module={k}
                page={page}
                count={state.data[k].length}
                go={navigate}
              />
            ))}
          <p>{t("PEOPLE & CULTURE")}</p>
          {modules
            .filter(
              (k) => !["clients", "projects", "orders", "events"].includes(k),
            )
            .map((k) => (
              <NavItem key={k} module={k} page={page} go={navigate} />
            ))}
        </nav>
        <div className="sk-sidebar-bottom">
          <button
            onClick={() => navigate("settings")}
            className={page === "settings" ? "active" : ""}
          >
            <Settings size={18} />
            {t("Settings & privacy")}
          </button>
          <div className="sk-user">
            <span>{member.email[0].toUpperCase()}</span>
            <div>
              <strong>{member.email}</strong>
              <small>{t(member.role)}</small>
            </div>
            <ShieldCheck size={16} />
          </div>
        </div>
      </aside>
      <div className="sk-main">
        <header className="sk-topbar">
          <div>
            <button
              className="sk-icon sk-mobile-menu"
              aria-label={t("Open navigation")}
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span>SKANC</span>
            <ChevronRight size={14} />
            <strong>
              {t(
                definitions[page]?.label ||
                  (page === "settings" ? "Settings" : "Overview"),
              )}
            </strong>
          </div>
          <div>
            <span className="sk-connected">
              <i />
              {t("Connected workspace")}
            </span>
            <select
              aria-label="Language / Язык / Til"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as Language);
                changeLanguage(e.target.value as Language);
              }}
            >
              <option value="en">English</option>
              <option value="uz">O‘zbekcha</option>
              <option value="ru">Русский</option>
            </select>
            <button
              className="sk-icon"
              aria-label={t("Refresh data")}
              onClick={() => void reload()}
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>
        <main>
          <div className="sk-context">
            <span className="sk-live-dot" />
            {t("Your studio. In sync.")}
            <span>
              {t("Server storage")} · {t(member.role)} · v{snapshot.revision}
            </span>
          </div>
          {error && (
            <div className="sk-alert">
              {t(error)}{" "}
              <button onClick={() => void reload()}>{t("Try again")}</button>
            </div>
          )}
          {page === "dashboard" ? (
            <>
              <div className="sk-heading">
                <div>
                  <p className="sk-eyebrow">
                    SKANC / {t("CREATIVE OPERATIONS")}
                  </p>
                  <h1>
                    {t("Great work starts here.")}
                    <span>↗</span>
                  </h1>
                  <p>
                    {t("One studio. Every brief, every person, every stage.")}
                  </p>
                </div>
                <span className="sk-date">
                  {new Intl.DateTimeFormat(
                    language === "uz" ? "en-GB" : locale(),
                    { day: "2-digit", month: "2-digit", year: "numeric" },
                  ).format(new Date())}
                </span>
              </div>
              <div className="sk-hero">
                <div>
                  <span className="sk-eyebrow">
                    STRATEGY → DESIGN → EXPERIENCE
                  </span>
                  <h2>
                    {t("Ideas that move.")}
                    <br />
                    {t("Work that connects.")}
                  </h2>
                  <p>
                    {t(
                      "From a first sketch to the final encore. Keep your people and creative production moving together.",
                    )}
                  </p>
                  <button onClick={() => navigate("projects")}>
                    {t("Open project workspace")} <ArrowUpRight size={18} />
                  </button>
                </div>
                <div className="sk-hero-art" aria-hidden="true">
                  <span className="sk-art-word">
                    MAKE
                    <br />
                    IT
                    <br />
                    <i>LIVE.</i>
                  </span>
                  <span className="sk-art-orbit" />
                  <span className="sk-art-note">
                    SKANC↗
                    <br />
                    CREATIVE COMPANY
                  </span>
                </div>
              </div>
              <div className="sk-stats">
                {[
                  [
                    "projects",
                    "Active projects",
                    state.data.projects.filter(
                      (r) => !["Delivered", "Archived"].includes(r.status),
                    ).length,
                  ],
                  [
                    "clients",
                    "Clients",
                    state.data.clients.filter((r) => r.status === "Active")
                      .length,
                  ],
                  [
                    "events",
                    "Upcoming events",
                    state.data.events.filter(
                      (r) => !["Completed", "Cancelled"].includes(r.status),
                    ).length,
                  ],
                  [
                    "employees",
                    "Team members",
                    state.data.employees.filter((r) => r.status === "Active")
                      .length,
                  ],
                ]
                  .filter((x) => modules.includes(String(x[0])))
                  .map(([key, label, value]) => {
                    const Icon = icons[key];
                    return (
                      <button key={key} onClick={() => navigate(String(key))}>
                        <span>
                          {t(String(label))}
                          <Icon size={20} />
                        </span>
                        <strong>{String(value).padStart(2, "0")}</strong>
                        <small>
                          {t("View workspace")} <ArrowUpRight size={14} />
                        </small>
                      </button>
                    );
                  })}
              </div>
              <div className="sk-dashboard-grid">
                <section className="sk-card">
                  <div className="sk-card-title">
                    <div>
                      <span className="sk-eyebrow">01 / {t("PRODUCTION")}</span>
                      <h2>{t("Projects in motion")}</h2>
                    </div>
                    <button
                      className="sk-text-button"
                      onClick={() => navigate("projects")}
                    >
                      {t("View all")}
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {state.data.projects.length ? (
                    <div className="sk-project-list">
                      {state.data.projects.slice(0, 5).map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            navigate("projects");
                            setEditing(r);
                          }}
                        >
                          <span className="sk-project-symbol">↗</span>
                          <div>
                            <strong>{r.name}</strong>
                            <small>
                              {t(String(r.service))} · {r.deadline}
                            </small>
                          </div>
                          <Badge value={r.status} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="A blank canvas. A fresh start."
                      text="Add your team and a client, then create your first project."
                      action={() => navigate("clients")}
                      actionLabel="Open clients"
                    />
                  )}
                </section>
                <section className="sk-card">
                  <div className="sk-card-title">
                    <div>
                      <span className="sk-eyebrow">
                        02 / {t("LIVE EXPERIENCE")}
                      </span>
                      <h2>{t("On the horizon")}</h2>
                    </div>
                    <Clapperboard size={21} />
                  </div>
                  {state.data.events.length ? (
                    state.data.events.slice(0, 4).map((r) => (
                      <button
                        key={r.id}
                        className="sk-event-row"
                        onClick={() => {
                          navigate("events");
                          setEditing(r);
                        }}
                      >
                        <span>
                          <CalendarDays size={19} />
                        </span>
                        <div>
                          <strong>{r.name}</strong>
                          <small>
                            {r.date} · {r.time} · {r.venue}
                          </small>
                        </div>
                        <ArrowUpRight size={15} />
                      </button>
                    ))
                  ) : (
                    <Empty
                      title="Your next show starts here."
                      text="Plan concert graphics, stage visuals, venues, and production leads in one place."
                      action={() => navigate("events")}
                      actionLabel="Open events"
                    />
                  )}
                </section>
              </div>
              <div className="sk-bottom-strip">
                <ShieldCheck size={22} />
                <div>
                  <strong>
                    {t("A real workspace, ready for your records.")}
                  </strong>
                  <p>
                    {t(
                      "Shared database. Verified access. Recorded changes. No sample records are added automatically.",
                    )}
                  </p>
                </div>
                <button
                  className="sk-button"
                  onClick={() => navigate("settings")}
                >
                  {t("Workspace settings")}
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </>
          ) : page === "settings" ? (
            <>
              <div className="sk-heading">
                <div>
                  <p className="sk-eyebrow">SKANC / {t("WORKSPACE")}</p>
                  <h1>{t("Settings & privacy")}</h1>
                  <p>{t("Access, records, and responsibility.")}</p>
                </div>
              </div>
              <div className="sk-settings-grid">
                <section className="sk-card sk-settings-card">
                  <ShieldCheck size={24} />
                  <h2>{t("Your access")}</h2>
                  <p>{member.email}</p>
                  <Badge value={member.role} />
                  <p>
                    {t(
                      "Your role is verified by the server. It cannot be changed in the browser.",
                    )}
                  </p>
                  <button className="sk-button" onClick={()=>void workspaceAuth.logout()}>
                    {t("Sign out")}
                  </button>
                </section>
                <section className="sk-card sk-settings-card">
                  <Wallet size={24} />
                  <h2>{t("Payroll responsibility")}</h2>
                  <p>
                    {t(
                      "Payroll records are operational tracking only. No payments, tax filings, or benefits enrollment are executed. Confirm amounts and deductions with your payroll provider.",
                    )}
                  </p>
                  <button className="sk-button" onClick={exportData}>
                    <ArrowDownToLine size={16} />
                    {t("Export visible data")}
                  </button>
                  <p>
                    {t(
                      "Exports contain sensitive information. Store them securely.",
                    )}
                  </p>
                </section>
              </div>
              {admin && (
                <>
                  <section className="sk-card sk-members">
                    <div className="sk-card-title">
                      <div>
                        <span className="sk-eyebrow">ACCESS CONTROL</span>
                        <h2>{t("Workspace members")}</h2>
                        <p>
                          {t(
                            "Only verified accounts with an assigned workspace role can access records.",
                          )}
                        </p>
                      </div>
                      <button
                        className="sk-button primary"
                        onClick={() => {
                          setMemberDialog(true);
                          setFormError("");
                        }}
                      >
                        <Plus size={16} />
                        {t("Add member")}
                      </button>
                    </div>
                    <div className="sk-table-scroll">
                      <table>
                        <thead>
                          <tr>
                            {[
                              "Email",
                              "Role",
                              "Department",
                              "Status",
                              "Actions",
                            ].map((s) => (
                              <th key={s}>{t(s)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>{t("Workspace owner")}</td>
                            <td>{t("admin")}</td>
                            <td>—</td>
                            <td>
                              <Badge value="Active" />
                            </td>
                            <td>—</td>
                          </tr>
                          {snapshot.members.map((m) => (
                            <tr key={m.email}>
                              <td>{m.email}</td>
                              <td>{t(m.role)}</td>
                              <td>{t(m.department)}</td>
                              <td>
                                <Badge
                                  value={m.active ? "Active" : "Inactive"}
                                />
                              </td>
                              <td>
                                <button
                                  className="sk-text-button"
                                  disabled={busy}
                                  onClick={() =>
                                    void mutate({
                                      action: "member",
                                      member: {
                                        ...m,
                                        active: m.active ? 0 : 1,
                                      },
                                    })
                                  }
                                >
                                  {t(
                                    m.active
                                      ? "Disable access"
                                      : "Enable access",
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {formError && !memberDialog && (
                      <p className="sk-error">{t(formError)}</p>
                    )}
                  </section>
                  <section className="sk-card sk-audit">
                    <div className="sk-card-title">
                      <div>
                        <span className="sk-eyebrow">CHANGE HISTORY</span>
                        <h2>{t("Activity log")}</h2>
                        <p>
                          {t(
                            "Latest 100 changes. Full history is retained in the database.",
                          )}
                        </p>
                      </div>
                    </div>
                    {snapshot.audit.length ? (
                      snapshot.audit.map((a) => (
                        <div className="sk-audit-row" key={a.id}>
                          <Activity size={15} />
                          <div>
                            <strong>{a.action}</strong>
                            <small>
                              {a.actor} ·{" "}
                              {new Date(a.createdAt).toLocaleString(locale(), {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="sk-empty-note">
                        {t("No changes recorded yet.")}
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          ) : (
            <>
              <div className="sk-heading">
                <div>
                  <p className="sk-eyebrow">
                    SKANC /{" "}
                    {t(
                      ["clients", "projects", "orders", "events"].includes(page)
                        ? "STUDIO OPERATIONS"
                        : "PEOPLE & CULTURE",
                    )}
                  </p>
                  <h1>{t(definitions[page].label)}</h1>
                  <p>{t(definitions[page].description)}</p>
                </div>
                <div className="sk-button-row">
                  <button className="sk-button" onClick={exportData}>
                    <ArrowDownToLine size={16} />
                    {t("Export")}
                  </button>
                  {writable && (
                    <button className="sk-button primary" onClick={create}>
                      <Plus size={17} />
                      {t("Add record")}
                    </button>
                  )}
                </div>
              </div>
              {page === "payroll" && (
                <div className="sk-alert">
                  {t(
                    "Payroll records are operational tracking only. No payments, tax filings, or benefits enrollment are executed. Confirm amounts and deductions with your payroll provider.",
                  )}
                </div>
              )}
              {page === "cases" && (
                <div className="sk-privacy">
                  <ShieldCheck size={15} />
                  {t(
                    "Restricted HR records. Visible only to workspace administrators.",
                  )}
                </div>
              )}
              <section className="sk-card sk-records">
                <div className="sk-records-toolbar">
                  <div className="sk-search">
                    <Search size={17} />
                    <input
                      aria-label={t("Search")}
                      placeholder={t("Search records…")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <select
                    aria-label={t("Filter by status")}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">{t("All statuses")}</option>
                    {definitions[page].statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                  <span>
                    {rows.length} {t("records")}
                  </span>
                </div>
                <div className="sk-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Name",
                          "Department",
                          "Details",
                          "Status",
                          "Actions",
                        ].map((s) => (
                          <th key={s}>{t(s)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.name}</strong>
                            <small>
                              {r.email ||
                                r.service ||
                                r.cycle ||
                                r.period ||
                                r.venue}
                            </small>
                          </td>
                          <td>{t(r.department)}</td>
                          <td>
                            <RecordSummary
                              module={page}
                              item={r}
                              state={state}
                            />
                          </td>
                          <td>
                            <Badge value={r.status} />
                          </td>
                          <td>
                            <button
                              className="sk-icon"
                              aria-label={t("View") + " " + r.name}
                              onClick={() => {
                                setEditing(r);
                                setFormError("");
                              }}
                            >
                              <ArrowUpRight size={19} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!rows.length && (
                  <Empty
                    title={
                      query || status !== "all"
                        ? "No records found"
                        : "Ready for your first record."
                    }
                    text={
                      query || status !== "all"
                        ? "Try a different search or clear your filters."
                        : "Create a record to start organizing your studio."
                    }
                    action={writable ? create : undefined}
                    actionLabel="Add record"
                  />
                )}
                <div className="sk-table-foot">
                  <span>
                    {t("Server storage")} · {t("Access controlled")}
                  </span>
                  <span>{t("Time zone")}: Asia/Tashkent · USD</span>
                </div>
              </section>
            </>
          )}
          <footer>
            <span>SKANC↗ — WEB / GRAPHICS / LIVE</span>
            <span>{t("Built for the work behind the work.")}</span>
          </footer>
        </main>
      </div>
      {editing && definitions[page] && (
        <RecordDialog
          module={page}
          initial={editing}
          state={state}
          member={member}
          busy={busy}
          error={formError}
          close={() => !busy && setEditing(null)}
          save={async (item) => {
            if (await mutate({ action: "save", module: page, item }))
              setEditing(null);
          }}
        />
      )}
      {memberDialog && (
        <MemberDialog
          state={state}
          busy={busy}
          error={formError}
          close={() => !busy && setMemberDialog(false)}
          save={async (m) => {
            if (await mutate({ action: "member", member: m }))
              setMemberDialog(false);
          }}
        />
      )}
      {toast && (
        <div className="sk-toast" role="status">
          <Check size={18} />
          {t(toast)}
        </div>
      )}
    </div>
  );
}
function NavItem({
  module,
  page,
  count,
  go,
}: {
  module: string;
  page: string;
  count?: number;
  go: (p: string) => void;
}) {
  const Icon = icons[module];
  return (
    <button
      className={page === module ? "active" : ""}
      onClick={() => go(module)}
    >
      <Icon size={18} />
      <span>{t(definitions[module].label)}</span>
      {count !== undefined && <small>{count}</small>}
    </button>
  );
}
function Empty({
  title,
  text,
  action,
  actionLabel,
}: {
  title: string;
  text: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <div className="sk-empty">
      <span>↗</span>
      <h3>{t(title)}</h3>
      <p>{t(text)}</p>
      {action && (
        <button className="sk-text-button" onClick={action}>
          {t(actionLabel || "Add record")}
          <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}
function RecordSummary({
  module,
  item: r,
  state,
}: {
  module: string;
  item: RecordItem;
  state: Workspace;
}) {
  const linked = (key: string, collection: string) =>
    state.data[collection].find((e) => e.id === r[key])?.name || "—";
  if (module === "payroll") {
    const gross = Number(r.base) + Number(r.bonus || 0);
    return (
      <>
        <strong>{money(gross * (1 - Number(r.rate) / 100))}</strong>
        <small>
          {t("Gross")}: {money(gross)}
        </small>
      </>
    );
  }
  if (module === "courses")
    return (
      <>
        <strong>
          {r.progress}% · {linked("employeeId", "employees")}
        </strong>
        <small>{r.deadline}</small>
      </>
    );
  if (module === "interviews")
    return (
      <>
        <strong>
          {r.date} · {r.time}
        </strong>
        <small>{linked("candidateId", "candidates")}</small>
      </>
    );
  return (
    <>
      <strong>
        {r.deadline ||
          r.date ||
          r.job ||
          r.contact ||
          r.priority ||
          r.goal ||
          "—"}
      </strong>
      <small>
        {r.projectId
          ? linked("projectId", "projects")
          : r.clientId
            ? linked("clientId", "clients")
            : r.employeeId
              ? linked("employeeId", "employees")
              : r.location || ""}
      </small>
    </>
  );
}
function FieldInput({
  field,
  value,
  onChange,
  state,
  department,
  disabled,
}: {
  field: Field;
  value: string | number;
  onChange: (v: string) => void;
  state: Workspace;
  department: string;
  disabled: boolean;
}) {
  const options = field.link
    ? state.data[field.link]
        .filter((r) => r.department === department)
        .map((r) => ({ value: r.id, label: r.name }))
    : field.options?.map((s) => ({ value: s, label: t(s) }));
  return (
    <label className={`sk-field ${field.type === "textarea" ? "full" : ""}`}>
      <span>
        {t(field.label)}
        {field.required && " *"}
      </span>
      {options ? (
        <select
          name={field.key}
          disabled={disabled}
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t(field.label)}
        >
          <option value="">{t("Choose an option")}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          name={field.key}
          disabled={disabled}
          rows={3}
          maxLength={4000}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          name={field.key}
          disabled={disabled}
          type={field.type || "text"}
          required={field.required}
          value={
            ["date", "time", "month"].includes(field.type || "")
              ? undefined
              : value
          }
          defaultValue={
            ["date", "time", "month"].includes(field.type || "")
              ? value
              : undefined
          }
          maxLength={4000}
          min={field.type === "number" ? 0 : undefined}
          max={
            field.key === "rating"
              ? 5
              : field.key === "progress" || field.key === "rate"
                ? 100
                : undefined
          }
          step={field.key === "rating" ? "1" : "any"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function RecordDialog({
  module,
  initial,
  state,
  member,
  busy,
  error,
  close,
  save,
}: {
  module: string;
  initial: RecordItem;
  state: Workspace;
  member: Member;
  busy: boolean;
  error: string;
  close: () => void;
  save: (r: RecordItem) => Promise<void>;
}) {
  const [item, setItem] = useState(initial);
  const allowed =
    canEdit(member, module, initial) &&
    !(module === "payroll" && initial.status === "Approved");
  return (
    <Dialog title={t(definitions[module].label)} close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save({
            ...item,
            ...Object.fromEntries(new FormData(e.currentTarget)),
          } as RecordItem);
        }}
      >
        <div className="sk-dialog-body">
          <p className="sk-form-note">
            <ShieldCheck size={15} />
            {t(
              allowed
                ? "Changes are saved to the shared workspace."
                : "Read-only record.",
            )}
          </p>
          <div className="sk-form-grid">
            {definitions[module].fields.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={item[f.key] ?? ""}
                disabled={
                  !allowed ||
                  busy ||
                  (member.role === "manager" && f.key === "department")
                }
                department={item.department}
                state={state}
                onChange={(v) =>
                  setItem((current) => ({ ...current, [f.key]: v }))
                }
              />
            ))}
            <FieldInput
              field={{
                key: "status",
                label: "Status",
                options: definitions[module].statuses,
              }}
              value={item.status}
              disabled={!allowed || busy || module === "courses"}
              department={item.department}
              state={state}
              onChange={(v) =>
                setItem((current) => ({ ...current, status: v }))
              }
            />
          </div>
          {module === "interviews" && (
            <p className="sk-form-note">
              {t(
                "Each slot represents a 60-minute interview. No invitations or calendar events are sent.",
              )}
            </p>
          )}
          {module === "payroll" && (
            <p className="sk-form-note">
              {t("Approval locks the record. It does not execute a payment.")}
            </p>
          )}
          {module === "candidates" && (
            <p className="sk-form-note">
              {t(
                "Moving a candidate to Hired also creates an active employee record. Existing hires are never duplicated.",
              )}
            </p>
          )}
          {error && (
            <p className="sk-error" role="alert">
              {t(error)}
            </p>
          )}
        </div>
        <div className="sk-dialog-actions">
          <button
            type="button"
            className="sk-button"
            disabled={busy}
            onClick={close}
          >
            {t("Close")}
          </button>
          {allowed && (
            <button className="sk-button primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="sk-spin" size={16} />
              ) : (
                <Check size={16} />
              )}{" "}
              {t("Save")}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
function MemberDialog({
  state,
  busy,
  error,
  close,
  save,
}: {
  state: Workspace;
  busy: boolean;
  error: string;
  close: () => void;
  save: (m: Member) => Promise<void>;
}) {
  const [m, setM] = useState<Member>({
    email: "",
    role: "employee",
    department: "Design",
    employeeId: "",
    active: 1,
  });
  return (
    <Dialog title={t("Add member")} close={close}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save(m);
        }}
      >
        <div className="sk-dialog-body">
          <p className="sk-form-note">
            {t(
              "Only verified accounts with an assigned workspace role can access records.",
            )}
          </p>
          <div className="sk-form-grid">
            <label className="sk-field">
              <span>{t("Email")}</span>
              <input
                type="email"
                required
                value={m.email}
                onChange={(e) => setM({ ...m, email: e.target.value })}
              />
            </label>
            <label className="sk-field">
              <span>{t("Role")}</span>
              <select
                value={m.role}
                onChange={(e) =>
                  setM({ ...m, role: e.target.value as Member["role"] })
                }
              >
                {["employee", "manager", "admin"].map((r) => (
                  <option key={r} value={r}>
                    {t(r)}
                  </option>
                ))}
              </select>
            </label>
            <label className="sk-field">
              <span>{t("Department")}</span>
              <select
                value={m.department}
                onChange={(e) =>
                  setM({ ...m, department: e.target.value, employeeId: "" })
                }
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {t(d)}
                  </option>
                ))}
              </select>
            </label>
            <label className="sk-field">
              <span>{t("Employee")}</span>
              <select
                required={m.role === "employee"}
                value={m.employeeId}
                onChange={(e) => setM({ ...m, employeeId: e.target.value })}
              >
                <option value="">{t("Choose an option")}</option>
                {state.data.employees
                  .filter((r) => r.department === m.department)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {error && (
            <p className="sk-error" role="alert">
              {t(error)}
            </p>
          )}
        </div>
        <div className="sk-dialog-actions">
          <button type="button" className="sk-button" onClick={close}>
            {t("Cancel")}
          </button>
          <button className="sk-button primary" disabled={busy}>
            {t("Save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
