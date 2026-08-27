import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import PaginatedSelectBox from "components/PaginatedSelectBox";
import { erpGet, buildQuery } from "api/erpClient";
import { erpUrls } from "global/config";

const BatchTableFilters = ({
  batches = [],
  warehouseId,
  onWarehouseChange,
  sortId,
  onSortChange,
  showWarehouse = true,
}) => {
  const { t } = useTranslation();
  const [warehouseOption, setWarehouseOption] = useState(null);

  useEffect(() => {
    if (warehouseId === "all") setWarehouseOption(null);
  }, [warehouseId]);

  const loadWarehouseOptions = useCallback(async ({ page, size, search }) => {
    const query = buildQuery({ page, limit: size, search });
    const res = await erpGet(`${erpUrls.warehouses}?${query}`);
    if (!res?.success) return { options: [], hasNextPage: false };
    return {
      options: (res.result || []).map((w) => ({
        value: w.id,
        label: `${w.code} — ${w.name}`,
      })),
      hasNextPage: page < (res.total_pages || 0),
    };
  }, []);

  const selectedWarehouseOption = useMemo(() => {
    if (!warehouseId || warehouseId === "all") return null;
    if (
      warehouseOption &&
      String(warehouseOption.value) === String(warehouseId)
    ) {
      return warehouseOption;
    }
    const batch = batches.find((b) => b.warehouseId === warehouseId);
    return {
      value: warehouseId,
      label: batch?.warehouseName || String(warehouseId),
    };
  }, [warehouseId, warehouseOption, batches]);

  const sortOptions = useMemo(
    () => [
      { id: "expiry_asc", title: t("product:batch_sort_expiry_asc") },
      { id: "expiry_desc", title: t("product:batch_sort_expiry_desc") },
      { id: "cost_asc", title: t("product:batch_sort_cost_asc") },
      { id: "cost_desc", title: t("product:batch_sort_cost_desc") },
      { id: "stock_asc", title: t("product:batch_sort_stock_asc") },
      { id: "stock_desc", title: t("product:batch_sort_stock_desc") },
    ],
    [t],
  );

  const selectedSort = sortId
    ? sortOptions.find((o) => o.id === sortId) ?? {}
    : {};

  const filterLabelClass =
    "!text-slate-500 dark:!text-white/50 !text-xs !font-medium";

  return (
    <div className="mb-4 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="min-w-[200px] flex-1 sm:max-w-[240px]">
          <SelectDropdown
            label="product:batch_sort_by"
            labelClass={filterLabelClass}
            data={sortOptions}
            selected={selectedSort}
            setSelected={(o) => onSortChange?.(o?.id ?? "")}
            placeholder="select_here"
            classes="!h-10 !rounded-lg !w-full"
          />
        </div>
        {showWarehouse && (
          <div className="min-w-[180px] flex-1 sm:max-w-[240px]">
            <PaginatedSelectBox
              label={t("product:warehouse")}
              className="[&_label]:!text-slate-500 [&_label]:dark:!text-white/50 [&_label]:!text-xs [&_label]:!font-medium"
              loadOptions={loadWarehouseOptions}
              value={warehouseId === "all" ? null : warehouseId}
              selectedOption={selectedWarehouseOption}
              onOptionChange={(opt) => {
                setWarehouseOption(opt);
                onWarehouseChange?.(opt?.value ?? "all");
              }}
              placeholder={t("product:stock_filter_all_warehouses")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchTableFilters;
