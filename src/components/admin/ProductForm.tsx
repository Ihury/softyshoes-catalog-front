"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose, IconPlus } from "@/components/icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { SizeToggleGrid } from "@/components/ui/SizeGrid";
import { useToast } from "@/components/ui/Toast";
import { saveProduct, deleteProduct } from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload";
import { moneyInput, parseMoney } from "@/lib/format";
import { sizeGridFor } from "@/lib/types";
import type { Brand, Etiqueta, Filter, Product } from "@/lib/types";

/** Upper bound on photos per model. Generous on purpose — it exists to stop a
 *  runaway paste, not to ration what a model can show. */
const MAX_PHOTOS = 15;

type FlagKey = keyof Pick<Product, "promotion" | "available" | "featured" | "ordered">;

/** Which flag each filter rule switches. "todos" has no flag behind it. */
const RULE_FLAG: Partial<Record<string, FlagKey>> = {
  promo: "promotion",
  disp: "available",
  ped: "ordered",
};

/** Every switch the form can save, in the order they are drawn. The hidden
 *  inputs are rendered from this list rather than from the visible rows, so a
 *  switch the seller cannot see still round-trips its stored value instead of
 *  being saved as false. */
export const ALL_FLAGS: FlagKey[] = ["promotion", "available", "ordered", "featured"];

/**
 * The flag rows, named after the seller's own filters.
 *
 * A switch takes the name of the filter that uses its rule: hard-coding
 * "Promoção" here meant that renaming the tab left the editor talking about a
 * label that no longer existed anywhere on the site.
 *
 * A switch only disappears with its filter when the filter is the only thing it
 * drove. That is true of `ordered` alone — delete the "Pedidos" tab and nothing
 * reads the flag any more, so continuing to ask about pedidos is noise. The
 * other three earn their place whatever the seller does to the tabs:
 * `promotion` picks the chip a model shows when it carries no etiqueta,
 * `featured` is the model the home falls back to, and `available` is what the
 * listing here reads as Publicado or Pausado.
 */
function flagsFrom(filters: Filter[]): { key: FlagKey; label: string }[] {
  const rows: { key: FlagKey; label: string }[] = [];
  for (const f of filters) {
    const key = RULE_FLAG[f.rule];
    if (key && !rows.some((r) => r.key === key)) rows.push({ key, label: f.name });
  }
  if (!rows.some((r) => r.key === "available")) {
    rows.unshift({ key: "available", label: "Disponível" });
  }
  if (!rows.some((r) => r.key === "promotion")) {
    rows.unshift({ key: "promotion", label: "Promoção" });
  }
  rows.push({ key: "featured", label: "Destaque na home" });
  return rows;
}

/**
 * Resolves once the browser has the image ready to paint (or gave up on it).
 * Used to hand the slot straight from the local preview to the stored file
 * with no empty frame in between.
 */
function preloadImage(url: string) {
  return new Promise<void>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
    // Never let a slow asset hold the form hostage.
    setTimeout(resolve, 4000);
  });
}

/**
 * One photo in the edit screen.
 *
 * A freshly picked file is still a local `blob:` URL, which the Next image
 * optimizer cannot fetch, so it renders through a plain <img> and carries the
 * handoff's 1px progress bar until the upload lands. Unlike the catalog there
 * is no grey placeholder here — an empty slot simply is not drawn.
 */
function Photo({
  src,
  pending,
  sizes,
  onRemove,
  label,
}: {
  src: string;
  pending: string | null;
  sizes: string;
  onRemove?: () => void;
  label: string;
}) {
  const isPending = src === pending;
  return (
    <>
      {isPending ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset */}
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover opacity-65" />
          <div className="absolute left-0 right-0 bottom-0 h-px overflow-hidden bg-ink-03">
            <div
              className="w-[30%] h-full bg-ink-25"
              style={{ animation: "sfBar 1.1s cubic-bezier(.5,0,.5,1) infinite" }}
            />
          </div>
        </>
      ) : (
        <ProductImage src={src} alt="" className="absolute inset-0" sizes={sizes} />
      )}
      {onRemove && !isPending ? (
        // Always visible rather than hover-only: on a phone there is no hover.
        // Glass chip with the standard 4px radius, never a circle.
        <button
          type="button"
          aria-label={`Remover ${label}`}
          onClick={onRemove}
          className="absolute top-1 right-1 w-7 h-7 rounded-ui bg-paper-50 backdrop-blur-[14px] flex items-center justify-center text-ink-50 transition-opacity hover:opacity-60"
        >
          <IconClose />
        </button>
      ) : null}
    </>
  );
}

export function ProductForm({
  product,
  brands,
  etiquetas,
  filters,
  catalogSizes,
}: {
  product: Product | null;
  brands: Brand[];
  etiquetas: Etiqueta[];
  filters: Filter[];
  catalogSizes: number[];
}) {
  const { flash } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  // Every field is controlled, including the plain text ones. React resets a
  // <form action> after the action runs, and an uncontrolled field would come
  // back empty on a rejected save — the admin would lose everything they had
  // just typed. A controlled field is restored from state instead.
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price != null ? moneyInput(product.price) : "");
  const [oldPrice, setOldPrice] = useState(product?.old_price != null ? moneyInput(product.old_price) : "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [spec, setSpec] = useState(product?.spec ?? "");
  const [brandId, setBrandId] = useState(product?.brand_id ?? brands[0]?.id ?? "");
  const [sizes, setSizes] = useState<number[]>(product?.sizes ?? []);
  const [photos, setPhotos] = useState<string[]>(product?.photos ?? []);
  // Ordered, not a set: the first one is the chip the card shows, and
  // "Tornar principal" is what moves it there.
  const [etiquetaIds, setEtiquetaIds] = useState<string[]>(
    (product?.etiquetas ?? []).map((e) => e.id)
  );
  /** A number this model carries that is not in the seller's global list. */
  const [ownSize, setOwnSize] = useState("");
  const [ownSizeError, setOwnSizeError] = useState("");
  const [flags, setFlags] = useState({
    promotion: product?.promotion ?? false,
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    ordered: product?.ordered ?? false,
  });
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  /** Local object URL shown while the real upload is still in flight. */
  const [pending, setPending] = useState<string | null>(null);
  const saveAction = saveProduct.bind(null, product?.id ?? null);
  const FLAGS = flagsFrom(filters);
  // The seller's list plus anything this model already carries outside it.
  const sizeGrid = sizeGridFor(catalogSizes, sizes);
  // What this model carries that the catalog list does not — worth naming, or
  // the seller cannot tell a one-off 46 from a number everyone stocks.
  const extraSizes = sizes.filter((n) => !catalogSizes.includes(n));
  const byId = new Map(etiquetas.map((e) => [e.id, e]));
  const picked = etiquetaIds.map((id) => byId.get(id)).filter(Boolean) as Etiqueta[];
  const uploading = pending !== null;

  // Object URLs are revoked as soon as the slot stops using them.
  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending);
    };
  }, [pending]);

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      flash(`Máximo de ${MAX_PHOTOS} fotos por modelo.`);
      return;
    }
    const files = picked.slice(0, room);
    if (picked.length > room) flash(`Só cabem mais ${room} foto${room === 1 ? "" : "s"}.`);

    // One at a time so each photo lands in its own slot, with the local file
    // painted immediately — the admin watches them fill in instead of staring
    // at empty tiles until the network answers.
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setPending(preview);

      const { url, error } = await uploadPhoto(file);

      if (error || !url) {
        URL.revokeObjectURL(preview);
        setPending(null);
        flash(error ?? "Não foi possível enviar a foto.");
        return;
      }

      // Wait for the stored image to be decodable before swapping the local
      // preview out. Without this the slot goes preview -> empty -> image,
      // because the freshly uploaded URL still has to be fetched.
      await preloadImage(url);

      setPhotos((prev) => prev.concat(url).slice(0, MAX_PHOTOS));
      setPending(null);
      URL.revokeObjectURL(preview);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((u) => u !== url));
  }

  // The optimistic preview occupies the next free slot while it uploads.
  const shownPhotos = pending ? photos.concat(pending).slice(0, MAX_PHOTOS) : photos;

  return (
    <form
      action={async (fd) => {
        // Both fields are checked every time, so one save reports everything
        // that is wrong instead of sending the admin back for a second round.
        // The price is parsed here with the same helper the server uses, so
        // "abc" is caught in the form rather than bouncing off the database.
        const parsedPrice = parseMoney(price);
        const badName = !name.trim();
        const badPrice = parsedPrice == null || parsedPrice <= 0;
        setNameError(badName);
        setPriceError(badPrice);
        if (badName || badPrice) return;

        const result = await saveAction(fd);
        // A successful save redirects, so anything returned here is a failure.
        if (result?.error) flash(result.error);
      }}
      className="pb-24 md:pb-14"
    >
      <div className="flex items-center justify-between gap-6">
        <div className="text-xs md:text-md md:font-normal text-ink-50 md:text-ink">
          {product ? "Editar modelo" : "Novo modelo"}
        </div>
        <div className="hidden md:flex gap-3">
          <button
            type="submit"
            className="h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.98]"
          >
            Salvar alterações
          </button>
          <Link
            href="/admin"
            className="h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper-50 backdrop-blur-[20px] text-ink-50 text-sm flex items-center justify-center transition-transform active:scale-[.98]"
          >
            Voltar
          </Link>
        </div>
      </div>

      {/* Desktop splits into photos | fields, as in the handoff; mobile stacks. */}
      <div className="mt-3 md:mt-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-14">
      <div>
      <div className="text-xs text-ink-50">Fotos</div>

      {/* No grey placeholder here: an empty model shows just the add button.
          The ink-10 rectangle is a catalog device for holding layout, and in
          the editor it only reads as a broken image. */}
      {shownPhotos.length > 0 ? (
        <div className="mt-3 relative h-[223px] md:h-auto md:aspect-[4/3] rounded-ui overflow-hidden">
          <Photo
            src={shownPhotos[0]}
            pending={pending}
            sizes="(min-width: 768px) 560px, 100vw"
            label="foto de capa"
            onRemove={() => removePhoto(shownPhotos[0])}
          />
        </div>
      ) : null}

      {/* Wraps rather than scrolls: the row grows down as photos are added. */}
      <div className="mt-3 flex flex-wrap gap-3">
        {shownPhotos.slice(1).map((src, i) => (
          <div key={src} className="relative w-[76px] h-[76px] rounded-ui overflow-hidden">
            <Photo
              src={src}
              pending={pending}
              sizes="76px"
              label={`foto ${i + 2}`}
              onRemove={() => removePhoto(src)}
            />
          </div>
        ))}
        {shownPhotos.length < MAX_PHOTOS ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="w-[76px] h-[76px] border border-ink-10 rounded-ui flex items-center justify-center text-ink-50 transition-[opacity,border-color] hover:opacity-60 hover:border-ink-25 disabled:opacity-40"
          >
            <IconPlus />
          </button>
        ) : null}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFilePicked}
        />
      </div>
      <div className="mt-2 text-xs text-ink-25">
        {shownPhotos.length === 0
          ? `Nenhuma foto ainda. Até ${MAX_PHOTOS}.`
          : `${shownPhotos.length}/${MAX_PHOTOS} fotos. A primeira é a capa do modelo.`}
      </div>
      {photos.map((url) => (
        <input key={url} type="hidden" name="photos" value={url} />
      ))}
      {product ? (
        <button
          type="button"
          onClick={() => {
            if (confirm("Remover este modelo do catálogo?")) deleteProduct(product.id);
          }}
          className="hidden md:block mt-6 text-xs text-ink-50 transition-opacity hover:opacity-60"
        >
          Remover do catálogo
        </button>
      ) : null}
      </div>

      <div className="md:min-w-0">
      <div className="mt-5 md:mt-0 flex flex-col gap-3 md:gap-4 max-w-[520px] md:max-w-none">
        {/* The handoff draws the name as the screen's title: 30px, no box, a
            single rule underneath. The label lives in aria-label so the field
            still announces itself. */}
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
          aria-invalid={nameError}
          aria-label="Modelo"
          placeholder="Nome do modelo"
          className={`w-full bg-paper text-xl leading-[1.1] text-ink outline-none border-0 border-b pb-2 transition-colors ${
            nameError ? "border-danger" : "border-ink-10 focus:border-ink-25"
          }`}
        />
        {nameError ? (
          <div role="alert" className="text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
            Informe o nome do modelo.
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Marca</span>
          <div className="flex flex-wrap gap-3">
            {brands.map((b) => {
              const on = brandId === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrandId(b.id)}
                  className={
                    on
                      ? "h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-transform active:scale-[.97]"
                      : "h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25"
                  }
                >
                  {b.name}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="brand_id" value={brandId} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Etiquetas</span>
          {etiquetas.length === 0 ? (
            <div className="text-xs text-ink-25">
              Nenhuma etiqueta cadastrada ainda —{" "}
              <Link href="/admin/etiquetas" className="underline">
                criar etiquetas
              </Link>
              .
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {etiquetas.map((t) => {
                const on = etiquetaIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setEtiquetaIds((prev) =>
                        prev.includes(t.id) ? prev.filter((x) => x !== t.id) : prev.concat(t.id)
                      )
                    }
                    className={
                      on
                        ? "h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-transform active:scale-[.97]"
                        : "h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25"
                    }
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
          {picked.length > 0 ? (
            <>
              <div className="flex flex-col">
                {picked.map((t, i) => (
                  <div
                    key={t.id}
                    className="h-10 flex items-center justify-between gap-3 border-b border-ink-03"
                  >
                    <span className={i === 0 ? "text-sm text-ink" : "text-sm text-ink-50"}>
                      {t.name}
                    </span>
                    {i === 0 ? (
                      <span className="text-xs text-ink-50">Principal</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setEtiquetaIds((prev) => [t.id, ...prev.filter((x) => x !== t.id)])
                        }
                        className="h-[34px] px-3 text-xs text-ink-25 transition-opacity hover:opacity-60"
                      >
                        Tornar principal
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-xs leading-[1.65] text-ink-25">
                A principal aparece no card. As demais aparecem na página do modelo.
              </div>
            </>
          ) : null}
          {/* Order matters and `getAll` preserves it, so the DOM order of these
              is what reaches the database. */}
          {etiquetaIds.map((id) => (
            <input key={id} type="hidden" name="etiquetas" value={id} />
          ))}
        </div>

        <div className="flex gap-3">
          <label className="flex-1 min-w-0 flex flex-col gap-2">
            <span className="text-xs text-ink-50">Preço unidade</span>
            <input
              name="price"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setPriceError(false);
              }}
              aria-invalid={priceError}
              placeholder="749,00"
              inputMode="decimal"
              className={`h-10 px-4 border rounded-ui bg-paper text-sm text-ink outline-none transition-colors ${
                priceError ? "border-danger" : "border-ink-10 focus:border-ink-25"
              }`}
            />
          </label>
          <label className="flex-1 min-w-0 flex flex-col gap-2">
            <span className="text-xs text-ink-50">Preço anterior</span>
            <input
              name="old_price"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              placeholder="949,00"
              inputMode="decimal"
              className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
            />
          </label>
        </div>
        {priceError ? (
          <div role="alert" className="text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
            Informe um preço válido.
          </div>
        ) : null}

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Descrição técnica</span>
          <textarea
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Cabedal em couro. Solado de borracha vulcanizada."
            className="px-4 py-3 border border-ink-10 rounded-ui bg-paper text-xs leading-[1.65] text-ink outline-none resize-none transition-colors focus:border-ink-25"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Texto de &quot;Ler mais&quot;</span>
          <span className="text-xs text-ink-25 -mt-1">
            Deixe vazio para não aparecer &quot;Ler mais&quot;.
          </span>
          <textarea
            name="spec"
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            rows={3}
            placeholder="Palmilha fixa em EVA. Forro têxtil."
            className="px-4 py-3 border border-ink-10 rounded-ui bg-paper text-xs leading-[1.65] text-ink outline-none resize-none transition-colors focus:border-ink-25"
          />
        </label>
      </div>

      <div className="mt-5 md:mt-4 flex flex-col max-w-[520px] md:max-w-none">
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
        {ALL_FLAGS.map((key) => (
          <input key={key} type="checkbox" name={key} checked={flags[key]} readOnly className="hidden" />
        ))}
      </div>

      <div className="mt-5 md:mt-4 text-xs text-ink-50">Numeração</div>
      <div className="mt-3 max-w-[720px] md:max-w-none">
        <SizeToggleGrid
          sizes={sizeGrid}
          active={sizes}
          onToggle={(n) => setSizes((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : prev.concat(n).sort((a, b) => a - b)))}
        />
        {extraSizes.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            <span className="text-xs text-ink-25">Particulares deste modelo</span>
            <div className="flex flex-wrap gap-2">
              {extraSizes.map((n) => (
                <span key={n} className="h-10 px-3 rounded-ui bg-ink text-paper text-sm flex items-center">
                  {n}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* A number outside the seller's list — a boot in 46, say — is added
            straight to this model rather than to the whole catalog. */}
        <div className="mt-3 flex gap-3">
          <input
            value={ownSize}
            inputMode="numeric"
            onChange={(e) => {
              setOwnSize(e.target.value.replace(/\D/g, ""));
              setOwnSizeError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder="45"
            aria-label="Numeração só deste modelo"
            className="flex-1 min-w-0 h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
          <button
            type="button"
            onClick={() => {
              const n = Number(ownSize);
              if (!n) {
                setOwnSizeError("Informe uma numeração.");
                return;
              }
              if (sizes.includes(n)) {
                setOwnSizeError("Este modelo já tem essa numeração.");
                return;
              }
              setSizes((prev) => prev.concat(n).sort((a, b) => a - b));
              setOwnSize("");
              setOwnSizeError("");
            }}
            className="flex-none h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-80 active:scale-[.97]"
          >
            Adicionar
          </button>
        </div>
        {ownSizeError ? (
          <div role="alert" className="mt-2 text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
            {ownSizeError}
          </div>
        ) : null}
        {sizes.map((n) => (
          <input key={n} type="hidden" name="sizes" value={n} />
        ))}
      </div>
      </div>
      </div>

      {product ? (
        <button
          type="button"
          onClick={() => {
            if (confirm("Remover este modelo do catálogo?")) deleteProduct(product.id);
          }}
          className="md:hidden mt-6 text-xs text-ink-50 transition-opacity hover:opacity-60"
        >
          Remover do catálogo
        </button>
      ) : null}
      <div className="mt-4 md:mt-14 text-xs text-ink-25">Selecionado SOFTY.</div>

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex gap-3 pointer-events-none">
        <button
          type="submit"
          className="pointer-events-auto flex-1 h-10 rounded-ui bg-[rgba(9,9,9,0.5)] backdrop-blur-[20px] text-paper text-sm font-normal transition-[opacity,transform] hover:opacity-80 active:scale-[.98]"
        >
          Salvar alterações
        </button>
        <Link
          href="/admin"
          className="pointer-events-auto flex-none min-w-[116px] px-3 h-10 rounded-ui border border-ink-10 bg-paper-50 backdrop-blur-[20px] text-ink-50 text-sm flex items-center justify-center transition-transform active:scale-[.98]"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}
