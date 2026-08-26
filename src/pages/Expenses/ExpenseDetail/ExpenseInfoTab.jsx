import { useTranslation } from "react-i18next";
import Badge from "components/Badge";
import { formatAmount, getStatusBadgeVariant, PANEL_CLASS } from "./expenseDetailUtils";

const ExpenseInfoTab = ({ expense }) => {
  const { t } = useTranslation();

  return (
    <div className={PANEL_CLASS}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:expense_number")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.expenseNumber || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:employee")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.employeeName} ({expense.employeeIdNo})
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:department")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.department || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:project_name")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.projectName || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:expense_type")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.expenseType ? t(`expenses:${expense.expenseType}`) : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:expense_date")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.expenseDate}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:amount")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {formatAmount(expense.amount)} {expense.currency}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:payment_method")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.paymentMethod || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:approval_status")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            <Badge
              variant={getStatusBadgeVariant(expense.approvalStatus)}
              className="!size-fit px-3 py-1"
            >
              {expense.approvalStatus}
            </Badge>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:payment_status")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            <Badge
              variant={getStatusBadgeVariant(expense.paymentStatus)}
              className="!size-fit px-3 py-1"
            >
              {expense.paymentStatus}
            </Badge>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:approved_by")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.approvedBy || "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:approval_date")}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1">
            {expense.approvalDate || "-"}
          </p>
        </div>
      </div>
      {(expense.description || expense.notes) && (
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {t("expenses:description")}
          </p>
          <p className="font-medium text-slate-900 dark:text-white mt-1">
            {expense.description || expense.notes || "-"}
          </p>
        </div>
      )}
      {expense.receiptUrl && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/20">
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase mb-2">
            {t("expenses:receipt")}
          </p>
          <a
            href={expense.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-500/30 transition-colors"
          >
            {t("view")} {t("expenses:receipt")}
          </a>
        </div>
      )}
    </div>
  );
};

export default ExpenseInfoTab;
