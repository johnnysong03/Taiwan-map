#!/usr/bin/env python3
"""把氣象署地震測報中心的地震目錄 CSV（欄位：地震時間,經度,緯度,規模,深度；Big5 或 UTF-8）
轉成臺灣地熱地圖的「地震目錄」圖層資料。

用法（repo 根目錄）：
    python3 tools/build_quakes.py 目錄1.csv 目錄2.csv ...

可以一次給好幾個檔（例如規模 ≤5 與 ≥5 分開下載的），會合併並去掉完全相同的重複列。
輸出（整個資料夾重建）：
  geotex/quakes/meta.js      圖層說明（筆數、時間範圍、區塊清單），網頁開啟時載入，很小
  geotex/quakes/cube.js      密度格點：0.1° 方格 × 年 × 規模級（整數）× 深度級，給縮小時畫密度
  geotex/quakes/t_<x>_<y>.js 點資料，每 0.5° 一塊，放大時只載入看得到的區塊

點資料每筆 12 bytes（little-endian）：uint32 時間（自 2000-01-01 00:00:00 起的秒數，照原始檔時間）、
uint16 經度×100−11900、uint16 緯度×100−2100、uint16 規模×100、uint16 深度×100（km）；以 base64 存在 JS 檔。
只用 Python 標準函式庫。
"""
import base64, collections, csv, datetime, glob, json, os, struct, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "geotex", "quakes")
LON0, LAT0, CELL, TILE = 119.0, 21.0, 0.1, 0.5
NX, NY = 40, 50                      # 119–123°E、21–26°N 的 0.1° 方格數
TX, TY = 8, 10                       # 0.5° 區塊數
EPOCH = datetime.datetime(2000, 1, 1)
DEP_EDGES = (10, 30, 70)             # 深度級：<10、10–30、30–70、≥70 km


def read(fn):
    raw = open(fn, "rb").read()
    for enc in ("utf-8-sig", "big5", "cp950"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    else:
        raise SystemExit(f"讀不出編碼：{fn}")
    r = csv.reader(text.splitlines())
    head = next(r)
    if [h.strip() for h in head[:5]] != ["地震時間", "經度", "緯度", "規模", "深度"]:
        raise SystemExit(f"{fn} 的欄位不是「地震時間,經度,緯度,規模,深度」：{head}")
    rows = []
    for x in r:
        if len(x) < 5 or not x[0].strip():
            continue
        t = datetime.datetime.strptime(x[0].strip(), "%Y-%m-%d %H:%M:%S")
        rows.append((t, round(float(x[1]), 2), round(float(x[2]), 2), round(float(x[3]), 2), round(float(x[4]), 2)))
    return rows


def dbin(d):
    return sum(d >= e for e in DEP_EDGES)


def main():
    files = sys.argv[1:]
    if not files:
        print(__doc__)
        return
    allrows = []
    for f in files:
        rows = read(f)
        print(f"{f}：{len(rows)} 筆")
        allrows += rows
    rows = sorted(set(allrows))
    print(f"合併去重後 {len(rows)} 筆（重複 {len(allrows) - len(rows)} 筆）")
    out = [r for r in rows if LON0 <= r[1] <= LON0 + NX * CELL and LAT0 <= r[2] <= LAT0 + NY * CELL]
    if len(out) != len(rows):
        print(f"範圍外略過 {len(rows) - len(out)} 筆")
    rows = out
    y0 = rows[0][0].year
    cube = collections.Counter()
    tiles = collections.defaultdict(list)
    for t, lon, lat, m, d in rows:
        ix, iy = min(int((lon - LON0) / CELL), NX - 1), min(int((lat - LAT0) / CELL), NY - 1)
        cube[(ix + iy * NX, t.year - y0, min(int(m), 7) * 4 + dbin(d))] += 1
        tx, ty = min(int((lon - LON0) / TILE), TX - 1), min(int((lat - LAT0) / TILE), TY - 1)
        tiles[(tx, ty)].append((t, lon, lat, m, d))
    os.makedirs(OUT, exist_ok=True)
    for f in glob.glob(os.path.join(OUT, "*.js")):
        os.remove(f)
    cb = b"".join(struct.pack("<HBBI", c, y, md, n) for (c, y, md), n in sorted(cube.items()))
    counts = {}
    for (tx, ty), ev in sorted(tiles.items()):
        ev.sort(key=lambda e: (e[3], e[0]))  # 小規模先畫，大地震疊在上面
        b = b"".join(struct.pack("<IHHHH", int((t - EPOCH).total_seconds()), round(lon * 100) - 11900,
                                 round(lat * 100) - 2100, round(m * 100), min(65535, round(d * 100))) for t, lon, lat, m, d in ev)
        key = f"{tx}_{ty}"
        counts[key] = len(ev)
        open(os.path.join(OUT, f"t_{key}.js"), "w", encoding="utf-8", newline="\n").write(
            f'window.QUAKE_T=window.QUAKE_T||{{}};window.QUAKE_T["{key}"]="{base64.b64encode(b).decode()}";\n')
    meta = {"n": len(rows), "from": rows[0][0].strftime("%Y-%m-%d %H:%M:%S"), "to": rows[-1][0].strftime("%Y-%m-%d %H:%M:%S"),
            "y0": y0, "y1": rows[-1][0].year, "mMax": max(r[3] for r in rows), "dMax": max(r[4] for r in rows),
            "lon0": LON0, "lat0": LAT0, "cell": CELL, "nx": NX, "tile": TILE, "depEdges": DEP_EDGES, "tiles": counts,
            "files": [os.path.basename(f) for f in files], "built": datetime.date.today().isoformat()}
    head = "// 地震目錄：交通部中央氣象署地震測報中心（使用者下載的地震目錄 CSV，由 tools/build_quakes.py 產生）\n"
    open(os.path.join(OUT, "meta.js"), "w", encoding="utf-8", newline="\n").write(
        head + f"window.QUAKE_META={json.dumps(meta, ensure_ascii=False)};\n")
    open(os.path.join(OUT, "cube.js"), "w", encoding="utf-8", newline="\n").write(
        head + f'window.QUAKE_CUBE="{base64.b64encode(cb).decode()}";\n')
    size = sum(os.path.getsize(f) for f in glob.glob(os.path.join(OUT, "*.js")))
    print(f"輸出 geotex/quakes/：{len(counts)} 個區塊、密度格 {len(cube)} 筆，共 {size / 1e6:.1f} MB；"
          f"時間 {meta['from']} ～ {meta['to']}，最大規模 {meta['mMax']}")


if __name__ == "__main__":
    main()
