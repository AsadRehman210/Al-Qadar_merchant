import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { loanTypeFilterOptions, loanStatusFilterOptions } from "global/constant";

const LoansFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const selectedStatus =
    loanStatusFilterOptions.find((s) => s.id === (filters.filterStatus || "all")) ||
    loanStatusFilterOptions[0];
  const selectedType =
    loanTypeFilterOptions.find((lt) => lt.id === (filters.filterLoanType || "all")) ||
    loanTypeFilterOptions[0];

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
          data={loanTypeFilterOptions}
          selected={selectedType}
          setSelected={handleTypeChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
      <div className="w-full sm:w-48">
        <SelectDropdown
          data={loanStatusFilterOptions}
          selected={selectedStatus}
          setSelected={handleStatusChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
    </div>
  );
};

export default LoansFilter;
