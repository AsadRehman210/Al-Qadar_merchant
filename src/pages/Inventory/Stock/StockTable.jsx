import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { FiEye } from "react-icons/fi";
import ReactPaginate from "react-paginate";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import SelectDropdown from "components/SelectDropdown";
import TableState from "components/TableState";
import Table from "components/Table";
import { tableRows } from "global/constant";
import { stockLocation } from "./stockHelpers";

const statusBadgeClass = (status) => {
  switch (status) {
    case "in_stock":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    case "low_stock":
      return "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200";
    case "out_of_stock":
      return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80";
  }
};

const StockTable = ({ data = [], loading, page = 1, setPage, selRows, setSelRows, totalPages }) => {
  const { t } = useTranslation();

  const handlePageClick = (event) => setPage?.(event.selected + 1);

  const statusLabel = (status) => {
    const keys = {
      in_stock: "product:stock_status_in_stock",
      low_stock: "product:stock_status_low_stock",
      out_of_stock: "product:stock_status_out_of_stock",
    };
    return t(keys[status] || keys.in_stock);
  };

  return (
    <>
      <Table className="overflow-hidden">
        <div className="min-w-[980px]">
          <table className="w-full border-collapse text-sm mb-0">
            <thead>
              <tr className="bg-[var(--color-teal-500)] border-none">
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">
                  {t("product:sku_barcode")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:linked_product")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:variant_name")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:product_type")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:stock_location")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:stock_quantity")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:stock_stock_status")}
                </th>
                <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">
                  {t("product:batch_count")}
                </th>
                <th className="w-[88px] px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">
                  {t("product:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              <TableState loading={loading} data={data} colSpan={9}>
                {data.map((row) => (
                  <tr
                    key={row.variantId}
                    className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0"
                  >
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 pl-6 font-semibold whitespace-nowrap">
                      {row.sku}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[180px] truncate">
                      {row.productName}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 max-w-[160px] truncate">
                      {row.variantName}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                      {row.productType === "Raw Material"
                        ? t("product:raw_material")
                        : t("product:finished_product")}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/90 whitespace-nowrap">
                      {stockLocation(row)}
                    </td>
                    <td className="px-4 py-4 align-middle text-slate-700 dark:text-white/90 tabular-nums font-medium">
                      {row.totalQty ?? "—"}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                          row.status
                        )}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle whitespace-nowrap">
                      {row.batchCount > 0 ? (
                        <Link
                          to={`/inventory/stock/detail/${row.variantId}`}
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/80 hover:bg-teal-100 dark:hover:bg-teal-500/20 hover:text-teal-700 dark:hover:text-teal-300"
                        >
                          {t("product:n_batches", { count: row.batchCount })}
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-white/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle pr-6">
                      <Link
                        to={`/inventory/stock/detail/${row.variantId}`}
                        className="inline-flex text-slate-500 dark:text-white/80 transition-all hover:text-teal-600 dark:hover:text-teal-300"
                        title={t("view")}
                      >
                        <FiEye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </TableState>
            </tbody>
          </table>
        </div>
      </Table>

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
          <ReactPaginate
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

export default StockTable;
