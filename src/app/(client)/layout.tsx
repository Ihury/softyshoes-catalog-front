import { getPublicBrands } from "@/lib/catalog";
import { CartProvider } from "@/components/client/CartProvider";
import { FavoritesProvider } from "@/components/client/FavoritesProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientHeader } from "@/components/client/ClientHeader";
import { FilterNavigationProvider } from "@/components/client/FilterNavigation";

// Rendered per request because the header reads the query string, but that is
// no longer expensive: every read in this segment comes from `lib/catalog`,
// which is cached and tag-invalidated, so a request usually touches no
// database at all.
export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const brands = await getPublicBrands();

  return (
    <CartProvider>
      <FavoritesProvider>
        <ToastProvider>
          {/* Lives in the layout so the header search and the catalog filters
              share one optimistic state and one pending flag. */}
          <FilterNavigationProvider basePath="/">
            <div className="min-h-dvh flex flex-col">
              <ClientHeader brands={brands} />
              <main className="flex-1">{children}</main>
            </div>
          </FilterNavigationProvider>
        </ToastProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}
