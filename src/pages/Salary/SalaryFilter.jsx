import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import { showEmployees } from "store/slices/employeeSlice";

// Salary has no flat list/search endpoint on the backend — every lookup is
// scoped to one employee, so this filter is really an employee picker that
// drives what the rest of the page fetches and displays.
const SalaryFilter = ({ selectedEmployeeId, onSelectEmployee }) => {
  const { t } = useTranslation();
  const employees = useSelector(showEmployees);

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        title: `${e.first_name || ""} ${e.last_name || ""}`.trim() + (e.employeeCode ? ` (${e.employeeCode})` : ""),
      })),
    [employees],
  );

  const selected = employeeOptions.find((o) => o.id === selectedEmployeeId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight leading-none">
            {t("salary:salary")}
          </h2>
          <p className="text-slate-500 dark:text-white/70 text-sm mt-1">
            {t("salary:salary_list_desc")}
          </p>
        </div>
        <div className="min-w-[260px] w-full sm:w-auto">
          <SelectDropdown
            data={employeeOptions}
            selected={selected}
            setSelected={(v) => onSelectEmployee?.(v?.id || null)}
            placeholder={t("salary:select_employee")}
          />
        </div>
      </div>
    </div>
  );
};

export default SalaryFilter;
