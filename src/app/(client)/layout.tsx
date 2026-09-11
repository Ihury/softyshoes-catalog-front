import { getPublicBrands } from "@/lib/catalog";
import { CartProvider } from "@/components/client/CartProvider";
import { FavoritesProvider } from "@/components/client/FavoritesProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientHeader } from "@/components/client/ClientHeader";
import { CatalogFilterProvider } from "@/components/client/CatalogFilter";

// Statically rendered and revalidated, so the CDN answers most visits without
// waking a function. Nothing in this tree reads the query string on the server,
// which is what keeps it cacheable.
export const revalidate = 300;

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const brands = await getPublicBrands();

  return (
    <CartProvider>
      <FavoritesProvider>
        <ToastProvider>
          {/* In the layout so the header search and the catalog filters share
              one state. It filters in the browser, so no page here has to be
              rendered per request. */}
          <CatalogFilterProvider>
            <div className="min-h-dvh flex flex-col">
              <ClientHeader brands={brands} />
              <main className="flex-1">{children}</main>
            </div>
          </CatalogFilterProvider>
        </ToastProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}
