"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconClose, IconMinus, IconPlus } from "@/components/icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { SizeToggleGrid } from "@/components/ui/SizeGrid";
import { useToast } from "@/components/ui/Toast";
import { saveProduct, deleteProduct } from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload";
import { moneyInput, parseMoney } from "@/lib/format";
import type { Brand, Product, Tag } from "@/lib/types";

/** Upper bound on photos per model, and per colourway. Generous on purpose —
 *  it exists to stop a runaway paste, not to ration what a model can show. */
const MAX_PHOTOS = 15;

/** Upload target for the model's own gallery, as opposed to a colourway key. */
const MODEL = "model";

/** Enough for any real colour run, low enough that the editor stays readable. */
const MAX_COLORS = 12;

/** A colourway while it is being edited. The key is local to this form: colour
 *  rows are rewritten wholesale on save, so their database ids are not stable
 *  and cannot be used to track a row across renders. */
type ColorDraft = { key: string; name: string; photos: string[] };

let colorSeq = 0;
function newColor(): ColorDraft {
  return { key: `c${++colorSeq}`, name: "", photos: [] };
}

const FLAGS: { key: keyof Pick<Product, "promotion" | "available" | "featured" | "ordered">; label: string }[] = [
  { key: "promotion", label: "Promoção" },
  { key: "available", label: "Disponível" },
  { key: "featured", label: "Destaque na home" },
  { key: "ordered", label: "Aparece em Pedidos" },
];

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
          className="absolute top-1 right-1 w-7 h-7 rounded-ui bg-paper-50 backdrop-blur-[14px] flex items-center justify-center text-ink-50 transition-colors hover:text-ink"
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
  tags,
}: {
  product: Product | null;
  brands: Brand[];
  tags: Tag[];
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
  const [tagIds, setTagIds] = useState<string[]>(product?.tag_ids ?? []);
  const [colors, setColors] = useState<ColorDraft[]>(
    () => (product?.colors ?? []).map((c) => ({ key: `c${++colorSeq}`, name: c.name, photos: c.photos }))
  );
  const [flags, setFlags] = useState({
    promotion: product?.promotion ?? false,
    available: product?.available ?? true,
    featured: product?.featured ?? false,
    ordered: product?.ordered ?? false,
  });
  const [nameError, setNameError] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [colorError, setColorError] = useState(false);
  /**
   * Local object URL shown while the real upload is still in flight, together
   * with the gallery it belongs to — one file input serves the model and every
   * colourway, so the preview has to say where it is going.
   */
  const [pending, setPending] = useState<{ target: string; url: string } | null>(null);
  const target = useRef<string>(MODEL);
  const saveAction = saveProduct.bind(null, product?.id ?? null);
  const uploading = pending !== null;

  // Object URLs are revoked as soon as the slot stops using them.
  useEffect(() => {
    const url = pending?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [pending]);

  function galleryOf(key: string) {
    return key === MODEL ? photos : (colors.find((c) => c.key === key)?.photos ?? []);
  }

  function updateGallery(key: string, next: (prev: string[]) => string[]) {
    if (key === MODEL) setPhotos(next);
    else setColors((prev) => prev.map((c) => (c.key === key ? { ...c, photos: next(c.photos) } : c)));
  }

  function openPicker(key: string) {
    target.current = key;
    fileInput.current?.click();
  }

  /** The optimistic preview occupies the next free slot of its own gallery. */
  function shownOf(key: string) {
    const list = galleryOf(key);
    return pending?.target === key ? list.concat(pending.url).slice(0, MAX_PHOTOS) : list;
  }

  async function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    // Read once: the picker's target cannot change mid-upload, but the state
    // it points at will, so the count has to come from the current list.
    const key = target.current;
    const room = MAX_PHOTOS - galleryOf(key).length;
    if (room <= 0) {
      flash(`Máximo de ${MAX_PHOTOS} fotos.`);
      return;
    }
    const files = picked.slice(0, room);
    if (picked.length > room) flash(`Só cabem mais ${room} foto${room === 1 ? "" : "s"}.`);

    // One at a time so each photo lands in its own slot, with the local file
    // painted immediately — the admin watches them fill in instead of staring
    // at empty tiles until the network answers.
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setPending({ target: key, url: preview });

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

      updateGallery(key, (prev) => prev.concat(url).slice(0, MAX_PHOTOS));
      setPending(null);
      URL.revokeObjectURL(preview);
    }
  }

  function removePhoto(key: string, url: string) {
    updateGallery(key, (prev) => prev.filter((u) => u !== url));
  }

  const shownPhotos = shownOf(MODEL);
  const pendingUrl = pending?.url ?? null;

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
        // A colour with no name would be dropped on the way to the database.
        // Say so instead, rather than letting photos disappear quietly.
        const badColor = colors.some((c) => !c.name.trim());
        setNameError(badName);
        setPriceError(badPrice);
        setColorError(badColor);
        if (badName || badPrice || badColor) return;

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
            className="h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-opacity hover:opacity-[.86] active:scale-[.98]"
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
            pending={pendingUrl}
            sizes="(min-width: 768px) 560px, 100vw"
            label="foto de capa"
            onRemove={() => removePhoto(MODEL, shownPhotos[0])}
          />
        </div>
      ) : null}

      {/* Wraps rather than scrolls: the row grows down as photos are added. */}
      <div className="mt-3 flex flex-wrap gap-3">
        {shownPhotos.slice(1).map((src, i) => (
          <div key={src} className="relative w-[76px] h-[76px] rounded-ui overflow-hidden">
            <Photo
              src={src}
              pending={pendingUrl}
              sizes="76px"
              label={`foto ${i + 2}`}
              onRemove={() => removePhoto(MODEL, src)}
            />
          </div>
        ))}
        {shownPhotos.length < MAX_PHOTOS ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => openPicker(MODEL)}
            className="w-[76px] h-[76px] border border-ink-10 rounded-ui flex items-center justify-center text-ink-50 transition-colors hover:text-ink hover:border-ink-25 disabled:opacity-40"
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

      {/* Colourways. A model with none behaves exactly as it always has: one
          gallery, and nothing extra to choose on the storefront. */}
      <div className="mt-6">
        <div className="text-xs text-ink-50">Cores</div>
        <div className="mt-1 text-xs text-ink-25">
          Cada cor tem as próprias fotos. Sem nenhuma cor, o modelo usa as fotos acima.
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {colors.map((c, i) => {
            const shown = shownOf(c.key);
            return (
              <div
                key={c.key}
                className="border border-ink-10 rounded-ui p-3"
                style={{ animation: "sfRow .34s cubic-bezier(.22,1,.36,1) both" }}
              >
                <div className="flex gap-3">
                  <input
                    value={c.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setColors((prev) =>
                        prev.map((x) => (x.key === c.key ? { ...x, name: value } : x))
                      );
                      setColorError(false);
                    }}
                    aria-invalid={colorError && !c.name.trim()}
                    placeholder="Preto, Off-white, Azul marinho…"
                    aria-label={`Nome da cor ${i + 1}`}
                    className={`flex-1 min-w-0 h-10 px-4 border rounded-ui bg-paper text-sm text-ink outline-none transition-colors ${
                      colorError && !c.name.trim() ? "border-danger" : "border-ink-10 focus:border-ink-25"
                    }`}
                  />
                  <button
                    type="button"
                    aria-label={`Remover cor ${i + 1}`}
                    onClick={() => {
                      setColors((prev) => prev.filter((x) => x.key !== c.key));
                      setColorError(false);
                    }}
                    className="flex-none w-[34px] h-10 flex items-center justify-center text-ink-25 transition-colors hover:text-ink"
                  >
                    <IconMinus />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {shown.map((src, j) => (
                    <div key={src} className="relative w-[76px] h-[76px] rounded-ui overflow-hidden">
                      <Photo
                        src={src}
                        pending={pendingUrl}
                        sizes="76px"
                        label={`foto ${j + 1} da cor ${c.name || i + 1}`}
                        onRemove={() => removePhoto(c.key, src)}
                      />
                    </div>
                  ))}
                  {shown.length < MAX_PHOTOS ? (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => openPicker(c.key)}
                      className="w-[76px] h-[76px] border border-ink-10 rounded-ui flex items-center justify-center text-ink-50 transition-colors hover:text-ink hover:border-ink-25 disabled:opacity-40"
                    >
                      <IconPlus />
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-ink-25">
                  {shown.length === 0
                    ? "Sem fotos próprias. Usa as fotos do modelo."
                    : `${shown.length}/${MAX_PHOTOS} fotos. A primeira é a capa desta cor.`}
                </div>
              </div>
            );
          })}
        </div>

        {colorError ? (
          <div role="alert" className="mt-2 text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
            Dê um nome a cada cor, ou remova a que estiver em branco.
          </div>
        ) : null}

        {colors.length < MAX_COLORS ? (
          <button
            type="button"
            onClick={() => setColors((prev) => prev.concat(newColor()))}
            className="mt-3 h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25 hover:text-ink"
          >
            Adicionar cor
          </button>
        ) : null}

        {/* Colours are a list of lists, which flat form fields cannot carry, so
            the editor hands the action one JSON payload. */}
        <input
          type="hidden"
          name="colors"
          value={JSON.stringify(
            colors.map((c) => ({ name: c.name.trim(), photos: c.photos }))
          )}
        />
      </div>
      {product ? (
        <button
          type="button"
          onClick={() => {
            if (confirm("Remover este modelo do catálogo?")) deleteProduct(product.id);
          }}
          className="hidden md:block mt-6 text-xs text-ink-50 transition-colors hover:text-ink"
        >
          Remover do catálogo
        </button>
      ) : null}
      </div>

      <div className="md:min-w-0">
      <div className="mt-5 md:mt-0 flex flex-col gap-3 md:gap-4 max-w-[520px] md:max-w-none">
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Modelo</span>
          <input
            name="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(false);
            }}
            aria-invalid={nameError}
            placeholder="Adidas Samba OG"
            className={`h-10 px-4 border rounded-ui bg-paper text-sm text-ink outline-none transition-colors ${
              nameError ? "border-danger" : "border-ink-10 focus:border-ink-25"
            }`}
          />
        </label>
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
                      : "h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25 hover:text-ink"
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
          <span className="text-xs text-ink-50">Tags</span>
          {tags.length === 0 ? (
            <div className="text-xs text-ink-25">
              Nenhuma tag cadastrada ainda —{" "}
              <Link href="/admin/tags" className="underline">
                criar tags
              </Link>
              .
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tags.map((t) => {
                const on = tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setTagIds((prev) =>
                        prev.includes(t.id) ? prev.filter((x) => x !== t.id) : prev.concat(t.id)
                      )
                    }
                    className={
                      on
                        ? "h-10 min-w-[116px] px-3 rounded-ui bg-ink text-paper text-sm font-normal transition-transform active:scale-[.97]"
                        : "h-10 min-w-[116px] px-3 rounded-ui border border-ink-10 bg-paper text-ink-50 text-sm transition-colors hover:border-ink-25 hover:text-ink"
                    }
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          )}
          {tagIds.map((id) => (
            <input key={id} type="hidden" name="tags" value={id} />
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
          <span className="text-xs text-ink-50">Ficha técnica completa (Ler mais)</span>
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
            className="h-10 border-b border-ink-03 flex items-center justify-between text-sm text-ink-50 transition-colors hover:text-ink"
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
        {FLAGS.map((f) => (
          <input key={f.key} type="checkbox" name={f.key} checked={flags[f.key]} readOnly className="hidden" />
        ))}
      </div>

      <div className="mt-5 md:mt-4 text-xs text-ink-50">Numerações disponíveis</div>
      <div className="mt-3 max-w-[720px] md:max-w-none">
        <SizeToggleGrid
          active={sizes}
          onToggle={(n) => setSizes((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : prev.concat(n).sort((a, b) => a - b)))}
        />
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
          className="md:hidden mt-6 text-xs text-ink-50 transition-colors hover:text-ink"
        >
          Remover do catálogo
        </button>
      ) : null}
      <div className="mt-4 md:mt-14 text-xs text-ink-25">Selecionado SOFTY.</div>

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex gap-3 pointer-events-none">
        <button
          type="submit"
          className="pointer-events-auto flex-1 h-10 rounded-ui bg-[rgba(9,9,9,0.5)] backdrop-blur-[20px] text-paper text-sm font-normal transition-[background-color,transform] hover:bg-ink active:scale-[.98]"
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
