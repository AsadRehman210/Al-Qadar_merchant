import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheck, FiX } from "react-icons/fi";
import { LuBadgeDollarSign } from "react-icons/lu";
import Button from "components/Button";
import FormTextarea from "components/FormTextarea";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { EXPENSE_STATUS } from "global/constant";
import {
  fetchExpenseById,
  managerApproveExpense,
  managerRejectExpense,
  hrApproveExpense,
  hrRejectExpense,
  markExpenseReimbursed,
  showCurrentExpense,
  showCurrentExpenseLoading,
  clearCurrentExpense,
} from "store/slices/expenseSlice";
import { SkeletonDetail } from "components/Skeleton";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchDepartments, showDepartments } from "store/slices/departmentSlice";
import Badge from "components/Badge";
import { formatAmount, getStatusBadgeVariant } from "./expenseDetailUtils";
import ExpenseInfoTab from "./ExpenseInfoTab";
import ApprovalHistoryTab from "./ApprovalHistoryTab";
import PaymentHistoryTab from "./PaymentHistoryTab";

const { view_expense, approve_expense } = alqadar_role_ids;

const TAB_CLASS =
  "min-w-[140px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";

const ExpenseDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const [comments, setComments] = useState("");
  const [acting, setActing] = useState(false);

  const current = useSelector(showCurrentExpense);
  const currentLoading = useSelector(showCurrentExpenseLoading);
  const employees = useSelector(showEmployees);
  const departments = useSelector(showDepartments);

  useEffect(() => {
    dispatch(fetchExpenseById(id));
    dispatch(fetchEmployees());
    dispatch(fetchDepartments());
    return () => dispatch(clearCurrentExpense());
  }, [id, dispatch]);

  // employeeName/employeeIdNo/department aren't on the expense record itself
  // (only employeeId) — resolved here, same pattern as the list page.
  const expense = useMemo(() => {
    if (!current || current.id !== id) return null;
    const emp = employees.find((e) => e.id === current.employeeId);
    const manager = emp ? employees.find((e) => e.id === emp.managerEmployeeId) : null;
    return {
      ...current,
      employeeName: emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—",
      employeeIdNo: emp?.employeeCode,
      department: emp ? departments.find((d) => d.id === emp.departmentId)?.name : null,
      managerName: manager ? `${manager.first_name || ""} ${manager.last_name || ""}`.trim() : t("expenses:no_manager_assigned"),
    };
  }, [current, id, employees, departments, t]);

  if (!checkRoleAuth(view_expense)) return null;

  const runAction = async (thunk, successMsg) => {
    setActing(true);
    try {
      await dispatch(thunk({ id, comments })).unwrap();
      await dispatch(fetchExpenseById(id));
      toast.success(successMsg);
      setComments("");
    } catch (err) {
      toast.error(err || t("expenses:action_failed"));
    } finally {
      setActing(false);
    }
  };

  if (currentLoading && !expense) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">
          {t("no_record_found")}
        </p>
        <Button
          title={t("back")}
          onClick={() => navigate("/expenses")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const isPendingManager = expense.approvalStatus === EXPENSE_STATUS.PENDING_MANAGER;
  const isPendingHr = expense.approvalStatus === EXPENSE_STATUS.PENDING_HR;

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/expenses")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2 min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {expense.expenseNumber} - {expense.employeeName}
            </h1>
            <p className="text-mutedForeground text-sm">
              {expense.expenseType ? t(`expenses:${expense.expenseType}`) : "-"}{" "}
              • {formatAmount(expense.amount)} {expense.currency} •{" "}
              <Badge
                variant={getStatusBadgeVariant(expense.approvalStatus)}
                className="!size-fit px-3 py-1"
              >
                {expense.approvalStatus}
              </Badge>
            </p>
          </div>
          {checkRoleAuth(approve_expense) &&
            expense.approvalStatus === EXPENSE_STATUS.APPROVED &&
            expense.paymentStatus !== "Reimbursed" && (
              <Button
                title={t("expenses:mark_reimbursed")}
                icon={LuBadgeDollarSign}
                disabled={acting}
                className="!w-auto !rounded-lg !h-11 !px-5 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600"
                iconClass="!text-lg"
                onClick={async () => {
                  setActing(true);
                  try {
                    await dispatch(markExpenseReimbursed(expense.id)).unwrap();
                    await dispatch(fetchExpenseById(id));
                    toast.success(t("expenses:reimburse_success"));
                  } catch (err) {
                    toast.error(err || t("expenses:action_failed"));
                  } finally {
                    setActing(false);
                  }
                }}
              />
            )}
        </div>

        {/* Approval flow + action panel */}
        <div className="mb-6 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-2xl px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {[t("requests:step_submit"), t("requests:step_manager"), t("requests:step_hr"), t("requests:step_approved")].map((step, i) => {
              const idxMap = { [EXPENSE_STATUS.PENDING_MANAGER]: 1, [EXPENSE_STATUS.PENDING_HR]: 2, [EXPENSE_STATUS.APPROVED]: 3 };
              const cur = idxMap[expense.approvalStatus] ?? 0;
              const done = expense.approvalStatus === EXPENSE_STATUS.APPROVED || i <= cur;
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500 dark:bg-white/10"}`}>{i + 1}</div>
                  <span className="text-xs font-medium text-slate-600 dark:text-white/70">{step}</span>
                  {i < 3 && <span className="text-slate-300 mx-1">→</span>}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-white/60 mt-2">
            {expense.appliedVia === "hr" ? t("requests:no_approval_needed") : `${t("requests:manager")}: ${expense.managerName}`}
          </p>

          {checkRoleAuth(approve_expense) && (isPendingManager || isPendingHr) && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
              <p className={`text-sm font-semibold mb-2 ${isPendingManager ? "text-amber-700 dark:text-amber-300" : "text-blue-700 dark:text-blue-300"}`}>
                {isPendingManager ? t("requests:manager_approvals") : t("requests:hr_approvals")}
              </p>
              <FormTextarea
                rows={2}
                value={comments}
                onValueChange={setComments}
                placeholder={t("requests:comments_placeholder")}
                wrapperClass="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  title={t("requests:approve")}
                  icon={FiCheck}
                  iconClass="h-4 w-4"
                  disabled={acting}
                  onClick={() =>
                    runAction(
                      isPendingManager ? managerApproveExpense : hrApproveExpense,
                      t("expenses:approve_success"),
                    )
                  }
                  className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-emerald-500 hover:!bg-emerald-600"
                />
                <Button
                  type="button"
                  title={t("requests:reject")}
                  icon={FiX}
                  iconClass="h-4 w-4"
                  disabled={acting}
                  onClick={() =>
                    runAction(
                      isPendingManager ? managerRejectExpense : hrRejectExpense,
                      t("expenses:reject_success"),
                    )
                  }
                  className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-rose-500 hover:!bg-rose-600"
                />
              </div>
            </div>
          )}
        </div>

        <TabGroup>
          <TabList className="inline-flex items-center gap-1.5 p-1.5 rounded-lg mb-6 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
            <Tab className={TAB_CLASS}>{t("expenses:expense_info")}</Tab>
            <Tab className={TAB_CLASS}>{t("expenses:approval_history")}</Tab>
            <Tab className={TAB_CLASS}>{t("expenses:payment_history")}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ExpenseInfoTab expense={expense} />
            </TabPanel>
            <TabPanel>
              <ApprovalHistoryTab expense={expense} />
            </TabPanel>
            <TabPanel>
              <PaymentHistoryTab expense={expense} />
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default ExpenseDetail;
