import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { FiArrowLeft, FiPlus, FiLogOut, FiEye } from "react-icons/fi";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { tableRows, stockIssueTypeFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import Block from "components/Skeleton";
import {
  clearStockIssuesList,
  fetchStockIssues,
  showStockIssues,
  showStockIssuesTotal,
  showStockIssuesLoading,
} from "store/slices/stockIssueSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { labelOf } from "components/AuditMeta";

const { view_warehouse_issue, add_warehouse_issue } = alqadar_role_ids;

const typeBadge = (t) => {
  if (t === "Damage") return "bg-red-100 text-red-700";
  if (t === "Sample") return "bg-purple-100 text-purple-700";
  if (t === "Internal Use") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-500";
};

const statusBadge = (s) => {
  if (s === "Reversed") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
};

const StockIssue = () => {
  const { t } = useTranslation("warehouse");
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearStockIssuesList());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("warehouse-stock-issue", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    typeId: stockIssueTypeFilterOptions[0].id,
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selType = stockIssueTypeFilterOptions.find((o) => o.id === filters.typeId) || stockIssueTypeFilterOptions[0];
  const setPage = (v) => setFilters({ page: v });

  const issues = useSelector(showStockIssues);
  const totalRecords = useSelector(showStockIssuesTotal);
  const loading = useSelector(showStockIssuesLoading);

  const refresh = () =>
    dispatch(
      fetchStockIssues({
        page,
        limit: selRows.id,
        search: search || undefined,
        issueType: selType?.id || undefined,
      }),
    );

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, selType.id]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handlePageClick = (event) => setPage(event.selected + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={() => navigate("/warehouse")}
            icon={FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight dark:text-white">{t("stock_issues")}</h1>
            <p className="text-slate-500 dark:text-white/50 text-sm mt-1">{t("issues_desc")}</p>
          </div>
        </div>
        {checkRoleAuth(add_warehouse_issue) && (
          <button
            onClick={() => navigate("/warehouse_issues/add")}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
          >
            <FiPlus size={15} />
            {t("new_issue")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] max-w-xs">
          <SearchInput
            placeholder={`${t("search", { ns: "translation" })}...`}
            onSearch={(v) => setFilters({ search: v, page: 1 })}
            initialValue={search}
          />
        </div>
        <div className="w-full sm:w-48">
          <SelectDropdown
            data={stockIssueTypeFilterOptions}
            selected={selType}
            setSelected={(v) => setFilters({ typeId: (v || stockIssueTypeFilterOptions[0]).id, page: 1 })}
            hideClear
            classes="!h-10 !rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                <th className="px-6 py-3">{t("issue_no")}</th>
                <th className="px-4 py-3">{t("date")}</th>
                <th className="px-4 py-3">{t("warehouse")}</th>
                <th className="px-4 py-3">{t("issue_type")}</th>
                <th className="px-4 py-3">{t("status", { ns: "translation", defaultValue: "Status" })}</th>
                <th className="px-4 py-3">{t("issued_to")}</th>
                <th className="px-4 py-3">{t("items")}</th>
                <th className="px-4 py-3">{t("issued_by")}</th>
                <th className="px-4 py-3">{t("created_by", { ns: "translation" })}</th>
                <th className="px-4 py-3">{t("updated_by", { ns: "translation" })}</th>
                <th className="px-4 py-3 text-end">{t("actions", { ns: "translation", defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-50 dark:border-white/5">
                    {Array.from({ length: 11 }).map((__, c) => (
                      <td key={c} className="px-4 py-3">
                        <Block className="h-4 w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    <FiLogOut size={32} className="mx-auto mb-2 opacity-40" />
                    {t("no_issues")}
                  </td>
                </tr>
              ) : (
                issues.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/warehouse_issues/detail/${i.id}`)}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-rose-700 dark:text-rose-300">{i.issueNo}</td>
                    <td className="px-4 py-3 text-slate-500">{i.date?.slice?.(0, 10) || String(i.date || "").slice(0, 10)}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-white/80">{i.warehouseName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge(i.issueType)}`}>
                        {i.issueType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(i.status || "Issued")}`}>
                        {(i.status || "Issued") === "Reversed" ? t("status_reversed") : t("status_issued")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-white/70">{i.issuedTo}</td>
                    <td className="px-4 py-3 text-slate-500">{i.items?.length}</td>
                    <td className="px-4 py-3 text-slate-500">{i.issuedBy || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[140px] truncate" title={labelOf(i, "created") || ""}>
                      {labelOf(i, "created") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[140px] truncate" title={labelOf(i, "updated") || ""}>
                      {labelOf(i, "updated") || "—"}
                    </td>
                    <td className="px-4 py-3 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => navigate(`/warehouse_issues/detail/${i.id}`)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                        title={t("view", { ns: "translation", defaultValue: "View" })}
                      >
                        <FiEye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-4 pt-2 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white">
        <div className="flex items-center gap-4">
          <SelectDropdown
            data={tableRows}
            selected={selRows}
            setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
            hideClear
            classes="!h-10 !rounded-lg"
          />
          <span className="whitespace-nowrap text-sm text-slate-500 dark:text-white/50">
            {t("per_page", { ns: "translation" })}
          </span>
        </div>
        <div className="pagination ltr:ml-auto rtl:mr-auto">
          <Pagination
            breakLabel="..."
            nextLabel={<FaAngleRight />}
            previousLabel={<FaAngleLeft />}
            onPageChange={handlePageClick}
            pageRangeDisplayed={3}
            marginPagesDisplayed={1}
            pageCount={totalPages}
            forcePage={page - 1}
            renderOnZeroPageCount={null}
            containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default StockIssue;
