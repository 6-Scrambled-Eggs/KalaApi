import { dateLocale, nf } from "./data";

/** Short legend numbers: 950, 1k, 5.7k (EN) / 1rb, 5,7rb (ID). Floors to the nearest 100 above 1000. */
export function shortNum(n: number): string {
  if (n < 1000) return nf(n);
  const k = Math.floor(n / 100) / 10;
  return `${nf(k, Number.isInteger(k) ? 0 : 1)}${dateLocale.v === "id-ID" ? "rb" : "k"}`;
}
