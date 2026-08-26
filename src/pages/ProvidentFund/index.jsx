import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiEye, FiSettings } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import Button from "components/Button";
import TableState from "components/TableState";
import { tableRows } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchPfPolicy,
  fetchAllPfAccounts,
  fetchPfAccountsSummary,
  showPfPolicy,
  showPfAccountsList,
  showPfAccountsTotal,
  showPfAccountsLoading,
  showPfAccountsSummary,
  setCurrentPage,
  setFilterStatus,
  setSearch,
} from "store/slices/providentFundSlice";

const { view_employee, add_employee } = rafeeqi_role_ids;
const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ProvidentFund = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const search = useSelector((s) => s.providentFund.search);
  const filterStatus = useSelector((s) => s.providentFund.filterStatus);
  const currentPage = useSelector((s) => s.providentFund.currentPage);
  const [filters, setFilters] = useListFilters("hr-provident-fund", { limitId: tableRows[0].id });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const policy = useSelector(showPfPolicy);
  const list = useSelector(showPfAccountsList);
  const totalRecords = useSelector(showPfAccountsTotal);
  const loading = useSelector(showPfAccountsLoading);
  const summary = useSelector(showPfAccountsSummary);

  useEffect(() => {
    dispatch(fetchPfPolicy());
    dispatch(fetchPfAccountsSummary());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAllPfAccounts({
      page: currentPage,
      limit: selRows.id,
      search: search || undefined,
      status: filterStatus || undefined,
    }));
  }, [dispatch, currentPage, selRows, search, filterStatus]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  const statusOpts = [
    { id: "all", title: t("pf:all") },
    { id: "Active", title: t("pf:active") },
    { id: "Inactive", title: t("pf:inactive") },
  ];

  const STAT_CARDS = [
    { label: t("pf:total_fund"), value: `SAR ${fmt(summary.totalFund)}`, sub: t("pf:current_balance"), color: "from-teal-500 to-teal-600" },
    { label: t("pf:employee_contributions"), value: `SAR ${fmt(summary.totalEmployeeContrib)}`, sub: policy ? `${policy.employeeRate}% of basic` : "", color: "from-blue-500 to-blue-600" },
    { label: t("pf:employer_contributions"), value: `SAR ${fmt(summary.totalEmployerContrib)}`, sub: policy ? `${policy.employerRate}% of basic` : "", color: "from-purple-500 to-purple-600" },
    { label: t("pf:total_withdrawn"), value: `SAR ${fmt(summary.totalWithdrawn)}`, sub: t("pf:all_time_withdrawals"), color: "from-rose-500 to-rose-600" },
  ];

  const handlePageChange = (newPage) => dispatch(setCurrentPage(newPage));
  const handleRowsChange = (v) => { setFilters({ limitId: v.id }); dispatch(setCurrentPage(1)); };
  const handleStatusChange = (v) => { dispatch(setCurrentPage(1)); dispatch(setFilterStatus(v.id === "all" ? null : v.id)); };
  const handleSearch = (value) => { dispatch(setCurrentPage(1)); dispatch(setSearch(value)); };

  if (!checkRoleAuth(view_employee)) return null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("pf:provident_fund")}</h1>
            <p className="text-mutedForeground mt-1">{t("pf:module_desc")}</p>
          </div>
          {checkRoleAuth(add_employee) && (
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                type="button"
                title={t("pf:pf_policy")}
                icon={FiSettings}
                iconClass="h-4 w-4"
                onClick={() => navigate("/provident-fund/policy")}
                className="!w-auto !rounded-lg !h-10 !px-4 !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {STAT_CARDS.map((c) => (
            <div key={c.label} className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} text-white`}>
              <p className="text-xs font-medium opacity-75 mb-0.5">{c.label}</p>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-xs opacity-70 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-6 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-slate-900 dark:text-white font-bold text-xl">{t("pf:all_employees")}</h2>
              {policy && (
                <p className="text-slate-500 dark:text-white/70 text-sm mt-0.5">
                  {t("pf:policy_rates")}: Employee {policy.employeeRate}% | Employer {policy.employerRate}%
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] max-w-xs">
                <SearchInput onSearch={handleSearch} initialValue={search} placeholder={t("pf:search")} />
              </div>
              <div className="w-full sm:w-40">
                <SelectDropdown
                  data={statusOpts}
                  selected={statusOpts.find((x) => x.id === (filterStatus || "all")) || statusOpts[0]}
                  setSelected={handleStatusChange}
                  classes="!h-10 !rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("pf:employee"), t("pf:pf_account"), t("pf:total_contributions"), t("pf:withdrawn"), t("pf:balance"), t("pf:status"), ""].map((h) => (
                    <th key={h} className="px-3 py-4 text-start font-semibold text-white/95 whitespace-nowrap first:pl-5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={list} colSpan={7}>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                    <td className="px-3 py-4 pl-5">
                      <p className="font-semibold text-slate-800 dark:text-white">{r.employeeName || "—"}</p>
                      <p className="text-xs text-slate-400">{r.employeeCode}</p>
                    </td>
                    <td className="px-3 py-4 text-xs font-mono text-slate-600 dark:text-white/70">
                      {r.pfAccountNo || "-"}
                    </td>
                    <td className="px-3 py-4 text-sm">SAR {fmt((r.totalEmployeeContrib || 0) + (r.totalEmployerContrib || 0))}</td>
                    <td className="px-3 py-4 text-sm text-rose-600">SAR {fmt(r.totalWithdrawn)}</td>
                    <td className="px-3 py-4 text-sm font-bold text-emerald-600">SAR {fmt(r.currentBalance)}</td>
                    <td className="px-3 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 pr-5">
                      <Link to={`/provident-fund/details/${r.employeeId}`} className="text-teal-600 hover:text-teal-700">
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
              <ReactPaginate
                breakLabel="..." nextLabel={<FaAngleRight />} previousLabel={<FaAngleLeft />}
                onPageChange={(e) => handlePageChange(e.selected + 1)}
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

export default ProvidentFund;
