import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { merchantStatusFilterOptions } from "global/constant";

const MerchantsFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const selectedStatus =
    merchantStatusFilterOptions.find((s) => s.id === (filters.filterStatus || "all")) ||
    merchantStatusFilterOptions[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleSearch = (value) => {
    setFilters({ page: 1, search: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div className="flex-1 min-w-[200px] max-w-md">
          <SearchInput
            onSearch={handleSearch}
            value={filters.search || ""}
            placeholder={t("search_here")}
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <SelectDropdown
            data={merchantStatusFilterOptions}
            selected={selectedStatus}
            setSelected={handleStatusChange}
            classes="!h-10 !rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default MerchantsFilter;
