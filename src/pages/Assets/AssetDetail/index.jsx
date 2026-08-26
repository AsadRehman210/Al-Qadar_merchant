import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiArrowRight, FiAlertTriangle, FiShield, FiTool, FiUser, FiTrendingDown, FiTrash2, FiMapPin, FiFile, FiDownload, FiPaperclip, FiPrinter } from "react-icons/fi";
import { FaRegEdit } from "react-icons/fa";
import { AiOutlineDelete } from "react-icons/ai";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import Button from "components/Button";
import SelectDropdown from "components/SelectDropdown";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchAssetById,
  assignAsset,
  returnAsset,
  addAssetMaintenance,
  updateAssetInsurance,
  transferAssetLocation,
  addAssetDocument,
  removeAssetDocument,
  disposeAsset,
  showCurrentAsset,
  showCurrentAssetLoading,
} from "store/slices/assetSlice";
import { fetchEmployees, showEmployees } from "store/slices/employeeSlice";
import { fetchJournalEntryById, showCurrentJournalEntry } from "store/slices/financeSlice";
import { SkeletonDetail, SkeletonTable } from "components/Skeleton";

const { edit_customer } = rafeeqi_role_ids;

const TAB_CLASS = "whitespace-nowrap cursor-pointer py-3 px-5 rounded-lg h-11 flex items-center gap-1.5 font-medium text-sm text-slate-500 dark:text-white/70 transition-all outline-none data-[selected]:bg-[var(--color-teal-500)] data-[selected]:text-white hover:text-teal-700 hover:bg-teal-500/10 dark:hover:text-white dark:hover:bg-teal-500/20";

const fmt = (n, currency = "SAR") => `${currency} ${(parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n) => (parseFloat(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
const fmtDate = (v) => (v ? String(v).slice(0, 10) : "—");

const statusClass = (s) => {
  const m = { "In use": "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300", "In storage": "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300", Maintenance: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200", Disposed: "bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white/70" };
  return m[s] || m["In use"];
};

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const days = Math.round((new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
  return days <= 60;
};

// Mirrors the server's calcBookValueAt (asset-service.ts) exactly — a pure
// display computation, no backend round-trip needed for the schedule view.
const calcDepreciationSchedule = (asset) => {
  const cost = parseFloat(asset.purchaseCost) || parseFloat(asset.currentValue) || 0;
  const salvage = parseFloat(asset.salvageValue) || 0;
  const years = parseInt(asset.usefulLifeYears, 10) || 5;
  const method = asset.depreciationMethod || "straight_line";
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
  const rows = [];

  if (method === "straight_line") {
    const annualDep = (cost - salvage) / years;
    let bookValue = cost;
    for (let y = 1; y <= years; y++) {
      const dep = Math.round(annualDep * 100) / 100;
      bookValue = Math.max(salvage, Math.round((bookValue - dep) * 100) / 100);
      const d = new Date(purchaseDate);
      d.setFullYear(d.getFullYear() + y);
      rows.push({ year: y, date: d.toISOString().slice(0, 10), depreciation: dep, accumulatedDep: Math.round((cost - bookValue) * 100) / 100, bookValue });
    }
  } else {
    const rate = 2 / years;
    let bookValue = cost;
    let accDep = 0;
    for (let y = 1; y <= years; y++) {
      const dep = Math.max(0, Math.round(Math.min(bookValue * rate, bookValue - salvage) * 100) / 100);
      bookValue = Math.max(salvage, Math.round((bookValue - dep) * 100) / 100);
      accDep = Math.round((cost - bookValue) * 100) / 100;
      const d = new Date(purchaseDate);
      d.setFullYear(d.getFullYear() + y);
      rows.push({ year: y, date: d.toISOString().slice(0, 10), depreciation: dep, accumulatedDep: accDep, bookValue });
    }
  }
  return rows;
};

const calcCurrentBookValue = (asset) => {
  const schedule = calcDepreciationSchedule(asset);
  const cost = parseFloat(asset.purchaseCost) || 0;
  const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date();
  const now = new Date();
  let yearsElapsed = now.getFullYear() - purchaseDate.getFullYear();
  const anniversaryPassed =
    now.getMonth() > purchaseDate.getMonth() ||
    (now.getMonth() === purchaseDate.getMonth() && now.getDate() >= purchaseDate.getDate());
  if (!anniversaryPassed) yearsElapsed -= 1;
  if (yearsElapsed <= 0) return cost;
  const lastRow = schedule[Math.min(yearsElapsed, schedule.length) - 1];
  return lastRow ? lastRow.bookValue : (schedule[schedule.length - 1]?.bookValue ?? 0);
};

const MAINT_TYPES = ["Scheduled", "Breakdown", "Inspection", "Upgrade"];
const MAINT_STATUS = ["Planned", "In Progress", "Completed"];
const DISPOSAL_METHODS = ["Sold", "Scrapped", "Donated", "Written Off"];
const DOC_TYPES = ["Invoice", "Warranty Card", "Manual", "Photo", "Other"];

const AssetDetail = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isRTL = i18n.language === "ar";

  const asset = useSelector(showCurrentAsset);
  const assetLoading = useSelector(showCurrentAssetLoading);
  const employees = useSelector(showEmployees);
  const journalEntry = useSelector(showCurrentJournalEntry);

  useEffect(() => {
    if (id) dispatch(fetchAssetById(id));
  }, [dispatch, id]);
  useEffect(() => {
    dispatch(fetchEmployees({ limit: 500 }));
  }, [dispatch]);
  useEffect(() => {
    if (asset?.disposal?.journalEntryId) dispatch(fetchJournalEntryById(asset.disposal.journalEntryId));
  }, [dispatch, asset?.disposal?.journalEntryId]);

  // Assignment form state
  const [showAssign, setShowAssign] = useState(false);
  const [assignEmp, setAssignEmp] = useState(null);
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [assignNotes, setAssignNotes] = useState("");
  const [showReturn, setShowReturn] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [returnNotes, setReturnNotes] = useState("");

  // Maintenance form state
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [maint, setMaint] = useState({ date: new Date().toISOString().slice(0, 10), type: "Scheduled", description: "", cost: "", vendor: "", status: "Planned", nextMaintenanceDate: "" });

  // Insurance form state
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [ins, setIns] = useState({});

  // Disposal form state
  const [showDisposalForm, setShowDisposalForm] = useState(false);
  const [disp, setDisp] = useState({ date: new Date().toISOString().slice(0, 10), method: "Sold", salePrice: "", reason: "" });

  // Location transfer form state
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transfer, setTransfer] = useState({ location: "", date: new Date().toISOString().slice(0, 10), notes: "" });

  // Document form state (URL-based — no file-storage backend exists yet)
  const [showDocForm, setShowDocForm] = useState(false);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");

  // QR tag modal state
  const [showTagModal, setShowTagModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  if (assetLoading && !asset) {
    return <SkeletonDetail fields={9} />;
  }

  if (!asset) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 dark:text-white/70">{t("no_record_found")}</p>
        <Button title={t("back")} onClick={() => navigate("/assets")} className="mt-4" />
      </div>
    );
  }

  const panelCls = "bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)]";
  const deprSchedule = calcDepreciationSchedule(asset);
  const bookValue = calcCurrentBookValue(asset);
  const purchaseCost = parseFloat(asset.purchaseCost) || parseFloat(asset.currentValue) || 0;
  const accDep = Math.max(0, purchaseCost - bookValue);
  const empOptions = employees
    .filter((e) => e.status === "active")
    .map((e) => ({ id: e.id, title: `${e.first_name || ""} ${e.last_name || ""} (${e.employeeCode || ""})`.trim() }));

  const handleAssign = async () => {
    if (!assignEmp) return;
    try {
      await dispatch(assignAsset({ id, data: { employeeId: assignEmp.id, assignedDate: assignDate, notes: assignNotes } })).unwrap();
      toast.success(t("asset:asset_assigned"));
      setShowAssign(false); setAssignEmp(null); setAssignNotes("");
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };
  const handleReturn = async () => {
    try {
      await dispatch(returnAsset({ id, data: { returnDate, notes: returnNotes } })).unwrap();
      toast.success(t("asset:asset_returned"));
      setShowReturn(false); setReturnNotes("");
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };
  const handleAddMaint = async () => {
    if (!maint.description) return;
    try {
      await dispatch(addAssetMaintenance({ id, data: { ...maint, cost: parseFloat(maint.cost) || 0 } })).unwrap();
      toast.success(t("asset:maintenance_added"));
      setShowMaintForm(false);
      setMaint({ date: new Date().toISOString().slice(0, 10), type: "Scheduled", description: "", cost: "", vendor: "", status: "Planned", nextMaintenanceDate: "" });
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };
  const handleSaveInsurance = async () => {
    try {
      await dispatch(updateAssetInsurance({
        id,
        data: {
          policyNo: ins.policyNo || undefined,
          provider: ins.provider || undefined,
          startDate: ins.startDate || undefined,
          expiryDate: ins.expiryDate || undefined,
          premiumAmount: ins.premiumAmount === "" ? undefined : parseFloat(ins.premiumAmount) || 0,
          coverageAmount: ins.coverageAmount === "" ? undefined : parseFloat(ins.coverageAmount) || 0,
          notes: ins.notes || undefined,
        },
      })).unwrap();
      toast.success(t("asset:insurance_saved"));
      setShowInsuranceForm(false);
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };
  const handleDispose = async () => {
    if (!disp.reason) return;
    try {
      await dispatch(disposeAsset({ id, data: { ...disp, salePrice: parseFloat(disp.salePrice) || 0 } })).unwrap();
      toast.success(t("asset:asset_disposed"));
      setShowDisposalForm(false);
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };

  const openInsuranceForm = () => {
    setIns({
      policyNo: asset.insurance?.policyNo || "",
      provider: asset.insurance?.provider || "",
      startDate: toDateInput(asset.insurance?.startDate),
      expiryDate: toDateInput(asset.insurance?.expiryDate),
      premiumAmount: asset.insurance?.premiumAmount ?? "",
      coverageAmount: asset.insurance?.coverageAmount ?? "",
      notes: asset.insurance?.notes || "",
    });
    setShowInsuranceForm(true);
  };

  const openTransferForm = () => {
    setTransfer({ location: asset.location || "", date: new Date().toISOString().slice(0, 10), notes: "" });
    setShowTransferForm(true);
  };
  const handleTransfer = async () => {
    if (!String(transfer.location || "").trim()) { toast.error(t("asset:location_required")); return; }
    try {
      await dispatch(transferAssetLocation({ id, data: transfer })).unwrap();
      toast.success(t("asset:location_transferred"));
      setShowTransferForm(false);
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };

  const handleAddDocument = async () => {
    if (!docName.trim()) { toast.error(t("asset:document_name_required")); return; }
    try {
      await dispatch(addAssetDocument({ id, data: { name: docName, docType, url: docUrl || undefined } })).unwrap();
      toast.success(t("asset:document_added"));
      setShowDocForm(false); setDocName(""); setDocUrl(""); setDocType(DOC_TYPES[0]);
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };
  const handleRemoveDocument = async (docId) => {
    try {
      await dispatch(removeAssetDocument({ id, docId })).unwrap();
      toast.success(t("asset:document_removed"));
    } catch (message) { toast.error(message || t("asset:action_failed")); }
  };

  const openTagModal = async () => {
    setShowTagModal(true);
    try {
      const url = await QRCode.toDataURL(asset.assetTag || asset.id, { width: 220, margin: 1 });
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    }
  };
  const handlePrintTag = () => {
    const win = window.open("", "_blank", "width=400,height=500");
    if (!win) return;
    win.document.write(`
      <html><head><title>${asset.assetTag}</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:24px;">
        <img src="${qrDataUrl}" style="width:200px;height:200px;" />
        <h2 style="margin:12px 0 4px;">${asset.name}</h2>
        <p style="font-family:monospace;margin:0;">${asset.assetTag}</p>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold">{asset.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass(asset.status)}`}>{asset.status}</span>
            </div>
            <p className="text-mutedForeground text-sm mt-1 font-mono">{asset.assetTag} · {asset.categoryName || "—"}</p>
          </div>
          <Button title={t("asset:print_tag")} icon={FiPrinter} type="button" onClick={openTagModal}
            className="!w-auto !rounded-md !h-11 !px-5 !bg-white dark:!bg-white/10 !text-slate-700 dark:!text-white !border !border-slate-200 dark:!border-white/20" />
          {checkRoleAuth(edit_customer) && asset.status !== "Disposed" && (
            <Button title={t("edit")} icon={FaRegEdit} type="button" onClick={() => navigate(`/assets/edit/${asset.id}`)}
              className="!w-auto !rounded-md !h-11 !px-5 !border-0 !text-white !bg-teal-500" />
          )}
        </div>

        {showTagModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowTagModal(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="mx-auto h-[200px] w-[200px]" />
              ) : (
                <div className="h-[200px] w-[200px] mx-auto flex items-center justify-center text-slate-400 text-sm">…</div>
              )}
              <h3 className="font-bold text-slate-800 dark:text-white mt-4">{asset.name}</h3>
              <p className="font-mono text-sm text-slate-500 dark:text-white/60">{asset.assetTag}</p>
              <div className="flex gap-2 mt-5">
                <Button type="button" title={t("asset:print")} onClick={handlePrintTag} disabled={!qrDataUrl}
                  className="!w-auto flex-1 !rounded-lg !h-9 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40" />
                <Button type="button" title={t("cancel")} onClick={() => setShowTagModal(false)}
                  className="!w-auto flex-1 !rounded-lg !h-9 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Key metrics strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: t("asset:purchase_cost"), value: fmt(purchaseCost, asset.currency), color: "border-slate-200 bg-white dark:bg-white/10 dark:border-white/20" },
            { label: t("asset:accumulated_dep"), value: fmt(accDep, asset.currency), color: "border-rose-200 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30 text-rose-700 dark:text-rose-300" },
            { label: t("asset:book_value"), value: fmt(bookValue, asset.currency), color: "border-teal-200 bg-teal-50 dark:bg-teal-500/10 dark:border-teal-500/30 text-teal-700 dark:text-teal-300" },
            { label: t("asset:assigned_to"), value: asset.assignedToName || t("asset:unassigned"), color: "border-blue-200 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500/30 text-blue-700 dark:text-blue-300" },
          ].map((c) => (
            <div key={c.label} className={`p-5 rounded-2xl border ${c.color}`}>
              <p className="text-xs font-medium opacity-70 mb-1">{c.label}</p>
              <p className="font-bold text-lg">{c.value}</p>
            </div>
          ))}
        </div>

        <TabGroup>
          <div className="overflow-x-auto">
            <TabList className="inline-flex items-center gap-1 p-1.5 rounded-xl mb-6 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 min-w-max">
              <Tab className={TAB_CLASS}><FiArrowRight className="h-3.5 w-3.5" /> {t("asset:overview")}</Tab>
              <Tab className={TAB_CLASS}><FiTrendingDown className="h-3.5 w-3.5" /> {t("asset:depreciation")}</Tab>
              <Tab className={TAB_CLASS}><FiUser className="h-3.5 w-3.5" /> {t("asset:assignments")}</Tab>
              <Tab className={TAB_CLASS}><FiTool className="h-3.5 w-3.5" /> {t("asset:maintenance")}</Tab>
              <Tab className={TAB_CLASS}><FiShield className="h-3.5 w-3.5" /> {t("asset:insurance")}</Tab>
              <Tab className={TAB_CLASS}><FiPaperclip className="h-3.5 w-3.5" /> {t("asset:documents")}</Tab>
              <Tab className={TAB_CLASS}><FiTrash2 className="h-3.5 w-3.5" /> {t("asset:disposal")}</Tab>
            </TabList>
          </div>

          <TabPanels>
            {/* ── OVERVIEW ── */}
            <TabPanel>
              <div className={panelCls}>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">{t("asset:asset_detail")}</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5 text-sm">
                  {[
                    { label: t("asset:category"),        value: asset.categoryName || "—" },
                    { label: t("asset:serial_number"),   value: asset.serialNumber || "—" },
                    { label: t("asset:location"),        value: asset.location || "—" },
                    { label: t("asset:purchase_date"),   value: fmtDate(asset.purchaseDate) },
                    { label: t("asset:purchase_cost"),   value: fmt(purchaseCost, asset.currency) },
                    { label: t("asset:current_value"),   value: fmt(asset.currentValue, asset.currency) },
                    { label: t("asset:book_value"),      value: fmt(bookValue, asset.currency) },
                    { label: t("asset:warranty_until"),  value: fmtDate(asset.warrantyUntil) },
                    { label: t("asset:depr_method"),     value: asset.depreciationMethod === "straight_line" ? t("asset:straight_line") : t("asset:declining_balance") },
                    { label: t("asset:useful_life"),     value: asset.usefulLifeYears ? `${asset.usefulLifeYears} ${t("asset:years")}` : "—" },
                    { label: t("asset:salvage_value"),   value: fmt(asset.salvageValue, asset.currency) },
                    { label: t("asset:currency"),        value: asset.currency || "SAR" },
                  ].map((f) => (
                    <div key={f.label}>
                      <dt className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{f.label}</dt>
                      <dd className="mt-1 font-semibold text-slate-800 dark:text-white">{f.value}</dd>
                    </div>
                  ))}
                  {asset.notes && (
                    <div className="sm:col-span-2 lg:col-span-3 pt-4 border-t border-slate-200 dark:border-white/20">
                      <dt className="text-xs font-medium text-slate-500 dark:text-white/60 uppercase">{t("asset:notes")}</dt>
                      <dd className="mt-1 text-slate-700 dark:text-white/85 whitespace-pre-wrap">{asset.notes}</dd>
                    </div>
                  )}
                </dl>

                {/* Location history */}
                <div className="mt-7 pt-6 border-t border-slate-200 dark:border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2 font-semibold text-slate-700 dark:text-white/90">
                      <FiMapPin className="h-4 w-4" /> {t("asset:location_history")}
                    </h3>
                    {asset.status !== "Disposed" && checkRoleAuth(edit_customer) && !showTransferForm && (
                      <button type="button" onClick={openTransferForm}
                        className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">
                        {t("asset:transfer_location")}
                      </button>
                    )}
                  </div>

                  {showTransferForm && (
                    <div className="mb-5 p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-linkText block mb-1">{t("asset:new_location")} *</label>
                          <input value={transfer.location} onChange={(e) => setTransfer((p) => ({ ...p, location: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-linkText block mb-1">{t("asset:transfer_date")}</label>
                          <input type="date" value={transfer.date} onChange={(e) => setTransfer((p) => ({ ...p, date: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-linkText block mb-1">{t("asset:transfer_notes")}</label>
                          <input value={transfer.notes} onChange={(e) => setTransfer((p) => ({ ...p, notes: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" title={t("asset:confirm_transfer")} onClick={handleTransfer}
                          className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
                        <Button type="button" title={t("cancel")} onClick={() => setShowTransferForm(false)}
                          className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                      </div>
                    </div>
                  )}

                  {!asset.locationHistory?.length ? (
                    <p className="text-slate-400 text-sm py-4">{t("asset:no_location_history")}</p>
                  ) : (
                    <div className="space-y-2">
                      {asset.locationHistory.map((h) => (
                        <div key={h.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white/90">{h.location}</p>
                            <p className="text-xs text-slate-400 dark:text-white/40">
                              {fmtDate(h.date)}{h.notes ? ` · ${h.notes}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabPanel>

            {/* ── DEPRECIATION ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:depreciation_schedule")}</h2>
                    <p className="text-sm text-slate-500 dark:text-white/60 mt-0.5">
                      {asset.depreciationMethod === "straight_line" ? t("asset:straight_line") : t("asset:declining_balance")}
                      {" · "}{asset.usefulLifeYears} {t("asset:years")}{" · "}
                      {t("asset:salvage_value")}: {fmt(asset.salvageValue, asset.currency)}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">{t("asset:purchase_cost")}</p>
                      <p className="font-bold text-slate-800 dark:text-white">{fmt(purchaseCost)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">{t("asset:accumulated_dep")}</p>
                      <p className="font-bold text-rose-600">{fmt(accDep)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">{t("asset:book_value")}</p>
                      <p className="font-bold text-teal-600">{fmt(bookValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{t("asset:accumulated_dep")}: {Math.round((accDep / (purchaseCost || 1)) * 100)}%</span>
                    <span>{t("asset:remaining_value")}: {Math.round((bookValue / (purchaseCost || 1)) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all" style={{ width: `${Math.min(100, Math.round((accDep / (purchaseCost || 1)) * 100))}%` }} />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--color-teal-500)]">
                        {[t("asset:year"), t("asset:date"), t("asset:annual_dep"), t("asset:accumulated_dep"), t("asset:book_value")].map((h) => (
                          <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deprSchedule.map((row) => {
                        const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : null;
                        const now = new Date();
                        let yearsElapsed = purchaseDate ? now.getFullYear() - purchaseDate.getFullYear() : 0;
                        const isCurrent = row.year === yearsElapsed + 1;
                        return (
                          <tr key={row.year} className={`border-t border-slate-100 dark:border-white/5 ${isCurrent ? "bg-teal-50 dark:bg-teal-500/10 font-semibold" : ""}`}>
                            <td className="px-4 py-2.5">{t("asset:year")} {row.year} {isCurrent && <span className="ml-1 text-xs text-teal-600">(current)</span>}</td>
                            <td className="px-4 py-2.5 text-xs">{row.date}</td>
                            <td className="px-4 py-2.5 text-rose-600">{fmt(row.depreciation)}</td>
                            <td className="px-4 py-2.5 text-rose-700">{fmt(row.accumulatedDep)}</td>
                            <td className="px-4 py-2.5 text-teal-600">{fmt(row.bookValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabPanel>

            {/* ── ASSIGNMENTS ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:assignments")}</h2>
                  {asset.status !== "Disposed" && (
                    <div className="flex gap-2">
                      {asset.assignedToId ? (
                        <button type="button" onClick={() => setShowReturn(true)}
                          className="px-4 py-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-sm font-semibold hover:bg-amber-200">
                          {t("asset:return_asset")}
                        </button>
                      ) : (
                        <button type="button" onClick={() => setShowAssign(true)}
                          className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">
                          {t("asset:assign_to_employee")}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {asset.assignedToId && (
                  <div className="mb-5 p-4 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-teal-500 text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {asset.assignedToName?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{asset.assignedToName}</p>
                      <p className="text-sm text-slate-500 dark:text-white/60">{t("asset:assigned_since")}: {fmtDate(asset.assignedDate)}</p>
                    </div>
                  </div>
                )}

                {showAssign && (
                  <div className="mb-5 p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">{t("asset:assign_to_employee")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:employee")} *</label>
                        <SelectDropdown data={empOptions} selected={assignEmp} setSelected={setAssignEmp} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:assignment_date")}</label>
                        <input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:notes")}</label>
                        <input value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" title={t("asset:confirm_assign")} onClick={handleAssign} disabled={!assignEmp}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowAssign(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                {showReturn && (
                  <div className="mb-5 p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-500/30 bg-white dark:bg-white/5 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">{t("asset:return_asset")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:return_date")}</label>
                        <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-amber-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:return_notes")}</label>
                        <input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)}
                          className="w-full h-10 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-amber-400" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" title={t("asset:confirm_return")} onClick={handleReturn}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-amber-500 hover:!bg-amber-600" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowReturn(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                <h4 className="font-semibold text-slate-700 dark:text-white mb-3">{t("asset:assignment_history")}</h4>
                {!asset.assignmentHistory?.length ? (
                  <p className="text-slate-400 text-sm py-6 text-center">{t("asset:no_assignments")}</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                          {[t("asset:employee"), t("asset:assigned_date"), t("asset:return_date"), t("asset:notes")].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {asset.assignmentHistory.map((h) => (
                          <tr key={h.id} className="border-t border-slate-100 dark:border-white/5">
                            <td className="px-4 py-2.5 font-medium">{h.employeeName || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{fmtDate(h.assignedDate)}</td>
                            <td className="px-4 py-2.5 text-xs">{h.returnDate ? fmtDate(h.returnDate) : <span className="text-teal-500 font-medium">Active</span>}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500">{h.notes || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabPanel>

            {/* ── MAINTENANCE ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:maintenance_history")}</h2>
                  {asset.status !== "Disposed" && (
                    <button type="button" onClick={() => setShowMaintForm(!showMaintForm)}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">
                      {showMaintForm ? t("cancel") : t("asset:add_maintenance")}
                    </button>
                  )}
                </div>

                {showMaintForm && (
                  <div className="mb-6 p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">{t("asset:add_maintenance_record")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: t("asset:maint_date"), type: "date", field: "date" },
                        { label: t("asset:maint_cost"), type: "number", field: "cost" },
                        { label: t("asset:maint_vendor"), type: "text", field: "vendor" },
                        { label: t("asset:next_maintenance"), type: "date", field: "nextMaintenanceDate" },
                      ].map(({ label, type, field }) => (
                        <div key={field}>
                          <label className="text-xs font-medium text-linkText block mb-1">{label}</label>
                          <input type={type} value={maint[field] || ""} onChange={(e) => setMaint((p) => ({ ...p, [field]: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:maint_type")}</label>
                        <select value={maint.type} onChange={(e) => setMaint((p) => ({ ...p, type: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500">
                          {MAINT_TYPES.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:maint_status")}</label>
                        <select value={maint.status} onChange={(e) => setMaint((p) => ({ ...p, status: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500">
                          {MAINT_STATUS.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:description")} *</label>
                        <input value={maint.description} onChange={(e) => setMaint((p) => ({ ...p, description: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="button" title={t("save")} onClick={handleAddMaint} disabled={!maint.description}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowMaintForm(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                {!asset.maintenanceHistory?.length ? (
                  <div className="text-center py-10 text-slate-400">
                    <FiTool className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>{t("asset:no_maintenance")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {asset.maintenanceHistory.map((r) => (
                      <div key={r.id} className={`p-4 rounded-2xl border ${r.status === "In Progress" ? "border-amber-200 bg-amber-50 dark:bg-amber-500/10" : r.status === "Planned" ? "border-blue-200 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"}`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{r.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{fmtDate(r.date)} · {r.vendor || "-"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.type === "Breakdown" ? "bg-rose-100 text-rose-700" : r.type === "Scheduled" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>{r.type}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.status === "Completed" ? "bg-emerald-100 text-emerald-700" : r.status === "In Progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span>{t("asset:cost")}: <strong className="text-rose-600">{fmt(r.cost)}</strong></span>
                          {r.nextMaintenanceDate && <span>{t("asset:next_maintenance")}: <strong>{fmtDate(r.nextMaintenanceDate)}</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* ── INSURANCE ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:insurance")}</h2>
                  {asset.status !== "Disposed" && (
                    <button type="button" onClick={openInsuranceForm}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">
                      {asset.insurance ? t("asset:edit_insurance") : t("asset:add_insurance")}
                    </button>
                  )}
                </div>

                {showInsuranceForm && (
                  <div className="mb-6 p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">{t("asset:insurance_details")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: t("asset:policy_no"),       field: "policyNo",       type: "text" },
                        { label: t("asset:insurer"),          field: "provider",       type: "text" },
                        { label: t("asset:policy_start"),     field: "startDate",      type: "date" },
                        { label: t("asset:policy_expiry"),    field: "expiryDate",     type: "date" },
                        { label: t("asset:premium_amount"),   field: "premiumAmount",  type: "number" },
                        { label: t("asset:coverage_amount"),  field: "coverageAmount", type: "number" },
                      ].map(({ label, field, type }) => (
                        <div key={field}>
                          <label className="text-xs font-medium text-linkText block mb-1">{label}</label>
                          <input type={type} value={ins[field] || ""} onChange={(e) => setIns((p) => ({ ...p, [field]: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                        </div>
                      ))}
                      <div className="sm:col-span-2 lg:col-span-3">
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:notes")}</label>
                        <input value={ins.notes || ""} onChange={(e) => setIns((p) => ({ ...p, notes: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" title={t("save")} onClick={handleSaveInsurance}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowInsuranceForm(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                {!asset.insurance ? (
                  <div className="text-center py-12 text-slate-400">
                    <FiShield className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>{t("asset:no_insurance")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[
                      { label: t("asset:policy_no"),      value: asset.insurance.policyNo },
                      { label: t("asset:insurer"),         value: asset.insurance.provider },
                      { label: t("asset:policy_start"),    value: fmtDate(asset.insurance.startDate) },
                      { label: t("asset:policy_expiry"),   value: fmtDate(asset.insurance.expiryDate), expiry: true, raw: asset.insurance.expiryDate },
                      { label: t("asset:premium_amount"),  value: fmt(asset.insurance.premiumAmount) },
                      { label: t("asset:coverage_amount"), value: fmt(asset.insurance.coverageAmount) },
                    ].map((f) => {
                      const expiring = f.expiry && isExpiringSoon(f.raw);
                      return (
                        <div key={f.label} className={`p-4 rounded-xl border ${expiring ? "border-amber-300 bg-amber-50 dark:bg-amber-500/10" : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"}`}>
                          <p className="text-xs text-slate-500 dark:text-white/60">{f.label}</p>
                          <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{f.value || "—"}</p>
                          {expiring && <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1"><FiAlertTriangle className="h-3 w-3" /> {t("asset:expiring_soon")}</p>}
                        </div>
                      );
                    })}
                    {asset.insurance.notes && (
                      <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                        <p className="text-xs text-slate-500">{t("asset:notes")}</p>
                        <p className="text-sm mt-0.5 dark:text-white">{asset.insurance.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* ── DOCUMENTS ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:asset_documents")}</h2>
                  <button type="button" onClick={() => setShowDocForm((v) => !v)}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">
                    {showDocForm ? t("cancel") : t("asset:add_document")}
                  </button>
                </div>
                <p className="text-sm text-slate-500 dark:text-white/60 mb-5">{t("asset:asset_documents_desc")}</p>

                {showDocForm && (
                  <div className="mb-6 p-5 rounded-2xl border-2 border-teal-200 dark:border-teal-500/30 bg-white dark:bg-white/5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:document_type")}</label>
                        <select value={docType} onChange={(e) => setDocType(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500">
                          {DOC_TYPES.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:document_name")} *</label>
                        <input value={docName} onChange={(e) => setDocName(e.target.value)}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:document_url")}</label>
                        <input value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://..."
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-teal-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" title={t("save")} onClick={handleAddDocument} disabled={!docName.trim()}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-teal-500 hover:!bg-teal-600 disabled:opacity-40" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowDocForm(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                {!asset.documents?.length ? (
                  <div className="text-center py-12 text-slate-400">
                    <FiFile className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>{t("asset:no_documents")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {asset.documents.map((d) => (
                      <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 shrink-0">
                            <FiFile className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-white/90 truncate">{d.name}</p>
                            <p className="text-xs text-slate-400 dark:text-white/40">
                              {d.docType} · {t("asset:uploaded_on")} {fmtDate(d.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {d.url && (
                            <a href={d.url} target="_blank" rel="noreferrer"
                              className="text-slate-500 dark:text-white/80 hover:text-teal-600 dark:hover:text-teal-300" title={t("download")}>
                              <FiDownload className="h-4 w-4" />
                            </a>
                          )}
                          <button type="button" onClick={() => handleRemoveDocument(d.id)}
                            className="text-slate-500 dark:text-white/80 hover:text-red-600 dark:hover:text-red-400" title={t("delete")}>
                            <AiOutlineDelete className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* ── DISPOSAL ── */}
            <TabPanel>
              <div className={panelCls}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t("asset:disposal")}</h2>
                  {asset.status !== "Disposed" && !showDisposalForm && (
                    <button type="button" onClick={() => setShowDisposalForm(true)}
                      className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600">
                      {t("asset:dispose_asset")}
                    </button>
                  )}
                </div>

                {showDisposalForm && (
                  <div className="mb-6 p-5 rounded-2xl border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 space-y-3">
                    <div className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
                      <FiAlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{t("asset:disposal_warning")}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { label: t("asset:disposal_date"),   field: "date",        type: "date" },
                        { label: t("asset:sale_price"),       field: "salePrice",   type: "number" },
                      ].map(({ label, field, type }) => (
                        <div key={field}>
                          <label className="text-xs font-medium text-linkText block mb-1">{label}</label>
                          <input type={type} value={disp[field] || ""} onChange={(e) => setDisp((p) => ({ ...p, [field]: e.target.value }))}
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-rose-400" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:disposal_method")}</label>
                        <select value={disp.method} onChange={(e) => setDisp((p) => ({ ...p, method: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-rose-400">
                          {DISPOSAL_METHODS.map((x) => <option key={x}>{x}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-medium text-linkText block mb-1">{t("asset:disposal_reason")} *</label>
                        <input value={disp.reason || ""} onChange={(e) => setDisp((p) => ({ ...p, reason: e.target.value }))}
                          className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 text-sm focus:outline-0 focus:border-rose-400" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" title={t("asset:confirm_dispose")} onClick={handleDispose} disabled={!disp.reason}
                        className="!w-auto !rounded-lg !h-9 !px-4 !border-0 !text-white !bg-rose-500 hover:!bg-rose-600 disabled:opacity-40" />
                      <Button type="button" title={t("cancel")} onClick={() => setShowDisposalForm(false)}
                        className="!w-auto !rounded-lg !h-9 !px-4 !bg-slate-100 dark:!bg-white/10 !text-slate-600 dark:!text-white" />
                    </div>
                  </div>
                )}

                {asset.disposal ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: t("asset:disposal_date"),   value: fmtDate(asset.disposal.date) },
                        { label: t("asset:disposal_method"), value: asset.disposal.method },
                        { label: t("asset:sale_price"),       value: fmt(asset.disposal.salePrice) },
                      ].map((f) => (
                        <div key={f.label} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                          <p className="text-xs text-slate-500">{f.label}</p>
                          <p className="font-semibold text-slate-800 dark:text-white mt-0.5">{f.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                      <p className="text-xs text-slate-500 mb-1">{t("asset:disposal_reason")}</p>
                      <p className="text-sm text-slate-700 dark:text-white">{asset.disposal.reason}</p>
                    </div>
                    {/* Real posted Journal Entry — see asset-service.ts::dispose */}
                    {asset.disposal.journalEntryId && (
                      <div>
                        <h4 className="font-semibold text-slate-700 dark:text-white mb-3">{t("asset:journal_entry")}</h4>
                        {!journalEntry || journalEntry.id !== asset.disposal.journalEntryId ? (
                          <SkeletonTable rows={3} columns={3} />
                        ) : (
                          <>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-[var(--color-teal-500)]">
                                    {[t("asset:account"), t("asset:debit"), t("asset:credit")].map((h) => (
                                      <th key={h} className="px-4 py-3 text-start font-semibold text-white/90 text-xs">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {journalEntry.lines.map((line, idx) => (
                                    <tr key={idx} className="border-t border-slate-100 dark:border-white/5">
                                      <td className="px-4 py-2.5 text-slate-700 dark:text-white">{line.accountCode} — {line.accountName}</td>
                                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-white">{line.debit > 0 ? fmtN(line.debit) : "—"}</td>
                                      <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-white">{line.credit > 0 ? fmtN(line.credit) : "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{journalEntry.journalNo} · {journalEntry.memo}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FiTrash2 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>{t("asset:not_disposed")}</p>
                  </div>
                )}
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </div>
  );
};

export default AssetDetail;
