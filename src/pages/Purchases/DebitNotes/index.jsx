import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiPlus, FiSearch } from "react-icons/fi";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { tableRows } from "global/constant";
import TableState from "components/TableState";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchDebitNotes,
  showDebitNotes,
  showDebitNotesTotal,
  showDebitNotesLoading,
} from "store/slices/debitNoteSlice";

const fmt = (n) => (parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

import { noteStatusBadge as STATUS_BADGE } from "global/constant";

const DebitNotes = () => {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("purchases-debit-notes", { page: 1, search: "", limitId: tableRows[0].id });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const rows = useSelector(showDebitNotes);
  const total = useSelector(showDebitNotesTotal);
  const loading = useSelector(showDebitNotesLoading);

  useEffect(() => {
    dispatch(fetchDebitNotes({ page, limit: selRows.id, search: search || undefined }));
  }, [dispatch, page, selRows.id, search]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{t("purchase:debit_notes")}</h1>
            <p className="text-mutedForeground text-sm mt-1">{t("purchase:debit_notes_desc")}</p>
          </div>
          <Button title={t("purchase:add_debit_note")} icon={FiPlus} btn="primary"
            onClick={() => navigate("/debit-notes/add")}
            className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500" />
        </div>

        <div className="relative mb-5 max-w-sm">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input value={search} onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            placeholder={t("purchase:search_dn")}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-0 focus:border-teal-500" />
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[t("purchase:dn_number"), t("purchase:supplier"), t("purchase:original_invoice"), t("purchase:reason"), t("purchase:date"), t("purchase:total"), t("purchase:status"), ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={rows} colSpan={8}>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => navigate(`/debit-notes/detail/${r.id}`)}>
                    <td className="px-4 py-3 font-mono text-teal-600">{r.dnNumber}</td>
                    <td className="px-4 py-3">{r.supplierName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.originalInvoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{String(r.date).slice(0, 10)}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{r.currency} {fmt(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || ""}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/debit-notes/detail/${r.id}`); }}
                        className="text-xs text-teal-600 hover:underline">{t("view")}</button>
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
    </div>
  );
};

export default DebitNotes;
