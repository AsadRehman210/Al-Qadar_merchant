import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiPlus, FiEye, FiEdit2, FiBriefcase, FiUsers, FiCheckCircle } from "react-icons/fi";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import ReactPaginate from "react-paginate";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import DataState from "components/DataState";
import { cardRows } from "global/constant";
import { useListFilters } from "hooks/useListFilters";
import { jobStatusOptions } from "global/constant";
import {
  fetchJobs,
  fetchJobsSummary,
  showJobs,
  showJobsTotal,
  showJobsLoading,
  showJobsSummary,
} from "store/slices/recruitmentSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import JobStatusMenu from "./JobStatusMenu";

const SummaryCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}><Icon size={20} className="text-white" /></div>
    <div><p className="text-xs text-slate-500 dark:text-white/50">{label}</p><p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p></div>
  </div>
);

const Recruitment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [filters, setFilters] = useListFilters("talent-recruitment", {
    search: "",
    statusId: null,
    deptId: null,
    page: 1,
    limitId: cardRows[0].id,
  });
  const { search, page } = filters;
  const selRows = cardRows.find((r) => r.id === filters.limitId) || cardRows[0];

  const jobs = useSelector(showJobs);
  const totalRecords = useSelector(showJobsTotal);
  const loading = useSelector(showJobsLoading);
  const summary = useSelector(showJobsSummary);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  const refreshJobs = () => dispatch(fetchJobs({
    page,
    limit: selRows.id,
    search: search || undefined,
    status: filters.statusId || undefined,
    departmentId: filters.deptId || undefined,
  }));
  const refreshSummary = () => dispatch(fetchJobsSummary());

  useEffect(() => {
    refreshJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, selRows.id, search, filters.statusId, filters.deptId]);

  useEffect(() => {
    refreshSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const departmentOpts = useMemo(() => departments.map((d) => ({ id: d.id, title: d.name })), [departments]);
  const selStatus = jobStatusOptions.find((o) => o.id === filters.statusId) || null;
  const selDept = departmentOpts.find((o) => o.id === filters.deptId) || null;

  const totalPages = Math.ceil((totalRecords || 0) / selRows.id) || 1;
  const handleRowsChange = (v) => setFilters({ limitId: v.id, page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recruitment</h1>
          <p className="text-slate-500 dark:text-white/50 text-sm mt-1">Job postings, candidates and hiring pipeline</p>
        </div>
        <button onClick={() => navigate("/recruitment/add")} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiPlus size={15} />Post New Job
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={FiBriefcase} label="Total Jobs" value={summary.totalJobs} color="bg-teal-500" />
        <SummaryCard icon={FiCheckCircle} label="Open" value={summary.openJobs} color="bg-emerald-500" />
        <SummaryCard icon={FiUsers} label="In Process" value={summary.inProcessCandidates} color="bg-blue-500" />
        <SummaryCard icon={FiCheckCircle} label="Hired" value={summary.hiredCandidates} color="bg-purple-500" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] sm:max-w-xs">
          <SearchInput
            onSearch={(v) => setFilters({ search: v, page: 1 })}
            initialValue={search}
            placeholder="Search job title or code..."
          />
        </div>
        <div className="w-full sm:w-44">
          <SelectDropdown data={jobStatusOptions} selected={selStatus} setSelected={(v) => setFilters({ statusId: v?.id || null, page: 1 })} placeholder="All Statuses" classes="!h-10 !rounded-md" />
        </div>
        <div className="w-full sm:w-52">
          <SelectDropdown data={departmentOpts} selected={selDept} setSelected={(v) => setFilters({ deptId: v?.id || null, page: 1 })} placeholder="All Departments" classes="!h-10 !rounded-md" />
        </div>
      </div>

      <DataState loading={loading} data={jobs} text="No jobs found">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <JobStatusMenu jobId={job.id} status={job.status} onChanged={() => { refreshJobs(); refreshSummary(); }} />
                <span className="text-xs text-slate-400 font-mono">{job.jobCode}</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{job.title}</h3>
              <p className="text-sm text-slate-500 mb-1">{job.departmentName} · {job.experience}</p>
              <p className="text-xs text-slate-400 mb-3">Deadline: {job.deadline ? job.deadline.slice(0, 10) : "—"}</p>

              <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-white/10 mb-3">
                <div className="text-center"><p className="text-xs text-slate-400">Openings</p><p className="font-bold text-slate-900 dark:text-white">{job.openings}</p></div>
                <div className="text-center"><p className="text-xs text-slate-400">Applied</p><p className="font-bold text-slate-900 dark:text-white">{job.candidateCount}</p></div>
                <div className="text-center"><p className="text-xs text-slate-400">Hired</p><p className="font-bold text-emerald-600">{job.hiredCount}</p></div>
                <div className="text-center"><p className="text-xs text-slate-400">Salary</p><p className="text-xs font-medium text-teal-600">{job.salaryMin?.toLocaleString()}–{job.salaryMax?.toLocaleString()} {job.currency}</p></div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => navigate(`/recruitment/edit/${job.id}`)} className="flex-1 h-8 rounded-lg border border-slate-200 dark:border-white/20 text-xs text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-center gap-1"><FiEdit2 size={12} />Edit</button>
                <button onClick={() => navigate(`/recruitment/detail/${job.id}`)} className="flex-1 h-8 rounded-lg bg-teal-50 dark:bg-teal-500/10 text-xs text-teal-700 dark:text-teal-300 hover:bg-teal-100 flex items-center justify-center gap-1"><FiEye size={12} />View Pipeline</button>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      {jobs.length > 0 && (
        <div className="flex items-center flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-3">
            <SelectDropdown data={cardRows} selected={selRows} setSelected={handleRowsChange} hideClear classes="!h-10 !rounded-lg" />
            <span className="text-sm text-slate-600 dark:text-white/70">per page</span>
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
      )}
    </div>
  );
};

export default Recruitment;
