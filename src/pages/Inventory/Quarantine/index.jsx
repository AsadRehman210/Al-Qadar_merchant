import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { tableRows, quarantineStatusFilterOptions } from "global/constant";
import TableState from "components/TableState";
import { useListFilters } from "hooks/useListFilters";
import {
  clearQuarantineLotsList,
  fetchQuarantineLots,
  showQuarantineLots,
  showQuarantineLotsTotal,
  showQuarantineLotsLoading,
} from "store/slices/quarantineLotSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_inventory_quarantine } = alqadar_role_ids;

const STATUS_BADGE = {
  Open: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  Partial: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
  Consumed: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

const QuarantineLots = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearQuarantineLotsList());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("inventory-quarantine", {
    page: 1,
    search: "",
    limitId: tableRows[0].id,
    statusId: "all",
  });
  const { page, search, statusId } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const rows = useSelector(showQuarantineLots);
  const total = useSelector(showQuarantineLotsTotal);
  const loading = useSelector(showQuarantineLotsLoading);

  const statusOptions = quarantineStatusFilterOptions;
  const selStatus = statusOptions.find((s) => s.id === statusId) || statusOptions[0];

  useEffect(() => {
    dispatch(fetchQuarantineLots({
      page,
      limit: selRows.id,
      search: search || undefined,
      status: statusId === "all" ? undefined : statusId,
    }));
  }, [dispatch, page, selRows.id, search, statusId]);

  if (!checkRoleAuth(view_inventory_quarantine)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-6 dark:text-white">
          <h1 className="text-3xl font-bold">{t("product:quarantine_title")}</h1>
          <p className="text-mutedForeground text-sm mt-1">{t("product:quarantine_module_desc")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative max-w-sm flex-1 min-w-[220px]">
            <SearchInput
              placeholder={t("product:quarantine_search")}
              onSearch={(v) => setFilters({ search: v, page: 1 })}
              initialValue={search}
            />
          </div>
          <SelectDropdown
            data={statusOptions}
            selected={selStatus}
            setSelected={(v) => setFilters({ statusId: v.id, page: 1 })}
            hideClear
            classes="!h-10 !rounded-xl !min-w-[160px]"
          />
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-teal-500)]">
                  {[
                    t("product:quarantine_lot"),
                    t("product:quarantine_product"),
                    t("product:quarantine_qty"),
                    t("product:quarantine_remaining"),
                    t("product:warehouse"),
                    t("product:quarantine_source"),
                    t("product:quarantine_reason"),
                    t("product:quarantine_date"),
                    t("product:quarantine_status"),
                    "",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={rows} colSpan={10}>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                      onClick={() => navigate(`/inventory/quarantine/detail/${r.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-teal-600">{r.lotNumber}</td>
                      <td className="px-4 py-3">
                        <div>{r.productName || r.variantName || "—"}</div>
                        {r.sku && <div className="text-xs text-slate-500">{r.sku}</div>}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{r.qty}</td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{r.remainingQty}</td>
                      <td className="px-4 py-3">{r.warehouseName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.sourceRef || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{r.reason || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.createdAt ? String(r.createdAt).slice(0, 10) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[r.status] || ""}`}>
                          {t(`product:quarantine_st_${(r.status || "").toLowerCase()}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/inventory/quarantine/detail/${r.id}`); }}
                          className="text-xs text-teal-600 hover:underline"
                        >
                          {t("view")}
                        </button>
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

export default QuarantineLots;
