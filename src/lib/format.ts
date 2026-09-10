export function num(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function brl(n: number): string {
  const parts = n.toFixed(2).split(".");
  return "R$ " + num(Number(parts[0])) + "," + parts[1];
}

export function parseMoney(v: string): number | null {
  const clean = String(v)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = parseFloat(clean);
  return isNaN(n) ? null : n;
}
