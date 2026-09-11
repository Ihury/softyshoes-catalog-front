"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { IconCheck, IconChevronRight } from "@/components/icons";
import type { Brand } from "@/lib/types";

export function AdminBrandSheet({
  open,
  onClose,
  brands,
  activeBrand,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  brands: Brand[];
  activeBrand: string;
  onSelect: (name: string) => void;
}) {
  const options = ["Todas", ...brands.map((b) => b.name)];

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="w-9 h-0.5 bg-ink-10 mx-auto mb-5 md:hidden" />
      <div className="flex flex-col">
        {options.map((label) => {
          const on = activeBrand === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onSelect(label)}
              className="h-10 flex items-center justify-between text-md text-ink-50 transition-colors hover:text-ink"
              style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
            >
              {on ? (
                <span className="text-ink font-normal">{label === "Todas" ? "Todas as marcas" : label}</span>
              ) : (
                <span>{label === "Todas" ? "Todas as marcas" : label}</span>
              )}
              {on ? <IconCheck className="text-ink" /> : null}
            </button>
          );
        })}
        <Link
          href="/admin/marcas"
          onClick={onClose}
          className="mt-3 h-10 flex items-center justify-between text-sm text-ink-50 border-t border-ink-03 transition-colors hover:text-ink"
        >
          <span>Gerenciar marcas</span>
          <IconChevronRight />
        </Link>
      </div>
    </Sheet>
  );
}
