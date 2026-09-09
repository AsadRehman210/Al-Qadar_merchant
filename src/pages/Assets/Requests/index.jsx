import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight, FiPlus, FiCheck, FiX, FiPackage } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  assetRequestStatusFilterOptions,
  assetRequestPriorityOptions,
} from "global/constant";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import {
  fetchAssetRequests,
  createAssetRequest,
  decideAssetRequest,
  fulfillAssetRequest,
  fetchAssets,
  fetchAssetCategories,
  showAssetRequests,
  showAssetRequestsLoading,
  showAssets,
  showAssetCategories,
} from "store/slices/assetSlice";
import { SkeletonCards } from "components/Skeleton";
import EmptyState from "components/EmptyState";

const { add_asset_request, edit_asset_request, approve_asset_request } = alqadar_role_ids;

const statusClass = (s) => {
  const m = {
    Pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    Approved: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
    Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    Fulfilled: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  };
  return m[s] || m.Pending;
};

const priorityClass = (p) => {
  const m = {
    Low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/60",
    Normal: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    High: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    Urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  };
  return m[p] || m.Normal;
};

const AssetRequests = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [emp, setEmp] = useState(null);
  const [category, setCategory] = useState(null);
  const [priority, setPriority] = useState({ id: "Normal", title: "Normal" });
  const [justification, setJustification] = useState("");

  const [fulfillingId, setFulfillingId] = useState(null);
  const [fulfillAsset, setFulfillAsset] = useState(null);
  const [decidingId, setDecidingId] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const requests = useSelector(showAssetRequests);
  const requestsLoading = useSelector(showAssetRequestsLoading);
  const allAssets = useSelector(showAssets);
  const categories = useSelector(showAssetCategories);
  const employees = useSelector(showEmployees);

  useEffect(() => {
    dispatch(fetchAssetRequests({ limit: 200 }));
    dispatch(fetchAssets({ limit: 500 }));
    dispatch(fetchAssetCategories());
    dispatch(fetchEmployees({ limit: 500 }));
  }, [dispatch]);

  const empOptions = useMemo(
    () => employees.filter((e) => e.status === "active").map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim() })),
    [employees],
  );
  const categoryOptions = useMemo(
    () => categories.filter((c) => c.status === "Active").map((c) => ({ id: c.id, title: `${c.code} — ${c.name}` })),
    [categories],
  );

  const filteredRequests = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter);

  const availableAssetsFor = (categoryId) =>
    allAssets
      .filter((a) => a.categoryId === categoryId && !a.assignedToId && a.status !== "Disposed")
      .map((a) => ({ id: a.id, title: `${a.name} (${a.assetTag})` }));

  const resetForm = () => {
    setEmp(null); setCategory(null); setPriority({ id: "Normal", title: "Normal" }); setJustification("");
  };

  const handleCreate = async () => {
    if (!emp || !category) { toast.error(t("asset:request_fields_required")); return; }
    const just = String(justification || "").trim();
    if (just.length < 10) {
      toast.error(t("asset:justification_required", { defaultValue: "Justification must be at least 10 characters" }));
      return;
    }
    try {
      await dispatch(createAssetRequest({
        employeeId: emp.id,
        categoryId: category.id,
        justification: just,
        priority: priority?.id || "Normal",
      })).unwrap();
      toast.success(t("asset:request_submitted"));
      resetForm();
      setShowForm(false);
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  const openDecide = (id) => { setDecidingId(id); setDecisionNotes(""); };
  const handleDecide = async (id, status) => {
    if (status === "Rejected" && !String(decisionNotes || "").trim()) {
      toast.error(t("asset:decision_notes_required", { defaultValue: "Decision notes are required when rejecting" }));
      return;
    }
    try {
      await dispatch(decideAssetRequest({ id, data: { status, decisionNotes } })).unwrap();
      toast.success(status === "Approved" ? t("asset:request_approved") : t("asset:request_rejected"));
      setDecidingId(null);
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  const openFulfill = (id) => { setFulfillingId(id); setFulfillAsset(null); };
  const handleFulfill = async (id) => {
    if (!fulfillAsset) return;
    try {
      await dispatch(fulfillAssetRequest({ id, assetId: fulfillAsset.id })).unwrap();
      toast.success(t("asset:request_fulfilled"));
      setFulfillingId(null);
      dispatch(fetchAssets({ limit: 500 }));
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("asset:requests_title")}</h1>
            <p className="text-mutedForeground">{t("asset:requests_desc")}</p>
          </div>
          {checkRoleAuth(add_asset_request) && (
            <Button type="button" title={t("asset:new_request")} icon={FiPlus} onClick={() => setShowForm((v) => !v)}
              className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600" />
          )}
        </div>

        {showForm && (
          <div className="mb-6 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">{t("asset:new_request")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SelectDropdown
                label={t("asset:employee")}
                labelClass="!text-xs"
                required
                data={empOptions}
                selected={emp}
                setSelected={setEmp}
              />
              <SelectDropdown
                label={t("asset:category")}
                labelClass="!text-xs"
                required
                data={categoryOptions}
                selected={category}
                setSelected={setCategory}
              />
              <SelectDropdown
                label={t("asset:priority")}
                labelClass="!text-xs"
                data={assetRequestPriorityOptions}
                selected={priority}
                setSelected={setPriority}
                hideClear
              />
              <FormInput
                wrapperClass="sm:col-span-2 lg:col-span-3"
                label={t("asset:justification")}
                labelClass="!text-xs"
                required
                value={justification}
                onValueChange={setJustification}
                inputClass="!h-10 !rounded-lg"
                minLength={10}
                maxLength={500}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" title={t("asset:submit_request")} onClick={handleCreate}
                className="!w-auto !rounded-lg !h-10 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
              <Button type="button" title={t("cancel")} onClick={() => setShowForm(false)}
                className="!w-auto !rounded-lg !h-10 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
          <div className="mb-5 w-full sm:w-[220px]">
            <SelectDropdown
              data={assetRequestStatusFilterOptions}
              selected={assetRequestStatusFilterOptions.find((o) => o.id === statusFilter) || assetRequestStatusFilterOptions[0]}
              setSelected={(opt) => setStatusFilter(opt?.id ?? "all")}
              hideClear
              classes="!h-11 !rounded-lg"
            />
          </div>

          {requestsLoading ? (
            <SkeletonCards count={4} columns="grid-cols-1" />
          ) : !filteredRequests.length ? (
            <EmptyState title={t("asset:no_requests")} />
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((r) => (
                <div key={r.id} className="p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 dark:text-white">{r.employeeName}</p>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(r.status)}`}>{r.status}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityClass(r.priority)}`}>{r.priority}</span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-white/60 mt-1">
                        {r.categoryName || "—"} · {t("asset:requested_on")} {r.requestedDate ? String(r.requestedDate).slice(0, 10) : "—"}
                      </p>
                      {r.justification && <p className="text-sm text-slate-600 dark:text-white/70 mt-1">{r.justification}</p>}
                      {r.decidedBy && (
                        <p className="text-xs text-slate-400 mt-1">
                          {r.status} · {r.decidedDate ? String(r.decidedDate).slice(0, 10) : ""}{r.decisionNotes ? ` · ${r.decisionNotes}` : ""}
                        </p>
                      )}
                    </div>
                    {checkRoleAuth(approve_asset_request) && r.status === "Pending" && (
                      <div className="flex gap-2 shrink-0">
                        <button type="button" onClick={() => openDecide(r.id)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100">
                          {t("asset:review")}
                        </button>
                      </div>
                    )}
                    {checkRoleAuth(edit_asset_request) && r.status === "Approved" && (
                      <button type="button" onClick={() => openFulfill(r.id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 shrink-0 flex items-center gap-1.5">
                        <FiPackage className="h-3.5 w-3.5" /> {t("asset:fulfill_request")}
                      </button>
                    )}
                  </div>

                  {decidingId === r.id && (
                    <div className="mt-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                      <FormInput
                        value={decisionNotes}
                        onValueChange={setDecisionNotes}
                        placeholder={t("asset:decision_notes")}
                        inputClass="!h-9 !rounded-lg"
                        maxLength={500}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleDecide(r.id, "Approved")}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 flex items-center gap-1.5">
                          <FiCheck className="h-3.5 w-3.5" /> {t("asset:approve")}
                        </button>
                        <button type="button" onClick={() => handleDecide(r.id, "Rejected")}
                          className="px-4 py-1.5 rounded-lg bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 flex items-center gap-1.5">
                          <FiX className="h-3.5 w-3.5" /> {t("asset:reject")}
                        </button>
                        <button type="button" onClick={() => setDecidingId(null)}
                          className="px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-sm font-semibold text-slate-600 dark:text-white">
                          {t("cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {fulfillingId === r.id && (
                    <div className="mt-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                      <SelectDropdown
                        label={t("asset:select_asset_to_assign")}
                        labelClass="!text-xs"
                        data={availableAssetsFor(r.categoryId)}
                        selected={fulfillAsset}
                        setSelected={setFulfillAsset}
                        emptyMessage={t("asset:no_available_assets")}
                      />
                      <div className="flex gap-2">
                        <Button type="button" title={t("asset:confirm_assign")} onClick={() => handleFulfill(r.id)} disabled={!fulfillAsset}
                          className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40" />
                        <Button type="button" title={t("cancel")} onClick={() => setFulfillingId(null)}
                          className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetRequests;
