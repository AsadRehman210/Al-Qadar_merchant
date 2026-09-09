import { useEffect } from "react";
import Button from "components/Button";
import { IoAdd } from "react-icons/io5";
import { FiSettings } from "react-icons/fi";
import AttendanceCard from "./AttendanceCard";
import AttendanceTable from "./AttendanceTable";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import AttendanceFilter from "./AttendanceFilter";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { tableRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import {
  fetchAttendance,
  fetchAttendanceTodayStats,
  showAttendanceList,
  showAttendanceTotal,
  showAttendanceLoading,
  showAttendanceTodayStats,
} from "store/slices/attendanceSlice";

const { view_attendance, add_attendance } = alqadar_role_ids;

const Attendance = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [filters, setFilters] = useListFilters("hr-attendance", { page: 1, limitId: tableRows[0].id, search: "", filterStatus: null });
  const selRows = tableRows.find((r) => r.id === filters.limitId) || tableRows[0];
  const attendanceList = useSelector(showAttendanceList);
  const totalRecords = useSelector(showAttendanceTotal);
  const loading = useSelector(showAttendanceLoading);
  const todayStats = useSelector(showAttendanceTodayStats);

  const refreshList = () => dispatch(fetchAttendance({
    page: filters.page,
    limit: selRows.id,
    search: filters.search || undefined,
    status: filters.filterStatus || undefined,
  }));
  const refreshStats = () => dispatch(fetchAttendanceTodayStats());

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.page, filters.limitId, filters.search, filters.filterStatus]);

  useEffect(() => {
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handlePageChange = (newPage) => setFilters({ page: newPage });
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  const cardData = {
    total: totalRecords,
    presentToday: todayStats.presentToday,
    absentToday: todayStats.absentToday,
    onLeaveToday: todayStats.onLeaveToday,
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("attendance:attendance")}
            </h1>
            <p className="text-mutedForeground">
              {t("attendance:attendance_module_desc")}
            </p>
          </div>
          {(checkRoleAuth(view_attendance) || checkRoleAuth(add_attendance)) && (
          <div className="relative z-10 shrink-0 flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              title={t("attendance:attendance_policy")}
              src=""
              icon={FiSettings}
              btn="secondary"
              disabled={false}
              imgClass=""
              loading={false}
              iconClass="h-4 w-4"
              onClick={() => navigate("/attendance-policy")}
              className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border border-slate-200 dark:!border-white/25 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white"
            />
            {checkRoleAuth(add_attendance) && (
              <Button
                className="!w-auto !rounded-lg !h-11 !px-5 flex-row rtl:flex-row-reverse !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600 hover:!from-teal-600 hover:!to-teal-700 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                onClick={() => navigate("/attendance/add")}
                type="button"
                title={t("attendance:add_attendance")}
                src=""
                icon={IoAdd}
                btn="primary"
                disabled={false}
                imgClass=""
                loading={false}
                iconClass="h-4 w-4 text-white"
              />
            )}
          </div>
          )}
        </div>
        {checkRoleAuth(view_attendance) &&
          (loading ? (
            <div className="mt-5">
              <SkeletonCards count={4} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
            </div>
          ) : (
            <AttendanceCard data={cardData} />
          ))}
        <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 animate-[partners-cardIn_0.5s_ease-out_0.1s_both]">
          {checkRoleAuth(view_attendance) && (
            <div className="mb-6">
              <AttendanceFilter filters={filters} setFilters={setFilters} />
            </div>
          )}
          {checkRoleAuth(view_attendance) && (
            <AttendanceTable
              data={attendanceList}
              loading={loading}
              page={filters.page}
              setPage={handlePageChange}
              selRows={selRows}
              setSelRows={handleRowsChange}
              totalPages={totalPages}
              onDeleted={() => { refreshList(); refreshStats(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
