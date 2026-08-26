import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import moment from "moment";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import Datepicker from "components/Datepicker";
import Button from "components/Button";
import Calender from "images/icons/calender.png";
import { createEmployee, updateEmployee } from "store/slices/employeeSlice";
import { updateDepartment } from "store/slices/departmentSlice";
import { fetchCurrentSalary, showCurrentSalary, clearCurrentSalary } from "store/slices/salarySlice";
import { fetchPfPolicy, showPfPolicy } from "store/slices/providentFundSlice";
import { erpPost } from "api/erpClient";
import { erpUrls } from "global/config";
import {
  HiOutlineCurrencyDollar,
  HiOutlineMinusCircle,
  HiOutlinePlusCircle,
} from "react-icons/hi2";

const PAYMENT_STATUS_OPTIONS = [
  { id: "pending", title: "Pending" },
  { id: "processing", title: "Processing" },
  { id: "paid", title: "Paid" },
];

import { salaryAllowanceKeys as ALLOWANCE_KEYS, salaryDeductionKeys as DEDUCTION_KEYS } from "global/constant";

const Salary = ({ setSelectedIndex, id }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, watch, getValues, setValue, trigger, formState: { errors } } = useFormContext();
  const [selPaymentStatus, setSelPaymentStatus] = useState(PAYMENT_STATUS_OPTIONS[0]);
  const [selPaymentDate, setSelPaymentDate] = useState("");
  const [selEffectiveFrom, setSelEffectiveFrom] = useState("");
  const [selEffectiveTo, setSelEffectiveTo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentSalary = useSelector(showCurrentSalary);
  const pfPolicy = useSelector(showPfPolicy);

  // Editing an existing employee — load their real, already-set salary
  // record so this step opens pre-filled instead of showing the blank/fake
  // defaults every time.
  useEffect(() => {
    if (id) dispatch(fetchCurrentSalary(id));
    dispatch(fetchPfPolicy());
    return () => dispatch(clearCurrentSalary());
  }, [id, dispatch]);

  // No salary set up yet (brand new employee, or an existing one who never
  // had one) — default PF % to the tenant's PF Policy rate instead of 0, so
  // it doesn't have to be typed in every single time. Once a real salary
  // record loads, the effect below overrides this with whatever was
  // actually saved for that employee.
  useEffect(() => {
    if (currentSalary || !pfPolicy) return;
    setValue("pf_percentage", pfPolicy.employeeRate ?? 0);
  }, [pfPolicy, currentSalary, setValue]);

  useEffect(() => {
    if (!currentSalary || currentSalary.employeeId !== id) return;

    setValue("basic_salary", currentSalary.basic_salary ?? 0);
    ALLOWANCE_KEYS.forEach((key) => setValue(key, currentSalary.allowances?.[key] ?? 0));
    DEDUCTION_KEYS.forEach((key) => setValue(key, currentSalary.deductions?.[key] ?? 0));

    // Tax/PF percentages are saved on the record itself now (alongside the
    // computed amount) — no need to reverse-derive them from the amount.
    setValue("tax_percentage", currentSalary.tax_percentage ?? 0);
    setValue("pf_percentage", currentSalary.pf_percentage ?? 0);

    setValue("bank_name", currentSalary.bank_name || "");
    setValue("branch_name", currentSalary.branch_name || "");
    setValue("branch_code", currentSalary.branch_code || "");
    setValue("account_no", currentSalary.account_no || "");
    setValue("ifsc", currentSalary.ifsc || "");
    setValue("pf_number", currentSalary.pf_number || "");
    setValue("salary_notes", currentSalary.salary_notes || "");

    const status =
      PAYMENT_STATUS_OPTIONS.find((o) => o.id === currentSalary.payment_status) ||
      PAYMENT_STATUS_OPTIONS[0];
    setSelPaymentStatus(status);
    setValue("payment_status", status.id);

    const toDDMMYYYY = (d) => (d ? moment(d).format("DD-MM-YYYY") : "");
    const pDate = toDDMMYYYY(currentSalary.payment_date);
    setSelPaymentDate(pDate);
    setValue("payment_date", pDate);

    const eFrom = toDDMMYYYY(currentSalary.effective_from);
    setSelEffectiveFrom(eFrom);
    setValue("salary_effective_from", eFrom);

    const eTo = toDDMMYYYY(currentSalary.effective_to);
    setSelEffectiveTo(eTo);
    setValue("salary_effective_to", eTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSalary, id]);

  const watchedValues = watch();

  const totalAllowances = ALLOWANCE_KEYS.reduce(
    (sum, key) => sum + (parseFloat(watchedValues[key]) || 0),
    0,
  );
  const totalDeductions = DEDUCTION_KEYS.reduce(
    (sum, key) => sum + (parseFloat(watchedValues[key]) || 0),
    0,
  );
  const basicSalary = parseFloat(watchedValues.basic_salary) || 0;
  const grossSalary = basicSalary + totalAllowances;
  const netSalary = grossSalary - totalDeductions;
  const overtimeRate = parseFloat(watchedValues.designation_overtime_rate) || 0;

  // Tax is entered as a % of gross salary — the actual amount (what
  // deductions.tax stores) is always derived, never typed directly.
  const taxPercentage = parseFloat(watchedValues.tax_percentage) || 0;
  const computedTax = Math.round((grossSalary * taxPercentage) / 100);
  useEffect(() => {
    setValue("tax", computedTax);
  }, [computedTax, setValue]);

  // Provident Fund is entered as a % of basic salary (the standard EPF/PF
  // convention, and what Payroll Processing's own computeLine already
  // assumed) — same derived-amount pattern as tax.
  const pfPercentage = parseFloat(watchedValues.pf_percentage) || 0;
  const computedPf = Math.round((basicSalary * pfPercentage) / 100);
  useEffect(() => {
    setValue("provident_fund", computedPf);
  }, [computedPf, setValue]);

  // Upload fields end up in different shapes depending on how the picker
  // registers its value: a plain File (UploadSingleFile's setValue), a
  // FileList (the raw, un-wired native input), or an array (UploadMultipleFile).
  // Normalize to a flat array of real Files.
  const asFileArray = (value) => {
    if (!value) return [];
    if (value instanceof File) return [value];
    return Array.from(value).filter((f) => f instanceof File);
  };

  // DD-MM-YYYY (what every Datepicker in this wizard stores) -> YYYY-MM-DD
  // (what the backend's `new Date(...)` parsing expects).
  const toIso = (d) => (d ? moment(d, "DD-MM-YYYY").format("YYYY-MM-DD") : undefined);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = getValues();

      // File inputs don't carry a displayable URL — turn selected files into
      // preview URLs, otherwise store null so downstream views render an
      // empty state instead of erroring. No real file-upload endpoint exists
      // on the backend, so these blob: URLs are session-local only, same
      // limitation the previous fake-data version already had.
      const selectedFile = asFileArray(formData.image)[0];
      const image = selectedFile
        ? URL.createObjectURL(selectedFile)
        : (typeof formData.image === "string" ? formData.image : null);

      const resumeFile = asFileArray(formData.resume)[0];
      const resume = resumeFile
        ? { name: resumeFile.name, url: URL.createObjectURL(resumeFile) }
        : null;

      const idProofFile = asFileArray(formData.id_proof)[0];
      const id_proof = idProofFile
        ? { name: idProofFile.name, url: URL.createObjectURL(idProofFile) }
        : null;

      const certificateFiles = asFileArray(formData.certificate_documents);
      const certificate_documents = certificateFiles.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
      }));

      const employeePayload = {
        employeeCode: formData.employeeCode || undefined,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        gender: formData.gender || undefined,
        dob: toIso(formData.dob),
        address: formData.address || undefined,
        emergency_contact: formData.emergency_contact || undefined,
        blood_group: formData.blood_group || undefined,
        marital_status: formData.marital_status || undefined,
        nationality: formData.nationality || undefined,
        national_id: formData.national_id || undefined,
        national_id_expiry: toIso(formData.national_id_expiry),
        nationality_type: formData.nationality_type || undefined,
        work_permit_no: formData.work_permit_no || undefined,
        work_permit_expiry: toIso(formData.work_permit_expiry),
        image,
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        weekly_schedule: formData.weekly_schedule,
        joining_date: toIso(formData.joining_date),
        managerEmployeeId: formData.managerEmployeeId || undefined,
        work_location: formData.work_location || undefined,
        employment_type: formData.employment_type || undefined,
        probation_end: toIso(formData.probation_end),
        status: formData.status,
        resignation_date: toIso(formData.resignation_date),
        retirement_date: toIso(formData.retirement_date),
        termination_date: toIso(formData.termination_date),
        last_seen_date: toIso(formData.last_seen_date),
        education: (formData.education || [])
          .filter((item) => item.degree_name)
          .map((item) => ({ ...item, end_date: toIso(item.end_date) })),
        certificates: (formData.certificates || [])
          .filter((item) => item.certificate_name)
          .map((item) => ({
            ...item,
            issue_date: toIso(item.issue_date),
            expiry_date: item.no_expiry ? undefined : toIso(item.expiry_date),
          })),
        skills: (formData.skills || [])
          .filter((item) => item.skill_name)
          .map((item) => ({
            ...item,
            years_experience:
              item.years_experience === "" || item.years_experience === undefined || item.years_experience === null
                ? undefined
                : Number(item.years_experience),
          })),
        documents: { resume, id_proof, certificate_documents },
      };

      let employeeId = id;
      if (id) {
        await dispatch(updateEmployee({ id, data: employeePayload })).unwrap();
      } else {
        const created = await dispatch(createEmployee(employeePayload)).unwrap();
        employeeId = created.id;
      }

      // "Set as Head of Department" (OfficialDetails.jsx) is an action, not a
      // stored Employee field — acted on here, once the employee record
      // itself exists. The backend still rejects a non-active employee (see
      // department-service.ts hodEmployeeIsActive), so this can fail without
      // the overall employee save having failed.
      if (formData.setAsHod && formData.departmentId) {
        try {
          await dispatch(
            updateDepartment({ id: formData.departmentId, data: { hodEmployeeId: employeeId } }),
          ).unwrap();
        } catch (hodErr) {
          toast.error(hodErr || t("employees:set_as_hod_failed"));
        }
      }

      // Salary is its own backend resource (/api/salary), separate from
      // Employee — posted directly here (rather than through a slice) since
      // this wizard step is the initial-salary-setup part of employee
      // creation, not the dedicated Salary module's own CRUD (that module's
      // own task owns fetching/listing/updating salary records later).
      if (formData.basic_salary) {
        const salaryPayload = {
          employeeId,
          basic_salary: Number(formData.basic_salary) || 0,
          allowances: Object.fromEntries(ALLOWANCE_KEYS.map((key) => [key, Number(formData[key]) || 0])),
          deductions: Object.fromEntries(DEDUCTION_KEYS.map((key) => [key, Number(formData[key]) || 0])),
          tax_percentage: Number(formData.tax_percentage) || 0,
          pf_percentage: Number(formData.pf_percentage) || 0,
          bank_name: formData.bank_name || undefined,
          branch_name: formData.branch_name || undefined,
          branch_code: formData.branch_code || undefined,
          account_no: formData.account_no || undefined,
          ifsc: formData.ifsc || undefined,
          pf_number: formData.pf_number || undefined,
          payment_status: formData.payment_status || undefined,
          payment_date: toIso(formData.payment_date),
          effective_from: toIso(formData.salary_effective_from) || employeePayload.joining_date || moment().format("YYYY-MM-DD"),
          effective_to: toIso(formData.salary_effective_to),
          salary_notes: formData.salary_notes || undefined,
        };
        const salaryRes = await erpPost(erpUrls.salaries, salaryPayload);
        if (!salaryRes?.success) {
          toast.error(salaryRes?.message || t("employees:salary_save_failed"));
        }
      }

      toast.success(id ? t("employees:update_success") : t("employees:save_success"));
      navigate(`/employees/details/${employeeId}`);
    } catch (err) {
      toast.error(err || t("employees:save_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="space-y-8">
        {/* Basic Salary Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-gradient-to-br from-teal-50 to-emerald-50/50 dark:from-teal-500/10 dark:to-emerald-500/5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineCurrencyDollar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("employees:basic_salary")}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t("employees:basic_salary")}
              name="basic_salary"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <div>
              <label className="text-sm text-linkText font-medium leading-6 mb-1 flex items-center">
                {t("employees:overtime_rate")}
              </label>
              <div className="h-[46px] rounded-lg border border-[#E0E5F2] bg-slate-50 dark:bg-white/5 dark:border-white/20 flex items-center px-4 text-sm font-semibold text-slate-700 dark:text-white/90">
                {watchedValues.designationId ? overtimeRate.toLocaleString() : "—"}
              </div>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                {t("employees:overtime_rate_hint")}
              </p>
            </div>
          </div>
        </div>

        {/* Allowances Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlinePlusCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("employees:allowances")}
              </h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold">
              {t("employees:total")}: {totalAllowances.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormInput
              label={t("employees:hra")}
              name="hra"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:medical_allowance")}
              name="medical_allowance"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:transport_allowance")}
              name="transport_allowance"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:food_allowance")}
              name="food_allowance"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:mobile_allowance")}
              name="mobile_allowance"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:travel_allowance")}
              name="travel_allowance"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <div className="md:col-span-2 lg:col-span-1">
              <FormInput
                label={t("employees:other_allowances")}
                name="other_allowances"
                type="number"
                register={register}
                errors={errors}
                defaultValue={0}
                min={0}
                decimal
                decimalPlaces={3}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <HiOutlineMinusCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("employees:deductions")}
              </h3>
            </div>
            <div className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold">
              {t("employees:total")}: {totalDeductions.toLocaleString()}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <FormInput
                label={t("employees:tax_percentage")}
                name="tax_percentage"
                type="number"
                register={register}
                errors={errors}
                defaultValue={0}
                placeholder="e.g. 5"
                min={0}
                max={100}
                decimal
                decimalPlaces={2}
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                {t("employees:tax_amount_computed", { amount: computedTax.toLocaleString() })}
              </p>
            </div>
            <input type="hidden" {...register("tax")} />
            <div>
              <FormInput
                label={t("employees:pf_percentage")}
                name="pf_percentage"
                type="number"
                register={register}
                errors={errors}
                defaultValue={0}
                disabled
                min={0}
                max={100}
                decimal
                decimalPlaces={2}
              />
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                {t("employees:pf_percentage_locked_hint")}
              </p>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                {t("employees:pf_amount_computed", { amount: computedPf.toLocaleString() })}
              </p>
            </div>
            <input type="hidden" {...register("provident_fund")} />
            <FormInput
              label={t("employees:loan_deduction")}
              name="loan_deduction"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:advance_salary")}
              name="advance_salary"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <FormInput
              label={t("employees:insurance_deduction")}
              name="insurance_deduction"
              type="number"
              register={register}
              errors={errors}
              defaultValue={0}
              min={0}
              decimal
              decimalPlaces={3}
              maxLength={10}
            />
            <div className="md:col-span-2 lg:col-span-1">
              <FormInput
                label={t("employees:other_deductions")}
                name="other_deductions"
                type="number"
                register={register}
                errors={errors}
                defaultValue={0}
                min={0}
                decimal
                decimalPlaces={3}
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Net Salary Summary */}
        <div className="p-6 rounded-2xl border-2 border-teal-500/30 dark:border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:to-emerald-500/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center md:text-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/70 uppercase tracking-wider">
                {t("employees:gross_salary")}
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {grossSalary.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-white/70 uppercase tracking-wider">
                {t("employees:total_deductions")}
              </p>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                -{totalDeductions.toLocaleString()}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                {t("employees:net_salary")}
              </p>
              <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
                {netSalary.toLocaleString()}
              </p>
            </div>
          </div>
          <input type="hidden" {...register("net_salary")} />
        </div>

        {/* Bank & Payment Details */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/20 bg-slate-50/50 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t("employees:bank_payment_details")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t("employees:bank_name")}
              name="bank_name"
              register={register}
              errors={errors}
              defaultValue="Al Rajhi Bank"
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("employees:branch_name")}
              name="branch_name"
              register={register}
              errors={errors}
              defaultValue="Main Branch – Riyadh"
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("employees:branch_code")}
              name="branch_code"
              register={register}
              errors={errors}
              defaultValue="4001"
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("employees:account_no")}
              name="account_no"
              register={register}
              errors={errors}
              defaultValue="****1234"
              minLength={4}
              maxLength={34}
            />
            <FormInput
              label={t("employees:ifsc")}
              name="ifsc"
              register={register}
              errors={errors}
              pattern={/[A-Za-z0-9]/}
              minLength={2}
              maxLength={100}
            />
            <FormInput
              label={t("employees:pf_number")}
              name="pf_number"
              register={register}
              errors={errors}
              pattern={/[A-Za-z0-9\-_]/}
              minLength={2}
              maxLength={100}
            />
            <SelectDropdown
              label={t("employees:payment_status")}
              data={PAYMENT_STATUS_OPTIONS}
              selected={selPaymentStatus}
              setSelected={setSelPaymentStatus}
              name="payment_status"
              valueKey="id"
              register={register}
              setValue={setValue}
              trigger={trigger}
            />
            <div className="relative">
              <Datepicker
                label={t("employees:payment_date")}
                name="payment_date"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selPaymentDate}
                setSelected={setSelPaymentDate}
                isDefaultSelection={false}
              />
            </div>
            <div className="relative">
              <Datepicker
                label={t("employees:salary_effective_from")}
                name="salary_effective_from"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selEffectiveFrom}
                setSelected={setSelEffectiveFrom}
                isDefaultSelection={false}
              />
            </div>
            <div className="relative">
              <Datepicker
                label={t("employees:salary_effective_to")}
                name="salary_effective_to"
                errors={errors}
                position="right"
                Icon={Calender}
                register={register}
                trigger={trigger}
                setValue={setValue}
                selected={selEffectiveTo}
                setSelected={setSelEffectiveTo}
                isDefaultSelection={false}
              />
            </div>
          </div>
          <div className="mt-4">
            <FormInput
              label={t("employees:notes")}
              name="salary_notes"
              register={register}
              errors={errors}
              maxLength={500}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
        <Button
          type="button"
          title={t("back")}
          className="!rounded-md !border-slate-200"
          onClick={() => setSelectedIndex(3)}
        />
        <Button
          type="submit"
          title={t("employees:save")}
          btn="primary"
          disabled={submitting}
          loading={submitting}
          className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0"
        />
      </div>
    </form>
  );
};

export default Salary;
