"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductImage } from "@/components/ui/ProductImage";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { SizeSelectGrid } from "@/components/ui/SizeGrid";
import { IconStar, IconChevronLeft } from "@/components/icons";
import Link from "next/link";
import { RelatedCarousel } from "@/components/client/RelatedCarousel";
import { ReviewSheet } from "@/components/client/ReviewSheet";
import { useCart } from "@/components/client/CartProvider";
import { useFavorites } from "@/components/client/FavoritesProvider";
import { useToast } from "@/components/ui/Toast";
import { registerReaction } from "@/lib/actions";
import { num, brl } from "@/lib/format";
import type { CatalogItem, Product } from "@/lib/types";

export function ProductDetail({ product, related }: { product: Product; related: CatalogItem[] }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { isFavorite, toggle } = useFavorites();
  const { flash } = useToast();

  const [thumb, setThumb] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<number | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reactionCount, setReactionCount] = useState(product.reaction_count);
  const [myRating, setMyRating] = useState(0);

  const fav = isFavorite(product.id);
  const photos = product.photos?.length ? product.photos : [null, null];
  const ratingKey = `softy:myRating:${product.id}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ratingKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage after mount, required to avoid an SSR/CSR mismatch
      if (raw) setMyRating(Number(raw));
    } catch {
      // ignore
    }
  }, [ratingKey]);

  function submitReview(rating: number) {
    setMyRating(rating);
    try {
      localStorage.setItem(ratingKey, String(rating));
    } catch {
      // storage unavailable — the rating still applies for this visit
    }
    setReactionCount((n) => n + 1);
    registerReaction(product.id);
    setReviewOpen(false);
    flash("Reação registrada.");
  }

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
      photo: product.photos?.[0] ?? null,
    });
    router.push("/carrinho");
  }

  return (
    <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12 md:pt-8 pb-[82px] md:pb-14">
      <Link
        href="/"
        className="hidden md:flex h-10 items-center gap-2 text-xs text-ink-50 transition-colors hover:text-ink w-fit"
      >
        <IconChevronLeft />
        <span>Voltar ao catálogo</span>
      </Link>

      <div className="md:mt-4 md:grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-14">
        <div>
          <div className="relative h-[339px] md:h-auto md:aspect-[4/5] rounded-ui overflow-hidden">
            <ProductImage
              src={photos[thumb] ?? product.photos?.[0]}
              alt={product.name}
              className="absolute inset-0"
              sizes="(min-width: 768px) 640px, 100vw"
              priority
            />
            <div className="absolute top-4 left-4 md:top-6 md:left-6 flex gap-2">
              <Chip variant="dark">{product.promotion ? "Promoção" : "Disponível"}</Chip>
              <Chip variant="mid">Uso diário</Chip>
            </div>
            <button
              type="button"
              aria-label="Favoritar"
              onClick={() => toggle(product.id)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-[34px] h-[34px] flex items-center justify-center transition-transform active:scale-[.85]"
            >
              <IconStar fillColor={fav ? "#090909" : "rgba(250,250,250,.5)"} outlineColor={fav ? undefined : "#FAFAFA"} />
            </button>
          </div>

          {/* The handoff drew two thumbnails for a three-photo model; a model
              can now carry up to fifteen, so the row wraps instead of cutting
              the rest off. */}
          <div className="mt-3 flex flex-wrap gap-3">
            {photos.map((src, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={thumb === i}
                onClick={() => setThumb(i)}
                className="relative w-[76px] h-[76px] md:w-24 md:h-24 rounded-ui overflow-hidden transition-transform active:scale-[.95]"
              >
                <ProductImage src={src} alt="" className="absolute inset-0" sizes="96px" />
                {thumb !== i ? <span className="absolute inset-0 bg-paper-50" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 md:mt-0">
          <h1 className="text-xl leading-[1.1] font-normal text-ink">{product.name}</h1>
          <div className="mt-2 md:mt-3 flex items-baseline gap-2 md:gap-3 text-sm">
            <span className="text-ink-50">{brl(product.price)} unidade</span>
            {product.old_price ? <span className="text-ink-25 line-through">{brl(product.old_price)}</span> : null}
          </div>

          <button
            type="button"
            onClick={() => setReviewOpen(true)}
            className="mt-3 md:mt-4 flex items-center gap-2 transition-opacity hover:opacity-60"
          >
            <IconStar />
            <span className="text-xs text-ink font-normal">{num(reactionCount)}</span>
            <span className="text-xs text-ink-50 underline underline-offset-2">reações</span>
          </button>
          {myRating > 0 ? (
            <div className="mt-2 text-xs text-ink-50" style={{ animation: "sfPop .22s ease both" }}>
              Sua reação: {myRating} de 5.
            </div>
          ) : null}

          <div className="mt-4 md:hidden flex items-center gap-3">
            <Stepper value={qty} onChange={setQty} />
          </div>

          <p className="mt-5 md:mt-6 max-w-[300px] md:max-w-[420px] text-xs leading-[1.65] text-ink-50" style={{ textWrap: "pretty" }}>
            {product.description}{" "}
            <button type="button" onClick={() => setExpanded((e) => !e)} className="text-xs text-ink font-normal">
              {expanded ? "Ler menos." : "Ler mais."}
            </button>
          </p>
          {expanded && product.spec ? (
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
              availableSizes={product.sizes}
              selected={size}
              onSelect={(n) => {
                setSize(n);
                setSizeError(false);
              }}
            />
          </div>
          {sizeError ? (
            <div className="mt-3 text-xs text-ink" style={{ animation: "sfPop .2s ease both" }}>
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

      <ReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        productName={product.name}
        myRating={myRating}
        onSubmit={submitReview}
      />
    </div>
  );
}
