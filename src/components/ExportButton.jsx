import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import Button from "./Button";
import { ExportIcon } from "../assets/svgs";

/**
 * ExportButton - Generic Excel export button
 */
const ExportButton = ({
  data,
  columns,
  filename = "export.xlsx",
  className = "",
  title,
  fetchData,
  status,
}) => {
  const { t } = useTranslation();
  const handleExport = async () => {
    let exportData = data;
    if (fetchData) {
      exportData = await fetchData();
    }
    // Always prepare at least the header row
    const rows =
      exportData && exportData.length
        ? exportData.map((item, idx) => {
            const row = {};
            columns.forEach((col) => {
              row[col.label] =
                typeof col.value === "function"
                  ? col.value(item, idx)
                  : item[col.key] ?? "-";
            });
            return row;
          })
        : [Object.fromEntries(columns.map((col) => [col.label, ""]))];
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    // Export to file
    XLSX.writeFile(wb, filename);
  };

  return (
    <Button
      className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition ${className}`}
      onClick={handleExport}
      title={title ?? t("export")}
      btn="primary"
      loading={status}
      disabled={status}
      icon={ExportIcon}
      iconClass="w-6 h-6 mr-2"
    />
  );
};

export default ExportButton;
