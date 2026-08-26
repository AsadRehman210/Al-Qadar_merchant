import { useTranslation } from "react-i18next";
import NoData from "assets/svgs/no_data.svg"; // Update with your actual path
import NoDataAR from "assets/svgs/no_data_ar.svg";
import { SkeletonCards } from "./Skeleton";

// Card-grid counterpart to TableState — shared by every card-grid list
// (Recruitment, Onboarding, Offboarding, HolidayCalendar, Announcements).
const DataState = ({ loading, data, imgClass = "", text = "", skeletonColumns = "grid-cols-1 md:grid-cols-2 xl:grid-cols-3", children }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  if (loading) {
    return <SkeletonCards count={6} columns={skeletonColumns} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="pt-4 text-center text-black dark:text-white text-sm font-semibold whitespace-nowrap">
        <div className="flex flex-col items-center mt-6 gap-2">
          <img
            src={isArabic ? NoDataAR : NoData}
            alt={text || t("no_data_found")}
            className={imgClass}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DataState;
