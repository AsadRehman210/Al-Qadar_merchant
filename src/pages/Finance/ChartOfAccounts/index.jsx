import { useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import { AiOutlineEdit } from "react-icons/ai";
import SearchInput from "components/SearchInput";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { fetchChartOfAccounts, showChartOfAccounts, showChartOfAccountsLoading } from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { SkeletonTable } from "components/Skeleton";
import EmptyState from "components/EmptyState";
import { useListFilters } from "hooks/useListFilters";

const { view_customer, add_customer } = rafeeqi_role_ids;

const TYPE_COLORS = {
  Asset:     "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  Liability: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  Equity:    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  Revenue:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  Expense:   "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
};

const SUB_TYPE_LABELS = {
  current_asset:        "Current Asset",
  fixed_asset:          "Fixed Asset",
  current_liability:    "Current Liability",
  long_term_liability:  "Long-Term Liability",
  retained_earnings:    "Retained Earnings",
  other_equity:         "Other Equity",
  operating_revenue:    "Operating Revenue",
  other_revenue:        "Other Revenue",
  cogs:                 "Cost of Goods Sold",
  operating_expense:    "Operating Expense",
  tax_expense:          "Tax Expense",
  vat_payable:          "VAT Payable",
  vat_receivable:       "VAT Receivable",
};

// Flattens accounts into parent-first order with a `depth` for indentation —
// same shape the old fake-data helper produced, now computed over real rows.
const buildTree = (accounts) => {
  const roots = accounts.filter((a) => !a.parentId);
  const childrenOf = (parentId) => accounts.filter((a) => a.parentId === parentId);
  const flatten = (nodes, depth = 0) => {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      result.push(...flatten(childrenOf(node.id), depth + 1));
    }
    return result;
  };
  return flatten(roots);
};

const ChartOfAccounts = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const accounts = useSelector(showChartOfAccounts);
  const loading = useSelector(showChartOfAccountsLoading);
  const [filters, setFilters] = useListFilters("finance-chart-of-accounts", { search: "", filterType: "All" });

  useEffect(() => {
    dispatch(fetchChartOfAccounts());
  }, [dispatch]);

  const typeOpts = ["All", "Asset", "Liability", "Equity", "Revenue", "Expense"];

  const rows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (q || filters.filterType !== "All") {
      return accounts.filter((a) => {
        const matchType = filters.filterType === "All" || a.type === filters.filterType;
        const matchQ = !q || a.code?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q);
        return matchType && matchQ;
      }).map((a) => ({ ...a, depth: 0 }));
    }
    return buildTree(accounts);
  }, [filters.search, filters.filterType, accounts]);

  return (
    <FinancePage
      title={t("finance:coa_title")}
      description={t("finance:coa_desc")}
      action={
        checkRoleAuth(add_customer) ? (
          <Button
            className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700"
            onClick={() => navigate("/finance/coa/add")}
            type="button"
            title={t("finance:add_account")}
            icon={IoAdd}
            btn="primary"
            iconClass="h-4 w-4 text-white"
          />
        ) : null
      }
    >
      {checkRoleAuth(view_customer) && (
        <>
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <SearchInput placeholder={t("finance:search_placeholder")} onSearch={(v) => setFilters({ search: v })} initialValue={filters.search} />
            </div>
            <div className="flex flex-wrap gap-2">
              {typeOpts.map((tp) => (
                <button
                  key={tp}
                  onClick={() => setFilters({ filterType: tp })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filters.filterType === tp ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70 hover:bg-teal-50"}`}
                >
                  {tp}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <SkeletonTable rows={8} columns={6} />
          ) : rows.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
              <table className="w-full border-collapse text-sm mb-0">
                <thead>
                  <tr className="bg-[var(--color-teal-500)] border-none">
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("finance:account_code")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:account_name")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:account_type")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:coa_sub_type")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("finance:coa_parent")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("product:status")}</th>
                    <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md w-[80px]">{t("product:actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const parentAcc = row.parentId ? accounts.find((a) => a.id === row.parentId) : null;
                    return (
                      <tr key={row.id} className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0">
                        <td className="px-4 py-4 align-middle font-mono font-semibold" style={{ paddingLeft: `${24 + (row.depth || 0) * 20}px` }}>
                          {(row.depth || 0) > 0 && <span className="text-slate-400 mr-1">└</span>}
                          <Link to={`/finance/ledger?accountId=${row.id}`} className="hover:text-teal-600" title={t("finance:ledger_title")}>
                            {row.code}
                          </Link>
                        </td>
                        <td className="px-4 py-4 align-middle font-medium">{row.name}</td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[row.type] || ""}`}>{row.type}</span>
                        </td>
                        <td className="px-4 py-4 align-middle text-xs text-slate-500 dark:text-white/60">{SUB_TYPE_LABELS[row.subType] || row.subType || "—"}</td>
                        <td className="px-4 py-4 align-middle text-xs text-slate-500 dark:text-white/60">{parentAcc ? `${parentAcc.code} — ${parentAcc.name}` : "—"}</td>
                        <td className="px-4 py-4 align-middle">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{row.status}</span>
                        </td>
                        <td className="px-4 py-4 align-middle pr-6">
                          {checkRoleAuth(add_customer) && (
                            <Link to={`/finance/coa/edit/${row.id}`} className="text-slate-500 hover:text-teal-600" title={t("edit")}>
                              <AiOutlineEdit className="h-4 w-4" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default ChartOfAccounts;
