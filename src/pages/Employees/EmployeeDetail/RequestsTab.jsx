import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { requestTypeById } from "../../Requests/requestsFakeData";
import { fetchRequestsByEmployee, showRequestsByEmployee } from "store/slices/requestSlice";
import { APPROVAL_STATUS_BADGE } from "global/approvalEngine";

const RequestsTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useSelector(showRequestsByEmployee);

  useEffect(() => {
    if (data?.id) dispatch(fetchRequestsByEmployee(data.id));
  }, [data?.id, dispatch]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HiOutlineClipboardDocumentList className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("requests:module_title")}
            </h3>
          </div>
          <Link
            to="/requests/apply"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {t("requests:new_request")}
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 rounded-md overflow-hidden">
        {history.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500 dark:text-white/60">
            {t("no_record_found")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("requests:request_no")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("requests:request_type")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("requests:summary")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("requests:submitted_on")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90">
                    {t("requests:status")}
                  </th>
                  <th className="text-start py-3 px-4 font-semibold text-slate-700 dark:text-white/90" />
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-slate-100 dark:border-white/10 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-white/5"
                  >
                    <td className="py-2.5 px-4 text-slate-800 dark:text-white/90">{r.requestNumber}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">{requestTypeById(r.type)?.name || r.type}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70 max-w-[220px] truncate">{r.summary}</td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-white/70">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          APPROVAL_STATUS_BADGE[r.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <Link
                        to={`/requests/details/${r.id}`}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {t("requests:view_details")}
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

export default RequestsTab;
