export type Role = "HR admin" | "Hiring manager" | "Employee";
export type Module =
  | "candidates"
  | "interviews"
  | "employees"
  | "courses"
  | "payroll"
  | "cases"
  | "reviews";
export type Item = {
  id: string;
  name: string;
  status: string;
  department: string;
  [key: string]: string | number;
};
export type State = {
  version: 1;
  data: Record<Module, Item[]>;
  audit: { id: string; text: string; at: string; role: Role }[];
};
export const stages: Record<Module, string[]> = {
  candidates: [
    "Applied",
    "Screening",
    "Interview",
    "Offer",
    "Hired",
    "Rejected",
  ],
  interviews: ["Scheduled", "Completed", "Cancelled"],
  employees: ["Active", "On leave", "Inactive"],
  courses: ["Not started", "In progress", "Completed"],
  payroll: ["Draft", "Reviewed", "Approved"],
  cases: ["Open", "In progress", "Resolved"],
  reviews: ["Draft", "In review", "Completed"],
};
export const titles: Record<Module, string> = {
  candidates: "Recruitment",
  interviews: "Interviews",
  employees: "People",
  courses: "Learning & development",
  payroll: "Payroll & benefits",
  cases: "Employee relations",
  reviews: "Performance reviews",
};
export function canAccess(role: Role, module: Module) {
  return (
    role === "HR admin" ||
    (role === "Hiring manager"
      ? !["payroll", "cases"].includes(module)
      : ["employees", "courses", "reviews"].includes(module))
  );
}
export function canWrite(role: Role, module: Module) {
  return (
    role === "HR admin" ||
    (role === "Hiring manager" &&
      ["candidates", "interviews", "courses", "reviews"].includes(module))
  );
}
export function visibleItems(state: State, role: Role, module: Module) {
  if (!canAccess(role, module)) return [];
  return state.data[module].filter(
    (r) =>
      role === "HR admin" ||
      (role === "Hiring manager"
        ? r.department === "Engineering" ||
          (module === "courses" && r.department === "All teams")
        : module === "employees"
          ? r.id === "emp-1"
          : r.employeeId === "emp-1"),
  );
}
export function payrollTotals(base: number, bonus: number, rate: number) {
  const gross = Math.round((base + bonus) * 100) / 100;
  const deduction = Math.round(gross * rate) / 100;
  return { gross, deduction, net: Math.round((gross - deduction) * 100) / 100 };
}
export function validate(
  module: Module,
  item: Item,
  state: State,
): string | undefined {
  if (!item.name.trim()) return "A name or title is required.";
  if (!stages[module].includes(item.status)) return "Choose a valid status.";
  if (
    module === "candidates" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(item.email || ""))
  )
    return "Enter a valid email address.";
  if (module === "interviews") {
    if (
      !item.candidateId ||
      !state.data.candidates.some((c) => c.id === item.candidateId)
    )
      return "Select a candidate.";
    if (
      state.data.candidates.find((c) => c.id === item.candidateId)
        ?.department !== item.department
    )
      return "Interview department must match the candidate.";
    if (!item.date || !item.time || !item.interviewer)
      return "Choose a date, time, and interviewer.";
    const minutes = (t: string) =>
      Number(t.split(":")[0]) * 60 + Number(t.split(":")[1]);
    const clash = state.data.interviews.some(
      (i) =>
        i.id !== item.id &&
        i.status === "Scheduled" &&
        item.status === "Scheduled" &&
        i.date === item.date &&
        Math.abs(minutes(String(i.time)) - minutes(String(item.time))) < 60 &&
        (i.interviewer === item.interviewer ||
          i.candidateId === item.candidateId),
    );
    if (clash)
      return "This candidate or interviewer already has an interview at that time.";
    if (
      item.status === "Completed" &&
      (!String(item.notes || "").trim() ||
        !Number.isInteger(Number(item.rating)) ||
        Number(item.rating) < 1 ||
        Number(item.rating) > 5)
    )
      return "Completed interviews need feedback and a whole-number rating from 1 to 5.";
  }
  if (
    ["courses", "payroll", "reviews"].includes(module) &&
    !state.data.employees.some((e) => e.id === item.employeeId)
  )
    return "Select an employee.";
  if (
    ["courses", "payroll", "reviews"].includes(module) &&
    state.data.employees.find((e) => e.id === item.employeeId)?.department !==
      item.department
  )
    return "Department must match the selected employee.";
  if (
    module === "courses" &&
    (!Number.isFinite(Number(item.progress)) ||
      Number(item.progress) < 0 ||
      Number(item.progress) > 100)
  )
    return "Progress must be between 0 and 100.";
  if (
    module === "payroll" &&
    (![item.base, item.bonus, item.rate].every(
      (v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0,
    ) ||
      Number(item.rate) > 100)
  )
    return "Use positive amounts and a deduction rate from 0 to 100.";
  if (module === "payroll") {
    const previous = state.data.payroll.find((r) => r.id === item.id);
    if (
      item.status === "Approved" &&
      previous?.status !== "Reviewed" &&
      previous?.status !== "Approved"
    )
      return "Save this record as Reviewed before approving it.";
    if (
      previous?.status === "Approved" &&
      JSON.stringify(previous) !== JSON.stringify(item)
    )
      return "Approved demo records are locked. Create a new period instead.";
    if (
      state.data.payroll.some(
        (r) =>
          r.id !== item.id &&
          r.employeeId === item.employeeId &&
          r.period === item.period,
      )
    )
      return "A payroll record already exists for this employee and period.";
  }
  if (
    module === "cases" &&
    item.status === "Resolved" &&
    !String(item.resolution || "").trim()
  )
    return "Add a resolution before resolving the case.";
  if (
    module === "reviews" &&
    item.status === "Completed" &&
    (!String(item.notes || "").trim() ||
      !Number.isInteger(Number(item.rating)) ||
      Number(item.rating) < 1 ||
      Number(item.rating) > 5)
  )
    return "Completed reviews need feedback and a whole-number rating from 1 to 5.";
}
export function saveItem(
  state: State,
  role: Role,
  module: Module,
  item: Item,
): State {
  if (
    !canWrite(role, module) ||
    (role === "Hiring manager" &&
      item.department !== "Engineering" &&
      !(module === "courses" && item.department === "All teams"))
  )
    throw new Error("This demo role cannot change that record.");
  const existing = state.data[module].find((r) => r.id === item.id);
  if (
    existing &&
    !visibleItems(state, role, module).some((r) => r.id === item.id)
  )
    throw new Error("This record is outside your team.");
  const error = validate(module, item, state);
  if (error) throw new Error(error);
  let record = { ...item };
  if (module === "courses") {
    record.progress = Number(record.progress);
    record.status =
      Number(record.progress) === 100
        ? "Completed"
        : Number(record.progress) > 0
          ? "In progress"
          : "Not started";
  }
  const data = {
    ...state.data,
    [module]: existing
      ? state.data[module].map((r) => (r.id === record.id ? record : r))
      : [record, ...state.data[module]],
  };
  if (
    module === "candidates" &&
    record.status === "Hired" &&
    !data.employees.some((e) => e.candidateId === record.id)
  )
    data.employees = [
      {
        id: `hire-${record.id}`,
        name: record.name,
        department: record.department,
        status: "Active",
        job: record.job,
        email: record.email,
        location: "Remote",
        candidateId: record.id,
      },
      ...data.employees,
    ];
  return {
    ...state,
    data,
    audit: [
      {
        id: crypto.randomUUID(),
        text: `${existing ? "Updated" : "Created"} ${titles[module].toLowerCase()}: ${record.name}`,
        at: new Date().toISOString(),
        role,
      },
      ...state.audit,
    ].slice(0, 100),
  };
}
export const seed: State = {
  version: 1,
  data: {
    employees: [
      {
        id: "emp-1",
        name: "Alex Morgan",
        job: "Product Engineer",
        department: "Engineering",
        status: "Active",
        email: "alex@example.test",
        location: "Tashkent · Hybrid",
      },
      {
        id: "emp-2",
        name: "Olivia Chen",
        job: "Design Lead",
        department: "Design",
        status: "Active",
        email: "olivia@example.test",
        location: "London · Remote",
      },
      {
        id: "emp-3",
        name: "Noah Williams",
        job: "Engineering Manager",
        department: "Engineering",
        status: "Active",
        email: "noah@example.test",
        location: "Tashkent · Office",
      },
      {
        id: "emp-4",
        name: "Sofia Patel",
        job: "People Partner",
        department: "People",
        status: "Active",
        email: "sofia@example.test",
        location: "London · Hybrid",
      },
      {
        id: "emp-5",
        name: "James Park",
        job: "Marketing Manager",
        department: "Marketing",
        status: "On leave",
        email: "james@example.test",
        location: "Seoul · Remote",
      },
      {
        id: "emp-6",
        name: "Emma Wilson",
        job: "Frontend Engineer",
        department: "Engineering",
        status: "Active",
        email: "emma@example.test",
        location: "Berlin · Remote",
      },
      {
        id: "emp-7",
        name: "Lucas Silva",
        job: "Product Designer",
        department: "Design",
        status: "Active",
        email: "lucas@example.test",
        location: "Lisbon · Remote",
      },
      {
        id: "emp-8",
        name: "Mia Johnson",
        job: "Growth Specialist",
        department: "Marketing",
        status: "Active",
        email: "mia@example.test",
        location: "New York · Remote",
      },
    ],
    candidates: [
      {
        id: "c-1",
        name: "Sarah Jenkins",
        job: "Senior Product Designer",
        department: "Design",
        status: "Interview",
        email: "sarah@example.test",
        source: "LinkedIn",
        notes: "Strong systems thinking and portfolio.",
      },
      {
        id: "c-2",
        name: "Michael Foster",
        job: "Frontend Engineer",
        department: "Engineering",
        status: "Screening",
        email: "michael@example.test",
        source: "Referral",
        notes: "",
      },
      {
        id: "c-3",
        name: "Emily Davis",
        job: "Brand Designer",
        department: "Design",
        status: "Offer",
        email: "emily@example.test",
        source: "Careers page",
        notes: "Offer in preparation.",
      },
      {
        id: "c-4",
        name: "Daniel Kim",
        job: "Backend Engineer",
        department: "Engineering",
        status: "Interview",
        email: "daniel@example.test",
        source: "LinkedIn",
        notes: "",
      },
      {
        id: "c-5",
        name: "Amara Okafor",
        job: "Growth Specialist",
        department: "Marketing",
        status: "Applied",
        email: "amara@example.test",
        source: "Careers page",
        notes: "",
      },
      {
        id: "c-6",
        name: "Leo Martin",
        job: "Product Engineer",
        department: "Engineering",
        status: "Applied",
        email: "leo@example.test",
        source: "Referral",
        notes: "",
      },
      {
        id: "c-7",
        name: "Chloe Brown",
        job: "People Coordinator",
        department: "People",
        status: "Screening",
        email: "chloe@example.test",
        source: "Careers page",
        notes: "",
      },
      {
        id: "c-8",
        name: "Ethan Wright",
        job: "Frontend Engineer",
        department: "Engineering",
        status: "Rejected",
        email: "ethan@example.test",
        source: "LinkedIn",
        notes: "Experience did not match this opening.",
      },
    ],
    interviews: [
      {
        id: "i-1",
        name: "Portfolio conversation",
        candidateId: "c-1",
        department: "Design",
        status: "Scheduled",
        date: "2026-11-02",
        time: "10:30",
        interviewer: "Olivia Chen",
        format: "Video call",
        rating: 0,
        notes: "",
      },
      {
        id: "i-2",
        name: "Technical interview",
        candidateId: "c-4",
        department: "Engineering",
        status: "Scheduled",
        date: "2026-11-02",
        time: "14:00",
        interviewer: "Noah Williams",
        format: "Video call",
        rating: 0,
        notes: "",
      },
      {
        id: "i-3",
        name: "Culture & collaboration",
        candidateId: "c-2",
        department: "Engineering",
        status: "Scheduled",
        date: "2026-11-03",
        time: "11:00",
        interviewer: "Sofia Patel",
        format: "In person",
        rating: 0,
        notes: "",
      },
    ],
    courses: [
      {
        id: "l-1",
        name: "Leading with empathy",
        employeeId: "emp-3",
        department: "Engineering",
        status: "In progress",
        category: "Leadership",
        progress: 65,
        due: "2026-11-12",
        notes: "Practice clear, supportive feedback.",
      },
      {
        id: "l-2",
        name: "Accessible product design",
        employeeId: "emp-2",
        department: "Design",
        status: "In progress",
        category: "Design",
        progress: 40,
        due: "2026-11-18",
        notes: "Build inclusive digital experiences.",
      },
      {
        id: "l-3",
        name: "Security essentials",
        employeeId: "emp-1",
        department: "Engineering",
        status: "Completed",
        category: "Compliance",
        progress: 100,
        due: "2026-11-05",
        notes: "Password hygiene and phishing awareness.",
      },
      {
        id: "l-4",
        name: "Modern React patterns",
        employeeId: "emp-1",
        department: "Engineering",
        status: "In progress",
        category: "Engineering",
        progress: 25,
        due: "2026-11-20",
        notes: "Composition, performance, and testing.",
      },
    ],
    payroll: [
      {
        id: "p-1",
        name: "Alex Morgan",
        employeeId: "emp-1",
        department: "Engineering",
        status: "Draft",
        period: "2026-11",
        base: 4800,
        bonus: 250,
        rate: 12,
        benefits: "Health plan · Learning stipend",
      },
      {
        id: "p-2",
        name: "Olivia Chen",
        employeeId: "emp-2",
        department: "Design",
        status: "Reviewed",
        period: "2026-11",
        base: 6200,
        bonus: 400,
        rate: 12,
        benefits: "Health plan · Wellness allowance",
      },
      {
        id: "p-3",
        name: "Noah Williams",
        employeeId: "emp-3",
        department: "Engineering",
        status: "Draft",
        period: "2026-11",
        base: 6800,
        bonus: 0,
        rate: 12,
        benefits: "Health plan · Learning stipend",
      },
    ],
    cases: [
      {
        id: "er-1",
        name: "Flexible working request",
        department: "Engineering",
        status: "Open",
        owner: "Sofia Patel",
        priority: "Normal",
        notes: "Fictional example: review a hybrid schedule request.",
        resolution: "",
      },
      {
        id: "er-2",
        name: "Team communication support",
        department: "Design",
        status: "In progress",
        owner: "Sofia Patel",
        priority: "High",
        notes: "Fictional example: facilitate a team conversation.",
        resolution: "",
      },
    ],
    reviews: [
      {
        id: "r-1",
        name: "Alex Morgan",
        employeeId: "emp-1",
        department: "Engineering",
        status: "In review",
        cycle: "Q4 2026",
        reviewer: "Noah Williams",
        rating: 4,
        goal: "Lead the component library refresh",
        notes: "Consistent delivery and thoughtful collaboration.",
      },
      {
        id: "r-2",
        name: "Olivia Chen",
        employeeId: "emp-2",
        department: "Design",
        status: "Draft",
        cycle: "Q4 2026",
        reviewer: "Sofia Patel",
        rating: 0,
        goal: "Launch the new design system",
        notes: "",
      },
      {
        id: "r-3",
        name: "Emma Wilson",
        employeeId: "emp-6",
        department: "Engineering",
        status: "Draft",
        cycle: "Q4 2026",
        reviewer: "Noah Williams",
        rating: 0,
        goal: "Improve application accessibility",
        notes: "",
      },
    ],
  },
  audit: [
    {
      id: "a-1",
      text: "Q4 performance review cycle opened",
      at: "2026-11-02T08:15:00Z",
      role: "HR admin",
    },
    {
      id: "a-2",
      text: "Learning paths assigned to the team",
      at: "2026-11-01T13:00:00Z",
      role: "HR admin",
    },
  ],
};
export const STORAGE_KEY = "folio-hr-demo-v1";
export function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (
        s.version === 1 &&
        Object.keys(seed.data).every((k) => Array.isArray(s.data?.[k])) &&
        Array.isArray(s.audit)
      )
        return s;
    }
  } catch {
    /* A fresh demo remains available when storage is unavailable. */
  }
  return structuredClone(seed);
}
