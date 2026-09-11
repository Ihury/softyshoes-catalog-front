import { notFound } from "next/navigation";
import { getPublicOrder } from "@/lib/catalog";
import { ProductImage } from "@/components/ui/ProductImage";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getPublicOrder(id);
  if (!order) notFound();

  const subtotal = order.items.reduce((sum, i) => sum + i.unit_price * i.qty, 0);

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="max-w-[720px] mx-auto px-6 py-8 md:py-14">
        <div className="text-xl leading-none font-normal">SOFTY</div>
        <div className="mt-1 text-xs text-ink-50">Pedido enviado pelo catálogo</div>

        <div className="mt-8 flex flex-col">
          {order.items.map((item, i) => (
            <div key={i} className="py-5 border-b border-ink-03 flex items-center gap-4">
              <ProductImage src={item.photo} alt={item.name} className="relative flex-none w-20 h-20 md:w-24 md:h-24"
                sizes="96px" />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="text-sm font-normal">{item.name}</div>
                <div className="text-xs text-ink-50">Numeração {item.size} · Qtd {item.qty}</div>
                <div className="text-sm font-normal">{brl(item.unit_price)} un.</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-baseline justify-between">
          <span className="text-sm text-ink-50">Sub Total</span>
          <span className="text-md font-normal">{brl(subtotal)}</span>
        </div>
        <div className="mt-6 text-xs text-ink-25">Selecionado SOFTY.</div>
      </div>
    </div>
  );
}
