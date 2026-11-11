#!/usr/bin/env python3
"""把台電「全國各縣市再生能源可併網容量」開放資料（data.gov.tw 161874）轉成臺灣地熱地圖的「台電饋線」圖層。

用法（repo 根目錄，需要 shapely、pyproj）：
    python3 tools/build_feeders.py 001.zip
    （001.zip 下載自 https://service.taipower.com.tw/data/opendata/apply/file/d077009/001.zip）

資料內容：每縣市一份「饋線可併網容量（千瓦）」與「變壓器 TWD67 座標＋所屬饋線」，沒有饋線線路走向。
這裡的做法：
  - 座標：TWD67 先加平移 X+830.61、Y−203.71 m 成 TWD97（與 tools/import_geo2010.py 相同，和七參數轉換差 2–3 m），
    再轉 WGS84。台電說明其圖資本來就有偏移，只當約略位置。
  - 饋線服務範圍：每條饋線把所屬變壓器外擴約 120 m、相距 600 m 內連成一片（先擴 300 m 再縮 180 m），簡化 50 m（座標存到小數 4 位，約 11 m），當作「這條饋線大概服務哪裡」，不是線路。
  - 推估線路：每條饋線的變壓器用「最小生成樹」連起來（Delaunay 三角網的邊＋Kruskal），讓總長度最短；
    超過 MAXEDGE 的連線不畫（避免跨山跨海的長直線）。這只是示意的連接方式，不是台電實際的線路走向。
  - 變壓器點：放大時才載入。
輸出到 geotex/feeders/：meta.js（開頁載入）、<縣市>_area.js（服務範圍）、<縣市>_line.js（推估線路）、<縣市>_tr.js（變壓器點，base64）。
線路檔格式：{feeders:[饋線…], C:[可併網容量 kW 或 null…], N:[變壓器數…], L:[[饋線序號, [x0,y0,dx1,dy1,…]], …]}，座標為 (經度−119, 緯度−21)×1e5 的整數，第一點絕對值、其後為差值。
"""
import base64, collections, csv, io, json, os, struct, sys, warnings, zipfile, datetime
warnings.filterwarnings("ignore")
from pyproj import Transformer
from shapely import delaunay_triangles
from shapely.geometry import LineString, MultiLineString, MultiPoint, mapping
from shapely.ops import linemerge, transform

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "geotex", "feeders")
SHIFT = (830.61, -203.71)
BUF, SIMP = 120, 50
MAXEDGE = 2000  # 推估線路：最小生成樹裡超過這個長度（m）的連線不畫
NAMES = {"KEELUNG": "基隆市", "TAIPEI": "臺北市", "NEWTAIPEI": "新北市", "TAOYUAN": "桃園市", "HSINCHU": "新竹縣市", "MIAOLI": "苗栗縣",
         "TAICHUNG": "臺中市", "CHANGHUA": "彰化縣", "NANTOU": "南投縣", "YUNLIN": "雲林縣", "CHIAYI": "嘉義縣市", "TAINAN": "臺南市",
         "KAOHSIUNG": "高雄市", "PINGTUNG": "屏東縣", "YILAN": "宜蘭縣", "HUALIEN": "花蓮縣", "TAITUNG": "臺東縣"}
to84 = Transformer.from_crs(3826, 4326, always_xy=True).transform


def mst_lines(xy):
    """xy：[(x, y)] TWD97 公尺。回傳最小生成樹的線段合併後的 [[(x, y), …], …]。"""
    pts = sorted(set(xy))
    if len(pts) < 2:
        return []
    idx = {p: i for i, p in enumerate(pts)}
    if len(pts) == 2:
        edges = [(0, 1)]
    else:
        tri = delaunay_triangles(MultiPoint(pts), only_edges=True)
        edges = []
        for g in getattr(tri, "geoms", [tri]):
            a, b = g.coords[0], g.coords[-1]
            if a in idx and b in idx:
                edges.append((idx[a], idx[b]))
        if not edges:  # 全部共線時 Delaunay 可能失敗：依序連
            edges = [(i, i + 1) for i in range(len(pts) - 1)]
    d = lambda e: ((pts[e[0]][0] - pts[e[1]][0]) ** 2 + (pts[e[0]][1] - pts[e[1]][1]) ** 2) ** .5
    par = list(range(len(pts)))

    def find(i):
        while par[i] != i:
            par[i] = par[par[i]]
            i = par[i]
        return i
    keep = []
    for e in sorted(edges, key=d):
        a, b = find(e[0]), find(e[1])
        if a != b:
            par[a] = b
            if d(e) <= MAXEDGE:
                keep.append(LineString([pts[e[0]], pts[e[1]]]))
    if not keep:
        return []
    m = linemerge(MultiLineString(keep))
    return [list(g.coords) for g in getattr(m, "geoms", [m])]


def enc_line(coords):
    out, px, py = [], 0, 0
    for i, (x, y) in enumerate(coords):
        lo, la = to84(x, y)
        ix, iy = round((lo - 119) * 1e5), round((la - 21) * 1e5)
        if i and ix == px and iy == py:
            continue
        out += [ix, iy] if i == 0 else [ix - px, iy - py]
        px, py = ix, iy
    return out if len(out) >= 4 else None


def rnd(o):
    if isinstance(o, float):
        return round(o, 4)  # 約 11 m，服務範圍本來就是約略的
    if isinstance(o, (list, tuple)):
        return [rnd(x) for x in o]
    return o


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    z = zipfile.ZipFile(sys.argv[1])
    files = {n.split("/")[-1]: n for n in z.namelist()}
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".js"):
            os.remove(os.path.join(OUT, f))
    meta = {"counties": {}, "built": datetime.date.today().isoformat(), "source": "data.gov.tw/dataset/161874",
            "buffer": BUF, "simplify": SIMP, "maxEdge": MAXEDGE, "shift": SHIFT}
    stats = collections.Counter()
    # 容量表是依台電「區處」分檔，不一定和變壓器所在縣市同一檔（例如新北金山、萬里的 CX 饋線列在基隆檔）。
    # 先查同縣市檔；查不到時，若饋線名稱只在另一個縣市檔出現過一次，就用那筆。
    allcap = collections.defaultdict(dict)
    for k in NAMES:
        if f"{k}_capacity.csv" in files:
            for r in csv.DictReader(io.StringIO(z.read(files[f"{k}_capacity.csv"]).decode("utf-8-sig"))):
                allcap[r["FEEDER"].strip()][k] = float(r["CAPACITY"])
    alltr = set()
    for k, cname in NAMES.items():
        cap_f, tr_f = files.get(f"{k}_capacity.csv"), files.get(f"{k}_tr_feeder.csv")
        if not cap_f or not tr_f:
            print("缺檔", k)
            continue
        info = z.getinfo(tr_f).date_time
        cap = {r["FEEDER"].strip(): float(r["CAPACITY"]) for r in csv.DictReader(io.StringIO(z.read(cap_f).decode("utf-8-sig")))}
        own = set(cap)
        pts = collections.defaultdict(list)
        for r in csv.DictReader(io.StringIO(z.read(tr_f).decode("utf-8-sig"))):
            try:
                x, y = float(r["X"]) + SHIFT[0], float(r["Y"]) + SHIFT[1]
            except ValueError:
                stats["bad"] += 1
                continue
            lo, la = to84(x, y)
            if not (119 <= lo <= 123 and 21 <= la <= 26):  # 座標明顯錯誤（例如填 0）的變壓器不收
                stats["outside"] += 1
                continue
            pts[r["FEEDER"].strip()].append((x, y, lo, la))
        feeders = sorted(pts)
        for fd in feeders:
            if fd not in cap and len(allcap.get(fd, {})) == 1:
                cap[fd] = next(iter(allcap[fd].values()))
                stats["capOther"] += 1
        alltr |= set(feeders)
        feats, trb, lines = [], bytearray(), []
        for i, fd in enumerate(feeders):
            ps = pts[fd]
            # 先擴 300 m 再縮 180 m（closing）：相距 600 m 內的變壓器連成一片，邊界約在變壓器外 120 m
            area = MultiPoint([(x, y) for x, y, _, _ in ps]).buffer(BUF + 180, 3).buffer(-180, 3).simplify(SIMP, preserve_topology=True)
            if area.is_empty:
                area = MultiPoint([(x, y) for x, y, _, _ in ps]).buffer(BUF, 3)
            g = mapping(transform(to84, area))
            c = cap.get(fd)
            feats.append({"type": "Feature", "geometry": {"type": g["type"], "coordinates": rnd(g["coordinates"])},
                          "properties": {"f": fd, "c": c, "n": len(ps)}})
            for ln in mst_lines([(x, y) for x, y, _, _ in ps]):
                e = enc_line(ln)
                if e:
                    lines.append([i, e])
                    stats["seg"] += 1
            for _, _, lo, la in ps:
                trb += struct.pack("<IIH", round((lo - 119) * 1e6), round((la - 21) * 1e6), i)
            stats["tr"] += len(ps)
        lons = [c for f in feats for c in _xy(f["geometry"], 0)]
        lats = [c for f in feats for c in _xy(f["geometry"], 1)]
        bbox = [round(min(lons), 4), round(min(lats), 4), round(max(lons), 4), round(max(lats), 4)]
        open(os.path.join(OUT, f"{k}_area.js"), "w", encoding="utf-8", newline="\n").write(
            f'window.FEEDER_A=window.FEEDER_A||{{}};window.FEEDER_A["{k}"]=' +
            json.dumps({"type": "FeatureCollection", "features": feats}, ensure_ascii=False, separators=(",", ":")) + ";\n")
        open(os.path.join(OUT, f"{k}_tr.js"), "w", encoding="utf-8", newline="\n").write(
            f'window.FEEDER_T=window.FEEDER_T||{{}};window.FEEDER_T["{k}"]={{feeders:{json.dumps(feeders)},b64:"{base64.b64encode(bytes(trb)).decode()}"}};\n')
        open(os.path.join(OUT, f"{k}_line.js"), "w", encoding="utf-8", newline="\n").write(
            f'window.FEEDER_L=window.FEEDER_L||{{}};window.FEEDER_L["{k}"]=' +
            json.dumps({"feeders": feeders, "C": [cap.get(f) for f in feeders], "N": [len(pts[f]) for f in feeders], "L": lines}, separators=(",", ":")) + ";\n")
        unmapped = sorted(own - set(pts))
        meta["counties"][k] = {"name": cname, "bbox": bbox, "feeders": len(feeders), "tr": sum(len(v) for v in pts.values()),
                               "noCap": sum(1 for f in feeders if f not in cap),
                               "updated": f"{info[0]}-{info[1]:02d}-{info[2]:02d}"}
        stats["feeders"] += len(feeders)
        stats["noCap"] += meta["counties"][k]["noCap"]
        print(f"{cname}：饋線 {len(feeders)}、變壓器 {meta['counties'][k]['tr']}、容量表未列 {meta['counties'][k]['noCap']}")
    stats["capNoTr"] = len(set(allcap) - alltr)  # 容量表有、但全臺變壓器檔都沒有的饋線
    meta["totals"] = dict(stats)
    open(os.path.join(OUT, "meta.js"), "w", encoding="utf-8", newline="\n").write(
        "// 台電饋線：台灣電力公司「全國各縣市再生能源可併網容量」開放資料，由 tools/build_feeders.py 產生\n"
        f"window.FEEDER_META={json.dumps(meta, ensure_ascii=False)};\n")
    size = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"完成：{dict(stats)}，共 {size / 1e6:.1f} MB")


def _xy(g, i):
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    for p in polys:
        for ring in p:
            for c in ring:
                yield c[i]


if __name__ == "__main__":
    main()
