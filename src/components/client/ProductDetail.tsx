"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ui/ProductImage";
import { EtiquetaChip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { SizeSelectGrid } from "@/components/ui/SizeGrid";
import { IconChevronLeft } from "@/components/icons";
import Link from "next/link";
import { RelatedCarousel } from "@/components/client/RelatedCarousel";
import { useCart } from "@/components/client/CartProvider";
import { allEtiquetas } from "@/lib/etiquetas";
import { brl } from "@/lib/format";
import { sizeGridFor, type CatalogItem, type Product } from "@/lib/types";

export function ProductDetail({
  product,
  related,
  catalogSizes,
}: {
  product: Product;
  related: CatalogItem[];
  catalogSizes: number[];
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const [thumb, setThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const gallery = product.photos ?? [];
  const photos: (string | null)[] = gallery.length ? gallery : [null, null];

  // The product page shows every etiqueta the model carries; the card shows
  // only the first. A model with none falls back to a single default chip.
  const chips = allEtiquetas(product.etiquetas, product.promotion);

  // The seller's list plus anything this model carries outside it, so a boot in
  // 46 still renders even though nobody else stocks one.
  const grid = sizeGridFor(catalogSizes, product.sizes);

  // "Ler mais." used to show even with nothing behind it, and opened an empty
  // gap. The seller now controls it by leaving the field blank.
  const hasSpec = !!product.spec?.trim();

  function onAddToCart() {
    if (!size) {
      setSizeError(true);
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      size,
      unit: product.price,
      qty,
      // The photo on screen when they tapped, not the model's cover. It is how
      // someone says which colourway they want: the seller opens the order and
      // sees the exact shot that was being looked at.
      photo: gallery[thumb] ?? gallery[0] ?? null,
    });
    router.push("/carrinho");
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-[clamp(16px,5vw,24px)] md:px-[clamp(20px,4vw,48px)] md:pt-8 pb-[82px] md:pb-14">
      <Link
        href="/"
        className="hidden md:flex h-10 items-center gap-2 text-xs text-ink-50 transition-opacity hover:opacity-60 w-fit"
      >
        <IconChevronLeft />
        <span>Voltar ao catálogo</span>
      </Link>

      {/* auto-fit rather than two fixed columns: below about 700px the two
          tracks stop fitting side by side and the pair stacks on its own,
          instead of squeezing the photo down to a stamp. */}
      <div className="md:mt-4 md:grid md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] md:gap-14">
        <div>
          {/* Portrait at every width, and a capped box rather than full bleed:
              the photo used to run edge to edge and dominate the page. */}
          <div className="relative w-[min(100%,248px)] md:w-[min(100%,360px)] aspect-[4/5] mx-auto rounded-ui overflow-hidden">
            <ProductImage
              src={photos[thumb] ?? gallery[0]}
              alt={product.name}
              className="absolute inset-0"
              sizes="(min-width: 768px) 360px, 248px"
              priority
            />
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <EtiquetaChip key={c.name} name={c.name} style={c.style} />
              ))}
            </div>
          </div>

          {/* The handoff drew two thumbnails for a three-photo model; a model
              can now carry up to fifteen, so the row wraps instead of cutting
              the rest off. */}
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {photos.map((src, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={thumb === i}
                onClick={() => setThumb(i)}
                className="relative w-[60px] h-[60px] md:w-[72px] md:h-[72px] rounded-ui overflow-hidden transition-transform active:scale-[.95]"
              >
                <ProductImage src={src} alt="" className="absolute inset-0" sizes="72px" />
                {thumb !== i ? <span className="absolute inset-0 bg-paper-50" /> : null}
              </button>
            ))}
          </div>
          {gallery.length > 1 ? (
            <div className="mt-2 text-center text-xs text-ink-25">
              A foto escolhida vai junto no pedido.
            </div>
          ) : null}
        </div>

        <div className="mt-5 md:mt-0">
          <h1 className="text-xl leading-[1.1] font-normal text-ink">{product.name}</h1>
          <div className="mt-2 md:mt-3 flex items-baseline gap-2 md:gap-3 text-sm">
            <span className="text-ink-50">{brl(product.price)} unidade</span>
            {product.old_price ? <span className="text-ink-25 line-through">{brl(product.old_price)}</span> : null}
          </div>

          <div className="mt-4 md:hidden flex items-center gap-3">
            <Stepper value={qty} onChange={setQty} />
          </div>

          <p className="mt-5 md:mt-6 max-w-[300px] md:max-w-[420px] text-xs leading-[1.65] text-ink-50" style={{ textWrap: "pretty" }}>
            {product.description}{" "}
            {hasSpec ? (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="text-xs text-ink font-normal transition-opacity hover:opacity-60"
              >
                {expanded ? "Ler menos." : "Ler mais."}
              </button>
            ) : null}
          </p>
          {expanded && hasSpec ? (
            <p
              className="mt-2 max-w-[300px] md:max-w-[420px] text-xs leading-[1.65] text-ink-50"
              style={{ animation: "sfPop .24s ease both", textWrap: "pretty" }}
            >
              {product.spec}
            </p>
          ) : null}
          <div className="mt-3 md:hidden text-xs text-ink-25">Selecionado SOFTY.</div>

          <div className="mt-6 md:mt-8">
            <div className="hidden md:block text-xs text-ink-50 mb-3">Numeração</div>
            <SizeSelectGrid
              sizes={grid}
              availableSizes={product.sizes}
              selected={size}
              onSelect={(n) => {
                setSize(n);
                setSizeError(false);
              }}
            />
          </div>
          {sizeError ? (
            <div role="alert" className="mt-3 text-xs text-danger" style={{ animation: "sfPop .2s ease both" }}>
              Selecione uma numeração para continuar.
            </div>
          ) : null}

          <div className="hidden md:flex mt-8 items-center gap-6">
            <Stepper value={qty} onChange={setQty} />
            <Button variant="solid" onClick={onAddToCart}>
              Adicionar ao carrinho
            </Button>
          </div>
          <div className="hidden md:block mt-6 text-xs text-ink-25">Selecionado SOFTY.</div>
        </div>
      </div>

      <div className="mt-8 md:mt-14">
        <RelatedCarousel products={related} />
      </div>

      <div className="md:hidden fixed left-0 right-0 bottom-0 px-6 py-4 flex justify-center pointer-events-none">
        <Button variant="glass" onClick={onAddToCart} className="pointer-events-auto">
          Adicionar ao carrinho
        </Button>
      </div>
    </div>
  );
}
