import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd } from "react-icons/io5";
import { FiEye } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import TableState from "components/TableState";
import { RUN_STATUS_BADGE } from "global/constant";
import { tableRows, payrollRunStatusFilterOptions } from "global/constant";
import { checkRoleAuth, formatAmount } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchPayrollRuns,
  fetchPayrollRunsSummary,
  showRuns,
  showRunsTotal,
  showRunsLoading,
  showRunsSummary,
  showLastUpdated,
  setCurrentPage,
  setFilterMonth,
  setFilterStatus,
  setSearch,
} from "store/slices/payrollBatchSlice";
import dayjs from "dayjs";

const { add_employee, view_employee } = rafeeqi_role_ids;


const PayrollBatch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const search = useSelector((s) => s.payrollBatch.search);
  const filterStatus = useSelector((s) => s.payrollBatch.filterStatus);
  const filterMonth = useSelector((s) => s.payrollBatch.filterMonth);
  const currentPage = useSelector((s) => s.payrollBatch.currentPage);
  const lastUpdated = useSelector(showLastUpdated);
  const runs = useSelector(showRuns);
  const totalRecords = useSelector(showRunsTotal);
  const loading = useSelector(showRunsLoading);
  const summary = useSelector(showRunsSummary);
  const [filters, setFilters] = useListFilters("hr-payroll-batch", { limitId: tableRows[0].id });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  useEffect(() => {
    dispatch(fetchPayrollRuns({
      page: currentPage,
      limit: selRows.id,
      search: search || undefined,
      status: filterStatus || undefined,
      month: filterMonth || undefined,
    }));
  }, [dispatch, currentPage, selRows, search, filterStatus, filterMonth, lastUpdated]);

  useEffect(() => {
    dispatch(fetchPayrollRunsSummary());
  }, [dispatch, lastUpdated]);

  const list = useMemo(() => runs.map((r) => ({
    ...r,
    monthLabel: r.month ? dayjs(r.month).format("MMMM YYYY") : "—",
    totalEmployees: r.employees?.length || 0,
    createdAtLabel: r.createdAt ? dayjs(r.createdAt).format("YYYY-MM-DD") : "—",
  })), [runs]);

  const statusOpts = payrollRunStatusFilterOptions;

  const monthOpts = [
    { id: "all", title: t("payroll:all_months") },
    ...Array.from({ length: 6 }, (_, i) => {
      const m = dayjs().subtract(i + 1, "month");
      return { id: m.format("YYYY-MM"), title: m.format("MMMM YYYY") };
    }),
  ];

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => { setFilters({ limitId: v.id }); dispatch(setCurrentPage(1)); };

  const STAT_CARDS = [
    { label: t("payroll:total_runs"), value: summary.totalRuns, sub: t("payroll:all_time"), color: "from-slate-500 to-slate-600" },
    { label: t("payroll:pending_approval"), value: summary.pendingApproval, sub: t("payroll:awaiting_cfo"), color: "from-amber-500 to-amber-600" },
    { label: t("payroll:paid_runs"), value: summary.paidRuns, sub: t("payroll:completed"), color: "from-emerald-500 to-emerald-600" },
    { label: t("payroll:total_disbursed"), value: `SAR ${formatAmount(summary.totalNetPaid)}`, sub: t("payroll:net_salary_paid"), color: "from-teal-500 to-teal-600" },
  ];

  if (!checkRoleAuth(view_employee)) return null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("payroll:payroll_batch")}</h1>
            <p className="text-mutedForeground mt-1">{t("payroll:module_desc")}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {checkRoleAuth(add_employee) && (
              <Button
                className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600"
                onClick={() => navigate("/payroll-batch/create")}
                type="button"
                title={t("payroll:new_run")}
                icon={IoAdd}
                iconClass="h-4 w-4 text-white"
              />
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((c) => (
            <div key={c.label} className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} text-white`}>
              <p className="text-xs font-medium opacity-75 mb-1">{c.label}</p>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-slate-900 dark:text-white font-bold text-xl">{t("payroll:all_runs")}</h2>
              <p className="text-slate-500 dark:text-white/70 text-sm mt-0.5">{t("payroll:runs_desc")}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="w-[180px]">
                <SelectDropdown
                  data={monthOpts}
                  selected={monthOpts.find((x) => x.id === (filterMonth || "all")) || monthOpts[0]}
                  setSelected={(v) => { dispatch(setCurrentPage(1)); dispatch(setFilterMonth(v.id === "all" ? null : v.id)); }}
                />
              </div>
              <div className="w-[190px]">
                <SelectDropdown
                  data={statusOpts}
                  selected={statusOpts.find((x) => x.id === (filterStatus || "all")) || statusOpts[0]}
                  setSelected={(v) => { dispatch(setCurrentPage(1)); dispatch(setFilterStatus(v.id === "all" ? null : v.id)); }}
                />
              </div>
              <div className="w-[220px]">
                <SearchInput
                  onSearch={(v) => { dispatch(setCurrentPage(1)); dispatch(setSearch(v)); }}
                  initialValue={search}
                  placeholder={t("payroll:search")}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <div className="min-w-[900px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-teal-500)]">
                    {[t("payroll:run_number"), t("payroll:month"), t("payroll:employees"), t("payroll:gross"), t("payroll:deductions"), t("payroll:net_pay"), t("payroll:employer_cost"), t("payroll:status"), t("payroll:actions")].map((h) => (
                      <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableState loading={loading} data={list} colSpan={9}>
                  {list.map((run) => (
                    <tr key={run.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                      <td className="px-4 py-4 pl-6 font-semibold text-slate-800 dark:text-white">{run.runNumber}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-800 dark:text-white">{run.monthLabel}</p>
                        <p className="text-xs text-slate-500 dark:text-white/60">{run.createdAtLabel}</p>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold">{run.totalEmployees}</td>
                      <td className="px-4 py-4 text-slate-700 dark:text-white/80">SAR {formatAmount(run.totalGross)}</td>
                      <td className="px-4 py-4 text-rose-600">SAR {formatAmount(run.totalDeductions)}</td>
                      <td className="px-4 py-4 font-bold text-emerald-600">SAR {formatAmount(run.totalNet)}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-white/70">SAR {formatAmount(run.totalEmployerCost)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${RUN_STATUS_BADGE[run.status] || ""}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 pr-6">
                        <button
                          type="button"
                          onClick={() => navigate(`/payroll-batch/details/${run.id}`)}
                          className="text-slate-500 hover:text-teal-600 dark:text-white/70"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  </TableState>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!text-white">
            <div className="flex items-center gap-3">
              <SelectDropdown data={tableRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
              <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
            </div>
            <div className="pagination ltr:ml-auto rtl:mr-auto">
              <ReactPaginate
                breakLabel="..." nextLabel={<FaAngleRight />} previousLabel={<FaAngleLeft />}
                onPageChange={(e) => dispatch(setCurrentPage(e.selected + 1))}
                pageRangeDisplayed={3} marginPagesDisplayed={1} pageCount={totalPages}
                forcePage={currentPage - 1} renderOnZeroPageCount={null}
                containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollBatch;
