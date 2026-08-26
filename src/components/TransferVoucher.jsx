import { PdfCard } from "components/PdfCard";
import { FiCheckCircle, FiMail, FiPhone } from "react-icons/fi";
import { MdPayment } from "react-icons/md";
import moment from "moment-timezone";
import { RiGlobalLine } from "react-icons/ri";
import ImageWithFallback from "components/ImageWithFallback";
import { useSelector } from "react-redux";
import { showUserData } from "store/slices/uniqueSlice";
import Logo from "assets/images/rafeeqi_logo_pdf.png";
import { useTranslation } from "react-i18next";
import { toTranslationKey } from "../global/helper";

export default function TransferVoucher({
  data,
  voucherRef,
  responseData,
  className = "",
}) {
  const { t, i18n } = useTranslation();
  const userData = useSelector(showUserData);
  const formatPassenger = () => {
    return (
      data?.customer_list?.length + (data?.adult || 0) + (data?.childern || 0)
    );
  };

  const bookingRoutes = data?.booking_routes || [];
  const totalPrice =
    data?.amount !== undefined && data?.amount !== null
      ? parseFloat(data?.amount)
      : null;
  const hasAnyRoutePrice = bookingRoutes.some((route) => route?.price);

  // Helper function to format driver name
  const formatDriverName = (driverObj) => {
    if (!driverObj) return null;
    if (driverObj.first_name && driverObj.last_name) {
      return `${driverObj.first_name} ${driverObj.last_name}`;
    }
    return null;
  };

  // Helper function to format multiple drivers
  const formatDrivers = (drivers) => {
    if (Array.isArray(drivers)) {
      const validDrivers = drivers.map(formatDriverName).filter(Boolean);
      if (validDrivers.length > 1) {
        return validDrivers
          .map((driver, index) => `${index + 1}. ${driver}`)
          .join(", ");
      }
      return validDrivers.join(", ");
    }
    return formatDriverName(drivers);
  };

  // Helper function to format multiple vehicles
  const formatVehicles = (vehicles, field = "plate_no") => {
    if (Array.isArray(vehicles)) {
      let values = [];
      if (field === "model_id") {
        values = vehicles
          .map((v) => v?.model_id?.title || v?.model_id)
          .filter(Boolean);
      } else {
        values = vehicles.map((v) => v?.[field]).filter(Boolean);
      }
      if (values.length > 1) {
        return values
          .map((value, index) => `${index + 1}. ${value}`)
          .join(", ");
      }
      return values.join(", ");
    }
    if (field === "model_id") {
      return vehicles?.model_id?.title || vehicles?.model_id || null;
    }
    return vehicles?.[field] || null;
  };

  // Payment summary calculations
  const paymentStatusObj =
    typeof data?.payment_status === "object" ? data?.payment_status : null;
  const paymentStatusId = paymentStatusObj
    ? paymentStatusObj.title ||
      paymentStatusObj._id?.toString().toLowerCase().replace(/\s+/g, "_")
    : typeof data?.payment_status === "string"
      ? data.payment_status.toLowerCase().includes("paid") &&
        data.payment_status.toLowerCase().includes("partial")
        ? "partially_paid"
        : data.payment_status.toLowerCase() === "paid"
          ? "paid"
          : null
      : null;
  const paymentStatusTitle =
    paymentStatusObj?.title ||
    responseData?.payment_status ||
    data?.payment_status;
  const paymentMethod =
    typeof data?.payment_method === "object"
      ? data?.payment_method?.title
      : data?.payment_method;
  const discount = parseFloat(data?.discount || 0);
  const partialAmount = parseFloat(data?.partial_amount || 0);
  const finalPrice = totalPrice !== null ? totalPrice - discount : null;
  const isPartiallyPaid =
    paymentStatusId === "partially_paid" && partialAmount > 0;
  const isPaid = paymentStatusId === "paid";
  const showDetails = isPartiallyPaid || isPaid || discount > 0;

  return (
    <div
      className={`w-full max-w-4xl mx-auto fixed opacity-0 top-0 pointer-events-none ${className}`}
    >
      <div className="print-content relative">
        <PdfCard
          ref={voucherRef}
          className="p-4 shadow-lg bg-white relative overflow-hidden print:shadow-none"
        >
          {/* {console.log(data, "transfer data")} */}
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-50 screen-watermark">
            <div style={{ transform: "rotate(45deg) scale(1.5)" }}>
              <ImageWithFallback
                src={userData?.organizationData?.primary_logo}
                className="w-96 h-96"
                fallbackSrc={Logo}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3 relative z-10">
            {/* ----------- Header ----------- */}
            <div className="relative">
              <div className="absolute top-0 ltr:right-0 ltr:left-auto rtl:left-0 rtl:right-auto w-24 h-3 bg-[#ffc107] ltr:rounded-bl-xl ltr:rounded-tr-xl rtl:rounded-br-xl rtl:rounded-tl-xl" />

              <div className="flex justify-between items-center border-b border-gray-200 pb-3 pt-1">
                <div className="w-36">
                  <ImageWithFallback
                    src={userData?.organizationData?.primary_logo}
                    className="w-full h-auto"
                    fallbackSrc={Logo}
                  />
                </div>
                <div className="text-end">
                  <h1 className="text-2xl font-bold text-[#3a2f88]">
                    {t("documents:transport_voucher")}
                  </h1>

                  <div className="flex items-center justify-end mt-1">
                    <div className="px-2 py-0.5 bg-gray-100 rounded-full flex items-center text-xs">
                      <span className="text-gray-500 mr-1">
                        {t("documents:voucher_no")}:
                      </span>
                      <span className="font-bold text-[#3a2f88]">
                        {responseData?._id?.slice(0, 6)}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-4">
                    {t("documents:issued")}:{" "}
                    <span className="rtl:ml-auto rtl:w-fit" dir="ltr">
                      {moment(data?.createdAt)
                        .tz("Asia/Riyadh")
                        .format("DD MMM YYYY")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------- Status Banner ----------- */}
            <div className="bg-gradient-to-r from-[#3a2f88]/10 to-[#ffc107]/10 p-2 rounded-lg border-l-4 border-[#3a2f88] flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <FiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="font-medium">
                  {t("booking_status")}:{" "}
                  <span
                    className={`font-bold capitalize ${
                      responseData?.status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {t(toTranslationKey(responseData?.status))}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1">
                <MdPayment className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="font-medium">
                  {t("documents:payment_status_label")}:{" "}
                  <span
                    className={`font-bold capitalize ${
                      responseData?.payment_status === "Paid"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {t(toTranslationKey(responseData?.payment_status))}
                  </span>
                </p>
              </div>
            </div>

            {/* ----------- Customer Details ----------- */}
            <div className="grid md:grid-cols-1 gap-3">
              {/* Customer Info */}
              <div className="space-y-1 bg-gray-50 p-2 rounded-lg text-sm">
                <h3 className="font-semibold text-[#3a2f88] text-sm border-b border-gray-200 pb-1 mb-1">
                  {t("documents:customer_details")}
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data?.customer_list?.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 pb-3 border-b border-gray-200 lg:border-b-0 lg:pb-0"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full bg-[#3a2f88] flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-[80px_1fr] gap-1">
                            <span className="font-medium text-gray-600">
                              {t("name")}:
                            </span>
                            <span className="font-semibold">
                              {`${item?.first_name || ""} ${
                                item?.last_name || ""
                              }`.trim() || "-"}
                            </span>

                            <span className="font-medium text-gray-600">
                              {t("phone")}:
                            </span>
                            <span className="rtl:ml-auto rtl:w-fit" dir="ltr">
                              {item?.user_id?.phone || "-"}
                            </span>

                            <span className="font-medium text-gray-600">
                              {t("address")}:
                            </span>
                            <span>{item?.address || "-"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-[80px_1fr] gap-6 pt-2 border-t border-gray-200">
                    <span className="font-medium text-gray-600">
                      {t("passengers")}:
                    </span>
                    <span>{formatPassenger()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------- Route Table ----------- */}
            <div className="overflow-x-auto">
              <h3 className="font-semibold text-[#3a2f88] text-sm mb-1">
                {t("documents:journey_details")}
              </h3>

              <table className="min-w-full border-collapse rounded-lg overflow-hidden text-xs">
                <thead>
                  <tr className="bg-[#3a2f88] text-white">
                    <th className="py-2 px-2 text-start font-medium text-start">
                      {t("pickup_point")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium text-start">
                      {t("dropoff_point")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium rtl:whitespace-nowrap w-[90px]">
                      {t("pickup_date_time")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium rtl:whitespace-nowrap w-[90px]">
                      {t("dropoff_date_time")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium w-[90px] break-all">
                      {t("model")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium w-[80px] break-all">
                      {t("vehicle")}
                    </th>
                    <th className="py-2 px-2 text-start font-medium w-[100px] break-all">
                      {t("driver")}
                    </th>
                    {hasAnyRoutePrice && (
                      <th className="py-2 px-2 text-start font-medium w-[70px]">
                        {t("price")}
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {bookingRoutes.map((route, i) => {
                    // Extract drivers and vehicles from driver_vehicle_assignments
                    const drivers =
                      route.driver_vehicle_assignments
                        ?.map((assignment) => assignment?.driver_id)
                        .filter(Boolean) || [];
                    const vehicles =
                      route.driver_vehicle_assignments
                        ?.map((assignment) => assignment?.vehicle_id)
                        .filter(Boolean) || [];

                    return (
                      <tr key={i} className="border-b border-gray-200">
                        <td className="py-2 px-2 text-[10px] align-top">
                          {route.pickup_point ? route.pickup_point : "-"}
                        </td>
                        <td className="py-2 px-2 text-[10px] align-top">
                          {route.drop_point ? route.drop_point : "-"}
                        </td>
                        <td className="py-2 px-2 text-[10px] align-top">
                          {route.start_time ? (
                            <div className="flex flex-col leading-[14px]">
                              <span
                                dir="ltr"
                                className="ltr:text-start rtl:text-end"
                              >
                                {moment
                                  .utc(route.start_time)
                                  .tz("Asia/Riyadh")
                                  .format("DD MMM YYYY")}
                              </span>
                              <span
                                dir="ltr"
                                className="ltr:text-start rtl:text-end"
                              >
                                {moment
                                  .utc(route.start_time)
                                  .tz("Asia/Riyadh")
                                  .format("hh:mm A")}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-2 px-2 text-[10px] align-top">
                          {route.end_time ? (
                            <div className="flex flex-col leading-[14px]">
                              <span
                                dir="ltr"
                                className="ltr:text-start rtl:text-end"
                              >
                                {moment
                                  .utc(route.end_time)
                                  .tz("Asia/Riyadh")
                                  .format("DD MMM YYYY")}
                              </span>
                              <span
                                dir="ltr"
                                className="ltr:text-start rtl:text-end"
                              >
                                {moment
                                  .utc(route.end_time)
                                  .tz("Asia/Riyadh")
                                  .format("hh:mm A")}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-2 px-2 text-[10px] break-all align-top">
                          {formatVehicles(vehicles, "model_id") ? (
                            <div className="space-y-1">
                              {formatVehicles(vehicles, "model_id")
                                .split(", ")
                                .map((item, idx) => (
                                  <div key={idx}>{item}</div>
                                ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 px-2 text-[10px] break-all align-top">
                          {formatVehicles(vehicles, "plate_no") ? (
                            <div className="space-y-1">
                              {formatVehicles(vehicles, "plate_no")
                                .split(", ")
                                .map((item, idx) => (
                                  <div key={idx}>{item}</div>
                                ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 px-2 text-[10px] break-all align-top">
                          {formatDrivers(drivers) ? (
                            <div className="space-y-1">
                              {formatDrivers(drivers)
                                .split(", ")
                                .map((item, idx) => (
                                  <div key={idx}>{item}</div>
                                ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        {hasAnyRoutePrice && (
                          <td className="py-2 px-2 font-semibold text-[10px] text-[#3a2f88] align-top break-all">
                            {route.price !== null && route.price !== undefined
                              ? `${t("sar")} ${parseFloat(route.price).toFixed(
                                  2,
                                )}`
                              : "-"}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  <tr className="bg-gray-100 font-semibold">
                    <td
                      colSpan={hasAnyRoutePrice ? 5 : 4}
                      className="py-2 px-2"
                    >
                      {t("subtotal")}
                    </td>
                    <td
                      colSpan={3}
                      className="py-1.5 px-2 text-[#3a2f88] text-end"
                    >
                      {totalPrice !== null && totalPrice !== undefined
                        ? `${t("sar")} ${totalPrice.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ----------- Payment Summary ----------- */}
            <div className="space-y-1 bg-gray-50 p-2 rounded-lg">
              <h3 className="font-semibold text-[#3a2f88] text-sm border-b border-gray-200 pb-1 mb-1">
                {t("payment_summary")}
              </h3>
              <div className="space-y-1 text-xs">
                {showDetails ? (
                  <>
                    {discount > 0 && (
                      <div className="flex justify-between">
                        <span className="font-medium">{t("discount")}:</span>
                        <span className="font-medium text-red-600">
                          - {t("sar")} {discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">{t("total_amount")}:</span>
                      <span className="font-medium">
                        {finalPrice !== null
                          ? `${t("sar")} ${finalPrice.toFixed(2)}`
                          : "-"}
                      </span>
                    </div>
                    {isPartiallyPaid && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {t("documents:partially_paid_amount")}:
                        </span>
                        <span className="font-medium text-red-600">
                          - {t("sar")} {partialAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {isPartiallyPaid && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {t("remaining_amount")}:
                        </span>
                        <span className="font-medium">
                          {t("sar")}{" "}
                          {isPartiallyPaid
                            ? (finalPrice - partialAmount).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span className="font-medium">{t("total_amount")}:</span>
                    <span className="font-medium">
                      {totalPrice !== null && totalPrice !== undefined
                        ? `${t("sar")} ${totalPrice.toFixed(2)}`
                        : "-"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">{t("payment_status")}:</span>
                  <span className="font-medium capitalize">
                    {t(toTranslationKey(paymentStatusTitle)) || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">{t("payment_method")}:</span>
                  <span className="font-medium">
                    {t(toTranslationKey(paymentMethod)) || "-"}
                  </span>
                </div>
              </div>
            </div>

            {data?.payment_notes && (
              <div>
                <p className="font-medium text-xs text-[#3a2f88]">
                  {t("documents:payment_note")}:
                </p>
                <div className="text-xs">{data?.payment_notes}</div>
              </div>
            )}

            {/* Footer */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-200 text-xs items-end">
              <div>
                <p className="font-medium text-[#3a2f88]">
                  {t("contact_information")}:
                </p>
                <div className="mt-1 space-y-0.5">
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-1">
                      <FiPhone className="h-3 w-3 text-[#2d3e4f]" />
                      <span className="rtl:ml-auto rtl:w-fit" dir="ltr">
                        {userData?.organizationData?.phone}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FiMail className="h-3 w-3 text-[#2d3e4f]" />
                      <span>{userData?.organizationData?.email}</span>
                    </div>
                    {userData?.organizationData?.website && (
                      <div className="flex items-center gap-1">
                        <RiGlobalLine className="h-3 w-3 text-[#2d3e4f]" />
                        <span>{userData?.organizationData?.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col col-start-3 col-end-3">
                <p className="font-medium text-[#3a2f88]">
                  {t("documents:approved_by")}:
                </p>
                <div className="mt-1 border-b border-gray-400 min-h-[20px]"></div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="text-[10px] text-gray-500 border-t border-gray-200 pt-2">
              <p className="font-medium mb-0.5">
                {t("documents:terms_and_conditions")}:
              </p>
              <div className="flex space-x-4">
                <ul className="list-disc pl-3 space-y-0.5">
                  <li>{t("documents:terms_voucher_present")}</li>
                  <li>{t("documents:terms_ready_15min")}</li>
                </ul>
                <ul className="list-disc pl-3 space-y-0.5">
                  <li>{t("documents:terms_cancellation")}</li>
                  <li>{t("documents:terms_contact")}</li>
                </ul>
              </div>
            </div>

            {/* Branded Footer */}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-[10px] text-gray-500">
              <div>
                <p className="capitalize">
                  {t("documents:copyright_footer", {
                    year: new Date().getFullYear(),
                    name: userData?.organizationData?.name || "",
                  })}
                </p>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-0.5 bg-[#3a2f88] ltr:mr-1 rtl:ml-1"></div>
                <p className="capitalize">
                  {t("documents:powered_by_footer", {
                    name: userData?.organizationData?.name || "",
                  })}
                </p>
              </div>
            </div>
          </div>
        </PdfCard>
      </div>
    </div>
  );
}
