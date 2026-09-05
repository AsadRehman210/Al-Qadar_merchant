import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import { IoAdd } from "react-icons/io5";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchRoles,
  showRoles,
  showRolesTotal,
  showRolesLoading,
} from "store/slices/roleSlice";
import RolesTable from "./RolesTable";

const { add_role, view_role } = rafeeqi_role_ids;

const Roles = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("access-roles", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
  });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];

  const roles = useSelector(showRoles);
  const totalRecords = useSelector(showRolesTotal);
  const loading = useSelector(showRolesLoading);

  useEffect(() => {
    dispatch(
      fetchRoles({
        page: filters.page,
        limit: selRows.id,
        search: filters.search || undefined,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.limitId, filters.search]);

  const totalPages = useMemo(
    () => Math.ceil((totalRecords || 0) / selRows.id) || 1,
    [totalRecords, selRows],
  );

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("roles")}</h1>
            <p className="text-mutedForeground">{t("roles_module_desc")}</p>
          </div>
          {checkRoleAuth(add_role) && (
            <div className="shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5"
                onClick={() => navigate("/roles/add")}
                type="button"
                title={t("add_role")}
                icon={IoAdd}
                btn="primary"
                iconClass="h-4 w-4 text-white"
              />
            </div>
          )}
        </div>

        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          {checkRoleAuth(view_role) && (
            <>
              <div className="mb-5 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] max-w-xs">
                  <SearchInput
                    placeholder={t("search")}
                    onSearch={(v) => setFilters({ search: v, page: 1 })}
                    initialValue={filters.search}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <RolesTable
                  data={roles}
                  loading={loading}
                  page={filters.page}
                  setPage={(p) => setFilters({ page: p })}
                  selRows={selRows}
                  setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
                  totalPages={totalPages}
                  onChanged={() =>
                    dispatch(
                      fetchRoles({
                        page: filters.page,
                        limit: selRows.id,
                        search: filters.search || undefined,
                      }),
                    )
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roles;
