"use client";

import { useState } from "react";
import { EtiquetaChip } from "@/components/ui/Chip";
import {
  AddRow,
  AdminScreen,
  InlineName,
  PillGroup,
  RemoveButton,
  useAction,
} from "@/components/admin/parts";
import {
  createEtiqueta,
  deleteEtiqueta,
  renameEtiqueta,
  setEtiquetaStyle,
} from "@/lib/actions";
import {
  ETIQUETA_STYLES,
  ETIQUETA_STYLE_LABELS,
  type Etiqueta,
  type EtiquetaStyle,
} from "@/lib/types";

const STYLE_OPTIONS = ETIQUETA_STYLES.map((s) => ({ value: s, label: ETIQUETA_STYLE_LABELS[s] }));

/**
 * The labels drawn over a photo.
 *
 * Each one carries its own finish, and the preview sits on a stand-in for a
 * photo rather than on the page background: a glass finish only reads properly
 * against something.
 */
export function EtiquetasView({
  rows,
  usage,
}: {
  rows: Etiqueta[];
  usage: Record<string, number>;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const { error, setError, pending, run } = useAction();

  return (
    <AdminScreen
      title="Etiquetas"
      hint="Aparecem sobre a foto do modelo. Um modelo pode ter várias; a principal é a que aparece no card."
      error={error}
    >
      <div className="flex flex-col">
        {rows.map((t) => {
          const isEditing = editing?.id === t.id;
          const total = usage[t.id] ?? 0;
          return (
            <div
              key={t.id}
              className="py-4 border-b border-ink-03 flex flex-col gap-3"
              style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <InlineName
                    value={isEditing ? editing.name : t.name}
                    editing={isEditing}
                    onEdit={() => setEditing({ id: t.id, name: t.name })}
                    onChange={(v) => setEditing({ id: t.id, name: v })}
                    onSave={() =>
                      isEditing && editing.name !== t.name
                        ? run(() => renameEtiqueta(t.id, editing.name), () => setEditing(null))
                        : setEditing(null)
                    }
                    onCancel={() => setEditing(null)}
                  />
                  <div className="text-xs text-ink-50">
                    {total} {total === 1 ? "modelo" : "modelos"}
                  </div>
                </div>

                {/* The finish only reads against an image, so the preview gets
                    a photo-coloured plate to sit on. */}
                <div className="flex-none rounded-ui bg-ink-10 p-2">
                  <EtiquetaChip name={t.name || "Etiqueta"} style={t.style} />
                </div>

                <RemoveButton
                  label={`Remover ${t.name}`}
                  disabled={pending}
                  onClick={() => {
                    const warning =
                      total > 0
                        ? `Remover a etiqueta "${t.name}"? Ela sai de ${total} ${total === 1 ? "modelo" : "modelos"}. Nenhum modelo é apagado.`
                        : `Remover a etiqueta "${t.name}"?`;
                    if (confirm(warning)) run(() => deleteEtiqueta(t.id));
                  }}
                />
              </div>

              <PillGroup
                options={STYLE_OPTIONS}
                value={t.style}
                disabled={pending}
                onChange={(style) => run(() => setEtiquetaStyle(t.id, style as EtiquetaStyle))}
              />
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">
            Nenhuma etiqueta ainda. Os modelos mostram a tarja padrão.
          </div>
        ) : null}
      </div>

      <AddRow
        value={name}
        onChange={(v) => {
          setName(v);
          setError("");
        }}
        onAdd={() => run(() => createEtiqueta(name), () => setName(""))}
        placeholder="Nova etiqueta"
        label="Adicionar"
        pending={pending}
      />
    </AdminScreen>
  );
}
