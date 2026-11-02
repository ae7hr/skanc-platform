import React, { useEffect, useRef, useState } from "react";

import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Wallet,
  HeartHandshake,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  X,
  Check,
  Download,
  ShieldCheck,
  Leaf,
  Menu,
  Clock3,
  CircleHelp,
  MoreHorizontal,
  CheckCircle2,
  Sparkles,
  Filter,
  Target,
  CircleArrowUp,
  Building2,
  LockKeyhole,
} from "lucide-react";
import {
  seed,
  stages,
  titles,
  loadState,
  saveItem,
  visibleItems,
  canAccess,
  canWrite,
  payrollTotals,
  STORAGE_KEY,
  type State,
  type Role,
  type Module,
  type Item,
} from "./model";
import "./styles.css";

type Page = Module | "dashboard" | "settings";
const icons = {
  dashboard: LayoutDashboard,
  employees: Users,
  candidates: BriefcaseBusiness,
  interviews: CalendarDays,
  courses: GraduationCap,
  payroll: Wallet,
  cases: HeartHandshake,
  reviews: ChartNoAxesCombined,
  settings: Settings,
};
const descriptions: Record<Module, string> = {
  employees: "Good people. Great things ahead.",
  candidates: "Find the people who will shape your next chapter.",
  interviews: "Make every conversation count.",
  courses: "A little growth, every day.",
  payroll: "A clear view of compensation and care.",
  cases: "A thoughtful space for a better workplace.",
  reviews: "Meaningful conversations. Measurable growth.",
};
const singular: Record<Module, string> = {
  employees: "employee",
  candidates: "candidate",
  interviews: "interview",
  courses: "learning plan",
  payroll: "payroll record",
  cases: "case",
  reviews: "review",
};
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
const initials = (n: string) =>
  n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("");
const dateLabel = (s: string) =>
  s
    ? new Date(s + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`avatar ${small ? "small" : ""} color-${name.length % 5}`}>
      {initials(name)}
    </span>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${["Active", "Hired", "Completed", "Approved", "Resolved", "Offer"].includes(status) ? "green" : ["Interview", "In progress", "In review", "Reviewed"].includes(status) ? "amber" : ["Rejected", "Cancelled", "Inactive", "High"].includes(status) ? "red" : "neutral"}`}
    >
      <i />
      {status}
    </span>
  );
}
function Modal({
  title,
  children,
  close,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      aria-label={title}
      ref={ref}
      className={wide ? "wide" : ""}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">FOLIO WORKSPACE</p>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function App() {
  const [state, setState] = useState<State>(loadState);
  const [role, setRole] = useState<Role>("HR admin");
  const [page, setPage] = useState<Page>("dashboard");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const [department, setDepartment] = useState("All teams");
  const [pageNo, setPageNo] = useState(1);
  const [sort, setSort] = useState("Recent first");
  const [editing, setEditing] = useState<{
    module: Module;
    item: Item;
    isNew: boolean;
  } | null>(null);
  const [info, setInfo] = useState<"activity" | "privacy" | "reset" | null>(
    null,
  );
  const [toast, setToast] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [view, setView] = useState<"table" | "board">("table");
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const navigate = (p: Page) => {
    setPage(p);
    setQuery("");
    setFilter("All statuses");
    setDepartment("All teams");
    setPageNo(1);
    setMobile(false);
  };
  const changeRole = (r: Role) => {
    setRole(r);
    navigate("dashboard");
    setToast(`Demo preview: ${r}`);
  };
  const get = (m: Module) => visibleItems(state, role, m);
  const newItem = (m: Module) => {
    const first = get("employees")[0] || state.data.employees[0];
    setEditing({
      module: m,
      isNew: true,
      item: {
        id: crypto.randomUUID(),
        name: ["payroll", "reviews"].includes(m) ? first.name : "",
        department: ["courses", "payroll", "reviews"].includes(m)
          ? first.department
          : role === "Hiring manager"
            ? "Engineering"
            : "Design",
        status: stages[m][0],
        job: "",
        email: "",
        source: "Careers page",
        notes: "",
        candidateId: "",
        date: "2026-11-03",
        time: "10:00",
        interviewer: "",
        format: "Video call",
        rating: 0,
        employeeId: first.id,
        progress: 0,
        category: "Engineering",
        due: "2026-11-30",
        base: 0,
        bonus: 0,
        rate: 12,
        benefits: "",
        period: "2026-11",
        owner: "Sofia Patel",
        priority: "Normal",
        resolution: "",
        cycle: "Q4 2026",
        reviewer: "",
        goal: "",
        location: "Remote",
      },
    });
  };
  const save = (item: Item) => {
    if (!editing) return;
    try {
      setState(saveItem(state, role, editing.module, item));
      setEditing(null);
      setToast(
        `${singular[editing.module][0].toUpperCase() + singular[editing.module].slice(1)} saved`,
      );
    } catch (e) {
      throw e;
    }
  };
  const exportData = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            notice: "Fictional Folio demo data. Not a payroll report.",
            role,
            exportedAt: new Date().toISOString(),
            data: Object.fromEntries(
              (Object.keys(titles) as Module[])
                .filter((m) => canAccess(role, m))
                .map((m) => [m, get(m)]),
            ),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "folio-demo-export.json";
    a.click();
    URL.revokeObjectURL(url);
    setToast("Visible demo records exported");
  };
  const openRecord = (m: Module, item: Item) =>
    setEditing({ module: m, item, isNew: false });
  const isModule = page !== "dashboard" && page !== "settings";
  const rows = isModule
    ? get(page)
        .filter(
          (r) =>
            (filter === "All statuses" || r.status === filter) &&
            (department === "All teams" || r.department === department) &&
            Object.values(r)
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Name A–Z" ? a.name.localeCompare(b.name) : 0,
        )
    : [];
  const pages = Math.max(1, Math.ceil(rows.length / 6));
  const current = Math.min(pageNo, pages);
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
      >
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-mark">
            <Leaf size={25} />
          </span>
          folio<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>Acme Studio</strong>
            <small>Your people workspace</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {(
            [
              "dashboard",
              "employees",
              "candidates",
              "interviews",
              "courses",
              "payroll",
              "cases",
              "reviews",
            ] as Page[]
          )
            .filter((p) => p === "dashboard" || canAccess(role, p as Module))
            .map((p) => {
              const Icon = icons[p];
              return (
                <button
                  key={p}
                  className={`nav-item ${page === p ? "active" : ""}`}
                  onClick={() => navigate(p)}
                >
                  <Icon size={19} />
                  <span>
                    {p === "dashboard" ? "Overview" : titles[p as Module]}
                  </span>
                  {p === "candidates" && (
                    <span className="nav-count">
                      {
                        get("candidates").filter(
                          (x) => !["Hired", "Rejected"].includes(x.status),
                        ).length
                      }
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
        <div className="sidebar-bottom">
          <div className="grow-card">
            <span className="grow-icon">
              <Sparkles size={20} />
            </span>
            <strong>People make it possible.</strong>
            <p>A little clarity. A lot of potential.</p>
            <button onClick={() => setInfo("privacy")}>
              Explore your workspace <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={19} />
            Settings & privacy
          </button>
          <button className="nav-item" onClick={() => setInfo("privacy")}>
            <CircleHelp size={19} />
            Help & demo guide
          </button>
          <div className="sidebar-profile">
            <Avatar
              name={
                role === "Employee"
                  ? "Alex Morgan"
                  : role === "Hiring manager"
                    ? "Noah Williams"
                    : "Jamie Taylor"
              }
              small
            />
            <div>
              <strong>
                {role === "Employee"
                  ? "Alex Morgan"
                  : role === "Hiring manager"
                    ? "Noah Williams"
                    : "Jamie Taylor"}
              </strong>
              <small>{role}</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-controls="workspace-navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {page === "dashboard"
                ? "Overview"
                : page === "settings"
                  ? "Settings"
                  : titles[page]}
            </strong>
          </div>
          <div className="top-actions">
            <span className="demo-pill">
              <i />
              Demo workspace
            </span>
            <button
              className="icon-button notifications"
              aria-label="View activity"
              onClick={() => setInfo("activity")}
            >
              <Bell size={19} />
              <i />
            </button>
            <Avatar name="Jamie Taylor" small />
          </div>
        </header>
        <main id="main-content">
          <div className="demo-notice">
            <ShieldCheck size={15} />
            <span>
              Made for exploring. Fictional data, saved only in this browser.
            </span>
            <button onClick={() => setInfo("privacy")}>
              About this demo <ArrowUpRight size={13} />
            </button>
          </div>
          {storageError && (
            <div className="alert">
              Browser storage is unavailable. Changes will last only for this
              session.
            </div>
          )}
          {page === "dashboard" ? (
            <Dashboard
              state={state}
              role={role}
              get={get}
              navigate={navigate}
              create={newItem}
              open={openRecord}
            />
          ) : page === "settings" ? (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">YOUR WORKSPACE, YOUR WAY</p>
                  <h1>Settings & privacy</h1>
                  <p>Understand the demo and explore different perspectives.</p>
                </div>
              </div>
              <div className="settings-grid">
                <section className="card settings-card">
                  <span className="setting-icon">
                    <Users size={24} />
                  </span>
                  <h2>See it from another seat</h2>
                  <p>
                    Preview the workspace as an HR admin, an Engineering hiring
                    manager, or Alex, an employee.
                  </p>
                  <label className="field">
                    Demo role
                    <select
                      aria-label="Demo role"
                      value={role}
                      onChange={(e) => changeRole(e.target.value as Role)}
                    >
                      <option>HR admin</option>
                      <option>Hiring manager</option>
                      <option>Employee</option>
                    </select>
                  </label>
                  <div className="soft-note">
                    Role switching simulates visibility and editing rules in
                    this browser. It is not authentication or a security
                    boundary.
                  </div>
                </section>
                <section className="card settings-card">
                  <span className="setting-icon">
                    <LockKeyhole size={24} />
                  </span>
                  <h2>A safe space to explore</h2>
                  <p>
                    Use fictional information only. Records and the activity log
                    live in localStorage on this browser, without encryption,
                    accounts, or a server database.
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => setInfo("privacy")}
                  >
                    Read the demo guide <ArrowUpRight size={15} />
                  </button>
                  <p className="muted">
                    There are no bank details, government IDs, file uploads, or
                    real payroll transactions.
                  </p>
                </section>
                <section className="card settings-card">
                  <h2>Your demo data</h2>
                  <p>
                    Download the records visible to your selected demo role, or
                    restore the original sample workspace.
                  </p>
                  <div className="button-row">
                    <button className="button secondary" onClick={exportData}>
                      <Download size={16} />
                      Export visible data
                    </button>
                    {role === "HR admin" && (
                      <button
                        className="button danger"
                        onClick={() => setInfo("reset")}
                      >
                        Reset demo
                      </button>
                    )}
                  </div>
                </section>
                <section className="card settings-card">
                  <h2>Before real-world use</h2>
                  <p>
                    Add server-side authentication and authorization, a
                    protected database, encryption, audit retention, backups,
                    and region-specific privacy controls. Connect a qualified
                    payroll provider for taxes, benefits, and payments.
                  </p>
                  <span className="badge amber">Starter application</span>
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">
                    {page === "employees"
                      ? "THE PEOPLE BEHIND THE WORK"
                      : "PEOPLE OPERATIONS"}
                  </p>
                  <h1>{titles[page]}</h1>
                  <p>{descriptions[page]}</p>
                </div>
                <div className="button-row">
                  <button className="button secondary" onClick={exportData}>
                    <Download size={16} />
                    <span>Export</span>
                  </button>
                  {canWrite(role, page) && (
                    <button
                      className="button primary"
                      onClick={() => newItem(page)}
                    >
                      <Plus size={17} />
                      Add {singular[page]}
                    </button>
                  )}
                </div>
              </div>
              {page === "payroll" && (
                <div className="alert">
                  <Wallet size={18} />
                  <div>
                    <strong>Payroll simulation · USD</strong>
                    <p>
                      Illustrative amounts only. Deduction rates are fictional
                      inputs, not tax rules. Approval records a demo status; it
                      never sends money, files taxes, or enrolls benefits.
                    </p>
                  </div>
                </div>
              )}
              {page === "cases" && (
                <div className="soft-note inline">
                  <LockKeyhole size={16} />
                  Restricted to the HR admin demo role. Use fictional issues
                  only; this browser store is not a confidential case system.
                </div>
              )}
              <div className="module-metrics">
                {(page === "payroll"
                  ? [
                      {
                        label: "Illustrative gross",
                        value: money(
                          rows.reduce(
                            (n, r) =>
                              n +
                              payrollTotals(
                                Number(r.base),
                                Number(r.bonus),
                                Number(r.rate),
                              ).gross,
                            0,
                          ),
                        ),
                      },
                      {
                        label: "Illustrative net",
                        value: money(
                          rows.reduce(
                            (n, r) =>
                              n +
                              payrollTotals(
                                Number(r.base),
                                Number(r.bonus),
                                Number(r.rate),
                              ).net,
                            0,
                          ),
                        ),
                      },
                      {
                        label: "Awaiting approval",
                        value: get(page).filter((r) => r.status !== "Approved")
                          .length,
                      },
                    ]
                  : [
                      {
                        label: `${singular[page][0].toUpperCase() + singular[page].slice(1)} records`,
                        value: get(page).length,
                      },
                      {
                        label: "In motion",
                        value: get(page).filter(
                          (r) =>
                            ![
                              "Completed",
                              "Inactive",
                              "Rejected",
                              "Cancelled",
                              "Resolved",
                              "Approved",
                              "Hired",
                            ].includes(r.status),
                        ).length,
                      },
                      {
                        label:
                          page === "courses"
                            ? "Completed plans"
                            : "Departments",
                        value:
                          page === "courses"
                            ? get(page).filter((r) => r.status === "Completed")
                                .length
                            : new Set(get(page).map((r) => r.department)).size,
                      },
                    ]
                ).map((x) => (
                  <div key={x.label}>
                    <span>{x.label}</span>
                    <strong>{x.value}</strong>
                  </div>
                ))}
              </div>
              <section className="card records-card">
                <div className="records-top">
                  <div className="section-title">
                    <h2>
                      {page === "candidates"
                        ? "Candidate workspace"
                        : page === "interviews"
                          ? "Interview schedule"
                          : page === "courses"
                            ? "Learning paths"
                            : page === "reviews"
                              ? "Review cycle"
                              : page === "payroll"
                                ? "Compensation ledger"
                                : page === "cases"
                                  ? "Case workspace"
                                  : "Employee directory"}
                    </h2>
                    <span className="count">{get(page).length}</span>
                  </div>
                  {page === "candidates" && (
                    <div className="segmented">
                      <button
                        className={view === "table" ? "selected" : ""}
                        onClick={() => setView("table")}
                      >
                        List
                      </button>
                      <button
                        className={view === "board" ? "selected" : ""}
                        onClick={() => setView("board")}
                      >
                        Pipeline
                      </button>
                    </div>
                  )}
                </div>
                <div className="table-toolbar">
                  <div className="search-field">
                    <Search size={17} />
                    <input
                      aria-label={`Search ${titles[page]}`}
                      placeholder={`Search ${singular[page]}s…`}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPageNo(1);
                      }}
                    />
                    {query && (
                      <button
                        className="icon-button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <label className="filter-select">
                    <Filter size={14} />
                    <select
                      aria-label="Filter by status"
                      value={filter}
                      onChange={(e) => {
                        setFilter(e.target.value);
                        setPageNo(1);
                      }}
                    >
                      <option>All statuses</option>
                      {stages[page].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <select
                    aria-label="Filter by department"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setPageNo(1);
                    }}
                  >
                    <option>All teams</option>
                    {["Design", "Engineering", "Marketing", "People"].map(
                      (d) => (
                        <option key={d}>{d}</option>
                      ),
                    )}
                  </select>
                  <select
                    aria-label="Sort records"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Recent first</option>
                    <option>Name A–Z</option>
                  </select>
                </div>
                {page === "candidates" && view === "board" ? (
                  <div className="kanban">
                    {stages.candidates.map((s) => (
                      <div className="kanban-column" key={s}>
                        <div className="kanban-head">
                          <Badge status={s} />
                          <span>
                            {rows.filter((r) => r.status === s).length}
                          </span>
                        </div>
                        {rows
                          .filter((r) => r.status === s)
                          .map((r) => (
                            <button
                              className="candidate-card"
                              key={r.id}
                              onClick={() => openRecord("candidates", r)}
                            >
                              <Avatar name={r.name} />
                              <strong>{r.name}</strong>
                              <small>{r.job}</small>
                              <span>
                                {r.department} <ArrowUpRight size={13} />
                              </span>
                            </button>
                          ))}
                        {!rows.some((r) => r.status === s) && (
                          <p className="empty-column">No candidates</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>
                              {page === "interviews"
                                ? "Conversation"
                                : page === "courses"
                                  ? "Learning plan"
                                  : page === "cases"
                                    ? "Case"
                                    : "Name"}
                            </th>
                            <th>
                              {page === "interviews"
                                ? "Candidate"
                                : page === "courses"
                                  ? "Employee"
                                  : page === "reviews"
                                    ? "Cycle & reviewer"
                                    : page === "payroll"
                                      ? "Period & gross"
                                      : "Department / role"}
                            </th>
                            <th>
                              {page === "interviews"
                                ? "When"
                                : page === "courses"
                                  ? "Progress"
                                  : page === "payroll"
                                    ? "Illustrative net"
                                    : page === "reviews"
                                      ? "Rating"
                                      : page === "cases"
                                        ? "Owner / priority"
                                        : "Details"}
                            </th>
                            <th>Status</th>
                            <th>
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows
                            .slice((current - 1) * 6, current * 6)
                            .map((r) => (
                              <tr key={r.id}>
                                <td>
                                  <div className="person-cell">
                                    {![
                                      "interviews",
                                      "courses",
                                      "cases",
                                    ].includes(page) ? (
                                      <Avatar name={r.name} small />
                                    ) : (
                                      <span className="row-icon">
                                        {page === "courses" ? (
                                          <GraduationCap size={18} />
                                        ) : page === "cases" ? (
                                          <HeartHandshake size={18} />
                                        ) : (
                                          <CalendarDays size={18} />
                                        )}
                                      </span>
                                    )}
                                    <div>
                                      <strong>{r.name}</strong>
                                      <small>
                                        {page === "candidates" ||
                                        page === "employees"
                                          ? r.email
                                          : page === "courses"
                                            ? r.category
                                            : page === "cases"
                                              ? r.id.slice(0, 8).toUpperCase()
                                              : r.department}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {page === "interviews" ? (
                                    state.data.candidates.find(
                                      (c) => c.id === r.candidateId,
                                    )?.name
                                  ) : page === "courses" ? (
                                    state.data.employees.find(
                                      (e) => e.id === r.employeeId,
                                    )?.name
                                  ) : page === "reviews" ? (
                                    <>
                                      <strong>{r.cycle}</strong>
                                      <small>{r.reviewer}</small>
                                    </>
                                  ) : page === "payroll" ? (
                                    <>
                                      <strong>{r.period}</strong>
                                      <small>
                                        {money(
                                          payrollTotals(
                                            Number(r.base),
                                            Number(r.bonus),
                                            Number(r.rate),
                                          ).gross,
                                        )}{" "}
                                        gross
                                      </small>
                                    </>
                                  ) : (
                                    <>
                                      <strong>{r.department}</strong>
                                      <small>
                                        {r.job || "Workplace support"}
                                      </small>
                                    </>
                                  )}
                                </td>
                                <td>
                                  {page === "interviews" ? (
                                    <>
                                      <strong>
                                        {dateLabel(String(r.date))} · {r.time}
                                      </strong>
                                      <small>{r.interviewer}</small>
                                    </>
                                  ) : page === "courses" ? (
                                    <div className="progress-cell">
                                      <div>
                                        <span>{r.progress}%</span>
                                        <small>
                                          Due {dateLabel(String(r.due))}
                                        </small>
                                      </div>
                                      <div className="progress-track">
                                        <i
                                          style={{ width: `${r.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : page === "payroll" ? (
                                    <strong>
                                      {money(
                                        payrollTotals(
                                          Number(r.base),
                                          Number(r.bonus),
                                          Number(r.rate),
                                        ).net,
                                      )}
                                    </strong>
                                  ) : page === "reviews" ? (
                                    Number(r.rating) > 0 ? (
                                      <span className="rating">
                                        ★ {r.rating} <small>/ 5</small>
                                      </span>
                                    ) : (
                                      <span className="muted">Unrated</span>
                                    )
                                  ) : page === "cases" ? (
                                    <>
                                      <strong>{r.owner}</strong>
                                      <small>{r.priority} priority</small>
                                    </>
                                  ) : (
                                    <span className="muted">
                                      {page === "candidates"
                                        ? r.source
                                        : r.location}
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <Badge status={r.status} />
                                </td>
                                <td>
                                  <button
                                    className="icon-button row-action"
                                    aria-label={`Open ${r.name}`}
                                    onClick={() => openRecord(page, r)}
                                  >
                                    <ArrowUpRight size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {!rows.length && (
                      <div className="empty-state">
                        <Search size={28} />
                        <h3>No records found</h3>
                        <p>Try a different search or clear your filters.</p>
                        <button
                          className="button secondary"
                          onClick={() => {
                            setQuery("");
                            setFilter("All statuses");
                            setDepartment("All teams");
                          }}
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                    <div className="table-footer">
                      <span>
                        {rows.length
                          ? `${(current - 1) * 6 + 1}–${Math.min(current * 6, rows.length)}`
                          : "0"}{" "}
                        of {rows.length} records
                      </span>
                      <div>
                        <button
                          disabled={current === 1}
                          onClick={() => setPageNo(current - 1)}
                        >
                          Previous
                        </button>
                        <span>
                          {current} / {pages}
                        </span>
                        <button
                          disabled={current === pages}
                          onClick={() => setPageNo(current + 1)}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
              <p className="list-footnote">
                <ShieldCheck size={14} /> {role} demo view ·{" "}
                {canWrite(role, page)
                  ? "Changes are saved to this browser."
                  : "Read-only preview."}
              </p>
            </>
          )}
          <footer className="footer">
            <span>Thoughtfully made for people.</span>
            <span>
              Folio workspace <span className="footer-dot">·</span> Demo edition
            </span>
          </footer>
        </main>
      </div>
      {editing && (
        <RecordEditor
          state={state}
          role={role}
          editing={editing}
          close={() => setEditing(null)}
          save={save}
        />
      )}
      {info && (
        <Modal
          title={
            info === "activity"
              ? "Workspace activity"
              : info === "reset"
                ? "Start fresh?"
                : "A little clarity before you explore"
          }
          close={() => setInfo(null)}
        >
          {info === "activity" ? (
            <div className="modal-body">
              <p className="muted">
                Browser-local demo activity. This is not an immutable audit log.
              </p>
              {role === "HR admin" ? (
                state.audit.map((a) => (
                  <div className="activity-item" key={a.id}>
                    <span className="activity-dot" />
                    <div>
                      <strong>{a.text}</strong>
                      <small>
                        {new Date(a.at).toLocaleString()} · {a.role}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <p>Workspace activity is limited to the HR admin demo role.</p>
              )}
            </div>
          ) : info === "reset" ? (
            <div className="modal-body">
              <p>
                This replaces all demo changes in this browser with the original
                fictional records. You can export visible data from Settings
                first.
              </p>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setInfo(null)}
                >
                  Keep my changes
                </button>
                <button
                  className="button danger"
                  onClick={() => {
                    setState(structuredClone(seed));
                    setInfo(null);
                    setToast("Demo workspace restored");
                  }}
                >
                  Reset demo data
                </button>
              </div>
            </div>
          ) : (
            <div className="modal-body guide">
              <span className="guide-label">
                FUNCTIONAL STARTER · FICTIONAL DATA
              </span>
              <h3>Your people, their next chapter.</h3>
              <p>
                Recruit candidates, schedule and evaluate interviews, track
                learning, explore compensation, manage sample workplace cases,
                and run reviews. Use the arrow on any record to open its form.
              </p>
              <h4>What works</h4>
              <p>
                Create and edit records, search and filter, move candidates
                through stages, turn a hired candidate into an employee, detect
                interview time conflicts, record evaluations, track learning
                progress, and export the data visible to your demo role.
              </p>
              <h4>What is simulated</h4>
              <p>
                Role switching is a UI preview, not secure sign-in. Payroll is
                arithmetic and status tracking only. No emails, invitations,
                calendar sync, course content, tax filings, benefits enrollment,
                or payments are sent.
              </p>
              <h4>Keep real information out</h4>
              <p>
                Records stay in this browser’s localStorage. They are not
                encrypted or shared across devices. Clearing site data removes
                them. Anyone using this browser can switch roles. The activity
                log is editable browser data, not a protected audit trail.
              </p>
              <button className="button primary" onClick={() => setInfo(null)}>
                Let’s explore <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  state,
  role,
  get,
  navigate,
  create,
  open,
}: {
  state: State;
  role: Role;
  get: (m: Module) => Item[];
  navigate: (p: Page) => void;
  create: (m: Module) => void;
  open: (m: Module, i: Item) => void;
}) {
  const employees = get("employees"),
    candidates = get("candidates"),
    interviews = get("interviews").filter((i) => i.status === "Scheduled"),
    courses = get("courses"),
    reviews = get("reviews");
  const active = candidates.filter(
    (c) => !["Rejected", "Hired"].includes(c.status),
  );
  const [chart, setChart] = useState(
    role === "Employee" ? "Review cycle" : "Hiring pipeline",
  );
  const pipeline = stages.candidates
    .filter((s) => s !== "Rejected")
    .map((s) => ({
      name: s,
      value: candidates.filter((c) => c.status === s).length,
    }));
  const bars =
    chart === "Hiring pipeline"
      ? pipeline
      : stages.reviews.map((s) => ({
          name: s,
          value: reviews.filter((r) => r.status === s).length,
        }));
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div>
          <div className="hello">
            <span className="sun">✳</span> MONDAY, NOVEMBER 2, 2026{" "}
            <span className="scenario">DEMO DAY</span>
          </div>
          <h1>
            A good day for great people<span>.</span>
          </h1>
          <p>
            Here’s what’s happening across your{" "}
            {role === "HR admin"
              ? "workspace"
              : role === "Hiring manager"
                ? "Engineering team"
                : "personal workspace"}{" "}
            today.
          </p>
        </div>
        <button
          className="button secondary date-button"
          onClick={() =>
            navigate(canAccess(role, "interviews") ? "interviews" : "courses")
          }
        >
          <CalendarDays size={16} />
          November 2026
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="banner-label">
            <i /> PEOPLE FIRST. ALWAYS.
          </span>
          <h2>
            Room to grow.
            <br />
            Space to do your best work.
          </h2>
          <p>
            Big plans start with the right people. Let’s make
            <br className="desktop-break" /> their next chapter a great one.
          </p>
          <button
            onClick={() =>
              navigate(role === "Employee" ? "courses" : "employees")
            }
          >
            Meet your {role === "Employee" ? "learning paths" : "people"}{" "}
            <span>
              <ArrowUpRight size={17} />
            </span>
          </button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-card art-card-one">
            <span className="art-check">
              <Check size={15} />
            </span>
            <div>
              <strong>Better, together.</strong>
              <small>A place for everyone to thrive</small>
            </div>
          </div>
          <div className="plant">
            <span className="stem" />
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} className={`plant-leaf leaf-${i}`} />
            ))}
            <div className="pot" />
          </div>
          <div className="art-card art-card-two">
            <div className="avatar-stack">
              <Avatar name="Alex Morgan" small />
              <Avatar name="Olivia Chen" small />
              <Avatar name="Noah Williams" small />
            </div>
            <div>
              <strong>{employees.length} people. Endless potential.</strong>
              <small>Your next chapter starts here</small>
            </div>
          </div>
          <span className="art-star">✳</span>
        </div>
      </div>
      <div className="stat-grid">
        {[
          {
            label: role === "Employee" ? "Your profile" : "Total employees",
            value: employees.length,
            icon: Users,
            detail: `${employees.filter((e) => e.status === "Active").length} active in your view`,
            target: "employees",
          },
          {
            label: role === "Employee" ? "Learning paths" : "Active candidates",
            value: role === "Employee" ? courses.length : active.length,
            icon: role === "Employee" ? GraduationCap : BriefcaseBusiness,
            detail:
              role === "Employee"
                ? "Invest in your next chapter"
                : `${candidates.filter((c) => c.status === "Offer").length} at offer stage`,
            target: role === "Employee" ? "courses" : "candidates",
          },
          {
            label:
              role === "Employee"
                ? "Completed learning"
                : "Scheduled interviews",
            value:
              role === "Employee"
                ? courses.filter((c) => c.status === "Completed").length
                : interviews.length,
            icon: role === "Employee" ? CheckCircle2 : CalendarDays,
            detail:
              role === "Employee"
                ? "Keep the momentum going"
                : "Conversations on the calendar",
            target: role === "Employee" ? "courses" : "interviews",
          },
          {
            label: "Reviews in progress",
            value: reviews.filter((r) => r.status !== "Completed").length,
            icon: ChartNoAxesCombined,
            detail: "Q4 2026 review cycle",
            target: "reviews",
          },
        ].map((s, i) => (
          <button
            className="stat-card"
            key={s.label}
            onClick={() => navigate(s.target as Page)}
          >
            <div>
              <span>{s.label}</span>
              <span className={`stat-icon stat-${i}`}>
                <s.icon size={18} />
              </span>
            </div>
            <strong>{s.value.toString().padStart(2, "0")}</strong>
            <p>
              <span className="tiny-dot" />
              {s.detail}
            </p>
          </button>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-heading">
            <div>
              <h2>
                {chart === "Hiring pipeline"
                  ? "A little momentum. A lot of possibility."
                  : "Growth in progress."}
              </h2>
              <p>
                {chart === "Hiring pipeline"
                  ? "A snapshot of your current candidate journey."
                  : "Where the Q4 review cycle stands."}
              </p>
            </div>
            <select
              aria-label="Dashboard chart"
              value={chart}
              onChange={(e) => setChart(e.target.value)}
            >
              {role !== "Employee" && <option>Hiring pipeline</option>}
              <option>Review cycle</option>
            </select>
          </div>
          <div className="chart-summary">
            <strong>
              {(role === "Employee" || chart === "Review cycle"
                ? reviews
                : candidates.filter((c) => c.status !== "Rejected")
              ).length
                .toString()
                .padStart(2, "0")}
            </strong>
            <span>
              {role === "Employee" || chart === "Review cycle"
                ? "reviews this cycle"
                : "candidates in the pipeline"}
              <small>
                <i />
                Live from your demo records
              </small>
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={bars.map((b) => `${b.name}: ${b.value}`).join(", ")}
          >
            <div className="chart-grid">
              <span>{max}</span>
              <span>{Math.round(max / 2)}</span>
              <span>0</span>
            </div>
            <div className="bars">
              {(role === "Employee"
                ? stages.reviews.map((s) => ({
                    name: s,
                    value: reviews.filter((r) => r.status === s).length,
                  }))
                : bars
              ).map((b, i) => (
                <div className="bar-column" key={b.name}>
                  <div className="bar-space">
                    <div
                      className={`bar bar-${i}`}
                      style={{
                        height: `${Math.max((b.value / max) * 100, 3)}%`,
                      }}
                    >
                      <span>{b.value}</span>
                    </div>
                  </div>
                  <span>{b.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="chart-footer">
            <span>
              <span className="legend-square" />
              Current stage counts
            </span>
            <button
              onClick={() =>
                navigate(
                  role === "Employee" || chart === "Review cycle"
                    ? "reviews"
                    : "candidates",
                )
              }
            >
              View{" "}
              {role === "Employee" || chart === "Review cycle"
                ? "reviews"
                : "recruitment"}{" "}
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section className="card interviews-card">
          <div className="card-heading">
            <div>
              <h2>
                {role === "Employee"
                  ? "Your learning journey"
                  : "Coming up next"}
              </h2>
              <p>
                {role === "Employee"
                  ? "Make space for a new skill."
                  : "A conversation could change everything."}
              </p>
            </div>
            <span className="round-icon">
              <CalendarDays size={18} />
            </span>
          </div>
          {role === "Employee"
            ? courses.map((c) => (
                <button
                  className="schedule-row"
                  key={c.id}
                  onClick={() => open("courses", c)}
                >
                  <span className="course-symbol">
                    <GraduationCap size={20} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {c.progress}% complete · {c.category}
                    </small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))
            : interviews.slice(0, 3).map((i) => {
                const c = state.data.candidates.find(
                  (c) => c.id === i.candidateId,
                );
                return (
                  <button
                    className="schedule-row"
                    key={i.id}
                    onClick={() => open("interviews", i)}
                  >
                    <div className="time-block">
                      <strong>{String(i.time).slice(0, 5)}</strong>
                      <small>{dateLabel(String(i.date))}</small>
                    </div>
                    <Avatar name={c?.name || "Candidate"} small />
                    <div>
                      <strong>{c?.name}</strong>
                      <small>{i.name}</small>
                      <span className="schedule-format">
                        <i />
                        {i.format}
                      </span>
                    </div>
                    <ChevronRight size={15} />
                  </button>
                );
              })}
          {role !== "Employee" && !interviews.length && (
            <div className="empty-state">
              <CalendarDays size={24} />
              <p>No interviews scheduled. A fresh start.</p>
            </div>
          )}
          <button
            className="card-link"
            onClick={() =>
              navigate(role === "Employee" ? "courses" : "interviews")
            }
          >
            {role === "Employee"
              ? "Explore all learning"
              : "View interview schedule"}{" "}
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="card people-card">
          <div className="card-heading">
            <div>
              <h2>The people behind the progress</h2>
              <p>A few familiar faces from your team.</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("employees")}
            >
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="people-grid">
            {employees.slice(0, 4).map((e) => (
              <button
                className="team-person"
                key={e.id}
                onClick={() => open("employees", e)}
              >
                <Avatar name={e.name} />
                <strong>{e.name}</strong>
                <small>{e.job}</small>
                <span>{e.department}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="card focus-card">
          <div className="card-heading">
            <div>
              <h2>Make room for growth</h2>
              <p>Small steps. Meaningful progress.</p>
            </div>
            <span className="round-icon">
              <Target size={19} />
            </span>
          </div>
          <div className="learning-overview">
            <div
              className="progress-ring"
              style={
                {
                  "--progress": `${courses.length ? courses.reduce((n, r) => n + Number(r.progress), 0) / courses.length : 0}%`,
                } as React.CSSProperties
              }
            >
              <strong>
                {courses.length
                  ? Math.round(
                      courses.reduce((n, r) => n + Number(r.progress), 0) /
                        courses.length,
                    )
                  : 0}
                <small>%</small>
              </strong>
            </div>
            <div>
              <strong>Keep the curiosity going.</strong>
              <p>
                Average progress across
                <br />
                your visible learning plans.
              </p>
              <button
                className="text-button"
                onClick={() => navigate("courses")}
              >
                Explore learning <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="quick-strip">
        <span className="quick-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <strong>A great workspace starts with a little care.</strong>
          <p>
            {role === "Employee"
              ? "Take a moment to check in on your development."
              : "Keep the important things moving, one thoughtful step at a time."}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            role === "Employee" ? navigate("reviews") : create("candidates")
          }
        >
          {role === "Employee" ? "View my reviews" : "Add a candidate"}{" "}
          <Plus size={15} />
        </button>
      </div>
    </>
  );
}

function RecordEditor({
  state,
  role,
  editing,
  close,
  save,
}: {
  state: State;
  role: Role;
  editing: { module: Module; item: Item; isNew: boolean };
  close: () => void;
  save: (i: Item) => void;
}) {
  const { module: m, isNew } = editing;
  const [item, setItem] = useState({ ...editing.item });
  const [error, setError] = useState("");
  const writable =
    canWrite(role, m) &&
    !(
      m === "payroll" &&
      item.status === "Approved" &&
      editing.item.status === "Approved"
    );
  const update = (k: string, v: string | number) =>
    setItem((i) => ({ ...i, [k]: v }));
  const input = (
    label: string,
    key: string,
    type = "text",
    required = false,
  ) => (
    <label className="field" key={key}>
      {label}
      <input
        type={type}
        value={item[key] ?? ""}
        required={required}
        maxLength={type === "text" ? 160 : undefined}
        min={type === "number" ? 0 : undefined}
        max={
          key === "progress"
            ? 100
            : key === "rating"
              ? 5
              : key === "rate"
                ? 100
                : undefined
        }
        step={type === "number" ? "any" : undefined}
        onChange={(e) =>
          update(key, type === "number" ? e.target.value : e.target.value)
        }
      />
    </label>
  );
  const select = (label: string, key: string, options: string[]) => (
    <label className="field" key={key}>
      {label}
      <select
        aria-label={label}
        value={item[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
      >
        {options.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
    </label>
  );
  const textarea = (label: string, key: string) => (
    <label className="field full" key={key}>
      {label}
      <textarea
        maxLength={2000}
        rows={3}
        value={item[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  const employeeSelect = (
    <label className="field">
      Employee
      <select
        aria-label="Employee"
        required
        value={item.employeeId || ""}
        onChange={(e) => {
          const emp = state.data.employees.find(
            (x) => x.id === e.target.value,
          )!;
          setItem({
            ...item,
            employeeId: emp.id,
            department: emp.department,
            ...(["payroll", "reviews"].includes(m) ? { name: emp.name } : {}),
          });
        }}
      >
        {visibleItems(state, role, "employees").map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </label>
  );
  const totals = payrollTotals(
    Number(item.base || 0),
    Number(item.bonus || 0),
    Number(item.rate || 0),
  );
  return (
    <Modal
      title={`${isNew ? "Add" : writable ? "Edit" : "View"} ${singular[m]}`}
      close={close}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          try {
            save(item);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <div className="modal-body">
          <div className="form-notice">
            <ShieldCheck size={15} /> Fictional data only ·{" "}
            {writable
              ? "Saved to this browser"
              : m === "payroll"
                ? "Approved demo record · locked"
                : "Read-only demo view"}
          </div>
          <fieldset disabled={!writable}>
            <div className="form-grid">
              {["courses", "payroll", "reviews"].includes(m) && employeeSelect}
              {input(
                m === "interviews"
                  ? "Conversation title"
                  : m === "courses"
                    ? "Learning plan title"
                    : m === "cases"
                      ? "Case title"
                      : "Name",
                "name",
                "text",
                true,
              )}
              {!["payroll", "reviews"].includes(m) &&
                select(
                  "Department",
                  "department",
                  role === "Hiring manager"
                    ? ["Engineering"]
                    : ["Design", "Engineering", "Marketing", "People"],
                )}
              {m !== "courses" && select("Status", "status", stages[m])}
              {(m === "employees" || m === "candidates") && (
                <>
                  {input("Job title", "job", "text", true)}
                  {input("Email", "email", "email", true)}
                  {m === "employees"
                    ? input("Location", "location")
                    : select("Source", "source", [
                        "Careers page",
                        "LinkedIn",
                        "Referral",
                        "Other",
                      ])}
                </>
              )}
              {m === "interviews" && (
                <>
                  <label className="field">
                    Candidate
                    <select
                      aria-label="Candidate"
                      required
                      value={item.candidateId}
                      onChange={(e) => {
                        const c = state.data.candidates.find(
                          (c) => c.id === e.target.value,
                        )!;
                        setItem({
                          ...item,
                          candidateId: c.id,
                          department: c.department,
                        });
                      }}
                    >
                      <option value="">Choose a candidate</option>
                      {visibleItems(state, role, "candidates").map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  {input("Date", "date", "date", true)}
                  {input("Time · Asia/Tashkent", "time", "time", true)}
                  {input("Interviewer", "interviewer", "text", true)}
                  {select("Format", "format", [
                    "Video call",
                    "In person",
                    "Phone",
                  ])}
                  {input(
                    "Evaluation rating · 0 = unrated, 1–5",
                    "rating",
                    "number",
                  )}
                  {textarea("Evaluation & feedback", "notes")}
                  <p className="field-help full">
                    Each slot represents a 60-minute interview. No invitations
                    or calendar events are sent.
                  </p>
                </>
              )}
              {m === "courses" && (
                <>
                  {input("Skill / category", "category", "text", true)}
                  {input("Progress · 0–100%", "progress", "number", true)}
                  {input("Target date", "due", "date", true)}
                  {textarea("Development goal", "notes")}
                  <p className="field-help full">
                    Status follows progress automatically. This tracks learning;
                    course content is not included.
                  </p>
                </>
              )}
              {m === "payroll" && (
                <>
                  {input("Period", "period", "month", true)}
                  {input("Base amount · USD", "base", "number", true)}
                  {input("Bonus · USD", "bonus", "number", true)}
                  {input("Illustrative deduction · %", "rate", "number", true)}
                  {textarea("Benefits tracking notes", "benefits")}
                  <div className="payroll-preview full">
                    <div>
                      <span>Gross</span>
                      <strong>{money(totals.gross)}</strong>
                    </div>
                    <div>
                      <span>Demo deduction</span>
                      <strong>{money(totals.deduction)}</strong>
                    </div>
                    <div>
                      <span>Illustrative net</span>
                      <strong>{money(totals.net)}</strong>
                    </div>
                  </div>
                  <p className="field-help full">
                    Simulation only. Approved means reviewed in this demo, never
                    paid. Benefits notes do not enroll anyone.
                  </p>
                </>
              )}
              {m === "cases" && (
                <>
                  {input("Case owner", "owner", "text", true)}
                  {select("Priority", "priority", ["Normal", "High", "Low"])}
                  {textarea("Issue summary · fictional details only", "notes")}
                  {textarea(
                    "Resolution · required when resolved",
                    "resolution",
                  )}
                </>
              )}
              {m === "reviews" && (
                <>
                  {input("Review cycle", "cycle", "text", true)}
                  {input("Reviewer", "reviewer", "text", true)}
                  {input("Rating · 0 = unrated, 1–5", "rating", "number")}
                  {textarea("Development goal", "goal")}
                  {textarea("Review feedback", "notes")}
                </>
              )}
              {m === "candidates" && (
                <>
                  {textarea("Recruiter notes", "notes")}
                  <p className="field-help full">
                    Moving a candidate to Hired also creates an active employee
                    record. Existing hires are never duplicated.
                  </p>
                </>
              )}
            </div>
          </fieldset>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            {writable ? "Cancel" : "Close"}
          </button>
          {writable && (
            <button className="button primary" type="submit">
              <Check size={16} />
              Save {singular[m]}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
