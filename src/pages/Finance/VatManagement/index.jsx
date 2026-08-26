import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import { useForm } from "react-hook-form";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchVatConfig,
  updateVatConfig,
  fetchVatSummary,
  showVatConfig,
  showVatConfigLoading,
  showVatSummary,
  showVatSummaryLoading,
} from "store/slices/financeSlice";
import FinancePage from "../FinancePage";
import { SkeletonDetail } from "components/Skeleton";

const { view_customer, add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

// VAT is tenant-wide config (rate + registration number) applied to every
// Customer Invoice / Vendor Bill at creation time — the report below isn't
// separately entered, it's read directly off the VAT Payable/Receivable
// ledger accounts those documents post to (same derived-report pattern as
// Financial Reports).
const VatManagement = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [tab, setTab] = useState("config");

  const vatConfig = useSelector(showVatConfig);
  const vatConfigLoading = useSelector(showVatConfigLoading);
  const vatSummary = useSelector(showVatSummary);
  const vatSummaryLoading = useSelector(showVatSummaryLoading);

  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 7) + "-01";
  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({ defaultValues: { rate: 0, registrationNumber: "" } });

  useEffect(() => {
    dispatch(fetchVatConfig());
  }, [dispatch]);

  useEffect(() => {
    reset({ rate: vatConfig.rate, registrationNumber: vatConfig.registrationNumber || "" });
  }, [vatConfig, reset]);

  useEffect(() => {
    if (tab === "report") dispatch(fetchVatSummary({ fromDate, toDate }));
  }, [dispatch, tab, fromDate, toDate]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await dispatch(updateVatConfig({ rate: parseFloat(data.rate) || 0, registrationNumber: data.registrationNumber }));
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:save_success"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FinancePage title={t("finance:vat_title")} description={t("finance:vat_desc")}>
      {checkRoleAuth(view_customer) && (
        <>
          <div className="flex gap-2 mb-6">
            {[
              { key: "config", label: t("finance:vat_config") },
              { key: "report", label: t("finance:vat_report") },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "config" && (
            vatConfigLoading ? (
              <SkeletonDetail fields={2} />
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] max-w-xl"
              >
                <div className="grid gap-6">
                  <FormInput label={`${t("finance:vat_rate")} %`} name="rate" type="number" step="0.01" min={0} max={100} decimal decimalPlaces={2} register={register} />
                  <FormInput label={t("finance:vat_registration_no")} name="registrationNumber" pattern={/[A-Za-z0-9\-/]/} maxLength={50} register={register} />
                </div>
                <p className="text-xs text-slate-400 mt-4">{t("finance:vat_config_hint")}</p>
                {checkRoleAuth(add_customer) && (
                  <div className="flex justify-end mt-6 pt-6 border-t border-slate-200 dark:border-white/20">
                    <Button type="submit" title={t("save")} btn="primary" disabled={submitting} />
                  </div>
                )}
              </form>
            )
          )}

          {tab === "report" && (
            <>
              <div className="flex flex-wrap gap-4 items-end mb-6 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:from_date")}</label>
                  <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{t("finance:to_date")}</label>
                  <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                    className="h-10 px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>

              {vatSummaryLoading ? (
                <SkeletonDetail fields={3} />
              ) : (
                <dl className="grid sm:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <dt className="text-sm text-mutedForeground">{t("finance:vat_output")}</dt>
                    <dd className="text-2xl font-bold tabular-nums mt-1 text-emerald-700 dark:text-emerald-300">{fmt(vatSummary.outputVat)}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
                    <dt className="text-sm text-mutedForeground">{t("finance:vat_input")}</dt>
                    <dd className="text-2xl font-bold tabular-nums mt-1 text-blue-700 dark:text-blue-300">{fmt(vatSummary.inputVat)}</dd>
                  </div>
                  <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 p-4">
                    <dt className="text-sm text-mutedForeground">{t("finance:vat_net")}</dt>
                    <dd className={`text-2xl font-bold tabular-nums mt-1 ${vatSummary.netVat >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(vatSummary.netVat)}</dd>
                  </div>
                </dl>
              )}
            </>
          )}
        </>
      )}
    </FinancePage>
  );
};

export default VatManagement;
