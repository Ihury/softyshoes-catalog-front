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

/** Cart glyph on the 16×16 grid the handoff specifies for every icon:
 *  stroke-width 1.5, currentColor, no fill. */
export function IconCart({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M1.6 2.2h1.9l1.7 7.6h6.9l1.4-5.3H4.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.4" cy="13" r="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.4" cy="13" r="1" stroke="currentColor" strokeWidth="1.5" />
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
