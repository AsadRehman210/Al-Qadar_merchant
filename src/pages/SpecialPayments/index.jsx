import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd } from "react-icons/io5";
import { FiEye, FiSettings } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Pagination from "components/Pagination";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import Button from "components/Button";
import TableState from "components/TableState";
import { SkeletonCards } from "components/Skeleton";
import { tableRows, specialPaymentStatusFilterOptions } from "global/constant";
import { checkRoleAuth, formatAmount } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { SP_STATUS_BADGE } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchSpecialPayments,
  fetchSpecialPaymentsSummary,
  fetchSpTypes,
  showSpecialPayments,
  showSpecialPaymentsTotal,
  showSpecialPaymentsLoading,
  showSpecialPaymentsSummary,
  showSpTypes,
  showLastUpdated,
} from "store/slices/payrollBatchSlice";

const { view_special_payment, add_special_payment, view_special_payment_type } = alqadar_role_ids;

const SpecialPayments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("hr-special-payments", {
    limitId: tableRows[0].id,
    page: 1,
    filterType: null,
    filterStatus: null,
    search: "",
  });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const { page, filterType, filterStatus, search } = filters;

  const lastUpdated = useSelector(showLastUpdated);
  const payments = useSelector(showSpecialPayments);
  const totalRecords = useSelector(showSpecialPaymentsTotal);
  const loading = useSelector(showSpecialPaymentsLoading);
  const summary = useSelector(showSpecialPaymentsSummary);
  const types = useSelector(showSpTypes);

  useEffect(() => {
    dispatch(fetchSpTypes());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSpecialPayments({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: filterStatus || undefined,
      typeId: filterType || undefined,
    }));
  }, [dispatch, page, selRows, search, filterStatus, filterType, lastUpdated]);

  useEffect(() => {
    dispatch(fetchSpecialPaymentsSummary());
  }, [dispatch, lastUpdated]);

  const list = useMemo(() => payments.map((p) => ({
    ...p,
    employeeCount: p.employees?.length || 0,
    amountPerEmployee: p.employees?.length ? Math.round((p.totalAmount || 0) / p.employees.length) : 0,
    createdAtLabel: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "�",
  })), [payments]);

  const typeOpts = [
    { id: "all", title: t("payroll:all") },
    ...types.map((x) => ({ id: x.id, title: x.name })),
  ];
  const statusOpts = specialPaymentStatusFilterOptions;

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const STAT_CARDS = [
    { label: t("payroll:sp_total_paid"), value: `SAR ${formatAmount(summary.totalPaid)}`, sub: `${summary.paidCount} payments`, color: "from-emerald-500 to-emerald-600" },
    { label: t("payroll:sp_pending_payment"), value: `SAR ${formatAmount(summary.totalPending)}`, sub: `${summary.pendingCount} approved`, color: "from-blue-500 to-blue-600" },
    { label: t("payroll:sp_draft"), value: summary.draftCount, sub: t("payroll:sp_awaiting_submission"), color: "from-slate-500 to-slate-600" },
    { label: t("payroll:sp_total_count"), value: summary.totalCount, sub: t("payroll:sp_all_time"), color: "from-purple-500 to-purple-600" },
  ];

  if (!checkRoleAuth(view_special_payment)) return null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("payroll:special_payments")}</h1>
            <p className="text-mutedForeground mt-1">{t("payroll:special_payments_desc")}</p>
          </div>
          <div className="flex items-center gap-3">
            {checkRoleAuth(view_special_payment_type) && (
              <Button type="button" title={t("payroll:sp_manage_types")} icon={FiSettings} iconClass="h-4 w-4"
                onClick={() => navigate("/special-payments/types")}
                className="!w-auto !rounded-md !h-11 !px-5 !border border-slate-200 dark:!border-white/20 !text-slate-700 dark:!text-white !bg-white dark:!bg-white/10 hover:!bg-slate-50" />
            )}
            {checkRoleAuth(add_special_payment) && (
              <Button type="button" title={t("payroll:create_sp")} icon={IoAdd} iconClass="h-5 w-5 text-white"
                onClick={() => navigate("/special-payments/create")}
                className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700" />
            )}
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="mb-6">
            <SkeletonCards count={4} columns="grid-cols-2 lg:grid-cols-4" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((c) => (
              <div key={c.label} className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} text-white`}>
                <p className="text-xs font-medium opacity-75 mb-0.5">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
                <p className="text-xs opacity-70 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* Payment Type quick-access cards (dynamic) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {types.map((type) => (
            <button key={type.id} type="button"
              onClick={() => setFilters({ filterType: type.id, page: 1 })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${filterType === type.id ? "border-teal-400 bg-teal-50 dark:bg-teal-500/10" : "border-slate-200 dark:border-white/10 hover:border-teal-300 bg-white dark:bg-white/5"}`}>
              <span className="text-2xl">{type.icon || "??"}</span>
              <p className="text-xs font-semibold text-slate-700 dark:text-white leading-tight">{type.name}</p>
            </button>
          ))}
          {/* Manage types shortcut */}
          {checkRoleAuth(view_special_payment_type) && (
            <button type="button" onClick={() => navigate("/special-payments/types")}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-dashed border-teal-300 dark:border-teal-500/40 text-center transition-all cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-500/10">
              <span className="text-2xl">??</span>
              <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 leading-tight">{t("payroll:sp_manage_types")}</p>
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-xl text-slate-900 dark:text-white">{t("payroll:sp_all_payments")}</h2>
            <div className="flex flex-wrap gap-3">
              {filterType && (
                <button type="button" onClick={() => setFilters({ filterType: null, page: 1 })}
                  className="text-xs text-teal-600 underline">{t("payroll:clear_filter")}</button>
              )}
              <div className="w-[170px]">
                <SelectDropdown data={typeOpts} selected={typeOpts.find((x) => x.id === (filterType || "all")) || typeOpts[0]}
                  setSelected={(v) => setFilters({ filterType: v.id === "all" ? null : v.id, page: 1 })} />
              </div>
              <div className="w-[160px]">
                <SelectDropdown data={statusOpts} selected={statusOpts.find((x) => x.id === (filterStatus || "all")) || statusOpts[0]}
                  setSelected={(v) => setFilters({ filterStatus: v.id === "all" ? null : v.id, page: 1 })} />
              </div>
              <div className="w-[200px]">
                <SearchInput
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                  placeholder={t("payroll:search_payments")}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("payroll:sp_title"), t("payroll:sp_type"), t("payroll:sp_target"), t("payroll:sp_employees"), t("payroll:sp_total"), t("payroll:sp_per_employee"), t("payroll:sp_created"), t("payroll:status"), ""].map((h) => (
                    <th key={h} className="px-4 py-4 text-start font-semibold text-white/95 text-sm whitespace-nowrap first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={list} colSpan={9}>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/5 transition-colors">
                    <td className="px-4 py-4 pl-5">
                      <p className="font-semibold text-slate-800 dark:text-white">{p.title}</p>
                      {p.notes && <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.notes}</p>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 whitespace-nowrap">{p.typeName}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/70 capitalize">
                      {p.target === "department" ? `Dept: ${p.departmentName}` : p.target === "individual" ? "Individual" : p.target === "custom" ? "Custom" : "All Employees"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold">{p.employeeCount}</td>
                    <td className="px-4 py-4 font-bold text-slate-900 dark:text-white">SAR {formatAmount(p.totalAmount)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-white/70">SAR {formatAmount(p.amountPerEmployee)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-white/50">{p.createdAtLabel}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${SP_STATUS_BADGE[p.status] || ""}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-4 pr-5">
                      <Link to={`/special-payments/details/${p.id}`} className="text-teal-600 hover:text-teal-700">
                        <FiEye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                </TableState>
              </tbody>
            </table>
          </div>

          <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-teal-500 [&_.pagination_li.selected_a]:!text-white">
            <div className="flex items-center gap-3">
              <SelectDropdown data={tableRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
              <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
            </div>
            <div className="pagination ltr:ml-auto rtl:mr-auto">
              <Pagination breakLabel="..." nextLabel={<FaAngleRight />} previousLabel={<FaAngleLeft />}
                onPageChange={(e) => setFilters({ page: e.selected + 1 })} pageRangeDisplayed={3} marginPagesDisplayed={1}
                pageCount={totalPages} forcePage={page - 1} renderOnZeroPageCount={null}
                containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialPayments;
