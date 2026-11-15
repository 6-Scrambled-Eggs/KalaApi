"""Small locator file for the area page: simplified province outlines as SVG paths, plus neighbours.

Reads public/data/provinces.geojson (1.1 MB) and writes public/data/locator.json (a few tens of kB),
so the area page can draw its "index to adjoining sheets" inset without loading the full boundaries.

Projection: Web Mercator over the Indonesia frame [94, -11.5] to [141.5, 6.5], scaled to a 1000-wide viewBox.
Neighbours: two provinces are adjoining when any of their boundary vertices lie within NEAR degrees.
Pure Python, no extra packages. Run: python pipeline/13_locator.py
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "data" / "provinces.geojson"
OUT = ROOT / "public" / "data" / "locator.json"
W0, S0, E0, N0 = 94.0, -11.5, 141.5, 6.5
WIDTH = 1000.0
TOL = 0.06   # Douglas-Peucker tolerance, degrees
MIN_RING = 0.02  # drop islands smaller than this bbox side, degrees
NEAR = 0.03  # neighbour vertex distance, degrees


def merc_y(lat):
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


YN, YS = merc_y(N0), merc_y(S0)
SCALE = WIDTH / (E0 - W0)
HEIGHT = (YN - YS) * (180 / math.pi) * SCALE


def proj(lon, lat):
    return ((lon - W0) * SCALE, (YN - merc_y(lat)) * (180 / math.pi) * SCALE)


def dp(pts, tol):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-12
    best, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        x, y = pts[i]
        d = abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm if (dx or dy) else math.hypot(x - x1, y - y1)
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return dp(pts[: idx + 1], tol)[:-1] + dp(pts[idx:], tol)


def rings(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        yield poly[0]  # outer ring only


def main():
    fc = json.loads(SRC.read_text(encoding="utf-8"))
    out, verts = {}, {}
    for f in fc["features"]:
        pid, geom = f["properties"]["id"], f["geometry"]
        parts, allv = [], []
        lons, lats = [], []
        for ring in rings(geom):
            xs = [p[0] for p in ring]
            ys = [p[1] for p in ring]
            allv.extend(ring)
            if max(xs) - min(xs) < MIN_RING and max(ys) - min(ys) < MIN_RING:
                continue
            simple = dp([tuple(p[:2]) for p in ring], TOL)
            if len(simple) < 4:
                continue
            lons += xs
            lats += ys
            parts.append("M" + "L".join("%.1f,%.1f" % proj(*p) for p in simple) + "Z")
        verts[pid] = allv
        out[pid] = {
            "name": f["properties"]["name"],
            "d": "".join(parts),
            "bbox": [round(min(lons), 2), round(min(lats), 2), round(max(lons), 2), round(max(lats), 2)],
        }

    # neighbours via a coarse grid hash of boundary vertices
    cell = NEAR
    grid = {}
    for pid, vs in verts.items():
        for lon, lat, *_ in vs:
            grid.setdefault((int(lon // cell), int(lat // cell)), set()).add(pid)
    adj = {pid: set() for pid in verts}
    for pid, vs in verts.items():
        for lon, lat, *_ in vs:
            gx, gy = int(lon // cell), int(lat // cell)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    for other in grid.get((gx + dx, gy + dy), ()):
                        if other != pid:
                            adj[pid].add(other)
    for pid in out:
        out[pid]["near"] = sorted(adj[pid])

    OUT.write_text(json.dumps({"width": WIDTH, "height": round(HEIGHT, 1), "frame": [W0, S0, E0, N0], "provinces": out}, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} kB, {len(out)} provinces)")
    for pid in ("kalimantan-tengah", "riau", "papua-selatan"):
        if pid in out:
            print(pid, out[pid]["near"])


if __name__ == "__main__":
    main()
