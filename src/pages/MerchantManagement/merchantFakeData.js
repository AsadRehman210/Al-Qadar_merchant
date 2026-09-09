export { billingPaymentMethodOptions as PAYMENT_METHOD_OPTS } from "global/constant";

export const isMerchantExpired = (merchant) => {
  if (!merchant?.portalExpiryDate) return true;
  // Allowed through the end of the expiry date itself (UTC), not just
  // until midnight — matches the backend's isPaymentExpired.
  const end = new Date(merchant.portalExpiryDate);
  end.setUTCHours(23, 59, 59, 999);
  return Date.now() > end.getTime();
};
