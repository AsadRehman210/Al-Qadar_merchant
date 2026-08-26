import { useEffect, useMemo } from "react";
import SalaryTable from "./SalaryTable";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import SalaryFilter from "./SalaryFilter";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonTable } from "components/Skeleton";
import {
  fetchPayrollHistoryByEmployee,
  showEmployeePayrollHistory,
  showEmployeePayrollHistoryLoading,
  clearEmployeeHistory,
  fetchAllEmployeesPayrollHistory,
  showAllEmployeesPayrollHistory,
  showAllEmployeesPayrollHistoryTotal,
  showAllEmployeesPayrollHistoryLoading,
} from "store/slices/payrollBatchSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";

const { view_employee } = rafeeqi_role_ids;

// Salary is no longer something added by hand here — the real basic/
// allowances/deductions setup lives in the Employee wizard's Salary step,
// and what an employee actually got PAID, month by month, is whatever
// Payroll Processing has run for them (see payroll-run-service.getByEmployee
// for one employee, getAll for everyone). This page is a read-only view of
// that history — one employee's when a filter is picked, every employee's
// otherwise.
const Salary = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useSelector(showEmployeePayrollHistory);
  const historyLoading = useSelector(showEmployeePayrollHistoryLoading);
  const allHistory = useSelector(showAllEmployeesPayrollHistory);
  const allHistoryTotal = useSelector(showAllEmployeesPayrollHistoryTotal);
  const allHistoryLoading = useSelector(showAllEmployeesPayrollHistoryLoading);
  const employees = useSelector(showEmployees);
  const [filters, setFilters] = useListFilters("hr-salary", {
    selectedEmployeeId: null,
    page: 1,
    limitId: tableRows[0].id,
  });
  const { selectedEmployeeId, page } = filters;
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const setSelectedEmployeeId = (id) => setFilters({ selectedEmployeeId: id, page: 1 });
  const setPage = (p) => setFilters({ page: p });

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (selectedEmployeeId) {
      dispatch(fetchPayrollHistoryByEmployee(selectedEmployeeId));
    } else {
      dispatch(clearEmployeeHistory());
      dispatch(fetchAllEmployeesPayrollHistory({ page, limit: selRows.id }));
    }
  }, [selectedEmployeeId, dispatch, page, selRows.id]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Server already flattened+paginated this (payroll-run-service.getAllEmployeesHistory)
  // — only the `employee` object still needs resolving client-side against
  // the employee list this page already loads.
  const allEmployeesHistory = useMemo(() => {
    if (selectedEmployeeId) return [];
    return (allHistory || []).map((row) => ({ ...row, employee: employees.find((e) => e.id === row.employeeId) }));
  }, [allHistory, employees, selectedEmployeeId]);

  const loading = selectedEmployeeId ? historyLoading : allHistoryLoading;
  const tableData = selectedEmployeeId ? history : allEmployeesHistory;
  const totalPages = Math.max(1, Math.ceil((allHistoryTotal || 0) / selRows.id));

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("salary:salary")}
            </h1>
            <p className="text-mutedForeground">
              {t("salary:salary_module_desc")}
            </p>
          </div>
        </div>
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_employee) && (
            <div className="mb-6">
              <SalaryFilter selectedEmployeeId={selectedEmployeeId} onSelectEmployee={setSelectedEmployeeId} />
            </div>
          )}
          {checkRoleAuth(view_employee) &&
            (loading ? (
              <SkeletonTable rows={6} columns={selectedEmployeeId ? 5 : 6} />
            ) : (
              <SalaryTable
                data={tableData}
                employee={selectedEmployee}
                showEmployeeColumn={!selectedEmployeeId}
                page={page}
                setPage={setPage}
                serverPaginated={!selectedEmployeeId}
                selRows={selRows}
                setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
                totalPages={totalPages}
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Salary;
