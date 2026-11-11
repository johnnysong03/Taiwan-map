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
  - 變壓器點：放大時才載入。
輸出到 geotex/feeders/：meta.js（開頁載入）、<縣市>_area.js（服務範圍）、<縣市>_tr.js（變壓器點，base64）。
"""
import base64, collections, csv, io, json, os, struct, sys, warnings, zipfile, datetime
warnings.filterwarnings("ignore")
from pyproj import Transformer
from shapely.geometry import MultiPoint, mapping
from shapely.ops import transform

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "geotex", "feeders")
SHIFT = (830.61, -203.71)
BUF, SIMP = 120, 50
NAMES = {"KEELUNG": "基隆市", "TAIPEI": "臺北市", "NEWTAIPEI": "新北市", "TAOYUAN": "桃園市", "HSINCHU": "新竹縣市", "MIAOLI": "苗栗縣",
         "TAICHUNG": "臺中市", "CHANGHUA": "彰化縣", "NANTOU": "南投縣", "YUNLIN": "雲林縣", "CHIAYI": "嘉義縣市", "TAINAN": "臺南市",
         "KAOHSIUNG": "高雄市", "PINGTUNG": "屏東縣", "YILAN": "宜蘭縣", "HUALIEN": "花蓮縣", "TAITUNG": "臺東縣"}
to84 = Transformer.from_crs(3826, 4326, always_xy=True).transform


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
            "buffer": BUF, "simplify": SIMP, "shift": SHIFT}
    stats = collections.Counter()
    for k, cname in NAMES.items():
        cap_f, tr_f = files.get(f"{k}_capacity.csv"), files.get(f"{k}_tr_feeder.csv")
        if not cap_f or not tr_f:
            print("缺檔", k)
            continue
        info = z.getinfo(tr_f).date_time
        cap = {r["FEEDER"].strip(): float(r["CAPACITY"]) for r in csv.DictReader(io.StringIO(z.read(cap_f).decode("utf-8-sig")))}
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
        feats, trb = [], bytearray()
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
        unmapped = sorted(set(cap) - set(pts))
        meta["counties"][k] = {"name": cname, "bbox": bbox, "feeders": len(feeders), "tr": sum(len(v) for v in pts.values()),
                               "noCap": sum(1 for f in feeders if f not in cap), "capNoTr": len(unmapped),
                               "updated": f"{info[0]}-{info[1]:02d}-{info[2]:02d}"}
        stats["feeders"] += len(feeders)
        stats["noCap"] += meta["counties"][k]["noCap"]
        stats["capNoTr"] += len(unmapped)
        print(f"{cname}：饋線 {len(feeders)}、變壓器 {meta['counties'][k]['tr']}、容量表未列 {meta['counties'][k]['noCap']}、"
              f"有容量無變壓器 {len(unmapped)}")
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
