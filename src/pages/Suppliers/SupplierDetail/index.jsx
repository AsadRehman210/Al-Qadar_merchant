import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import Button from "components/Button";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { fetchSupplierById, showCurrentSupplier, showCurrentSupplierLoading, clearCurrentSupplier } from "store/slices/supplierSlice";
import { SkeletonDetail } from "components/Skeleton";
import GeneralInfoTab from "./GeneralInfoTab";
import SupplyInvoicesTab from "./SupplyInvoicesTab";
import PaymentHistoryTab from "./PaymentHistoryTab";
import DebitCreditBalanceTab from "./DebitCreditBalanceTab";
import LedgerTab from "./LedgerTab";

const STATUS_BADGE = {
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30",
  Inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30",
  Suspended: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/30",
};

const TAB_CLASS =
  "min-w-[140px] whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex justify-center items-center font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white data-[selected]:font-semibold hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";

const SupplierDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const supplier = useSelector(showCurrentSupplier);
  const loading = useSelector(showCurrentSupplierLoading);

  useEffect(() => {
    if (id) dispatch(fetchSupplierById(id));
    return () => dispatch(clearCurrentSupplier());
  }, [id, dispatch]);

  const formatAmount = (val) => (parseFloat(val) || 0).toLocaleString();

  if (loading && !supplier) {
    return (
      <div className="space-y-6">
        <SkeletonDetail fields={4} />
        <SkeletonDetail fields={9} />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button
          title={t("back")}
          onClick={() => navigate("/suppliers")}
          className="mt-4"
        />
      </div>
    );
  }

  const isRTL = i18n.language === "ar";
  const panelClass =
    "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-8 border-l-4 !border-l-[var(--color-teal-500)] dark:border-l-teal-500/60";

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 relative flex flex-wrap items-center gap-4 animate-[partners-cardIn_0.5s_ease-out] dark:text-white">
          <Button
            type="button"
            onClick={() => navigate("/suppliers")}
            icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-teal-700 dark:bg-white/10 dark:border-white/20 dark:text-white/90 dark:hover:bg-white/20 dark:hover:text-teal-300 transition-all duration-250"
            iconClass="!text-lg"
          />
          <div className="flex flex-col space-y-2.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {supplier.name}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_BADGE[supplier.status] ||
                  "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30"
                }`}
              >
                {supplier.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {supplier.supplierType && (
                <span className="text-mutedForeground text-sm">{supplier.supplierType}</span>
              )}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  (Number(supplier.currentBalance) || 0) > 0
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-500/25"
                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/25"
                }`}
              >
                {t("suppliers:balance_due")}: {formatAmount(supplier.currentBalance)} SAR
              </span>
            </div>
          </div>
          <Button
            title={t("suppliers:edit")}
            icon={FaRegEdit}
            className="!w-auto !rounded-md !h-11 !px-5 !border border-slate-200 dark:!border-white/25 !text-white dark:!text-white dark:!bg-white/10 hover:!bg-slate-50 dark:hover:!bg-white/20"
            iconClass="!text-lg"
            onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
            btn="primary"
          />
        </div>

        <TabGroup>
          <TabList className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-lg mb-6 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20">
            <Tab className={TAB_CLASS}>{t("suppliers:general_info")}</Tab>
            <Tab className={TAB_CLASS}>{t("suppliers:tab_supply_invoices")}</Tab>
            <Tab className={TAB_CLASS}>{t("suppliers:payment_history")}</Tab>
            <Tab className={TAB_CLASS}>{t("suppliers:debit_credit_balance")}</Tab>
            <Tab className={TAB_CLASS}>{t("suppliers:ledger")}</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className={panelClass}>
                <GeneralInfoTab supplier={supplier} />
              </div>
            </TabPanel>
            <TabPanel>
              <div className={panelClass}>
                <SupplyInvoicesTab supplier={supplier} />
              </div>
            </TabPanel>
            <TabPanel>
              <div className={panelClass}>
                <PaymentHistoryTab supplier={supplier} />
              </div>
            </TabPanel>
            <TabPanel>
              <div className={panelClass}>
                <DebitCreditBalanceTab supplier={supplier} />
              </div>
            </TabPanel>
            <TabPanel>
              <div className={panelClass}>
                <LedgerTab supplier={supplier} />
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default SupplierDetail;
