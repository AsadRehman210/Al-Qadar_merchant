import { store } from "store";
import { clearLoginData } from "store/slices/uniqueSlice";
import { LEGACY_WILDCARD_PERMISSIONS } from "global/alqadarRoles";
import { gender } from "global/constant";
import i18n from "i18next";
import { BASE_URL, GOOGLE_API_KEY } from "global/config";
import { toast } from "react-toastify";
import moment from "moment-timezone";

// Helper function to get nested object value
// Example: getNestedValue({make_id: {title: "Honda"}}, "make_id.title") returns "Honda"
const getNestedValue = (obj, path) => {
  return path.split(".").reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : "";
  }, obj);
};

export const formatDropdownNestedData = (
  key1,
  data,
  key2,
  key3,
  mark = "|",
) => {
  const clonedData = data?.map((item) => {
    const value1 = getNestedValue(item, key1);
    const value2 = key2 ? getNestedValue(item, key2) : "";
    const value3 = key3 ? getNestedValue(item, key3) : "";

    return {
      ...item,
      title: `${value1 || ""} ${value2 || ""} ${
        key3 ? mark + " " + (value3 || "") : ""
      }`.trim(),
    };
  });
  return clonedData;
};
export const formatDropdownData = (key1, data, key2, key3, mark = "|") => {
  const clonedData = data?.map((item) => ({
    ...item,
    title: `${item[key1] || ""} ${item[key2] || ""} ${
      key3 ? mark + " " + (item[key3] || "") : ""
    }`.trim(),
  }));
  return clonedData;
};
export const formatNameDropdownData = (field, data) => {
  return data?.map((item) => {
    let name = item.first_name || item.last_name || "Unknown";
    if (item.first_name && item.last_name) {
      name = `${item.first_name} ${item.last_name}`;
    }
    return {
      ...item,
      title: name,
    };
  });
};

// Maps a sidebar item href to the "<module>.view" permission that should gate
// it, so a sub-user only sees modules their Role grants — even for the many
// menu items still carrying the legacy `${view_customer}` placeholder. Mirrors
// the backend's MODULE_PERMISSION_MAP (source/utility/helper/constants/permissions.ts).
const HREF_VIEW_PERMISSION = {
  "/dashboard": "dashboard.view",
  "/merchant-management": "merchant-management.view",
  "/reports": "reports.view",
  "/settings": "settings.view",
  "/users": "user.view",
  "/roles": "role.view",
  "/employees": "employee.view",
  "/org-chart": "employee.view",
  "/compliance": "employee.view",
  "/departments": "department.view",
  "/designations": "designation.view",
  "/attendance": "attendance.view",
  "/attendance-policy": "attendance-policy.view",
  "/salary": "salary.view",
  "/payroll-batch": "payroll-run.view",
  "/special-payments": "special-payment.view",
  "/provident-fund": "provident-fund.view",
  "/loans": "loan.view",
  "/expenses": "expense.view",
  "/leave-management": "leave.view",
  "/requests": "employee-request.view",
  "/my-approvals": "employee-request.view",
  "/holiday-calendar": "holiday.view",
  "/announcements": "announcement.view",
  "/recruitment": "recruitment.view",
  "/onboarding": "onboarding.view",
  "/offboarding": "offboarding.view",
  "/performance": "performance.view",
  "/customers": "sales-customer.view",
  "/suppliers": "purchase-supplier.view",
  "/sales": "sales-invoice.view",
  "/quotation": "sales-quotation.view",
  "/credit-notes": "sales-credit-note.view",
  "/purchases": "purchase-invoice.view",
  "/debit-notes": "purchase-debit-note.view",
  "/inventory/products": "inventory-product.view",
  "/inventory/categories": "inventory-category.view",
  "/inventory/variants": "inventory-variant.view",
  "/inventory/production": "inventory-production.view",
  "/inventory/quarantine": "inventory-quarantine.view",
  "/inventory/stock": "warehouse-stock.view",
  "/warehouse": "warehouse.view",
  "/warehouse_transfers": "warehouse-transfer.view",
  "/warehouse_issues": "warehouse-issue.view",
  "/assets": "asset.view",
  "/assets-categories": "asset-category.view",
  "/assets/requests": "asset-request.view",
  "/assets/audits": "asset-audit.view",
  "/assets/reports": "asset.view",
  "/assets/purchases": "asset-purchase.view",
  "/finance/coa": "finance-coa.view",
  "/finance/journal": "finance-journal.view",
  "/finance/ledger": "finance-ledger.view",
  "/finance/reports": "finance-reports.view",
  "/finance/bank-cash": "finance-bank.view",
  "/finance/bank-reconciliation": "finance-reconciliation.view",
  "/finance/payable": "finance-payable.view",
  "/finance/receivable": "finance-receivable.view",
  "/finance/payments": "finance-payment.view",
  "/finance/income": "finance-income.view",
  "/finance/expenses": "finance-expense.view",
  "/finance/recoverable-tax": "finance-vat.view",
  "/finance/collected-tax": "finance-vat.view",
  "/finance/tax-payment": "finance-vat.view",
};

export const hrefViewPermission = (href) => HREF_VIEW_PERMISSION[href] || null;

// Function to check for user roles
export const checkRoleAuth = (role) => {
  const state = store.getState();
  const userRoles = state.unique.userRoles;
  const userData = state.unique.userData;

  // The Account owner (the "default user") always has full access. A sub-user
  // is gated by the permission keys their assigned Role grants — sent on the
  // login response as `account.permissions` and mirrored into
  // `state.unique.userRoles` (see authSlice loginErp).
  if (userData?.is_default_user) return true;

  if (role) {
    const roles = role?.includes(",") ? role?.split(",") : [role];

    // Legacy universal placeholders (sales-customer.*) are sprinkled across
    // many unrelated pages as a generic "can write / can read" check — for a
    // sub-user, defer those to the sidebar + backend (both enforce per module)
    // rather than hiding a Warehouse button because they lack Customer rights.
    if (roles.every((r) => LEGACY_WILDCARD_PERMISSIONS.has(r))) return true;

    const hasRole = roles?.some((r) => userRoles?.includes(r));
    if (hasRole) return true;
  }

  return false;
};

// Function to remove unnecessory data
export const removeUndefinedFields = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) =>
        v !== undefined &&
        v !== null &&
        v !== "" &&
        !(
          typeof v === "object" &&
          Object.keys(v).length === 0 &&
          !(v instanceof File || v instanceof Blob)
        ),
    ),
  );
};

// Function to format price
export const formatCommas = (price) => {
  if (price == null || isNaN(price) || price === undefined) {
    return 0;
  }
  return parseFloat(price).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3, // Ensures up to 2 decimal places
  });
};

// Function to format price with decimals
export const formatPrice = (price) => {
  if (price == null || price == undefined) {
    return 0;
  }

  let filPrice = typeof price === "string" ? parseFloat(price) : Number(price);

  // Ensure the price is formatted as per en-US with at least 2 decimal places
  return filPrice.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Converts a value to a translation key: string, spaces → underscores, lowercase.
 * @param {*} value - Any value (null/undefined becomes "")
 * @returns {string} - e.g. "Pending" → "pending", "In Progress" → "in_progress"
 */
export const toTranslationKey = (value) =>
  String(value ?? "")
    .replace(/\s+/g, "_")
    .toLowerCase();

export function isEmpty(str) {
  return str == "";
}

export function isNull(str) {
  return str === null;
}

export function isUndefined(str) {
  return str === undefined;
}

// debounce function for delay api call
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const logOut = (navigate, isExpire = true) => {
  if (localStorage.getItem("lng") === "ar") {
    localStorage.setItem("lng", "en");
    i18n.changeLanguage("en");
    document.body.dir = "ltr";
  }
  store.dispatch(clearLoginData({ navigate, isExpire }));
};

export const isBoolean = (value) => {
  return typeof value === "boolean";
};

export const isDataObject = (value) => {
  return (
    typeof value === "object" && value !== null && Object.keys(value).length > 0
  );
};

export const formatCnic = (value) => {
  // Remove non-numeric characters
  const cleaned = value.replace(/\D/g, "");

  // Format the CNIC
  if (cleaned.length <= 5) {
    return cleaned;
  } else if (cleaned.length <= 12) {
    return cleaned.slice(0, 5) + "-" + cleaned.slice(5);
  } else {
    return (
      cleaned.slice(0, 5) +
      "-" +
      cleaned.slice(5, 12) +
      "-" +
      cleaned.slice(12, 13)
    );
  }
};

export const serialNumber = (pageNo, idx, item = 10) => {
  const sn = (pageNo - 1) * item + idx;
  return sn;
};

export const jsonToFormData = (jsonObject) => {
  const formData = new FormData();

  function appendFormData(data, parentKey = "") {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const newKey = `${parentKey}[${index}]`;

        if (item instanceof File || item instanceof Blob) {
          console.log(`Appending file: ${newKey}`, item);
          formData.append(newKey, item);
        } else {
          appendFormData(item, newKey);
        }
      });
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const newKey = parentKey ? `${parentKey}[${key}]` : key;

        if (value instanceof File || value instanceof Blob) {
          console.log(`Appending file: ${newKey}`, value);
          formData.append(newKey, value);
        } else if (Array.isArray(value)) {
          value.forEach((file, index) => {
            if (file instanceof File || file instanceof Blob) {
              formData.append(`${newKey}`, file);
            } else {
              appendFormData(file, `${newKey}`);
            }
          });
        } else if (typeof value === "object" && value !== null) {
          appendFormData(value, newKey);
        } else {
          formData.append(newKey, value ?? "");
        }
      });
    } else {
      formData.append(parentKey, data ?? "");
    }
  }

  appendFormData(jsonObject);

  // Debugging FormData output
  for (let [key, value] of formData.entries()) {
    console.log(`Key: ${key}, Value:`, value, "Type:", typeof value);
  }

  return formData;
};

// Helper function to convert base64 to File object
export const dataURLtoFile = (dataurl, filename) => {
  let arr = dataurl.split(",");
  let mime = arr[0].match(/:(.*?);/)[1];
  let bstr = atob(arr[1]);
  let n = bstr.length;
  let u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const formatGender = (id) => {
  if (!id) return null;
  const selGender = gender.find((item) => item.id == id);
  return selGender.title;
};

export const formatStatus = (id) => {
  switch (id) {
    case 3:
      return "Blocked";
    case 4:
      return "Rejected";
    default:
      return "Approved";
  }
};

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const LOGO_MAX_MB = 2;

export const tenantLogoSrc = (userData) =>
  userData?.tenant?.logoUrl || userData?.organizationData?.primary_logo || null;

export const tenantDisplayName = (userData) =>
  userData?.tenant?.companyName ||
  userData?.tenant?.name ||
  userData?.organizationData?.name ||
  "";

export const accountPayloadWithLogo = (fields, logoFile) => {
  if (!(typeof File !== "undefined" && logoFile instanceof File)) return fields;
  const fd = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    fd.append(key, value === null ? "" : String(value));
  });
  fd.append("logo", logoFile);
  return fd;
};

export const formatImageUrl = (url) => {
  // Return null/empty if url is not provided or invalid
  if (
    !url ||
    typeof url !== "string" ||
    url.trim() === "" ||
    url === "undefined"
  ) {
    return null; // Return null instead of constructing invalid URL
  }

  if (/^https?:\/\//i.test(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }

  const cleanedUrl = url.replace(/^\/+/, "");
  if (!cleanedUrl || cleanedUrl.trim() === "") {
    return null;
  }

  const erpOrigin = (import.meta.env.VITE_ERP_BASE_URL || "").replace(/\/+$/, "");
  if (cleanedUrl.startsWith("uploads/") && erpOrigin) {
    return `${erpOrigin}/${cleanedUrl}`;
  }

  const cleanedBaseUrl = BASE_URL?.replace(/\/rafeeqi\/?$/, "").replace(
    /\/+$/,
    "",
  );

  return `${cleanedBaseUrl}/${cleanedUrl}`;
};

export const getDistance = async (origin, destination) => {
  if (!origin || !destination) {
    console.error("Invalid origin or destination");
    return;
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      if (
        data?.rows[0]?.elements[0]?.distance &&
        data?.rows[0]?.elements[0]?.distance?.text
      ) {
        const distance = data?.rows[0]?.elements[0]?.distance?.text; // e.g., "10 km"
        const distanceValue = data?.rows[0]?.elements[0]?.distance?.value; // e.g., 10000 (meters)
        console.log(`Distance: ${distance} (${distanceValue} meters)`);
        return { distance, distanceValue };
      } else {
        toast.error(
          "Please ensure that the pickup and drop-off locations are in the same country.",
        );
        return;
      }
    } else {
      console.error("Error fetching distance:", data.error_message);
    }
  } catch (error) {
    console.error("API request failed:", error);
  }
};

export const toFormData = (jsonObject) => {
  const formData = new FormData();

  function appendFormData(data, parentKey = "") {
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        const isDocumentImages = /^documents_\d+_images$/.test(parentKey);
        const isDocumentImagesChild = /^documents_\d+_images_child$/.test(
          parentKey,
        );
        const isContractDocument = /^contract_document$/.test(parentKey);

        // If it's document image field or contract document, skip adding [index] to the key
        const newKey =
          isDocumentImages || isDocumentImagesChild || isContractDocument
            ? parentKey
            : `${parentKey}${parentKey ? "[" + index + "]" : index}`;

        appendFormData(item, newKey);
      });
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const isDocumentImages = /^documents_\d+_images$/.test(key);
        const isDocumentImagesChild = /^documents_\d+_images_child$/.test(key);
        const isContractDocument = key === "contract_document";
        const isRouteDocument = key === "route_images";

        if (
          isDocumentImages ||
          isDocumentImagesChild ||
          isContractDocument ||
          isRouteDocument
        ) {
          if (Array.isArray(value)) {
            value.forEach((file) => {
              if (file instanceof File || file instanceof Blob) {
                // For all special fields, append without index
                formData.append(key, file);
              }
            });
          } else if (value instanceof File || value instanceof Blob) {
            // Single file case
            formData.append(key, value);
          }
        } else {
          const newKey = parentKey ? `${parentKey}[${key}]` : key;

          if (value instanceof File || value instanceof Blob) {
            formData.append(newKey, value);
          } else if (value !== null && typeof value === "object") {
            appendFormData(value, newKey);
          } else {
            formData.append(newKey, value === null ? "" : value);
          }
        }
      });
    } else {
      formData.append(parentKey, data === null ? "" : data);
    }
  }

  appendFormData(jsonObject);

  return formData;
};

export const checkRestrictedPlan = (planId) => {
  const defPlans =
    store?.getState()?.unique?.userData?.organizationData?.default_princig_id;
  if (defPlans?.includes(planId)) {
    return true;
  }
  return false;
};

export const formatDOB = (dob) => {
  if (!dob) return "-";

  let date;

  // 1. First try ISO 8601 format (with timezone conversion)
  if (moment(dob, moment.ISO_8601, true).isValid()) {
    date = moment.utc(dob).tz("Asia/Riyadh"); // Convert UTC to KSA time
  }
  // 2. Try DD-MM-YYYY format (no timezone needed)
  else if (typeof dob === "string" && dob.match(/^\d{2}-\d{2}-\d{4}$/)) {
    date = moment(dob, "DD-MM-YYYY");
  }
  // 3. Try parsing as JavaScript Date string
  else {
    try {
      date = moment(new Date(dob)).tz("Asia/Riyadh");
    } catch {
      date = moment.invalid();
    }
  }
  // console.log("date", date);

  return date.isValid() ? date.format("DD/MM/YYYY") : "-";
};
export const convertToFormData = (jsonObject) => {
  const formData = new FormData();

  function isImageKey(key) {
    return key === "route_images";
  }

  function appendFormData(data, parentKey = "") {
    if (Array.isArray(data)) {
      const isImageField = isImageKey(parentKey);

      if (data.length === 0) {
        if (!isImageField && parentKey) {
          // Only add empty array keys for non-image fields
          formData.append(parentKey, "[]"); // or use "" if preferred
        }
      } else {
        data.forEach((item, index) => {
          const newKey = isImageField
            ? parentKey // don't index for image arrays
            : `${parentKey}${parentKey ? "[" + index + "]" : index}`;

          appendFormData(item, newKey);
        });
      }
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const isImageField = isImageKey(key);
        const newKey = parentKey ? `${parentKey}[${key}]` : key;

        if (isImageField) {
          if (Array.isArray(value)) {
            value.forEach((file) => {
              if (file instanceof File || file instanceof Blob) {
                formData.append(key, file); // no index for image files
              }
            });
          } else if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          }
        } else {
          if (value instanceof File || value instanceof Blob) {
            formData.append(newKey, value);
          } else if (value !== null && typeof value === "object") {
            appendFormData(value, newKey);
          } else {
            formData.append(newKey, value === null ? "" : value);
          }
        }
      });
    } else {
      formData.append(parentKey, data === null ? "" : data);
    }
  }

  appendFormData(jsonObject);

  return formData;
};

// Helper function to safely parse dates
export const parseDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") {
    return null;
  }

  // Check if the date string matches DD-MM-YYYY HH:mm format
  const dateRegex = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
  if (dateRegex.test(dateString)) {
    return moment(dateString, "DD-MM-YYYY HH:mm");
  }

  // Try parsing as ISO string or other formats
  const parsed = moment(dateString);
  return parsed.isValid() ? parsed : null;
};

const getActiveLng = (lngOverride) => {
  const lng = i18n?.language || "en";
  return String(lng).toLowerCase();
};

const numberToWordsEnInt = (num) => {
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];

  const convertGroup = (n) => {
    if (n === 0) return "";
    let result = "";

    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }

    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + " ";
      n = 0;
    }

    if (n > 0) result += ones[n] + " ";
    return result.trim();
  };

  const groups = [];
  let n = num;
  let scaleIndex = 0;
  while (n > 0) {
    const group = n % 1000;
    if (group) {
      const groupWords = convertGroup(group);
      if (groupWords) {
        groups.unshift(
          `${groupWords}${scales[scaleIndex] ? " " + scales[scaleIndex] : ""}`,
        );
      }
    }
    n = Math.floor(n / 1000);
    scaleIndex++;
  }

  return groups.join(" ").trim();
};

const numberToWordsArInt = (num) => {
  if (num === 0) return "صفر";

  const ones = [
    "",
    "واحد",
    "اثنان",
    "ثلاثة",
    "أربعة",
    "خمسة",
    "ستة",
    "سبعة",
    "ثمانية",
    "تسعة",
  ];
  const teens = [
    "عشرة",
    "أحد عشر",
    "اثنا عشر",
    "ثلاثة عشر",
    "أربعة عشر",
    "خمسة عشر",
    "ستة عشر",
    "سبعة عشر",
    "ثمانية عشر",
    "تسعة عشر",
  ];
  const tens = [
    "",
    "",
    "عشرون",
    "ثلاثون",
    "أربعون",
    "خمسون",
    "ستون",
    "سبعون",
    "ثمانون",
    "تسعون",
  ];
  const hundreds = [
    "",
    "مائة",
    "مائتان",
    "ثلاثمائة",
    "أربعمائة",
    "خمسمائة",
    "ستمائة",
    "سبعمائة",
    "ثمانمائة",
    "تسعمائة",
  ];
  const scales = [
    { singular: "", dual: "", plural: "" },
    { singular: "ألف", dual: "ألفان", plural: "آلاف" },
    { singular: "مليون", dual: "مليونان", plural: "ملايين" },
    { singular: "مليار", dual: "ملياران", plural: "مليارات" },
    { singular: "تريليون", dual: "تريليونان", plural: "تريليونات" },
  ];

  const convertGroup = (n) => {
    if (n === 0) return "";
    const parts = [];

    const h = Math.floor(n / 100);
    const r = n % 100;
    if (h) parts.push(hundreds[h]);

    if (r) {
      if (r < 10) {
        parts.push(ones[r]);
      } else if (r < 20) {
        parts.push(teens[r - 10]);
      } else {
        const t = Math.floor(r / 10);
        const o = r % 10;
        if (o) parts.push(`${ones[o]} و ${tens[t]}`);
        else parts.push(tens[t]);
      }
    }

    return parts.join(" و ").trim();
  };

  const groupWithScale = (group, scaleIndex) => {
    if (scaleIndex === 0) return convertGroup(group);
    const scale = scales[scaleIndex] || scales[0];
    if (group === 1) return scale.singular;
    if (group === 2) return scale.dual;
    const groupWords = convertGroup(group);
    if (!groupWords) return "";
    if (group >= 3 && group <= 10) return `${groupWords} ${scale.plural}`;
    return `${groupWords} ${scale.singular}`;
  };

  const parts = [];
  let n = num;
  let scaleIndex = 0;
  while (n > 0) {
    const group = n % 1000;
    if (group) parts.unshift(groupWithScale(group, scaleIndex));
    n = Math.floor(n / 1000);
    scaleIndex++;
  }

  return parts.filter(Boolean).join(" و ").trim();
};

/**
 * Converts a number to words.
 * - English by default, Arabic when active language is `ar`.
 * - Supports decimals (2dp) as minor currency.
 */
export const numberToWords = (
  amount,
  currency,
  addOnly = true,
  options = {},
) => {
  const lng = getActiveLng(options?.lng);
  const isArabic = lng.startsWith("ar");

  const majorCurrency = currency || (isArabic ? "ريال" : "Riyal");
  const minorCurrency =
    options?.minorCurrency || (isArabic ? "هللة" : "Halala");

  const value = Number(amount);
  if (!Number.isFinite(value)) return "";

  const isNegative = value < 0;
  const abs = Math.abs(value);

  // Work in 2dp for monetary amounts.
  let integerPart = Math.floor(abs);
  let fractionPart = Math.round((abs - integerPart) * 100);
  if (fractionPart === 100) {
    integerPart += 1;
    fractionPart = 0;
  }

  const intWords = isArabic
    ? numberToWordsArInt(integerPart)
    : numberToWordsEnInt(integerPart);

  let result = `${intWords} ${majorCurrency}`;

  if (fractionPart > 0) {
    const fracWords = isArabic
      ? numberToWordsArInt(fractionPart)
      : numberToWordsEnInt(fractionPart);
    result += isArabic
      ? ` و ${fracWords} ${minorCurrency}`
      : ` and ${fracWords} ${minorCurrency}`;
  }

  if (addOnly) result += isArabic ? " فقط" : " only";
  if (isNegative) result = (isArabic ? "سالب " : "Minus ") + result;

  return result.trim();
};

// Helper functions to get current date and first date of current month
export const getCurrentDate = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};

export const getFirstDateOfCurrentMonth = () => {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `01 ${month} ${year}`;
};
export const getThirtyDaysAgo = () => {
  const now = new Date();
  now.setDate(now.getDate() - 29); // go back 29 days (so total 30 days incl. today)
  const day = String(now.getDate()).padStart(2, "0");
  const month = now.toLocaleString("en-US", { month: "short" });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
};
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  const messageDate = moment(timestamp);
  const now = moment();
  const diffInSeconds = now.diff(messageDate, "seconds");

  // If less than 1 minute, show "just now"
  if (diffInSeconds < 60) {
    return "just now";
  }

  // Otherwise, show time in 12-hour format (h:mm AM/PM)
  return messageDate.format("h:mm A");
};

export const convertToFormDataVehicle = (jsonObject) => {
  const formData = new FormData();

  function isImageKey(key) {
    return key === "image";
  }

  function appendFormData(data, parentKey = "") {
    if (Array.isArray(data)) {
      const isImageField = isImageKey(parentKey);

      if (data.length === 0) {
        if (!isImageField && parentKey) {
          // Only add empty array keys for non-image fields
          formData.append(parentKey, "[]"); // or use "" if preferred
        }
      } else {
        data.forEach((item, index) => {
          const newKey = isImageField
            ? parentKey // don't index for image arrays
            : `${parentKey}${parentKey ? "[" + index + "]" : index}`;

          appendFormData(item, newKey);
        });
      }
    } else if (typeof data === "object" && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const isImageField = isImageKey(key);
        const newKey = parentKey ? `${parentKey}[${key}]` : key;

        if (isImageField) {
          if (Array.isArray(value)) {
            value.forEach((file) => {
              if (file instanceof File || file instanceof Blob) {
                formData.append(key, file); // no index for image files
              }
            });
          } else if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          }
        } else {
          if (value instanceof File || value instanceof Blob) {
            formData.append(newKey, value);
          } else if (value !== null && typeof value === "object") {
            appendFormData(value, newKey);
          } else {
            formData.append(newKey, value === null ? "" : value);
          }
        }
      });
    } else {
      formData.append(parentKey, data === null ? "" : data);
    }
  }

  appendFormData(jsonObject);

  return formData;
};

// Generic function to reset current page for slices based on pathname

// Ultra-dynamic system that can automatically discover new routes and slices
export const getFullyDynamicSliceConfig = () => {
  const state = store.getState();

  // Base route mappings with reset type configuration
  const baseRouteMappings = {
    "/customers": { sliceName: "customer", resetType: "full" },
    "/staff": { sliceName: "staff", resetType: "full" },
    "/company": { sliceName: "company", resetType: "full" },
    "/dashboard": { sliceName: "dashboard", resetType: "full" },
  };

  // Auto-discover additional routes by analyzing the store state
  const discoveredRoutes = {};
  Object.keys(state).forEach((sliceName) => {
    const sliceState = state[sliceName];
    if (
      sliceState &&
      typeof sliceState === "object" &&
      "currentPage" in sliceState
    ) {
      // If slice has currentPage but no route mapping, create one
      const existingSliceNames = Object.values(baseRouteMappings).map(
        (config) => config.sliceName,
      );
      if (!existingSliceNames.includes(sliceName)) {
        const routePath = `/${sliceName.replace(/_/g, "-")}`;
        discoveredRoutes[routePath] = { sliceName, resetType: "page" };
      }
    }
  });

  // Combine base mappings with discovered routes
  const allRouteMappings = { ...baseRouteMappings, ...discoveredRoutes };

  // Return configuration for all slices that have currentPage
  return Object.entries(allRouteMappings)
    .filter(([, config]) => {
      const sliceState = state[config.sliceName];
      return (
        sliceState &&
        typeof sliceState === "object" &&
        "currentPage" in sliceState
      );
    })
    .map(([pathPrefix, config]) => ({
      pathPrefix,
      sliceName: config.sliceName,
      resetType: config.resetType,
      actionName: "resetInitialState",
    }));
};

// Dynamic function to reset current page for all configured slices
export const resetAllSlicesCurrentPageDynamic = (location, dispatch) => {
  // Use ultra-dynamic discovery to find all slices with currentPage property
  const sliceConfigs = getFullyDynamicSliceConfig();

  sliceConfigs.forEach(({ pathPrefix, sliceName, resetType, actionName }) => {
    if (resetType === "none") return;
    if (!location.pathname.startsWith(pathPrefix)) {
      // Dispatch the action using the slice name and action name
      // resetInitialState doesn't need a payload
      dispatch({ type: `${sliceName}/${actionName}` });
    }
  });
};

// Function to detect content type from MIME type
export const detectContentType = (type) => {
  if (!type) return "other";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (
    type === "application/pdf" ||
    type.includes("msword") ||
    type.includes("excel") ||
    type.includes("powerpoint") ||
    type.includes("officedocument")
  )
    return "document";
  return "other";
};

// ─── Operations — shared pure helpers (cross-module) ───

/** Pre-tax line subtotal: qty × price. */
export const lineTotal = (line) =>
  (Number(line?.qty) || 0) * (Number(line?.price) || 0);

/** Line profit using costPrice when present. */
export const lineProfit = (line) =>
  lineTotal(line) - (Number(line?.qty) || 0) * (Number(line?.costPrice) || 0);

export const computeInvoiceProfit = (lines) =>
  (lines || []).reduce((sum, line) => sum + lineProfit(line), 0);

/** Line tax % override, else invoice-level rate — mirrors backend effectiveLineTaxPercent. */
export const effectiveLineTaxPercent = (line, invoiceTaxPercent) =>
  line?.taxPercent !== undefined && line?.taxPercent !== null && line?.taxPercent !== ""
    ? Number(line.taxPercent) || 0
    : Number(invoiceTaxPercent) || 0;

export const deliveryFrozen = (status) =>
  status === "Delivered" || status === "Cancelled";

export const canCancelDelivery = (status) =>
  status === "Pending" || status === "InTransit";

/** YYYY-MM-DD for date inputs from ISO/date strings. */
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

// A quote stays valid through the whole validUntil calendar day (until
// 11:59:59 PM local). Date-only "2023-02-18" must not expire at midnight
// at the start of that day.
export const isQuotationExpired = (validUntil) => {
  if (!validUntil) return false;
  return moment(validUntil).endOf("day").isBefore(moment());
};

export const isQuotationExpiringSoon = (validUntil, days = 7) => {
  if (!validUntil) return false;
  const end = moment(validUntil).endOf("day");
  if (!end.isAfter(moment())) return false;
  return end.diff(moment(), "days") <= days;
};

/** Alias used across sales/customers/suppliers tables. */
export const toIsoDate = (value) => toDateInput(value);

/** Letterhead for sale/purchase/quotation prints — tenant Account, not the logged-in user. */
export const tenantLetterhead = (userData) => {
  const tenant = userData?.tenant && typeof userData.tenant === "object" ? userData.tenant : {};
  const companyName = tenant.companyName || userData?.companyName || "";
  return {
    companyName: companyName || "—",
    initial: (companyName || "?").trim().charAt(0).toUpperCase(),
    address: [tenant.address, tenant.city, tenant.country].filter(Boolean).join(", "),
    contact: [tenant.phone, tenant.email].filter(Boolean).join(" • "),
    taxNumber: tenant.taxNumber ? String(tenant.taxNumber) : "",
    logoUrl: tenant.logoUrl || null,
  };
};

/** Locale amount formatting for invoice/tables (2 decimals). */
export const formatAmount = (value, fractionDigits = 2) =>
  (parseFloat(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export const defaultSaleLine = () => ({
  variantId: "",
  productName: "",
  qty: 1,
  price: 0,
  costPrice: 0,
  unit: "",
});

export const defaultPurchaseLine = () => ({
  variantId: "",
  productName: "",
  qty: 1,
  price: 0,
  unit: "pcs",
  expiryDate: "",
  taxPercent: null,
});

export const isRawMaterialProduct = (product) =>
  product?.productType === "Raw Material";

// ─── HR / Employee Management — shared pure helpers (cross-module) ───

/** Sun→Sat keys for per-employee weekly schedule editors. */
export const weekDayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Default schedule: Sun–Thu working 09:00–18:00, Fri–Sat off. */
export const defaultWeeklySchedule = weekDayKeys.map((day) => ({
  day,
  isWorking: day !== "fri" && day !== "sat",
  start: "09:00",
  end: "18:00",
}));

/** At least one working day; every working day has start < end. */
export const isWeeklyScheduleValid = (schedule) =>
  Array.isArray(schedule) &&
  schedule.some((d) => d.isWorking) &&
  schedule.every((d) => !d.isWorking || (d.start && d.end && d.start < d.end));

/** Onboarding checklist progress — used by Onboarding list + Employee detail. */
export const onboardingProgressOf = (o) => {
  const tasks = o?.tasks || [];
  const required = tasks.filter((t) => t.required);
  const optional = tasks.filter((t) => !t.required);
  const done = tasks.filter((t) => t.done).length;
  return {
    done,
    total: tasks.length,
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    requiredDone: required.filter((t) => t.done).length,
    requiredTotal: required.length,
    optionalDone: optional.filter((t) => t.done).length,
    optionalTotal: optional.length,
  };
};

/** Resolve onboarding task-category id → display title. */
export const onboardingCategoryLabel = (id, categoryOptions = []) =>
  categoryOptions.find((c) => c.id === id)?.title || id;

/** Leave approval-step chip flags (Pending / Approved / Rejected). */
export const leaveApprovalStepStatus = (s) => ({
  done: s === "Approved",
  rejected: s === "Rejected",
  active: s === "Pending",
});

// ─── Finance / Reports — shared pure helpers (cross-module) ───

/** Signed amount string (leading "-" for negatives). */
export const formatSignedAmount = (value, fractionDigits = 2) => {
  const v = parseFloat(value) || 0;
  return `${v >= 0 ? "" : "-"}${Math.abs(v).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

/** Amount with currency suffix, e.g. "1,234.00 SAR". */
export const formatMoneyWithCurrency = (value, currency = "SAR", fractionDigits = 2) =>
  `${formatAmount(value, fractionDigits)} ${currency}`;

/** Chart-of-accounts dropdown title: "CODE — Name". */
export const coaAccountTitle = (account) =>
  account ? `${account.code || ""} — ${account.name || ""}`.replace(/^\s*—\s*|\s*—\s*$/g, "").trim() || account.name || "" : "";

/** Map CoA rows to SelectDropdown options. */
export const mapCoaToOptions = (accounts) =>
  (accounts || []).map((a) => ({ id: a.id, title: `${a.code} — ${a.name}` }));

/** Flatten CoA into parent-first order with `depth` for indentation. */
export const buildCoaTree = (accounts = []) => {
  const childrenOf = (parentId) => accounts.filter((a) => a.parentId === parentId);
  const flatten = (nodes, depth = 0) => {
    const result = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      result.push(...flatten(childrenOf(node.id), depth + 1));
    }
    return result;
  };
  return flatten(accounts.filter((a) => !a.parentId));
};

/** AR/AP aging bucket label from overdue days. */
export const agingBucketOf = (days) =>
  days <= 30 ? "0–30 days" : days <= 60 ? "31–60 days" : days <= 90 ? "61–90 days" : "90+ days";

/** Report table date cell: YYYY-MM-DD or em dash. */
export const formatReportDate = (value) => (value ? String(value).slice(0, 10) : "—");

