import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import {
  fetchLeavesByEmployee,
  showEmployeeLeaves,
  fetchLeaveBalance,
  showLeaveBalance,
} from "store/slices/leaveSlice";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";
import { leaveStatusBadge } from "global/constant";

const LeaveTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useSelector(showEmployeeLeaves);
  const balance = useSelector(showLeaveBalance);
  const leaveTypes = useSelector(showLeaveTypes);

  useEffect(() => {
    if (data?.id) {
      dispatch(fetchLeavesByEmployee(data.id));
      dispatch(fetchLeaveBalance(data.id));
    }
    dispatch(fetchLeaveTypes());
  }, [data?.id, dispatch]);

  const leaveTypesById = Object.fromEntries(leaveTypes.map((x) => [x.id, x.name]));

  return (
    <div className="space-y-6">
      {/* Balance summary */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineCalendarDays className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("leave:leave_balances")}
            </h3>
          </div>
          <Link
            to="/leave-management/balances"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t("leave:view_in_leave_management")}
          </Link>
        </div>

        {balance.length > 0 ? (
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4">
            {balance.map((b) => (
              <div
                key={b.leaveTypeId}
                className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
              >
                <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase truncate">
                  {b.leaveTypeName}
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {b.remaining}{" "}
                  <span className="text-xs font-normal text-slate-500 dark:text-white/60">
                    / {b.entitled} {t("leave:remaining")}
                  </span>
                </p>
                {b.pending > 0 && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                    {b.pending} {t("leave:pending")}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="relative text-sm text-slate-500 dark:text-white/60">
            {t("no_record_found")}
          </p>
        )}
      </div>

      {/* Leave history */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-white/10">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t("leave:all_requests")}
          </h4>
          <Link
            to="/leave-management/apply"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t("leave:apply_leave")}
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-white/60">
            {t("no_record_found")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("leave:leave_type")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("leave:from_date")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("leave:to_date")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("leave:days")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("leave:status")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90" />
                </tr>
              </thead>
              <tbody>
                {history.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-slate-100 dark:border-white/10 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5"
                  >
                    <td className="py-2.5 px-4 text-slate-800 dark:text-white/90">{leaveTypesById[l.leaveTypeId] || "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">{l.fromDate}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">{l.toDate}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-white">{l.days}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          leaveStatusBadge[l.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Link
                        to={`/leave-management/details/${l.id}`}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {t("view_details")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveTab;
