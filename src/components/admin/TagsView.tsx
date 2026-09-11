"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconChevronDown, IconMinus } from "@/components/icons";
import { createTag, deleteTag, moveTag, renameTag } from "@/lib/actions";

type Row = { id: string; name: string; position: number; total: number };

/**
 * The seller's filters. Whatever is listed here, in this order, is exactly what
 * the storefront shows as tabs after "Todos" — so the order controls are part
 * of the feature, not a nicety.
 */
export function TagsView({ rows }: { rows: Row[] }) {
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  /** Which row is being renamed, and the text being typed into it. */
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error: string | null }>, onDone?: () => void) {
    startTransition(async () => {
      const { error: err } = await fn();
      setError(err ?? "");
      if (!err) onDone?.();
    });
  }

  return (
    <div>
      <div className="text-xs md:text-md md:font-normal text-ink-50 md:text-ink">Tags</div>
      <div className="mt-1 text-xs text-ink-25">
        Viram as abas do catálogo, nesta ordem, depois de &quot;Todos&quot;.
      </div>

      <div className="mt-3 md:mt-6 flex flex-col">
        {rows.map((t, i) => {
          const isEditing = editing?.id === t.id;
          return (
            <div
              key={t.id}
              className="py-4 border-b border-ink-03 flex items-center gap-3 md:gap-4"
              style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
            >
              {/* Order controls. Chevrons rotated rather than two more glyphs. */}
              <div className="flex-none flex flex-col">
                <button
                  type="button"
                  aria-label={`Subir ${t.name}`}
                  disabled={i === 0 || pending}
                  onClick={() => run(() => moveTag(t.id, "up"))}
                  className="w-6 h-5 flex items-center justify-center text-ink-25 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-25"
                >
                  <span className="rotate-180 flex">
                    <IconChevronDown />
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Descer ${t.name}`}
                  disabled={i === rows.length - 1 || pending}
                  onClick={() => run(() => moveTag(t.id, "down"))}
                  className="w-6 h-5 flex items-center justify-center text-ink-25 transition-colors hover:text-ink disabled:opacity-30 disabled:hover:text-ink-25"
                >
                  <IconChevronDown />
                </button>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-1">
                {isEditing ? (
                  <input
                    value={editing.name}
                    autoFocus
                    onChange={(e) => setEditing({ id: t.id, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        run(() => renameTag(t.id, editing.name), () => setEditing(null));
                      }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    aria-label={`Renomear ${t.name}`}
                    className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing({ id: t.id, name: t.name })}
                    className="text-left text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis transition-opacity hover:opacity-60"
                  >
                    {t.name}
                  </button>
                )}
                <div className="text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.total} {t.total === 1 ? "modelo" : "modelos"}
                </div>
              </div>

              {isEditing ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => renameTag(t.id, editing.name), () => setEditing(null))}
                  className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-[.86] active:scale-[.97] disabled:opacity-40"
                >
                  Salvar
                </button>
              ) : (
                <Link
                  href={`/admin?tag=${encodeURIComponent(t.name)}`}
                  className="hidden md:flex flex-none h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 text-xs text-ink-50 items-center justify-center transition-colors hover:text-ink hover:border-ink-25"
                >
                  Ver modelos
                </Link>
              )}

              <button
                type="button"
                aria-label={`Remover ${t.name}`}
                disabled={pending}
                onClick={() => {
                  const warning =
                    t.total > 0
                      ? `Remover a tag "${t.name}"? Ela sai de ${t.total} ${t.total === 1 ? "modelo" : "modelos"} e do catálogo. Nenhum modelo é apagado.`
                      : `Remover a tag "${t.name}"?`;
                  if (confirm(warning)) run(() => deleteTag(t.id));
                }}
                className="flex-none w-[34px] h-[34px] flex items-center justify-center text-ink-25 transition-colors hover:text-ink disabled:opacity-30"
              >
                <IconMinus />
              </button>
            </div>
          );
        })}
        {rows.length === 0 ? (
          <div className="py-14 text-center text-sm text-ink-50">
            Nenhuma tag ainda. O catálogo mostra só &quot;Todos&quot;.
          </div>
        ) : null}
      </div>

      <div className="mt-5 md:mt-6 flex gap-3">
        <input
          value={newTag}
          onChange={(e) => {
            setNewTag(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") run(() => createTag(newTag), () => setNewTag(""));
          }}
          placeholder="Nova tag"
          aria-label="Nova tag"
          className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => createTag(newTag), () => setNewTag(""))}
          className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-[.86] active:scale-[.97] disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>
      {error ? (
        <div role="alert" className="mt-2 text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
          {error}
        </div>
      ) : null}
      <div className="mt-5 md:mt-14 text-xs text-ink-25">Selecionado SOFTY.</div>
    </div>
  );
}
