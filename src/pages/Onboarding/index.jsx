import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  LuBriefcase,
  LuCalendarDays,
  LuCheck,
  LuCircleCheckBig,
  LuSettings2,
} from "react-icons/lu";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DataState from "components/DataState";
import { cardRows, onboardingTaskCategoryOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import Button from "components/Button";
import { onboardingProgressOf, onboardingCategoryLabel } from "global/helper";
import { ONBOARDING_STATUS } from "global/constant";
import {
  fetchOnboardings,
  fetchOnboardingsSummary,
  showOnboardings,
  showOnboardingsTotal,
  showOnboardingsLoading,
  showOnboardingsSummary,
  toggleOnboardingTask,
} from "store/slices/onboardingSlice";

const FILTERS = [
  { id: "all", labelKey: "hrhub:all" },
  { id: ONBOARDING_STATUS.IN_PROGRESS, labelKey: "hrhub:in_progress" },
  { id: ONBOARDING_STATUS.COMPLETED, labelKey: "hrhub:completed" },
];

const joiningBadge = (t, joiningDate) => {
  const diff = dayjs(joiningDate).startOf("day").diff(dayjs().startOf("day"), "day");
  if (diff === 0) return t("hrhub:joins_today");
  if (diff > 0) return t("hrhub:joins_in_days", { count: diff });
  return t("hrhub:started_days_ago", { count: Math.abs(diff) });
};

const groupTasksByCategory = (tasks) => {
  const groups = {};
  (tasks || []).forEach((task) => {
    if (!groups[task.category]) groups[task.category] = [];
    groups[task.category].push(task);
  });
  return Object.entries(groups);
};

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("talent-onboarding", {
    filter: "all",
    search: "",
    page: 1,
    limitId: cardRows[0].id,
  });
  const { filter, search, page } = filters;
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];

  const list = useSelector(showOnboardings);
  const totalRecords = useSelector(showOnboardingsTotal);
  const loading = useSelector(showOnboardingsLoading);
  const summary = useSelector(showOnboardingsSummary);

  const refreshList = () => dispatch(fetchOnboardings({
    page,
    limit: selRows.id,
    search: search || undefined,
    status: filter === "all" ? undefined : filter,
  }));
  const refreshSummary = () => dispatch(fetchOnboardingsSummary());

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, filter]);

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleToggleTask = async (onboardingId, templateId) => {
    try {
      await dispatch(toggleOnboardingTask({ id: onboardingId, templateId })).unwrap();
      await refreshList();
      refreshSummary();
    } catch (err) {
      toast.error(err || "Failed to update task.");
    }
  };

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });
  const handleFilterChange = (id) => setFilters({ filter: id, page: 1 });

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("hrhub:onb_title")}</h1>
            <p className="text-mutedForeground mt-1">{t("hrhub:onb_desc")}</p>
          </div>
          <Button
            type="button"
            title={t("hrhub:manage_checklist")}
            icon={LuSettings2}
            onClick={() => navigate("/onboarding/templates")}
            className="!w-auto !rounded-md !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-slate-700 dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 text-white">
            <p className="text-sm font-medium opacity-80">{t("hrhub:new_hires")}</p>
            <p className="text-3xl font-bold mt-1">{summary.total}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <p className="text-sm font-medium opacity-80">{t("hrhub:in_progress")}</p>
            <p className="text-3xl font-bold mt-1">{summary.inProgress}</p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white col-span-2 lg:col-span-1">
            <p className="text-sm font-medium opacity-80">{t("hrhub:completed")}</p>
            <p className="text-3xl font-bold mt-1">{summary.completed}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFilterChange(f.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f.id
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-600 dark:text-white/70 hover:bg-slate-200/50 dark:hover:bg-white/10"
                }`}
              >
                {t(f.labelKey)}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] max-w-xs">
            <SearchInput
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
              placeholder={t("hrhub:search_onboarding", "Search by employee")}
            />
          </div>
        </div>

        {/* Cards */}
        <DataState loading={loading} data={list} text={t("hrhub:no_onboarding")}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {list.map((o) => {
              const p = onboardingProgressOf(o);
              const isDone = o.status === ONBOARDING_STATUS.COMPLETED;
              const grouped = groupTasksByCategory(o.tasks);
              return (
                <div
                  key={o.id}
                  className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-6"
                >
                  {/* Candidate header */}
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/employees/details/${o.employeeId}`} className="flex items-center gap-3 min-w-0 group">
                      <div className="h-11 w-11 rounded-xl bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold shrink-0">
                        {(o.employeeName || "—").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-300">
                          {o.employeeName || "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5">
                          <LuBriefcase className="h-3.5 w-3.5" /> {o.position} · {o.department}
                        </p>
                      </div>
                    </Link>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"}`}>
                      {isDone ? t("hrhub:completed") : t("hrhub:in_progress")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/50 flex items-center gap-1.5 mt-2">
                    <LuCalendarDays className="h-3.5 w-3.5" /> {joiningBadge(t, o.joiningDate)}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-white/60">
                        {t("hrhub:required_progress", { done: p.requiredDone, total: p.requiredTotal })}
                        {p.optionalTotal > 0 && (
                          <span className="text-slate-400 dark:text-white/40">
                            {" · "}
                            {t("hrhub:optional_progress", { done: p.optionalDone, total: p.optionalTotal })}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-white/80">{p.pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isDone ? "bg-emerald-500" : "bg-teal-500"}`} style={{ width: `${p.pct}%` }} />
                    </div>
                  </div>

                  {/* Tasks grouped by category */}
                  <div className="mt-4 space-y-3">
                    {grouped.map(([catId, tasks]) => (
                      <div key={catId}>
                        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-mutedForeground dark:text-white/40 mb-1">
                          {onboardingCategoryLabel(catId, onboardingTaskCategoryOptions)}
                        </h4>
                        <div className="space-y-1">
                          {tasks.map((task) => (
                            <button
                              key={task.templateId}
                              type="button"
                              onClick={() => handleToggleTask(o.id, task.templateId)}
                              className="w-full flex items-center gap-3 text-start p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5"
                            >
                              <span className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border ${task.done ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300 dark:border-white/30"}`}>
                                {task.done && <LuCheck className="h-3.5 w-3.5" />}
                              </span>
                              <span className={`text-sm flex-1 ${task.done ? "line-through text-slate-400 dark:text-white/40" : "text-slate-700 dark:text-white/80"}`}>
                                {task.label}
                              </span>
                              {!task.required && (
                                <span className="text-[10px] shrink-0 text-slate-400 dark:text-white/30">
                                  {t("hrhub:optional")}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex gap-2">
                    <Button
                      type="button"
                      title={t("hrhub:complete_profile")}
                      icon={LuCircleCheckBig}
                      onClick={() => navigate(`/employees/edit/${o.employeeId}`)}
                      className="!flex-1 !rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 !text-white"
                    />
                    <Button
                      type="button"
                      title={t("hrhub:view_profile")}
                      onClick={() => navigate(`/employees/details/${o.employeeId}`)}
                      className="!flex-1 !rounded-md !bg-slate-100 dark:!bg-white/10 !text-slate-700 dark:!text-white !border-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DataState>

        {list.length > 0 && (
          <div className="flex items-center flex-wrap gap-4 pt-6">
            <div className="flex items-center gap-3">
              <SelectDropdown data={cardRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
              <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
            </div>
            <div className="pagination ltr:ml-auto rtl:mr-auto">
              <ReactPaginate
                breakLabel="..."
                nextLabel={<FaAngleRight />}
                previousLabel={<FaAngleLeft />}
                onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                pageCount={totalPages}
                forcePage={page - 1}
                renderOnZeroPageCount={null}
                containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
