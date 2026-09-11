import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { ProductImage } from "@/components/ui/ProductImage";
import { brl } from "@/lib/format";
import type { CatalogItem } from "@/lib/types";

export function ProductCard({
  product,
  delayStep = 0,
  className = "",
  imageClassName = "aspect-[161/220]",
}: {
  product: CatalogItem;
  delayStep?: number;
  className?: string;
  imageClassName?: string;
}) {
  const delay = (0.05 * Math.min(delayStep, 7)).toFixed(2) + "s";
  return (
    <div style={{ animation: "sfUp .6s cubic-bezier(.22,1,.36,1) both", animationDelay: delay }} className={className}>
      {/* The detail route is dynamic, so the default "auto" prefetch would only
          fetch up to a loading boundary — of which there is none — and the tap
          would then wait on the round-trip. Prefetching in full means the page
          is already in the router cache by the time it is tapped. Next only
          does this for links in the viewport, so it stays bounded. */}
      <Link
        href={`/produto/${product.id}`}
        prefetch
        className="w-full flex flex-col gap-3 text-left transition-transform duration-200 active:scale-[.98]"
      >
        <div className="relative w-full">
          <ProductImage
            src={product.photos?.[0]}
            alt={product.name}
            className={`relative w-full ${imageClassName}`}
            sizes="(min-width: 768px) 288px, 45vw"
          />
          <span className="absolute top-3 left-3">
            {product.promotion ? (
              <Chip variant="dark" blur={12}>
                Promoção
              </Chip>
            ) : (
              <Chip variant="light" blur={12}>
                Disponível
              </Chip>
            )}
          </span>
        </div>
        <div className="w-full flex flex-col gap-1">
          <div className="text-xs md:text-sm font-normal text-ink whitespace-nowrap overflow-hidden text-ellipsis">
            {product.name}
          </div>
          <div className="text-xs text-ink-50 whitespace-nowrap">{brl(product.price)} un.</div>
          {product.old_price ? (
            <div className="text-xs text-ink-25 line-through whitespace-nowrap">{brl(product.old_price)}</div>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
