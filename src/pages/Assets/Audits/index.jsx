import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight, FiClipboard, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { assetAuditResultList } from "global/constant";
import {
  fetchAssetAudits,
  fetchActiveAssetAudit,
  startAssetAudit,
  recordAssetAuditResult,
  completeAssetAudit,
  showAssetAudits,
  showAssetAuditsLoading,
  showActiveAssetAudit,
  showActiveAssetAuditLoading,
} from "store/slices/assetSlice";
import { SkeletonTable, SkeletonList } from "components/Skeleton";
import { AuditLine } from "components/AuditMeta";

const { add_asset_audit } = alqadar_role_ids;

const RESULT_STYLES = {
  Pending: "bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50",
  Verified: "bg-emerald-500 text-white",
  Missing: "bg-rose-500 text-white",
  Damaged: "bg-amber-500 text-white",
};

const fmtDateTime = (v) => (v ? String(v).slice(0, 16).replace("T", " ") : "—");
const fmtDate = (v) => (v ? String(v).slice(0, 10) : "—");

const AssetAudits = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";
  const [notesDraft, setNotesDraft] = useState({});

  const audits = useSelector(showAssetAudits);
  const auditsLoading = useSelector(showAssetAuditsLoading);
  const active = useSelector(showActiveAssetAudit);
  const activeLoading = useSelector(showActiveAssetAuditLoading);
  const completedAudits = audits.filter((a) => a.status === "Completed");

  useEffect(() => {
    dispatch(fetchAssetAudits({ limit: 50 }));
    dispatch(fetchActiveAssetAudit());
  }, [dispatch]);

  const handleStart = async () => {
    try {
      await dispatch(startAssetAudit()).unwrap();
      toast.success(t("asset:audit_started"));
      dispatch(fetchAssetAudits({ limit: 50 }));
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  const setResult = async (assetId, status) => {
    try {
      await dispatch(recordAssetAuditResult({ id: active.id, assetId, data: { status, notes: notesDraft[assetId] || "" } })).unwrap();
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  const handleComplete = async () => {
    try {
      await dispatch(completeAssetAudit(active.id)).unwrap();
      toast.success(t("asset:audit_completed"));
      dispatch(fetchAssetAudits({ limit: 50 }));
    } catch (message) {
      toast.error(message || t("asset:action_failed"));
    }
  };

  const progress = active
    ? Math.round((active.results.filter((r) => r.status !== "Pending").length / active.results.length) * 100) || 0
    : 0;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("asset:audits_title")}</h1>
            <p className="text-mutedForeground">{t("asset:audits_desc")}</p>
          </div>
          {!active && checkRoleAuth(add_asset_audit) && (
            <Button type="button" title={t("asset:start_audit")} icon={FiClipboard} onClick={handleStart}
              className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-gradient-to-br !from-teal-500 !to-teal-600" />
          )}
        </div>

        {activeLoading ? (
          <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
            <SkeletonTable rows={5} columns={4} />
          </div>
        ) : active ? (
          <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:audit_in_progress")}</h2>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  {t("asset:started_on")} {fmtDateTime(active.startedAt)}
                </p>
              </div>
              <Button type="button" title={t("asset:complete_audit")} onClick={handleComplete}
                className="!w-auto !rounded-md !h-10 !px-5 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{t("asset:audit_progress")}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {active.results.map((r) => (
                <div key={r.assetId} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-800 dark:text-white/90 truncate">{r.assetName || "—"}</p>
                    <p className="text-xs text-slate-400 font-mono">{r.assetTag}</p>
                  </div>
                  <FormInput
                    value={notesDraft[r.assetId] ?? r.notes ?? ""}
                    onValueChange={(v) => setNotesDraft((p) => ({ ...p, [r.assetId]: v }))}
                    placeholder={t("asset:notes")}
                    wrapperClass="w-40"
                    inputClass="!h-8 !rounded-lg !text-xs !px-2"
                    maxLength={500}
                  />
                  <div className="flex gap-1.5 shrink-0">
                    {assetAuditResultList.filter((s) => s !== "Pending").map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setResult(r.assetId, s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${r.status === s ? RESULT_STYLES[s] : "bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 border border-slate-200 dark:border-white/10 hover:bg-slate-100"}`}
                      >
                        {t(`asset:audit_${s.toLowerCase()}`)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-10 text-center text-slate-400">
            <FiClipboard className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>{t("asset:no_active_audit")}</p>
          </div>
        )}

        {auditsLoading ? (
          <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5">{t("asset:audit_history")}</h2>
            <SkeletonList rows={3} />
          </div>
        ) : completedAudits.length > 0 && (
          <div className="mt-6 bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5">{t("asset:audit_history")}</h2>
            <div className="space-y-3">
              {completedAudits.map((session) => {
                const verified = session.results.filter((r) => r.status === "Verified").length;
                const missing = session.results.filter((r) => r.status === "Missing").length;
                const damaged = session.results.filter((r) => r.status === "Damaged").length;
                return (
                  <div key={session.id} className="p-4 rounded-xl border border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white/90">
                        {fmtDate(session.completedAt)} · {session.results.length} {t("asset:assets_title")}
                      </p>
                      <p className="text-xs text-slate-400">{t("asset:started_on")} {fmtDate(session.startedAt)}</p>
                      <AuditLine record={session} className="mt-1" />
                    </div>
                    <div className="flex gap-3 text-xs font-semibold shrink-0">
                      <span className="flex items-center gap-1 text-emerald-600"><FiCheckCircle className="h-3.5 w-3.5" /> {verified}</span>
                      <span className="flex items-center gap-1 text-rose-600"><FiXCircle className="h-3.5 w-3.5" /> {missing}</span>
                      <span className="flex items-center gap-1 text-amber-600"><FiAlertTriangle className="h-3.5 w-3.5" /> {damaged}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetAudits;
