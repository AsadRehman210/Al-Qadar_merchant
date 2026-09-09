import { Fragment, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import { FiArrowLeft, FiEdit2, FiBriefcase, FiUsers, FiList, FiPlus, FiAlertCircle, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import RichTextContent from "components/RichTextContent";
import { recruitmentStageOptions } from "global/constant";
const STAGE_PIPELINE = recruitmentStageOptions.map((s) => s.id);
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import {
  fetchJobById,
  showCurrentJob,
  showCurrentJobLoading,
  clearCurrentJob,
  fetchCandidatesByJob,
  showCandidatesByJob,
  showCandidatesByJobLoading,
  applyCandidate,
  updateCandidateStage,
  hireCandidate,
} from "store/slices/recruitmentSlice";
import JobStatusMenu from "../JobStatusMenu";
import { SkeletonDetail, SkeletonTable, SkeletonCards } from "components/Skeleton";

const {
  view_recruitment,
  edit_recruitment,
  view_candidate,
  add_candidate,
  edit_candidate,
  delete_candidate,
} = alqadar_role_ids;

const stageColor = (s) => {
  if (s === "Hired") return "bg-emerald-100 text-emerald-700";
  if (s === "Offer") return "bg-blue-100 text-blue-700";
  if (s === "Interview") return "bg-purple-100 text-purple-700";
  if (s === "Screening") return "bg-amber-100 text-amber-700";
  if (s === "Rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-500";
};

const nextStage = (current) => {
  const idx = STAGE_PIPELINE.indexOf(current);
  if (idx < 0 || idx >= STAGE_PIPELINE.length - 2) return null; // Hired / Rejected are final
  return STAGE_PIPELINE[idx + 1];
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 dark:border-white/10 last:border-0">
    <span className="text-sm text-slate-500 dark:text-white/50 sm:w-40 shrink-0">{label}</span>
    <span className="text-sm font-medium text-slate-900 dark:text-white">{value || "?"}</span>
  </div>
);

// Add Candidate inline form
const AddCandidateForm = ({ jobId, onSaved, onCancel }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ name: "", email: "", phone: "", experience: "", currentCompany: "", notes: "" });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim() || form.name.trim().length < 2) { toast.error("Name is required (min 2 characters)."); return; }
    if (!form.email) { toast.error("Email is required."); return; }
    if (form.phone && form.phone.replace(/\D/g, "").length < 7) { toast.error("Phone must be 7?20 characters."); return; }
    try {
      await dispatch(applyCandidate({ ...form, jobId })).unwrap();
      await dispatch(fetchCandidatesByJob(jobId));
      toast.success("Candidate added.");
      onSaved?.();
    } catch (err) {
      toast.error(err || "Failed to add candidate.");
    }
  };

  return (
    <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl p-6 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-slate-900 dark:text-white">Add Candidate</h4>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 text-xl">?</button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { k: "name", label: "Full Name", ph: "Candidate Name", required: true, pattern: /[a-zA-Z\s.'-]/, minLength: 2, maxLength: 150 },
          { k: "email", label: "Email", ph: "email@example.com", required: true, type: "email" },
          { k: "phone", label: "Phone", ph: "+966 5X XXX XXXX", pattern: /[0-9+\-() ]/, minLength: 7, maxLength: 20 },
          { k: "experience", label: "Experience", ph: "3 years", maxLength: 50 },
          { k: "currentCompany", label: "Current Company", ph: "Company name", pattern: /[a-zA-Z0-9\s.'-]/, maxLength: 150 },
          { k: "notes", label: "Notes", ph: "Optional notes", maxLength: 500 },
        ].map(({ k, label, ph, required, type, pattern, minLength, maxLength }) => (
          <FormInput
            key={k}
            label={label}
            labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
            required={required}
            type={type}
            pattern={pattern}
            minLength={minLength}
            maxLength={maxLength}
            value={form[k]}
            onValueChange={(v) => set(k, v)}
            placeholder={ph}
            inputClass="!h-10 !rounded-lg"
          />
        ))}
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="submit" className="h-10 px-5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">Add Candidate</button>
          <button type="button" onClick={onCancel} className="h-10 px-4 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-sm font-medium">Cancel</button>
        </div>
      </form>
    </div>
  );
};

// Hire confirmation inline form ? the designation (and department) come from
// the job posting itself now, so only the joining date needs to be captured
// here to create the real Employee record.
const HireForm = ({ candidate, onDone, onCancel }) => {
  const dispatch = useDispatch();
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!joiningDate) { toast.error("Joining date is required."); return; }
    setSubmitting(true);
    try {
      await dispatch(hireCandidate({
        id: candidate.id,
        data: { joiningDate },
      })).unwrap();
      await dispatch(fetchCandidatesByJob(candidate.jobId));
      toast.success(`${candidate.name} hired ? employee record created, onboarding checklist started.`);
      onDone?.();
    } catch (err) {
      toast.error(err || "Failed to hire candidate.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-5 mt-2">
      <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3">Hire {candidate.name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormInput
          label="Joining Date"
          labelClass="!text-xs font-medium text-slate-600 dark:text-white/60"
          type="date"
          required
          value={joiningDate}
          onValueChange={setJoiningDate}
          inputClass="!h-10 !rounded-lg"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <button type="button" disabled={submitting} onClick={handleConfirm} className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-50">Confirm Hire</button>
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-sm font-medium">Cancel</button>
      </div>
    </div>
  );
};

const JobDetail = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const job = useSelector(showCurrentJob);
  const jobLoading = useSelector(showCurrentJobLoading);
  const candidates = useSelector(showCandidatesByJob(id));
  const candidatesLoading = useSelector(showCandidatesByJobLoading);
  const departments = useSelector(showDepartments);
  const [showAdd, setShowAdd] = useState(false);
  const [hiringCandidateId, setHiringCandidateId] = useState(null);

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchCandidatesByJob(id));
    dispatch(fetchDepartments());
    return () => dispatch(clearCurrentJob());
  }, [dispatch, id]);

  const departmentsById = useMemo(() => Object.fromEntries(departments.map((d) => [d.id, d])), [departments]);

  // Only skeleton the first load ? stage changes refetch the same list and
  // should leave the already-rendered rows in place.
  const candidatesPending = candidatesLoading && candidates.length === 0;

  const handleAdvance = async (candId, stage) => {
    if (stage === "Hired") {
      setHiringCandidateId(candId);
      return;
    }
    try {
      await dispatch(updateCandidateStage({ id: candId, stage })).unwrap();
      await dispatch(fetchCandidatesByJob(id));
      toast.success(`Candidate moved to ${stage}`);
    } catch (err) {
      toast.error(err || "Failed to update candidate stage.");
    }
  };

  const handleReject = async (candId) => {
    try {
      await dispatch(updateCandidateStage({ id: candId, stage: "Rejected" })).unwrap();
      await dispatch(fetchCandidatesByJob(id));
      toast.success("Candidate rejected.");
    } catch (err) {
      toast.error(err || "Failed to reject candidate.");
    }
  };

  if (!checkRoleAuth(view_recruitment)) return null;

  if (jobLoading && !job) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <FiAlertCircle size={48} className="text-red-400" />
        <p className="text-lg text-slate-500">Job not found</p>
        <Button type="button" title="Back" onClick={() => navigate("/recruitment")} btn="primary" />
      </div>
    );
  }

  const departmentName = departmentsById[job.departmentId]?.name || "?";
  const tabCls = ({ selected }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none ${selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"}`;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start gap-4 dark:text-white">
        <Button type="button" onClick={() => navigate("/recruitment")} icon={FiArrowLeft} className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 mt-1" iconClass="!text-lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            <JobStatusMenu jobId={job.id} status={job.status} size="md" onChanged={() => dispatch(fetchJobById(id))} />
          </div>
          <p className="text-slate-500 dark:text-white/50 text-sm">{job.jobCode} ? {departmentName} ? {job.openings} opening(s) ? Deadline: {job.deadline ? job.deadline.slice(0, 10) : "?"}</p>
        </div>
        {checkRoleAuth(edit_recruitment) && (
          <Button type="button" title="Edit Job" icon={FiEdit2} onClick={() => navigate(`/recruitment/edit/${id}`)} btn="primary" className="!rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0" />
        )}
      </div>

      <TabGroup>
        <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 mb-6">
          <Tab className={tabCls}><FiBriefcase size={14} />Job Info</Tab>
          {checkRoleAuth(view_candidate) && (
            <Tab className={tabCls}><FiUsers size={14} />Candidates <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">{candidates.length}</span></Tab>
          )}
          {checkRoleAuth(view_candidate) && (
            <Tab className={tabCls}><FiList size={14} />Pipeline</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Job Info */}
          <TabPanel>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Job Details</h3>
                <InfoRow label="Job Code" value={job.jobCode} />
                <InfoRow label="Title" value={job.title} />
                <InfoRow label="Department" value={departmentName} />
                <InfoRow label="Openings" value={job.openings} />
                <InfoRow label="Experience" value={job.experience} />
                <InfoRow label="Salary" value={`${job.salaryMin?.toLocaleString()} ? ${job.salaryMax?.toLocaleString()} ${job.currency}`} />
                <InfoRow label="Deadline" value={job.deadline ? job.deadline.slice(0, 10) : null} />
                <InfoRow label="Posted" value={job.createdAt ? job.createdAt.slice(0, 10) : null} />
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Description</h3>
                  <RichTextContent html={job.description} className="text-sm text-slate-600 dark:text-white/70 leading-relaxed" />
                </div>
                <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Requirements</h3>
                  <RichTextContent html={job.requirements} className="text-sm text-slate-600 dark:text-white/70 leading-relaxed" />
                </div>
              </div>
            </div>
          </TabPanel>

          {/* Candidates */}
          {checkRoleAuth(view_candidate) && (
          <TabPanel>
            {checkRoleAuth(add_candidate) && (
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium">
                <FiPlus size={14} />Add Candidate
              </button>
            </div>
            )}
            {checkRoleAuth(add_candidate) && showAdd && <AddCandidateForm jobId={job.id} onSaved={() => setShowAdd(false)} onCancel={() => setShowAdd(false)} />}
            {candidatesPending ? (
              <SkeletonTable rows={5} columns={6} />
            ) : (
            <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Current Co.</th>
                      <th className="px-4 py-3">Applied</th>
                      <th className="px-4 py-3">Stage</th>
                      {checkRoleAuth(edit_candidate) && <th className="px-4 py-3">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.length === 0 ? (
                      <tr><td colSpan={checkRoleAuth(edit_candidate) ? 7 : 6} className="text-center py-12 text-slate-400">No candidates yet</td></tr>
                    ) : candidates.map((c) => {
                      const next = nextStage(c.stage);
                      return (
                        <Fragment key={c.id}>
                          <tr className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{c.name}</td>
                            <td className="px-4 py-3 text-slate-500">{c.email}</td>
                            <td className="px-4 py-3 text-slate-500">{c.experience}</td>
                            <td className="px-4 py-3 text-slate-500">{c.currentCompany || "?"}</td>
                            <td className="px-4 py-3 text-slate-400">{c.createdAt ? c.createdAt.slice(0, 10) : "?"}</td>
                            <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor(c.stage)}`}>{c.stage}</span></td>
                            {checkRoleAuth(edit_candidate) && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {next && c.stage !== "Rejected" && (
                                  <button onClick={() => handleAdvance(c.id, next)} className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium">
                                    <FiArrowRight size={11} />{next}
                                  </button>
                                )}
                                {!["Hired", "Rejected"].includes(c.stage) && (
                                  <button onClick={() => handleReject(c.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">Reject</button>
                                )}
                              </div>
                            </td>
                            )}
                          </tr>
                          {checkRoleAuth(edit_candidate) && hiringCandidateId === c.id && (
                            <tr>
                              <td colSpan={7} className="px-6 pb-4">
                                <HireForm
                                  candidate={c}
                                  onDone={() => setHiringCandidateId(null)}
                                  onCancel={() => setHiringCandidateId(null)}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </TabPanel>
          )}

          {/* Pipeline Kanban */}
          {checkRoleAuth(view_candidate) && (
          <TabPanel>
            {candidatesPending ? (
              <SkeletonCards count={6} columns="grid-cols-2 md:grid-cols-3 lg:grid-cols-6" />
            ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {STAGE_PIPELINE.map((stage) => {
                const stageCands = candidates.filter((c) => c.stage === stage);
                return (
                  <div key={stage} className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 min-h-[200px]">
                    <div className={`px-3 py-2 rounded-t-2xl text-xs font-semibold text-center ${stageColor(stage)}`}>{stage} ({stageCands.length})</div>
                    <div className="p-2 space-y-2">
                      {stageCands.map((c) => (
                        <div key={c.id} className="bg-slate-50 dark:bg-white/5 rounded-xl p-2.5 border border-slate-100 dark:border-white/10">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-slate-400 truncate">{c.currentCompany || c.email}</p>
                          {checkRoleAuth(edit_candidate) && stage !== "Hired" && stage !== "Rejected" && (
                            <div className="flex gap-1 mt-1.5">
                              {nextStage(stage) && <button onClick={() => handleAdvance(c.id, nextStage(stage))} className="flex-1 text-[10px] bg-teal-100 text-teal-700 rounded py-0.5">? {nextStage(stage)}</button>}
                            </div>
                          )}
                        </div>
                      ))}
                      {stageCands.length === 0 && <p className="text-xs text-slate-300 text-center py-4">Empty</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
            {checkRoleAuth(edit_candidate) && hiringCandidateId && candidates.find((c) => c.id === hiringCandidateId) && (
              <HireForm
                candidate={candidates.find((c) => c.id === hiringCandidateId)}
                onDone={() => setHiringCandidateId(null)}
                onCancel={() => setHiringCandidateId(null)}
              />
            )}
          </TabPanel>
          )}
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default JobDetail;
