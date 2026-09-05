import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import FormTextarea from "components/FormTextarea";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { cardRows, leaveStatusBadge } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import {
  fetchLeaves,
  showLeaves,
  showLeavesTotal,
  showLeavesLoading,
  hrApproveLeave,
  hrRejectLeave,
} from "store/slices/leaveSlice";

const { add_employee } = rafeeqi_role_ids;

const QuickActionPanel = ({ leave, onDone }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [comments, setComments] = useState("");
  const dispatch = useDispatch();

  const submit = async () => {
    try {
      if (action === "approve") {
        await dispatch(hrApproveLeave({ id: leave.id, comments })).unwrap();
      } else {
        await dispatch(hrRejectLeave({ id: leave.id, comments })).unwrap();
      }
      onDone?.();
      setOpen(false);
    } catch (err) {
      toast.error(err || t("leave:action_failed"));
    }
  };

  if (open) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
        <FormTextarea
          rows={2}
          value={comments}
          onValueChange={setComments}
          placeholder={t("leave:comments_placeholder")}
          className="!text-xs !mb-2"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            title={action === "approve" ? t("leave:approve") : t("leave:reject")}
            btn="primary"
            className={`!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white ${action === "approve" ? "!bg-emerald-500" : "!bg-rose-500"}`}
            onClick={submit}
          />
          <Button
            type="button"
            title={t("cancel")}
            onClick={() => setOpen(false)}
            className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button
        type="button"
        title={t("leave:approve")}
        icon={FiCheck}
        iconClass="h-3 w-3"
        onClick={() => { setAction("approve"); setOpen(true); }}
        className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600"
      />
      <Button
        type="button"
        title={t("leave:reject")}
        icon={FiX}
        iconClass="h-3 w-3"
        onClick={() => { setAction("reject"); setOpen(true); }}
        className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-rose-500 hover:!bg-rose-600"
      />
    </div>
  );
};

const HrApprovals = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const pending = useSelector(showLeaves);
  const totalRecords = useSelector(showLeavesTotal);
  const loading = useSelector(showLeavesLoading);
  const [filters, setFilters] = useListFilters("hr-leave-hr-approvals", { page: 1, limitId: cardRows[0].id });
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];
  const page = filters.page;

  useEffect(() => {
    dispatch(fetchLeaves({ status: "Pending HR", page, limit: selRows.id }));
  }, [dispatch, page, selRows.id]);

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });
  const handleDone = () => dispatch(fetchLeaves({ status: "Pending HR", page, limit: selRows.id }));

  if (!checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/leave-management")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("leave:hr_approvals")}</h1>
            <p className="text-mutedForeground">{t("leave:hr_approvals_desc")}</p>
          </div>
          <span className="ltr:ml-auto rtl:mr-auto text-2xl font-bold text-blue-600">
            {totalRecords} {t("leave:pending")}
          </span>
        </div>

        {loading ? (
          <SkeletonCards count={4} columns="grid-cols-1 lg:grid-cols-2" />
        ) : (
          <>
            {pending.length === 0 && (
              <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-12 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-semibold text-slate-700 dark:text-white">{t("leave:all_clear")}</p>
                <p className="text-slate-500 dark:text-white/60 text-sm">{t("leave:no_pending_approvals")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pending.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white dark:bg-white/10 border-2 border-blue-200 dark:border-blue-500/30 rounded-3xl p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{leave.employeeName}</p>
                      <p className="text-xs text-slate-500 dark:text-white/60">{leave.employeeCode} · {leave.department}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${leaveStatusBadge[leave.status]}`}>
                        {leave.status}
                      </span>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{leave.leaveNumber}</p>
                    </div>
                  </div>

                  {/* Manager approval summary */}
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-xs">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">✓ {t("leave:manager_approved")}</p>
                    {leave.managerApproval?.approvedOn && (
                      <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {leave.managerApproval.approvedOn}
                      </p>
                    )}
                    {leave.managerApproval?.comments && (
                      <p className="italic mt-0.5 text-emerald-600">&quot;{leave.managerApproval.comments}&quot;</p>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-white/60">{t("leave:leave_type")}</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{leave.leaveTypeName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-white/60">{t("leave:from_date")}</p>
                      <p className="font-semibold text-slate-800 dark:text-white">{leave.fromDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-white/60">{t("leave:days")}</p>
                      <p className="font-bold text-2xl text-blue-600">{leave.days}</p>
                    </div>
                  </div>
                  {leave.reason && (
                    <p className="mt-3 text-xs text-slate-600 dark:text-white/70 italic line-clamp-2">&quot;{leave.reason}&quot;</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => navigate(`/leave-management/details/${leave.id}`)}
                      className="text-xs text-teal-600 hover:underline"
                    >
                      {t("view_details")}
                    </button>
                  </div>
                  <QuickActionPanel leave={leave} onDone={handleDone} />
                </div>
              ))}
            </div>

            <div className="flex items-center flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-3">
                <SelectDropdown data={cardRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
                <span className="text-sm text-slate-600 dark:text-white/70">{t("per_page")}</span>
              </div>
              <div className="pagination ltr:ml-auto rtl:mr-auto">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={<FaAngleRight />}
                  previousLabel={<FaAngleLeft />}
                  onPageChange={(e) => setFilters({ page: e.selected + 1 })}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={totalPages}
                  forcePage={page - 1}
                  renderOnZeroPageCount={null}
                  containerClassName="custom-pagination flex flex-row rtl:flex-row-reverse flex-wrap items-center gap-1 text-sm"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HrApprovals;
