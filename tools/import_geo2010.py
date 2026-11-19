#!/usr/bin/env python3
"""把 GEO2010（經濟部地質調查及礦業管理中心「工程地質探勘資料庫系統」）的鑽探資料匯入臺灣地熱地圖的「鑽孔柱狀圖」圖層。

用法（在 repo 根目錄執行，Windows，需要 pyodbc、pyproj 與 Microsoft Access Driver (*.mdb, *.accdb)）：
    py tools/import_geo2010.py C:/Geo2010/DATA/Ngeoext_New.mdb --datum TWD67
    py tools/import_geo2010.py <mdb> --datum TWD67 --wfs        # 另外查地調中心 WFS，標註哪些孔已公開

做的事：
  1. 先把 MDB 複製到暫存資料夾再以唯讀方式開啟（不動原檔）；
  2. 每孔讀：基本資料（drill_projects、hole_attributes、measured_attribu、drill_attributes）、
     分層描述（geol_rock_soil_d）、標準貫入（std_proct_compac）、地下水位（water_tables）；
     不讀室內試驗（test_*）與岩心照片（drill_image）；
  3. 坐標換成 WGS84（見下方「坐標」），寫進 geotex/bh_logs.js（同 id 覆蓋，可重跑）。

坐標：GEO2010 的 coord_system 只記「TM二度分帶」，沒寫基準，所以 --datum 一定要給。
  - TWD97：EPSG:3826 → EPSG:4326。
  - TWD67：pyproj 的 EPSG:3828 → 4326 只有「Ballpark」轉換（不做基準轉換，會偏約 850 m），不能用。
    這裡改成先加地調中心資料庫換算 TWD67→TWD97 用的位移（預設 X+830.61、Y−203.71 m，
    2026-11-11 以計畫 03720051-8931(66) 已公開 35 孔反推，每孔都一樣），再用 EPSG:3826 → 4326。
    其他計畫可用 --shift dx,dy 改位移；建議先用 --wfs 比對已公開孔。

已存在、但不是 GEO2010 匯入的同 id 資料（例如 add_borehole.py 抓的、有柱狀圖圖片的孔）預設不覆蓋，
要覆蓋請加 --overwrite。
"""
import argparse, json, os, re, shutil, ssl, sys, tempfile, time, urllib.parse, urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from add_borehole import load, save  # noqa: E402  共用 bh_logs.js 的讀寫格式

SRC_PREFIX = "使用者提供之 GEO2010 資料"
WFS = "https://geotech.gsmma.gov.tw/imoeagis/api/MapsProxy/DrillHoles?"


def r2(v):
    return None if v is None else round(float(v), 3)


def clean(s):
    return re.sub(r"\s+", " ", (s or "")).strip()


def roc(s):
    """GEO2010 日期多為民國 yyyMMdd 或 yyy/MM/dd；轉成「年-月-日」，看不懂就原樣保留。"""
    s = clean(s)
    m = re.fullmatch(r"(\d{2,3})[/.\-]?(\d{1,2})[/.\-]?(\d{1,2})", s)
    return f"{int(m[1])}-{int(m[2]):02d}-{int(m[3]):02d}" if m else s


def spt_text(row):
    """N 值；拒絕貫入時 MDB 的 n=0、改記在 n1～n3（擊數）與 n1_depth～n3_depth（cm），寫成「50/4cm」。"""
    n, n_depth = row.n, row.n_depth
    if n or (n_depth or 0) > 0:
        return str(int(n or 0))
    for blows, cm in ((row.n1, row.n1_depth), (row.n2, row.n2_depth), (row.n3, row.n3_depth)):
        if blows:
            return f"{int(blows)}/{cm:g}cm" if cm else f"{int(blows)}"
    return None  # 全部是 0：沒有有效紀錄


def wfs_holes(proj):
    ctx = ssl.create_default_context()
    ctx.verify_flags &= ~ssl.VERIFY_X509_STRICT  # 地調中心憑證缺 Subject Key Identifier，Python 3.13+ 的 strict 模式會擋
    q = {"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": "geocore2020:GeoServiceDrCoord",
         "outputFormat": "application/json", "srsName": "EPSG:4326", "cql_filter": f"ProjNo='{proj}'"}
    req = urllib.request.Request(WFS + urllib.parse.urlencode(q), headers={"User-Agent": "Mozilla/5.0"})
    d = json.loads(urllib.request.urlopen(req, timeout=120, context=ctx).read())
    return {f["properties"]["HoleNo"]: f for f in d["features"] if f["properties"]["ProjNo"] == proj}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mdb")
    ap.add_argument("--datum", required=True, choices=["TWD67", "TWD97"], help="MDB 坐標的基準（GEO2010 沒記，要自己確認）")
    ap.add_argument("--shift", default="830.61,-203.71", help="TWD67→TWD97 位移 dx,dy（m）")
    ap.add_argument("--wfs", action="store_true", help="查地調中心 WFS，標註已公開孔並回報坐標差距")
    ap.add_argument("--overwrite", action="store_true", help="同 id 的非 GEO2010 資料也覆蓋")
    a = ap.parse_args()

    import pyodbc
    from pyproj import Geod, Transformer

    tmp = tempfile.mkdtemp(prefix="geo2010_")
    path = os.path.join(tmp, os.path.basename(a.mdb))
    shutil.copy2(a.mdb, path)
    cn = pyodbc.connect(r"DRIVER={Microsoft Access Driver (*.mdb, *.accdb)};DBQ=" + path + ";ReadOnly=1")
    cur = cn.cursor()
    q = lambda s: cur.execute(s).fetchall()

    def by_hole(sql):
        out = {}
        for r in q(sql):
            out.setdefault((r.proj_no, r.hole_no), []).append(r)
        return out

    projs = {r.proj_no: r for r in q("SELECT * FROM drill_projects")}
    meas = {(r.proj_no, r.hole_no): r for r in q("SELECT * FROM measured_attribu")}
    drill = {(r.proj_no, r.hole_no): r for r in q("SELECT * FROM drill_attributes")}
    layers = by_hole("SELECT * FROM geol_rock_soil_d ORDER BY proj_no, hole_no, top_depth")
    spts = by_hole("SELECT * FROM std_proct_compac ORDER BY proj_no, hole_no, top_depth")
    waters = by_hole("SELECT * FROM water_tables")
    wt_cols = [c.column_name for c in cur.columns(table="water_tables")]
    holes = q("SELECT * FROM hole_attributes ORDER BY proj_no, hole_no")
    cn.close()
    shutil.rmtree(tmp, ignore_errors=True)

    dx, dy = (float(v) for v in a.shift.split(","))
    t97 = Transformer.from_crs(3826, 4326, always_xy=True)
    if a.datum == "TWD67":
        to_wgs = lambda x, y: t97.transform(x + dx, y + dy)
        coord_note = (f"原始坐標 TWD67 二度分帶（GEO2010 只記「TM二度分帶」，基準由地調中心已公開孔比對確認）；"
                      f"先加位移 X{dx:+.2f}、Y{dy:+.2f} m 換成 TWD97（與地調中心資料庫換算一致），"
                      f"再以 pyproj EPSG:3826→4326 轉 WGS84。改用七參數轉換約差 3 m。")
    else:
        to_wgs = t97.transform
        coord_note = "原始坐標 TWD97 二度分帶，以 pyproj EPSG:3826→4326 轉 WGS84（誤差可忽略）"

    pub = {}
    if a.wfs:
        for p in projs:
            try:
                pub[p] = wfs_holes(p)
                print(f"WFS：{p} 已公開 {len(pub[p])} 孔")
            except Exception as e:
                print(f"WFS 查詢失敗（{p}）：{e}")
    geod = Geod(ellps="WGS84")

    new, skipped, stats = [], [], {"layers": 0, "spt": 0, "spt_refusal": 0, "spt_empty": 0, "gwl": 0}
    diffs = []
    for h in holes:
        key = (h.proj_no, h.hole_no)
        m, d, pj = meas.get(key), drill.get(key), projs.get(h.proj_no)
        if not m or m.coord_x is None or m.coord_y is None:
            skipped.append(f"{h.proj_no}_{h.hole_no}（沒有坐標）")
            continue
        lng, lat = to_wgs(m.coord_x, m.coord_y)
        rid = re.sub(r"[()]", "", h.proj_no) + "_" + h.hole_no
        pname = clean(pj.proj_name) if pj else clean(h.hole_name)
        row = {"id": rid, "hole": h.hole_no, "proj": h.proj_no, "name": pname, "loc": clean(h.location),
               "lat": round(lat, 7), "lng": round(lng, 7), "elev": r2(m.elevation),
               "depth": r2(d.total_depth) if d else None,
               "crs": "TW67" if a.datum == "TWD67" else "TW97", "x": r2(m.coord_x), "y": r2(m.coord_y),
               "start": roc(d.date_drill_begin) if d else "", "end": roc(d.date_drill_end) if d else "",
               "company": clean(d.drilling_company) if d else ""}
        ws = waters.get(key, [])
        if ws:  # water_tables 欄位依版本可能不同，取第一個像「水位深度」的數值欄
            w = ws[0]
            dcol = next((c for c in wt_cols if re.search(r"depth|level", c, re.I)), None)
            if dcol and getattr(w, dcol) is not None:
                row["gwl"] = r2(getattr(w, dcol))
                dtcol = next((c for c in wt_cols if "date" in c.lower()), None)
                if dtcol:
                    row["gwlDate"] = roc(getattr(w, dtcol))
                stats["gwl"] += 1
        ls = [{"top": r2(l.top_depth), "bot": r2(l.bottom_depth), "desc": clean(l.description)}
              for l in layers.get(key, []) if clean(l.description)]
        if ls:
            row["layers"] = ls
            stats["layers"] += len(ls)
        sp = []
        for s in spts.get(key, []):
            n = spt_text(s)
            if n is None:
                stats["spt_empty"] += 1
                continue
            stats["spt_refusal"] += "/" in n
            sp.append({"depth": r2(s.top_depth), "n": n})
        if sp:
            row["spt"] = sp
            stats["spt"] += len(sp)
        row["source"] = f"{SRC_PREFIX}（計畫：{pname or h.proj_no}）"
        row["coordNote"] = coord_note
        notes = []
        if a.wfs and h.proj_no in pub:
            f = pub[h.proj_no].get(h.hole_no)
            if f:
                notes.append("地調中心工程地質探勘資料庫亦收錄此孔")
                diffs.append((h.hole_no, geod.inv(lng, lat, *f["geometry"]["coordinates"][:2])[2]))
            else:
                notes.append("地調中心工程地質探勘資料庫公開圖層未收錄此孔")
        if not ws:
            notes.append("GEO2010 資料未含地下水位")
        row["note"] = "；".join(notes)
        row["imported"] = time.strftime("%Y-%m-%d")
        new.append(row)

    rows = load()
    old = {r["id"]: r for r in rows}
    for r in new:
        o = old.get(r["id"])
        if o and not str(o.get("source", "")).startswith(SRC_PREFIX) and not a.overwrite:
            skipped.append(f"{r['id']}（已有非 GEO2010 資料，未覆蓋；要覆蓋請加 --overwrite）")
            continue
        old[r["id"]] = r
    save(list(old.values()))

    print(f"匯入 {len(new) - sum('未覆蓋' in s for s in skipped)} 孔；分層 {stats['layers']} 筆、SPT {stats['spt']} 筆"
          f"（拒絕貫入 {stats['spt_refusal']}，無效略過 {stats['spt_empty']}）、地下水位 {stats['gwl']} 孔")
    if diffs:
        v = [x for _, x in diffs]
        print(f"與 WFS 已公開孔坐標差距：{len(v)} 孔，最小 {min(v):.2f} m、最大 {max(v):.2f} m")
    for s in skipped:
        print("略過：" + s)
    print(f"geotex/bh_logs.js 共 {len(old)} 孔，檔案 {os.path.getsize(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'geotex', 'bh_logs.js')) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
