/** F1 check: for every area file, every non-null weekly and monthly value must match exactly one colour class.
 *  Run: npm run check:pieces   (prints the number of unmatched values; must be 0) */
import { readdirSync, readFileSync } from "node:fs";
import { buildPieces, matchCount } from "../src/pieces";

const dir = "public/data/areas";
const keys: [string, string][] = [["h", "week"], ["m", "week (raw MODIS)"], ["v", "week (raw VIIRS)"], ["h_peat", "week (peat)"], ["h_min", "week (mineral)"], ["mh", "month"]];
let files = 0, values = 0, bad = 0;
const badFiles: string[] = [];
for (const f of readdirSync(dir)) {
  const a = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  files++;
  for (const [k, label] of keys) {
    const s: (number | null)[] | undefined = a[k];
    if (!s) continue;
    const hide = k === "mh" && a.mpartial && a.mpartial.days < 7 ? a.mpartial.index : -1;
    const vals = s.map((v, i) => (v == null || i === hide ? null : v)).filter((v): v is number => v != null);
    const pieces = buildPieces(vals);
    let unmatched = 0;
    for (const v of vals) { values++; if (matchCount(v, pieces) !== 1) { unmatched++; bad++; } }
    if (unmatched) badFiles.push(`${f} ${label}: ${unmatched}`);
  }
}
console.log(`files: ${files}, values checked: ${values}`);
console.log(`unmatched values: ${bad}`);
if (bad) { console.log(badFiles.slice(0, 20).join("\n")); process.exit(1); }
