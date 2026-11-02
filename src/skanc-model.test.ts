import { test } from "node:test";
import assert from "node:assert/strict";
import {
  applySave,
  emptyWorkspace,
  visibleWorkspace,
  cleanItem,
  canRead,
  type Member,
  type RecordItem,
} from "./skanc-model.ts";
const admin: Member = {
  email: "admin@example.test",
  role: "admin",
  department: "",
  employeeId: "",
  active: 1,
};
const manager: Member = {
  email: "manager@example.test",
  role: "manager",
  department: "Design",
  employeeId: "test-1",
  active: 1,
};
const employee: Member = {
  email: "employee@example.test",
  role: "employee",
  department: "Design",
  employeeId: "test-1",
  active: 1,
};
function fixture() {
  let s = emptyWorkspace();
  s = applySave(s, admin, "employees", {
    id: "test-1",
    name: "Test Employee",
    status: "Active",
    department: "Design",
    email: "person@example.test",
    job: "Designer",
  });
  s = applySave(s, admin, "clients", {
    id: "client-1",
    name: "Test Client",
    status: "Active",
    department: "Design",
  });
  return s;
}
const project: RecordItem = {
  id: "project-1",
  name: "Test Website",
  status: "Brief",
  department: "Design",
  clientId: "client-1",
  ownerId: "test-1",
  deadline: "2026-12-01",
  budget: 1200,
  service: "Web design",
};
test("a real workspace starts empty in all eleven modules", () => {
  const s = emptyWorkspace();
  assert.equal(Object.keys(s.data).length, 11);
  assert.ok(Object.values(s.data).every((rows) => rows.length === 0));
});
test("creative production links clients, projects, orders and events", () => {
  let s = fixture();
  s = applySave(s, manager, "projects", project);
  s = applySave(s, admin, "orders", {
    id: "order-1",
    name: "Design brief",
    department: "Design",
    status: "Quoted",
    projectId: "project-1",
    amount: 500,
    deadline: "2026-12-01",
  });
  s = applySave(s, admin, "events", {
    id: "event-1",
    name: "Live visual production",
    department: "Design",
    status: "Planned",
    projectId: "project-1",
    ownerId: "test-1",
    date: "2026-12-01",
    time: "19:00",
    venue: "Test Venue",
  });
  assert.equal(s.data.orders.length, 1);
  assert.equal(s.data.events.length, 1);
  assert.equal(visibleWorkspace(s, employee).data.projects.length, 1);
  assert.equal(visibleWorkspace(s, employee).data.clients.length, 0);
});
test("manager cannot create records for another department or change employee profiles", () => {
  const s = fixture();
  assert.throws(
    () =>
      applySave(s, manager, "projects", { ...project, department: "Events" }),
    /Access denied/,
  );
  assert.throws(
    () => applySave(s, manager, "employees", s.data.employees[0]),
    /Access denied/,
  );
});
test("employee cannot write or view payroll and relations", () => {
  const s = fixture();
  assert.throws(
    () => applySave(s, employee, "clients", s.data.clients[0]),
    /Access denied/,
  );
  assert.equal(
    canRead(employee, "payroll", {
      id: "p",
      name: "p",
      status: "Draft",
      department: "Design",
      employeeId: "test-1",
    }),
    false,
  );
});
test("linked records must exist and belong to the authorized department", () => {
  const s = fixture();
  assert.throws(
    () => applySave(s, admin, "projects", { ...project, clientId: "missing" }),
    /Linked records/,
  );
  s.data.clients[0].department = "Events";
  assert.throws(
    () => applySave(s, admin, "projects", project),
    /Linked records/,
  );
});
test("only declared scalar fields are stored and required fields are validated", () => {
  const item = cleanItem("clients", {
    id: "test",
    name: "Test",
    status: "Active",
    department: "Design",
    role: "admin",
    script: "<script>",
  });
  assert.equal(item.role, undefined);
  assert.equal(item.script, undefined);
  assert.throws(
    () =>
      cleanItem("projects", {
        id: "x",
        name: "x",
        status: "Brief",
        department: "Design",
      }),
    /required/,
  );
  assert.throws(
    () =>
      cleanItem("clients", {
        id: "test",
        name: "Test",
        status: "Active",
        department: "Design",
        notes: { bad: true },
      }),
    /Invalid field/,
  );
});
test("hiring creates exactly one employee", () => {
  let s = fixture();
  const c = {
    id: "candidate-test",
    name: "Test Candidate",
    department: "Design",
    status: "Hired",
    email: "candidate@example.test",
    job: "Designer",
  };
  s = applySave(s, admin, "candidates", c);
  s = applySave(s, admin, "candidates", c);
  assert.equal(
    s.data.employees.filter((r) => r.id === "hire-candidate-test").length,
    1,
  );
});
test("interview overlap and final feedback are checked server-side", () => {
  let s = fixture();
  s = applySave(s, admin, "candidates", {
    id: "candidate-test",
    name: "Test",
    department: "Design",
    status: "Applied",
    email: "test@example.test",
    job: "Designer",
  });
  const interview = {
    id: "interview-1",
    name: "Portfolio",
    department: "Design",
    status: "Scheduled",
    candidateId: "candidate-test",
    interviewerId: "test-1",
    date: "2026-12-01",
    time: "10:00",
    format: "Video call",
    rating: 0,
  };
  s = applySave(s, admin, "interviews", interview);
  assert.throws(
    () =>
      applySave(s, admin, "interviews", {
        ...interview,
        id: "interview-2",
        time: "10:30",
      }),
    /conflict/,
  );
  assert.throws(
    () =>
      applySave(s, admin, "interviews", { ...interview, status: "Completed" }),
    /feedback/,
  );
  s = applySave(s, admin, "interviews", {
    ...interview,
    status: "Completed",
    rating: 4,
    notes: "Useful examples.",
  });
  assert.equal(s.data.interviews[0].status, "Completed");
});
test("payroll requires review, uniqueness and approval locking", () => {
  let s = fixture();
  const p = {
    id: "payroll-1",
    name: "November",
    department: "Design",
    status: "Draft",
    employeeId: "test-1",
    period: "2026-11",
    base: 1000,
    bonus: 0,
    rate: 10,
  };
  s = applySave(s, admin, "payroll", p);
  assert.throws(
    () => applySave(s, admin, "payroll", { ...p, status: "Approved" }),
    /Reviewed/,
  );
  s = applySave(s, admin, "payroll", { ...p, status: "Reviewed" });
  s = applySave(s, admin, "payroll", { ...p, status: "Approved" });
  assert.throws(
    () => applySave(s, admin, "payroll", { ...p, status: "Draft" }),
    /locked/,
  );
  assert.throws(
    () => applySave(s, admin, "payroll", { ...p, id: "duplicate" }),
    /already exists/,
  );
  assert.throws(() => applySave(s, manager, "payroll", p), /Access denied/);
});
test("development progress, resolutions and final reviews have completion requirements", () => {
  let s = fixture();
  s = applySave(s, admin, "courses", {
    id: "learning-1",
    name: "Learning",
    department: "Design",
    status: "Not started",
    employeeId: "test-1",
    skill: "Design",
    progress: 100,
    deadline: "2026-12-01",
  });
  assert.equal(s.data.courses[0].status, "Completed");
  assert.throws(
    () =>
      applySave(s, admin, "cases", {
        id: "case-1",
        name: "Support",
        department: "Design",
        status: "Resolved",
        ownerId: "test-1",
      }),
    /resolution/,
  );
  assert.throws(
    () =>
      applySave(s, admin, "reviews", {
        id: "review-1",
        name: "Q4",
        department: "Design",
        status: "Completed",
        employeeId: "test-1",
        reviewerId: "test-1",
        cycle: "Q4",
        rating: 4,
      }),
    /feedback/,
  );
});
