import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { FiArrowLeft, FiArrowRight, FiUploadCloud, FiCheckCircle, FiXCircle, FiDownload } from "react-icons/fi";
import { toast } from "react-toastify";
import Button from "components/Button";
import { checkRoleAuth } from "global/helper";
import { alqadar_role_ids } from "global/alqadarRoles";
import {
  fetchOpeningStockStatus,
  importOpeningStock,
  showOpeningStockImported,
  showOpeningStockImportedAt,
  showOpeningStockStatusLoading,
} from "store/slices/stockSlice";
import { resetWarehouseDropdown } from "store/slices/warehouseSlice";
import { resetVariantDropdown } from "store/slices/variantSlice";
import { SkeletonDetail } from "components/Skeleton";

const { add_inventory_opening_stock } = alqadar_role_ids;

const TEMPLATE_HEADERS = ["sku", "warehouseCode", "qty", "unitCost", "expiryDate", "supplierPhone"];

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

/** Recover phone from Excel number / scientific notation; keep leading +. */
const normalizePhone = (value) => {
  if (value === "" || value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `+${String(Math.round(value))}`;
  }
  let s = String(value).trim().replace(/^'/, "").replace(/\s+/g, "");
  if (/e[+-]?\d+$/i.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) s = String(Math.round(n));
  }
  if (/^\d+$/.test(s)) return `+${s}`;
  return s;
};

const isBlankImportRow = (r) => {
  const sku = String(r.sku ?? "").trim();
  const warehouseCode = String(r.warehouseCode ?? "").trim();
  const phone = String(r.supplierPhone ?? "").trim();
  const expiry = String(r.expiryDate ?? "").trim();
  const qty = toNumber(r.qty);
  const unitCost = toNumber(r.unitCost);
  const qtyEmpty = r.qty === "" || r.qty == null || !Number.isFinite(qty) || qty === 0;
  const costEmpty = r.unitCost === "" || r.unitCost == null || !Number.isFinite(unitCost) || unitCost === 0;
  return !sku && !warehouseCode && !phone && !expiry && qtyEmpty && costEmpty;
};

const downloadTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
  // Mark supplierPhone header column as text so new typed values prefer text.
  // Paste still often forces Number in Excel — import recovers via normalizePhone.
  const phoneHeader = XLSX.utils.encode_cell({ r: 0, c: 5 });
  if (ws[phoneHeader]) ws[phoneHeader].z = "@";
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(14, h.length + 2) }));

  const instructions = XLSX.utils.aoa_to_sheet([
    ["Opening stock import — tips"],
    [""],
    ["1. Fill only real data rows on Sheet1. Leave unused rows completely empty."],
    ["2. supplierPhone: before pasting, select the column → Format Cells → Text."],
    ["3. Or paste with a leading apostrophe, e.g. '+923001234567 (Excel keeps it as text)."],
    ["4. If Excel shows 9.23E+11, import still recovers the full number — but Text format is cleaner."],
    ["5. SKU, warehouseCode, and supplier phone must already exist in the system."],
  ]);
  instructions["!cols"] = [{ wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.utils.book_append_sheet(wb, instructions, "Instructions");
  XLSX.writeFile(wb, "opening-stock-import-template.xlsx");
};

const OpeningImport = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(resetWarehouseDropdown());
      dispatch(resetVariantDropdown());
    };
  }, [dispatch]);

  const navigate = useNavigate();
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

  if (!checkRoleAuth(add_inventory_opening_stock)) {
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
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true })
          .filter((r) => !isBlankImportRow(r));
        const parsed = json.map((r) => {
          const qty = toNumber(r.qty);
          const unitCost = toNumber(r.unitCost);
          const expiryDate = excelDate(r.expiryDate);
          const supplierPhone = normalizePhone(r.supplierPhone);
          const errors = [];
          if (!String(r.sku || "").trim()) errors.push(t("product:sku_required"));
          if (!String(r.warehouseCode || "").trim()) errors.push(t("product:warehouse_code_required"));
          if (!Number.isFinite(qty) || qty <= 0) errors.push(t("product:qty_required"));
          if (!Number.isFinite(unitCost) || unitCost < 0) errors.push(t("product:unit_cost_required"));
          if (!supplierPhone) errors.push(t("product:supplier_phone_required"));
          return {
            sku: String(r.sku || "").trim(),
            warehouseCode: String(r.warehouseCode || "").trim(),
            qty,
            unitCost,
            expiryDate,
            supplierPhone,
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
          warehouseCode: r.warehouseCode,
          qty: r.qty,
          unitCost: r.unitCost,
          expiryDate: r.expiryDate || undefined,
          supplierPhone: r.supplierPhone,
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
            <SkeletonDetail fields={3} />
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
                <Button
                  type="button"
                  title={t("product:download_template")}
                  icon={FiDownload}
                  onClick={downloadTemplate}
                  className="!w-auto !h-11 !rounded-xl !bg-blue-600 hover:!bg-blue-700 !border-0 !text-white"
                />
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
                          {["sku", "warehouseCode", "qty", "unitCost", "expiryDate", "supplierPhone", ""].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">{h || ""}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={idx} className={`border-t border-slate-100 dark:border-white/5 ${!r.valid ? "bg-rose-50 dark:bg-rose-500/5" : ""}`}>
                            <td className="px-4 py-2.5">{r.sku || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.warehouseCode || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.qty}</td>
                            <td className="px-4 py-2.5 text-xs">{r.unitCost}</td>
                            <td className="px-4 py-2.5 text-xs">{r.expiryDate || "—"}</td>
                            <td className="px-4 py-2.5 text-xs">{r.supplierPhone || "—"}</td>
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
