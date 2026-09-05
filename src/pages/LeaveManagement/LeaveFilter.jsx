import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { leaveStatusFilterOptions } from "global/constant";
import { fetchLeaveTypes, showLeaveTypes } from "store/slices/leaveTypeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";

const LeaveFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const leaveTypes = useSelector(showLeaveTypes);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchLeaveTypes());
    dispatch(fetchDepartments());
  }, [dispatch]);

  const statusOpts = leaveStatusFilterOptions;
  const typeOpts = [
    { id: "all", title: "leave:all_types" },
    ...leaveTypes.filter((x) => x.status === "Active").map((x) => ({
      id: x.id,
      title: x.name,
    })),
  ];
  const deptOpts = [
    { id: "all", title: "leave:all_departments" },
    ...departments.map((d) => ({ id: d.id, title: d.name })),
  ];

  const go = (key, val) => {
    setFilters({ page: 1, [key]: val === "all" ? null : val });
  };

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 className="text-slate-900 dark:text-white font-bold text-xl">{t("leave:all_requests")}</h2>
        <p className="text-slate-500 dark:text-white/70 text-sm mt-0.5">{t("leave:list_desc")}</p>
      </div>
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="w-full sm:w-[180px]">
          <SelectDropdown
            data={typeOpts}
            selected={typeOpts.find((x) => x.id === (filters.filterType || "all")) || typeOpts[0]}
            setSelected={(v) => go("filterType", v.id)}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <SelectDropdown
            data={statusOpts}
            selected={statusOpts.find((x) => x.id === (filters.filterStatus || "all")) || statusOpts[0]}
            setSelected={(v) => go("filterStatus", v.id)}
          />
        </div>
        <div className="w-full sm:w-[170px]">
          <SelectDropdown
            data={deptOpts}
            selected={deptOpts.find((x) => x.id === (filters.filterDept || "all")) || deptOpts[0]}
            setSelected={(v) => go("filterDept", v.id)}
          />
        </div>
        <div className="w-full sm:w-[220px]">
          <SearchInput
            onSearch={(v) => setFilters({ page: 1, search: v })}
            initialValue={filters.search}
            placeholder={t("leave:search")}
          />
        </div>
      </div>
    </div>
  );
};

export default LeaveFilter;
