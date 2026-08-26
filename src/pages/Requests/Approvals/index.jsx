import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { APPROVAL_STATUS_BADGE, APPROVAL_STATUS } from "global/approvalEngine";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { cardRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { SkeletonCards } from "components/Skeleton";
import { TYPE_ICON } from "../index";
import { REQUEST_TYPES, requestTypeById } from "../requestsFakeData";
import { LuClipboardList } from "react-icons/lu";
import {
  fetchRequests,
  showRequests,
  showRequestsTotal,
  showRequestsLoading,
  managerApproveRequest,
  managerRejectRequest,
  hrApproveRequest,
  hrRejectRequest,
} from "store/slices/requestSlice";

const { add_employee } = rafeeqi_role_ids;

const QuickPanel = ({ stage, req, onDone }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const [comments, setComments] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEmpty = !comments.trim();

  const reset = () => { setOpen(false); setComments(""); setTouched(false); };

  const submit = async () => {
    if (isEmpty) { setTouched(true); return; }
    const note = comments.trim();
    setSubmitting(true);
    try {
      if (stage === "manager") {
        if (action === "approve") await dispatch(managerApproveRequest({ id: req.id, data: { comments: note } })).unwrap();
        else await dispatch(managerRejectRequest({ id: req.id, data: { comments: note } })).unwrap();
      } else {
        if (action === "approve") await dispatch(hrApproveRequest({ id: req.id, data: { comments: note } })).unwrap();
        else await dispatch(hrRejectRequest({ id: req.id, data: { comments: note } })).unwrap();
      }
      onDone?.();
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  if (open) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15">
        <label className="text-xs font-medium text-slate-600 dark:text-white/70 mb-1 block">
          {t("requests:decision_note")} <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={t("requests:decision_note_placeholder")}
          className={`w-full rounded-lg border bg-white dark:bg-white/10 p-2 text-xs mb-1 ${touched && isEmpty ? "border-rose-400" : "border-slate-200 dark:border-white/20"}`}
        />
        {touched && isEmpty && (
          <p className="text-xs text-rose-500 mb-1">{t("requests:decision_note_required")}</p>
        )}
        <div className="flex gap-2 mt-1">
          <Button
            type="button"
            title={action === "approve" ? t("requests:approve") : t("requests:reject")}
            onClick={submit}
            disabled={submitting}
            className={`!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white ${action === "approve" ? "!bg-emerald-500 hover:!bg-emerald-600" : "!bg-rose-500 hover:!bg-rose-600"} ${isEmpty ? "!opacity-50" : ""}`}
          />
          <Button
            type="button"
            title={t("cancel")}
            onClick={reset}
            className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-3">
      <Button type="button" title={t("requests:approve")} icon={FiCheck} iconClass="h-3 w-3" onClick={() => { setAction("approve"); setOpen(true); }} className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600" />
      <Button type="button" title={t("requests:reject")} icon={FiX} iconClass="h-3 w-3" onClick={() => { setAction("reject"); setOpen(true); }} className="!w-auto !rounded-lg !h-8 !px-3 !text-xs !border-0 !text-white !bg-rose-500 hover:!bg-rose-600" />
    </div>
  );
};

const Approvals = ({ stage = "manager" }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const requests = useSelector(showRequests);
  const totalRecords = useSelector(showRequestsTotal);
  const loading = useSelector(showRequestsLoading);
  const [filters, setFilters] = useListFilters(`requests-approvals-${stage}`, { page: 1, limitId: cardRows[0].id });
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];
  const page = filters.page;

  const wantStatus = stage === "manager" ? APPROVAL_STATUS.PENDING_MANAGER : APPROVAL_STATUS.PENDING_HR;

  useEffect(() => {
    dispatch(fetchRequests({ status: wantStatus, page, limit: selRows.id }));
  }, [dispatch, wantStatus, page, selRows.id]);

  const pending = requests.map((r) => ({
    ...r,
    typeName: requestTypeById(r.type)?.name || r.type,
  }));

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });
  const refresh = () => dispatch(fetchRequests({ status: wantStatus, page, limit: selRows.id }));
  const isManager = stage === "manager";
  const countClass = isManager ? "text-amber-600" : "text-blue-600";
  const cardBorder = isManager
    ? "border-amber-200 dark:border-amber-500/30"
    : "border-blue-200 dark:border-blue-500/30";

  if (!checkRoleAuth(add_employee)) return null;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1] space-y-6">
        <div className="flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/requests")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md bg-white border border-slate-200 hover:bg-slate-50 dark:bg-white/10 dark:border-white/20"
            iconClass="!text-lg"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {stage === "manager" ? t("requests:manager_approvals") : t("requests:hr_approvals")}
            </h1>
            <p className="text-mutedForeground">
              {stage === "manager" ? t("requests:manager_approvals_desc") : t("requests:hr_approvals_desc")}
            </p>
          </div>
          <span className={`ltr:ml-auto rtl:mr-auto text-2xl font-bold ${countClass}`}>
            {totalRecords} {t("requests:pending")}
          </span>
        </div>

        {loading ? (
          <SkeletonCards count={4} columns="grid-cols-1 lg:grid-cols-2" />
        ) : (
          <>
        {pending.length === 0 && (
          <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-12 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-slate-700 dark:text-white">{t("requests:all_clear")}</p>
            <p className="text-slate-500 dark:text-white/60 text-sm">{t("requests:no_pending")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pending.map((req) => {
            const Icon = TYPE_ICON[REQUEST_TYPES.find((x) => x.id === req.type)?.icon] || LuClipboardList;
            return (
              <div key={req.id} className={`bg-white dark:bg-white/10 border-2 ${cardBorder} rounded-3xl p-6`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{req.typeName}</p>
                      <p className="text-xs text-slate-500 dark:text-white/60">{req.employeeName} · {req.department}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${APPROVAL_STATUS_BADGE[req.status]}`}>{req.status}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{req.requestNumber}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-white/80">{req.summary}</p>
                {req.details?.reason && (
                  <p className="mt-1 text-xs text-slate-600 dark:text-white/70 italic line-clamp-2">&quot;{req.details.reason}&quot;</p>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/10">
                  <button type="button" onClick={() => navigate(`/requests/details/${req.id}`)} className="text-xs text-teal-600 hover:underline">
                    {t("requests:view_details")}
                  </button>
                </div>
                <QuickPanel stage={stage} req={req} onDone={refresh} />
              </div>
            );
          })}
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

export default Approvals;
