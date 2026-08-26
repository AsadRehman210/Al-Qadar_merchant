import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { EMPLOYEE_STATUS_OPTIONS } from "./employeesFakeData";

const EmployeesFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const statusTypes = [
    { title: "All Status", id: "all" },
    ...EMPLOYEE_STATUS_OPTIONS,
  ];

  const selectedStatus =
    statusTypes.find((status) => status.id === (filters.filterStatus || "all")) || statusTypes[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleSearch = (value) => {
    setFilters({ page: 1, search: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[220px] max-w-xs">
        <SearchInput
          onSearch={handleSearch}
          initialValue={filters.search}
          placeholder={t("employees:search_employees")}
        />
      </div>
      <div className="w-full sm:w-48">
        <SelectDropdown data={statusTypes} selected={selectedStatus} setSelected={handleStatusChange} classes="!h-10 !rounded-lg" />
      </div>
    </div>
  );
};

export default EmployeesFilter;
