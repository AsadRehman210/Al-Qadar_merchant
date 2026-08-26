import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight, FiUploadCloud, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import ExportButton from "components/ExportButton";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import { fetchAssetCategories, createAsset, showAssetCategories } from "store/slices/assetSlice";

const { add_customer } = rafeeqi_role_ids;

const TEMPLATE_COLUMNS = [
  { label: "name", key: "name" },
  { label: "categoryCode", key: "categoryCode" },
  { label: "serialNumber", key: "serialNumber" },
  { label: "location", key: "location" },
  { label: "purchaseDate", key: "purchaseDate" },
  { label: "purchaseCost", key: "purchaseCost" },
  { label: "currentValue", key: "currentValue" },
  { label: "currency", key: "currency" },
];

const ImportAssets = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const categories = useSelector(showAssetCategories);

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    dispatch(fetchAssetCategories());
  }, [dispatch]);

  if (!checkRoleAuth(add_customer)) {
    toast.error(t("asset:not_authorized"));
    navigate("/assets");
    return null;
  }

  const categoryIdByCode = (code) =>
    categories.find((c) => c.code?.toLowerCase() === String(code || "").toLowerCase())?.id ?? null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const parsed = json.map((r) => {
          const categoryId = categoryIdByCode(r.categoryCode);
          const errors = [];
          if (!String(r.name || "").trim()) errors.push(t("asset:name_required"));
          if (!categoryId) errors.push(t("asset:category_required"));
          return {
            name: r.name || "",
            categoryId,
            categoryCode: r.categoryCode || "",
            serialNumber: r.serialNumber || "",
            location: r.location || "",
            purchaseDate: r.purchaseDate || "",
            purchaseCost: parseFloat(r.purchaseCost) || 0,
            currentValue: parseFloat(r.currentValue) || parseFloat(r.purchaseCost) || 0,
            currency: r.currency || "SAR",
            valid: errors.length === 0,
            errors,
          };
        });
        setRows(parsed);
      } catch {
        toast.error(t("asset:import_parse_error"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidCount = rows.length - validRows.length;

  // No dedicated bulk-insert endpoint exists — each row goes through the
  // same single-asset create() as the Add Asset form (and, for any row
  // with a purchaseCost, posts its own real acquisition journal entry, same
  // as a normal create), sequentially so one failure doesn't drop the rest.
  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    let successCount = 0;
    let failCount = 0;
    for (const r of validRows) {
      try {
        await dispatch(createAsset({
          name: r.name,
          categoryId: r.categoryId,
          serialNumber: r.serialNumber || undefined,
          location: r.location || undefined,
          purchaseDate: r.purchaseDate || undefined,
          purchaseCost: r.purchaseCost || undefined,
          currentValue: r.currentValue || undefined,
          currency: r.currency,
        })).unwrap();
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }
    setImporting(false);
    if (successCount) toast.success(t("asset:import_success", { count: successCount }));
    if (failCount) toast.error(t("asset:import_partial_failure", { count: failCount }));
    if (successCount) navigate("/assets");
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/assets")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("asset:import_assets")}</h1>
            <p className="text-mutedForeground">{t("asset:import_desc")}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-5 h-11 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 cursor-pointer">
              <FiUploadCloud className="h-4 w-4" />
              {t("asset:choose_file")}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
            {fileName && <span className="text-sm text-slate-500 dark:text-white/60">{fileName}</span>}
            <ExportButton
              data={[]}
              filename="asset-import-template.xlsx"
              title={t("asset:download_template")}
              columns={TEMPLATE_COLUMNS}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-white/50">{t("asset:import_hint")}</p>

          {rows.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <FiCheckCircle className="h-4 w-4" /> {t("asset:valid_rows", { count: validRows.length })}
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                    <FiXCircle className="h-4 w-4" /> {t("asset:invalid_rows", { count: invalidCount })}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5">
                      {[t("asset:asset_name"), t("asset:category"), t("asset:location"), t("asset:current_value"), ""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 dark:border-white/5 ${!r.valid ? "bg-rose-50 dark:bg-rose-500/5" : ""}`}>
                        <td className="px-4 py-2.5">{r.name || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{r.categoryCode || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{r.location || "—"}</td>
                        <td className="px-4 py-2.5">{r.currentValue}</td>
                        <td className="px-4 py-2.5 text-xs">
                          {r.valid ? (
                            <span className="text-emerald-600 flex items-center gap-1"><FiCheckCircle className="h-3.5 w-3.5" /> OK</span>
                          ) : (
                            <span className="text-rose-600" title={r.errors.join(", ")}>{r.errors.join(", ")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" title={t("cancel")} onClick={() => { setRows([]); setFileName(""); }}
                  className="!w-auto !rounded-md !bg-slate-200 dark:!bg-white/20 !text-slate-700 dark:!text-white" />
                <Button type="button" title={t("asset:import_n_assets", { count: validRows.length })} onClick={handleImport}
                  disabled={!validRows.length || importing} loading={importing}
                  className="!w-auto !rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 !text-white disabled:opacity-40" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportAssets;
