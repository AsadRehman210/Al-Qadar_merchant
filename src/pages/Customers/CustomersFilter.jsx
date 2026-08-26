import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";

const CustomersFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const statusTypes = [
    { title: "customers:all_status", id: "all" },
    { title: "customers:active", id: "Active" },
    { title: "customers:inactive", id: "Inactive" },
  ];

  const selectedStatus =
    statusTypes.find((s) => s.id === (filters.filterStatus || "all")) || statusTypes[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleSearch = (value) => {
    setFilters({ page: 1, search: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:flex-nowrap">
        <div className="shrink-0">
          <h2 className="text-slate-900 dark:text-white font-bold text-xl tracking-tight leading-none">
            {t("customers:customers")}
          </h2>
          <p className="text-slate-500 dark:text-white/70 text-sm mt-1">
            {t("customers:customer_management_desc")}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-nowrap lg:flex-1 lg:justify-end lg:gap-3">
          <div className="w-full sm:w-auto lg:w-[220px]">
            <SelectDropdown
              data={statusTypes}
              selected={selectedStatus}
              setSelected={handleStatusChange}
            />
          </div>
          <div className="min-w-[220px] w-full sm:w-auto lg:min-w-[320px] lg:max-w-[420px]">
            <SearchInput
              onSearch={handleSearch}
              initialValue={filters.search}
              placeholder={t("customers:search_customers_placeholder")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersFilter;
