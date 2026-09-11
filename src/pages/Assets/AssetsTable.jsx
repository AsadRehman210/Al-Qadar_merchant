import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { AiOutlineEdit } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import ExportButton from "components/ExportButton";
import TableState from "components/TableState";
import { tableRows, assetStatusBadge } from "global/constant";
import { labelOf } from "components/AuditMeta";

// `data` is already the server's one page — pagination itself (page/limit)
// is owned by the parent (AssetRegister), same contract CustomersTable
// follows, so this component only renders what it's given.

const statusKey = (s) => {
  const map = {
    "In use": "asset:st_in_use",
    "In storage": "asset:st_storage",
    Maintenance: "asset:st_maintenance",
    Disposed: "asset:st_disposed",
  };
  return map[s] || "asset:st_in_use";
};

const statusClass = (s) => {
  return assetStatusBadge[s] || assetStatusBadge["In use"];
};

// Assets are never hard-deleted from here — an Asset with a purchase cost
// has a real acquisition journal entry behind it (Dr Fixed Assets / Cr
// Accounts Payable, see asset-service.ts::create), so removing the record
// would leave a dangling, unbalanced Finance entry with no audit trail.
// Ending an asset's life is the formal Disposal flow (AssetDetail's
// Disposal tab), which posts its own reversing journal entry — same
// pattern this codebase already follows for Sale/Purchase Invoices
// (void/cancel, never a bare delete).
const AssetsTable = ({ data, loading, categories = [], page = 1, setPage, selRows, setSelRows, totalPages }) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const categoryNameById = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, `${c.code} — ${c.name}`]));
    return (id) => map.get(id) || "—";
  }, [categories]);

  const paginatedList = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const fmtMoney = (n, cur) =>
    `${(parseFloat(n) || 0).toLocaleString()} ${cur || "SAR"}`;

  const allOnPageSelected = paginatedList.length > 0 && paginatedList.every((r) => selectedIds.has(r.id));
  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginatedList.forEach((r) => next.delete(r.id));
      else paginatedList.forEach((r) => next.add(r.id));
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const selectedAssets = paginatedList.filter((r) => selectedIds.has(r.id));

  return (
    <>
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 p-4 rounded-2xl border border-teal-200 dark:border-teal-500/30 bg-teal-50 dark:bg-teal-500/10">
          <span className="text-sm font-semibold text-teal-800 dark:text-teal-200">
            {t("asset:n_selected", { count: selectedIds.size })}
          </span>
          <ExportButton
            data={selectedAssets}
            filename="selected-assets.xlsx"
            title={t("asset:export_selected")}
            columns={[
              { label: t("asset:asset_tag"), key: "assetTag" },
              { label: t("asset:asset_name"), key: "name" },
              { label: t("asset:category"), value: (r) => categoryNameById(r.categoryId) },
              { label: t("asset:serial_number"), key: "serialNumber" },
              { label: t("asset:location"), key: "location" },
              { label: t("asset:current_value"), value: (r) => fmtMoney(r.currentValue, r.currency) },
              { label: t("asset:status"), key: "status" },
            ]}
          />
          <button type="button" onClick={clearSelection}
            className="ms-auto text-sm font-medium text-teal-700 dark:text-teal-300 hover:underline">
            {t("asset:clear_selection")}
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
        <div className="min-w-[1100px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="w-10 px-4 py-4 text-start border-none pl-6 rounded-tl-2xl">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} className="h-4 w-4 cursor-pointer" />
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:asset_tag")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:asset_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:category")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:serial_number")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap max-w-[200px]">
                  {t("asset:location")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:current_value")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("asset:status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("created_by")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("updated_by")}
                </th>
                <th className="w-[100px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-2xl">
                  {t("product:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={paginatedList} colSpan={11}>
              {paginatedList.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                >
                  <td className="px-4 py-4 align-middle pl-6">
                    <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} className="h-4 w-4 cursor-pointer" />
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 font-semibold whitespace-nowrap">
                    {row.assetTag}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[180px] truncate">
                    {row.name}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                    {row.categoryName || categoryNameById(row.categoryId)}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-500 dark:text-white/70 text-xs font-mono">
                    {row.serialNumber || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-500 dark:text-white/70 text-xs max-w-[200px] truncate">
                    {row.location || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 tabular-nums whitespace-nowrap">
                    {fmtMoney(row.currentValue, row.currency)}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusClass(row.status)}`}
                    >
                      {t(statusKey(row.status))}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                    {labelOf(row, "created") || "—"}
                  </td>
                  <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                    {labelOf(row, "updated") || "—"}
                  </td>
                    <td className="px-4 py-4 align-middle pr-6">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/assets/detail/${row.id}`}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("view")}
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                      {row.status !== "Disposed" && (
                        <Link
                          to={`/assets/edit/${row.id}`}
                          className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                          title={t("edit")}
                        >
                          <AiOutlineEdit className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              </TableState>
            </tbody>
          </table>
        </div>
      </div>

      {paginatedList.length > 0 && (
        <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
          <div className="flex items-center gap-4">
            <SelectDropdown
              data={tableRows}
              selected={selRows}
              setSelected={(newVal) => {
                setSelRows(newVal);
                setPage?.(1);
              }}
              hideClear
              classes="!h-10 !rounded-lg"
            />
            <span className="whitespace-nowrap">{t("per_page")}</span>
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
      )}
    </>
  );
};

export default AssetsTable;
