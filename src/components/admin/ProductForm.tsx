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
import type { Brand, Product } from "@/lib/types";

/** Upper bound on photos per model. Generous on purpose — it exists to stop a
 *  runaway paste, not to ration what a model can show. */
const MAX_PHOTOS = 15;

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

export function ProductForm({ product, brands }: { product: Product | null; brands: Brand[] }) {
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
