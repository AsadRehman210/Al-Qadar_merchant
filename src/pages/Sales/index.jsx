import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import SalesTable from "./SalesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import SearchInput from "components/SearchInput";
import { DateRangePicker } from "components/DateRangePicker";
import { useListFilters } from "hooks/useListFilters";
import { fetchSaleInvoices, showSaleInvoices, showSaleInvoicesTotal, showSaleInvoicesLoading, clearSaleInvoicesList } from "store/slices/saleInvoiceSlice";

const { view_sales_invoice, add_sales_invoice } = alqadar_role_ids;

const toIsoDate = (d) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10) : undefined);

const Sales = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearSaleInvoicesList());
    };
  }, [dispatch]);
  const navigate = useNavigate();

  const [filters, setFilters] = useListFilters("sales-invoices", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    dateFrom: null,
    dateTo: null,
  });
  const { page, search } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const dateRange = { from: filters.dateFrom ? new Date(filters.dateFrom) : undefined, to: filters.dateTo ? new Date(filters.dateTo) : undefined };

  const invoices = useSelector(showSaleInvoices);
  const totalRecords = useSelector(showSaleInvoicesTotal);
  const loading = useSelector(showSaleInvoicesLoading);

  const refreshList = () =>
    dispatch(
      fetchSaleInvoices({
        page,
        limit: selRows.id,
        search: search || undefined,
        fromDate: toIsoDate(dateRange.from),
        toDate: toIsoDate(dateRange.to),
      }),
    );

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, filters.dateFrom, filters.dateTo]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("sales:sales_invoices")}
            </h1>
            <p className="text-mutedForeground">
              {t("sales:sales_module_desc")}
            </p>
          </div>
          {checkRoleAuth(add_sales_invoice) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-md !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/sales/add")}
                type="button"
                title={t("sales:add_invoice")}
                src=""
                icon={IoAdd}
                btn="primary"
                disabled={false}
                imgClass=""
                loading={false}
                iconClass="h-4 w-4 text-white"
              />
            </div>
          )}
        </div>
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_sales_invoice) && (
            <div className="mb-6 flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-end">
              <div className="flex-1 min-w-[200px] min-h-[44px] max-w-md">
                <SearchInput
                  placeholder={t("sales:search_placeholder")}
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                />
              </div>
              <div className="w-72">
                <DateRangePicker
                  value={dateRange.from || dateRange.to ? dateRange : undefined}
                  onChange={(range) =>
                    setFilters({
                      dateFrom: range?.from ? toIsoDate(range.from) : null,
                      dateTo: range?.to ? toIsoDate(range.to) : null,
                      page: 1,
                    })
                  }
                  numberOfMonths={1}
                />
              </div>
            </div>
          )}
          {checkRoleAuth(view_sales_invoice) && (
            <SalesTable
              data={invoices}
              loading={loading}
              page={page}
              setPage={(p) => setFilters({ page: p })}
              selRows={selRows}
              setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
              totalPages={totalPages}
              onDeleted={refreshList}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;
