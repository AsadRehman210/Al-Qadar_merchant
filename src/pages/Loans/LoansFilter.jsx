import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";

const LoansFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const statusTypes = [
    { title: "loans:all_status", id: "all" },
    { title: "requests:step_manager", id: "Pending Manager" },
    { title: "requests:step_hr", id: "Pending HR" },
    { title: "loans:pending", id: "Pending" },
    { title: "loans:approved", id: "Approved" },
    { title: "loans:ongoing", id: "Ongoing" },
    { title: "loans:completed", id: "Completed" },
  ];

  const loanTypes = [
    { title: "loans:all_types", id: "all" },
    { title: "loans:advance_salary", id: "Advance Salary" },
    { title: "loans:emi_loan", id: "EMI Loan" },
  ];

  const selectedStatus =
    statusTypes.find((s) => s.id === (filters.filterStatus || "all")) || statusTypes[0];
  const selectedType =
    loanTypes.find((lt) => lt.id === (filters.filterLoanType || "all")) || loanTypes[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleTypeChange = (type) => {
    setFilters({ page: 1, filterLoanType: type.id === "all" ? null : type.id });
  };

  const handleSearch = (value) => {
    setFilters({ page: 1, search: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[200px] max-w-xs">
        <SearchInput
          onSearch={handleSearch}
          initialValue={filters.search}
          placeholder={t("loans:search_loans")}
        />
      </div>
      <div className="w-full sm:w-48">
        <SelectDropdown
          data={loanTypes}
          selected={selectedType}
          setSelected={handleTypeChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
      <div className="w-full sm:w-48">
        <SelectDropdown
          data={statusTypes}
          selected={selectedStatus}
          setSelected={handleStatusChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
    </div>
  );
};

export default LoansFilter;
