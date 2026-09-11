import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import Button from "components/Button";
import FormInput from "components/FormInput";
import SelectDropdown from "components/SelectDropdown";
import { SkeletonDetail } from "components/Skeleton";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import { paymentMethodOptions } from "global/constant";
import {
  fetchAssetPurchaseById,
  postAssetPurchase,
  addAssetPurchasePayment,
  showCurrentAssetPurchase,
  showCurrentAssetPurchaseLoading,
  clearCurrentAssetPurchase,
} from "store/slices/assetPurchaseSlice";

const { view_asset_purchase, edit_asset_purchase } = alqadar_role_ids;

const AssetPurchaseDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";
  const current = useSelector(showCurrentAssetPurchase);
  const loading = useSelector(showCurrentAssetPurchaseLoading);
  const [posting, setPosting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState(paymentMethodOptions[0]);
  const [payRef, setPayRef] = useState("");

  useEffect(() => {
    if (id) dispatch(fetchAssetPurchaseById(id));
    return () => dispatch(clearCurrentAssetPurchase());
  }, [dispatch, id]);

  if (!checkRoleAuth(view_asset_purchase)) return null;
  if (loading && current?.id !== id) {
    return <div className="space-y-6"><SkeletonDetail fields={8} /></div>;
  }
  if (!current) return null;

  const fmt = (n) => `${(parseFloat(n) || 0).toLocaleString()} ${current.currency || "SAR"}`;

  const handlePost = async () => {
    setPosting(true);
    try {
      await dispatch(postAssetPurchase(id)).unwrap();
      toast.success(t("asset:purchase_posted"));
    } catch (err) {
      toast.error(err?.message || err || "");
    } finally {
      setPosting(false);
    }
  };

  const handlePay = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      toast.error(t("purchase:payment_amount_required"));
      return;
    }
    setPaying(true);
    try {
      await dispatch(addAssetPurchasePayment({
        id,
        data: { date: payDate, amount, method: payMethod?.id, reference: payRef || undefined },
      })).unwrap();
      toast.success(t("purchase:payment_recorded"));
      setPayAmount("");
      setPayRef("");
    } catch (err) {
      toast.error(err?.message || err || "");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] space-y-6">
      <div className="flex flex-wrap items-center gap-4 dark:text-white">
        <Button type="button" onClick={() => navigate("/assets/purchases")} icon={isRTL ? FiArrowRight : FiArrowLeft}
          className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{current.purchaseNumber}</h1>
          <p className="text-mutedForeground">{current.supplierName} · {current.date ? String(current.date).slice(0, 10) : "—"}</p>
        </div>
        {current.status === "Draft" && checkRoleAuth(edit_asset_purchase) && (
          <div className="flex gap-2">
            <Button type="button" title={t("edit")} onClick={() => navigate(`/assets/purchases/edit/${id}`)} className="!rounded-md" />
            <Button type="button" title={t("asset:post_purchase")} loading={posting} onClick={handlePost}
              className="!rounded-md !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div><p className="text-xs text-slate-500 uppercase">{t("asset:status")}</p><p className="font-semibold mt-1">{current.status}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">{t("asset:total")}</p><p className="font-semibold mt-1">{fmt(current.total)}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">{t("asset:amount_paid")}</p><p className="font-semibold mt-1">{fmt(current.paidAmount)}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">{t("asset:balance_due")}</p><p className="font-semibold mt-1">{fmt(current.balanceDue)}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">{t("created_by")}</p><p className="font-semibold mt-1">{current.createdByName || "—"}</p></div>
          <div><p className="text-xs text-slate-500 uppercase">{t("updated_by")}</p><p className="font-semibold mt-1">{current.updatedByName || "—"}</p></div>
        </div>
      </div>

      <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7">
        <h2 className="text-lg font-bold mb-4">{t("asset:purchase_lines")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500">
                <th className="pb-2">{t("asset:asset_name")}</th>
                <th className="pb-2">{t("asset:category")}</th>
                <th className="pb-2">{t("asset:qty")}</th>
                <th className="pb-2">{t("asset:unit_price")}</th>
                <th className="pb-2">{t("asset:serial_number")}</th>
                <th className="pb-2">{t("asset:location")}</th>
              </tr>
            </thead>
            <tbody>
              {(current.lines || []).map((line, i) => (
                <tr key={i} className="border-t border-slate-100 dark:border-white/10">
                  <td className="py-2.5">{line.name}</td>
                  <td className="py-2.5">{line.categoryName || "—"}</td>
                  <td className="py-2.5">{line.qty}</td>
                  <td className="py-2.5">{fmt(line.price)}</td>
                  <td className="py-2.5">{line.serialNumber || "—"}</td>
                  <td className="py-2.5">{line.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {current.status === "Posted" && (
          <p className="text-xs text-slate-400 mt-3">{t("asset:posted_creates_assets")}</p>
        )}
      </div>

      {current.status === "Posted" && (
        <div className="bg-white dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-3xl p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t("purchase:payment_history")}</h2>
            <Link to="/assets" className="text-sm font-semibold text-teal-600 hover:underline">{t("asset:view_register")}</Link>
          </div>
          {(current.paymentHistory || []).length === 0 ? (
            <p className="text-sm text-slate-400">{t("asset:no_payments")}</p>
          ) : (
            <ul className="space-y-2">
              {(current.paymentHistory || []).map((p, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-slate-100 dark:border-white/10 pb-2">
                  <span>{String(p.date || "").slice(0, 10)} · {p.method || "—"}{p.reference ? ` · ${p.reference}` : ""}</span>
                  <span className="font-semibold">{fmt(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
          {checkRoleAuth(edit_asset_purchase) && (current.balanceDue || 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <FormInput label={t("purchase:payment_date")} type="date" value={payDate} onValueChange={setPayDate} />
              <FormInput label={t("purchase:amount_paid")} type="number" value={payAmount} onValueChange={setPayAmount} />
              <SelectDropdown label={t("purchase:payment_method")} data={paymentMethodOptions} selected={payMethod} setSelected={setPayMethod} hideClear />
              <FormInput label={t("purchase:reference")} value={payRef} onValueChange={setPayRef} />
              <div className="md:col-span-4 flex justify-end">
                <Button type="button" title={t("purchase:record_payment")} loading={paying} onClick={handlePay}
                  className="!rounded-md !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AssetPurchaseDetail;
