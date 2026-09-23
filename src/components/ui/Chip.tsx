import type { EtiquetaStyle } from "@/lib/types";

type Variant = "dark" | "mid" | "light" | "ink" | "paper";

const variants: Record<Variant, string> = {
  dark: "bg-[rgba(9,9,9,0.5)] text-paper",
  mid: "bg-[rgba(9,9,9,0.25)] text-paper",
  light: "bg-paper-50 text-ink",
  ink: "bg-ink text-paper",
  paper: "bg-paper text-ink",
};

/** How each etiqueta finish is drawn. The two glass finishes sit on the photo
 *  and need the blur; the two solid ones are opaque, so a backdrop filter there
 *  would only cost a compositing layer for nothing. */
const FINISHES: Record<EtiquetaStyle, { variant: Variant; blur: number }> = {
  escuro: { variant: "dark", blur: 12 },
  claro: { variant: "light", blur: 12 },
  preto: { variant: "ink", blur: 0 },
  branco: { variant: "paper", blur: 0 },
};

/**
 * The same four finishes, as classes a caller can put on its own element.
 *
 * The highlight's name-and-price tarja is not a chip — it is a wider box with
 * two lines and a chevron — but the seller picks its colour from the same list,
 * so it has to resolve to the same surface. Returning the classes keeps one
 * definition of what "escuro" looks like instead of a second copy that drifts.
 */
export function finishOf(style: EtiquetaStyle) {
  const finish = FINISHES[style] ?? FINISHES.escuro;
  return {
    className: variants[finish.variant],
    style:
      finish.blur > 0
        ? {
            backdropFilter: `blur(${finish.blur}px)`,
            WebkitBackdropFilter: `blur(${finish.blur}px)`,
          }
        : undefined,
  };
}

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
      className={`h-10 min-w-[116px] px-3 rounded-ui inline-flex items-center justify-center text-xs ${variants[variant]} ${className}`}
      style={
        blur > 0
          ? { backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/** A chip drawn from an etiqueta's own finish. */
export function EtiquetaChip({
  name,
  style,
  className = "",
}: {
  name: string;
  style: EtiquetaStyle;
  className?: string;
}) {
  const finish = FINISHES[style] ?? FINISHES.escuro;
  return (
    <Chip variant={finish.variant} blur={finish.blur} className={className}>
      {name}
    </Chip>
  );
}
