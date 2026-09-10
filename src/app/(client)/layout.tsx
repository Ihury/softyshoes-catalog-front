import { getBrands } from "@/lib/data";
import { CartProvider } from "@/components/client/CartProvider";
import { FavoritesProvider } from "@/components/client/FavoritesProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientHeader } from "@/components/client/ClientHeader";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const brands = await getBrands();

  return (
    <CartProvider>
      <FavoritesProvider>
        <ToastProvider>
          <div className="min-h-dvh flex flex-col">
            <ClientHeader brands={brands} />
            <main className="flex-1">{children}</main>
          </div>
        </ToastProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}
