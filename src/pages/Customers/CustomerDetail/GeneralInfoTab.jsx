import { useTranslation } from "react-i18next";

const STATUS_BADGE = {
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30",
  Inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30",
  Blocked: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-500/30",
};

const GeneralInfoTab = ({ customer }) => {
  const { t } = useTranslation();

  if (!customer) return null;

  const fields = [
    { label: t("customers:name"), value: customer.name },
    { label: t("customers:email"), value: customer.email },
    { label: t("customers:phone"), value: customer.phone },
    { label: t("customers:emergency_phone"), value: customer.emergencyPhone },
    { label: t("customers:customer_type"), value: customer.customerType },
    { label: t("customers:company_name"), value: customer.companyName },
    { label: t("customers:business_type"), value: customer.customerSegment },
    { label: t("customers:address"), value: customer.address },
    { label: t("customers:city"), value: customer.city },
    { label: t("customers:country"), value: customer.country },
    { label: t("customers:tax_number"), value: customer.taxNumber },
    { label: t("customers:registration_number"), value: customer.registrationNumber },
    {
      label: t("customers:opening_balance"),
      value: `${(parseFloat(customer.openingBalance) || 0).toLocaleString()} SAR`,
    },
    { label: t("created_by"), value: customer.createdByName },
    { label: t("updated_by"), value: customer.updatedByName },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
            {f.label}
          </p>
          <p className="font-semibold text-slate-900 dark:text-white mt-1 break-words">
            {f.value || "-"}
          </p>
        </div>
      ))}
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
          {t("customers:status")}
        </p>
        {customer.status ? (
          <span
            className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
              STATUS_BADGE[customer.status] ||
              "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30"
            }`}
          >
            {customer.status}
          </span>
        ) : (
          <p className="font-semibold text-slate-900 dark:text-white mt-1">-</p>
        )}
      </div>
    </div>
  );
};

export default GeneralInfoTab;
