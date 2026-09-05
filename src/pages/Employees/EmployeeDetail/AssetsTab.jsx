import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { HiOutlineCube } from "react-icons/hi2";
import { FiArrowRight, FiPackage, FiClock } from "react-icons/fi";
import SelectDropdown from "components/SelectDropdown";
import FormInput from "components/FormInput";
import Button from "components/Button";
import {
  fetchAssets,
  assignAsset,
  returnAsset,
  showAssets,
} from "store/slices/assetSlice";

const today = () => new Date().toISOString().slice(0, 10);

const statusClass = (s) => {
  const m = {
    "In use": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    "In storage": "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    Maintenance: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
    Disposed: "bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white/70",
  };
  return m[s] || m["In use"];
};

/**
 * Employee-side view into the Assets module — same assign/return actions
 * as Assets → AssetDetail, just entered from the employee's own page so HR
 * doesn't have to go find the right asset first.
 */
const AssetsTab = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [showAssign, setShowAssign] = useState(false);
  const [assetPick, setAssetPick] = useState(null);
  const [assignDate, setAssignDate] = useState(today());
  const [assignNotes, setAssignNotes] = useState("");
  const [returningId, setReturningId] = useState(null);
  const [returnDate, setReturnDate] = useState(today());
  const [returnReason, setReturnReason] = useState("");

  const employeeId = data?.id;
  const allAssets = useSelector(showAssets);

  useEffect(() => {
    dispatch(fetchAssets({ limit: 500 }));
  }, [dispatch]);

  const assignedAssets = allAssets.filter((a) => a.assignedToId === employeeId);
  const unassignedOptions = allAssets
    .filter((a) => !a.assignedToId && a.status !== "Disposed")
    .map((a) => ({ id: a.id, title: `${a.name} (${a.assetTag})` }));

  // Past assignments — an asset can vanish from `assignedAssets` once
  // returned, but the employee's history with it shouldn't disappear too.
  const pastAssignments = useMemo(
    () =>
      allAssets.flatMap((asset) =>
        (asset.assignmentHistory || [])
          .filter((h) => h.employeeId === employeeId && h.returnDate)
          .map((h) => ({ asset, entry: h })),
      ),
    [allAssets, employeeId],
  );

  const handleAssign = async () => {
    if (!assetPick) return;
    try {
      await dispatch(assignAsset({ id: assetPick.id, data: { employeeId, assignedDate: assignDate, notes: assignNotes } })).unwrap();
      toast.success(t("employees:asset_assigned"));
      setShowAssign(false);
      setAssetPick(null);
      setAssignNotes("");
    } catch (message) {
      toast.error(message || t("employees:action_failed"));
    }
  };

  const openReturn = (assetId) => {
    setReturningId(assetId);
    setReturnDate(today());
    setReturnReason("");
  };

  const handleConfirmReturn = async (assetId) => {
    try {
      await dispatch(returnAsset({ id: assetId, data: { returnDate, notes: returnReason } })).unwrap();
      toast.success(t("employees:asset_returned"));
      setReturningId(null);
    } catch (message) {
      toast.error(message || t("employees:action_failed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent dark:from-teal-500/20 dark:via-emerald-500/10 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-teal-500/20 dark:bg-teal-500/30 translate-x-1/4 -translate-y-1/4" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineCube className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("employees:assigned_assets")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60">
                {assignedAssets.length} {t("employees:currently_assigned")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            title={t("employees:assign_asset")}
            icon={FiPackage}
            onClick={() => setShowAssign((v) => !v)}
            className="!w-auto !rounded-md !h-10 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600"
          />
        </div>
      </div>

      {showAssign && (
        <div className="p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
          <h4 className="font-semibold text-slate-800 dark:text-white">{t("employees:assign_asset")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectDropdown
              label={t("employees:select_asset")}
              required
              data={unassignedOptions}
              selected={assetPick}
              setSelected={setAssetPick}
              emptyMessage={t("employees:no_unassigned_assets")}
              labelClass="!text-xs"
            />
            <FormInput
              label={t("employees:assignment_date")}
              type="date"
              value={assignDate}
              onValueChange={setAssignDate}
              inputClass="!h-10"
              labelClass="!text-xs"
            />
            <FormInput
              label={t("employees:notes")}
              value={assignNotes}
              onValueChange={setAssignNotes}
              inputClass="!h-9"
              labelClass="!text-xs"
              wrapperClass="sm:col-span-2"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              title={t("employees:confirm_assign")}
              onClick={handleAssign}
              disabled={!assetPick}
              className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40"
            />
            <Button
              type="button"
              title={t("cancel")}
              onClick={() => setShowAssign(false)}
              className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white"
            />
          </div>
        </div>
      )}

      {assignedAssets.length === 0 ? (
        <div className="text-center py-14 text-slate-400 dark:text-white/40">
          <HiOutlineCube className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>{t("employees:no_assets_assigned")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignedAssets.map((asset) => {
            const latest = (asset.assignmentHistory || [])[0];
            return (
              <div
                key={asset.id}
                className="rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5 p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{asset.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{asset.assetTag}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusClass(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-white/60">
                  {asset.categoryName || "—"} · {t("employees:assigned_since")} {asset.assignedDate ? String(asset.assignedDate).slice(0, 10) : "—"}
                </p>
                {latest?.notes && (
                  <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{latest.notes}</p>
                )}

                {returningId === asset.id ? (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 space-y-2">
                    <FormInput
                      label={t("employees:return_date")}
                      type="date"
                      value={returnDate}
                      onValueChange={setReturnDate}
                      inputClass="!h-9"
                      labelClass="!text-xs"
                    />
                    <FormInput
                      label={t("employees:return_reason")}
                      value={returnReason}
                      onValueChange={setReturnReason}
                      inputClass="!h-9"
                      labelClass="!text-xs"
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmReturn(asset.id)}
                        className="flex-1 h-8 rounded-lg bg-amber-500 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        {t("employees:confirm_return")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReturningId(null)}
                        className="flex-1 h-8 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-semibold text-slate-600 dark:text-white"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => openReturn(asset.id)}
                      className="flex-1 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                    >
                      {t("employees:return_asset")}
                    </button>
                    <Link
                      to={`/assets/detail/${asset.id}`}
                      className="flex-1 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/20 flex items-center justify-center gap-1"
                    >
                      {t("employees:view_asset")} <FiArrowRight className="h-3 w-3 rtl:rotate-180" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Past Assignments — assets this employee held before but has since
          returned. Kept visible instead of disappearing on return. */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white/90 mb-3">
          <FiClock className="h-4 w-4" />
          {t("employees:past_assignments")}
        </h4>
        {pastAssignments.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-white/40">{t("employees:no_past_assignments")}</p>
        ) : (
          <div className="space-y-2">
            {pastAssignments.map(({ asset, entry }) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white/90">{asset.name}</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {String(entry.assignedDate || "").slice(0, 10)} → {String(entry.returnDate || "").slice(0, 10)}
                    {entry.notes ? ` · ${entry.notes}` : ""}
                  </p>
                </div>
                <Link
                  to={`/assets/detail/${asset.id}`}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-300 hover:underline shrink-0"
                >
                  {t("employees:view_asset")}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetsTab;
