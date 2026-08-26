import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { AiOutlineEdit } from "react-icons/ai";
import { toast } from "react-toastify";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchCustomerInvoiceById,
  sendCustomerInvoice,
  cancelCustomerInvoice,
  showCurrentCustomerInvoice,
} from "store/slices/financeSlice";
import { SkeletonDetail } from "components/Skeleton";

const { edit_customer } = rafeeqi_role_ids;

const fmt = (n) => (parseFloat(n) || 0).toLocaleString();

import { financeInvoiceStatusBadge as STATUS_BADGE } from "global/constant";

const InvoiceDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const invoice = useSelector(showCurrentCustomerInvoice);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomerInvoiceById(id));
  }, [dispatch, id]);

  const isRTL = i18n.language === "ar";

  const onSend = async () => {
    setBusy(true);
    try {
      const result = await dispatch(sendCustomerInvoice(id));
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:invoice_sent"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    setBusy(true);
    try {
      const result = await dispatch(cancelCustomerInvoice(id));
      if (result.error) throw new Error(result.payload || t("finance:save_failed"));
      toast.success(t("finance:invoice_cancelled"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!invoice || invoice.id !== id) {
    return <SkeletonDetail fields={8} />;
  }

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 dark:text-white">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => navigate("/finance/invoices")}
              icon={isRTL ? FiArrowRight : FiArrowLeft}
              className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20 dark:text-white/90"
              iconClass="!text-lg"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{invoice.customerName}</h1>
              <p className="text-sm text-mutedForeground font-mono">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_BADGE[invoice.status] || ""}`}>{invoice.status}</span>
            {["Sent", "Partial"].includes(invoice.status) && invoice.balanceDue > 0 && checkRoleAuth(edit_customer) && (
              <Link
                to={`/finance/payments/add?invoiceId=${id}`}
                className="h-11 px-4 flex items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white text-sm font-medium"
              >
                {t("finance:record_payment")}
              </Link>
            )}
            {invoice.status === "Draft" && checkRoleAuth(edit_customer) && (
              <>
                <Link
                  to={`/finance/invoices/edit/${id}`}
                  className="h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 hover:text-teal-600"
                  title={t("edit")}
                >
                  <AiOutlineEdit className="h-4 w-4" />
                </Link>
                <Button type="button" title={t("finance:cancel_invoice")} onClick={onCancel} disabled={busy} className="!bg-rose-50 !text-rose-700 dark:!bg-rose-500/20 dark:!text-rose-300" />
                <Button type="button" title={t("finance:send_invoice")} onClick={onSend} disabled={busy} btn="primary" />
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)]">
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-xs text-mutedForeground">{t("purchase:date")}</p>
              <p className="font-medium">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-mutedForeground">{t("finance:due_date")}</p>
              <p className="font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-mutedForeground">{t("contact")}</p>
              <p className="font-medium">{invoice.customerContact || "—"}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="text-left text-xs text-mutedForeground border-b border-slate-200 dark:border-white/10">
                <th className="pb-2">{t("description")}</th>
                <th className="pb-2">{t("finance:revenue")}</th>
                <th className="pb-2 text-end">{t("finance:amount")}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lines || []).map((line, idx) => (
                <tr key={idx} className="border-b border-slate-100 dark:border-white/5">
                  <td className="py-2">{line.description}</td>
                  <td className="py-2 text-xs text-mutedForeground">{line.revenueAccountCode} — {line.revenueAccountName}</td>
                  <td className="py-2 text-end tabular-nums">{fmt(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoice.vatAmount > 0 && (
            <div className="flex justify-end gap-8 text-sm mb-4 text-slate-600 dark:text-white/70">
              <span>{t("finance:subtotal")}: {fmt(invoice.subtotal)}</span>
              <span>{t("finance:vat_rate")} ({invoice.vatRate}%): {fmt(invoice.vatAmount)}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <p className="text-xs text-mutedForeground">{t("finance:inv_total")}</p>
              <p className="text-xl font-bold tabular-nums mt-1">{fmt(invoice.total)} {invoice.currency}</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4">
              <p className="text-xs text-mutedForeground">{t("finance:paid_to_date")}</p>
              <p className="text-xl font-bold tabular-nums mt-1">{fmt(invoice.paidToDate)} {invoice.currency}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/10 p-4">
              <p className="text-xs text-mutedForeground">{t("finance:balance_due")}</p>
              <p className="text-xl font-bold tabular-nums mt-1 text-emerald-700 dark:text-emerald-300">{fmt(invoice.balanceDue)} {invoice.currency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;
