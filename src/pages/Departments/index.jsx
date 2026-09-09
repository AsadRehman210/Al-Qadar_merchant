import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DepartmentsTable from "./DepartmentsTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows, statusFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchDepartments,
  showDepartments,
  showDepartmentsTotal,
  showDepartmentsLoading,
} from "store/slices/departmentSlice";

const { add_department, view_department } = alqadar_role_ids;

const Departments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("hr-departments", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: statusFilterOptions[0].id,
  });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const selStatus = statusFilterOptions.find((o) => o.id === filters.statusId) || statusFilterOptions[0];

  const departments = useSelector(showDepartments);
  const totalRecords = useSelector(showDepartmentsTotal);
  const loading = useSelector(showDepartmentsLoading);

  const refreshList = () => dispatch(fetchDepartments({
    page: filters.page,
    limit: selRows.id,
    search: filters.search || undefined,
    status: selStatus.id || undefined,
  }));

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.statusId]);

  const totalPages = useMemo(() => Math.ceil((totalRecords || 0) / selRows.id) || 1, [totalRecords, selRows]);

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("department:departments")}
            </h1>
            <p className="text-mutedForeground">
              {t("department:module_desc")}
            </p>
          </div>
          {checkRoleAuth(add_department) && (
            <div className="relative z-10 shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/departments/add")}
                type="button"
                title={t("department:add_department")}
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
          {checkRoleAuth(view_department) && (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex-1 min-w-[220px] max-w-xs">
                  <SearchInput
                    placeholder={`${t("search")}...`}
                    onSearch={(v) => setFilters({ search: v, page: 1 })}
                    initialValue={filters.search}
                  />
                </div>
                <div className="w-full sm:w-48">
                  <SelectDropdown
                    data={statusFilterOptions}
                    selected={selStatus}
                    setSelected={(v) => setFilters({ statusId: (v || statusFilterOptions[0]).id, page: 1 })}
                    hideClear
                    classes="!h-10 !rounded-lg"
                  />
                </div>
              </div>
              <DepartmentsTable
                data={departments}
                loading={loading}
                page={filters.page}
                setPage={(p) => setFilters({ page: p })}
                selRows={selRows}
                setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
                totalPages={totalPages}
                onDeleted={refreshList}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Departments;
