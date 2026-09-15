"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { saveSellerSettings } from "@/lib/actions";
import type { SellerSettings } from "@/lib/types";

const FLAGS: { key: keyof Pick<SellerSettings, "send_photos" | "send_sizes">; label: string }[] = [
  { key: "send_photos", label: "Incluir link com as fotos do pedido" },
  { key: "send_sizes", label: "Incluir numeração e quantidade" },
];

export function SellerView({ seller }: { seller: SellerSettings }) {
  const { flash } = useToast();
  const [name, setName] = useState(seller.name);
  const [phone, setPhone] = useState(seller.phone);
  const [message, setMessage] = useState(seller.message);
  const [flags, setFlags] = useState({ send_photos: seller.send_photos, send_sizes: seller.send_sizes });
  const [phoneError, setPhoneError] = useState(false);

  const digits = phone.replace(/\D/g, "");
  const previewLink = useMemo(() => {
    if (digits.length < 12) return "Informe o número para gerar o link.";
    const parts = [message || "Olá. Segue o pedido selecionado."];
    if (flags.send_sizes) parts.push("Numeração e quantidade conforme o carrinho.");
    if (flags.send_photos) parts.push("Fotos e detalhes do pedido: https://sualoja.com.br/pedido/exemplo");
    return `https://wa.me/${digits}?text=${encodeURIComponent(parts.join(" "))}`;
  }, [digits, message, flags]);

  async function onSave(fd: FormData) {
    if (digits.length < 12) {
      setPhoneError(true);
      return;
    }
    const { error } = await saveSellerSettings(fd);
    if (error) {
      flash(error);
      return;
    }
    flash("Contato salvo.");
  }

  return (
    <form action={onSave}>
      <div className="flex items-center justify-between gap-6">
        <div className="text-xs md:text-md md:font-normal text-ink-50 md:text-ink">Contato do vendedor</div>
        <button
          type="submit"
          className="hidden md:block h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.98]"
        >
          Salvar contato
        </button>
      </div>

      {/* Desktop splits into form | generated-link card, as in the handoff. */}
      <div className="mt-4 md:mt-6 md:grid md:grid-cols-2 md:gap-14 md:max-w-[1040px]">
      <div>
      <div className="flex flex-col gap-3 md:gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Nome do vendedor</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Atendimento SOFTY"
            className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">WhatsApp com DDI e DDD</span>
          <input
            name="phone"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneError(false);
            }}
            placeholder="+55 11 90000-0000"
            inputMode="tel"
            className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
        </label>
        {phoneError ? (
          <div role="alert" className="text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
            Informe um número com DDI e DDD.
          </div>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Mensagem enviada com as fotos</span>
          <textarea
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Olá. Segue o modelo selecionado."
            className="px-4 py-3 border border-ink-10 rounded-ui bg-paper text-xs leading-[1.65] text-ink outline-none resize-none transition-colors focus:border-ink-25"
          />
        </label>
      </div>

      <div className="mt-5 md:mt-4 flex flex-col">
        {FLAGS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFlags((prev) => ({ ...prev, [f.key]: !prev[f.key] }))}
            className="h-10 border-b border-ink-03 flex items-center justify-between text-sm text-ink-50 transition-opacity hover:opacity-60"
          >
            {flags[f.key] ? <span className="text-ink font-normal">{f.label}</span> : <span>{f.label}</span>}
            {flags[f.key] ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-ink">
                <path d="M3 8.4 6.2 11.6 13 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <span className="text-xs text-ink-25">Não</span>
            )}
          </button>
        ))}
        {FLAGS.map((f) => (
          <input key={f.key} type="checkbox" name={f.key} checked={flags[f.key]} readOnly className="hidden" />
        ))}
      </div>

      </div>

      <div className="mt-5 md:mt-0">
      <div className="md:p-6 md:border md:border-ink-10 md:rounded-ui">
      <div className="text-xs text-ink-50">Link gerado (exemplo)</div>
      <div className="mt-2 md:mt-3 px-4 py-3 md:p-0 border md:border-0 border-ink-10 rounded-ui text-xs leading-[1.65] text-ink-50 break-all">
        {previewLink}
      </div>
      <div className="mt-3 md:mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => {
            if (digits.length < 12) {
              setPhoneError(true);
              return;
            }
            navigator.clipboard?.writeText(previewLink);
            flash("Link copiado.");
          }}
          className="h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25"
        >
          Copiar link
        </button>
        <button
          type="button"
          onClick={() => {
            if (digits.length < 12) {
              setPhoneError(true);
              return;
            }
            window.open(previewLink, "_blank");
          }}
          className="h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25"
        >
          Testar envio
        </button>
      </div>
      <div className="mt-4 md:mt-5 text-xs leading-[1.65] text-ink-25">
        O botão &quot;Enviar fotos para o vendedor&quot; do app do cliente usa este número e esta mensagem, com o link do
        pedido real no lugar do exemplo acima.
      </div>
      </div>
      </div>
      </div>

      <div className="mt-5 md:mt-14 text-xs text-ink-25">Selecionado SOFTY.</div>

      <div className="md:hidden mt-6 flex gap-3">
        <button
          type="submit"
          className="h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.98]"
        >
          Salvar contato
        </button>
        <Link
          href="/admin"
          className="h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm flex items-center justify-center transition-transform active:scale-[.98]"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
