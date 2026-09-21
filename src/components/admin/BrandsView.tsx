"use client";

import { useState } from "react";
import Link from "next/link";
import { AddRow, AdminScreen, MoveColumn, PillGroup, RemoveButton, useAction } from "@/components/admin/parts";
import { createBrand, deleteBrand, moveBrand, saveBrandOrder } from "@/lib/actions";
import type { BrandOrder } from "@/lib/types";

type Row = { id: string; name: string; total: number; published: number; position: number };

const SORT_OPTIONS = [
  { value: "az", label: "A–Z" },
  { value: "manual", label: "Ordem manual" },
];

export function BrandsView({ rows, order }: { rows: Row[]; order: BrandOrder }) {
  const [newBrand, setNewBrand] = useState("");
  // Held locally as well so the list reorders on the click rather than after
  // the round trip; the server is the one that makes it stick.
  const [sort, setSort] = useState<BrandOrder>(order);
  const { error, setError, pending, run } = useAction();

  // Sorting is a view of the same list: the manual order is always stored, and
  // A-Z just reads it differently, so switching back never loses an arrangement.
  const shown =
    sort === "az"
      ? rows.slice().sort((a, b) => a.name.localeCompare(b.name, "pt"))
      : rows.slice().sort((a, b) => a.position - b.position);

  return (
    <AdminScreen title="Marcas" error={error}>
      <PillGroup
        size="xs"
        options={SORT_OPTIONS}
        value={sort}
        disabled={pending}
        onChange={(v) => {
          const next = v as BrandOrder;
          setSort(next);
          run(() => saveBrandOrder(next));
        }}
      />
      <div className="mt-2 text-xs text-ink-25">
        Vale também para o menu &quot;Marca&quot; do site.
      </div>

      <div className="mt-4 flex flex-col">
        {shown.map((b, i) => (
          <div key={b.id} className="py-4 border-b border-ink-03 flex items-center gap-3 md:gap-4">
            {sort === "manual" ? (
              <MoveColumn
                name={b.name}
                first={i === 0}
                last={i === shown.length - 1}
                disabled={pending}
                onUp={() => run(() => moveBrand(b.id, "up"))}
                onDown={() => run(() => moveBrand(b.id, "down"))}
              />
            ) : null}

            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                {b.name}
              </div>
              <div className="text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                {b.total} {b.total === 1 ? "modelo" : "modelos"} · {b.published}{" "}
                {b.published === 1 ? "publicado" : "publicados"}
              </div>
            </div>
            <Link
              href={`/admin?brand=${encodeURIComponent(b.name)}`}
              className="flex-none h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 text-xs text-ink-50 flex items-center justify-center transition-[opacity,border-color] hover:opacity-60 hover:border-ink-25"
            >
              Ver modelos
            </Link>
            {b.total === 0 ? (
              <RemoveButton
                label={`Remover ${b.name}`}
                disabled={pending}
                onClick={() => run(() => deleteBrand(b.id))}
              />
            ) : null}
          </div>
        ))}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">Nenhuma marca cadastrada.</div>
        ) : null}
      </div>

      <AddRow
        value={newBrand}
        onChange={(v) => {
          setNewBrand(v);
          setError("");
        }}
        onAdd={() => run(() => createBrand(newBrand), () => setNewBrand(""))}
        placeholder="Nova marca"
        label="Adicionar"
        pending={pending}
      />
    </AdminScreen>
  );
}
