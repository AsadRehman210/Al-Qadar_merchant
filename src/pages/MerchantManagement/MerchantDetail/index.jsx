import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import {
  FiArrowLeft, FiArrowRight, FiEdit2,
  FiUser, FiCreditCard, FiSettings,
  FiAlertCircle, FiClock, FiCheckCircle, FiPlus, FiX,
  FiLink, FiLock, FiUnlock,
} from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { SkeletonDetail, SkeletonTable } from "components/Skeleton";
import { PAYMENT_METHOD_OPTS, isMerchantExpired } from "../merchantFakeData";
import {
  showMerchantById,
  fetchMerchantById,
  showMerchantLoading,
  recordMerchantPayment,
  fetchMerchantPaymentHistory,
  showMerchantPaymentHistory,
  showMerchantPaymentHistoryLoading,
  clearMerchantPaymentHistory,
  clearCurrentMerchant,
  unlockMerchantErp,
  unlockOpeningStockMerchantErp,
} from "store/slices/merchantSlice";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";

const { view_merchant_management, edit_merchant_management } = alqadar_role_ids;

const formatTs = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const statusColor = (s) => {
  if (s === "active")   return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (s === "inactive") return "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/50";
  return "bg-slate-100 text-slate-600";
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
    <span className="text-sm text-slate-500 dark:text-white/50 sm:w-44 shrink-0">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value || "—"}</span>
  </div>
);

const DEFAULT_THEME_COLOR = "#3643AB";

const ThemeColorRow = ({ label, color, defaultLabel }) => {
  const display = color || DEFAULT_THEME_COLOR;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
      <span className="text-sm text-slate-500 dark:text-white/50 sm:w-44 shrink-0">{label}</span>
      <span className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
        <span
          className="inline-block w-6 h-6 rounded-md border border-slate-200 dark:border-white/20 shrink-0"
          style={{ backgroundColor: display }}
        />
        <span>{color || defaultLabel}</span>
      </span>
    </div>
  );
};

const SummaryCard = ({ label, value, color = "teal" }) => {
  const colors = {
    teal:   "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20 text-teal-700 dark:text-teal-300",
    blue:   "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300",
    amber:  "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300",
    red:    "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300",
    purple: "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs mb-1 opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
};

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
};

const RecordPaymentForm = ({ merchant, onClose }) => {
  const { t } = useTranslation("merchant");
  const dispatch = useDispatch();
  const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(() => addMonths(new Date().toISOString().split("T")[0], 1));
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [amount, setAmount] = useState(merchant.planAmount || 0);
  const [selMethod, setSelMethod] = useState(PAYMENT_METHOD_OPTS[0]);
  const [ref, setRef]       = useState("");
  const [notes, setNotes]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDateChange = (v) => {
    setDate(v);
    if (!expiryTouched) setExpiryDate(addMonths(v, 1));
  };

  const handleExpiryChange = (v) => {
    setExpiryDate(v);
    setExpiryTouched(true);
  };

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (expiryDate && date && expiryDate < date) {
      toast.error(t("expiry_after_payment", { defaultValue: "Expiry date must be on or after the payment date." }));
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(recordMerchantPayment({
        id: merchant.id,
        data: { amount: Number(amount), method: selMethod?.id, reference: ref, notes, date, expiryDate },
      })).unwrap();
      dispatch(fetchMerchantPaymentHistory(merchant.id));
      dispatch(fetchMerchantById(merchant.id));
      toast.success(t("payment_recorded"));
      onClose();
    } catch (err) {
      toast.error(err || t("payment_record_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">{t("record_payment_title")}</h4>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><FiX size={18} /></button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormInput
          label={t("date")}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          type="date"
          required
          max={today}
          value={date}
          onValueChange={handleDateChange}
          inputClass="!h-10 !rounded-lg"
        />
        <FormInput
          label={t("expiry_date", { defaultValue: "Expiry Date" })}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          type="date"
          required
          min={date}
          value={expiryDate}
          onValueChange={handleExpiryChange}
          inputClass="!h-10 !rounded-lg"
        />
        <FormInput
          label={`${t("amount")} (${merchant.currency || "SAR"})`}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          type="number"
          decimal
          decimalPlaces={3}
          required
          min={0.01}
          maxLength={10}
          value={amount}
          onValueChange={setAmount}
          inputClass="!h-10 !rounded-lg"
        />
        <SelectDropdown
          label={t("method")}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          required
          data={PAYMENT_METHOD_OPTS}
          selected={selMethod}
          setSelected={setSelMethod}
          hideClear
          classes="!h-[40px] !rounded-lg"
        />
        <FormInput
          label={t("reference")}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          value={ref}
          onValueChange={setRef}
          placeholder="TXN-XXXXXX"
          pattern={/[A-Za-z0-9\-/]/}
          minLength={2}
          maxLength={100}
          inputClass="!h-10 !rounded-lg"
        />
        <FormInput
          wrapperClass="sm:col-span-2"
          label={t("notes")}
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          value={notes}
          onValueChange={setNotes}
          placeholder="Optional notes..."
          inputClass="!h-10 !rounded-lg"
        />
        <div className="flex items-end gap-2">
          <button type="submit" disabled={submitting} className="h-10 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">{t("record_payment")}</button>
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-sm font-medium">{t("cancel", { ns: "translation" })}</button>
        </div>
      </form>
    </div>
  );
};

const MerchantDetail = () => {
  const { t, i18n } = useTranslation("merchant");
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const { id }      = useParams();
  const isRTL       = i18n.language === "ar";

  const merchant = useSelector(showMerchantById(id));
  const merchantLoading = useSelector(showMerchantLoading);
  const serverPayments = useSelector(showMerchantPaymentHistory);
  const paymentsLoading = useSelector(showMerchantPaymentHistoryLoading);

  // `merchantLoading` alone can't gate the not-found state: on a direct load
  // it is still false during the first render, before the fetch below is
  // dispatched. This flips only once that fetch has actually settled.
  const [detailSettled, setDetailSettled] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockingOpening, setUnlockingOpening] = useState(false);

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      await dispatch(unlockMerchantErp(id)).unwrap();
      toast.success(t("account_unlocked", { defaultValue: "Account unlocked successfully." }));
    } catch (err) {
      toast.error(err || t("action_failed", { ns: "translation", defaultValue: "Action failed." }));
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockOpeningStock = async () => {
    setUnlockingOpening(true);
    try {
      await dispatch(unlockOpeningStockMerchantErp(id)).unwrap();
      toast.success(t("opening_stock_unlocked", { ns: "merchant" }));
    } catch (err) {
      toast.error(err || t("action_failed", { ns: "translation", defaultValue: "Action failed." }));
    } finally {
      setUnlockingOpening(false);
    }
  };

  useEffect(() => {
    // Always fetch full detail — the list page's Redux cache only carries
    // the lighter list DTO (see merchant-service.getAll), missing fields
    // this page needs (country, city, address, phone, etc).
    let active = true;
    setDetailSettled(false);
    dispatch(fetchMerchantById(id)).finally(() => {
      if (active) setDetailSettled(true);
    });
    return () => {
      active = false;
      dispatch(clearCurrentMerchant());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (merchant?.id) dispatch(fetchMerchantPaymentHistory(merchant.id));
    return () => dispatch(clearMerchantPaymentHistory());
  }, [merchant?.id, dispatch]);

  const displayedPayments = serverPayments.map((p) => ({
    id: p.id,
    date: p.periodStart ? p.periodStart.split("T")[0] : "",
    expiryDate: p.periodEnd ? p.periodEnd.split("T")[0] : "",
    amount: p.amount,
    method: p.method,
    reference: p.reference,
    notes: p.notes,
    status: "Confirmed",
  }));

  if (!checkRoleAuth(view_merchant_management)) return null;

  if (!merchant) {
    // Never claim "not found" while the detail fetch is still in flight.
    if (merchantLoading || !detailSettled) {
      return (
        <div className="space-y-6">
          <SkeletonDetail fields={10} />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <FiAlertCircle size={48} className="text-red-400" />
        <p className="text-lg font-medium text-slate-600 dark:text-white/60">{t("not_found")}</p>
        <Button type="button" title="Back" onClick={() => navigate("/merchant-management")} btn="primary" />
      </div>
    );
  }

  const tabCls = ({ selected }) =>
    `px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none flex items-center gap-2 ${
      selected
        ? "bg-[var(--color-teal-500)] text-white shadow-sm"
        : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
    }`;

  return (
    <div className="relative min-h-[60vh]">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start gap-4 dark:text-white">
        <Button
          type="button"
          onClick={() => navigate("/merchant-management")}
          icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 mt-1"
          iconClass="!text-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{merchant.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(merchant.status)}`}>{merchant.status}</span>
            {isMerchantExpired(merchant) && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                {t("expired")}
              </span>
            )}
            {merchant.isLocked && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 flex items-center gap-1">
                <FiLock size={11} />{t("locked", { defaultValue: "Locked" })}
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm">{merchant.code} · {merchant.businessCategory} · {merchant.email}</p>
        </div>
        {checkRoleAuth(edit_merchant_management) && (
          <Button
            type="button"
            title={t("edit_merchant")}
            icon={FiEdit2}
            onClick={() => navigate(`/merchant-management/edit/${id}`)}
            btn="primary"
            className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
          />
        )}
      </div>

      {/* Tabs */}
      <TabGroup>
        <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 mb-6">
          <Tab className={tabCls}><FiUser size={14} />{t("tab_overview")}</Tab>
          <Tab className={tabCls}><FiCreditCard size={14} />{t("tab_payments")}</Tab>
          <Tab className={tabCls}><FiSettings size={14} />{t("tab_account")}</Tab>
        </TabList>

        <TabPanels>
          {/* -- TAB 1: Overview -- */}
          <TabPanel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <SummaryCard label={t("total_paid")} value={`${(merchant.paidAmount || 0).toLocaleString()} ${merchant.currency || "SAR"}`} color="teal" />
              <SummaryCard
                label={t("payment_expiry")}
                value={merchant.portalExpiryDate ? String(merchant.portalExpiryDate).slice(0, 10) : "—"}
                color={isMerchantExpired(merchant) ? "red" : "blue"}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("basic_info")}</h3>
                <InfoRow label={t("code")} value={merchant.code} />
                <InfoRow label={t("name")} value={merchant.name} />
                <InfoRow label={t("email")} value={merchant.email} />
                <InfoRow label={t("phone")} value={merchant.phone} />
                <InfoRow label={t("category")} value={merchant.businessCategory} />
                <ThemeColorRow
                  label={t("theme_color", { defaultValue: "Theme color" })}
                  color={merchant.themeColor}
                  defaultLabel={`${DEFAULT_THEME_COLOR} (${t("use_default", { defaultValue: "Use default" })})`}
                />
                <InfoRow label={t("country")} value={merchant.country} />
                <InfoRow label={t("city")} value={merchant.city} />
                <InfoRow label={t("address")} value={merchant.address} />
                <InfoRow label={t("tax_number")} value={merchant.taxNumber} />
                {merchant.website && <InfoRow label={t("website")} value={merchant.website} />}
              </div>

              <div className="space-y-5">
                {/* Linked Admin */}
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiLink size={15} className="text-blue-500" />{t("linked_admin_view")}
                  </h3>
                  {merchant.adminName ? (
                    <p className="font-medium text-slate-900 dark:text-white">{merchant.adminName}</p>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                      <FiAlertCircle className="text-amber-500 shrink-0" size={18} />
                      <p className="text-sm text-amber-700 dark:text-amber-300">{t("no_admin_hint")}</p>
                    </div>
                  )}
                </div>

                {/* Billing */}
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("payment_plan")}</h3>
                  <InfoRow
                    label={t("payment_expiry")}
                    value={
                      merchant.portalExpiryDate
                        ? `${String(merchant.portalExpiryDate).slice(0, 10)}${isMerchantExpired(merchant) ? ` (${t("expired")})` : ""}`
                        : "—"
                    }
                  />
                  <InfoRow label={t("last_payment")} value={merchant.lastPaymentDate ? String(merchant.lastPaymentDate).slice(0, 10) : "—"} />
                  <InfoRow label={t("created_at")} value={merchant.createdAt ? String(merchant.createdAt).slice(0, 10) : "—"} />
                  <InfoRow label={t("created_by")} value={merchant.createdByName} />
                  <InfoRow label={t("updated_by")} value={merchant.updatedByName} />
                  <InfoRow label={t("currency")} value={merchant.currency} />
                </div>
              </div>
            </div>
          </TabPanel>

          {/* -- TAB 2: Payments -- */}
          <TabPanel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <SummaryCard label={t("total_paid")} value={`${(merchant.paidAmount || 0).toLocaleString()} ${merchant.currency || "SAR"}`} color="teal" />
              <SummaryCard
                label={t("payment_expiry")}
                value={merchant.portalExpiryDate ? String(merchant.portalExpiryDate).slice(0, 10) : "—"}
                color={isMerchantExpired(merchant) ? "red" : "blue"}
              />
            </div>

            {!showRecordForm ? (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setShowRecordForm(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors"
                >
                  <FiPlus size={14} />{t("record_payment")}
                </button>
              </div>
            ) : (
              <RecordPaymentForm merchant={merchant} onClose={() => setShowRecordForm(false)} />
            )}

            {/* Received Payments */}
            <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 mb-5">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/10">
                <h3 className="font-semibold text-slate-900 dark:text-white">{t("received_payments")}</h3>
              </div>
              {paymentsLoading ? (
                <div className="p-4">
                  <SkeletonTable rows={4} columns={7} />
                </div>
              ) : displayedPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                  <FiCreditCard size={32} />
                  <p className="text-sm">No payments recorded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                        <th className="px-6 py-3">{t("date")}</th>
                        <th className="px-4 py-3">{t("expiry_date", { defaultValue: "Expiry Date" })}</th>
                        <th className="px-4 py-3">{t("amount")}</th>
                        <th className="px-4 py-3">{t("method")}</th>
                        <th className="px-4 py-3">{t("reference")}</th>
                        <th className="px-4 py-3">{t("payment_status")}</th>
                        <th className="px-4 py-3">{t("notes")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPayments.map((p) => (
                        <tr key={p.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                          <td className="px-6 py-3 text-slate-600 dark:text-white/70">{p.date}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-white/70">{p.expiryDate}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{p.amount?.toLocaleString()} {merchant.currency || "SAR"}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-white/70">{p.method}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.reference || "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "Confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{p.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </TabPanel>

          {/* -- TAB 3: Account -- */}
          <TabPanel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("account_info")}</h3>
                <InfoRow label="Username" value={merchant.email} />
                <InfoRow label={t("status")} value={merchant.status} />
                <InfoRow label={t("created_at")} value={formatTs(merchant.createdAt)} />
                <p className="text-xs text-slate-400 mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">{t("username_hint")}</p>
                {merchant.isLocked && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                      <FiLock size={14} />
                      {t("locked_hint", { defaultValue: "This account is locked after 3 failed login attempts." })}
                    </p>
                    <Button
                      type="button"
                      title={t("unlock_account", { defaultValue: "Unlock Account" })}
                      icon={FiUnlock}
                      onClick={handleUnlock}
                      loading={unlocking}
                      disabled={unlocking}
                      className="!w-auto !rounded-md !bg-red-600 hover:!bg-red-700 !border-0 !text-white"
                    />
                  </div>
                )}
                {merchant.openingStockImported && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      {t("unlock_opening_stock_hint", { ns: "merchant" })}
                    </p>
                    {merchant.openingStockImportedAt && (
                      <p className="text-xs text-amber-700 dark:text-amber-300/80 mb-3">
                        {t("opening_imported_on", { ns: "merchant", date: String(merchant.openingStockImportedAt).slice(0, 10) })}
                      </p>
                    )}
                    <Button
                      type="button"
                      title={t("unlock_opening_stock", { ns: "merchant" })}
                      icon={FiUnlock}
                      onClick={handleUnlockOpeningStock}
                      loading={unlockingOpening}
                      disabled={unlockingOpening}
                      className="!w-auto !rounded-md !bg-amber-600 hover:!bg-amber-700 !border-0 !text-white"
                    />
                  </div>
                )}
              </div>
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">{t("credentials", { ns: "admin" })}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <FiCheckCircle className="text-emerald-500 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Email Verified</p>
                      <p className="text-xs text-slate-400">{merchant.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <FiClock className="text-amber-500 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">Password</p>
                      <p className="text-xs text-slate-400">Last updated: {merchant.createdAt ? String(merchant.createdAt).slice(0, 10) : "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/10">
                  {checkRoleAuth(edit_merchant_management) && (
                    <Button
                      type="button"
                      title={t("change_password", { ns: "admin" })}
                      onClick={() => navigate(`/merchant-management/edit/${id}`)}
                      className="!rounded-md !bg-slate-100 dark:!bg-white/10 !text-slate-700 dark:!text-white !border-slate-200 dark:!border-white/20 text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default MerchantDetail;
