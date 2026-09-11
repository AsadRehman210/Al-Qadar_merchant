import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { AiOutlineEdit, AiOutlineEye } from "react-icons/ai";
import { FiLock } from "react-icons/fi";
import Pagination from "components/Pagination";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import { tableRows } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { isMerchantExpired } from "./merchantFakeData";
import Table from "components/Table";
import { labelOf } from "components/AuditMeta";

const { view_merchant_management, edit_merchant_management } = alqadar_role_ids;

const MerchantsTable = ({ data, loading, page = 1, setPage, selRows, setSelRows, totalPages }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const list = data || [];

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse text-sm mb-0">
          <thead>
            <tr className="bg-[var(--color-teal-500)] border-none">
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("merchant:code")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("merchant:name")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("merchant:category")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("merchant:linked_admin")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("merchant:status")}</th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                {t("created_by")}
              </th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                {t("updated_by")}
              </th>
              <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("merchant:actions")}</th>
            </tr>
          </thead>
          <tbody>
            <TableState loading={loading} data={list} colSpan={8}>
            {list.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors last:[&_td]:border-b-0">
                <td className="px-4 py-4 align-middle pl-6 font-mono text-xs font-semibold text-slate-500">{row.code}</td>
                <td className="px-4 py-4 align-middle">
                  <div className="font-medium">{row.name}</div>
                  <div className="text-xs text-slate-400">{row.email}</div>
                </td>
                <td className="px-4 py-4 align-middle">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/70">
                    {row.businessCategory || "—"}
                  </span>
                </td>
                <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/70 text-xs">
                  {row.adminId ? (
                    <span className="text-teal-600 dark:text-teal-400 font-medium">{row.adminName || row.adminId}</span>
                  ) : (
                    <span className="text-slate-400 italic">Superadmin</span>
                  )}
                </td>
                <td className="px-4 py-4 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${row.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {row.status}
                    </span>
                    {isMerchantExpired(row) && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-600" title={t("merchant:expired")}>
                        {t("merchant:expired")}
                      </span>
                    )}
                    {row.isLocked && (
                      <span title={t("merchant:locked", { defaultValue: "Locked" })} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
                        <FiLock size={10} />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "created") || ""}>
                  {labelOf(row, "created") || "—"}
                </td>
                <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap max-w-[140px] truncate" title={labelOf(row, "updated") || ""}>
                  {labelOf(row, "updated") || "—"}
                </td>
                    <td className="px-4 py-4 align-middle pr-6">
                  <div className="flex items-center gap-2">
                    {checkRoleAuth(view_merchant_management) && (
                      <button
                        onClick={() => navigate(`/merchant-management/detail/${row.id}`)}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("view")}
                      >
                        <AiOutlineEye className="h-4 w-4" />
                      </button>
                    )}
                    {checkRoleAuth(edit_merchant_management) && (
                      <button
                        onClick={() => navigate(`/merchant-management/edit/${row.id}`)}
                        className="text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("edit")}
                      >
                        <AiOutlineEdit className="h-4 w-4" />
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
      </Table>

      <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
        <div className="flex items-center gap-3">
          <SelectDropdown data={tableRows} selected={selRows} setSelected={setSelRows} hideClear classes="!h-10 !rounded-lg" />
          <span className="text-sm text-slate-600 dark:text-white/70 whitespace-nowrap shrink-0">{t("per_page")}</span>
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
    </>
  );
};

export default MerchantsTable;
