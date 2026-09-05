import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { attendanceStatusFilterOptions } from "global/constant";

const AttendanceFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const selectedStatus =
    attendanceStatusFilterOptions.find((s) => s.id === (filters.filterStatus || "all")) ||
    attendanceStatusFilterOptions[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleSearch = (value) => {
    setFilters({ page: 1, search: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div>
          <h2 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight leading-none">
            {t("attendance:attendance")}
          </h2>
          <p className="text-slate-500 dark:text-white/70 text-sm mt-1">
            {t("attendance:attendance_list_desc")}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SelectDropdown
            data={attendanceStatusFilterOptions}
            selected={selectedStatus}
            setSelected={handleStatusChange}
          />
          <div className="min-w-[180px] w-full sm:w-auto">
            <SearchInput
              onSearch={handleSearch}
              initialValue={filters.search}
              placeholder={t("attendance:search_attendance")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceFilter;
