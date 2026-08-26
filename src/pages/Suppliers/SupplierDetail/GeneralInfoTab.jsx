import { useTranslation } from "react-i18next";

const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
      {label}
    </p>
    <p className="font-semibold text-slate-900 dark:text-white mt-1">
      {value ?? "-"}
    </p>
  </div>
);

const STATUS_BADGE = {
  Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-500/30",
  Inactive: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30",
  Suspended: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/30",
};

const headingClass =
  "font-semibold text-slate-900 dark:text-white mb-4 pb-3 w-full border-b border-slate-200 dark:border-white/15";

const GeneralInfoTab = ({ supplier }) => {
  const { t } = useTranslation();

  if (!supplier) return null;

  return (
    <div className="space-y-8">
      <div>
        <h4 className={headingClass}>{t("suppliers:section_basic")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("suppliers:name")} value={supplier.name} />
          <Field label={t("suppliers:email")} value={supplier.email} />
          <Field label={t("suppliers:phone")} value={supplier.phone} />
          <Field
            label={t("suppliers:emergency_phone")}
            value={supplier.emergencyPhone}
          />
          <Field label={t("suppliers:address")} value={supplier.address} />
          <Field label={t("suppliers:country")} value={supplier.country} />
          <Field label={t("suppliers:city")} value={supplier.city} />
          <Field
            label={t("suppliers:supplier_type")}
            value={supplier.supplierType}
          />
          <Field label={t("suppliers:tax_number")} value={supplier.taxNumber} />
          <Field
            label={t("suppliers:registration_number")}
            value={supplier.registrationNumber}
          />
          <Field
            label={t("suppliers:license_number")}
            value={supplier.licenseNumber}
          />
          <Field
            label={t("suppliers:license_expiry_date")}
            value={
              supplier.licenseExpiryDate
                ? String(supplier.licenseExpiryDate).slice(0, 10)
                : null
            }
          />
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">
              {t("suppliers:status")}
            </p>
            {supplier.status ? (
              <span
                className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  STATUS_BADGE[supplier.status] ||
                  "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-500/30"
                }`}
              >
                {supplier.status}
              </span>
            ) : (
              <p className="font-semibold text-slate-900 dark:text-white mt-1">-</p>
            )}
          </div>
        </div>
      </div>

      {supplier.supplierType === "Company" && (
        <div>
          <h4 className={headingClass}>
            {t("suppliers:contact_person_section")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Field
              label={t("suppliers:contact_person_name")}
              value={supplier.contactPersonName}
            />
            <Field
              label={t("suppliers:contact_person_phone")}
              value={supplier.contactPersonPhone}
            />
            <Field
              label={t("suppliers:contact_person_email")}
              value={supplier.contactPersonEmail}
            />
            <Field
              label={t("suppliers:designation")}
              value={supplier.contactPersonDesignation}
            />
          </div>
        </div>
      )}

      <div>
        <h4 className={headingClass}>{t("suppliers:bank_details")}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Field label={t("suppliers:bank_name")} value={supplier.bankName} />
          <Field
            label={t("suppliers:account_title")}
            value={supplier.accountTitle}
          />
          <Field
            label={t("suppliers:account_number")}
            value={supplier.accountNumber}
          />
          <Field label={t("suppliers:iban")} value={supplier.iban} />
          <Field
            label={t("suppliers:branch_code")}
            value={supplier.branchCode}
          />
          <Field label={t("suppliers:swift")} value={supplier.swift} />
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoTab;
