import { createClient } from "@/lib/supabase/server";
import { getSellerSettings, getTags } from "@/lib/data";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const [{ count }, seller, tags] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    getSellerSettings(),
    getTags(),
  ]);

  const sellerReady = seller.phone.replace(/\D/g, "").length >= 12;

  return (
    <ToastProvider>
      <AdminShell productCount={count ?? 0} sellerReady={sellerReady} tags={tags}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}
