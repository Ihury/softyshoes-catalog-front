type Variant = "dark" | "mid" | "light";

const variants: Record<Variant, string> = {
  dark: "bg-[rgba(9,9,9,0.5)] text-paper",
  mid: "bg-[rgba(9,9,9,0.25)] text-paper",
  light: "bg-paper-50 text-ink",
};

export function Chip({
  children,
  variant = "dark",
  blur = 14,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  blur?: number;
  className?: string;
}) {
  return (
    <span
      className={`h-10 min-w-[116px] px-3 rounded-r inline-flex items-center justify-center text-xs ${variants[variant]} ${className}`}
      style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }}
    >
      {children}
    </span>
  );
}
