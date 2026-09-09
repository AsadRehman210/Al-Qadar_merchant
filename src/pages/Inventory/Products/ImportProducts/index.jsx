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
import { alqadar_role_ids } from "global/alqadarRoles";
import { createProductsBulk } from "store/slices/productSlice";
import { fetchCategories, showCategories, resetCategoryDropdown } from "store/slices/categorySlice";


const { import_inventory_product } = alqadar_role_ids;

const TEMPLATE_COLUMNS = [
  { label: "productName", key: "productName" },
  { label: "categoryCode", key: "categoryCode" },
  { label: "status", key: "status" },
];

const ImportProducts = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    return () => {
      dispatch(resetCategoryDropdown());
    };
  }, [dispatch]);

  const navigate = useNavigate();
  const isRTL = i18n.language === "ar";

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  const categories = useSelector(showCategories);

  useEffect(() => {
    dispatch(fetchCategories({}));
  }, [dispatch]);

  if (!checkRoleAuth(import_inventory_product)) {
    toast.error(t("product:not_authorized"));
    navigate("/inventory/products");
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
          const category = categories.find((c) => c.name?.toLowerCase() === String(r.categoryCode || "").toLowerCase());
          const errors = [];
          if (!String(r.productName || "").trim()) errors.push(t("product:name_required"));
          if (!category) errors.push(t("product:category_required"));
          return {
            productName: r.productName || "",
            categoryId: category?.id || "",
            categoryCode: r.categoryCode || "",
            status: r.status || "Active",
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
      await dispatch(createProductsBulk(
        validRows.map((r) => ({
          productName: r.productName,
          categoryId: r.categoryId,
          status: r.status,
        })),
      )).unwrap();
      toast.success(t("product:import_success", { count: validRows.length }));
      navigate("/inventory/products");
    } catch (err) {
      toast.error(err || t("product:import_parse_error"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="relative min-h-[60vh] overflow-hidden">
      <div className="hidden dark:block absolute inset-0 bg-slate-900 z-0 overflow-hidden" />
      <div className="relative z-[1]">
        <div className="mb-7 flex flex-wrap items-center gap-4 dark:text-white">
          <Button type="button" onClick={() => navigate("/inventory/products")} icon={isRTL ? FiArrowRight : FiArrowLeft}
            className="!h-11 !w-11 !min-w-11 !p-0 !rounded-md shrink-0 bg-white border border-slate-200 dark:bg-white/10 dark:border-white/20" iconClass="!text-lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold">{t("product:import_products")}</h1>
            <p className="text-mutedForeground">{t("product:import_desc")}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/10 dark:backdrop-blur-xl border border-slate-200 dark:border-white/20 rounded-3xl p-7 border-l-4 !border-l-[var(--color-teal-500)] space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 px-5 h-11 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 cursor-pointer">
              <FiUploadCloud className="h-4 w-4" />
              {t("product:choose_file")}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
            </label>
            {fileName && <span className="text-sm text-slate-500 dark:text-white/60">{fileName}</span>}
            <ExportButton data={[]} filename="product-import-template.xlsx" title={t("product:download_template")} columns={TEMPLATE_COLUMNS} />
          </div>
          <p className="text-xs text-slate-500 dark:text-white/50">{t("product:import_hint")}</p>

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
                      {[t("product:product_name"), t("product:category"), t("product:status"), ""].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-start text-xs font-semibold text-slate-600 dark:text-white/70">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx} className={`border-t border-slate-100 dark:border-white/5 ${!r.valid ? "bg-rose-50 dark:bg-rose-500/5" : ""}`}>
                        <td className="px-4 py-2.5">{r.productName || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{r.categoryCode || "—"}</td>
                        <td className="px-4 py-2.5 text-xs">{r.status}</td>
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
                <Button type="button" title={t("product:import_n_products", { count: validRows.length })} onClick={handleImport}
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

export default ImportProducts;
