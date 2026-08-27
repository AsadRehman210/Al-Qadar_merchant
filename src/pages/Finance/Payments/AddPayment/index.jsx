import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchBankAccounts,
  fetchChartOfAccounts,
  fetchCustomerInvoiceById,
  fetchVendorBillById,
  createPayment,
  showBankAccounts,
  showChartOfAccounts,
  showCurrentCustomerInvoice,
  showCurrentVendorBill,
} from "store/slices/financeSlice";

const { add_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString();

// A Payment is the one shared write path for cash-in/cash-out — recording
// one against an invoice/bill is what actually advances its paidToDate and
// status; a standalone payment (no invoiceId/billId) needs the user to pick
// the other side of the entry directly, like a bank entry.
const AddPayment = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoiceId") || "";
  const billId = searchParams.get("billId") || "";

  const bankAccounts = useSelector(showBankAccounts);
  const coaAccounts = useSelector(showChartOfAccounts);
  const invoice = useSelector(showCurrentCustomerInvoice);
  const bill = useSelector(showCurrentVendorBill);

  useEffect(() => {
    if (!bankAccounts.length) dispatch(fetchBankAccounts());
    if (!coaAccounts.length) dispatch(fetchChartOfAccounts());
  }, [dispatch, bankAccounts.length, coaAccounts.length]);

  useEffect(() => {
    if (invoiceId) dispatch(fetchCustomerInvoiceById(invoiceId));
    if (billId) dispatch(fetchVendorBillById(billId));
  }, [dispatch, invoiceId, billId]);

  const direction = invoiceId ? "receipt" : billId ? "disbursement" : null;
  const [standaloneDirection, setStandaloneDirection] = useState("receipt");
  const effectiveDirection = direction || standaloneDirection;

  const bankOpts = useMemo(() => bankAccounts.map((a) => ({ id: a.id, title: `${a.name} (${a.currency})` })), [bankAccounts]);
  const [selBank, setSelBank] = useState(null);

  const contraOpts = useMemo(() => coaAccounts.map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` })), [coaAccounts]);
  const [selContra, setSelContra] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const balanceDue = invoiceId ? invoice?.balanceDue : billId ? bill?.balanceDue : null;

  const { register, handleSubmit } = useForm({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      amount: "",
      reference: "",
      method: "",
    },
  });

  useEffect(() => {
    if (!checkRoleAuth(add_customer)) {
      toast.error(t("finance:not_authorized"));
      navigate("/finance/payments");
    }
  }, [navigate, t]);

  const onSubmit = async (data) => {
    if (!selBank?.id) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    if (!invoiceId && !billId && !selContra?.id) {
      toast.error(t("finance:invalid_data"));
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        date: data.date,
        direction: effectiveDirection,
        amount: parseFloat(data.amount) || 0,
        method: data.method || undefined,
        reference: data.reference || undefined,
        bankAccountId: selBank.id,
        invoiceId: invoiceId || undefined,
        billId: billId || undefined,
        contraAccountId: !invoiceId && !billId ? selContra.id : undefined,
      };
      const result = await dispatch(createPayment(payload));
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:save_success"));
      navigate(billId ? `/finance/payable/${billId}` : "/finance/payments");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!checkRoleAuth(add_customer)) return null;
  const isRTL = i18n.language === "ar";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/finance/payments")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
            iconClass="!text-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight">{t("finance:add_payment")}</h1>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]"
        >
          {(invoiceId || billId) && (
            <div className="mb-6 rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-white/5">
              <p className="text-sm text-mutedForeground">
                {invoiceId ? `${t("finance:customer")}: ${invoice?.customerName || "…"}` : `${t("finance:supplier")}: ${bill?.vendorName || "…"}`}
              </p>
              {balanceDue != null && (
                <p className="text-lg font-bold tabular-nums mt-1">
                  {t("finance:balance_due")}: {fmt(balanceDue)}
                </p>
              )}
            </div>
          )}

          {!invoiceId && !billId && (
            <div className="mb-6 flex gap-2">
              {[
                { id: "receipt", label: t("finance:receipt") },
                { id: "disbursement", label: t("finance:disbursement") },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStandaloneDirection(opt.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${standaloneDirection === opt.id ? "bg-teal-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/70"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <FormInput label={t("finance:posted_date")} name="date" type="date" register={register} required />
            <FormInput label={t("finance:amount")} name="amount" type="number" step="0.01" min={0} decimal decimalPlaces={3} maxLength={10} register={register} required />
            <div>
              <label className="text-sm font-medium mb-1 block">{t("finance:bank_title")}</label>
              <SelectDropdown data={bankOpts} selected={selBank} setSelected={setSelBank} hideClear classes="!h-[46px] !rounded-lg" />
            </div>
            {!invoiceId && !billId && (
              <div>
                <label className="text-sm font-medium mb-1 block">{t("finance:contra_account")}</label>
                <SelectDropdown
                  data={contraOpts}
                  selected={selContra}
                  setSelected={setSelContra}
                  hideClear
                  placeholder={t("finance:select_contra_account")}
                  classes="!h-[46px] !rounded-lg"
                />
              </div>
            )}
            <FormInput label={t("finance:method")} name="method" register={register} />
            <FormInput label={t("finance:reference")} name="reference" pattern={/[A-Za-z0-9\-/]/} maxLength={100} register={register} />
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <Button type="button" title={t("cancel")} onClick={() => navigate("/finance/payments")} />
            <Button type="submit" title={t("save")} btn="primary" disabled={submitting} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;
