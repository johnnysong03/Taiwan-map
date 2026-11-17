#!/usr/bin/env python3
"""產生地熱地圖「找地點」用的搜尋索引 geotex/search-index.js（開頁不載入，第一次搜尋時才載入）。

用法（repo 根目錄，需要 shapely）：
    python3 tools/build_search_index.py villages-10t.json
    （villages-10t.json 下載自 https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/villages-10t.json ，
      由內政部「村里界圖(TWD97經緯度)」data.gov.tw/dataset/7438 轉成 TopoJSON，2021-09 版；之後有調整的村里會不準）

內容：
  - 鄉鎮市區、村里：名稱＋代表點（polylabel，一定落在區內），點了會飛到那裡
  - 台電饋線代號：所屬變壓器的中位數位置（讀 geotex/feeders/*_tr.js，要先跑 tools/build_feeders.py）
現有地熱案場、井、鑽孔已經在網頁裡，直接搜尋，不放進索引。
"""
import base64, glob, json, os, re, statistics, struct, sys
from shapely.geometry import Polygon, MultiPolygon
from shapely.ops import polylabel

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "geotex", "search-index.js")


def decode(topo, obj):
    """最小的 TopoJSON 解碼：只處理 Polygon／MultiPolygon。"""
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for a in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in a:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(ids):
        pts = []
        for i in ids:
            a = arcs[i] if i >= 0 else arcs[~i][::-1]
            pts += a if not pts else a[1:]
        return pts

    for g in topo["objects"][obj]["geometries"]:
        if g["type"] == "Polygon":
            geom = Polygon(ring(g["arcs"][0]), [ring(r) for r in g["arcs"][1:]])
        elif g["type"] == "MultiPolygon":
            geom = MultiPolygon([Polygon(ring(p[0]), [ring(r) for r in p[1:]]) for p in g["arcs"]])
        else:
            continue
        yield g.get("properties", {}), geom


def rep(geom):
    g = geom if geom.geom_type == "Polygon" else max(geom.geoms, key=lambda p: p.area)
    if not g.is_valid:
        g = g.buffer(0)
        if g.geom_type != "Polygon":
            g = max(g.geoms, key=lambda p: p.area)
    p = polylabel(g, 0.0005)
    return [round(p.x, 5), round(p.y, 5)]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    topo = json.load(open(sys.argv[1], encoding="utf-8"))
    towns, vills = [], []
    for p, g in decode(topo, "towns"):
        towns.append([p.get("COUNTYNAME", ""), p.get("TOWNNAME", "")] + rep(g))
    for p, g in decode(topo, "villages"):
        if not p.get("VILLNAME"):
            continue
        vills.append([p.get("COUNTYNAME", ""), p.get("TOWNNAME", ""), p["VILLNAME"]] + rep(g))
    feeders = []
    for f in sorted(glob.glob(os.path.join(ROOT, "geotex", "feeders", "*_tr.js"))):
        k = os.path.basename(f)[:-6]
        s = open(f, encoding="utf-8").read()
        names = json.loads(re.search(r"feeders:(\[.*?\])", s).group(1))
        b = base64.b64decode(re.search(r'b64:"([^"]+)"', s).group(1))
        xs = [[] for _ in names]
        ys = [[] for _ in names]
        for i in range(0, len(b), 10):
            x, y, fi = struct.unpack("<IIH", b[i:i + 10])
            xs[fi].append(x / 1e6 + 119)
            ys[fi].append(y / 1e6 + 21)
        for n, a, c in zip(names, xs, ys):
            if a:
                feeders.append([n, k, round(statistics.median(a), 5), round(statistics.median(c), 5)])
    data = {"towns": towns, "villages": vills, "feeders": feeders,
            "src": {"admin": "內政部「鄉鎮市區界線」「村里界圖」(data.gov.tw 7441、7438)，taiwan-atlas 2021.9.20 版",
                    "feeders": "台電「全國各縣市再生能源可併網容量」(data.gov.tw 161874)，變壓器位置中位數"}}
    open(OUT, "w", encoding="utf-8", newline="\n").write(
        "// 找地點搜尋索引：由 tools/build_search_index.py 產生\nwindow.SEARCH_INDEX=" +
        json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"鄉鎮 {len(towns)}、村里 {len(vills)}、饋線 {len(feeders)}；{os.path.getsize(OUT) / 1e3:.0f} KB")


if __name__ == "__main__":
    main()
