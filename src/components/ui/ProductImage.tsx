import Image from "next/image";

export function ProductImage({
  src,
  alt,
  className = "",
  sizes,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  // No positioning class here on purpose: callers place the frame themselves
  // (some as `absolute inset-0` fillers), and a base `relative` would win the
  // cascade over their `absolute`, collapsing the frame to zero height.
  return (
    <div className={`overflow-hidden rounded-ui bg-ink-10 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes ?? "50vw"} className="object-cover" />
      ) : null}
    </div>
  );
}
