"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconPlus } from "@/components/icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { SizeToggleGrid } from "@/components/ui/SizeGrid";
import { useToast } from "@/components/ui/Toast";
import { saveProduct, deleteProduct } from "@/lib/actions";
import { uploadPhoto } from "@/lib/upload";
import type { Brand, Product } from "@/lib/types";

const FLAGS: { key: keyof Pick<Product, "promotion" | "available" | "featured" | "ordered">; label: string }[] = [
  { key: "promotion", label: "Promoção" },
  { key: "available", label: "Disponível" },
  { key: "featured", label: "Destaque na home" },
  { key: "ordered", label: "Aparece em Pedidos" },
];

/**
 * One photo slot. A freshly picked file is still a local `blob:` URL, which the
 * Next image optimizer cannot fetch, so it renders through a plain <img> and
 * carries the handoff's 1px progress bar until the upload lands.
 */
function PhotoSlot({
  src,
  pending,
  sizes,
}: {
  src?: string;
  pending: string | null;
  sizes: string;
}) {
  const isPending = !!src && src === pending;
  if (isPending) {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-ui bg-ink-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not an optimizable asset */}
        <img src={src} alt="" className="w-full h-full object-cover opacity-65" />
        <div className="absolute left-0 right-0 bottom-0 h-px overflow-hidden bg-ink-03">
          <div
            className="w-[30%] h-full bg-ink-25"
            style={{ animation: "sfBar 1.1s cubic-bezier(.5,0,.5,1) infinite" }}
          />
        </div>
      </div>
    );
  }
  return <ProductImage src={src} alt="" className="absolute inset-0" sizes={sizes} />;
}

export function ProductForm({ product, brands }: { product: Product | null; brands: Brand[] }) {
  const { flash } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
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
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Paint the chosen photo immediately from the local file — the admin sees
    // it in the slot right away instead of staring at an empty tile until the
    // network answers.
    const preview = URL.createObjectURL(file);
    setPending(preview);

    const { url, error } = await uploadPhoto(file);

    URL.revokeObjectURL(preview);
    setPending(null);
    if (error || !url) {
      flash(error ?? "Não foi possível enviar a foto.");
      return;
    }
    setPhotos((prev) => prev.concat(url).slice(0, 3));
  }

  // The optimistic preview occupies the next free slot while it uploads.
  const shownPhotos = pending ? photos.concat(pending).slice(0, 3) : photos;

  return (
    <form
      action={(fd) => {
        const name = String(fd.get("name") ?? "").trim();
        const price = String(fd.get("price") ?? "");
        if (!name) {
          setNameError(true);
          return;
        }
        if (!price) {
          setPriceError(true);
          return;
        }
        saveAction(fd);
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
      <div className="hidden md:block text-xs text-ink-50 mb-3">Fotos</div>
      <div className="relative h-[223px] md:h-auto md:aspect-[4/3] rounded-ui overflow-hidden">
        <PhotoSlot src={shownPhotos[0]} pending={pending} sizes="(min-width: 768px) 560px, 100vw" />
      </div>
      <div className="mt-3 flex gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="relative w-[76px] h-[76px] rounded-ui overflow-hidden">
            <PhotoSlot src={shownPhotos[i]} pending={pending} sizes="76px" />
          </div>
        ))}
        {shownPhotos.length < 3 ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="w-[76px] h-[76px] border border-ink-10 rounded-ui flex items-center justify-center text-ink-50 transition-colors hover:text-ink hover:border-ink-25 disabled:opacity-40"
          >
            <IconPlus />
          </button>
        ) : null}
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFilePicked} />
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
            defaultValue={product?.name}
            onChange={() => setNameError(false)}
            placeholder="Adidas Samba OG"
            className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
          />
        </label>
        {nameError ? <div className="text-xs text-ink">Informe o nome do modelo.</div> : null}

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
              defaultValue={product?.price}
              onChange={() => setPriceError(false)}
              placeholder="749,00"
              inputMode="decimal"
              className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
            />
          </label>
          <label className="flex-1 min-w-0 flex flex-col gap-2">
            <span className="text-xs text-ink-50">Preço anterior</span>
            <input
              name="old_price"
              defaultValue={product?.old_price ?? ""}
              placeholder="949,00"
              inputMode="decimal"
              className="h-10 px-4 border border-ink-10 rounded-ui bg-paper text-sm text-ink outline-none transition-colors focus:border-ink-25"
            />
          </label>
        </div>
        {priceError ? <div className="text-xs text-ink">Informe um preço válido.</div> : null}

        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Descrição técnica</span>
          <textarea
            name="description"
            defaultValue={product?.description}
            rows={4}
            placeholder="Cabedal em couro. Solado de borracha vulcanizada."
            className="px-4 py-3 border border-ink-10 rounded-ui bg-paper text-xs leading-[1.65] text-ink outline-none resize-none transition-colors focus:border-ink-25"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-50">Ficha técnica completa (Ler mais)</span>
          <textarea
            name="spec"
            defaultValue={product?.spec}
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
