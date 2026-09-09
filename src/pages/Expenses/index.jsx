import { useEffect, useMemo } from "react";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import { LuReceipt } from "react-icons/lu";
import ExpensesTable from "./ExpensesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import ExpensesFilter from "./ExpensesFilter";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchExpenses,
  showExpenses,
  showExpensesTotal,
  showExpensesLoading,
} from "store/slices/expenseSlice";

const { view_expense, add_expense, approve_expense } = alqadar_role_ids;

const Expenses = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-expenses", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null, filterExpenseType: null, filterPaymentStatus: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const expenses = useSelector(showExpenses);
  const totalRecords = useSelector(showExpensesTotal);
  const loading = useSelector(showExpensesLoading);

  useEffect(() => {
    dispatch(fetchExpenses({
      page: filters.page,
      limit: selRows.id,
      search: filters.search || undefined,
      approvalStatus: filters.filterStatus || undefined,
      expenseType: filters.filterExpenseType || undefined,
      paymentStatus: filters.filterPaymentStatus || undefined,
    }));
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.filterStatus, filters.filterExpenseType, filters.filterPaymentStatus]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  const handlePageChange = (newPage) => setFilters({ page: newPage });
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("expenses:expenses")}
            </h1>
            <p className="text-mutedForeground">
              {t("expenses:expense_module_desc")}
            </p>
          </div>
          <div className="relative z-10 shrink-0 flex flex-wrap gap-2">
            <Button
              className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-purple-500 !to-purple-600 hover:!from-purple-600 hover:!to-purple-700"
              onClick={() => navigate("/expenses/apply")}
              type="button"
              title={t("expenses:claim_expense")}
              icon={LuReceipt}
              iconClass="h-4 w-4 text-white"
            />
            {checkRoleAuth(add_expense) && (
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/expenses/add")}
                type="button"
                title={t("expenses:add_expense")}
                icon={IoAdd}
                btn="primary"
                iconClass="h-4 w-4 text-white"
              />
            )}
          </div>
        </div>
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_expense) && (
            <div className="mb-6">
              <ExpensesFilter filters={filters} setFilters={setFilters} />
            </div>
          )}
          {checkRoleAuth(view_expense) && (
            <ExpensesTable
              data={expenses}
              loading={loading}
              page={filters.page}
              setPage={handlePageChange}
              selRows={selRows}
              setSelRows={handleRowsChange}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Expenses;
