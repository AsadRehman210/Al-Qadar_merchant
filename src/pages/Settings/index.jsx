import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@headlessui/react";
import {
  FiSettings, FiDollarSign, FiPercent, FiBell, FiSliders,
  FiEdit2, FiTrash2, FiPlus, FiSave, FiCheck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  getCompany, getFinancial, getTaxRates, getNotifications, getSystemSettings,
  saveCompany, saveFinancial, saveNotifications, saveSystem,
  addTaxRate, updateTaxRate, deleteTaxRate,
  TAX_TYPE_OPTS, CURRENCY_OPTS, DATE_FORMAT_OPTS, TIMEZONE_OPTS,
} from "./settingsFakeData";

const inputCls = "w-full h-[46px] px-3 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white";
const labelCls = "text-sm font-medium text-slate-700 dark:text-white/70 mb-1.5 block";
const sectionHead = "text-base font-semibold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-white/10";

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between gap-4 py-3 border-b border-slate-50 dark:border-white/5 last:border-0 cursor-pointer">
    <span className="text-sm text-slate-700 dark:text-white/80">{label}</span>
    <button type="button" onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-teal-500" : "bg-slate-200 dark:bg-white/20"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  </label>
);

// ── Company Profile Tab ───────────────────────────────────────────────────────
const CompanyTab = () => {
  const [form, setForm] = useState(getCompany());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { saveCompany(form); toast.success("Company settings saved."); };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>Company Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { key: "name",      label: "Company Name",    placeholder: "Rafeeqi Enterprise" },
            { key: "legalName", label: "Legal Name",      placeholder: "Rafeeqi Enterprise Co. Ltd." },
            { key: "email",     label: "Contact Email",   placeholder: "info@company.com" },
            { key: "phone",     label: "Phone",           placeholder: "+966 XX XXX XXXX" },
            { key: "website",   label: "Website",         placeholder: "https://example.com" },
            { key: "taxNumber", label: "VAT / Tax Number",placeholder: "300XXXXXXXXX" },
            { key: "crNumber",  label: "CR Number",       placeholder: "1010XXXXXX" },
            { key: "country",   label: "Country",         placeholder: "Saudi Arabia" },
            { key: "city",      label: "City",            placeholder: "Riyadh" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              <input value={form[key] || ""} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className={inputCls} />
            </div>
          ))}
          <div className="md:col-span-2 lg:col-span-3">
            <label className={labelCls}>Address</label>
            <input value={form.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Full address" className={inputCls} />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiSave size={14} />Save Company Info
        </button>
      </div>
    </div>
  );
};

// ── Financial Settings Tab ────────────────────────────────────────────────────
const FinancialTab = () => {
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
            <select value={form.defaultCurrency} onChange={(e) => set("defaultCurrency", e.target.value)} className={inputCls}>
              {CURRENCY_OPTS.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Fiscal Year Start</label>
            <input type="text" value={form.fiscalYearStart} onChange={(e) => set("fiscalYearStart", e.target.value)} placeholder="MM-DD" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Fiscal Year End</label>
            <input type="text" value={form.fiscalYearEnd} onChange={(e) => set("fiscalYearEnd", e.target.value)} placeholder="MM-DD" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Decimal Places</label>
            <select value={form.decimalPlaces} onChange={(e) => set("decimalPlaces", Number(e.target.value))} className={inputCls}>
              {[0,1,2,3].map((d) => <option key={d} value={d}>{d} decimal places</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>VAT Number</label>
            <input type="text" value={form.vatNumber || ""} onChange={(e) => set("vatNumber", e.target.value)} placeholder="300XXXXXXXXX" className={inputCls} />
          </div>
        </div>
        <div className="mt-5 space-y-1">
          <Toggle checked={form.autoJournalEntry} onChange={(v) => set("autoJournalEntry", v)} label="Auto-create journal entries on transactions" />
          <Toggle checked={form.vatRegistered}    onChange={(v) => set("vatRegistered", v)}    label="VAT Registered" />
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiSave size={14} />Save Financial Settings
        </button>
      </div>
    </div>
  );
};

// ── Tax Rates Tab ─────────────────────────────────────────────────────────────
const TaxTab = () => {
  const [rates, setRates]     = useState(getTaxRates());
  const [showAdd, setShowAdd] = useState(false);
  const [newRate, setNewRate] = useState({ name: "", rate: 0, type: "VAT", status: "Active", isDefault: false });
  const setN = (k, v) => setNewRate((p) => ({ ...p, [k]: v }));

  const handleAdd = () => {
    addTaxRate(newRate);
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
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiPlus size={14} />Add Tax Rate
        </button>
      </div>

      {showAdd && (
        <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 rounded-2xl p-5">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">New Tax Rate</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input value={newRate.name} onChange={(e) => setN("name", e.target.value)} placeholder="e.g. Standard VAT" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Rate (%)</label>
              <input type="number" min={0} max={100} step="0.01" value={newRate.rate} onChange={(e) => setN("rate", Number(e.target.value))} className={inputCls} />
            </div>
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
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{r.name}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{r.rate}%</td>
                  <td className="px-4 py-3 text-slate-500">{r.type}</td>
                  <td className="px-4 py-3">{r.isDefault ? <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Default</span> : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 transition-colors"><FiTrash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Notifications Tab ─────────────────────────────────────────────────────────
const NotificationsTab = () => {
  const [form, setForm] = useState(getNotifications());
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const save = () => { saveNotifications(form); toast.success("Notification settings saved."); };

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/20 p-6">
        <h3 className={sectionHead}>Alert Settings</h3>
        <div className="mb-5">
          <label className={labelCls}>Alert Email</label>
          <input type="email" value={form.alertEmail || ""} onChange={(e) => set("alertEmail", e.target.value)} placeholder="alerts@company.com" className={inputCls + " max-w-sm"} />
        </div>
        <Toggle checked={form.emailAlerts}     onChange={(v) => set("emailAlerts", v)}     label="Enable Email Alerts" />
        <Toggle checked={form.lowStockAlert}   onChange={(v) => set("lowStockAlert", v)}   label="Low Stock Alerts (when items fall below reorder level)" />
        <Toggle checked={form.paymentDueAlert} onChange={(v) => set("paymentDueAlert", v)} label="Payment Due Reminders (invoices & subscriptions)" />
        <Toggle checked={form.leaveApproval}   onChange={(v) => set("leaveApproval", v)}   label="Leave Approval Notifications" />
        <Toggle checked={form.payrollReminder} onChange={(v) => set("payrollReminder", v)} label="Payroll Processing Reminders" />
        <Toggle checked={form.assetWarranty}   onChange={(v) => set("assetWarranty", v)}   label="Asset Warranty / Insurance Expiry Alerts" />
        <Toggle checked={form.budgetOverrun}   onChange={(v) => set("budgetOverrun", v)}   label="Budget Overrun Alerts" />
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiSave size={14} />Save Notification Settings
        </button>
      </div>
    </div>
  );
};

// ── System Tab ────────────────────────────────────────────────────────────────
const SystemTab = () => {
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
            <select value={form.language} onChange={(e) => set("language", e.target.value)} className={inputCls}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Timezone</label>
            <select value={form.timezone} onChange={(e) => set("timezone", e.target.value)} className={inputCls}>
              {TIMEZONE_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date Format</label>
            <select value={form.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} className={inputCls}>
              {DATE_FORMAT_OPTS.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Time Format</label>
            <select value={form.timeFormat} onChange={(e) => set("timeFormat", e.target.value)} className={inputCls}>
              <option value="12h">12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
        </div>
        <Toggle checked={form.maintenanceMode} onChange={(v) => set("maintenanceMode", v)} label="Maintenance Mode (disables portal for non-admin users)" />
      </div>
      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--color-teal-500)] hover:bg-[var(--color-teal-600)] text-white text-sm font-medium transition-colors">
          <FiSave size={14} />Save System Settings
        </button>
      </div>
    </div>
  );
};

// ── Main Settings Page ────────────────────────────────────────────────────────
const Settings = () => {
  const tabCls = ({ selected }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all outline-none ${
      selected ? "bg-[var(--color-teal-500)] text-white shadow-sm" : "text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/10"
    }`;

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
          <TabPanel><CompanyTab /></TabPanel>
          <TabPanel><FinancialTab /></TabPanel>
          <TabPanel><TaxTab /></TabPanel>
          <TabPanel><NotificationsTab /></TabPanel>
          <TabPanel><SystemTab /></TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default Settings;
