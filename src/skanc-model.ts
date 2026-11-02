export type Role = "admin" | "manager" | "employee";
export type Member = {
  email: string;
  role: Role;
  department: string;
  employeeId: string;
  active: number;
};
export type RecordItem = {
  id: string;
  name: string;
  status: string;
  department: string;
  [key: string]: string | number;
};
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  link?: string;
};
export type Definition = {
  label: string;
  description: string;
  statuses: string[];
  fields: Field[];
};
const name: Field = { key: "name", label: "Name", required: true };
const department: Field = {
  key: "department",
  label: "Department",
  required: true,
  options: ["Design", "Engineering", "Events", "Marketing", "People"],
};
const notes: Field = { key: "notes", label: "Notes", type: "textarea" };
export const definitions: Record<string, Definition> = {
  clients: {
    label: "Clients",
    description: "Relationships behind every creative brief.",
    statuses: ["Active", "Archived"],
    fields: [
      name,
      department,
      { key: "contact", label: "Contact person" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      notes,
    ],
  },
  projects: {
    label: "Projects",
    description:
      "Websites, graphics, and concert visuals — from brief to delivery.",
    statuses: ["Brief", "In progress", "In review", "Delivered", "Archived"],
    fields: [
      name,
      department,
      { key: "clientId", label: "Client", link: "clients", required: true },
      {
        key: "service",
        label: "Service",
        options: ["Web design", "Graphic design", "Concert visuals"],
      },
      {
        key: "ownerId",
        label: "Project lead",
        link: "employees",
        required: true,
      },
      { key: "deadline", label: "Deadline", type: "date", required: true },
      { key: "budget", label: "Budget · USD", type: "number" },
      notes,
    ],
  },
  orders: {
    label: "Orders",
    description: "Track scope, approvals, and production for each commission.",
    statuses: [
      "Draft",
      "Quoted",
      "Approved",
      "In progress",
      "Delivered",
      "Cancelled",
    ],
    fields: [
      name,
      department,
      { key: "projectId", label: "Project", link: "projects", required: true },
      { key: "amount", label: "Amount · USD", type: "number" },
      { key: "deadline", label: "Deadline", type: "date", required: true },
      notes,
    ],
  },
  events: {
    label: "Concerts & events",
    description: "Coordinate creative production for the live stage.",
    statuses: ["Planned", "In progress", "Live", "Completed", "Cancelled"],
    fields: [
      name,
      department,
      { key: "projectId", label: "Project", link: "projects", required: true },
      {
        key: "ownerId",
        label: "Production lead",
        link: "employees",
        required: true,
      },
      { key: "date", label: "Date", type: "date", required: true },
      {
        key: "time",
        label: "Time · Asia/Tashkent",
        type: "time",
        required: true,
      },
      { key: "venue", label: "Venue", required: true },
      notes,
    ],
  },
  employees: {
    label: "People",
    description: "The SKANC team and the skills behind the work.",
    statuses: ["Active", "On leave", "Inactive"],
    fields: [
      name,
      department,
      { key: "email", label: "Email", type: "email", required: true },
      { key: "job", label: "Job title", required: true },
      { key: "location", label: "Location" },
      notes,
    ],
  },
  candidates: {
    label: "Recruitment",
    description: "Build the next chapter of the SKANC team.",
    statuses: [
      "Applied",
      "Screening",
      "Interview",
      "Offer",
      "Hired",
      "Rejected",
    ],
    fields: [
      name,
      department,
      { key: "email", label: "Email", type: "email", required: true },
      { key: "job", label: "Job title", required: true },
      { key: "source", label: "Source" },
      notes,
    ],
  },
  interviews: {
    label: "Interviews",
    description: "Schedule conversations and record structured feedback.",
    statuses: ["Scheduled", "Completed", "Cancelled"],
    fields: [
      name,
      department,
      {
        key: "candidateId",
        label: "Candidate",
        link: "candidates",
        required: true,
      },
      {
        key: "interviewerId",
        label: "Interviewer",
        link: "employees",
        required: true,
      },
      { key: "date", label: "Date", type: "date", required: true },
      {
        key: "time",
        label: "Time · Asia/Tashkent",
        type: "time",
        required: true,
      },
      {
        key: "format",
        label: "Format",
        options: ["Video call", "In person", "Phone"],
      },
      { key: "rating", label: "Rating · 1–5", type: "number" },
      notes,
    ],
  },
  courses: {
    label: "Learning & development",
    description: "Assign development plans and track team progress.",
    statuses: ["Not started", "In progress", "Completed"],
    fields: [
      name,
      department,
      {
        key: "employeeId",
        label: "Employee",
        link: "employees",
        required: true,
      },
      { key: "skill", label: "Skill / category", required: true },
      {
        key: "progress",
        label: "Progress · 0–100%",
        type: "number",
        required: true,
      },
      { key: "deadline", label: "Target date", type: "date", required: true },
      notes,
    ],
  },
  payroll: {
    label: "Payroll & benefits",
    description:
      "Track compensation records and approvals. Payments are handled externally.",
    statuses: ["Draft", "Reviewed", "Approved"],
    fields: [
      name,
      department,
      {
        key: "employeeId",
        label: "Employee",
        link: "employees",
        required: true,
      },
      { key: "period", label: "Period", type: "month", required: true },
      {
        key: "base",
        label: "Base amount · USD",
        type: "number",
        required: true,
      },
      { key: "bonus", label: "Bonus · USD", type: "number" },
      { key: "rate", label: "Deduction · %", type: "number", required: true },
      { key: "benefits", label: "Benefits tracking notes", type: "textarea" },
      notes,
    ],
  },
  cases: {
    label: "Employee relations",
    description: "Restricted HR case tracking with documented resolutions.",
    statuses: ["Open", "In progress", "Resolved"],
    fields: [
      name,
      department,
      {
        key: "ownerId",
        label: "Case owner",
        link: "employees",
        required: true,
      },
      {
        key: "priority",
        label: "Priority",
        options: ["Normal", "High", "Low"],
      },
      notes,
      { key: "resolution", label: "Resolution", type: "textarea" },
    ],
  },
  reviews: {
    label: "Performance reviews",
    description: "Goals, feedback, and progress for every review cycle.",
    statuses: ["Draft", "In review", "Completed"],
    fields: [
      name,
      department,
      {
        key: "employeeId",
        label: "Employee",
        link: "employees",
        required: true,
      },
      {
        key: "reviewerId",
        label: "Reviewer",
        link: "employees",
        required: true,
      },
      { key: "cycle", label: "Review cycle", required: true },
      { key: "rating", label: "Rating · 1–5", type: "number" },
      { key: "goal", label: "Development goal", type: "textarea" },
      notes,
    ],
  },
};
export type Workspace = { data: Record<string, RecordItem[]> };
export function emptyWorkspace(): Workspace {
  return {
    data: Object.fromEntries(Object.keys(definitions).map((k) => [k, []])),
  };
}
export function canRead(member: Member, module: string, item: RecordItem) {
  if (member.role === "admin") return true;
  if (["payroll", "cases"].includes(module)) return false;
  if (member.role === "manager")
    return !!member.department && item.department === member.department;
  return module === "employees"
    ? item.id === member.employeeId
    : ["courses", "reviews"].includes(module)
      ? item.employeeId === member.employeeId
      : ["projects", "events"].includes(module)
        ? item.ownerId === member.employeeId
        : false;
}
export function canEdit(member: Member, module: string, item: RecordItem) {
  return (
    member.role === "admin" ||
    (member.role === "manager" &&
      !["employees", "payroll", "cases"].includes(module) &&
      !!member.department &&
      item.department === member.department)
  );
}
export function visibleWorkspace(state: Workspace, member: Member): Workspace {
  return {
    data: Object.fromEntries(
      Object.entries(state.data).map(([k, rows]) => [
        k,
        rows.filter((r) => canRead(member, k, r)),
      ]),
    ),
  };
}
export function cleanItem(module: string, input: unknown): RecordItem {
  const def = definitions[module];
  if (!def || !input || typeof input !== "object")
    throw new Error("Invalid record.");
  const raw = input as Record<string, unknown>;
  const item: RecordItem = { id: "", name: "", status: "", department: "" };
  for (const key of ["id", "status", ...def.fields.map((f) => f.key)]) {
    const v = raw[key];
    if (v !== undefined && typeof v !== "string" && typeof v !== "number")
      throw new Error("Invalid field.");
    item[key] = typeof v === "number" ? v : String(v ?? "").trim();
    if (String(item[key]).length > 4000)
      throw new Error("A field is too long.");
  }
  if (
    !/^[a-zA-Z0-9-]{1,80}$/.test(item.id) ||
    !def.statuses.includes(item.status)
  )
    throw new Error("Invalid record or status.");
  for (const field of def.fields) {
    const v = item[field.key];
    if (field.required && (v === "" || v === undefined))
      throw new Error("Complete all required fields.");
    if (v !== "" && field.options && !field.options.includes(String(v)))
      throw new Error("Choose a valid option.");
    if (
      field.type === "number" &&
      v !== "" &&
      (!Number.isFinite(Number(v)) || Number(v) < 0)
    )
      throw new Error("Use non-negative numbers.");
    if (
      field.type === "email" &&
      v &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))
    )
      throw new Error("Enter a valid email address.");
    if (["date", "month", "time"].includes(field.type || "") && v) {
      const pattern =
        field.type === "date"
          ? /^\d{4}-\d{2}-\d{2}$/
          : field.type === "month"
            ? /^\d{4}-\d{2}$/
            : /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!pattern.test(String(v)))
        throw new Error("Enter a valid date or time.");
    }
  }
  return item;
}
export function applySave(
  state: Workspace,
  member: Member,
  module: string,
  input: unknown,
): Workspace {
  const item = cleanItem(module, input),
    rows = state.data[module],
    previous = rows.find((r) => r.id === item.id);
  if (
    !canEdit(member, module, item) ||
    (previous && !canEdit(member, module, previous))
  )
    throw new Error("Access denied.");
  for (const field of definitions[module].fields) {
    if (field.link && item[field.key]) {
      const linked = state.data[field.link].find(
        (r) => r.id === item[field.key],
      );
      if (
        !linked ||
        !canRead(member, field.link, linked) ||
        linked.department !== item.department
      )
        throw new Error(
          "Linked records must be accessible and in the same department.",
        );
    }
  }
  if (module === "interviews" && item.status === "Scheduled") {
    const minutes = (t: string) =>
      Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    if (
      rows.some(
        (r) =>
          r.id !== item.id &&
          r.status === "Scheduled" &&
          r.date === item.date &&
          Math.abs(minutes(String(r.time)) - minutes(String(item.time))) < 60 &&
          (r.candidateId === item.candidateId ||
            r.interviewerId === item.interviewerId),
      )
    )
      throw new Error("Interview time conflict.");
  }
  if (
    ["interviews", "reviews"].includes(module) &&
    item.status === "Completed" &&
    (!item.notes ||
      !Number.isInteger(Number(item.rating)) ||
      Number(item.rating) < 1 ||
      Number(item.rating) > 5)
  )
    throw new Error(
      "Completed records require feedback and a rating from 1 to 5.",
    );
  if (module === "courses") {
    const p = Number(item.progress);
    if (p > 100) throw new Error("Progress must be between 0 and 100.");
    item.status =
      p === 100 ? "Completed" : p > 0 ? "In progress" : "Not started";
  }
  if (module === "cases" && item.status === "Resolved" && !item.resolution)
    throw new Error("Add a resolution before resolving the case.");
  if (module === "payroll") {
    if (Number(item.rate) > 100)
      throw new Error("Deduction rate must be between 0 and 100.");
    if (previous?.status === "Approved")
      throw new Error("Approved payroll records are locked.");
    if (item.status === "Approved" && previous?.status !== "Reviewed")
      throw new Error("Save this record as Reviewed before approving it.");
    if (
      rows.some(
        (r) =>
          r.id !== item.id &&
          r.employeeId === item.employeeId &&
          r.period === item.period,
      )
    )
      throw new Error(
        "A payroll record already exists for this employee and period.",
      );
  }
  const data = {
    ...state.data,
    [module]: previous
      ? rows.map((r) => (r.id === item.id ? item : r))
      : [item, ...rows],
  };
  if (
    module === "candidates" &&
    item.status === "Hired" &&
    !data.employees.some((r) => r.id === "hire-" + item.id)
  )
    data.employees = [
      {
        id: "hire-" + item.id,
        name: item.name,
        email: item.email,
        job: item.job,
        department: item.department,
        status: "Active",
      },
      ...data.employees,
    ];
  return { data };
}
