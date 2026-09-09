import { useEffect, useMemo } from "react";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import CustomersTable from "./CustomersTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import CustomersFilter from "./CustomersFilter";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  clearSalesCustomersList,
  fetchSalesCustomers,
  showSalesCustomers,
  showSalesCustomersTotal,
  showSalesCustomersLoading,
} from "store/slices/salesCustomerSlice";

const { view_customer, add_customer } = alqadar_role_ids;

const Customers = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(clearSalesCustomersList());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const customers = useSelector(showSalesCustomers);
  const totalRecords = useSelector(showSalesCustomersTotal);
  const loading = useSelector(showSalesCustomersLoading);
  const [filters, setFilters] = useListFilters("customers-list", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const refreshList = () =>
    dispatch(
      fetchSalesCustomers({
        page: filters.page,
        limit: selRows.id,
        search: filters.search || undefined,
        status: filters.filterStatus || undefined,
      }),
    );

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.search, filters.filterStatus, filters.limitId]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  const handlePageChange = (newPage) => setFilters({ page: newPage });

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("customers:customers")}
            </h1>
            <p className="text-mutedForeground">
              {t("customers:customers_module_desc")}
            </p>
          </div>
          {checkRoleAuth(add_customer) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/customers/add")}
                type="button"
                title={t("customers:add_customer")}
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
          {checkRoleAuth(view_customer) && (
            <div className="mb-6">
              <CustomersFilter filters={filters} setFilters={setFilters} />
            </div>
          )}
          {checkRoleAuth(view_customer) && (
            <CustomersTable
              data={customers}
              loading={loading}
              page={filters.page}
              setPage={handlePageChange}
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

export default Customers;
