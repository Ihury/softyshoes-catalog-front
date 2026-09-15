/** Cache tags shared by the storefront readers and the admin writers.
 *  Kept in their own module so importing a tag never drags a Supabase client
 *  along with it. */
export const CATALOG_TAG = "catalog";
export const BRANDS_TAG = "brands";
export const SELLER_TAG = "seller";
export const FILTERS_TAG = "filters";
export const SIZES_TAG = "sizes";
export const SITE_TAG = "site";
