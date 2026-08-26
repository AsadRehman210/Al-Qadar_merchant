// Shared, non-fake UI option lists for Categories/Products/Variants forms —
// split out of the old productFakeData.js so it can be deleted once nothing
// depends on its FAKE_PRODUCTS array.
export const STATUS_OPTIONS = [
  { title: "product:status_active", id: "Active" },
  { title: "product:status_inactive", id: "Inactive" },
];

export const PRODUCT_TYPE_OPTIONS = [
  { title: "product:finished_product", id: "Finished Product" },
  { title: "product:raw_material", id: "Raw Material" },
];

export const isRawMaterialProduct = (product) => product?.productType === "Raw Material";
