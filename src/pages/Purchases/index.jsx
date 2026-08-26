import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import PurchasesTable from "./PurchasesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchPurchaseInvoices,
  deletePurchaseInvoice,
  showPurchaseInvoices,
  showPurchaseInvoicesTotal,
  showPurchaseInvoicesLoading,
} from "store/slices/purchaseInvoiceSlice";
import SearchInput from "components/SearchInput";

const { view_customer, add_customer } = rafeeqi_role_ids;

const Purchases = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("purchases-list", { page: 1, search: "" });
  const { page, search } = filters;
  const [selRows] = useState(tableRows[0]);

  const rows = useSelector(showPurchaseInvoices);
  const total = useSelector(showPurchaseInvoicesTotal);
  const loading = useSelector(showPurchaseInvoicesLoading);

  const refreshList = () =>
    dispatch(fetchPurchaseInvoices({ page, limit: selRows.id, search: search || undefined }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows, search]);

  const onDeleteConfirmed = async (row) => {
    await dispatch(deletePurchaseInvoice(row.id)).unwrap();
    refreshList();
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("purchase:purchases_invoices")}
            </h1>
            <p className="text-mutedForeground">
              {t("purchase:purchases_module_desc")}
            </p>
          </div>
          {checkRoleAuth(add_customer) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/purchases/add")}
                type="button"
                title={t("purchase:add_invoice")}
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
              <div className="flex-1 min-w-[200px] min-h-[44px] max-w-md">
                <SearchInput
                  placeholder={t("purchase:search_placeholder")}
                  onSearch={(v) => setFilters({ search: v, page: 1 })}
                  initialValue={search}
                />
              </div>
            </div>
          )}
          {checkRoleAuth(view_customer) && (
            <PurchasesTable
              data={rows}
              loading={loading}
              page={page}
              setPage={(p) => setFilters({ page: p })}
              totalRecords={total}
              perPage={selRows.id}
              onDeleteConfirmed={onDeleteConfirmed}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchases;
