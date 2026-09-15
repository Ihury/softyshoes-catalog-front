"use client";

import { useState } from "react";
import { IconClose } from "@/components/icons";
import { AddRow, AdminScreen, useAction } from "@/components/admin/parts";
import { addCatalogSize, removeCatalogSize } from "@/lib/actions";

/**
 * The catalog's numbering list.
 *
 * This is what every model's size grid is drawn from. Removing one here only
 * shrinks the list the seller picks from — a model that already carries the
 * number keeps it, and its own grid still shows it.
 */
export function SizesView({ sizes, usage }: { sizes: number[]; usage: Record<number, number> }) {
  const [value, setValue] = useState("");
  const { error, setError, pending, run } = useAction();

  return (
    <AdminScreen
      title="Numerações"
      hint="É a lista que alimenta a grade de numerações de cada modelo."
      error={error}
    >
      <div className="text-xs text-ink-50 mb-3">Numerações do catálogo</div>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {sizes.map((n) => {
          const total = usage[n] ?? 0;
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              aria-label={`Remover numeração ${n}`}
              onClick={() => {
                const warning =
                  total > 0
                    ? `Remover a numeração ${n} da lista? Ela some da grade, mas os ${total} ${total === 1 ? "modelo que já a tem continua" : "modelos que já a têm continuam"} com ela.`
                    : `Remover a numeração ${n} da lista?`;
                if (confirm(warning)) run(() => removeCatalogSize(n));
              }}
              className="h-10 px-3 rounded-ui border border-ink-10 bg-paper flex items-center gap-2 text-sm text-ink transition-[border-color,opacity] hover:border-ink-25 disabled:opacity-40"
            >
              <span className="tabular-nums">{n}</span>
              <IconClose className="text-ink-25" />
            </button>
          );
        })}
        {sizes.length === 0 ? (
          <div className="py-14 w-full text-center text-sm text-ink-50">
            Nenhuma numeração cadastrada.
          </div>
        ) : null}
      </div>

      <AddRow
        value={value}
        inputMode="numeric"
        onChange={(v) => {
          setValue(v.replace(/\D/g, ""));
          setError("");
        }}
        onAdd={() => run(() => addCatalogSize(Number(value)), () => setValue(""))}
        placeholder="45"
        label="Adicionar"
        pending={pending}
      />
    </AdminScreen>
  );
}
