import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "react-toastify";
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FiEye } from "react-icons/fi";
import ActionPopup from "components/ActionPopup";
import TableState from "components/TableState";
import Table from "components/Table";
import SelectDropdown from "components/SelectDropdown";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { paymentStatusBadge, tableRows } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { labelOf } from "components/AuditMeta";

const { edit_asset_purchase, delete_asset_purchase } = alqadar_role_ids;

const statusClass = (s) =>
  s === "Posted"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70";

const AssetPurchasesTable = ({
  data,
  loading,
  page = 1,
  setPage,
  selRows,
  setSelRows,
  totalPages = 1,
  onDeleteConfirmed,
}) => {
  const { t } = useTranslation();
  const [rowToDelete, setRowToDelete] = useState(null);
  const popupRef = useRef();
  const list = data || [];
  const fmt = (val) => (parseFloat(val) || 0).toLocaleString();

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[900px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 pl-6 rounded-tl-md">{t("asset:purchase_number")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:supplier")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:date")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:total")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:balance_due")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:payment_status")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95">{t("asset:status")}</th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("created_by")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("updated_by")}
                </th>
                <th className="w-[160px] px-4 py-4 text-start font-semibold text-white/95 pr-6 rounded-tr-md">{t("customers:actions")}</th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={list} colSpan={10}>
                {list.map((row) => {
                  const pay = paymentStatusBadge[row.paymentStatus] || paymentStatusBadge.Pending;
                  return (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10">
                      <td className="px-4 py-4 pl-6 font-mono text-xs">
                        <Link to={`/assets/purchases/detail/${row.id}`} className="text-teal-700 dark:text-teal-400 hover:underline">
                          {row.purchaseNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-4">{row.supplierName || "—"}</td>
                      <td className="px-4 py-4">{row.date ? String(row.date).slice(0, 10) : "—"}</td>
                      <td className="px-4 py-4 tabular-nums">{fmt(row.total)} {row.currency || "SAR"}</td>
                      <td className="px-4 py-4 tabular-nums">{fmt(row.balanceDue)} {row.currency || "SAR"}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${pay}`}>{row.paymentStatus || "Pending"}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusClass(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                        {labelOf(row, "created") || "—"}
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                        {labelOf(row, "updated") || "—"}
                      </td>
                      <td className="px-4 py-4 pr-6">
                        <div className="flex items-center gap-2">
                          <Link to={`/assets/purchases/detail/${row.id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" title={t("view")}>
                            <FiEye className="h-4 w-4" />
                          </Link>
                          {checkRoleAuth(edit_asset_purchase) && row.status !== "Posted" && (
                            <Link to={`/assets/purchases/edit/${row.id}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" title={t("edit")}>
                              <AiOutlineEdit className="h-4 w-4" />
                            </Link>
                          )}
                          {checkRoleAuth(delete_asset_purchase) && row.status !== "Posted" && (
                            <button type="button" onClick={() => { setRowToDelete(row); popupRef.current?.openModal?.(row); }} className="p-2 rounded-lg hover:bg-rose-50 text-rose-600" title={t("delete")}>
                              <AiOutlineDelete className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </TableState>
            </tbody>
          </table>
        </div>
      </Table>
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <SelectDropdown data={tableRows} selected={selRows} setSelected={setSelRows} hideClear classes="!w-24" />
        <Pagination
          breakLabel="..."
          nextLabel={<FaAngleRight />}
          previousLabel={<FaAngleLeft />}
          onPageChange={(e) => setPage?.(e.selected + 1)}
          pageCount={totalPages}
          forcePage={page - 1}
          containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
        />
      </div>
      <ActionPopup
        ref={popupRef}
        title={t("asset:delete_purchase")}
        description={t("asset:confirm_delete_purchase")}
        onClick={async () => {
          try {
            await onDeleteConfirmed?.(rowToDelete);
            toast.success(t("asset:purchase_deleted"));
          } catch (err) {
            toast.error(err?.message || err || "");
          }
          popupRef.current?.closeModal?.();
          setRowToDelete(null);
        }}
      />
    </>
  );
};

export default AssetPurchasesTable;
