"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ProductImage } from "@/components/ui/ProductImage";
import { AdminListControls } from "@/components/admin/AdminListControls";
import { useCatalogFilter } from "@/components/client/CatalogFilter";
import { IconChevronDown, IconGrip } from "@/components/icons";
import { moveProduct } from "@/lib/actions";
import { brl } from "@/lib/format";
import type { Brand, Filter, ProductEtiqueta } from "@/lib/types";

/**
 * Exactly what a listing row draws — no description, no spec, no photo array.
 * The rows are filtered in the browser now, so this shape crosses the wire to
 * the client and every field it does not need is paid for 59 times over.
 *
 * The three flags are here because the tabs filter by rule: without
 * `promotion` the "Promoção" tab would quietly show nothing.
 */
export type AdminRow = {
  id: string;
  name: string;
  price: number;
  old_price: number | null;
  photo: string | null;
  brand: { name: string } | null;
  sizeCount: number;
  status: string;
  promotion: boolean;
  available: boolean;
  ordered: boolean;
  featured: boolean;
  etiquetas: ProductEtiqueta[];
};

/** Shared by the header and the rows so the columns cannot drift apart. The
 *  last one holds the grip and both arrows: three 32px buttons, two 4px gaps. */
const COLUMNS = "40px 96px minmax(140px,2fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,1fr) 104px";

/**
 * Lifts `id` out and drops it where `overId` sits, in the full list.
 *
 * The same splice-out, splice-in the server's `renumber` does, so the order
 * painted the moment the row is let go is the order about to be written — the
 * refresh that follows confirms it rather than moving anything. Working on the
 * full list, not the visible one, is what makes it right under a filter too:
 * the model lands next to the row it was dropped on however far apart the two
 * are in the stored order.
 */
function placeNextTo(rows: AdminRow[], id: string, overId: string): AdminRow[] {
  const from = rows.findIndex((r) => r.id === id);
  const to = rows.findIndex((r) => r.id === overId);
  if (from < 0 || to < 0 || from === to) return rows;
  const next = rows.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** A list only reorders up and down; letting the row drift sideways just made
 *  it look loose under the pointer. */
const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

const SAVE_FAILED = "Não foi possível salvar a nova ordem. A lista voltou ao que está salvo.";

/**
 * The admin catalog listing.
 *
 * Filtering happens here rather than in Postgres. The whole catalog is a few
 * dozen rows, so shipping it once and narrowing it in the browser turns every
 * tab, brand and search into an instant local operation instead of a round
 * trip to a serverless function and back.
 */
export function AdminList({
  rows,
  brands,
  filters,
}: {
  rows: AdminRow[];
  brands: Brand[];
  filters: Filter[];
}) {
  const { match } = useCatalogFilter();
  const router = useRouter();
  const [pending, startMove] = useTransition();
  const [error, setError] = useState("");

  /**
   * The order on screen, which runs ahead of the server's.
   *
   * A dropped row has to stay where it was dropped: snapping back until the
   * round trip returns reads as the drop having failed. So the list draws from
   * local state, and adopts each fresh set of server rows only once nothing is
   * in flight — a refresh landing between two quick drags would otherwise pull
   * the second one back out from under the pointer.
   */
  const [base, setBase] = useState(rows);
  const [local, setLocal] = useState(rows);
  if (rows !== base) {
    setBase(rows);
    if (!pending) setLocal(rows);
  }

  /**
   * Server moves run one after another, never side by side.
   *
   * Each resolves both ids against the order it reads when it starts. Two in
   * parallel would both read the order from before either wrote, and the
   * second would undo the first. Chained, each one sees the last one's result
   * — which is also exactly the order the optimistic list assumed.
   */
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const shown = match(local);

  /**
   * Puts `id` where `overId` is — the one path for a drag, a keyboard move and
   * the arrows alike.
   *
   * The refresh at the end matters. The action revalidates on the server, but
   * this is a client tree holding rows it was handed once; without asking the
   * router again, the saved order only showed up on a manual reload. On a
   * failure it is also what puts the list back: the move never wrote, so the
   * rows that come back are the true order.
   */
  const commit = (id: string, overId: string) => {
    setError("");
    setLocal((prev) => placeNextTo(prev, id, overId));
    startMove(async () => {
      const run = queue.current.then(() => moveProduct(id, overId));
      queue.current = run.catch(() => undefined);
      const result = await run.catch(() => ({ error: SAVE_FAILED }));
      if (result?.error) setError(SAVE_FAILED);
      router.refresh();
    });
  };

  /** An arrow swaps with the row drawn next to it, so under a filter it jumps
   *  the rows the seller cannot see instead of seeming to do nothing. */
  const move = (id: string, neighbour: AdminRow | undefined) => {
    if (neighbour) commit(id, neighbour.id);
  };

  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a click on the grip
    // stays a click and a hand that shakes does not reorder anything.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    commit(String(active.id), String(over.id));
  };

  // What a screen reader hears while a row is carried. dnd-kit's defaults are
  // in English and speak in ids; these say the model's name and the place it
  // would take, counted on the list the seller is actually looking at.
  //
  // `onDragOver` fires the instant a row is picked up — over itself, at the
  // place it already holds — and again on every pointer move over the same
  // target. dnd-kit's live region is assertive, so each of those replaced the
  // one before: "levantado" was cut off by a redundant "sobre a posição 1"
  // before it could be read out. Only a change of target is announced now.
  const lastOver = useRef<UniqueIdentifier | null>(null);
  const nameOf = (id: UniqueIdentifier) => local.find((r) => r.id === id)?.name ?? "Modelo";
  const placeOf = (id: UniqueIdentifier) => shown.findIndex((r) => r.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      lastOver.current = active.id;
      return `${nameOf(active.id)} levantado, na posição ${placeOf(active.id)} de ${shown.length}.`;
    },
    onDragOver: ({ active, over }) => {
      const target = over?.id ?? null;
      if (target === lastOver.current) return undefined;
      lastOver.current = target;
      return over
        ? `${nameOf(active.id)} sobre a posição ${placeOf(over.id)} de ${shown.length}.`
        : `${nameOf(active.id)} está fora da lista.`;
    },
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameOf(active.id)} solto na posição ${placeOf(over.id)} de ${shown.length}.`
        : `${nameOf(active.id)} solto fora da lista. Nada mudou.`,
    onDragCancel: ({ active }) => `Movimento cancelado. ${nameOf(active.id)} voltou ao lugar.`,
  };

  return (
    <>
      <AdminListControls
        brands={brands}
        filters={filters}
        countLabel={`${shown.length} ${shown.length === 1 ? "modelo" : "modelos"}`}
      />

      {/* Column headings only when there are rows to head. */}
      {shown.length > 0 ? (
        <div
          className="hidden md:grid gap-4 mt-6 pb-3 border-b border-ink-10 text-xs text-ink-50"
          style={{ gridTemplateColumns: COLUMNS }}
        >
          <div>#</div>
          <div>Foto</div>
          <div>Modelo</div>
          <div>Marca</div>
          <div>Preço</div>
          <div>Num.</div>
          <div>Ordem</div>
        </div>
      ) : null}

      {error ? <div className="mt-4 text-xs text-danger">{error}</div> : null}

      <div className="mt-5 md:mt-0 flex-1 flex flex-col">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[verticalOnly]}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: {
              draggable:
                "Para reordenar, pressione espaço para levantar o modelo, use as setas para " +
                "cima e para baixo para levá-lo e espaço de novo para soltar. Esc cancela.",
            },
          }}
        >
          <SortableContext items={shown.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            {shown.map((r, i) => (
              <SortableRow
                key={r.id}
                row={r}
                index={i}
                number={local.findIndex((x) => x.id === r.id) + 1}
                first={i === 0}
                last={i === shown.length - 1}
                onUp={() => move(r.id, shown[i - 1])}
                onDown={() => move(r.id, shown[i + 1])}
              />
            ))}
          </SortableContext>
        </DndContext>

        {shown.length === 0 ? (
          // Centred in what is left below the controls, matching the storefront.
          <div className="flex-1 flex items-center justify-center py-12 md:py-24 text-center text-sm text-ink-50">
            Nenhum modelo encontrado.
          </div>
        ) : null}
      </div>
    </>
  );
}

/**
 * One listing row, carried by its grip.
 *
 * Only the grip starts a drag. The rest of the row is the link to the edit
 * screen, and on a phone it is also where the thumb lands to scroll the page —
 * letting the whole row pick itself up would turn every scroll into a reorder.
 * So `touch-action: none` sits on the grip alone, and everywhere else the
 * browser keeps its own scrolling.
 *
 * The drag moves an outer wrapper rather than the row. The row plays its entry
 * animation with `fill-mode: both`, which pins `transform: none` for good once
 * it ends — and an animation outranks any inline style, so a transform set on
 * the row itself would have been silently thrown away.
 */
function SortableRow({
  row: r,
  index: i,
  number,
  first,
  last,
  onUp,
  onDown,
}: {
  row: AdminRow;
  index: number;
  number: number;
  first: boolean;
  last: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: r.id, attributes: { roleDescription: "item reordenável" } });

  const label = String(number).padStart(2, "0");

  return (
    <div
      ref={setNodeRef}
      className={isDragging ? "relative z-30 bg-paper rounded-ui ring-1 ring-ink-10" : "relative"}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      {/* One row for both breakpoints. Rendering a phone list and a desktop
          table separately meant every model shipped twice, images included,
          with half of them permanently display:none. */}
      <div
        className="relative py-4 border-b border-ink-03 flex items-start gap-4 md:grid md:items-center md:gap-4"
        style={{
          gridTemplateColumns: COLUMNS,
          animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both",
          animationDelay: `${0.05 * Math.min(i, 7)}s`,
        }}
      >
        {/* The link covers the row rather than wrapping it: the grip and the
            arrows sit inside the same row and must not be swallowed by an
            anchor. */}
        <Link
          href={`/admin/produtos/${r.id}`}
          aria-label={`Editar ${r.name}`}
          className="absolute inset-0 z-0 transition-opacity hover:opacity-60"
        />

        <div className="hidden md:block relative z-10 pointer-events-none text-xs text-ink-25 tabular-nums">
          {label}
        </div>

        <div className="relative z-10 pointer-events-none flex-none">
          <ProductImage
            src={r.photo}
            alt={r.name}
            className="relative w-[76px] h-[76px] md:w-24 md:h-[72px]"
            sizes="96px"
          />
        </div>

        <div className="relative z-10 pointer-events-none flex-1 min-w-0 flex flex-col gap-1">
          <div className="text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
            {r.name}
          </div>
          <div className="md:hidden text-xs text-ink-50 whitespace-nowrap overflow-hidden text-ellipsis">
            {brl(r.price)} un.
          </div>
          <div className="md:hidden text-xs text-ink-25 whitespace-nowrap overflow-hidden text-ellipsis">
            {label} · {r.brand?.name ?? "Sem marca"} · {r.sizeCount} numerações
          </div>
          <div className="hidden md:flex gap-2 text-xs text-ink-50">
            {r.featured ? <span>Destaque na home</span> : null}
            {r.etiquetas.length ? (
              <span className="text-ink-25 truncate">
                {r.etiquetas.map((e) => e.name).join(" · ")}
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden md:block relative z-10 pointer-events-none text-xs text-ink-50">
          {r.brand?.name ?? "—"}
        </div>
        <div className="hidden md:flex relative z-10 pointer-events-none flex-col gap-1">
          <div className="text-sm">{brl(r.price)}</div>
          {r.old_price ? (
            <div className="text-xs text-ink-25 line-through">{brl(r.old_price)}</div>
          ) : null}
        </div>
        <div className="hidden md:flex relative z-10 pointer-events-none flex-col gap-1">
          <span className="text-xs text-ink-50">{r.sizeCount} num.</span>
          {r.status ? <span className="text-xs text-ink-25">{r.status}</span> : null}
        </div>

        <div className="relative z-10 flex-none flex flex-col items-end gap-1 md:flex-row md:items-center md:justify-end md:gap-1">
          {r.status ? <span className="md:hidden text-xs text-ink-50">{r.status}</span> : null}
          {r.featured ? (
            <span className="md:hidden text-xs text-ink font-normal">Destaque</span>
          ) : null}
          {/* On a phone the arrows stack beside the grip, so the cluster is the
              68px the two arrows took on their own before the grip arrived —
              every pixel of it comes out of the model's name at 320px. On a
              desktop they sit in a row in the Ordem column, which has room. */}
          <div className="flex items-center gap-1">
            <button
              ref={setActivatorNodeRef}
              type="button"
              aria-label={`Arrastar ${r.name}`}
              {...attributes}
              {...listeners}
              className={`w-8 h-8 flex items-center justify-center text-ink-25 touch-none transition-opacity hover:opacity-60 ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <IconGrip />
            </button>
            <div className="flex flex-col md:flex-row gap-1">
              <MoveButton label={`Subir ${r.name}`} up disabled={first} onClick={onUp} />
              <MoveButton label={`Descer ${r.name}`} disabled={last} onClick={onDown} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveButton({
  label,
  up = false,
  disabled,
  onClick,
}: {
  label: string;
  up?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center text-ink-25 transition-opacity hover:opacity-60 disabled:opacity-25 disabled:pointer-events-none"
    >
      <IconChevronDown className={up ? "rotate-180" : ""} />
    </button>
  );
}
