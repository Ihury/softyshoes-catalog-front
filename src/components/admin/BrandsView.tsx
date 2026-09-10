"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconMinus } from "@/components/icons";
import { createBrand, deleteBrand } from "@/lib/actions";

type Row = { id: string; name: string; total: number; published: number };

export function BrandsView({ rows }: { rows: Row[] }) {
  const [newBrand, setNewBrand] = useState("");
  const [brandError, setBrandError] = useState("");
  const [pending, startTransition] = useTransition();

  function onAdd() {
    startTransition(async () => {
      const { error } = await createBrand(newBrand);
      if (error) {
        setBrandError(error);
        return;
      }
      setNewBrand("");
      setBrandError("");
    });
  }

  return (
    <div>
      <div className="text-xs text-ink-50">Marcas</div>
      <div className="mt-3 flex flex-col">
        {rows.map((b) => (
          <div key={b.id} className="py-4 border-b border-ink-03 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {b.name}
              </div>
              <div className="text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                {b.total} {b.total === 1 ? "modelo" : "modelos"} · {b.published} {b.published === 1 ? "publicado" : "publicados"}
              </div>
            </div>
            <Link
              href={`/admin?brand=${encodeURIComponent(b.name)}`}
              className="flex-none h-10 min-w-[116px] px-3 rounded-r border border-ink-10 text-xs text-ink-50 flex items-center justify-center transition-colors hover:text-ink hover:border-ink-25"
            >
              Ver modelos
            </Link>
            {b.total === 0 ? (
              <button
                type="button"
                aria-label="Remover marca"
                onClick={() =>
                  startTransition(() => {
                    deleteBrand(b.id);
                  })
                }
                className="flex-none w-[34px] h-[34px] flex items-center justify-center text-ink-25 transition-colors hover:text-ink"
              >
                <IconMinus />
              </button>
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">Nenhuma marca cadastrada.</div>
        ) : null}
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={newBrand}
          onChange={(e) => {
            setNewBrand(e.target.value);
            setBrandError("");
          }}
          placeholder="Nova marca"
          aria-label="Nova marca"
          className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-r bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
        />
        <button
          type="button"
          disabled={pending}
          onClick={onAdd}
          className="flex-none h-10 min-w-[116px] px-3 rounded-r bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-[.86] active:scale-[.97] disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
      {brandError ? (
        <div className="mt-2 text-xs text-ink" style={{ animation: "sfPop .2s ease both" }}>
          {brandError}
        </div>
      ) : null}
      <div className="mt-5 text-xs text-ink-25">Selecionado SOFTY.</div>
    </div>
  );
}
