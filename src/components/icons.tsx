type IconProps = { className?: string; size?: number };

export function IconChevronRight({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M5.6 2.6 11 8l-5.4 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronLeft({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M10.4 2.6 5 8l5.4 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronDown({ className, size = 16, stroke = "currentColor" }: IconProps & { stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M2.6 5.6 8 11l5.4-5.4" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3 8.4 6.2 11.6 13 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STAR_PATH =
  "M8 .8l2.14 4.53 4.77.65-3.5 3.38.89 4.76L8 11.86 3.7 14.12l.89-4.76-3.5-3.38 4.77-.65z";

export function IconStar({
  className,
  size = 16,
  fillColor = "#090909",
  outlineColor,
}: IconProps & { fillColor?: string; outlineColor?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d={STAR_PATH}
        fill={fillColor}
        stroke={outlineColor}
        strokeWidth={outlineColor ? 0.9 : 0}
      />
    </svg>
  );
}

export function IconMinus({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <rect x="2" y="7.25" width="12" height="1.5" rx=".75" fill="currentColor" />
    </svg>
  );
}

export function IconPlus({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <rect x="2" y="7.25" width="12" height="1.5" rx=".75" fill="currentColor" />
      <rect x="7.25" y="2" width="1.5" height="12" rx=".75" fill="currentColor" />
    </svg>
  );
}

/** Cart glyph — a shopping bag, as the handoff now draws it. Alone among the
 *  icons it is authored on a 20×21 grid rather than 16×16, which is the
 *  reference's own viewBox; it still paints at 16px like the rest. */
export function IconCart({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 21" fill="none" aria-hidden="true" className={className}>
      <path
        d="M3 6.6h14l-1 12.3a1.6 1.6 0 0 1-1.6 1.5H5.6A1.6 1.6 0 0 1 4 18.9L3 6.6z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 8V5a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Drag handle: two columns of three dots on the 16×16 grid. Filled rather
 *  than stroked — a 1.5 stroke around a 2px dot is just a blob — but sized so
 *  it carries the same visual weight as the stroked icons beside it. */
export function IconGrip({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="6" cy="3.5" r="1.25" />
      <circle cx="10" cy="3.5" r="1.25" />
      <circle cx="6" cy="8" r="1.25" />
      <circle cx="10" cy="8" r="1.25" />
      <circle cx="6" cy="12.5" r="1.25" />
      <circle cx="10" cy="12.5" r="1.25" />
    </svg>
  );
}

/** Close / remove, on the same 16×16 grid as the rest. */
export function IconClose({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path d="M3.6 3.6l8.8 8.8M12.4 3.6l-8.8 8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** Three rules — the admin's "Ajustes" button on a phone. */
export function IconMenu({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
