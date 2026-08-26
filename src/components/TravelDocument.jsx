import { PdfCard, PdfCardContent, PdfCardHeader } from "components/PdfCard";
import { IoLocationOutline } from "react-icons/io5";
import { FiUser, FiCalendar, FiPhone, FiMail } from "react-icons/fi";
import { RiGlobalLine } from "react-icons/ri";
import moment from "moment-timezone";
import { showCountries } from "store/slices/authSlice";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { fetchCountries } from "store/slices/authSlice";
import { useEffect } from "react";
import { showUserData } from "store/slices/uniqueSlice";
import ImageWithFallback from "components/ImageWithFallback";
import Logo from "assets/images/rafeeqi_logo_pdf.png";
import Stamp from "assets/images/Rafeeqi_Stamp.jpeg";
import { useTranslation } from "react-i18next";

export default function TravelDocument({ data, documentRef, className }) {
  const { t, i18n } = useTranslation();
  const countries = useSelector(showCountries);
  const userData = useSelector(showUserData);
  const dispatch = useDispatch();

  // Fetch countries only once when component mounts if needed
  useEffect(() => {
    if (!countries || countries?.length === 0) {
      dispatch(fetchCountries());
    }
  }, []);

  // Updated getNationality function that checks if nationality is directly available
  const getNationality = (nationalityId) => {
    // If nationalityId is an object with nationality property, return it directly
    if (
      nationalityId &&
      typeof nationalityId === "object" &&
      nationalityId.nationality
    ) {
      return nationalityId.nationality;
    }

    // Otherwise look it up in the countries array
    const country = countries?.find((c) => c._id === nationalityId);
    return country?.nationality || "-";
  };

  // Use booking_routes directly
  const bookingRoutes = data?.booking_routes || [];

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

  // Helper function to format driver iqama_no (for arrays)
  const formatDriverIqama = (drivers) => {
    if (Array.isArray(drivers)) {
      const validIqamas = drivers.map((d) => d?.iqama_no).filter(Boolean);
      if (validIqamas.length > 1) {
        return validIqamas
          .map((iqama, index) => `${index + 1}. ${iqama}`)
          .join(", ");
      }
      return validIqamas.join(", ");
    }
    return drivers?.iqama_no || null;
  };

  // Helper function to format driver phone (for arrays)
  const formatDriverPhone = (drivers) => {
    if (Array.isArray(drivers)) {
      const validPhones = drivers.map((d) => d?.phone).filter(Boolean);
      if (validPhones.length > 1) {
        return validPhones
          .map((phone, index) => `${index + 1}. ${phone}`)
          .join(", ");
      }
      return validPhones.join(", ");
    }
    return drivers?.phone || null;
  };

  return (
    <div
      className={`max-w-4xl mx-auto p-4 font-sans bg-gradient-to-b from-white to-gray-50 fixed opacity-0 top-0 pointer-events-none ${className}`}
    >
      {/* Document to be exported */}
      <div ref={documentRef} className="relative">
        <PdfCard className="border-2 border-gray-300 relative shadow-lg overflow-hidden">
          {/* Watermark - Hidden during PDF generation */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-50 screen-watermark">
            <div
              className="text-9xl font-bold text-gray-500"
              style={{ transform: "rotate(45deg)" }}
            >
              {/* RAFEEQI */}
              {userData?.organizationData?.watermark}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#3a2f88] to-[#ffc107]"></div>
          <div className="absolute top-2 right-0 w-2 h-full bg-gradient-to-b from-[#ffc107] to-[#3a2f88]"></div>
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-[#ffc107] to-[#3a2f88]"></div>
          <div className="absolute top-2 left-0 w-2 h-full bg-gradient-to-b from-[#3a2f88] to-[#ffc107]"></div>

          <PdfCardHeader className="bg-gradient-to-r from-gray-100 to-gray-50 pb-2 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-32">
                <ImageWithFallback
                  src={userData?.organizationData?.primary_logo}
                  className="h-16 object-contain"
                  fallbackSrc={Logo}
                />
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-[#3a2f88]">
                  Travel Document
                </div>
                <div className="text-xl font-bold rtl:font-semibold text-[#3a2f88]/80">
                  وثيقة السفر
                </div>
              </div>
              <div className="w-32 flex justify-end">
                <div className="text-xs text-gray-500 border border-gray-300 p-2 rounded bg-white shadow-sm">
                  <div>
                    {t("issue_date")}:
                    {/* {moment(data?.createdAt).format("DD/MM/YYYY")} */}
                    {moment(data?.createdAt)
                      .tz("Asia/Riyadh")
                      .format("DD/MM/YYYY")}
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="grid grid-cols-2 text-xs text-gray-600 border-t border-gray-200 pt-2 px-2">
              <div className="space-y-1">
                <div className="font-semibold text-[#3a2f88] text-sm">
                  <span className="capitalize">
                    {userData?.organizationData?.name}
                  </span>{" "}
                  Ltd. Co
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 flex items-center justify-center bg-[#3a2f88]/10 rounded-full">
                    <span className="text-[0.6rem] text-[#3a2f88]">CR</span>
                  </div>
                  1010822766
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 flex items-center justify-center bg-[#3a2f88]/10 rounded-full">
                    <span className="text-[0.6rem] text-[#3a2f88]">PO</span>
                  </div>
                  13312 - 7155, 3618
                </div>
                <div className="flex items-center gap-1">
                  <IoLocationOutline className="h-3 w-3 text-[#3a2f88]" />
                  {userData?.organizationData?.address}
                </div>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center justify-end gap-1">
                  <span>{userData?.organizationData?.phone}</span>
                  <FiPhone className="h-3 w-3 text-[#3a2f88]" />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span>{userData?.organizationData?.email}</span>
                  <FiMail className="h-3 w-3 text-[#3a2f88]" />
                </div>
                {userData?.organizationData?.website && (
                  <div className="flex items-center justify-end gap-1">
                    <span>{userData?.organizationData?.website}</span>
                    <RiGlobalLine className="h-3 w-3 text-[#3a2f88]" />
                  </div>
                )}
              </div>
            </div>
          </PdfCardHeader>

          <PdfCardContent className="p-6 relative">
            {/* Official Stamp */}
            {/* <div
              className="absolute top-1/2 right-1/4 opacity-30 pointer-events-none w-40 h-40"
              style={{ transform: "translateY(-50%) rotate(-15deg)" }}
            >
              <ImageWithFallback
                src={userData?.organizationData?.stamp}
                className="w-full h-full object-contain"
                fallbackSrc={Stamp}
              />
            </div> */}
            {/* {console.log(data, "travel kashaf")} */}

            {/* Passenger Information Section */}
            <div className="my-6">
              <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent rtl:bg-gradient-to-l p-2 rounded-lg">
                <FiUser className="h-5 w-5 mr-2 text-[#3a2f88]" />
                <div
                  className="flex gap-2 rtl:flex-row-reverse"
                  dir={i18n.language === "ar" ? "rtl" : "ltr"}
                >
                  <h2 className="text-lg font-semibold text-[#3a2f88]">
                    Passenger Information
                  </h2>
                  <span className="mr-auto text-lg font-semibold rtl:font-semibold text-[#3a2f88]/80">
                    معلومات الركاب
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#3a2f88]/10 to-[#3a2f88]/5 ">
                      <th className="border border-gray-200 px-4 py-2 text-start">
                        #
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-start">
                        <div
                          className="flex flex-col gap-0 rtl:flex-col-reverse"
                          dir={i18n.language === "ar" ? "rtl" : "ltr"}
                        >
                          <span>Passenger Name</span>
                          <span className="text-sm">اسم الراكب</span>
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-start">
                        <div
                          className="flex flex-col gap-0 rtl:flex-col-reverse"
                          dir={i18n.language === "ar" ? "rtl" : "ltr"}
                        >
                          <span>Nationality</span>
                          <span className="text-sm">الجنسية</span>
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-2 text-start">
                        <div
                          className="flex flex-col gap-0 rtl:flex-col-reverse"
                          dir={i18n.language === "ar" ? "rtl" : "ltr"}
                        >
                          <span>ID/Passport No</span>
                          <span className="text-sm">رقم الهوية/جواز السفر</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.customer_list?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 px-4 py-2">
                          {data?.customer_list?.indexOf(item) + 1}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          {item?.first_name} {item?.last_name}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {getNationality(item?.nationality_id)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-mono">
                          {getNationality(item?.nationality_id) === "Saudi"
                            ? item?.iqama_no || "-"
                            : item?.passport || "-"}
                        </td>
                      </tr>
                    ))}
                    {data?.adult_details?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 px-4 py-2">
                          {data?.customer_list?.length +
                            data?.adult_details?.indexOf(item) +
                            1}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          {item?.full_name ? item?.full_name : "-"}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {getNationality(item?.nationality_id)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-mono">
                          {getNationality(item?.nationality_id) === "Saudi"
                            ? item?.iqama_no || "-"
                            : item?.passport || "-"}
                        </td>
                      </tr>
                    ))}
                    {/* {console.log(data, "data")} */}
                    {data?.childern_details?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 px-4 py-2">
                          {data?.customer_list?.length +
                            data?.adult_details?.length +
                            data?.childern_details?.indexOf(item) +
                            1}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-medium">
                          {item?.full_name ? item?.full_name : "-"}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {getNationality(item?.nationality_id)}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 font-mono">
                          {getNationality(item?.nationality_id) === "Saudi"
                            ? item?.iqama_no || "-"
                            : item?.passport || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Journey Details Table */}
            <div className="my-6">
              <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent rtl:bg-gradient-to-l p-2 rounded-lg">
                <IoLocationOutline className="h-5 w-5 mr-2 text-[#3a2f88]" />
                <div
                  className="flex gap-2 rtl:flex-row-reverse"
                  dir={i18n.language === "ar" ? "rtl" : "ltr"}
                >
                  <h2 className="text-lg font-semibold text-[#3a2f88]">
                    Travel Details
                  </h2>
                  <span className="text-lg font-semibold text-[#3a2f88]/80">
                    تفاصيل الرحلة
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse bg-white text-xs">
                  <thead>
                    <tr className="bg-[#3a2f88] text-white">
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium">
                        {t("pickup_point")}
                      </th>
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium">
                        {t("dropoff_point")}
                      </th>
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium whitespace-nowrap">
                        {t("vehicle_no")}
                      </th>
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium whitespace-nowrap">
                        {t("driver")}
                      </th>
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium whitespace-nowrap">
                        {t("documents:id_number")}
                      </th>
                      <th className="border border-gray-200 px-1 py-2 text-start font-medium whitespace-nowrap">
                        {t("documents:driver_contact")}
                      </th>
                      {/* <th className="border border-gray-200 px-1 py-2 text-start font-medium w-[70px]">
                        Price
                      </th> */}
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
                          <td className="border border-gray-200 px-1 py-2 text-[10px] align-top">
                            {route.pickup_point ? route.pickup_point : "-"}
                          </td>
                          <td className="border border-gray-200 px-1 py-2 text-[10px] align-top">
                            {route.drop_point ? route.drop_point : "-"}
                          </td>
                          <td className="border border-gray-200 px-1 py-2 text-[10px] break-all w-[80px] align-top">
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
                          <td className="border border-gray-200 px-1 py-2 text-[10px] break-all w-[100px] align-top">
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
                          <td className="border border-gray-200 px-1 py-2 text-[10px] break-all w-[100px] align-top">
                            {formatDriverIqama(drivers) ? (
                              <div className="space-y-1">
                                {formatDriverIqama(drivers)
                                  .split(", ")
                                  .map((item, idx) => (
                                    <div key={idx}>{item}</div>
                                  ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="border border-gray-200 px-1 py-2 text-[10px] break-all w-[120px] align-top">
                            {formatDriverPhone(drivers) ? (
                              <div
                                className="space-y-1 rtl:ml-auto rtl:w-fit"
                                dir="ltr"
                              >
                                {formatDriverPhone(drivers)
                                  .split(", ")
                                  .map((item, idx) => (
                                    <div key={idx}>{item}</div>
                                  ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                          {/* <td className="border border-gray-200 px-1 py-2 font-semibold text-[#3a2f88]">
                            SAR {parseFloat(route.price)}
                          </td> */}
                        </tr>
                      );
                    })}

                    {/* <tr className="bg-gray-100 font-semibold">
                      <td
                        colSpan={5}
                        className="border border-gray-200 px-1 py-2"
                      >
                        Total Amount:
                      </td>
                      <td
                        colSpan={3}
                        className="border border-gray-200 px-1 py-2 text-[#3a2f88] text-end"
                      >
                        SAR{" "}
                        {(totalPrice - parseInt(data?.discount || 0)).toFixed(
                          2
                        )}
                      </td>
                    </tr> */}
                  </tbody>
                </table>
              </div>
            </div>

            <hr className="my-4" />

            {/* Vehicle & Driver Information */}
            {/* <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent p-2 rounded-lg">
                  <LuCar className="h-5 w-5 mr-2 text-[#3a2f88]" />
                  <h2 className="text-lg font-semibold text-[#3a2f88]">
                    Vehicle Information
                  </h2>
                  <span className="mr-auto text-sm font-semibold rtl:font-semibold text-[#3a2f88]/80">
                    معلومات المركبة
                  </span>
                </div>
                <div className="flex justify-between border border-gray-200 p-3 rounded-md bg-white shadow-sm">
                  <span className="font-medium">Plate Number:</span>
                  <span className="font-bold font-mono">
                    {data?.vehicle
                      ? data?.vehicle?.plate_no
                      : data?.vehicle_id?.plate_no}
                  </span>
                  <span className="font-medium rtl:font-semibold">
                    رقم اللوحة:
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent p-2 rounded-lg">
                  <FiUser className="h-5 w-5 mr-2 text-[#3a2f88]" />
                  <h2 className="text-lg font-semibold text-[#3a2f88]">
                    Driver Information
                  </h2>
                  <span className="mr-auto text-sm font-semibold rtl:font-semibold text-[#3a2f88]/80">
                    معلومات السائق
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between border border-gray-200 p-3 rounded-md bg-white shadow-sm">
                    <span className="font-medium">Driver Name:</span>
                    <span className="font-medium">
                      {data?.driver
                        ? data?.driver?.first_name +
                          " " +
                          data?.driver?.last_name
                        : data?.driver_id
                        ? data?.driver_id?.first_name +
                          " " +
                          data?.driver_id?.last_name
                        : "Not Assigned"}
                    </span>
                    <span className="font-medium rtl:font-semibold">
                      اسم السائق:
                    </span>
                  </div>
                  <div className="flex justify-between gap-2 border border-gray-200 p-3 rounded-md bg-white shadow-sm">
                    <span className="font-medium whitespace-nowrap">
                      ID Number:
                    </span>
                    <span className="font-mono break-all">
                      {data?.driver
                        ? data?.driver?.iqama_no
                        : data?.driver_id
                        ? data?.driver_id?.iqama_no
                        : "Not Assigned"}
                    </span>
                    <span className="font-medium rtl:font-semibold whitespace-nowrap">
                      رقم الهوية:
                    </span>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Travel Details */}
            {/* <div className="mb-6">
              <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent p-2 rounded-lg">
                <IoLocationOutline className="h-5 w-5 mr-2 text-[#3a2f88]" />
                <h2 className="text-lg font-semibold text-[#3a2f88]">
                  Travel Details
                </h2>
                <span className="mr-auto text-lg font-semibold rtl:font-semibold text-[#3a2f88]/80">
                  تفاصيل الرحلة
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between border border-gray-200 p-3 rounded-md bg-white shadow-sm">
                  <span className="font-medium">From:</span>
                  <span>{data?.pickup_point}</span>
                  <span className="font-medium rtl:font-semibold">من:</span>
                </div>
                <div className="flex justify-between border border-gray-200 p-3 rounded-md bg-white shadow-sm">
                  <span className="font-medium">To:</span>
                  <span>{data?.drop_point}</span>
                  <span className="font-medium rtl:font-semibold">إلى:</span>
                </div>
              </div>
            </div> */}

            {/* Date */}
            <div className="mb-6">
              <div className="flex items-center mb-3 bg-gradient-to-r from-[#3a2f88]/10 to-transparent rtl:bg-gradient-to-l p-2 rounded-lg">
                <FiCalendar className="h-5 w-5 mr-2 text-[#3a2f88]" />
                <div
                  className="flex gap-2 rtl:flex-row-reverse"
                  dir={i18n.language === "ar" ? "rtl" : "ltr"}
                >
                  <h2 className="text-lg font-semibold text-[#3a2f88]">Date</h2>
                  <span className=" text-lg font-semibold text-[#3a2f88]/80">
                    التاريخ
                  </span>
                </div>
              </div>
              <div className="flex justify-center border border-gray-200 p-3 rounded-md bg-white shadow-sm text-[#3a2f88]">
                <span className="font-bold text-lg font-mono">
                  {/* {moment(data?.start_time).format("DD/MM/YYYY")} */}
                  {moment
                    .utc(data?.start_time)
                    .tz("Asia/Riyadh")
                    .format("DD/MM/YYYY")}
                </span>
              </div>
            </div>

            {/* Footer with signatures */}
            <div className="mt-8 grid grid-cols-2 gap-8 items-end">
              <div className="text-center">
                <div className="border-b border-black pb-1 mb-2 flex items-center justify-center h-20">
                  <ImageWithFallback
                    src={userData?.organizationData?.stamp}
                    className="w-22 h-22 object-contain mb-2"
                    fallbackSrc={Stamp}
                  />
                </div>
                <div className="text-sm font-medium">
                  {t("documents:authorized_signature")}
                </div>
                <div className="text-sm rtl:font-semibold"></div>
              </div>
              <div className="text-center">
                <div className="border-b border-black pb-1 mb-2">
                  <div className="italic text-gray-500">
                    {t("documents:signature_not_required")}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  {t("documents:passenger_signature")}
                </div>
                <div className="text-sm rtl:font-semibold"></div>
              </div>
            </div>

            {/* Legal Footer */}
            <div className="mt-8 pt-4 border-t text-xs text-gray-500">
              <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <div className="font-semibold text-[#3a2f88] text-sm">
                    <span className="capitalize">
                      {userData?.organizationData?.name}
                    </span>{" "}
                    Ltd. Co
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 flex items-center justify-center bg-[#3a2f88]/10 rounded-full">
                      <span className="text-[0.6rem] text-[#3a2f88]">CR</span>
                    </div>
                    1010822766
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 flex items-center justify-center bg-[#3a2f88]/10 rounded-full">
                      <span className="text-[0.6rem] text-[#3a2f88]">PO</span>
                    </div>
                    13312 - 7155, 3618
                  </div>
                  <div className="flex items-center gap-1">
                    <IoLocationOutline className="h-3 w-3 text-[#3a2f88]" />
                    {userData?.organizationData?.address}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>{userData?.organizationData?.phone}</span>
                    <FiPhone className="h-3 w-3 text-[#3a2f88]" />
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <span>{userData?.organizationData?.email}</span>
                    <FiMail className="h-3 w-3 text-[#3a2f88]" />
                  </div>
                  {userData?.organizationData?.website && (
                    <div className="flex items-center justify-end gap-1">
                      <span>{userData?.organizationData?.website}</span>
                      <RiGlobalLine className="h-3 w-3 text-[#3a2f88]" />
                    </div>
                  )}
                </div>
              </div>
              <p className="text-center" dir="ltr">
                This document is issued by{" "}
                <span className="capitalize">
                  {userData?.organizationData?.name}
                </span>{" "}
                Transportation Services. Unauthorized reproduction is strictly
                prohibited.
              </p>
              <p className="text-center rtl:font-semibold">
                تم إصدار هذه الوثيقة من قبل خدمات النقل رفيقي. يمنع منعا باتا
                النسخ غير المصرح به.
              </p>
              <div className="flex justify-center mt-2">
                <ImageWithFallback
                  src={userData?.organizationData?.primary_logo}
                  className="h-6 object-contain opacity-50"
                  fallbackSrc={Logo}
                />
              </div>
            </div>
          </PdfCardContent>
        </PdfCard>
      </div>
    </div>
  );
}
