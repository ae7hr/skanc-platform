import {
  t,
  localize,
  getLanguage,
  setLanguage,
  locale,
  type Language,
} from "./i18n";
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
  new Intl.NumberFormat(locale(), {
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
    ? new Date(s + "T12:00:00").toLocaleDateString(locale(), {
        month: "short",
        day: "numeric",
      })
    : "—";
function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={`avatar ${small ? "small" : ""} color-${name.length % 5}`}>
      {localize(initials(name))}
    </span>
  );
}
function Badge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${["Active", "Hired", "Completed", "Approved", "Resolved", "Offer"].includes(status) ? "green" : ["Interview", "In progress", "In review", "Reviewed"].includes(status) ? "amber" : ["Rejected", "Cancelled", "Inactive", "High"].includes(status) ? "red" : "neutral"}`}
    >
      <i />
      {localize(status)}
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
      aria-label={t(title)}
      ref={ref}
      className={wide ? "wide" : ""}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="modal-head">
        <div>
          <p className="eyebrow">{localize("FOLIO WORKSPACE")}</p>
          <h2>{localize(title)}</h2>
        </div>
        <button
          className="icon-button"
          onClick={close}
          aria-label={t("Close dialog")}
        >
          <X size={20} />
        </button>
      </div>
      {localize(children)}
    </dialog>
  );
}

export default function App() {
  const [language, changeLanguage] = useState<Language>(getLanguage);
  setLanguage(language);
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
      {localize(
        mobile && (
          <button
            className="nav-scrim"
            aria-label={t("Close navigation")}
            onClick={() => setMobile(false)}
          />
        ),
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
          {localize("folio")}
          <span className="brand-dot">{localize(".")}</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">
            <Building2 size={18} />
          </span>
          <div>
            <strong>{localize("Acme Studio")}</strong>
            <small>{localize("Your people workspace")}</small>
          </div>
          <span className="workspace-dot" />
        </div>
        <p className="nav-label">{localize("WORKSPACE")}</p>
        <nav aria-label={t("Main navigation")}>
          {localize(
            (
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
                      {localize(
                        p === "dashboard" ? "Overview" : titles[p as Module],
                      )}
                    </span>
                    {localize(
                      p === "candidates" && (
                        <span className="nav-count">
                          {localize(
                            get("candidates").filter(
                              (x) => !["Hired", "Rejected"].includes(x.status),
                            ).length,
                          )}
                        </span>
                      ),
                    )}
                  </button>
                );
              }),
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="grow-card">
            <span className="grow-icon">
              <Sparkles size={20} />
            </span>
            <strong>{localize("People make it possible.")}</strong>
            <p>{localize("A little clarity. A lot of potential.")}</p>
            <button onClick={() => setInfo("privacy")}>
              {localize("Explore your workspace")}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings size={19} />
            {localize("Settings & privacy")}
          </button>
          <button className="nav-item" onClick={() => setInfo("privacy")}>
            <CircleHelp size={19} />
            {localize("Help & demo guide")}
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
                {localize(
                  role === "Employee"
                    ? "Alex Morgan"
                    : role === "Hiring manager"
                      ? "Noah Williams"
                      : "Jamie Taylor",
                )}
              </strong>
              <small>{localize(role)}</small>
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
              aria-label={t("Open navigation")}
              aria-controls="workspace-navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>{localize("Workspace")}</span>
            <ChevronRight size={14} />
            <strong>
              {localize(
                page === "dashboard"
                  ? "Overview"
                  : page === "settings"
                    ? "Settings"
                    : titles[page],
              )}
            </strong>
          </div>
          <div className="top-actions">
            <select
              className="language-select"
              aria-label="Language / Язык / Til"
              value={language}
              onChange={(e) => changeLanguage(e.target.value as Language)}
            >
              <option value="en">English</option>
              <option value="uz">O‘zbekcha</option>
              <option value="ru">Русский</option>
            </select>
            <span className="demo-pill">
              <i />
              {localize("Demo workspace")}
            </span>
            <button
              className="icon-button notifications"
              aria-label={t("View activity")}
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
              {localize(
                "Made for exploring. Fictional data, saved only in this browser.",
              )}
            </span>
            <button onClick={() => setInfo("privacy")}>
              {localize("About this demo")}
              <ArrowUpRight size={13} />
            </button>
          </div>
          {localize(
            storageError && (
              <div className="alert">
                {localize(
                  "Browser storage is unavailable. Changes will last only for this session.",
                )}
              </div>
            ),
          )}
          {localize(
            page === "dashboard" ? (
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
                    <p className="eyebrow">
                      {localize("YOUR WORKSPACE, YOUR WAY")}
                    </p>
                    <h1>{localize("Settings & privacy")}</h1>
                    <p>
                      {localize(
                        "Understand the demo and explore different perspectives.",
                      )}
                    </p>
                  </div>
                </div>
                <div className="settings-grid">
                  <section className="card settings-card">
                    <span className="setting-icon">
                      <Users size={24} />
                    </span>
                    <h2>{localize("See it from another seat")}</h2>
                    <p>
                      {localize(
                        "Preview the workspace as an HR admin, an Engineering hiring manager, or Alex, an employee.",
                      )}
                    </p>
                    <label className="field">
                      {localize("Demo role")}
                      <select
                        aria-label={t("Demo role")}
                        value={role}
                        onChange={(e) => changeRole(e.target.value as Role)}
                      >
                        <option value={"HR admin"}>
                          {localize("HR admin")}
                        </option>
                        <option value={"Hiring manager"}>
                          {localize("Hiring manager")}
                        </option>
                        <option value={"Employee"}>
                          {localize("Employee")}
                        </option>
                      </select>
                    </label>
                    <div className="soft-note">
                      {localize(
                        "Role switching simulates visibility and editing rules in this browser. It is not authentication or a security boundary.",
                      )}
                    </div>
                  </section>
                  <section className="card settings-card">
                    <span className="setting-icon">
                      <LockKeyhole size={24} />
                    </span>
                    <h2>{localize("A safe space to explore")}</h2>
                    <p>
                      {localize(
                        "Use fictional information only. Records and the activity log live in localStorage on this browser, without encryption, accounts, or a server database.",
                      )}
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setInfo("privacy")}
                    >
                      {localize("Read the demo guide")}
                      <ArrowUpRight size={15} />
                    </button>
                    <p className="muted">
                      {localize(
                        "There are no bank details, government IDs, file uploads, or real payroll transactions.",
                      )}
                    </p>
                  </section>
                  <section className="card settings-card">
                    <h2>{localize("Your demo data")}</h2>
                    <p>
                      {localize(
                        "Download the records visible to your selected demo role, or restore the original sample workspace.",
                      )}
                    </p>
                    <div className="button-row">
                      <button className="button secondary" onClick={exportData}>
                        <Download size={16} />
                        {localize("Export visible data")}
                      </button>
                      {localize(
                        role === "HR admin" && (
                          <button
                            className="button danger"
                            onClick={() => setInfo("reset")}
                          >
                            {localize("Reset demo")}
                          </button>
                        ),
                      )}
                    </div>
                  </section>
                  <section className="card settings-card">
                    <h2>{localize("Before real-world use")}</h2>
                    <p>
                      {localize(
                        "Add server-side authentication and authorization, a protected database, encryption, audit retention, backups, and region-specific privacy controls. Connect a qualified payroll provider for taxes, benefits, and payments.",
                      )}
                    </p>
                    <span className="badge amber">
                      {localize("Starter application")}
                    </span>
                  </section>
                </div>
              </>
            ) : (
              <>
                <div className="page-heading">
                  <div>
                    <p className="eyebrow">
                      {localize(
                        page === "employees"
                          ? "THE PEOPLE BEHIND THE WORK"
                          : "PEOPLE OPERATIONS",
                      )}
                    </p>
                    <h1>{localize(titles[page])}</h1>
                    <p>{localize(descriptions[page])}</p>
                  </div>
                  <div className="button-row">
                    <button className="button secondary" onClick={exportData}>
                      <Download size={16} />
                      <span>{localize("Export")}</span>
                    </button>
                    {localize(
                      canWrite(role, page) && (
                        <button
                          className="button primary"
                          onClick={() => newItem(page)}
                        >
                          <Plus size={17} />
                          {localize("Add ")}
                          {localize(singular[page])}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {localize(
                  page === "payroll" && (
                    <div className="alert">
                      <Wallet size={18} />
                      <div>
                        <strong>{localize("Payroll simulation · USD")}</strong>
                        <p>
                          {localize(
                            "Illustrative amounts only. Deduction rates are fictional inputs, not tax rules. Approval records a demo status; it never sends money, files taxes, or enrolls benefits.",
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
                {localize(
                  page === "cases" && (
                    <div className="soft-note inline">
                      <LockKeyhole size={16} />
                      {localize(
                        "Restricted to the HR admin demo role. Use fictional issues only; this browser store is not a confidential case system.",
                      )}
                    </div>
                  ),
                )}
                <div className="module-metrics">
                  {localize(
                    (page === "payroll"
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
                            value: get(page).filter(
                              (r) => r.status !== "Approved",
                            ).length,
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
                                ? get(page).filter(
                                    (r) => r.status === "Completed",
                                  ).length
                                : new Set(get(page).map((r) => r.department))
                                    .size,
                          },
                        ]
                    ).map((x) => (
                      <div key={x.label}>
                        <span>{localize(x.label)}</span>
                        <strong>{localize(x.value)}</strong>
                      </div>
                    )),
                  )}
                </div>
                <section className="card records-card">
                  <div className="records-top">
                    <div className="section-title">
                      <h2>
                        {localize(
                          page === "candidates"
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
                                      : "Employee directory",
                        )}
                      </h2>
                      <span className="count">
                        {localize(get(page).length)}
                      </span>
                    </div>
                    {localize(
                      page === "candidates" && (
                        <div className="segmented">
                          <button
                            className={view === "table" ? "selected" : ""}
                            onClick={() => setView("table")}
                          >
                            {localize("List")}
                          </button>
                          <button
                            className={view === "board" ? "selected" : ""}
                            onClick={() => setView("board")}
                          >
                            {localize("Pipeline")}
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                  <div className="table-toolbar">
                    <div className="search-field">
                      <Search size={17} />
                      <input
                        aria-label={t(`Search ${titles[page]}`)}
                        placeholder={t(`Search ${singular[page]}s…`)}
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setPageNo(1);
                        }}
                      />
                      {localize(
                        query && (
                          <button
                            className="icon-button"
                            aria-label={t("Clear search")}
                            onClick={() => setQuery("")}
                          >
                            <X size={14} />
                          </button>
                        ),
                      )}
                    </div>
                    <label className="filter-select">
                      <Filter size={14} />
                      <select
                        aria-label={t("Filter by status")}
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setPageNo(1);
                        }}
                      >
                        <option value={"All statuses"}>
                          {localize("All statuses")}
                        </option>
                        {localize(
                          stages[page].map((s) => (
                            <option key={s} value={s}>
                              {localize(s)}
                            </option>
                          )),
                        )}
                      </select>
                    </label>
                    <select
                      aria-label={t("Filter by department")}
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setPageNo(1);
                      }}
                    >
                      <option value={"All teams"}>
                        {localize("All teams")}
                      </option>
                      {localize(
                        ["Design", "Engineering", "Marketing", "People"].map(
                          (d) => (
                            <option key={d} value={d}>
                              {localize(d)}
                            </option>
                          ),
                        ),
                      )}
                    </select>
                    <select
                      aria-label={t("Sort records")}
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value={"Recent first"}>
                        {localize("Recent first")}
                      </option>
                      <option value={"Name A–Z"}>{localize("Name A–Z")}</option>
                    </select>
                  </div>
                  {localize(
                    page === "candidates" && view === "board" ? (
                      <div className="kanban">
                        {localize(
                          stages.candidates.map((s) => (
                            <div className="kanban-column" key={s}>
                              <div className="kanban-head">
                                <Badge status={s} />
                                <span>
                                  {localize(
                                    rows.filter((r) => r.status === s).length,
                                  )}
                                </span>
                              </div>
                              {localize(
                                rows
                                  .filter((r) => r.status === s)
                                  .map((r) => (
                                    <button
                                      className="candidate-card"
                                      key={r.id}
                                      onClick={() =>
                                        openRecord("candidates", r)
                                      }
                                    >
                                      <Avatar name={r.name} />
                                      <strong>{localize(r.name)}</strong>
                                      <small>{localize(r.job)}</small>
                                      <span>
                                        {localize(r.department)}{" "}
                                        <ArrowUpRight size={13} />
                                      </span>
                                    </button>
                                  )),
                              )}
                              {localize(
                                !rows.some((r) => r.status === s) && (
                                  <p className="empty-column">
                                    {localize("No candidates")}
                                  </p>
                                ),
                              )}
                            </div>
                          )),
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="table-scroll">
                          <table>
                            <thead>
                              <tr>
                                <th>
                                  {localize(
                                    page === "interviews"
                                      ? "Conversation"
                                      : page === "courses"
                                        ? "Learning plan"
                                        : page === "cases"
                                          ? "Case"
                                          : "Name",
                                  )}
                                </th>
                                <th>
                                  {localize(
                                    page === "interviews"
                                      ? "Candidate"
                                      : page === "courses"
                                        ? "Employee"
                                        : page === "reviews"
                                          ? "Cycle & reviewer"
                                          : page === "payroll"
                                            ? "Period & gross"
                                            : "Department / role",
                                  )}
                                </th>
                                <th>
                                  {localize(
                                    page === "interviews"
                                      ? "When"
                                      : page === "courses"
                                        ? "Progress"
                                        : page === "payroll"
                                          ? "Illustrative net"
                                          : page === "reviews"
                                            ? "Rating"
                                            : page === "cases"
                                              ? "Owner / priority"
                                              : "Details",
                                  )}
                                </th>
                                <th>{localize("Status")}</th>
                                <th>
                                  <span className="sr-only">
                                    {localize("Actions")}
                                  </span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {localize(
                                rows
                                  .slice((current - 1) * 6, current * 6)
                                  .map((r) => (
                                    <tr key={r.id}>
                                      <td>
                                        <div className="person-cell">
                                          {localize(
                                            ![
                                              "interviews",
                                              "courses",
                                              "cases",
                                            ].includes(page) ? (
                                              <Avatar name={r.name} small />
                                            ) : (
                                              <span className="row-icon">
                                                {localize(
                                                  page === "courses" ? (
                                                    <GraduationCap size={18} />
                                                  ) : page === "cases" ? (
                                                    <HeartHandshake size={18} />
                                                  ) : (
                                                    <CalendarDays size={18} />
                                                  ),
                                                )}
                                              </span>
                                            ),
                                          )}
                                          <div>
                                            <strong>{localize(r.name)}</strong>
                                            <small>
                                              {localize(
                                                page === "candidates" ||
                                                  page === "employees"
                                                  ? r.email
                                                  : page === "courses"
                                                    ? r.category
                                                    : page === "cases"
                                                      ? r.id
                                                          .slice(0, 8)
                                                          .toUpperCase()
                                                      : r.department,
                                              )}
                                            </small>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        {localize(
                                          page === "interviews" ? (
                                            state.data.candidates.find(
                                              (c) => c.id === r.candidateId,
                                            )?.name
                                          ) : page === "courses" ? (
                                            state.data.employees.find(
                                              (e) => e.id === r.employeeId,
                                            )?.name
                                          ) : page === "reviews" ? (
                                            <>
                                              <strong>
                                                {localize(r.cycle)}
                                              </strong>
                                              <small>
                                                {localize(r.reviewer)}
                                              </small>
                                            </>
                                          ) : page === "payroll" ? (
                                            <>
                                              <strong>
                                                {localize(r.period)}
                                              </strong>
                                              <small>
                                                {localize(
                                                  money(
                                                    payrollTotals(
                                                      Number(r.base),
                                                      Number(r.bonus),
                                                      Number(r.rate),
                                                    ).gross,
                                                  ),
                                                )}
                                                {localize(" ")}
                                                {localize("gross")}
                                              </small>
                                            </>
                                          ) : (
                                            <>
                                              <strong>
                                                {localize(r.department)}
                                              </strong>
                                              <small>
                                                {localize(
                                                  r.job || "Workplace support",
                                                )}
                                              </small>
                                            </>
                                          ),
                                        )}
                                      </td>
                                      <td>
                                        {localize(
                                          page === "interviews" ? (
                                            <>
                                              <strong>
                                                {localize(
                                                  dateLabel(String(r.date)),
                                                )}
                                                {localize(" · ")}
                                                {localize(r.time)}
                                              </strong>
                                              <small>
                                                {localize(r.interviewer)}
                                              </small>
                                            </>
                                          ) : page === "courses" ? (
                                            <div className="progress-cell">
                                              <div>
                                                <span>
                                                  {localize(r.progress)}
                                                  {localize("%")}
                                                </span>
                                                <small>
                                                  {localize("Due ")}
                                                  {localize(
                                                    dateLabel(String(r.due)),
                                                  )}
                                                </small>
                                              </div>
                                              <div className="progress-track">
                                                <i
                                                  style={{
                                                    width: `${r.progress}%`,
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          ) : page === "payroll" ? (
                                            <strong>
                                              {localize(
                                                money(
                                                  payrollTotals(
                                                    Number(r.base),
                                                    Number(r.bonus),
                                                    Number(r.rate),
                                                  ).net,
                                                ),
                                              )}
                                            </strong>
                                          ) : page === "reviews" ? (
                                            Number(r.rating) > 0 ? (
                                              <span className="rating">
                                                {localize("★")}
                                                {localize(r.rating)}{" "}
                                                <small>{localize("/ 5")}</small>
                                              </span>
                                            ) : (
                                              <span className="muted">
                                                {localize("Unrated")}
                                              </span>
                                            )
                                          ) : page === "cases" ? (
                                            <>
                                              <strong>
                                                {localize(r.owner)}
                                              </strong>
                                              <small>
                                                {localize(r.priority)}
                                                {localize(" priority")}
                                              </small>
                                            </>
                                          ) : (
                                            <span className="muted">
                                              {localize(
                                                page === "candidates"
                                                  ? r.source
                                                  : r.location,
                                              )}
                                            </span>
                                          ),
                                        )}
                                      </td>
                                      <td>
                                        <Badge status={r.status} />
                                      </td>
                                      <td>
                                        <button
                                          className="icon-button row-action"
                                          aria-label={t(`Open ${r.name}`)}
                                          onClick={() => openRecord(page, r)}
                                        >
                                          <ArrowUpRight size={18} />
                                        </button>
                                      </td>
                                    </tr>
                                  )),
                              )}
                            </tbody>
                          </table>
                        </div>
                        {localize(
                          !rows.length && (
                            <div className="empty-state">
                              <Search size={28} />
                              <h3>{localize("No records found")}</h3>
                              <p>
                                {localize(
                                  "Try a different search or clear your filters.",
                                )}
                              </p>
                              <button
                                className="button secondary"
                                onClick={() => {
                                  setQuery("");
                                  setFilter("All statuses");
                                  setDepartment("All teams");
                                }}
                              >
                                {localize("Clear filters")}
                              </button>
                            </div>
                          ),
                        )}
                        <div className="table-footer">
                          <span>
                            {localize(
                              rows.length
                                ? `${(current - 1) * 6 + 1}–${Math.min(current * 6, rows.length)}`
                                : "0",
                            )}
                            {localize(" ")}
                            {localize("of ")}
                            {localize(rows.length)}
                            {localize("records")}
                          </span>
                          <div>
                            <button
                              disabled={current === 1}
                              onClick={() => setPageNo(current - 1)}
                            >
                              {localize("Previous")}
                            </button>
                            <span>
                              {localize(current)}
                              {localize(" / ")}
                              {localize(pages)}
                            </span>
                            <button
                              disabled={current === pages}
                              onClick={() => setPageNo(current + 1)}
                            >
                              {localize("Next")}
                            </button>
                          </div>
                        </div>
                      </>
                    ),
                  )}
                </section>
                <p className="list-footnote">
                  <ShieldCheck size={14} /> {localize(role)}
                  {localize(" demo view ·")}
                  {localize(" ")}
                  {localize(
                    canWrite(role, page)
                      ? "Changes are saved to this browser."
                      : "Read-only preview.",
                  )}
                </p>
              </>
            ),
          )}
          <footer className="footer">
            <span>{localize("Thoughtfully made for people.")}</span>
            <span>
              {localize("Folio workspace")}
              <span className="footer-dot">{localize("·")}</span>
              {localize("Demo edition")}
            </span>
          </footer>
        </main>
      </div>
      {localize(
        editing && (
          <RecordEditor
            state={state}
            role={role}
            editing={editing}
            close={() => setEditing(null)}
            save={save}
          />
        ),
      )}
      {localize(
        info && (
          <Modal
            title={
              t(info === "activity"
                ? "Workspace activity"
                : info === "reset"
                  ? "Start fresh?"
                  : "A little clarity before you explore")
            }
            close={() => setInfo(null)}
          >
            {localize(
              info === "activity" ? (
                <div className="modal-body">
                  <p className="muted">
                    {localize(
                      "Browser-local demo activity. This is not an immutable audit log.",
                    )}
                  </p>
                  {localize(
                    role === "HR admin" ? (
                      state.audit.map((a) => (
                        <div className="activity-item" key={a.id}>
                          <span className="activity-dot" />
                          <div>
                            <strong>{localize(a.text)}</strong>
                            <small>
                              {localize(
                                new Date(a.at).toLocaleString(locale()),
                              )}
                              {localize(" · ")}
                              {localize(a.role)}
                            </small>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p>
                        {localize(
                          "Workspace activity is limited to the HR admin demo role.",
                        )}
                      </p>
                    ),
                  )}
                </div>
              ) : info === "reset" ? (
                <div className="modal-body">
                  <p>
                    {localize(
                      "This replaces all demo changes in this browser with the original fictional records. You can export visible data from Settings first.",
                    )}
                  </p>
                  <div className="modal-actions">
                    <button
                      className="button secondary"
                      onClick={() => setInfo(null)}
                    >
                      {localize("Keep my changes")}
                    </button>
                    <button
                      className="button danger"
                      onClick={() => {
                        setState(structuredClone(seed));
                        setInfo(null);
                        setToast("Demo workspace restored");
                      }}
                    >
                      {localize("Reset demo data")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="modal-body guide">
                  <span className="guide-label">
                    {localize("FUNCTIONAL STARTER · FICTIONAL DATA")}
                  </span>
                  <h3>{localize("Your people, their next chapter.")}</h3>
                  <p>
                    {localize(
                      "Recruit candidates, schedule and evaluate interviews, track learning, explore compensation, manage sample workplace cases, and run reviews. Use the arrow on any record to open its form.",
                    )}
                  </p>
                  <h4>{localize("What works")}</h4>
                  <p>
                    {localize(
                      "Create and edit records, search and filter, move candidates through stages, turn a hired candidate into an employee, detect interview time conflicts, record evaluations, track learning progress, and export the data visible to your demo role.",
                    )}
                  </p>
                  <h4>{localize("What is simulated")}</h4>
                  <p>
                    {localize(
                      "Role switching is a UI preview, not secure sign-in. Payroll is arithmetic and status tracking only. No emails, invitations, calendar sync, course content, tax filings, benefits enrollment, or payments are sent.",
                    )}
                  </p>
                  <h4>{localize("Keep real information out")}</h4>
                  <p>
                    {localize(
                      "Records stay in this browser’s localStorage. They are not encrypted or shared across devices. Clearing site data removes them. Anyone using this browser can switch roles. The activity log is editable browser data, not a protected audit trail.",
                    )}
                  </p>
                  <button
                    className="button primary"
                    onClick={() => setInfo(null)}
                  >
                    {localize("Let’s explore")}
                    <ArrowRight size={16} />
                  </button>
                </div>
              ),
            )}
          </Modal>
        ),
      )}
      {localize(
        toast && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            {localize(toast)}
            <button
              aria-label={t("Dismiss notification")}
              onClick={() => setToast("")}
            >
              <X size={14} />
            </button>
          </div>
        ),
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
            <span className="sun">{localize("✳")}</span>
            {localize(" MONDAY, NOVEMBER 2, 2026")}
            {localize(" ")}
            <span className="scenario">{localize("DEMO DAY")}</span>
          </div>
          <h1>
            {localize("A good day for great people")}
            <span>{localize(".")}</span>
          </h1>
          <p>
            {localize("Here’s what’s happening across your ")}
            {localize(" ")}
            {localize(
              role === "HR admin"
                ? "workspace"
                : role === "Hiring manager"
                  ? "Engineering team"
                  : "personal workspace",
            )}
            {localize(" ")}
            {localize("today.")}
          </p>
        </div>
        <button
          className="button secondary date-button"
          onClick={() =>
            navigate(canAccess(role, "interviews") ? "interviews" : "courses")
          }
        >
          <CalendarDays size={16} />
          {localize("November 2026")}
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="welcome-banner">
        <div>
          <span className="banner-label">
            <i />
            {localize("PEOPLE FIRST. ALWAYS.")}
          </span>
          <h2>
            {localize("Room to grow.")}
            <br />
            {localize("Space to do your best work.")}
          </h2>
          <p>
            {localize("Big plans start with the right people. Let’s make")}
            <br className="desktop-break" />
            {localize("their next chapter a great one.")}
          </p>
          <button
            onClick={() =>
              navigate(role === "Employee" ? "courses" : "employees")
            }
          >
            {localize("Meet your ")}
            {localize(role === "Employee" ? "learning paths" : "people")}
            {localize(" ")}
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
              <strong>{localize("Better, together.")}</strong>
              <small>{localize("A place for everyone to thrive")}</small>
            </div>
          </div>
          <div className="plant">
            <span className="stem" />
            {localize(
              Array.from({ length: 6 }, (_, i) => (
                <i key={i} className={`plant-leaf leaf-${i}`} />
              )),
            )}
            <div className="pot" />
          </div>
          <div className="art-card art-card-two">
            <div className="avatar-stack">
              <Avatar name="Alex Morgan" small />
              <Avatar name="Olivia Chen" small />
              <Avatar name="Noah Williams" small />
            </div>
            <div>
              <strong>
                {localize(employees.length)}
                {localize(" people. Endless potential.")}
              </strong>
              <small>{localize("Your next chapter starts here")}</small>
            </div>
          </div>
          <span className="art-star">{localize("✳")}</span>
        </div>
      </div>
      <div className="stat-grid">
        {localize(
          [
            {
              label: role === "Employee" ? "Your profile" : "Total employees",
              value: employees.length,
              icon: Users,
              detail: `${employees.filter((e) => e.status === "Active").length} active in your view`,
              target: "employees",
            },
            {
              label:
                role === "Employee" ? "Learning paths" : "Active candidates",
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
                <span>{localize(s.label)}</span>
                <span className={`stat-icon stat-${i}`}>
                  <s.icon size={18} />
                </span>
              </div>
              <strong>{localize(s.value.toString().padStart(2, "0"))}</strong>
              <p>
                <span className="tiny-dot" />
                {localize(s.detail)}
              </p>
            </button>
          )),
        )}
      </div>
      <div className="dashboard-grid">
        <section className="card chart-card">
          <div className="card-heading">
            <div>
              <h2>
                {localize(
                  chart === "Hiring pipeline"
                    ? "A little momentum. A lot of possibility."
                    : "Growth in progress.",
                )}
              </h2>
              <p>
                {localize(
                  chart === "Hiring pipeline"
                    ? "A snapshot of your current candidate journey."
                    : "Where the Q4 review cycle stands.",
                )}
              </p>
            </div>
            <select
              aria-label={t("Dashboard chart")}
              value={chart}
              onChange={(e) => setChart(e.target.value)}
            >
              {localize(
                role !== "Employee" && (
                  <option value={"Hiring pipeline"}>
                    {localize("Hiring pipeline")}
                  </option>
                ),
              )}
              <option value={"Review cycle"}>{localize("Review cycle")}</option>
            </select>
          </div>
          <div className="chart-summary">
            <strong>
              {localize(
                (role === "Employee" || chart === "Review cycle"
                  ? reviews
                  : candidates.filter((c) => c.status !== "Rejected")
                ).length
                  .toString()
                  .padStart(2, "0"),
              )}
            </strong>
            <span>
              {localize(
                role === "Employee" || chart === "Review cycle"
                  ? "reviews this cycle"
                  : "candidates in the pipeline",
              )}
              <small>
                <i />
                {localize("Live from your demo records")}
              </small>
            </span>
          </div>
          <div
            className="bar-chart"
            role="img"
            aria-label={t(bars.map((b) => `${b.name}: ${b.value}`).join(", "))}
          >
            <div className="chart-grid">
              <span>{localize(max)}</span>
              <span>{localize(Math.round(max / 2))}</span>
              <span>{localize("0")}</span>
            </div>
            <div className="bars">
              {localize(
                (role === "Employee"
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
                        <span>{localize(b.value)}</span>
                      </div>
                    </div>
                    <span>{localize(b.name)}</span>
                  </div>
                )),
              )}
            </div>
          </div>
          <div className="chart-footer">
            <span>
              <span className="legend-square" />
              {localize("Current stage counts")}
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
              {localize("View ")}
              {localize(" ")}
              {localize(
                role === "Employee" || chart === "Review cycle"
                  ? "reviews"
                  : "recruitment",
              )}
              {localize(" ")}
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section className="card interviews-card">
          <div className="card-heading">
            <div>
              <h2>
                {localize(
                  role === "Employee"
                    ? "Your learning journey"
                    : "Coming up next",
                )}
              </h2>
              <p>
                {localize(
                  role === "Employee"
                    ? "Make space for a new skill."
                    : "A conversation could change everything.",
                )}
              </p>
            </div>
            <span className="round-icon">
              <CalendarDays size={18} />
            </span>
          </div>
          {localize(
            role === "Employee"
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
                      <strong>{localize(c.name)}</strong>
                      <small>
                        {localize(c.progress)}
                        {localize("% complete · ")}
                        {localize(c.category)}
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
                        <strong>{localize(String(i.time).slice(0, 5))}</strong>
                        <small>{localize(dateLabel(String(i.date)))}</small>
                      </div>
                      <Avatar name={c?.name || "Candidate"} small />
                      <div>
                        <strong>{localize(c?.name)}</strong>
                        <small>{localize(i.name)}</small>
                        <span className="schedule-format">
                          <i />
                          {localize(i.format)}
                        </span>
                      </div>
                      <ChevronRight size={15} />
                    </button>
                  );
                }),
          )}
          {localize(
            role !== "Employee" && !interviews.length && (
              <div className="empty-state">
                <CalendarDays size={24} />
                <p>{localize("No interviews scheduled. A fresh start.")}</p>
              </div>
            ),
          )}
          <button
            className="card-link"
            onClick={() =>
              navigate(role === "Employee" ? "courses" : "interviews")
            }
          >
            {localize(
              role === "Employee"
                ? "Explore all learning"
                : "View interview schedule",
            )}
            {localize(" ")}
            <ArrowRight size={15} />
          </button>
        </section>
        <section className="card people-card">
          <div className="card-heading">
            <div>
              <h2>{localize("The people behind the progress")}</h2>
              <p>{localize("A few familiar faces from your team.")}</p>
            </div>
            <button
              className="text-button"
              onClick={() => navigate("employees")}
            >
              {localize("View all")}
              <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="people-grid">
            {localize(
              employees.slice(0, 4).map((e) => (
                <button
                  className="team-person"
                  key={e.id}
                  onClick={() => open("employees", e)}
                >
                  <Avatar name={e.name} />
                  <strong>{localize(e.name)}</strong>
                  <small>{localize(e.job)}</small>
                  <span>{localize(e.department)}</span>
                </button>
              )),
            )}
          </div>
        </section>
        <section className="card focus-card">
          <div className="card-heading">
            <div>
              <h2>{localize("Make room for growth")}</h2>
              <p>{localize("Small steps. Meaningful progress.")}</p>
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
                {localize(
                  courses.length
                    ? Math.round(
                        courses.reduce((n, r) => n + Number(r.progress), 0) /
                          courses.length,
                      )
                    : 0,
                )}
                <small>{localize("%")}</small>
              </strong>
            </div>
            <div>
              <strong>{localize("Keep the curiosity going.")}</strong>
              <p>
                {localize("Average progress across")}
                <br />
                {localize("your visible learning plans.")}
              </p>
              <button
                className="text-button"
                onClick={() => navigate("courses")}
              >
                {localize("Explore learning")}
                <ArrowRight size={14} />
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
          <strong>
            {localize("A great workspace starts with a little care.")}
          </strong>
          <p>
            {localize(
              role === "Employee"
                ? "Take a moment to check in on your development."
                : "Keep the important things moving, one thoughtful step at a time.",
            )}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            role === "Employee" ? navigate("reviews") : create("candidates")
          }
        >
          {localize(
            role === "Employee" ? "View my reviews" : "Add a candidate",
          )}
          {localize(" ")}
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
      {localize(label)}
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
      {localize(label)}
      <select
        aria-label={t(label)}
        value={item[key] ?? ""}
        onChange={(e) => update(key, e.target.value)}
      >
        {localize(
          options.map((s) => (
            <option key={s} value={s}>
              {localize(s)}
            </option>
          )),
        )}
      </select>
    </label>
  );
  const textarea = (label: string, key: string) => (
    <label className="field full" key={key}>
      {localize(label)}
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
      {localize("Employee")}
      <select
        aria-label={t("Employee")}
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
        {localize(
          visibleItems(state, role, "employees").map((e) => (
            <option key={e.id} value={e.id}>
              {localize(e.name)}
            </option>
          )),
        )}
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
      title={t(`${isNew ? "Add" : writable ? "Edit" : "View"} ${singular[m]}`)}
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
            <ShieldCheck size={15} />
            {localize(" Fictional data only ·")}
            {localize(" ")}
            {localize(
              writable
                ? "Saved to this browser"
                : m === "payroll"
                  ? "Approved demo record · locked"
                  : "Read-only demo view",
            )}
          </div>
          <fieldset disabled={!writable}>
            <div className="form-grid">
              {localize(
                ["courses", "payroll", "reviews"].includes(m) && employeeSelect,
              )}
              {localize(
                input(
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
                ),
              )}
              {localize(
                !["payroll", "reviews"].includes(m) &&
                  select(
                    "Department",
                    "department",
                    role === "Hiring manager"
                      ? ["Engineering"]
                      : ["Design", "Engineering", "Marketing", "People"],
                  ),
              )}
              {localize(
                m !== "courses" && select("Status", "status", stages[m]),
              )}
              {localize(
                (m === "employees" || m === "candidates") && (
                  <>
                    {localize(input("Job title", "job", "text", true))}
                    {localize(input("Email", "email", "email", true))}
                    {localize(
                      m === "employees"
                        ? input("Location", "location")
                        : select("Source", "source", [
                            "Careers page",
                            "LinkedIn",
                            "Referral",
                            "Other",
                          ]),
                    )}
                  </>
                ),
              )}
              {localize(
                m === "interviews" && (
                  <>
                    <label className="field">
                      {localize("Candidate")}
                      <select
                        aria-label={t("Candidate")}
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
                        <option value="">
                          {localize("Choose a candidate")}
                        </option>
                        {localize(
                          visibleItems(state, role, "candidates").map((c) => (
                            <option key={c.id} value={c.id}>
                              {localize(c.name)}
                            </option>
                          )),
                        )}
                      </select>
                    </label>
                    {localize(input("Date", "date", "date", true))}
                    {localize(
                      input("Time · Asia/Tashkent", "time", "time", true),
                    )}
                    {localize(
                      input("Interviewer", "interviewer", "text", true),
                    )}
                    {localize(
                      select("Format", "format", [
                        "Video call",
                        "In person",
                        "Phone",
                      ]),
                    )}
                    {localize(
                      input(
                        "Evaluation rating · 0 = unrated, 1–5",
                        "rating",
                        "number",
                      ),
                    )}
                    {localize(textarea("Evaluation & feedback", "notes"))}
                    <p className="field-help full">
                      {localize(
                        "Each slot represents a 60-minute interview. No invitations or calendar events are sent.",
                      )}
                    </p>
                  </>
                ),
              )}
              {localize(
                m === "courses" && (
                  <>
                    {localize(
                      input("Skill / category", "category", "text", true),
                    )}
                    {localize(
                      input("Progress · 0–100%", "progress", "number", true),
                    )}
                    {localize(input("Target date", "due", "date", true))}
                    {localize(textarea("Development goal", "notes"))}
                    <p className="field-help full">
                      {localize(
                        "Status follows progress automatically. This tracks learning; course content is not included.",
                      )}
                    </p>
                  </>
                ),
              )}
              {localize(
                m === "payroll" && (
                  <>
                    {localize(input("Period", "period", "month", true))}
                    {localize(
                      input("Base amount · USD", "base", "number", true),
                    )}
                    {localize(input("Bonus · USD", "bonus", "number", true))}
                    {localize(
                      input(
                        "Illustrative deduction · %",
                        "rate",
                        "number",
                        true,
                      ),
                    )}
                    {localize(textarea("Benefits tracking notes", "benefits"))}
                    <div className="payroll-preview full">
                      <div>
                        <span>{localize("Gross")}</span>
                        <strong>{localize(money(totals.gross))}</strong>
                      </div>
                      <div>
                        <span>{localize("Demo deduction")}</span>
                        <strong>{localize(money(totals.deduction))}</strong>
                      </div>
                      <div>
                        <span>{localize("Illustrative net")}</span>
                        <strong>{localize(money(totals.net))}</strong>
                      </div>
                    </div>
                    <p className="field-help full">
                      {localize(
                        "Simulation only. Approved means reviewed in this demo, never paid. Benefits notes do not enroll anyone.",
                      )}
                    </p>
                  </>
                ),
              )}
              {localize(
                m === "cases" && (
                  <>
                    {localize(input("Case owner", "owner", "text", true))}
                    {localize(
                      select("Priority", "priority", ["Normal", "High", "Low"]),
                    )}
                    {localize(
                      textarea(
                        "Issue summary · fictional details only",
                        "notes",
                      ),
                    )}
                    {localize(
                      textarea(
                        "Resolution · required when resolved",
                        "resolution",
                      ),
                    )}
                  </>
                ),
              )}
              {localize(
                m === "reviews" && (
                  <>
                    {localize(input("Review cycle", "cycle", "text", true))}
                    {localize(input("Reviewer", "reviewer", "text", true))}
                    {localize(
                      input("Rating · 0 = unrated, 1–5", "rating", "number"),
                    )}
                    {localize(textarea("Development goal", "goal"))}
                    {localize(textarea("Review feedback", "notes"))}
                  </>
                ),
              )}
              {localize(
                m === "candidates" && (
                  <>
                    {localize(textarea("Recruiter notes", "notes"))}
                    <p className="field-help full">
                      {localize(
                        "Moving a candidate to Hired also creates an active employee record. Existing hires are never duplicated.",
                      )}
                    </p>
                  </>
                ),
              )}
            </div>
          </fieldset>
          {localize(
            error && (
              <p className="form-error" role="alert">
                {localize(error)}
              </p>
            ),
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={close}>
            {localize(writable ? "Cancel" : "Close")}
          </button>
          {localize(
            writable && (
              <button className="button primary" type="submit">
                <Check size={16} />
                {localize("Save ")}
                {localize(singular[m])}
              </button>
            ),
          )}
        </div>
      </form>
    </Modal>
  );
}
