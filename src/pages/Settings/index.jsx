import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import {
  FiSettings, FiDollarSign, FiPercent, FiBell, FiSliders,
  FiTrash2, FiPlus, FiSave, FiCheck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import FormInput from "components/FormInput";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  getCompany, getFinancial, getTaxRates, getNotifications, getSystemSettings,
  saveCompany, saveFinancial, saveNotifications, saveSystem,
  addTaxRate, updateTaxRate, deleteTaxRate,
  TAX_TYPE_OPTS, CURRENCY_OPTS, DATE_FORMAT_OPTS, TIMEZONE_OPTS,
  LANGUAGE_OPTS, TIME_FORMAT_OPTS,
} from "./settingsFakeData";

const { view_settings, edit_settings } = alqadar_role_ids;

const inputCls = "w-full h-[46px] px-3 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white";
const formInputCls = "!h-[46px] !rounded-xl";
const labelCls = "text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5 block";
const sectionHead = "text-base font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10";
const NAME_AMP = /[a-zA-Z0-9\s.'&,-]/;
const NAME = /[a-zA-Z0-9\s.'-]/;

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer">
    <span className="text-sm text-slate-700 dark:text-white/80">{label}</span>
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-teal-500" : "bg-slate-200 dark:bg-white/20"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </label>
);

// -- Company Profile Tab -------------------------------------------------------
const CompanyTab = ({ canEdit }) => {
  const [form, setForm] = useState(getCompany());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!form.name?.trim()) {
      toast.error("Company name is required.");
      return;
    }
    const email = (form.email || "").trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      toast.error("Please enter a valid email.");
      return;
    }
    saveCompany(form);
    toast.success("Company settings saved.");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FormInput label="Company Name" required value={form.name || ""} onValueChange={(v) => set("name", v)} placeholder="Rafeeqi Enterprise" pattern={NAME_AMP} minLength={2} maxLength={100} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Legal Name" value={form.legalName || ""} onValueChange={(v) => set("legalName", v)} placeholder="Rafeeqi Enterprise Co. Ltd." pattern={NAME_AMP} minLength={2} maxLength={100} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Contact Email" required type="email" value={form.email || ""} onValueChange={(v) => set("email", v)} placeholder="info@company.com" inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Phone" value={form.phone || ""} onValueChange={(v) => set("phone", v)} placeholder="+966 XX XXX XXXX" pattern={/[0-9+\-() ]/} minLength={7} maxLength={20} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Website" value={form.website || ""} onValueChange={(v) => set("website", v)} placeholder="https://example.com" pattern={/[a-zA-Z0-9:/.\-_?=&%]/} maxLength={200} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="VAT / Tax Number" value={form.taxNumber || ""} onValueChange={(v) => set("taxNumber", v)} placeholder="300XXXXXXXXX" pattern={/[A-Za-z0-9-]/} minLength={3} maxLength={50} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="CR Number" value={form.crNumber || ""} onValueChange={(v) => set("crNumber", v)} placeholder="1010XXXXXX" pattern={/[0-9]/} minLength={8} maxLength={15} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Country" value={form.country || ""} onValueChange={(v) => set("country", v)} placeholder="Saudi Arabia" pattern={NAME} minLength={2} maxLength={100} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="City" value={form.city || ""} onValueChange={(v) => set("city", v)} placeholder="Riyadh" pattern={NAME} minLength={2} maxLength={100} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput wrapperClass="md:col-span-2 lg:col-span-3" label="Address" value={form.address || ""} onValueChange={(v) => set("address", v)} placeholder="Full address" pattern={NAME} minLength={5} maxLength={255} inputClass={formInputCls} labelClass={labelCls} />
        </div>
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
            <FiSave size={14} />Save Company Info
          </button>
        </div>
      )}
    </div>
  );
};

// -- Financial Settings Tab ----------------------------------------------------
const FinancialTab = ({ canEdit }) => {
  const [form, setForm] = useState(getFinancial());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { saveFinancial(form); toast.success("Financial settings saved."); };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>Fiscal Year & Currency</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className={labelCls}>Default Currency</label>
            <select value={form.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} className={inputCls} disabled={!canEdit}>
              {CURRENCY_OPTS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <FormInput label="Fiscal Year Start" value={form.fiscalYearStart} onValueChange={(v) => set("fiscalYearStart", v)} placeholder="MM-DD" pattern={/[0-9-]/} maxLength={5} inputClass={formInputCls} labelClass={labelCls} />
          <FormInput label="Fiscal Year End" value={form.fiscalYearEnd} onValueChange={(v) => set("fiscalYearEnd", v)} placeholder="MM-DD" pattern={/[0-9-]/} maxLength={5} inputClass={formInputCls} labelClass={labelCls} />
          <div>
            <label className={labelCls}>Decimal Places</label>
            <select value={form.decimalPlaces} onChange={(e) => set("decimalPlaces", Number(e.target.value))} className={inputCls} disabled={!canEdit}>
              {[0,1,2,3].map((d) => <option key={d} value={d}>{d} decimal places</option>)}
            </select>
          </div>
          <FormInput label="VAT Number" value={form.vatNumber || ""} onValueChange={(v) => set("vatNumber", v)} placeholder="300XXXXXXXXX" pattern={/[A-Za-z0-9-]/} minLength={3} maxLength={50} inputClass={formInputCls} labelClass={labelCls} />
        </div>
        <div className="mt-5 space-y-1">
          <Toggle checked={form.autoJournalEntry} onChange={(v) => canEdit && set("autoJournalEntry", v)} label="Auto-create journal entries on transactions" />
          <Toggle checked={form.vatRegistered}    onChange={(v) => canEdit && set("vatRegistered", v)}    label="VAT Registered" />
        </div>
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
            <FiSave size={14} />Save Financial Settings
          </button>
        </div>
      )}
    </div>
  );
};

// -- Tax Rates Tab -------------------------------------------------------------
const TaxTab = ({ canEdit }) => {
  const [rates, setRates]     = useState(getTaxRates());
  const [showAdd, setShowAdd] = useState(false);
  const [newRate, setNewRate] = useState({ name: "", rate: 0, type: "VAT", status: "Active", isDefault: false });
  const setN = (k, v) => setNewRate((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    if (!String(newRate.name || "").trim()) {
      toast.error("Name is required.");
      return;
    }
    const rate = Number(newRate.rate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Rate must be between 0 and 100.");
      return;
    }
    addTaxRate({ ...newRate, rate });
    setRates(getTaxRates());
    setNewRate({ name: "", rate: 0, type: "VAT", status: "Active", isDefault: false });
    setShowAdd(false);
    toast.success("Tax rate added.");
  };

  const handleDelete = (id) => {
    deleteTaxRate(id);
    setRates(getTaxRates());
    toast.success("Tax rate removed.");
  };

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
            <FiPlus size={14} />Add Tax Rate
          </button>
        </div>
      )}

      {canEdit && showAdd && (
        <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl p-5">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">New Tax Rate</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <FormInput
              label="Name"
              required
              value={newRate.name}
              onValueChange={(v) => setN("name", v)}
              placeholder="e.g. Standard VAT"
              pattern={NAME}
              minLength={2}
              maxLength={100}
              inputClass={formInputCls}
              labelClass={labelCls}
            />
            <FormInput
              label="Rate (%)"
              type="number"
              min={0}
              max={100}
              decimal
              decimalPlaces={2}
              value={newRate.rate}
              onValueChange={(v) => setN("rate", v)}
              inputClass={formInputCls}
              labelClass={labelCls}
            />
            <div>
              <label className={labelCls}>Type</label>
              <select value={newRate.type} onChange={(e) => setN("type", e.target.value)} className={inputCls}>
                {TAX_TYPE_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={newRate.status} onChange={(e) => setN("status", e.target.value)} className={inputCls}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium"><FiCheck size={14} />Add</button>
            <button onClick={() => setShowAdd(false)} className="h-9 px-4 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-slate-500 dark:text-white/40 border-b border-slate-100 dark:border-white/10">
                <th className="px-6 py-3">Name</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Default</th>
                <th className="px-4 py-3">Status</th>
                {canEdit && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{r.rate}%</td>
                  <td className="px-4 py-3 text-slate-500">{r.type}</td>
                  <td className="px-4 py-3">{r.isDefault ? <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Default</span> : "?"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// -- Notifications Tab ---------------------------------------------------------
const NotificationsTab = ({ canEdit }) => {
  const [form, setForm] = useState(getNotifications());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { saveNotifications(form); toast.success("Notification settings saved."); };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>Alert Settings</h3>
        <FormInput
          type="email"
          label="Alert Email"
          value={form.alertEmail || ""}
          onValueChange={(v) => set("alertEmail", v)}
          placeholder="alerts@company.com"
          wrapperClass="mb-5 max-w-sm"
          inputClass={formInputCls}
          labelClass={labelCls}
        />
        <Toggle checked={form.emailAlerts}     onChange={(v) => canEdit && set("emailAlerts", v)}     label="Enable Email Alerts" />
        <Toggle checked={form.lowStockAlert}   onChange={(v) => canEdit && set("lowStockAlert", v)}   label="Low Stock Alerts (when items fall below reorder level)" />
        <Toggle checked={form.paymentDueAlert} onChange={(v) => canEdit && set("paymentDueAlert", v)} label="Payment Due Reminders (invoices & subscriptions)" />
        <Toggle checked={form.leaveApproval}   onChange={(v) => canEdit && set("leaveApproval", v)}   label="Leave Approval Notifications" />
        <Toggle checked={form.payrollReminder} onChange={(v) => canEdit && set("payrollReminder", v)} label="Payroll Processing Reminders" />
        <Toggle checked={form.assetWarranty}   onChange={(v) => canEdit && set("assetWarranty", v)}   label="Asset Warranty / Insurance Expiry Alerts" />
        <Toggle checked={form.budgetOverrun}   onChange={(v) => canEdit && set("budgetOverrun", v)}   label="Budget Overrun Alerts" />
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
            <FiSave size={14} />Save Notification Settings
          </button>
        </div>
      )}
    </div>
  );
};

// -- System Tab ----------------------------------------------------------------
const SystemTab = ({ canEdit }) => {
  const [form, setForm] = useState(getSystemSettings());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { saveSystem(form); toast.success("System settings saved."); };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>System Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <div>
            <label className={labelCls}>Language</label>
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputCls} disabled={!canEdit}>
              {LANGUAGE_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={inputCls} disabled={!canEdit}>
              {TIMEZONE_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date Format</label>
            <select value={form.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} className={inputCls} disabled={!canEdit}>
              {DATE_FORMAT_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Time Format</label>
            <select value={form.timeFormat} onChange={(e) => set("timeFormat", e.target.value)} className={inputCls} disabled={!canEdit}>
              {TIME_FORMAT_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
        </div>
        <Toggle checked={form.maintenanceMode} onChange={(v) => canEdit && set("maintenanceMode", v)} label="Maintenance Mode (disables portal for non-admin users)" />
      </div>
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
            <FiSave size={14} />Save System Settings
          </button>
        </div>
      )}
    </div>
  );
};

// -- Main Settings Page --------------------------------------------------------
const Settings = () => {
  const canEdit = checkRoleAuth(edit_settings);

  const tabCls = ({ selected }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none ${
      selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
    }`;

  if (!checkRoleAuth(view_settings)) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-white/50 text-sm mt-1">Manage company profile, financial settings, tax rates and system preferences</p>
      </div>

      <TabGroup>
        <TabList className="flex flex-wrap gap-1 p-1.5 bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20">
          <Tab className={tabCls}><FiSettings size={14} />Company</Tab>
          <Tab className={tabCls}><FiDollarSign size={14} />Financial</Tab>
          <Tab className={tabCls}><FiPercent size={14} />Tax Rates</Tab>
          <Tab className={tabCls}><FiBell size={14} />Notifications</Tab>
          <Tab className={tabCls}><FiSliders size={14} />System</Tab>
        </TabList>
        <TabPanels className="mt-6">
          <TabPanel><CompanyTab canEdit={canEdit} /></TabPanel>
          <TabPanel><FinancialTab canEdit={canEdit} /></TabPanel>
          <TabPanel><TaxTab canEdit={canEdit} /></TabPanel>
          <TabPanel><NotificationsTab canEdit={canEdit} /></TabPanel>
          <TabPanel><SystemTab canEdit={canEdit} /></TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default Settings;
