import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Popup from "./Popup";
import { SkeletonTable } from "./Skeleton";
import EmptyState from "./EmptyState";
import SelectDropdown from "./SelectDropdown";
import { tableRows } from "global/constant";

/**
 * The one "click an analytic -> see its real, paginated data" popup used
 * across Dashboard/Reports. Controlled by `config` (null = closed):
 *   config = {
 *     title: string,
 *     columns: [{ label, render(row) }],
 *     fetcher: ({ page, limit }) => Promise<{ result: [], total_records: number }>,
 *     onRowClick?: (row) => void,   // e.g. navigate(`/inventory/stock/detail/${row.variantId}`)
 *   }
 * `fetcher` is called directly against the API (not through Redux) since
 * this data is transient/modal-only — same erpGet-shaped response every
 * other paginated list in this app already returns, just not cached in a
 * slice nobody else needs.
 */
const AnalyticsDrilldownModal = ({ config, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const popupRef = useRef();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(tableRows[0]);
  const [rowsData, setRowsData] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | pending | success | error

  const isOpen = !!config;

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      popupRef.current?.openModal?.();
    } else {
      popupRef.current?.closeModal?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setStatus("pending");
    config
      .fetcher({ page, limit: limit.id })
      .then((res) => {
        if (cancelled) return;
        setRowsData(res.result || []);
        setTotal(res.total_records || 0);
        setStatus("success");
      })
      .catch(() => {
        if (!cancelled) {
          setRowsData([]);
          setTotal(0);
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, config, page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit.id));

  const handleRowClick = (row) => {
    if (config?.onRowClick) {
      config.onRowClick(row, navigate);
      onClose?.();
    }
  };

  return (
    <Popup ref={popupRef} title={config?.title || ""} onClose={onClose} className="!max-w-4xl">
      {status === "pending" ? (
        <SkeletonTable rows={limit.id > 10 ? 8 : limit.id} columns={config?.columns?.length || 4} />
      ) : !config || status === "error" || !rowsData.length ? (
        <EmptyState title={t("no_data_found")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-white/10">
                  {config.columns.map((col) => (
                    <th key={col.label} className="px-4 py-3 text-start text-xs font-semibold text-slate-600 dark:text-white/70 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rowsData.map((row, i) => (
                  <tr
                    key={row.id || row.variantId || row.batchId || i}
                    onClick={() => handleRowClick(row)}
                    className={`border-t border-slate-100 dark:border-white/5 ${config.onRowClick ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5" : ""}`}
                  >
                    {config.columns.map((col) => (
                      <td key={col.label} className="px-4 py-3 text-slate-700 dark:text-white/80 whitespace-nowrap">
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center flex-wrap gap-4 mt-5 pt-4 border-t border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <SelectDropdown
                data={tableRows}
                selected={limit}
                setSelected={(v) => { setLimit(v); setPage(1); }}
                hideClear
                classes="!h-9 !rounded-lg !min-w-[80px]"
              />
              <span className="text-xs text-slate-500 dark:text-white/50 whitespace-nowrap">{t("per_page")}</span>
            </div>
            <div className="pagination ltr:ml-auto rtl:mr-auto">
              <ReactPaginate
                breakLabel="..."
                nextLabel={<FaAngleRight />}
                previousLabel={<FaAngleLeft />}
                onPageChange={(e) => setPage(e.selected + 1)}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                pageCount={totalPages}
                forcePage={page - 1}
                renderOnZeroPageCount={null}
                containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </Popup>
  );
};

export default AnalyticsDrilldownModal;
