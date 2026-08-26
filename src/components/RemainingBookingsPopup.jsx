import moment from "moment-timezone";
import { useTranslation } from "react-i18next";
import { toTranslationKey } from "global/helper";

const RemainingBookingsPopup = ({ bookings = [], closePopup }) => {
  const { t } = useTranslation();
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-800";
      case "ongoing":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending approval":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("bookingCalendar:remaining_bookings_count", {
            count: bookings.length,
          })}
        </h3>
        <p className="text-sm text-gray-600">
          {t("bookingCalendar:additional_bookings_hint")}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("booking_id")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("pickup_location")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("dropoff_location")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("bookingCalendar:start")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("bookingCalendar:end")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("agency")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("driver")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("vehicle")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("bookingCalendar:assignment_status")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("booking_status")}
              </th>
              <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t("bookingCalendar:booking_amount")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {booking.bookingNumber || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 min-w-[200px] break-all">
                  {booking.departure || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 min-w-[200px] break-all">
                  {booking.destination || "-"}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 ltr:text-right rtl:text-left"
                  dir="ltr"
                >
                  {moment(booking.fullStartDate, "DD-MM-YYYY hh:mm A").format(
                    "DD-MM-YYYY hh:mm A"
                  )}
                </td>
                <td
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 ltr:text-right rtl:text-left"
                  dir="ltr"
                >
                  {moment(booking.fullEndDate, "DD-MM-YYYY hh:mm A").format(
                    "DD-MM-YYYY hh:mm A"
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {booking.agency || "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {booking.driver || "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {booking.vehicle || "-"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {t(toTranslationKey(booking.status)) || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                      booking.bookingStatus
                    )}`}
                  >
                    {t(toTranslationKey(booking.bookingStatus)) || "-"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {booking.amount
                    ? `${t("sar")} ${
                        parseFloat(booking.amount) -
                        (parseFloat(booking.discount) || 0)
                      }`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={closePopup}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
};

export default RemainingBookingsPopup;
