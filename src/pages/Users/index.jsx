import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Button from "components/Button";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { IoAdd } from "react-icons/io5";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows, statusFilterOptions } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import {
  fetchUsers,
  showUsers,
  showUsersTotal,
  showUsersLoading,
} from "store/slices/userSlice";
import UsersTable from "./UsersTable";

const { add_user, view_user } = alqadar_role_ids;

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("access-users", {
    page: 1,
    limitId: tableRows[0].id,
    search: "",
    statusId: "",
  });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const statusOpts = statusFilterOptions;
  const filterStatus = statusOpts.find((o) => o.id === filters.statusId) || statusOpts[0];

  const users = useSelector(showUsers);
  const totalRecords = useSelector(showUsersTotal);
  const loading = useSelector(showUsersLoading);

  const refetch = () =>
    dispatch(
      fetchUsers({
        page: filters.page,
        limit: selRows.id,
        search: filters.search || undefined,
        status: filterStatus?.id ? filterStatus.id.toLowerCase() : undefined,
      }),
    );

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.statusId]);

  const totalPages = useMemo(
    () => Math.ceil((totalRecords || 0) / selRows.id) || 1,
    [totalRecords, selRows],
  );

  if (!checkRoleAuth(view_user)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t("users")}</h1>
            <p className="text-mutedForeground">{t("users_module_desc")}</p>
          </div>
          {checkRoleAuth(add_user) && (
            <div className="shrink-0">
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5"
                onClick={() => navigate("/users/add")}
                type="button"
                title={t("add_user")}
                icon={IoAdd}
                btn="primary"
                iconClass="h-4 w-4 text-white"
              />
            </div>
          )}
        </div>

        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          {checkRoleAuth(view_user) && (
            <>
              <div className="mb-5 flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] max-w-xs">
                  <SearchInput
                    placeholder={t("search")}
                    onSearch={(v) => setFilters({ search: v, page: 1 })}
                    initialValue={filters.search}
                  />
                </div>
                <div className="min-w-[160px]">
                  <SelectDropdown
                    data={statusOpts}
                    selected={filterStatus}
                    setSelected={(v) => setFilters({ statusId: v?.id || "", page: 1 })}
                    classes="!h-[40px] !rounded-lg"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                <UsersTable
                  data={users}
                  loading={loading}
                  page={filters.page}
                  setPage={(p) => setFilters({ page: p })}
                  selRows={selRows}
                  setSelRows={(v) => setFilters({ limitId: v.id, page: 1 })}
                  totalPages={totalPages}
                  onChanged={refetch}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
