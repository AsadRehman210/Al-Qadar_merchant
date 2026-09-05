import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import SearchInput from "components/SearchInput";
import SelectDropdown from "components/SelectDropdown";
import { stockLevelFilterOptions } from "global/constant";

const StockFilters = ({
  search,
  onSearch,
  statusId,
  onStatusIdChange,
  warehouses = [],
  warehouseId = "all",
  onWarehouseIdChange,
  setPage,
}) => {
  const { t } = useTranslation();

  const statusOptions = stockLevelFilterOptions;

  const selectedStatus = useMemo(
    () => statusOptions.find((o) => o.id === statusId) || statusOptions[0],
    [statusOptions, statusId]
  );

  const warehouseOptions = useMemo(
    () => [
      { id: "all", title: t("product:stock_filter_all_warehouses", { defaultValue: "All warehouses" }) },
      ...warehouses.map((w) => ({ id: w.id, title: `${w.code ? `${w.code} — ` : ""}${w.name}` })),
    ],
    [warehouses, t]
  );

  const selectedWarehouse = useMemo(
    () => warehouseOptions.find((o) => o.id === warehouseId) || warehouseOptions[0],
    [warehouseOptions, warehouseId]
  );

  const handleSearch = (value) => {
    setPage?.(1);
    onSearch?.(value);
  };

  const handleStatus = (option) => {
    setPage?.(1);
    onStatusIdChange?.(option?.id ?? "all");
  };

  const handleWarehouse = (option) => {
    setPage?.(1);
    onWarehouseIdChange?.(option?.id ?? "all");
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between flex-wrap">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white/95 tracking-tight">
          {t("product:stock_list_heading")}
        </h2>
        <p className="text-sm text-mutedForeground mt-0.5">
          {t("product:stock_list_subheading")}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-0">
        <div className="min-w-[200px] w-full sm:w-[220px]">
          <SelectDropdown
            data={warehouseOptions}
            selected={selectedWarehouse}
            setSelected={handleWarehouse}
            hideClear
            classes="!h-10 !rounded-lg"
          />
        </div>
        <div className="min-w-[200px] w-full sm:w-[220px]">
          <SelectDropdown
            data={statusOptions}
            selected={selectedStatus}
            setSelected={handleStatus}
            hideClear
            classes="!h-10 !rounded-lg"
          />
        </div>
        <div className="min-w-[200px] w-full sm:w-[260px]">
          <SearchInput
            placeholder={t("product:stock_search_placeholder")}
            initialValue={search}
            onSearch={handleSearch}
          />
        </div>
      </div>
    </div>
  );
};

export default StockFilters;
