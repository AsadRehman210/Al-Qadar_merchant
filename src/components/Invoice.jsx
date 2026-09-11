import { PdfCard, PdfCardContent, PdfCardHeader } from "components/PdfCard";
import { useSelector } from "react-redux";
import { showUserData } from "store/slices/uniqueSlice";
import ImageWithFallback from "components/ImageWithFallback";
import Logo from "assets/images/rafeeqi_logo_pdf.png";
import moment from "moment-timezone";
import { numberToWords, tenantLogoSrc } from "global/helper";
import Stamp from "assets/images/Rafeeqi_Stamp.jpeg";
import { useTranslation } from "react-i18next";
import { toTranslationKey } from "../global/helper";

export default function Invoice({ data, documentRef, className }) {
  const { t } = useTranslation();
  const userData = useSelector(showUserData);
  const totalAmount =
    data?.amount !== undefined && data?.amount !== null
      ? parseFloat(data?.amount)
      : null;
  const bankDetail = userData?.organizationData?.bank_detail;

  const bookingRoutes = data?.booking_routes || [];
  const totalPrice =
    data?.amount !== undefined && data?.amount !== null
      ? parseFloat(data?.amount)
      : null;
  const hasAnyRoutePrice = bookingRoutes.some((route) => route?.price);

  // Payment summary calculations
  const paymentStatusObj =
    typeof data?.payment_status === "object" ? data?.payment_status : null;
  const paymentStatusId =
    paymentStatusObj?._id ||
    (data?.payment_status?.toLowerCase().includes("paid") &&
    data?.payment_status?.toLowerCase().includes("partial")
      ? "partially_paid"
      : data?.payment_status?.toLowerCase() === "paid"
      ? "paid"
      : null);
  const paymentStatusTitle = paymentStatusObj?.title || data?.payment_status;
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
      className={`max-w-4xl w-full mx-auto font-sans fixed opacity-0 top-0 pointer-events-none ${className}`}
    >
      {/* Document to be exported */}
      <div className="print-content">
        <div ref={documentRef}>
          <PdfCard className="border-2 relative shadow-lg overflow-hidden">
            <PdfCardHeader className=" pb-2 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="w-72">
                  <ImageWithFallback
                    src={tenantLogoSrc(userData)}
                    className="h-32 object-contain"
                    fallbackSrc={Logo}
                  />
                </div>
              </div>
            </PdfCardHeader>

            <PdfCardContent className="mt-6 p-6 relative">
              <div className="">
                {/* Invoice Info */}
                <div className="mb-4 text-sm">
                  <p className="font-bold mb-2 text-lg text-[#3a2f88]">
                    {t("documents:invoice")}
                  </p>
                  <p>
                    {t("date")}:{" "}
                    <span className="font-medium">
                      {moment(data?.createdAt)
                        .tz("Asia/Riyadh")
                        .format("DD MMM YYYY")}
                    </span>
                  </p>
                  <p>
                    {t("documents:invoice_number")}:{" "}
                    <span className="font-medium">RTC-{data?.booking_id}</span>
                  </p>
                  {data?.agency_id && (
                    <p className="mt-2">{data?.agency_id?.agency_name}</p>
                  )}
                </div>

                {/* Transport Services */}
                <div className="mb-4 text-sm">
                  <p className="font-semibold text-[#3a2f88]">
                    {t("documents:transportation_services")}:{" "}
                    <span className="font-normal text-black">
                      (
                      {data.customer_list
                        ?.map((c) => `${c.first_name} ${c.last_name}`)
                        .join(", ")}
                      )
                    </span>
                  </p>
                </div>

                <table className="min-w-full border-collapse rounded-lg overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-[#3a2f88] text-white">
                      <th className="border border-gray-200 py-2 px-2 text-start font-medium">
                        {t("pickup_point")}
                      </th>
                      <th className="border border-gray-200 py-2 px-2 text-start font-medium">
                        {t("dropoff_point")}
                      </th>
                      {hasAnyRoutePrice && (
                        <th className="border border-gray-200 py-2 px-2 text-start font-medium whitespace-nowrap">
                          {t("amount_sar")}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {bookingRoutes.map((route, i) => (
                      <tr key={i}>
                        <td className="border border-black px-2 py-1">
                          {route.pickup_point ? route.pickup_point : "-"}
                        </td>
                        <td className="border border-black px-2 py-1">
                          {route.drop_point ? route.drop_point : "-"}
                        </td>
                        {hasAnyRoutePrice && (
                          <td className="border border-black px-2 py-1 text-right">
                            {route.price !== null && route.price !== undefined
                              ? parseFloat(route.price).toFixed(2)
                              : "-"}
                          </td>
                        )}
                      </tr>
                    ))}
                    {bookingRoutes.length > 0 && (
                      <tr className="bg-gray-100 font-semibold !border-0">
                        <td
                          colSpan={hasAnyRoutePrice ? 2 : 1}
                          className="border border-black px-2 py-1 text-start"
                        >
                          {t("subtotal")}
                        </td>
                        <td className="border border-black px-2 py-1 text-right">
                          {totalAmount !== null
                            ? parseFloat(totalAmount).toFixed(2)
                            : "-"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Payment Summary */}
                <div className="my-6 space-y-1 bg-gray-50 p-3 rounded-lg text-sm">
                  <h3 className="font-semibold text-[#3a2f88] text-sm border-b border-gray-200 pb-1 mb-2">
                    {t("payment_summary")}
                  </h3>
                  <div className="space-y-1 text-xs">
                    {showDetails ? (
                      <>
                        {discount > 0 && (
                          <div className="flex justify-between">
                            <span className="font-medium">
                              {t("discount")}:
                            </span>
                            <span className="font-medium text-red-600">
                              - {t("sar")} {discount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {t("total_amount")}:
                          </span>
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
                        <span className="font-medium">
                          {t("total_amount")}:
                        </span>
                        <span className="font-medium">
                          {totalPrice !== null
                            ? `${t("sar")} ${totalPrice.toFixed(2)}`
                            : "-"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {t("payment_status")}:
                      </span>
                      <span className="font-medium capitalize">
                        {t(toTranslationKey(paymentStatusTitle)) || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {t("payment_method")}:
                      </span>
                      <span className="font-medium">
                        {t(toTranslationKey(paymentMethod)) || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="mb-4  text-sm  text-gray-900">
                  <span className="text-xs font-semibold text-[#3a2f88]  mb-1 uppercase">
                    {t("total_amount")}:{" "}
                  </span>
                  {showDetails && finalPrice !== null && finalPrice > 0
                    ? numberToWords(parseFloat(finalPrice))
                    : totalPrice !== null
                    ? numberToWords(parseFloat(totalPrice))
                    : "-"}
                </p>

                {/* Payment Terms */}
                <p className="mb-4 text-sm">
                  <span className="font-semibold text-[#3a2f88]">
                    {t("documents:payment_terms")}:
                  </span>{" "}
                  {t("documents:payment_terms_note")}
                </p>

                {/* Bank Account Details */}
                {bankDetail && (
                  <div className="text-sm">
                    <p className="font-semibold text-[#3a2f88] text-base">
                      {t("documents:bank_account_details")}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("documents:account_holder_name")}:
                      </span>{" "}
                      {bankDetail?.account_name
                        ? bankDetail?.account_name
                        : "-"}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("documents:account_number")}:
                      </span>{" "}
                      {bankDetail?.account_no ? bankDetail?.account_no : "-"}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("documents:iban_number")}:
                      </span>{" "}
                      {bankDetail?.iban ? bankDetail?.iban : "-"}
                    </p>
                    <p>
                      <span className="font-semibold">{t("bank_name")}:</span>{" "}
                      {bankDetail?.bank_name ? bankDetail?.bank_name : "-"}
                    </p>
                    <p>
                      <span className="font-semibold">
                        {t("documents:swift_code")}:
                      </span>{" "}
                      {bankDetail?.swift_code ? bankDetail?.swift_code : "-"}
                    </p>
                  </div>
                )}

                <div className=" w-40 h-40 mb-2">
                  <ImageWithFallback
                    src={userData?.organizationData?.stamp}
                    className="w-full h-full object-contain"
                    fallbackSrc={Stamp}
                  />
                </div>
                <p>
                  <span className="font-semibold text-[#3a2f88]">
                    {t("documents:customer_signature")}:
                  </span>{" "}
                  _______________________
                </p>
                {/* Footer */}
                <div className="border-t mt-2 pt-2 text-xs text-gray-700">
                  <p>
                    {t("address")}: {userData?.organizationData?.address}
                  </p>
                  <p>
                    {userData?.phone} | {userData?.email}{" "}
                    {userData?.website && `| ${userData?.website}`}
                  </p>
                </div>
              </div>
            </PdfCardContent>
          </PdfCard>
        </div>
      </div>
    </div>
  );
}
