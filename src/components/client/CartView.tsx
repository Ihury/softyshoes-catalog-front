"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/client/CartProvider";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { ProductImage } from "@/components/ui/ProductImage";
import { IconChevronLeft } from "@/components/icons";
import { brl } from "@/lib/format";
import { createOrder } from "@/lib/actions";
import type { SellerSettings } from "@/lib/types";

export function CartView({ seller, siteUrl }: { seller: SellerSettings; siteUrl: string }) {
  const { items, subtotalLabel, inc, dec, remove, clear } = useCart();
  const { flash } = useToast();
  const [sending, setSending] = useState(false);

  const digits = seller.phone.replace(/\D/g, "");

  async function onSend() {
    if (items.length === 0 || sending) return;
    if (digits.length < 12) {
      flash("Vendedor sem contato configurado.");
      return;
    }
    setSending(true);
    try {
      const orderId = await createOrder(
        items.map((c) => ({
          product_id: c.id,
          name: c.name,
          size: c.size,
          qty: c.qty,
          unit_price: c.unit,
          photo: c.photo,
        }))
      );
      const orderUrl = `${siteUrl || window.location.origin}/pedido/${orderId}`;
      const parts = [seller.message || "Olá. Segue o pedido selecionado."];
      if (seller.send_sizes) {
        parts.push(
          items.map((c) => `${c.qty}x ${c.name} · Numeração ${c.size}`).join("\n")
        );
      }
      if (seller.send_photos) {
        parts.push(`Fotos e detalhes do pedido: ${orderUrl}`);
      } else {
        parts.push(`Detalhes do pedido: ${orderUrl}`);
      }
      const link = `https://wa.me/${digits}?text=${encodeURIComponent(parts.join("\n\n"))}`;
      window.open(link, "_blank");
      flash("Pedido enviado ao vendedor.");
      clear();
    } catch {
      flash("Não foi possível enviar o pedido. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 md:pt-8 pb-[82px] md:pb-14">
      <Link
        href="/"
        className="hidden md:flex h-10 items-center gap-2 text-xs text-ink-50 transition-colors hover:text-ink w-fit"
      >
        <IconChevronLeft />
        <span>Voltar ao catálogo</span>
      </Link>

      <div className="md:mt-4 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-14">
        <div>
          <div className="hidden md:block text-xs text-ink-50">Carrinho</div>
          {items.map((c) => (
            <div
              key={c.key}
              className="py-5 md:py-6 border-b border-ink-03 flex items-start gap-4 md:gap-6"
              style={{ animation: "sfRow .3s cubic-bezier(.22,1,.36,1) both" }}
            >
              <ProductImage src={c.photo} alt={c.name} className="relative flex-none w-[76px] h-[76px] md:w-24 md:h-24"
                sizes="96px" />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                  {c.name}
                </div>
                <div className="text-xs text-ink-50">Numeração {c.size}</div>
                <div className="mt-2 text-sm font-normal text-ink">{brl(c.unit)}</div>
              </div>
              <div className="flex-none flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-6">
                <Stepper value={c.qty} onChange={(n) => (n > c.qty ? inc(c.key) : dec(c.key))} size="text-sm" />
                <button
                  type="button"
                  onClick={() => remove(c.key)}
                  className="text-xs text-ink-50 transition-colors hover:text-ink"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}

          {items.length === 0 ? (
            <div className="py-14 md:py-24 text-center text-sm text-ink-50">Seu carrinho está vazio.</div>
          ) : null}

          <div className="md:hidden py-5 border-b border-ink-03 flex items-baseline justify-between">
            <span className="text-sm text-ink-50">Sub Total</span>
            <span className="text-md font-normal text-ink">{subtotalLabel}</span>
          </div>
          <div className="md:hidden mt-4 text-xs text-ink-25">Selecionado SOFTY.</div>
        </div>

        <div className="hidden md:block">
          <div className="sticky top-[120px]">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink-50">Sub Total</span>
              <span className="text-md font-normal text-ink">{subtotalLabel}</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Button variant="solid" fullWidth disabled={items.length === 0 || sending} onClick={onSend}>
                Enviar fotos para o vendedor
              </Button>
              <Link
                href="/"
                className="h-10 border border-ink-10 bg-paper text-ink-50 text-sm rounded-ui flex items-center justify-center transition-[border-color,color,transform] hover:border-ink hover:text-ink active:scale-[.98]"
              >
                Continuar no catálogo
              </Link>
            </div>
            <div className="mt-5 text-xs text-ink-25">Selecionado SOFTY.</div>
          </div>
        </div>
      </div>

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex gap-3 pointer-events-none">
        <Button
          variant="solid"
          fullWidth
          disabled={items.length === 0 || sending}
          onClick={onSend}
          className="pointer-events-auto"
        >
          Enviar fotos para o vendedor
        </Button>
        <Link
          href="/"
          className="pointer-events-auto flex-none min-w-[116px] px-3 h-10 border border-ink-10 bg-paper-50 backdrop-blur-[20px] text-ink-50 text-sm rounded-ui flex items-center justify-center transition-transform active:scale-[.98]"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
