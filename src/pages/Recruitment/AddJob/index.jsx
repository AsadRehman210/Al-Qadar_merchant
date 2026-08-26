import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { FiArrowLeft } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import RichTextEditor from "components/RichTextEditor";
import { JOB_STATUS_OPTS } from "../recruitmentFakeData";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import { fetchDesignationsDropdown, showDesignationDropdownOptions } from "store/slices/designationSlice";
import { fetchJobById, showCurrentJob, clearCurrentJob, createJob, updateJob } from "store/slices/recruitmentSlice";
import { showUserData } from "store/slices/uniqueSlice";

const experienceOpts = ["0–1 years", "1+ years", "2+ years", "3+ years", "5+ years", "7+ years"].map((e) => ({ id: e, title: e }));

const AddJob = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const departments = useSelector(showDepartments);
  const designationDropdownOptions = useSelector(showDesignationDropdownOptions);
  const existing = useSelector(showCurrentJob);
  const userData = useSelector(showUserData);
  const tenantCurrency = userData?.currency || "SAR";
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
    if (id) dispatch(fetchJobById(id));
    return () => dispatch(clearCurrentJob());
  }, [dispatch, id]);

  const departmentOpts = useMemo(() => departments.map((d) => ({ id: d.id, title: d.name })), [departments]);

  const [selDept, setSelDept] = useState(null);
  const [selDesignation, setSelDesignation] = useState(null);
  const [selStatus, setSelStatus] = useState(JOB_STATUS_OPTS[0]);
  const [selExp, setSelExp] = useState(experienceOpts[2]);

  // Designations belong to a single department, so the Job Title picker only
  // ever needs the backend's designations for whichever department is
  // selected — fetched fresh from the API on every department change,
  // never filtered out of a bulk client-side list.
  useEffect(() => {
    if (selDept?.id) dispatch(fetchDesignationsDropdown({ departmentId: selDept.id }));
  }, [dispatch, selDept]);

  const designationOpts = useMemo(
    () => designationDropdownOptions.map((d) => ({ id: d.id, title: d.title })),
    [designationDropdownOptions],
  );

  const { register, handleSubmit, reset, control, setValue, trigger, formState: { errors } } = useForm({
    defaultValues: { openings: 1, salaryMin: "", salaryMax: "", deadline: "", description: "", requirements: "" },
  });

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        openings: existing.openings,
        salaryMin: existing.salaryMin,
        salaryMax: existing.salaryMax,
        deadline: existing.deadline ? existing.deadline.slice(0, 10) : "",
        description: existing.description,
        requirements: existing.requirements,
      });
      setSelDept(departmentOpts.find((d) => d.id === existing.departmentId) || null);
      setSelDesignation(
        existing.designationId
          ? { id: existing.designationId, title: existing.designationTitle || existing.title }
          : null,
      );
      setSelStatus(JOB_STATUS_OPTS.find((s) => s.id === existing.status) || JOB_STATUS_OPTS[0]);
      setSelExp(experienceOpts.find((e) => e.id === existing.experience) || experienceOpts[2]);
    }
  }, [existing, isEdit, departmentOpts, reset]);

  // Changing the department invalidates whichever designation was picked
  // under the previous one — but skip this on the initial edit-mode load,
  // since that effect above sets both together.
  const handleDeptChange = (v) => {
    setSelDept(v);
    setSelDesignation(null);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      openings: Number(data.openings) || 1,
      salaryMin: Number(data.salaryMin) || 0,
      salaryMax: Number(data.salaryMax) || 0,
      departmentId: selDept.id,
      designationId: selDesignation.id,
      status: selStatus?.id || "Open",
      experience: selExp?.id || "",
    };
    setSubmitting(true);
    try {
      if (isEdit) await dispatch(updateJob({ id, data: payload })).unwrap();
      else await dispatch(createJob(payload)).unwrap();
      toast.success(isEdit ? "Job updated." : "Job posted successfully.");
      navigate("/recruitment");
    } catch (err) {
      toast.error(err || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const labelCls = "text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5 block";
  const sH = "text-lg font-semibold text-slate-900 dark:text-white pb-2 mb-6 border-b border-slate-200 dark:border-white/10";

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
        <Button type="button" onClick={() => navigate("/recruitment")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90" iconClass="!text-lg" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Job Posting" : "Post New Job"}</h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">Create or update a job posting for recruitment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 p-8 border-l-4 !border-l-[var(--color-teal-500)] space-y-6">
        <h3 className={sH}>Job Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className={labelCls}>Department *</label>
            <SelectDropdown
              data={departmentOpts}
              selected={selDept}
              setSelected={handleDeptChange}
              placeholder="Select Department"
              name="departmentId"
              valueKey="id"
              register={register}
              setValue={setValue}
              trigger={trigger}
              errors={errors}
              required
              classes="!h-[46px] !rounded-md"
            />
          </div>
          <div>
            <label className={labelCls}>Job Title *</label>
            <SelectDropdown
              data={designationOpts}
              selected={selDesignation}
              setSelected={setSelDesignation}
              placeholder={selDept ? "Select Job Title" : "Select Department first"}
              emptyMessage={selDept ? undefined : "Select a department first"}
              name="designationId"
              valueKey="id"
              register={register}
              setValue={setValue}
              trigger={trigger}
              errors={errors}
              required
              classes="!h-[46px] !rounded-md"
            />
          </div>
          <FormInput label="Number of Openings" name="openings" register={register} errors={errors} type="number" min={1} max={100} placeholder="1" />
          <div>
            <label className={labelCls}>Required Experience</label>
            <SelectDropdown data={experienceOpts} selected={selExp} setSelected={(v) => setSelExp(v || experienceOpts[2])} hideClear classes="!h-[46px] !rounded-md" />
          </div>
          <FormInput label="Salary Min" name="salaryMin" register={register} errors={errors} type="number" min={0} decimal decimalPlaces={3} maxLength={10} placeholder="5000" />
          <FormInput label="Salary Max" name="salaryMax" register={register} errors={errors} type="number" min={0} decimal decimalPlaces={3} maxLength={10} placeholder="10000" />
          <div>
            <label className={labelCls}>Currency</label>
            <SelectDropdown
              data={[{ id: tenantCurrency, title: tenantCurrency }]}
              selected={{ id: tenantCurrency, title: tenantCurrency }}
              setSelected={() => {}}
              hideClear
              disabled
              classes="!h-[46px] !rounded-md"
            />
          </div>
          <div>
            <label className={labelCls}>Application Deadline</label>
            <input type="date" {...register("deadline")} className="w-full h-[46px] px-3 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <SelectDropdown data={JOB_STATUS_OPTS} selected={selStatus} setSelected={(v) => setSelStatus(v || JOB_STATUS_OPTS[0])} hideClear classes="!h-[46px] !rounded-md" />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelCls}>Job Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Describe the role, responsibilities, and team..."
                />
              )}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelCls}>Requirements</label>
            <Controller
              name="requirements"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="List skills, qualifications, and certifications..."
                />
              )}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-200 dark:border-white/20">
          <Button type="button" title="Cancel" onClick={() => navigate("/recruitment")} className="!rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
          <Button type="submit" title={isEdit ? "Update Job" : "Post Job"} btn="primary" disabled={submitting} className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
        </div>
      </form>
    </div>
  );
};

export default AddJob;
