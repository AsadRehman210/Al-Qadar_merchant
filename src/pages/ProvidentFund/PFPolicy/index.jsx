import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { FiSave, FiInfo, FiClock } from "react-icons/fi";
import FormInput from "components/FormInput";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { fetchPfPolicy, upsertPfPolicy, showPfPolicy, showPfPolicyLoading } from "store/slices/providentFundSlice";
import { SkeletonDetail } from "components/Skeleton";

const { edit_provident_fund } = alqadar_role_ids;

const DEFAULTS = { employeeRate: 10, employerRate: 12, employerContributionMultiplier: 1, minServiceMonths: 0, vestingYears: 0, interestRate: 0 };

const PFPolicy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const policy = useSelector(showPfPolicy);
  const policyLoading = useSelector(showPfPolicyLoading);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: DEFAULTS,
  });

  useEffect(() => {
    dispatch(fetchPfPolicy());
  }, [dispatch]);

  useEffect(() => {
    if (policy) {
      reset({
        employeeRate: policy.employeeRate,
        employerRate: policy.employerRate,
        employerContributionMultiplier: policy.employerContributionMultiplier ?? 1,
        minServiceMonths: policy.minServiceMonths || 0,
        vestingYears: policy.vestingYears || 0,
        interestRate: policy.interestRate || 0,
      });
    }
  }, [policy, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await dispatch(upsertPfPolicy({
        employeeRate: +data.employeeRate,
        employerRate: +data.employerRate,
        employerContributionMultiplier: +data.employerContributionMultiplier,
        minServiceMonths: +data.minServiceMonths,
        vestingYears: +data.vestingYears,
        interestRate: +data.interestRate,
      })).unwrap();
      setSaved(true);
      toast.success(t("pf:policy_saved"));
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error(err || t("pf:policy_save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkRoleAuth(edit_provident_fund)) return null;

  // Only the most recent previous version — enough to answer "what did I
  // just change this from", without turning the page into a full audit log.
  const previousPolicy = policy?.policyHistory?.length
    ? policy.policyHistory[policy.policyHistory.length - 1]
    : null;

  return (
    <div className="relative min-h-[60vh]">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0" />
      <div className="relative z-[1] max-w-2xl mx-auto">
        <button type="button" onClick={() => navigate("/provident-fund")}
          className="text-sm text-teal-600 hover:underline mb-5 inline-flex items-center gap-1">
          ← {t("pf:back_to_pf")}
        </button>
        <h1 className="text-3xl font-bold dark:text-white mb-2">{t("pf:pf_policy_settings")}</h1>
        <p className="text-mutedForeground mb-6">{t("pf:policy_settings_desc")}</p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <FiInfo className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{t("pf:policy_note")}</p>
        </div>

        {previousPolicy && (
          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-3">
            {t("pf:current_policy")}
          </p>
        )}
        {policyLoading && !policy ? (
          <SkeletonDetail fields={6} />
        ) : (
        <form onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label={`${t("pf:employee_rate")} (%)`} name="employeeRate" type="number" min={0} max={100} decimal decimalPlaces={2} register={register} errors={errors} required />
            <FormInput label={`${t("pf:employer_rate")} (%)`} name="employerRate" type="number" min={0} max={100} decimal decimalPlaces={2} register={register} errors={errors} required />
            <div>
              <FormInput
                label={t("pf:employer_multiplier")}
                name="employerContributionMultiplier"
                type="number"
                step="0.1"
                min={0}
                max={5}
                decimal
                decimalPlaces={1}
                register={register}
                errors={errors}
                required
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">{t("pf:employer_multiplier_hint")}</p>
            </div>
            <FormInput label={t("pf:min_service_months")} name="minServiceMonths" type="number" min={0} max={600} register={register} errors={errors} required />
            <FormInput label={t("pf:vesting_years")} name="vestingYears" type="number" min={0} max={50} register={register} errors={errors} required />
            <FormInput label={`${t("pf:interest_rate")} (% p.a.)`} name="interestRate" type="number" min={0} max={100} decimal decimalPlaces={2} register={register} errors={errors} required className="md:col-span-2" />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-white/20">
            {saved && <p className="text-emerald-600 text-sm self-center">✓ {t("pf:policy_saved")}</p>}
            <Button type="submit" title={t("pf:save_policy")} icon={FiSave} iconClass="h-4 w-4 text-white" btn="primary"
              disabled={submitting} loading={submitting}
              className="!rounded-md !h-11 !px-6 !bg-teal-500 !border-0" />
          </div>
        </form>
        )}

        {previousPolicy && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5" />
              {t("pf:previous_policy")}
              {previousPolicy.effectiveFrom && (
                <span className="normal-case font-normal">
                  · {t("pf:effective_until")} {dayjs(previousPolicy.effectiveFrom).format("DD MMM YYYY")}
                </span>
              )}
            </p>
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl p-8 opacity-70">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: `${t("pf:employee_rate")} (%)`, value: previousPolicy.employeeRate },
                  { label: `${t("pf:employer_rate")} (%)`, value: previousPolicy.employerRate },
                  { label: t("pf:employer_multiplier"), value: previousPolicy.employerContributionMultiplier },
                  { label: t("pf:min_service_months"), value: previousPolicy.minServiceMonths },
                  { label: t("pf:vesting_years"), value: previousPolicy.vestingYears },
                  { label: `${t("pf:interest_rate")} (% p.a.)`, value: previousPolicy.interestRate },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-sm text-linkText font-medium leading-6 mb-1">{label}</p>
                    <p className="h-[46px] flex items-center px-4 rounded-lg border border-[#E0E5F2] dark:border-white/10 bg-white/60 dark:bg-white/5 text-sm text-slate-700 dark:text-white/80">
                      {value ?? "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PFPolicy;
