import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { IoAdd } from "react-icons/io5";
import { LuClipboardList, LuClock, LuTimer, LuFileText, LuLogOut, LuBadgeCheck, LuTrendingUp, LuDoorOpen, LuRepeat, LuPlane, LuLaptop, LuUserCog, LuGraduationCap, LuTriangleAlert, LuShieldAlert, LuLifeBuoy } from "react-icons/lu";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import Pagination from "components/Pagination";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import TableState from "components/TableState";
import { SkeletonCards } from "components/Skeleton";
import { tableRows } from "global/constant";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { APPROVAL_STATUS_BADGE } from "global/approvalEngine";
import { useListFilters } from "hooks/useListFilters";
import {
  REQUEST_TYPES,
  APPROVAL_STATUS,
  requestTypeById,
} from "./requestsFakeData";
import {
  fetchRequests,
  fetchRequestsSummary,
  showRequests,
  showRequestsTotal,
  showRequestsLoading,
  showRequestsSummary,
  showLastUpdated,
} from "store/slices/requestSlice";

const { add_employee_request, view_employee_request, approve_employee_request } = alqadar_role_ids;

export const TYPE_ICON = {
  clock: LuClock,
  timer: LuTimer,
  file: LuFileText,
  logout: LuLogOut,
  badge: LuBadgeCheck,
  trending: LuTrendingUp,
  door: LuDoorOpen,
  repeat: LuRepeat,
  plane: LuPlane,
  laptop: LuLaptop,
  usercog: LuUserCog,
  graduation: LuGraduationCap,
  alert: LuTriangleAlert,
  shield: LuShieldAlert,
  lifebuoy: LuLifeBuoy,
};

const Requests = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-requests", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null, filterType: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const lastUpdated = useSelector(showLastUpdated);

  const requests = useSelector(showRequests);
  const totalRecords = useSelector(showRequestsTotal);
  const loading = useSelector(showRequestsLoading);
  const summary = useSelector(showRequestsSummary);

  useEffect(() => {
    dispatch(fetchRequests({
      page: filters.page,
      limit: selRows.id,
      search: filters.search || undefined,
      status: filters.filterStatus || undefined,
      type: filters.filterType || undefined,
    }));
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.filterStatus, filters.filterType, lastUpdated]);

  useEffect(() => {
    dispatch(fetchRequestsSummary());
  }, [dispatch, lastUpdated]);

  const list = requests.map((r) => ({
    ...r,
    typeName: requestTypeById(r.type)?.name || r.type,
    managerName: r.managerName || "HR",
  }));

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const STAT_CARDS = [
    { label: t("requests:total"), value: summary.total, color: "from-slate-500 to-slate-600" },
    { label: t("requests:pending"), value: summary.pendingManager + summary.pendingHr, color: "from-amber-500 to-amber-600" },
    { label: t("requests:approved"), value: summary.approved, color: "from-emerald-500 to-emerald-600" },
    { label: t("requests:rejected"), value: summary.rejected, color: "from-rose-500 to-rose-600" },
  ];

  const typeOpts = [{ id: "", title: t("requests:all_types") }, ...REQUEST_TYPES.map((x) => ({ id: x.id, title: x.name }))];
  const statusOpts = [{ id: "", title: t("requests:all_status") }, ...Object.values(APPROVAL_STATUS).map((s) => ({ id: s, title: s }))];

  const pendingManager = summary.pendingManager;
  const pendingHr = summary.pendingHr;

  if (!checkRoleAuth(view_employee_request)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:text-white">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("requests:module_title")}</h1>
            <p className="text-mutedForeground mt-1">{t("requests:module_desc")}</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-gradient-to-br !from-purple-500 !to-purple-600 hover:!from-purple-600 hover:!to-purple-700"
              onClick={() => navigate("/requests/apply")}
              type="button"
              title={t("requests:new_request")}
              icon={IoAdd}
              iconClass="h-4 w-4 text-white"
            />
            {checkRoleAuth(add_employee_request) && (
              <Button
                className="!w-auto !rounded-lg !h-10 !px-4 !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white hover:!bg-slate-50"
                onClick={() => navigate("/requests/add")}
                type="button"
                title={t("requests:add_request_hr")}
              />
            )}
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="mb-6">
            <SkeletonCards count={4} columns="grid-cols-2 lg:grid-cols-4" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((c) => (
              <div key={c.label} className={`p-5 rounded-2xl bg-gradient-to-br ${c.color} text-white`}>
                <p className="text-sm font-medium opacity-80">{c.label}</p>
                <p className="text-3xl font-bold mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Approval shortcuts */}
        {checkRoleAuth(approve_employee_request) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/requests/manager-approvals")}
            className="flex items-center justify-between p-4 rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/30 hover:border-amber-400 transition-all"
          >
            <div className="text-start">
              <p className="font-semibold text-amber-800 dark:text-amber-300">{t("requests:manager_approvals")}</p>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">{t("requests:manager_approvals_desc")}</p>
            </div>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pendingManager}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/requests/hr-approvals")}
            className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 hover:border-blue-400 transition-all"
          >
            <div className="text-start">
              <p className="font-semibold text-blue-800 dark:text-blue-300">{t("requests:hr_approvals")}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">{t("requests:hr_approvals_desc")}</p>
            </div>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pendingHr}</span>
          </button>
        </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-5 sm:p-7">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-5">
            <div className="flex-1">
              <SearchInput
                onSearch={(v) => setFilters({ page: 1, search: v })}
                initialValue={filters.search}
                placeholder={`${t("search")}...`}
              />
            </div>
            <div className="w-full lg:w-56">
              <SelectDropdown
                data={typeOpts}
                selected={typeOpts.find((o) => o.id === (filters.filterType || "")) || typeOpts[0]}
                setSelected={(v) => setFilters({ page: 1, filterType: v?.id || null })}
                hideClear
              />
            </div>
            <div className="w-full lg:w-56">
              <SelectDropdown
                data={statusOpts}
                selected={statusOpts.find((o) => o.id === (filters.filterStatus || "")) || statusOpts[0]}
                setSelected={(v) => setFilters({ page: 1, filterStatus: v?.id || null })}
                hideClear
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-md overflow-hidden border border-slate-200 dark:border-white/10">
            <table className="w-full border-collapse text-sm mb-0">
              <thead>
                <tr className="bg-[var(--color-teal-500)] border-none">
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap pl-6 rounded-tl-md">{t("requests:request_no")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("requests:request_type")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("requests:employee")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("requests:summary")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("requests:manager")}</th>
                  <th className="px-4 py-4 text-start font-semibold text-white/95 border-none whitespace-nowrap">{t("requests:status")}</th>
                  <th className="px-4 py-4 text-end font-semibold text-white/95 border-none whitespace-nowrap pr-6 rounded-tr-md">{t("requests:view_details")}</th>
                </tr>
              </thead>
              <tbody>
                <TableState loading={loading} data={list} colSpan={7}>
                {list.map((r) => {
                  const Icon = TYPE_ICON[REQUEST_TYPES.find((x) => x.id === r.type)?.icon] || LuClipboardList;
                  return (
                    <tr
                      key={r.id}
                      className="transition-colors border-b border-slate-100 dark:border-white/5 hover:bg-teal-50 dark:hover:bg-teal-500/10 last:[&_td]:border-b-0 cursor-pointer"
                      onClick={() => navigate(`/requests/details/${r.id}`)}
                    >
                      <td className="px-4 py-4 align-middle pl-6 font-medium text-slate-800 dark:text-white">{r.requestNumber}</td>
                      <td className="px-4 py-4 align-middle">
                        <span className="inline-flex items-center gap-2 text-slate-700 dark:text-white/80">
                          <Icon className="h-4 w-4 text-teal-600 dark:text-teal-400" /> {r.typeName}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <p className="font-medium text-slate-800 dark:text-white">{r.employeeName || "—"}</p>
                        <p className="text-xs text-slate-400">{r.employeeCode} · {r.department}</p>
                      </td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/70">{r.summary}</td>
                      <td className="px-4 py-4 align-middle text-slate-600 dark:text-white/70">{r.managerName}</td>
                      <td className="px-4 py-4 align-middle">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${APPROVAL_STATUS_BADGE[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-4 align-middle text-end pr-6">
                        <span className="text-xs text-teal-600 hover:underline">{t("requests:view_details")}</span>
                      </td>
                    </tr>
                  );
                })}
                </TableState>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {list.length > 0 && (
            <div className="flex items-center flex-wrap gap-4 mt-6 pt-5 border-t border-slate-200 dark:border-white/20 [&_.pagination_li.selected_a]:!bg-gradient-to-br [&_.pagination_li.selected_a]:!from-teal-500 [&_.pagination_li.selected_a]:!to-teal-600 [&_.pagination_li.selected_a]:!border-transparent [&_.pagination_li.selected_a]:!text-white [&_.pagination_li_a:hover]:!text-teal-600 [&_.pagination_li_a:hover]:!bg-teal-50 dark:[&_.pagination_li_a:hover]:!border-teal-500 dark:[&_.pagination_li_a:hover]:!text-teal-300 dark:[&_.pagination_li_a:hover]:!bg-teal-500/20">
              <div className="flex items-center gap-4">
                <SelectDropdown data={tableRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
                <span className="whitespace-nowrap">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <Pagination
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={filters.page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Requests;
