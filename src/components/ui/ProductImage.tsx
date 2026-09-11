import Image from "next/image";

export function ProductImage({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  /** Always pass the real rendered width: without it next/image falls back to
   *  half the viewport and downloads far more pixels than the slot shows. */
  sizes?: string;
  /** Set on the one image above the fold — the catalog hero — so it is not
   *  lazy-loaded and stops holding back LCP. */
  priority?: boolean;
}) {
  // No positioning class here on purpose: callers place the frame themselves
  // (some as `absolute inset-0` fillers), and a base `relative` would win the
  // cascade over their `absolute`, collapsing the frame to zero height.
  return (
    <div className={`overflow-hidden rounded-ui bg-ink-10 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "50vw"}
          priority={priority}
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
