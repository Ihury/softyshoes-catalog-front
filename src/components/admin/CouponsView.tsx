"use client";

import { useState } from "react";
import { AdminScreen, PillGroup, RemoveButton, useAction } from "@/components/admin/parts";
import { createCoupon, deleteCoupon, updateCoupon } from "@/lib/actions";
import type { Coupon } from "@/lib/types";

const STATE_OPTIONS = [
  { value: "on", label: "Ativo" },
  { value: "off", label: "Pausado" },
];

/**
 * Discount codes.
 *
 * The site takes no payment, so a coupon is a line in the WhatsApp message and
 * an amount the seller honours at closing time. The hint says so, because a
 * seller who expects the site to enforce it would be in for a surprise.
 */
export function CouponsView({ rows }: { rows: Coupon[] }) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("10");
  const { error, setError, pending, run } = useAction();

  return (
    <AdminScreen
      title="Cupons"
      hint="O cliente digita o código no carrinho. O desconto entra na mensagem enviada — não há cobrança no site, então o valor é o que você honra no fechamento."
      error={error}
    >
      <div className="flex flex-col">
        {rows.map((c) => (
          <div
            key={c.id}
            className="py-4 border-b border-ink-03 flex flex-wrap items-center gap-3 md:gap-4"
            style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
          >
            <div className="flex-1 min-w-[120px] flex flex-col gap-1">
              <span className="text-sm font-normal text-ink">{c.code}</span>
              <span className="text-xs text-ink-50">{c.percent}% de desconto</span>
            </div>

            <div className="flex-none flex items-center gap-2">
              <input
                defaultValue={String(c.percent)}
                inputMode="numeric"
                aria-label={`Desconto do cupom ${c.code}`}
                onBlur={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, ""));
                  if (n && n !== c.percent) run(() => updateCoupon(c.id, { percent: n }));
                }}
                className="w-[72px] h-10 px-3 border border-ink-10 rounded-ui bg-paper text-sm text-ink text-center outline-none transition-colors focus:border-ink-25"
              />
              <span className="text-xs text-ink-25">%</span>
            </div>

            <PillGroup
              size="xs"
              options={STATE_OPTIONS}
              value={c.active ? "on" : "off"}
              disabled={pending}
              onChange={(v) => run(() => updateCoupon(c.id, { active: v === "on" }))}
            />

            <RemoveButton
              label={`Remover ${c.code}`}
              disabled={pending}
              onClick={() => {
                if (confirm(`Remover o cupom "${c.code}"?`)) run(() => deleteCoupon(c.id));
              }}
            />
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">Nenhum cupom cadastrado.</div>
        ) : null}
      </div>

      <div className="mt-5 md:mt-6 flex flex-wrap gap-3">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError("");
          }}
          placeholder="CODIGO"
          aria-label="Código do cupom"
          className="flex-1 min-w-[140px] h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
        />
        <div className="flex-none flex items-center gap-2">
          <input
            value={percent}
            inputMode="numeric"
            onChange={(e) => setPercent(e.target.value.replace(/\D/g, ""))}
            aria-label="Desconto em porcento"
            className="w-[72px] h-10 px-3 border border-ink-10 rounded-ui bg-paper text-sm text-ink text-center outline-none transition-colors focus:border-ink-25"
          />
          <span className="text-xs text-ink-25">%</span>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(
              () => createCoupon(code, Number(percent)),
              () => {
                setCode("");
                setPercent("10");
              }
            )
          }
          className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.97] disabled:opacity-40"
        >
          Adicionar cupom
        </button>
      </div>
    </AdminScreen>
  );
}
