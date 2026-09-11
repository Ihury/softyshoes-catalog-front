export function num(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function brl(n: number): string {
  const parts = n.toFixed(2).split(".");
  return "R$ " + num(Number(parts[0])) + "," + parts[1];
}

/**
 * A stored price as the form field expects to read it — the inverse of
 * `parseMoney`, so opening a model and saving it again cannot change its price.
 * Plain `String(749.5)` would come back as "749.5", which `parseMoney` reads as
 * 74950 because a dot is a thousands separator in this notation.
 */
export function moneyInput(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function parseMoney(v: string): number | null {
  const clean = String(v)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}
