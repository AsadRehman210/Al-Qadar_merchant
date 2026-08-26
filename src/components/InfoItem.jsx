import Badge from "components/Badge";
import { isUndefined } from "global/helper";
import { useTranslation } from "react-i18next";
import { toTranslationKey } from "global/helper";

const InfoItem = ({ label, value, valueClass, icon, status, count }) => {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {!isUndefined(count) && (
          <p className="text-sm font-bold text-black">: {count}</p>
        )}
      </div>
      <div className="flex items-center mt-1 gap-1">
        {icon && <span className="mr-1 text-gray-500">{icon}</span>}
        {!status && (
          <div className={`text-sm text-black ${valueClass}`} dir="ltr">
            {value === undefined ||
            value === null ||
            value === "" ||
            value.length == 0
              ? "-"
              : value}
          </div>
        )}
        {status && (
          <Badge
            variant={
              status === "approved" ||
              status == "paid" ||
              status == "Partially Paid"
                ? "success"
                : status === "pending"
                ? "outline"
                : "outline"
            }
            className="mt-1 !size-fit px-3 py-1 capitalize"
          >
            {t(toTranslationKey(status))}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default InfoItem;
