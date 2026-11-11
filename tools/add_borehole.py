#!/usr/bin/env python3
"""把地調中心「工程地質探勘資料庫」的鑽孔柱狀圖加進臺灣地熱地圖。

用法（在 repo 根目錄執行，需要能連到 geotech.gsmma.gov.tw）：
    python3 tools/add_borehole.py 40401902-1120403_10YL-DS-S070 01053383-A0684_DB-24-1

參數是「計畫編號_孔號」，就是從資料庫下載的柱狀圖檔名中間那段
（例如 ____40401902-1120403_10YL-DS-S070_001.emf → 40401902-1120403_10YL-DS-S070）。
計畫編號裡的括號可省略：01053383-A06(84) 寫成 01053383-A0684 也可以。

工具會：
  1. 用資料庫的鑽孔圖層（WFS）找出這一孔的 WGS84 坐標與鑽探深度；
  2. 下載每一頁柱狀圖（PNG）到 geotex/boreholes/；
  3. 讀取基本資料（工程名稱、地點、高程、坐標、日期、鑽探公司）；
  4. 新增或更新 geotex/bh_logs.js 裡的那一筆（已存在就覆蓋）。
只用 Python 標準函式庫。
"""
import base64, html, http.cookiejar, json, os, re, sys, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "geotex", "bh_logs.js")
IMG = os.path.join(ROOT, "geotex", "boreholes")
BASE = "https://geotech.gsmma.gov.tw/imoeagis"
START, END = "/*BH_DATA_START*/", "/*BH_DATA_END*/"

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
HDR = {"Content-Type": "application/json; charset=utf-8", "Origin": "https://geotech.gsmma.gov.tw",
       "Referer": BASE + "/Home/Map", "User-Agent": "Mozilla/5.0"}


def fetch(url, data=None, tries=4):
    for i in range(tries):
        try:
            return opener.open(urllib.request.Request(url, data=data, headers=HDR), timeout=180).read()
        except Exception as e:  # 資料庫偶爾回 500 或斷線，稍等再試
            if i == tries - 1:
                raise
            print(f"  重試（{e}）")
            time.sleep(3 * (i + 1))


def norm(s):
    return re.sub(r"[^0-9A-Za-z]", "", s).upper()


def find_hole(proj, hole):
    q = {"service": "WFS", "version": "2.0.0", "request": "GetFeature", "typeNames": "geocore2020:GeoServiceDrCoord",
         "outputFormat": "application/json", "srsName": "EPSG:4326", "cql_filter": f"HoleNo='{hole}'"}
    d = json.loads(fetch(BASE + "/api/MapsProxy/DrillHoles?" + urllib.parse.urlencode(q)))
    hits = [f for f in d["features"] if norm(f["properties"]["ProjNo"]) == norm(proj)]
    if len(hits) != 1:
        cands = ", ".join(f["properties"]["ProjNo"] for f in d["features"]) or "（無）"
        raise SystemExit(f"找不到唯一的 {proj}_{hole}；資料庫裡同孔號的計畫編號：{cands}")
    return hits[0]


def report(mode, pkey, key):
    body = json.dumps({"Mode": mode, "ProjectKeyId": pkey, "KeyId": key}).encode()
    d = json.loads(fetch(BASE + "/api/GeoReport", body))
    return "".join(d) if isinstance(d, list) else str(d)


def roc(s):
    m = re.fullmatch(r"(\d{2,3})(\d{2})(\d{2})", (s or "").strip())
    return f"{int(m[1])}-{m[2]}-{m[3]}" if m else ""


def num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return None


def load():
    if not os.path.exists(DATA):
        return []
    t = open(DATA, encoding="utf-8").read()
    return json.loads(t[t.index(START) + len(START):t.index(END)])


def save(rows):
    rows.sort(key=lambda r: (r["proj"], r["hole"]))
    body = ",\n".join(json.dumps(r, ensure_ascii=False) for r in rows)
    open(DATA, "w", encoding="utf-8").write(
        "// 鑽孔柱狀圖：經濟部地質調查及礦業管理中心「工程地質探勘資料庫」（https://geotech.gsmma.gov.tw/imoeagis/Home/Map）。\n"
        "// 一孔一行；新增請用 tools/add_borehole.py（說明見 geotex/boreholes/README.md），也可以手動照格式加一行。\n"
        "// 柱狀圖圖片在 geotex/boreholes/<id>_p<頁>.png；坐標用資料庫鑽孔圖層提供的 WGS84（TWD67 的孔由資料庫換算）。\n"
        "window.BH_LOGS=" + START + "[\n" + body + "\n]" + END + ";\n"
        "(()=>{const rows=window.BH_LOGS||[];\n"
        "window.GEOTEX_CATALOG=(window.GEOTEX_CATALOG||[]).concat([[\"bh_logs\",\"全臺：鑽孔柱狀圖(Borehole logs)\",rows.length,\"Point\",0,\"bh\"]]);\n"
        "window.GEOTEX_D=window.GEOTEX_D||{};\n"
        "window.GEOTEX_D.bh_logs={type:\"FeatureCollection\",features:rows.map(r=>({type:\"Feature\",geometry:{type:\"Point\",coordinates:[r.lng,r.lat]},properties:r}))};})();\n")


def add(arg):
    m = re.fullmatch(r"(.+)_([^_]+)", arg.strip())
    if not m:
        raise SystemExit(f"格式應為 計畫編號_孔號：{arg}")
    proj, hole = m[1], m[2]
    print(f"{proj} / {hole}")
    f = find_hole(proj, hole)
    p = f["properties"]
    lng, lat = f["geometry"]["coordinates"]
    try:
        base = report("BaseData", p["ProjectKeyid"], p["KeyId"])
    except Exception as e:  # 少數孔資料庫的基本資料查詢會固定出錯，柱狀圖仍可用
        print(f"  基本資料查詢失敗（{e}），只放坐標與柱狀圖")
        base = ""
    clean = lambda c: re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", c))).strip()
    info = {clean(k): clean(v) for k, v in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>\s*<td[^>]*>(.*?)</td>", base, re.S)}
    chart = report("Chart", p["ProjectKeyid"], p["KeyId"])
    imgs = re.findall(r'<img[^>]*src="data:image/[a-z]+;base64,\s*([A-Za-z0-9+/=]+)"', chart)
    if not imgs:
        raise SystemExit("資料庫沒有回傳柱狀圖")
    rid = re.sub(r"[()]", "", p["ProjNo"]) + "_" + hole  # 跟資料庫下載的檔名一致，例如 01053383-A0684_DB-24-1
    os.makedirs(IMG, exist_ok=True)
    for i, b in enumerate(imgs, 1):
        open(os.path.join(IMG, f"{rid}_p{i}.png"), "wb").write(base64.b64decode(b))
    row = {"id": rid, "hole": hole, "proj": p["ProjNo"], "name": info.get("鑽孔工程名稱", ""), "loc": info.get("鑽孔地點", ""),
           "lat": round(lat, 7), "lng": round(lng, 7), "elev": num(info.get("鑽孔地表高程")),
           "depth": num(info.get("鑽孔總總深度")) or p.get("DrillDepth"), "crs": info.get("座標系統", ""),
           "x": num(info.get("孔口X座標")), "y": num(info.get("孔口Y座標")), "start": roc(info.get("鑽探起始日期")),
           "end": roc(info.get("鑽探完成日期")), "company": info.get("鑽探公司", ""), "pages": len(imgs),
           "keyId": p["KeyId"], "projKeyId": p["ProjectKeyid"], "fetched": time.strftime("%Y-%m-%d")}
    if not base:
        row["note"] = "資料庫未回傳基本資料，詳見柱狀圖表頭"
    print(f"  {row['loc'] or '（未填地點）'}，深 {row['depth']} m，{len(imgs)} 頁")
    return row


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    rows = load()
    opener.open(urllib.request.Request(BASE + "/Home/Map", headers=HDR), timeout=60).read()  # 取得工作階段
    failed = []
    for a in sys.argv[1:]:
        try:
            r = add(a)
        except (Exception, SystemExit) as e:
            print(f"  略過 {a}：{e}")
            failed.append(a)
            continue
        rows = [x for x in rows if x["id"] != r["id"]] + [r]
    save(rows)
    if failed:
        print("沒有加入：" + "、".join(failed))
    print(f"完成：geotex/bh_logs.js 共 {len(rows)} 孔")


if __name__ == "__main__":
    main()
