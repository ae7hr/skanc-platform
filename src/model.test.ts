import { test } from "node:test";
import assert from "node:assert/strict";
import {
  seed,
  saveItem,
  visibleItems,
  canAccess,
  canWrite,
  validate,
  payrollTotals,
} from "./model.ts";
const fresh = () => structuredClone(seed);
test("payroll uses explicit percent inputs and rounds cents", () => {
  assert.deepEqual(payrollTotals(4800, 250, 12), {
    gross: 5050,
    deduction: 606,
    net: 4444,
  });
  assert.deepEqual(payrollTotals(10.15, 0, 7.5), {
    gross: 10.15,
    deduction: 0.76,
    net: 9.39,
  });
});
test("manager and employee cannot access payroll or employee relations", () => {
  for (const role of ["Hiring manager", "Employee"] as const) {
    for (const module of ["payroll", "cases"] as const) {
      assert.equal(canAccess(role, module), false);
      assert.deepEqual(visibleItems(seed, role, module), []);
      assert.throws(
        () => saveItem(fresh(), role, module, seed.data[module][0]),
        /cannot change/,
      );
    }
  }
});
test("employee sees only their own profile and assigned development records", () => {
  assert.deepEqual(
    visibleItems(seed, "Employee", "employees").map((x) => x.id),
    ["emp-1"],
  );
  assert.ok(
    visibleItems(seed, "Employee", "reviews").every(
      (x) => x.employeeId === "emp-1",
    ),
  );
  assert.ok(
    visibleItems(seed, "Employee", "courses").every(
      (x) => x.employeeId === "emp-1",
    ),
  );
  assert.equal(canWrite("Employee", "reviews"), false);
});
test("manager records are scoped to Engineering and cannot be moved across teams", () => {
  assert.ok(
    visibleItems(seed, "Hiring manager", "candidates").every(
      (x) => x.department === "Engineering",
    ),
  );
  assert.throws(
    () =>
      saveItem(fresh(), "Hiring manager", "candidates", {
        ...seed.data.candidates[0],
        department: "Engineering",
      }),
    /outside your team/,
  );
  assert.throws(
    () =>
      saveItem(fresh(), "Hiring manager", "candidates", {
        ...seed.data.candidates[1],
        department: "Design",
      }),
    /cannot change/,
  );
});
test("hiring creates one employee and appends local activity", () => {
  let s = fresh();
  const c = { ...s.data.candidates[0], status: "Hired" };
  s = saveItem(s, "HR admin", "candidates", c);
  assert.equal(s.data.employees.length, 9);
  assert.equal(s.data.employees[0].name, c.name);
  s = saveItem(s, "HR admin", "candidates", c);
  assert.equal(s.data.employees.length, 9);
  assert.equal(s.audit.length, 4);
});
test("interview detects overlapping 60-minute interviewer and candidate slots", () => {
  const s = fresh(),
    i = s.data.interviews[0];
  assert.match(
    validate("interviews", { ...i, id: "new", time: "11:00" }, s)!,
    /already has/,
  );
  assert.equal(
    validate("interviews", { ...i, id: "new", time: "11:30" }, s),
    undefined,
  );
  assert.match(
    validate(
      "interviews",
      {
        ...i,
        id: "new",
        candidateId: "c-2",
        department: "Engineering",
        time: "10:30",
      },
      s,
    )!,
    /already has/,
  );
});
test("completed interview requires a whole rating and feedback", () => {
  const s = fresh(),
    i = { ...s.data.interviews[0], status: "Completed" };
  assert.ok(validate("interviews", i, s));
  assert.ok(validate("interviews", { ...i, rating: 3.5, notes: "Good" }, s));
  assert.equal(
    validate(
      "interviews",
      { ...i, rating: 4, notes: "Clear examples and thoughtful answers." },
      s,
    ),
    undefined,
  );
});
test("learning progress sets status consistently", () => {
  const s = fresh();
  for (const [progress, status] of [
    [0, "Not started"],
    [50, "In progress"],
    [100, "Completed"],
  ] as const) {
    const result = saveItem(s, "HR admin", "courses", {
      ...s.data.courses[0],
      progress,
    });
    assert.equal(result.data.courses[0].status, status);
  }
  assert.ok(validate("courses", { ...s.data.courses[0], progress: 101 }, s));
});
test("payroll must be reviewed before approval and is locked afterwards", () => {
  let s = fresh();
  const p = s.data.payroll[0];
  assert.throws(
    () => saveItem(s, "HR admin", "payroll", { ...p, status: "Approved" }),
    /Reviewed/,
  );
  s = saveItem(s, "HR admin", "payroll", { ...p, status: "Reviewed" });
  s = saveItem(s, "HR admin", "payroll", { ...p, status: "Approved" });
  assert.throws(
    () =>
      saveItem(s, "HR admin", "payroll", {
        ...p,
        status: "Approved",
        bonus: 900,
      }),
    /locked/,
  );
  assert.throws(
    () => saveItem(s, "HR admin", "payroll", { ...p, id: "duplicate" }),
    /already exists/,
  );
});
test("invalid payroll amounts and rates are rejected", () => {
  for (const patch of [
    { base: -1 },
    { rate: 101 },
    { bonus: "oops" },
  ] as Record<string, string | number>[])
    assert.ok(validate("payroll", { ...seed.data.payroll[0], ...patch }, seed));
});
test("resolved cases and completed reviews require an explanation", () => {
  assert.ok(
    validate("cases", { ...seed.data.cases[0], status: "Resolved" }, seed),
  );
  assert.equal(
    validate(
      "cases",
      {
        ...seed.data.cases[0],
        status: "Resolved",
        resolution: "Agreed on a two-week schedule trial.",
      },
      seed,
    ),
    undefined,
  );
  assert.ok(
    validate(
      "reviews",
      { ...seed.data.reviews[0], status: "Completed", notes: "" },
      seed,
    ),
  );
  assert.equal(
    validate("reviews", { ...seed.data.reviews[0], status: "Completed" }, seed),
    undefined,
  );
});
test("candidate email and known employee references are required", () => {
  assert.ok(
    validate("candidates", { ...seed.data.candidates[0], email: "bad" }, seed),
  );
  assert.ok(
    validate(
      "reviews",
      { ...seed.data.reviews[0], employeeId: "unknown" },
      seed,
    ),
  );
});
test("linked records cannot cross department scopes", () => {
  assert.throws(
    () =>
      saveItem(fresh(), "Hiring manager", "courses", {
        ...seed.data.courses[0],
        employeeId: "emp-2",
      }),
    /Department must match/,
  );
  assert.ok(
    validate(
      "interviews",
      { ...seed.data.interviews[0], department: "Engineering" },
      seed,
    ),
  );
});
