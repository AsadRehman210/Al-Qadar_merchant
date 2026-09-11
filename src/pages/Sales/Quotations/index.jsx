import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FiPlus, FiEye } from "react-icons/fi";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { HiOutlineDocumentText } from "react-icons/hi2";
import { toast } from "react-toastify";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import ActionPopup from "components/ActionPopup";
import TableState from "components/TableState";
import { useListFilters } from "hooks/useListFilters";
import { tableRows, quotationStatusBadge as STATUS_BADGE, quotationStatusFilterOptions } from "global/constant";
import { fetchQuotations, deleteQuotation, showQuotations, showQuotationsTotal, showQuotationsLoading, clearQuotationsList } from "store/slices/quotationSlice";
import QuotationPreviewModal from "./QuotationPreviewModal";
import { checkRoleAuth, isQuotationExpiringSoon } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { labelOf } from "components/AuditMeta";

const { view_sales_quotation, add_sales_quotation, edit_sales_quotation, delete_sales_quotation } = alqadar_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusOpts = quotationStatusFilterOptions;

const Quotations = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearQuotationsList());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("sales-quotations", { page: 1, search: "", statusId: statusOpts[0].id, limitId: tableRows[0].id });
  const { page, search } = filters;
  const statusFilter = statusOpts.find((o) => o.id === filters.statusId) || statusOpts[0];
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const [previewQuote, setPreviewQuote] = useState(null);
  const [rowToDelete, setRowToDelete] = useState(null);
  const popupRef = useRef();

  const rows = useSelector(showQuotations);
  const total = useSelector(showQuotationsTotal);
  const loading = useSelector(showQuotationsLoading);

  const refreshList = () =>
    dispatch(fetchQuotations({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: statusFilter.id || undefined,
    }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, statusFilter]);

  const onDelete = (row) => { setRowToDelete(row); popupRef.current?.openModal?.(row); };
  const onConfirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      await dispatch(deleteQuotation(rowToDelete.id)).unwrap();
      toast.success(t("sales:delete_quote"));
      refreshList();
    } catch (err) {
      toast.error(err?.message || err || "");
    }
    popupRef.current?.closeModal?.();
    setRowToDelete(null);
  };

  const isExpiring = (d) => isQuotationExpiringSoon(d);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("sales:quotations")}</h1>
            <p className="text-mutedForeground text-sm mt-1">{t("sales:quotations_desc")}</p>
          </div>
          {checkRoleAuth(add_sales_quotation) && (
            <Button title={t("sales:add_quotation")} icon={FiPlus} btn="primary"
              onClick={() => navigate("/quotation/add")}
              className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500" />
          )}
        </div>

        {/* Filters */}
        <div className="mt-6 mb-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
            <div className="flex-1 min-w-[200px] min-h-[44px]">
              <SearchInput
                placeholder={t("sales:search_quotes")}
                onSearch={(v) => setFilters({ search: v, page: 1 })}
                initialValue={search}
              />
            </div>
            <div className="w-full sm:w-[220px]">
              <SelectDropdown
                data={statusOpts}
                selected={statusFilter}
                setSelected={(v) => setFilters({ statusId: v?.id ?? statusOpts[0].id, page: 1 })}
                hideClear
                classes="!h-11"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("sales:quote_number"), t("sales:customer"), t("sales:date"), t("sales:valid_until"), t("sales:warehouse"), t("sales:total"), t("sales:status"), t("created_by"), t("updated_by"), ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={rows} colSpan={10}>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/quotation/detail/${r.id}`)}>
                    <td className="px-4 py-3 font-mono font-medium text-teal-600">
                      {r.quoteNumber}
                      {(Number(r.taxAmount) || 0) > 0 && (
                        <p className={`text-[11px] font-normal mt-1 ${r.taxRecoverable === false ? "text-slate-400 dark:text-white/40" : "text-teal-600 dark:text-teal-400"}`}>
                          {r.taxRecoverable === false
                            ? t("sales:tax_non_recoverable")
                            : t("sales:tax_recoverable_tag")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.customerName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.createdAt ? String(r.createdAt).slice(0, 10) : "—"}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className={isExpiring(r.validUntil) ? "text-amber-600 font-medium" : "text-slate-500"}>{r.validUntil ? String(r.validUntil).slice(0, 10) : "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.warehouseName || "—"}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{r.currency} {fmt(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || ""}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(r, "created") || ""}>
                      {labelOf(r, "created") || "—"}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(r, "updated") || ""}>
                      {labelOf(r, "updated") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {checkRoleAuth(view_sales_quotation) && (
                          <Link
                            to={`/quotation/detail/${r.id}`}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("view")}
                          >
                            <FiEye className="h-4 w-4" />
                          </Link>
                        )}
                        {checkRoleAuth(view_sales_quotation) && (
                          <button
                            type="button"
                            onClick={() => setPreviewQuote(r)}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("sales:preview_quotation")}
                          >
                            <HiOutlineDocumentText className="h-4 w-4" />
                          </button>
                        )}
                        {checkRoleAuth(edit_sales_quotation) && (
                          <Link
                            to={`/quotation/edit/${r.id}`}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                            title={t("edit")}
                          >
                            <AiOutlineEdit className="h-4 w-4" />
                          </Link>
                        )}
                        {checkRoleAuth(delete_sales_quotation) && (
                          <button
                            type="button"
                            onClick={() => onDelete(r)}
                            className="text-slate-500 dark:text-white/80 transition-all hover:text-red-600 dark:hover:text-red-400"
                            title={t("delete")}
                          >
                            <AiOutlineDelete className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                </TableState>
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="flex items-center flex-wrap gap-4 p-4">
              <div className="flex items-center gap-3">
                <SelectDropdown
                  data={tableRows}
                  selected={selRows}
                  setSelected={(v) => setFilters({ limitId: v.id, page: 1 })}
                  hideClear
                  classes="!h-9 !rounded-lg !min-w-[80px]"
                />
                <span className="text-xs text-slate-500 dark:text-white/50 whitespace-nowrap">{t("per_page")}</span>
              </div>
              <div className="flex justify-end gap-2 ml-auto">
                <button type="button" disabled={page === 1} onClick={() => setFilters({ page: page - 1 })}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/20 text-sm disabled:opacity-40">{t("prev")}</button>
                <span className="px-3 py-1 text-sm text-slate-500">{page} / {Math.ceil(total / selRows.id) || 1}</span>
                <button type="button" disabled={page >= Math.ceil(total / selRows.id)} onClick={() => setFilters({ page: page + 1 })}
                  className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/20 text-sm disabled:opacity-40">{t("next")}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ActionPopup
        ref={popupRef}
        title={t("sales:delete_quote")}
        description={t("sales:confirm_delete_quote")}
        confirm={t("yes")}
        cancel={t("cancel")}
        onClick={onConfirmDelete}
      />

      <QuotationPreviewModal
        isOpen={!!previewQuote}
        onClose={() => setPreviewQuote(null)}
        quote={previewQuote}
      />
    </div>
  );
};

export default Quotations;
