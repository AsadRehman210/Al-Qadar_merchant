import { useTranslation } from "react-i18next";
import NoData from "assets/svgs/no_data.svg"; // Update with your actual path
import NoDataAR from "assets/svgs/no_data_ar.svg";

const SKELETON_ROWS = 6;

// Shared by every module's list table (Sales, Employees, Stock, Departments,
// ...) — one fix here covers the "pending -> skeleton, empty -> no data
// found" requirement everywhere at once instead of touching each table.
const TableState = ({ loading, data, colSpan, children }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  if (loading) {
    return Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
      <tr key={rowIdx} className="border-b border-slate-50 dark:border-white/5">
        {Array.from({ length: colSpan }).map((_, colIdx) => (
          <td key={colIdx} className="px-4 py-3">
            <div className="h-4 w-full max-w-[140px] rounded-md bg-slate-200 dark:bg-white/10 animate-pulse" />
          </td>
        ))}
      </tr>
    ));
  }

  if (!data || data.length === 0) {
    return (
      <tr>
        <td
          colSpan={colSpan}
          className="pt-4 text-center text-black dark:text-white text-sm font-semibold whitespace-nowrap"
        >
          <div className="flex flex-col items-center mt-6 gap-2">
            <img src={isArabic ? NoDataAR : NoData} alt={t("no_data_found")} />
          </div>
        </td>
      </tr>
    );
  }

  return <>{children}</>;
};

export default TableState;
