import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight, FiUploadCloud, FiCheckCircle, FiXCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import ExportButton from "components/ExportButton";
import { checkRoleAuth } from "global/helper";
import { rafeeqi_role_ids } from "global/rafeeqiRoles";
import {
  fetchOpeningStockStatus,
  importOpeningStock,
  showOpeningStockImported,
  showOpeningStockImportedAt,
  showOpeningStockStatusLoading,
} from "store/slices/stockSlice";

const { add_customer } = rafeeqi_role_ids;

const TEMPLATE_COLUMNS = [
  { label: "sku", key: "sku" },
  { label: "productName", key: "productName" },
  { label: "productType", key: "productType" },
  { label: "category", key: "category" },
  { label: "variantName", key: "variantName" },
  { label: "unit", key: "unit" },
  { label: "warehouseCode", key: "warehouseCode" },
  { label: "qty", key: "qty" },
  { label: "unitCost", key: "unitCost" },
  { label: "expiryDate", key: "expiryDate" },
  { label: "supplierName", key: "supplierName" },
];

const VALID_TYPES = {
  "raw material": "Raw Material",
  raw: "Raw Material",
  "finished product": "Finished Product",
  finished: "Finished Product",
  "final product": "Finished Product",
};

const normalizeType = (value) => {
  const key = String(value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return VALID_TYPES[key] || "";
};

const excelDate = (value) => {
  if (value === "" || value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    const epoch = Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000;
    return new Date(epoch).toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
};

const toNumber = (value) => {
  if (typeof value === "number") return value;
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return n;
};

const OpeningImport = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isRTL = i18n.language === "ar";

  const imported = useSelector(showOpeningStockImported);
  const importedAt = useSelector(showOpeningStockImportedAt);
  const statusLoading = useSelector(showOpeningStockStatusLoading);

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    dispatch(fetchOpeningStockStatus());
  }, [dispatch]);

  if (!checkRoleAuth(add_customer)) {
    toast.error(t("product:not_authorized"));
    navigate("/inventory/stock");
    return null;
  }

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
          const productType = normalizeType(r.productType);
          const qty = toNumber(r.qty);
          const unitCost = toNumber(r.unitCost);
          const errors = [];
          if (!String(r.sku || "").trim()) errors.push(t("product:sku_required"));
          if (!String(r.productName || "").trim()) errors.push(t("product:name_required"));
          if (!productType) errors.push(t("product:product_type_invalid"));
          if (!String(r.category || "").trim()) errors.push(t("product:category_required"));
          if (!String(r.warehouseCode || "").trim()) errors.push(t("product:warehouse_code_required"));
          if (!Number.isFinite(qty) || qty <= 0) errors.push(t("product:qty_required"));
          if (!Number.isFinite(unitCost) || unitCost < 0) errors.push(t("product:unit_cost_required"));
          return {
            sku: String(r.sku || "").trim(),
            productName: String(r.productName || "").trim(),
            productType: productType || String(r.productType || "").trim(),
            category: String(r.category || "").trim(),
            variantName: String(r.variantName || "").trim(),
            unit: String(r.unit || "").trim() || "pcs",
            warehouseCode: String(r.warehouseCode || "").trim(),
            qty,
            unitCost,
            expiryDate: excelDate(r.expiryDate),
            supplierName: String(r.supplierName || "").trim(),
            valid: errors.length === 0,
            errors,
          };
        });
        setRows(parsed);
      } catch {
        toast.error(t("product:import_parse_error"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validRows = rows.filter((r) => r.valid);
  const invalidCount = rows.length - validRows.length;

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    try {
      const result = await dispatch(importOpeningStock({
        rows: validRows.map((r) => ({
          sku: r.sku,
          productName: r.productName,
          productType: r.productType,
          category: r.category,
          variantName: r.variantName,
          unit: r.unit,
          warehouseCode: r.warehouseCode,
          qty: r.qty,
          unitCost: r.unitCost,
          expiryDate: r.expiryDate || undefined,
          supplierName: r.supplierName || undefined,
        })),
      })).unwrap();
      toast.success(t("product:import_opening_success", { count: result?.rowCount || validRows.length }));
      navigate("/inventory/stock");
    } catch (err) {
      const message = typeof err === "string" ? err : err?.message;
      toast.error(message || t("product:import_parse_error"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/inventory/stock")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("product:import_opening_stock")}</h1>
            <p className="text-mutedForeground">{t("product:import_opening_desc")}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)] space-y-5">
          {statusLoading ? (
            <p className="text-sm text-slate-500 dark:text-white/60">{t("loading")}</p>
          ) : imported ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">{t("product:opening_already_imported")}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">{t("product:opening_already_imported_hint")}</p>
              {importedAt && (
                <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-1">
                  {t("product:opening_imported_on", { date: String(importedAt).slice(0, 10) })}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-5 h-11 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 cursor-pointer">
                  <FiUploadCloud className="h-4 w-4" />
                  {t("product:choose_file")}
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
                </label>
                {fileName && <span className="text-sm text-slate-500 dark:text-white/60">{fileName}</span>}
                <ExportButton data={[]} filename="opening-stock-import-template.xlsx" title={t("product:download_template")} columns={TEMPLATE_COLUMNS} />
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50">{t("product:import_opening_hint")}</p>

              {rows.length > 0 && (
                <>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <FiCheckCircle className="h-4 w-4" /> {t("product:valid_rows", { count: validRows.length })}
                    </span>
                    {invalidCount > 0 && (
                      <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                        <FiXCircle className="h-4 w-4" /> {t("product:invalid_rows", { count: invalidCount })}
                      </span>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-white/5">
                          {["sku", "productName", "productType", "category", "warehouseCode", "qty", "unitCost", "supplierName", ""].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">{h || ""}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={idx} className={`border-t border-slate-100 dark:border-white/5 ${!r.valid ? "bg-rose-50 dark:bg-rose-500/5" : ""}`}>
                            <td className="px-4 py-2.5">{r.sku || "—"}</td>
                            <td className="px-4 py-2.5">{r.productName || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.productType || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.category || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.warehouseCode || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.qty}</td>
                            <td className="px-4 py-2.5 text-xs">{r.unitCost}</td>
                            <td className="px-4 py-2.5 text-xs">{r.supplierName || "—"}</td>
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
                    <Button type="button" title={t("product:import_n_opening_rows", { count: validRows.length })} onClick={handleImport}
                      disabled={!validRows.length || importing} loading={importing}
                      className="!w-auto !rounded-md !bg-[var(--color-teal-500)] hover:!bg-[var(--color-teal-600)] !border-0 !text-white disabled:opacity-40" />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpeningImport;
