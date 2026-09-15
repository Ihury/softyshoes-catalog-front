import { getPublicBrands, getPublicFilters } from "@/lib/catalog";
import { CartProvider } from "@/components/client/CartProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientHeader } from "@/components/client/ClientHeader";
import { CatalogFilterProvider } from "@/components/client/CatalogFilter";

// Statically rendered and revalidated, so the CDN answers most visits without
// waking a function. Nothing in this tree reads the query string on the server,
// which is what keeps it cacheable.
export const revalidate = 300;

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const [brands, filters] = await Promise.all([getPublicBrands(), getPublicFilters()]);

  return (
    <CartProvider>
      <ToastProvider>
        {/* In the layout so the header search and the catalog filters share
            one state. It filters in the browser, so no page here has to be
            rendered per request. */}
        <CatalogFilterProvider filters={filters}>
          <div className="min-h-dvh flex flex-col">
            <ClientHeader brands={brands} />
            {/* A column, so a page can take the height left under the header
                and centre an empty state in what is left. Every page below is
                now a flex item, and each one centres itself with mx-auto —
                which cancels the cross-axis stretch — so they each carry
                w-full. Without it a page sizes to its widest content and
                pushes the document past the viewport. */}
            <main className="flex-1 flex flex-col">{children}</main>
          </div>
        </CatalogFilterProvider>
      </ToastProvider>
    </CartProvider>
  );
}
