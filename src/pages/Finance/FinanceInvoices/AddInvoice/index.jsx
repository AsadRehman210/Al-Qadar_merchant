import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { IoAdd, IoTrash } from "react-icons/io5";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchChartOfAccounts,
  fetchCustomerInvoiceById,
  createCustomerInvoice,
  updateCustomerInvoice,
  showChartOfAccounts,
  showCurrentCustomerInvoice,
} from "store/slices/financeSlice";

const { add_customer, edit_customer } = rafeeqi_role_ids;

const emptyLine = () => ({ key: `${Date.now()}-${Math.random()}`, description: "", amount: "", account: null });

// Line-item amount is a raw controlled <input> (not FormInput/register), so it
// gets the same money-precision rule (no negative, max 2dp) applied by hand:
// strip anything but digits/dot and cap the fractional part at 2 digits.
const sanitizeAmount = (value) => {
  let v = value.replace(/[^0-9.]/g, "");
  const dot = v.indexOf(".");
  if (dot !== -1) {
    const whole = v.slice(0, dot);
    const frac = v.slice(dot + 1).replace(/\./g, "").slice(0, 3);
    v = frac.length || v.endsWith(".") ? `${whole}.${frac}` : whole;
  }
  return v.slice(0, 10);
};

// An invoice only stays freely editable while it's Draft — sending it posts
// real ledger lines (see customer-invoice-service's send), after which it's
// permanently locked, same rule Vendor Bills and Journal Entries follow.
const AddInvoice = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const accounts = useSelector(showChartOfAccounts);
  const existing = useSelector(showCurrentCustomerInvoice);

  useEffect(() => {
    if (!accounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, accounts.length]);

  useEffect(() => {
    if (id) dispatch(fetchCustomerInvoiceById(id));
  }, [dispatch, id]);

  const revenueOpts = useMemo(
    () => accounts.filter((a) => a.type === "Revenue").map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })),
    [accounts],
  );

  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { customerName: "", customerContact: "", invoiceNumber: "", invoiceDate: new Date().toISOString().slice(0, 10), dueDate: "" },
  });

  useEffect(() => {
    if (id && existing?.id === id) {
      if (existing.status !== "Draft") {
        toast.error(t("finance:invoice_locked"));
        navigate(`/finance/invoices/${id}`);
        return;
      }
      reset({
        customerName: existing.customerName,
        customerContact: existing.customerContact || "",
        invoiceNumber: existing.invoiceNumber,
        invoiceDate: existing.invoiceDate?.slice(0, 10),
        dueDate: existing.dueDate?.slice(0, 10),
      });
      setLines(
        (existing.lines || []).map((l) => ({
          key: `${Date.now()}-${Math.random()}`,
          description: l.description,
          amount: l.amount,
          account: l.revenueAccountId ? { id: l.revenueAccountId, title: `${l.revenueAccountCode} — ${l.revenueAccountName}` } : null,
        })),
      );
    }
  }, [id, existing, reset, navigate, t]);

  useEffect(() => {
    if (id && !checkRoleAuth(edit_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/invoices");
    } else if (!id && !checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/invoices");
    }
  }, [id, navigate, t]);

  const updateLine = (key, patch) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (key) => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const total = lines.reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
  const linesValid = lines.every((l) => l.account?.id && l.description && (parseFloat(l.amount) || 0) > 0);

  const onSubmit = async (data) => {
    if (!linesValid) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customerName: data.customerName,
        customerContact: data.customerContact,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        lines: lines.map((l) => ({ description: l.description, amount: parseFloat(l.amount) || 0, revenueAccountId: l.account.id })),
      };
      if (id) {
        const result = await dispatch(updateCustomerInvoice({ id, data: payload }));
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:update_success"));
      } else {
        const result = await dispatch(createCustomerInvoice(payload));
        if (result.error) throw new Error(result.payload || t("finance:save_failed"));
        toast.success(t("finance:save_success"));
      }
      navigate("/finance/invoices");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if ((id && !checkRoleAuth(edit_customer)) || (!id && !checkRoleAuth(add_customer))) return null;
  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/invoices")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">{id ? t("finance:edit_invoice") : t("finance:add_invoice")}</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <FormInput label={t("finance:customer")} name="customerName" pattern={/[a-zA-Z0-9\s.'&,-]/} minLength={2} maxLength={150} register={register} required />
            <FormInput label={t("contact")} name="customerContact" register={register} />
            <FormInput label={t("purchase:invoice_number")} name="invoiceNumber" pattern={/[A-Za-z0-9\-/]/} minLength={2} maxLength={100} register={register} required />
            <FormInput label={t("purchase:date")} name="invoiceDate" type="date" register={register} required />
            <FormInput label={t("finance:due_date")} name="dueDate" type="date" register={register} required />
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700 dark:text-white/90">{t("finance:lines")}</span>
            <button type="button" onClick={addLine} className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700">
              <IoAdd className="h-4 w-4" /> {t("finance:add_line")}
            </button>
          </div>

          <div className="space-y-3">
            {lines.map((line) => (
              <div key={line.key} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_36px] gap-3 items-end">
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("description")}</label>
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => updateLine(line.key, { description: e.target.value })}
                    maxLength={200}
                    className="h-[46px] w-full px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("finance:revenue")}</label>
                  <SelectDropdown
                    data={revenueOpts}
                    selected={line.account}
                    setSelected={(opt) => updateLine(line.key, { account: opt })}
                    hideClear
                    classes="!h-[46px] !rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">{t("finance:amount")}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    maxLength={10}
                    value={line.amount}
                    onChange={(e) => updateLine(line.key, { amount: sanitizeAmount(e.target.value) })}
                    className="h-[46px] w-full px-3 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length <= 1}
                  className="h-[46px] w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title={t("finance:remove_line")}
                >
                  <IoTrash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <span className="text-sm font-semibold text-slate-700 dark:text-white/90">
              {t("finance:inv_total")}: {total.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/invoices")} />
            <Button type="submit" title={id ? t("update") : t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInvoice;
