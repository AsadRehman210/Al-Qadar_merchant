import { useTranslation } from "react-i18next";
import SelectDropdown from "components/SelectDropdown";
import SearchInput from "components/SearchInput";
import { EXPENSE_TYPE_IDS } from "global/constant";

const ExpensesFilter = ({ filters, setFilters }) => {
  const { t } = useTranslation();

  const statusTypes = [
    { title: "expenses:all_status", id: "all" },
    { title: "requests:step_manager", id: "Pending Manager" },
    { title: "requests:step_hr", id: "Pending HR" },
    { title: "expenses:approved", id: "Approved" },
    { title: "expenses:rejected", id: "Rejected" },
  ];

  const expenseTypeOptions = [
    { title: "expenses:all_types", id: "all" },
    ...EXPENSE_TYPE_IDS.map((id) => ({ title: `expenses:${id}`, id })),
  ];

  const paymentStatusTypes = [
    { title: "expenses:all_payment_status", id: "all" },
    { title: "expenses:pending", id: "Pending" },
    { title: "expenses:reimbursed", id: "Reimbursed" },
    { title: "expenses:partially_paid", id: "Partially Paid" },
  ];

  const selectedStatus =
    statusTypes.find((s) => s.id === (filters.filterStatus || "all")) || statusTypes[0];
  const selectedType =
    expenseTypeOptions.find((x) => x.id === (filters.filterExpenseType || "all")) ||
    expenseTypeOptions[0];
  const selectedPaymentStatus =
    paymentStatusTypes.find((s) => s.id === (filters.filterPaymentStatus || "all")) ||
    paymentStatusTypes[0];

  const handleStatusChange = (status) => {
    setFilters({ page: 1, filterStatus: status.id === "all" ? null : status.id });
  };

  const handleTypeChange = (type) => {
    setFilters({ page: 1, filterExpenseType: type.id === "all" ? null : type.id });
  };

  const handlePaymentStatusChange = (status) => {
    setFilters({ page: 1, filterPaymentStatus: status.id === "all" ? null : status.id });
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
          placeholder={t("expenses:search_expenses")}
        />
      </div>
      <div className="w-full sm:w-44">
        <SelectDropdown
          data={expenseTypeOptions}
          selected={selectedType}
          setSelected={handleTypeChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
      <div className="w-full sm:w-44">
        <SelectDropdown
          data={statusTypes}
          selected={selectedStatus}
          setSelected={handleStatusChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
      <div className="w-full sm:w-48">
        <SelectDropdown
          data={paymentStatusTypes}
          selected={selectedPaymentStatus}
          setSelected={handlePaymentStatusChange}
          classes="!h-10 !rounded-lg"
        />
      </div>
    </div>
  );
};

export default ExpensesFilter;
