import { useEffect, useMemo } from "react";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import EmployeesCard from "./EmployeesCard";
import EmployeesTable from "./EmployeesTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import EmployeesFilter from "./EmployeesFilter";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchEmployees,
  showEmployees,
  showEmployeesTotal,
  showEmployeesLoading,
} from "store/slices/employeeSlice";

const { add_employee, view_employee, edit_employee, delete_employee } =
  rafeeqi_role_ids;

const Employees = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-employees", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const employees = useSelector(showEmployees);
  const totalRecords = useSelector(showEmployeesTotal);
  const loading = useSelector(showEmployeesLoading);

  const refreshList = () => dispatch(fetchEmployees({
    page: filters.page,
    limit: selRows.id,
    search: filters.search || undefined,
    status: filters.filterStatus || undefined,
  }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.filterStatus]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  // Stat cards are scoped to the current page once real pagination replaced
  // the old "fetch everything" approach — total employee count still comes
  // from the server's real total.
  const cardData = {
    total: totalRecords,
    active: employees.filter((e) => e.status === "active").length,
    departments: new Set(employees.map((e) => e.departmentId).filter(Boolean)).size,
  };

  const handlePageChange = (newPage) => setFilters({ page: newPage });
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("employees")}
            </h1>
            <p className="text-mutedForeground">
              {t("employees:manage_employees_desc")}
            </p>
          </div>
          {checkRoleAuth(add_employee) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/employees/add")}
                type="button"
                title={t("employees:add_employee")}
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
        {checkRoleAuth(view_employee) && <EmployeesCard data={cardData} />}
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_employee) && (
            <div className="mb-6">
              <EmployeesFilter filters={filters} setFilters={setFilters} />
            </div>
          )}
          {checkRoleAuth(
            `${view_employee},${edit_employee},${delete_employee}`,
          ) && (
            <EmployeesTable
              data={employees}
              loading={loading}
              page={filters.page}
              setPage={handlePageChange}
              selRows={selRows}
              setSelRows={handleRowsChange}
              totalPages={totalPages}
              onDeleted={refreshList}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
