"use client";

import { useState } from "react";
import {
  AddRow,
  AdminScreen,
  InlineName,
  MoveColumn,
  PillGroup,
  RemoveButton,
  useAction,
} from "@/components/admin/parts";
import { createFilter, deleteFilter, moveFilter, renameFilter, setFilterRule } from "@/lib/actions";
import { FILTER_RULES, RULE_LABELS, type Filter, type FilterRule } from "@/lib/types";

const RULE_OPTIONS = FILTER_RULES.map((r) => ({ value: r, label: RULE_LABELS[r] }));

/**
 * The catalog's tab bar.
 *
 * The name is free text and the rule is what decides: calling a tab "Ofertas da
 * semana" and pointing it at Promoção changes the label on the storefront and
 * nothing else. That split is why the rule chips are part of every row rather
 * than a setting hidden behind the name.
 */
export function FiltersView({
  rows,
  usage,
}: {
  rows: Filter[];
  usage: Record<FilterRule, number>;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const { error, setError, pending, run } = useAction();

  return (
    <AdminScreen
      title="Filtros"
      hint="São as abas do catálogo, nesta ordem. O nome é livre porque o comportamento vem da regra."
      error={error}
    >
      <div className="flex flex-col">
        {rows.map((f, i) => {
          const isEditing = editing?.id === f.id;
          const total = usage[f.rule] ?? 0;
          return (
            <div
              key={f.id}
              className="py-4 border-b border-ink-03 flex flex-wrap items-center gap-3 md:gap-4"
              style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
            >
              <MoveColumn
                name={f.name}
                first={i === 0}
                last={i === rows.length - 1}
                disabled={pending}
                onUp={() => run(() => moveFilter(f.id, "up"))}
                onDown={() => run(() => moveFilter(f.id, "down"))}
              />

              <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                <InlineName
                  value={isEditing ? editing.name : f.name}
                  editing={isEditing}
                  onEdit={() => setEditing({ id: f.id, name: f.name })}
                  onChange={(v) => setEditing({ id: f.id, name: v })}
                  onSave={() =>
                    isEditing && editing.name !== f.name
                      ? run(() => renameFilter(f.id, editing.name), () => setEditing(null))
                      : setEditing(null)
                  }
                  onCancel={() => setEditing(null)}
                />
                <div className="text-xs text-ink-50">
                  {total} {total === 1 ? "modelo" : "modelos"}
                </div>
              </div>

              <div className="w-full md:w-auto md:flex-none order-last md:order-none">
                <PillGroup
                  size="xs"
                  options={RULE_OPTIONS}
                  value={f.rule}
                  disabled={pending}
                  onChange={(rule) => run(() => setFilterRule(f.id, rule as FilterRule))}
                />
              </div>

              <RemoveButton
                label={`Remover ${f.name}`}
                disabled={pending}
                onClick={() => {
                  if (confirm(`Remover o filtro "${f.name}"? A aba some do catálogo. Nenhum modelo é apagado.`)) {
                    run(() => deleteFilter(f.id));
                  }
                }}
              />
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">Nenhum filtro cadastrado.</div>
        ) : null}
      </div>

      <AddRow
        value={name}
        onChange={(v) => {
          setName(v);
          setError("");
        }}
        onAdd={() => run(() => createFilter(name), () => setName(""))}
        placeholder="Novo filtro"
        label="Adicionar"
        pending={pending}
      />
    </AdminScreen>
  );
}
