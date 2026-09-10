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
  return (
    <div className={`relative overflow-hidden rounded-r bg-ink-10 ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes ?? "50vw"} className="object-cover" />
      ) : null}
    </div>
  );
}
