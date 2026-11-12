#!/usr/bin/env python3
"""資料來源與參考文獻清單：產生 docs/sources.json、sources-data.js（網站 sources.html 用）、
docs/reference/無法存取的參考資料.xlsx 與同內容 CSV。

清單內容與查證結果寫在下面的 SRC。查證日期 2026-11-12，方法：
- 網址：在雲端環境以 curl 連線（跟隨轉址），記 HTTP 狀態與頁面標題；圖磚抽樣一張。
- data.gov.tw：以 https://data.gov.tw/api/v2/rest/dataset/<編號> 比對資料集名稱、提供機關（以聯絡信箱網域判斷）、授權與更新日期。
- 文獻：DOI 以 Crossref API 比對題名、作者、期刊卷頁；沒有 DOI 的會議論文以網路搜尋交叉確認。
- 被雲端環境擋住或對方伺服器拒絕連線的，另以網路搜尋確認是否存在，查不到就標「未能確認」。

用法（repo 根目錄）：python3 tools/build_sources.py   需要 openpyxl。
"""
import csv, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKED = "2026-11-12"
GOV1 = "政府資料開放授權條款第1版"
DG = "https://data.gov.tw/dataset/"

# 類別（顯示順序）
CATS = [
    ("basemap", "底圖", "Basemaps"),
    ("layer", "圖層（圖磚／WMS）", "Map layers (tiles / WMS)"),
    ("api", "點查詢與即時 API", "Live queries and APIs"),
    ("dataset", "開放資料集", "Open datasets"),
    ("doc", "法規與官方文件", "Regulations and official documents"),
    ("lit", "文獻", "Literature"),
    ("news", "新聞報導與業者資料", "News and company documents"),
    ("user", "使用者提供", "User-supplied"),
    ("lib", "程式庫與字型（CDN）", "Libraries and fonts (CDN)"),
]
# 狀態：ok 連線成功且內容相符；partial 存在但這次沒能直接連線（以搜尋或二手資料確認）；fail 無法存取或查無；user 使用者提供、無公開網址
ST = {"ok": ("已查證", "Verified"), "partial": ("部分確認", "Partly verified"),
      "fail": ("無法存取／未能確認", "Not accessible / unconfirmed"), "user": ("使用者提供（無公開網址）", "User-supplied (no public URL)")}

A, G, I, R = "建築地圖", "地熱地圖", "首頁", "地熱資源量評估頁"

SRC = []
def S(cat, name, org, url="", date="", lic="", used="", status="ok", check="", fail="", suggest="", note="",
      name_en="", org_en="", used_en="", cite=""):
    SRC.append(dict(cat=cat, name=name, name_en=name_en or name, org=org, org_en=org_en or org, url=url, date=date,
                    license=lic, used=used, used_en=used_en or used, status=status, check=check, fail=fail,
                    suggest=suggest, note=note, cite=cite))

def dg(cat, num, name, org, date, used, used_en, name_en, org_en, check="", note="", status="ok"):
    S(cat, name, org, f"{DG}{num}", date, GOV1, used, status,
      check or f"data.gov.tw API：資料集 {num} 名稱「{name}」相符，授權代碼 1（{GOV1}）", note=note,
      name_en=name_en, org_en=org_en, used_en=used_en)

# ---------------- 底圖 ----------------
S("basemap", "臺灣通用電子地圖、正射影像、渲染圖、道路路網 WMTS（EMAP98、EMAP、EMAPX99、EMAP5、MOI_SHADERMAP、EMAP12、PHOTO2、EMAP2、ROAD）",
  "內政部國土測繪中心", "https://wmts.nlsc.gov.tw/wmts", "即時圖磚",
  "未能確認（國土測繪中心圖資服務的使用規範本次未查到條文）", f"{A}、{G}：底圖與路網疊加", "ok",
  "WMTS GetCapabilities HTTP 200，9 個圖層代碼都在清單內；圖磚抽樣 200",
  name_en="NLSC WMTS: Taiwan e-Map, orthophoto, shaded relief, road network", org_en="National Land Surveying and Mapping Center (NLSC)",
  used_en="Architecture and geothermal maps: basemaps and road overlay")
S("basemap", "OpenFreeMap 向量圖磚（「海軍藍」色調底圖）", "OpenFreeMap；地圖資料 © OpenStreetMap 貢獻者",
  "https://openfreemap.org", "即時圖磚", "OpenStreetMap 資料採 ODbL 1.0（https://www.openstreetmap.org/copyright）",
  f"{A}、{G}：海軍藍色調底圖", "ok", "openfreemap.org 與 tiles.openfreemap.org/planet HTTP 200；OSM 版權頁 200",
  name_en="OpenFreeMap vector tiles (navy basemap)", org_en="OpenFreeMap; map data © OpenStreetMap contributors",
  used_en="Both maps: navy-tone basemap")
S("basemap", "AWS Terrain Tiles（Terrarium 高程圖磚）", "Mapzen（Linux Foundation 專案），AWS Registry of Open Data",
  "https://registry.opendata.aws/terrain-tiles/", "即時圖磚",
  "依 tilezen/joerd attribution.md 所列各高程來源（Registry 頁面的 License 欄）",
  f"{G}：等高線、地形陰影、卡車路線坡度", "ok", "Registry 頁面 HTTP 200；s3.amazonaws.com 圖磚抽樣 200",
  name_en="AWS Terrain Tiles (Terrarium)", org_en="Mapzen (Linux Foundation), AWS Registry of Open Data",
  used_en="Geothermal map: contours, hillshade, truck-route gradients")

# ---------------- 圖層 ----------------
for ids, nm, en, used, used_en in [
    ("LAND_OPENDATA、LANDSECT", "公有土地地籍圖、地段外圍圖（段籍圖）", "Public-land cadastre, land-section outlines", f"{A}、{G}：地籍圖層", "Both maps: cadastral overlays"),
    ("BUILDX", "臺灣通用電子地圖加值分棟建物框", "Building footprints", f"{A}：分棟建物框", "Architecture map: building footprints"),
    ("LUIMAP", "國土利用現況調查成果圖", "Land-use survey map", f"{A}、{G}：國土利用現況圖層與點查分類；國際商港位置判讀", "Both maps: land-use layer and point lookup; port positions"),
    ("Village、TOWN", "村里界、鄉鎮區界", "Village and township boundaries", f"{A}：村里界；{G}：鄉鎮區界", "Village / township boundaries"),
    ("MOI_HILLSHADE、MOI_CONTOUR_2", "陰影圖、等高線圖（2010–2015）", "Hillshade, contours (2010–2015)", f"{G}：地形陰影、等高線", "Geothermal map: hillshade and contours"),
    ("GeoSensitive2", "地質敏感區（山崩與地滑）", "Geologically sensitive areas (landslides)", f"{G}：地質敏感區", "Geothermal map"),
    ("SoilLiquefaction", "土壤液化潛勢（初級）", "Soil liquefaction potential", f"{G}：土壤液化潛勢", "Geothermal map"),
    ("nURBAN1、nURBAN2", "非都市土地使用分區圖、非都市土地使用地類別圖", "Non-urban zoning and land-use type tiles", f"{A}、{G}：點查使用地類別（依圖磚顏色判讀）", "Both maps: point lookup by tile colour"),
]:
    S("layer", f"{nm} WMTS（{ids}）", "內政部國土測繪中心", "https://wmts.nlsc.gov.tw/wmts", "即時圖磚；圖磚未標示更新日期",
      "未能確認（同上）", used, "ok", "WMTS GetCapabilities 內有此圖層代碼，標題相符",
      name_en=f"NLSC WMTS: {en} ({ids})", org_en="NLSC", used_en=used_en)
S("layer", "1/25,000 臺灣活動斷層分布圖（含名稱）2021（WMS/25K_Geomap_fault_2021）", "經濟部地質調查及礦業管理中心",
  "https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0", "即時 WMS",
  "未能確認", f"{G}：活動斷層 1/25,000", "ok", "WMS GetCapabilities HTTP 200，圖層名稱與標題相符",
  name_en="GSMMA WMS: active faults 1:25,000 (2021)", org_en="Geological Survey and Mining Management Agency (GSMMA), MOEA", used_en="Geothermal map: active faults")
S("layer", "活動斷層地質敏感區（WMS/Sensitive_area_fault）", "經濟部地質調查及礦業管理中心",
  "https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0", "即時 WMS",
  "未能確認", f"{G}：活動斷層地質敏感區", "ok", "WMS GetCapabilities HTTP 200，圖層名稱與標題相符",
  name_en="GSMMA WMS: active-fault sensitive areas", org_en="GSMMA", used_en="Geothermal map")
S("layer", "順向坡目錄圖磚（Dislope）", "經濟部地質調查及礦業管理中心",
  "https://landslide.geologycloud.tw/jlwmts/jetlink/Dislope/GoogleMapsCompatible/{z}/{x}/{y}.png", "即時圖磚",
  "未能確認", f"{G}：順向坡", "ok", "圖磚抽樣 HTTP 200（PNG）",
  name_en="GSMMA dip-slope tiles", org_en="GSMMA", used_en="Geothermal map: dip slopes")
S("layer", "工程地質探勘資料庫鑽孔分布（WMS 代理 geocore2020:GeoServiceDrCoord）", "經濟部地質調查及礦業管理中心",
  "https://geotech.gsmma.gov.tw/imoeagis/api/MapsProxy/DrillHoles?SERVICE=WMS&REQUEST=GetCapabilities", "即時 WMS",
  "未能確認", f"{G}：工程井（鑽孔分布）", "ok", "GeoServer GetCapabilities HTTP 200，含 GeoServiceDrCoord",
  name_en="GSMMA engineering-geology borehole WMS", org_en="GSMMA", used_en="Geothermal map: engineering boreholes")

# ---------------- API ----------------
S("api", "單點坐標回傳行政區（TownVillagePointQuery）", "內政部國土測繪中心",
  "https://api.nlsc.gov.tw/other/TownVillagePointQuery/121.5/25.05/4326", "即時查詢", "未能確認",
  f"{A}、{G}：點地圖查縣市鄉鎮與地段；案場座標反查", "ok", "抽樣查詢 HTTP 200，回傳 XML",
  name_en="NLSC point-to-township API", org_en="NLSC", used_en="Both maps: township lookup; checking site coordinates")
S("api", "臺灣水文地質資訊系統 觀測井（POST /data/<類別>/hydrostation）", "經濟部地質調查及礦業管理中心",
  "https://hydro.geologycloud.tw/map", "即時查詢", "未能確認", f"{G}：水井（觀測井）", "ok",
  "系統頁面 HTTP 200，標題「臺灣水文地質資訊系統」",
  name_en="GSMMA Taiwan Hydrogeological Information System", org_en="GSMMA", used_en="Geothermal map: observation wells")
S("api", "中央氣象署開放資料平臺 測站基本資料（C-B0074-001、C-B0074-002）", "交通部中央氣象署",
  "https://opendata.cwa.gov.tw/api/v1/rest/datastore/C-B0074-001", "即時查詢（需使用者自備授權碼）", GOV1,
  f"{G}：氣象測站", "ok", "未帶授權碼時回 HTTP 401（端點存在，需授權碼），符合預期",
  name_en="CWA open data: weather stations", org_en="Central Weather Administration (CWA)", used_en="Geothermal map: weather stations")
S("api", "OpenStreetMap 道路（Overpass API：overpass-api.de、overpass.kumi.systems、overpass.private.coffee）",
  "OpenStreetMap 貢獻者；Overpass API 各公開伺服器", "https://overpass-api.de/api/interpreter", "即時查詢",
  "OpenStreetMap 資料採 ODbL 1.0", f"{G}：卡車路線（宜蘭，測試版）", "partial",
  "三個端點在雲端環境都連不上（overpass-api.de 連線被重設，另兩個逾時）；網站是由使用者的瀏覽器直接查詢，不經過這個環境",
  "連線被重設／逾時（雲端環境）", "在一般網路用瀏覽器開卡車路線確認；程式已有三個備援端點",
  name_en="OpenStreetMap roads via Overpass API", org_en="OpenStreetMap contributors; public Overpass servers",
  used_en="Geothermal map: truck routes (Yilan, beta)")
S("api", "地熱探勘資訊平臺 開放資料 API（92 組圖層：地質圖、裂隙、線型、剖面、地化、地球物理等）", "經濟部地質調查及礦業管理中心",
  "https://geotex.geologycloud.tw/main/openapi", "2026-11-07 下載",
  "「地熱探勘資訊平臺資料供應要點」第一類資料可自由下載及利用（https://geotex.geologycloud.tw/main/informationSupply）",
  f"{G}：地熱圖層（地質、裂隙、地化、地球物理、探勘井）", "ok",
  "介接說明頁 HTTP 200；資料供應要點頁確認第一類資料清單與「可自由下載及利用」",
  name_en="GeoTEX Geothermal Exploration Information Platform open data", org_en="GSMMA",
  used_en="Geothermal map: geothermal layers")

# ---------------- 資料集 ----------------
dg("dataset", 32504, "溫泉露頭調查資料", "經濟部地質調查及礦業管理中心", "2025-06-20 更新", f"{G}：溫泉露頭",
   "Geothermal map: hot spring outcrops", "Hot spring outcrop survey", "GSMMA")
S("dataset", "西南海域地熱流探測調查（93～96、97～100、101～104 年度）", "經濟部地質調查及礦業管理中心",
  f"{DG}32493", "2025-06-20 更新", GOV1, f"{G}：西南海域地熱流探測站", "ok",
  "data.gov.tw API：32493「93～96年度西南海域地熱流探測調查」、32559「97～100年度西南海域地熱流探測」、61129「101～104年度西南海域地熱流探測調查」，皆相符",
  note=f"另見 {DG}32559、{DG}61129",
  name_en="SW offshore heat-flow surveys 2004–2015", org_en="GSMMA", used_en="Geothermal map: heat-flow stations")
S("dataset", "火山災害潛勢圖（龜山島、大屯火山群七星山／大屯山／磺嘴山／竹子山亞群）", "經濟部地質調查及礦業管理中心",
  f"{DG}155680", "2024-08-06 更新", GOV1, f"{G}：火山災害潛勢", "ok",
  "data.gov.tw API：155680～155689、155691、155693～155701、162529～162543 共 35 筆，名稱皆為火山災害潛勢圖；155690、155692 查無資料集",
  note="env/volcano.js 原本寫「155680～155701」，其中 155690、155692 不存在，已改成逐段列出",
  name_en="Volcanic hazard potential maps (Guishan Island, Tatun volcano group)", org_en="GSMMA", used_en="Geothermal map: volcanic hazards")
dg("dataset", 176524, "115年度1753條土石流潛勢溪流圖", "農業部農村發展及水土保持署", "2026-08-24 更新",
   f"{G}：土石流潛勢溪流", "Geothermal map: debris-flow streams", "Debris-flow potential streams (2026)",
   "Agency of Rural Development and Soil and Water Conservation (ARDSWC), MOA")
S("dataset", "115年度94處大規模崩塌潛勢區、影響範圍", "農業部農村發展及水土保持署", f"{DG}176527", "2026-01-14 更新", GOV1,
  f"{G}：大規模崩塌潛勢", "ok", "data.gov.tw API：176527「115年度94處大規模崩塌潛勢區」、176528「…影響範圍」相符",
  note=f"另見 {DG}176528", name_en="94 large-scale landslide potential areas and impact zones (2026)", org_en="ARDSWC",
  used_en="Geothermal map: large-scale landslides")
dg("dataset", 178645, "115年度山坡地範圍圖(水保法、不含六都)", "農業部農村發展及水土保持署", "檔案日期 115-07-08",
   f"{A}、{G}：山坡地範圍", "Both maps: slopeland", "Slopeland map 2026 (excluding six municipalities)", "ARDSWC")
dg("dataset", 9928, "全臺保安林分布概略圖", "農業部林業及自然保育署", "1151 版（資料集 2026-05-27 更新）",
   f"{A}、{G}：保安林", "Both maps: protection forests", "Protection forest overview map",
   "Forestry and Nature Conservation Agency (FANCA), MOA",
   check=f"data.gov.tw API：9928 名稱相符，最新檔名「全臺保安林分布概略圖1151_SHP」，{GOV1}",
   note="網站英文版原寫「May 2026 edition」，與中文「1151 版」不一致，已改為 edition 1151")
S("dataset", "國土生態綠網圖資（分區、關注區域、保育軸帶、熱區、河川、獨流溪、埤塘、里山地景，共 8 種）", "農業部林業及自然保育署",
  "https://www.forest.gov.tw/0004767", "檔名標示 109 年 1–2 月、114 年 1 月", GOV1, f"{G}：國土生態綠網", "ok",
  "下載頁 HTTP 200，標題「圖資下載」",
  name_en="National ecological network GIS data (8 layers)", org_en="FANCA", used_en="Geothermal map: ecological network")
S("dataset", "國土生態綠網圖台「國家公園1091」圖層", "農業部林業及自然保育署", "https://mapportal.forest.gov.tw/",
  "2026-11-09 下載（109 年 1 月彙整版）", "未能確認", f"{G}：國家公園範圍", "fail",
  "HTTP 403（伺服器拒絕連線）", "連線被拒（HTTP 403）", "改以國家公園署「國家公園地理資訊圖層彙整」（data.gov.tw 174421）取得最新公告範圍；或在臺灣網路環境確認圖台",
  name_en="FANCA ecological-network map portal, national park layer", org_en="FANCA", used_en="Geothermal map: national parks")
dg("dataset", 174421, "國家公園地理資訊圖層彙整", "內政部國家公園署", "2026-04-24 更新", f"{G}：國家公園最新公告版本連結",
   "Geothermal map: link to latest national-park layers", "National park GIS layer index", "National Park Service, MOI")
dg("dataset", 7441, "鄉鎮市區界線(TWD97經緯度)", "內政部國土測繪中心", "以 taiwan-atlas 2021.9.20 轉檔取得",
   f"{A}、{G}：原住民族地區邊界、鄉鎮代表點", "Both maps: indigenous areas, township reference points",
   "Township boundaries (TWD97)", "NLSC", note="官方 SHP 下載點（TGOS）在雲端環境無法下載，改用 taiwan-atlas 套件的 1:10,000 簡化檔")
dg("dataset", 7093, "核定部落結果", "原住民族委員會", "資料日期 2026-09-18", f"{A}、{G}：原住民族部落",
   "Both maps: indigenous tribes", "Approved tribes", "Council of Indigenous Peoples (CIP)")
dg("dataset", 156632, "原住民族部落位置GIS點位表", "原住民族委員會", "2022-07-25 版", f"{A}、{G}：部落代表點",
   "Both maps: tribe reference points", "Tribe location points", "CIP")
dg("dataset", 145512, "台閩縣市鄉鎮市區原住民族人口-按性別族別", "原住民族委員會", "資料日期 2026-10-28",
   f"{A}、{G}：原住民族地區族別人口", "Both maps: population by group", "Indigenous population by township and group", "CIP")
dg("dataset", 33685, "原住民保留地範圍資訊", "原住民族委員會", "2026-11-09 下載", f"{A}、{G}：原住民保留地",
   "Both maps: indigenous reserved land", "Indigenous reserved land extent", "CIP")
dg("dataset", 45350, "歷年原住民族傳統領域調查成果範圍(91-98年)", "原住民族委員會", "2026-11-09 下載",
   f"{A}、{G}：傳統領域調查成果、傳統地名", "Both maps: traditional territory survey", "Traditional territory survey 2002–2009", "CIP")
dg("dataset", 8367, "臺灣地區國際商港貨物裝卸量", "臺灣港務股份有限公司", "2026-11-12 下載", f"{A}、{G}：國際商港",
   "Both maps: international ports", "International port cargo throughput", "Taiwan International Ports Corporation",
   note=f"貨櫃裝卸量另見 {DG}8368（臺灣地區國際商港貨櫃裝卸量，名稱相符）")
dg("dataset", 31915, "民航運輸各機場營運量－按機場分", "交通部民用航空局", "115 年 9 月版", f"{A}、{G}：民用機場",
   "Both maps: airports", "Airport traffic by airport", "Civil Aeronautics Administration (CAA)")
dg("dataset", 25598, "園管局各產業園區範圍圖", "經濟部產業園區管理局", "網站標示異動日期 2026-09-17（資料集 2026-07-13 更新）",
   f"{A}、{G}：工業區、其他工業區", "Both maps: industrial parks", "Industrial park boundaries", "Industrial Park Administration, MOEA")
S("dataset", "國有非公用不動產擬讓售房地資訊、預告標售不動產資訊、標租不動產資訊", "財政部國有財產署", f"{DG}9661",
  "2026-11-12 下載", GOV1, f"{A}、{G}：國產署土地", "ok",
  "data.gov.tw API：9661、13145、9656 名稱皆相符", note=f"另見 {DG}13145、{DG}9656",
  name_en="National Property Administration: parcels for sale, tender sale, tender lease", org_en="National Property Administration, MOF",
  used_en="Both maps: national property land")
dg("dataset", 25754, "台灣糖業公司可供出租土地資訊", "台灣糖業股份有限公司", "2026-11-12 下載", f"{A}、{G}：台糖土地",
   "Both maps: Taisugar land", "Taisugar land available for lease", "Taiwan Sugar Corporation")
dg("dataset", 161874, "台灣電力公司全國各縣市再生能源可併網容量", "台灣電力股份有限公司", "檔案日期 2026-10-30",
   f"{G}：台電饋線", "Geothermal map: Taipower feeders", "Renewable grid-connection capacity by county", "Taipower")
S("dataset", "台電可併網容量 ZIP 下載檔（d077009/001.zip）", "台灣電力股份有限公司",
  "https://service.taipower.com.tw/data/opendata/apply/file/d077009/001.zip", "2026-10-30", GOV1,
  f"{G}：台電饋線（tools/build_feeders.py 的下載來源）", "fail", "連線被對方重設（connection reset）",
  "連線被重設（疑似只允許臺灣 IP）", "在臺灣網路環境下載後放進 tools 處理；資料集頁 data.gov.tw/dataset/161874 可正常開啟",
  name_en="Taipower capacity ZIP download", org_en="Taipower", used_en="Geothermal map: Taipower feeders (download file)")
dg("dataset", 169538, "非都市土地使用分區圖（112年）", "內政部國土管理署", "資料集 2025-12-30 更新", f"{A}、{G}：非都市土地使用分區點查",
   "Both maps: non-urban zoning lookup", "Non-urban land zoning map (2023)", "National Land Management Agency (NLMA), MOI",
   note="網站原寫「內政部」，依資料集提供機關（nlma.gov.tw）改為「內政部國土管理署」")
dg("dataset", 25113, "非都市土地使用分區及使用地類別代碼", "內政部（地政司）", "2026-09-29 更新", f"{A}、{G}：分區與使用地名稱代碼",
   "Both maps: zoning and land-use codes", "Non-urban zoning and land-use codes", "Department of Land Administration, MOI")
dg("dataset", 156197, "臺北市都市計畫使用分區圖", "臺北市政府都市發展局", "2026-10-13 更新", f"{A}：都市計畫使用分區（臺北市）",
   "Architecture map: Taipei urban zoning", "Taipei urban plan zoning map", "Department of Urban Development, Taipei City Government")
S("dataset", "新北市都市計畫土地使用分區及範圍圖", "新北市政府城鄉發展局",
  "https://data.ntpc.gov.tw/datasets/fe26e0a5-54c2-4876-bbc7-150243c048f5", "", GOV1, f"{A}：都市計畫使用分區（新北市）", "ok",
  "新北市資料開放平臺頁面 HTTP 200，標題相符", name_en="New Taipei urban plan zoning map",
  org_en="Urban and Rural Development Department, New Taipei City Government", used_en="Architecture map: New Taipei urban zoning")
dg("dataset", 128228, "臺北市公有土地資料", "臺北市政府地政局", "檔案日期 2026-09-14", f"{A}：公有地（臺北市）",
   "Architecture map: Taipei public land", "Taipei public land register", "Department of Land Administration, Taipei City Government")
S("dataset", "臺北市土地筆數面積及公告土地現值統計（115 年檔，各行政區已辦竣所有權登記土地）", "臺北市政府地政局", "",
  "115 年", "未能確認", f"{A}：土地權屬（行政區統計）", "partial",
  "網站與程式未附網址；搜尋確認此資料集名稱存在（列於 data.gov.tw/dataset/121509 的相關資料集），但沒找到它自己的資料集編號",
  "未附網址，資料集編號對不上", "到 data.taipei 查出資料集頁網址後補上",
  name_en="Taipei land parcel and area statistics (2026)", org_en="Department of Land Administration, Taipei City Government",
  used_en="Architecture map: land ownership by district")
S("dataset", "國家文化資產網 開放資料（古蹟、歷史建築、聚落建築群、紀念建築，2,872 筆，含代表圖像）", "文化部文化資產局",
  "https://nchdb.boch.gov.tw/", "2026-11-07 下載", "未能確認（文資局開放資料授權本次未查到條文）",
  f"{A}：文化資產點位、照片與詳細頁連結", "ok",
  "國家文化資產網首頁 HTTP 200；抽樣 4 筆詳細頁與 3 張 data.boch.gov.tw 代表圖像皆 200",
  name_en="National Cultural Heritage Database open data (2,872 records)", org_en="Bureau of Cultural Heritage, Ministry of Culture",
  used_en="Architecture map: heritage points, photos and links")
S("dataset", "能源署「地熱發電單一服務窗口」國內地熱案場", "經濟部能源署", "https://ea01.moeaea.gov.tw/b0403/SupplyChainNew/Index",
  "2026-11-09 下載（網站更新日期 2026/10/27）", "依該網站「政府網站資料開放宣告」使用，須註明出處", f"{G}：現有地熱案場", "ok",
  "HTTP 200，標題「地熱發電單一服務窗口-Taiwan Geothermal Site-Project Classification」",
  name_en="Energy Administration geothermal one-stop window: domestic sites", org_en="Energy Administration, MOEA",
  used_en="Geothermal map: existing geothermal sites")
S("dataset", "工程地質探勘資料庫 鑽孔柱狀圖與基本資料", "經濟部地質調查及礦業管理中心", "https://geotech.gsmma.gov.tw/imoeagis/Home/Map",
  "", "未能確認", f"{G}：鑽孔柱狀圖", "ok", "HTTP 200，標題「工程地質探勘資料庫建置計畫」",
  name_en="GSMMA engineering geology database: borehole logs", org_en="GSMMA", used_en="Geothermal map: borehole logs")
S("dataset", "溫泉露頭資源網（geotex 水化學資料的原始出處欄位）", "經濟部地質調查及礦業管理中心（未能確認）",
  "http://210.69.81.175/SpringFront", "", "未能確認", f"{G}：大屯山區溫泉水化學（資料內 source 欄位）", "fail", "HTTP 403",
  "連線被拒（HTTP 403）", "這是地熱探勘資訊平臺資料本身附帶的出處欄位，網站沒有直接連過去；保留原文即可，不必修改",
  name_en="Hot spring outcrop resource site (source field inside GeoTEX data)", org_en="GSMMA (unconfirmed)",
  used_en="Geothermal map: Tatun hot-spring chemistry (source field)")
S("dataset", "原住民族地區溫泉服務網", "原住民族委員會（嘉南藥理大學執行）", "https://apc.cnu.edu.tw/", "", "未能確認",
  f"{G}：溫泉露頭彈出視窗的外部連結", "ok", "HTTP 200，標題「原住民族地區溫泉服務網」（第一次測試連線被重設，重試成功）",
  name_en="Indigenous-area hot spring service site", org_en="CIP (run by Chia Nan University of Pharmacy & Science)",
  used_en="Geothermal map: link in hot-spring popups")
S("dataset", "飛航指南 eAIP（機場基準點與跑道）", "交通部民用航空局", "https://ais.caa.gov.tw/eaip/", "AIRAC AMDT 05-26，2026-10-29 生效",
  "未能確認", f"{A}、{G}：民用機場位置與跑道", "ok", "HTTP 200，標題「eAIP R.O.C. Taiwan CAA」；AMDT 版次未逐頁核對",
  name_en="CAA eAIP (aerodrome reference points, runways)", org_en="CAA", used_en="Both maps: airport positions and runways")

# ---------------- 法規與官方文件 ----------------
S("doc", "國土利用現況調查辦法 附表一「土地利用分級分類系統表（陸域部分）」", "內政部（108 年 3 月 28 日發布）",
  "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070276", "108-03-28", "法規（著作權法第 9 條不得為著作權標的）",
  f"{A}、{G}：國土利用分類說明", "ok", "全國法規資料庫 HTTP 200，標題「國土利用現況調查辦法-全國法規資料庫」",
  name_en="Land Use Survey Regulations, Table 1", org_en="Ministry of the Interior", used_en="Both maps: land-use class descriptions")
S("doc", "區域計畫法施行細則 第 11 條（非都市土地使用分區定義）", "內政部", "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070031",
  "", "法規", f"{A}、{G}：非都市分區定義", "ok", "全國法規資料庫 HTTP 200，法規名稱相符，第 11 條各款文字與網站引用一致",
  name_en="Enforcement Rules of the Regional Plan Act, Art. 11", org_en="MOI", used_en="Both maps: non-urban zone definitions")
S("doc", "都市計畫法 第 32～38、42 條（都市計畫分區定義）", "內政部", "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0070001",
  "", "法規", f"{A}、{G}：都市計畫分區定義", "ok", "全國法規資料庫 HTTP 200，法規名稱相符，各條文字與網站引用一致",
  name_en="Urban Planning Act, Arts. 32–38 and 42", org_en="MOI", used_en="Both maps: urban zone definitions")
S("doc", "都市計畫土地使用分區面積編製說明（河川區定義）", "內政部國土管理署", "https://www.nlma.gov.tw/", "", "未能確認",
  f"{A}、{G}：河川區定義", "partial",
  "搜尋找到國土管理署網站上的編製說明 PDF，內容含「河川區：依水利法公告之河川治理計畫範圍內之土地」；直接下載時伺服器回傳 HTML 擋頁",
  "直接下載被擋（回傳 HTML）", "補上 PDF 的確切網址（例如 www.nlma.gov.tw/uploads/files/… ），在臺灣網路環境確認",
  name_en="NLMA notes on urban zoning area statistics (river zone)", org_en="NLMA", used_en="Both maps: river zone definition")
S("doc", "原住民地區 55 個鄉（鎮、市、區）名單（行政院 91 年 4 月 16 日院臺疆字第 0910017300 號函核定）", "原住民族委員會",
  "https://www.cip.gov.tw/", "91-04-16", "未能確認", f"{A}、{G}：原住民族地區", "partial",
  "原民會首頁 HTTP 200（第一次連線被重設，重試成功）；搜尋確認 55 個原住民地區（30 山地、25 平地），但查不到這個函號的原文",
  "函號原文查無", "到原民會網站或行政院公報查函號原文後補連結",
  name_en="List of 55 indigenous areas (Executive Yuan approval, 16 Apr 2002)", org_en="CIP", used_en="Both maps: indigenous areas")
S("doc", "國土測繪圖資服務雲", "內政部國土測繪中心", "https://maps.nlsc.gov.tw/", "", "未能確認",
  "使用地類別圖例截圖的出處", "ok", "HTTP 200，標題「國土測繪圖資服務雲」",
  name_en="NLSC map service cloud", org_en="NLSC", used_en="Source of the land-use legend screenshot")
S("doc", "地籍圖資便民系統", "內政部地政司", "https://easymap.land.moi.gov.tw/", "", "未能確認",
  f"{A}：建築卡片的外部連結", "fail", "連線被對方重設（加入允許清單後仍然一樣）",
  "連線被重設（疑似只允許臺灣 IP）", "在臺灣網路環境用瀏覽器確認連結；網址本身是官方首頁，通常不用改",
  name_en="Cadastral map service (EasyMap)", org_en="Department of Land Administration, MOI", used_en="Architecture map: external link")
S("doc", "臺北市地籍套繪都市計畫使用分區圖查詢", "臺北市政府都市發展局", "https://zonemap.udd.gov.taipei/ZoneMapOP/", "", "未能確認",
  f"{A}：臺北市建築卡片的外部連結", "ok", "HTTP 200，標題「地籍套繪都市計畫使用分區圖」",
  name_en="Taipei zoning lookup", org_en="Department of Urban Development, Taipei", used_en="Architecture map: external link")
S("doc", "國產署便民服務業務網", "財政部國有財產署", "https://esvc.fnp.gov.tw/", "", "未能確認", f"{A}、{G}：國產署土地說明的連結", "ok",
  "HTTP 200，標題「國有財產署-便民服務業務網」（第一次連線被重設，重試成功）",
  name_en="NPA online services", org_en="National Property Administration", used_en="Both maps: link")
S("doc", "台灣糖業公司官網", "台灣糖業股份有限公司", "https://www.taisugar.com.tw/", "", "", f"{A}、{G}：台糖土地說明的連結", "ok",
  "HTTP 200，標題「台灣糖業股份有限公司官網」", name_en="Taisugar website", org_en="Taiwan Sugar Corporation", used_en="Both maps: link")
S("doc", "非都市土地使用分區與使用地相關資訊（Z2060）", "內政部", "https://pip.moi.gov.tw/Publicize/Info/Z2060", "", "未能確認",
  "docs/reference/README.md 的相關連結", "fail", "HTTP 200 但內容是「Request Rejected」擋頁",
  "連線被拒（Request Rejected）", "在臺灣網路環境用瀏覽器確認內容；若頁面已移除就刪掉這個連結",
  name_en="MOI page Z2060", org_en="MOI", used_en="docs/reference/README.md")
S("doc", "全國土地使用分區資料查詢系統 法規內容（FL003673）", "內政部", "https://glrs.moi.gov.tw/LawContent.aspx?id=FL003673", "",
  "未能確認", "docs/reference/README.md 提到的查證紀錄", "fail", "連線被對方重設", "連線被重設（疑似只允許臺灣 IP）",
  "在臺灣網路環境確認 FL003673 對應的法規名稱",
  name_en="MOI land law database item FL003673", org_en="MOI", used_en="docs/reference/README.md")

# ---------------- 文獻（地熱資源量評估頁） ----------------
LIT = [
    ("muffler1978", "Muffler, P., & Cataldi, R. (1978). Methods for regional assessment of geothermal resources. Geothermics, 7(2–4), 53–89.",
     "https://doi.org/10.1016/0375-6505(78)90002-0", "ok", "Crossref：題名、作者、期刊、卷 7、頁 53–89、1978 皆相符",
     "孔隙型、裂隙型：體積法（熱蓄量 heat in place）", "Porous, fractured: volumetric (heat in place)"),
    ("muffler1979", "Muffler, L.J.P. (Ed.) (1979). Assessment of geothermal resources of the United States—1978. U.S. Geological Survey Circular 790.",
     "https://doi.org/10.3133/cir790", "ok", "Crossref 與 USGS Publications Warehouse（pubs.usgs.gov/publication/cir790）相符；PDF 封面確認",
     "孔隙型、裂隙型：體積法與回收率", "Porous, fractured: volumetric method and recovery factor"),
    ("williams2008", "Williams, C.F., Reed, M.J., & Mariner, R.H. (2008). A review of methods applied by the U.S. Geological Survey in the assessment of identified geothermal resources. U.S. Geological Survey Open-File Report 2008-1296.",
     "https://doi.org/10.3133/ofr20081296", "ok", "Crossref 與 pubs.usgs.gov/publication/ofr20081296 相符",
     "孔隙型、裂隙型：可用熱能（exergy）、利用效率與蒙地卡羅", "Porous, fractured: exergy, utilization efficiency, Monte Carlo"),
    ("garg2015", "Garg, S.K., & Combs, J. (2015). A reformulation of USGS volumetric “heat in place” resource estimation method. Geothermics, 55, 150–158.",
     "https://doi.org/10.1016/j.geothermics.2015.02.004", "ok", "Crossref：題名、作者、卷 55、頁 150–158 相符",
     "孔隙型、裂隙型：體積法的可用熱能改寫", "Porous, fractured: exergy-based reformulation"),
    ("zarrouk2014", "Zarrouk, S.J., & Moon, H. (2014). Efficiency of geothermal power plants: A worldwide review. Geothermics, 51, 142–153.",
     "https://doi.org/10.1016/j.geothermics.2013.11.001", "ok", "Crossref：題名、作者、卷 51、頁 142–153 相符",
     "四種類型：轉換效率 ηc", "All types: conversion efficiency"),
    ("wilmarth2015", "Wilmarth, M., & Stimac, J. (2015). Power density in geothermal fields. Proceedings World Geothermal Congress 2015, Melbourne, Australia, 19–25 April 2015.",
     "https://pangea.stanford.edu/ERE/db/WGC/papers/WGC/2015/16020.pdf", "partial",
     "網路搜尋找到 WGC 2015 論文庫的 PDF（16020.pdf）與多篇引用（含頁 1–7）；雲端環境下載 PDF 時伺服器憑證鏈不完整，沒能直接開檔核對",
     "孔隙型、裂隙型：功率密度法", "Porous, fractured: power density"),
    ("mit2006", "Massachusetts Institute of Technology (2006). The Future of Geothermal Energy: Impact of Enhanced Geothermal Systems (EGS) on the United States in the 21st Century. OSTI 1220063.",
     "https://doi.org/10.2172/1220063", "ok", "Crossref 與 OSTI 頁面（osti.gov/biblio/1220063）題名相符",
     "EGS：增產體積的熱回收與溫降", "EGS: heat recovery from the stimulated volume"),
    ("sanyal2005", "Sanyal, S.K., Granados, E.E., Butler, S.J., & Horne, R.N. (2005). An analysis of power generation prospects from enhanced geothermal systems. Geothermal Resources Council Transactions, 29.",
     "", "partial", "GRC Transactions 第 29 卷目錄（proceedings.com）與 SLB 技術論文頁列出此文；沒有 DOI，全文需付費，沒能直接核對頁碼",
     "EGS：可回收熱量比例（掃熱比例）", "EGS: recoverable heat fraction"),
    ("beckers2022", "Beckers, K.F., Rangel-Jurado, N., Chandrasekar, H., Hawkins, A.J., Fulton, P.M., & Tester, J.W. (2022). Techno-economic performance of closed-loop geothermal systems for heat production and electricity generation. Geothermics, 100, 102318.",
     "https://doi.org/10.1016/j.geothermics.2021.102318", "ok", "Crossref：題名、六位作者、卷 100、文章號 102318 皆相符",
     "AGS：封閉迴路取熱", "AGS: closed-loop heat extraction"),
    ("malek2022", "Malek, A.E., Adams, B.M., Rossi, E., Schiegg, H.O., & Saar, M.O. (2022). Techno-economic analysis of Advanced Geothermal Systems (AGS). Renewable Energy, 186, 927–943.",
     "https://doi.org/10.1016/j.renene.2022.01.012", "ok", "Crossref：題名、作者、卷 186、頁 927–943 相符",
     "AGS：單位長度取熱與發電", "AGS: heat per unit length and power"),
]
for key, cite, url, st, chk, used, used_en in LIT:
    S("lit", cite, "", url, "", "", f"{R}：{used}", st, chk,
      "" if st == "ok" else ("全文無法在此環境取得" if st == "partial" else ""),
      "" if st == "ok" else "取得全文核對頁碼與內容", name_en=cite, used_en=f"Resource assessment: {used_en}", cite=key)
S("lit", "Sanyal, S.K., & Sarmiento, Z.F. (2005). Booking geothermal energy reserves. Geothermal Resources Council Transactions, 29.",
  "", "", "", "", "（候選文獻，未放進網站）P90／P10 機率級距的資源量分級", "fail",
  "只找到其他論文的二手引用，找不到原文或目錄記錄", "查無此文獻原文", "取得 GRC 圖書館原文後再決定是否引用",
  name_en="Sanyal & Sarmiento (2005), Booking geothermal energy reserves", used_en="(candidate, not cited on the site)", cite="sanyal_sarmiento2005")

# ---------------- 新聞與業者資料（地熱案場電廠資訊） ----------------
NEWS = [
    ("環境資訊中心", "溫泉業者和地熱業者當鄰居——搶水還是共存？在金崙看見能源轉型進行式", "https://e-info.org.tw/node/241043", "ok"),
    ("漢力能源科技", "ORC 實績（2025 年 6 月版 PDF）", "https://www.hanpower.com.tw/product/36/download/file?name=file2", "ok"),
    ("ThinkGeoEnergy", "5.4-MW Yilan Tuchang geothermal power plant in Taiwan starts electricity generation", "https://www.thinkgeoenergy.com/5-4-mw-yilan-tuchang-geothermal-power-plant-in-taiwan-starts-electricity-generation/", "ok"),
    ("NOWnews", "淨零密碼／6年磨一劍 中油土場地熱電廠農曆年前順利發功", "https://www.nownews.com/news/6785907", "ok"),
    ("Focus Taiwan", "Geothermal power plant inaugurated in Yilan", "https://focustaiwan.tw/politics/202310240017", "ok"),
    ("ThinkGeoEnergy", "Taipower inaugurates Renze geothermal power plant in Yilan County, Taiwan", "https://www.thinkgeoenergy.com/taipower-inaugurates-renze-geothermal-power-plant-in-yilan-county-taiwan/", "ok"),
    ("科技新報", "台灣首座深層地熱井落腳宜蘭，為綠能開發寫新頁", "https://technews.tw/2024/10/27/yilan-geothermal-well/", "ok"),
    ("關鍵評論網", "（清水地熱相關報導，標題未能確認）", "https://www.thenewslens.com/article/159288", "fail"),
    ("ThinkGeoEnergy", "Start of 4.2 MW Quingshui geothermal plant imminent in Taiwan", "https://www.thinkgeoenergy.com/start-of-4-2-mw-quingshui-geothermal-plant-imminent-in-taiwan/", "ok"),
    ("數位時代", "直擊｜全台首座火山地熱電廠，熬4年開始供電！將捷集團怎麼讓火山也能發電？", "https://www.bnext.com.tw/article/77514/-fabulous-group-volcanic-geothermal-", "ok"),
    ("天下雜誌", "（大屯山四磺子坪火山地熱電廠報導）", "https://www.cw.com.tw/article/5127550", "partial"),
    ("科技新報", "全國首座火山型地熱開發案，估計年發電量達 16 億度", "https://technews.tw/2025/01/02/the-countrys-first-volcanic-geothermal-development-project/", "ok"),
    ("NOWnews", "以技術撬動難開發的大屯火山 結元能源設全台首座火山型地熱電廠", "https://www.nownews.com/news/6603956", "ok"),
    ("科技新報", "專訪》地熱從示範走向產業化，結元能源拚 2030 年開發 40 MW", "https://technews.tw/?p=1619194", "ok"),
    ("鉅亨網", "台泥台東地熱發電廠2024年底商轉 攜雲品打造綠能園區", "https://news.cnyes.com/news/id/4941470", "ok"),
]
for org, title, url, st in NEWS:
    chk = {"ok": "HTTP 200，頁面標題與報導相符" + ("（PDF 42 頁，內容含清水、地熱）" if "hanpower" in url else ""),
           "partial": "Cloudflare 擋自動連線（HTTP 403）；網路搜尋確認此網址為天下雜誌報導，主題是結元能源四磺子坪 1 MW 先導地熱電廠（付費文章）",
           "fail": "Cloudflare 擋自動連線（HTTP 403）；網路搜尋找不到這篇文章"}[st]
    S("news", title, org, url, "", "依各媒體著作權規定（只連結，不轉載）", f"{G}：地熱案場的電廠資訊出處", st, chk,
      {"ok": "", "partial": "Cloudflare 擋連線（HTTP 403）", "fail": "Cloudflare 擋連線（HTTP 403）、搜尋查無"}[st],
      {"ok": "", "partial": "用瀏覽器開啟確認標題後補進清單", "fail": "用瀏覽器開啟確認標題與內容；確認不到就換成其他可查證的報導"}[st],
      name_en=title, org_en=org, used_en="Geothermal map: power-plant facts for geothermal sites")

# ---------------- 使用者提供 ----------------
S("user", "井位.kmz（結元公司鑽井、四磺子坪地區、馬槽地區）", "使用者提供", "", "", "未能確認", f"{G}：水井、探勘井圖層", "user",
  "原始 KMZ 為使用者提供，沒有公開網址", name_en="井位.kmz well locations", org_en="User-supplied", used_en="Geothermal map: wells")
S("user", "井位圖片（imgur 34 張）", "使用者提供（存放於 imgur）", "https://i.imgur.com/", "", "未能確認", f"{G}：井位彈出視窗圖片", "ok",
  "34 張全部 HTTP 200（image/png）", name_en="Well images on imgur (34)", org_en="User-supplied (hosted on imgur)", used_en="Geothermal map: well popups")
S("user", "井位報告短網址 bit.ly/36Yug8J → 台灣中油「台北縣金山秀磺坪一號地熱井鑽井地質簡報及週報」PDF", "台灣中油（未能確認）",
  "https://bit.ly/36Yug8J", "", "未能確認", f"{G}：井位彈出視窗的報告連結", "fail",
  "bit.ly 轉址到 http://www3.cpc.com.tw/opendata_b00/地熱井報告/大屯山/…pdf；www3.cpc.com.tw 加入允許清單後 DNS 仍查無此主機",
  "目標網域無法解析（疑似已停用）", "向中油或使用者確認報告現在的網址；找不到就在網站上註明連結失效",
  name_en="bit.ly/36Yug8J → CPC geothermal well report (PDF)", org_en="CPC Corporation (unconfirmed)", used_en="Geothermal map: report link")
S("user", "井位報告短網址 bit.ly/3lBOt8e → 台灣中油「台北縣金山地熱區金山一號地熱探井地下地質報告」PDF", "台灣中油（未能確認）",
  "https://bit.ly/3lBOt8e", "", "未能確認", f"{G}：井位彈出視窗的報告連結", "fail",
  "同上，轉址目標 www3.cpc.com.tw 無法解析", "目標網域無法解析（疑似已停用）", "同上",
  name_en="bit.ly/3lBOt8e → CPC geothermal well report (PDF)", org_en="CPC Corporation (unconfirmed)", used_en="Geothermal map: report link")
S("user", "精選建築清單（臺北與全臺當代、近代建築，人工整理，座標為約略位置）", "專案整理", "", "", "", f"{A}：精選建築", "fail",
  "程式內沒有逐筆附出處", "未附出處", "逐筆補上出處（建築師事務所、官方介紹或文化資產網）",
  name_en="Featured buildings list (hand-compiled)", org_en="Compiled for this project", used_en="Architecture map: featured buildings")
S("user", "地震目錄 CSV（2000-01-01～2025-03-01，69 萬筆）", "交通部中央氣象署地震測報中心（使用者下載）", "", "2000–2025", "未能確認",
  f"{G}：地震目錄", "user", "原始檔由使用者自氣象署下載，網站與程式未附下載網址",
  name_en="CWA earthquake catalogue CSV (user download)", org_en="CWA Seismological Center (downloaded by the user)", used_en="Geothermal map: earthquakes")
S("user", "GEO2010 鑽探資料 MDB（工程地質探勘資料庫系統）", "經濟部地質調查及礦業管理中心（使用者提供）", "", "", "未能確認",
  f"{G}：鑽孔柱狀圖（有 source 欄的孔）", "user", "使用者提供的 Access 資料庫，tools/import_geo2010.py 匯入",
  name_en="GEO2010 borehole MDB", org_en="GSMMA (user-supplied)", used_en="Geothermal map: borehole logs")
S("user", "地熱案場座標與結元硫磺子坪（規劃中）", "使用者提供（2026-11-09）", "", "2026-11-09", "",
  f"{G}：現有地熱案場", "user", "座標逐點用國土測繪中心單點坐標 API 反查，確認落在能源署所列鄉鎮",
  name_en="Geothermal site coordinates (user-supplied)", org_en="User-supplied", used_en="Geothermal map: geothermal sites")
S("user", "109 年版國土利用現況調查成果分類色碼表（截圖與 CSV 轉錄）", "內政部國土測繪中心（使用者提供截圖）", "", "", "未能確認",
  f"{A}、{G}：國土利用分類顏色", "user", "docs/reference 內的截圖與人工轉錄 CSV；顏色已與 LUIMAP 圖磚逐一比對",
  name_en="2020 land-use colour table (screenshot)", org_en="NLSC (screenshot supplied by the user)", used_en="Both maps: land-use colours")
S("user", "都市計畫統一圖例、非都市土地編定原則表、104 年版土地使用分類系統表、非都市使用地類別圖例截圖", "內政部（使用者提供 PDF／截圖）",
  "", "", "未能確認", "圖例與分類參考（docs/reference）", "user", "使用者提供的公開文件，放在 docs/reference",
  name_en="Urban plan legend, non-urban zoning rules, legend screenshots", org_en="MOI (documents supplied by the user)", used_en="Legend references")

# ---------------- 程式庫 ----------------
for name, ver, lic, url, used in [
    ("Leaflet", "1.9.4", "BSD-2-Clause", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js", f"{A}、{G}"),
    ("Leaflet.markercluster", "1.5.3", "MIT", "https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js", A),
    ("MapLibre GL JS", "4.7.1", "BSD-3-Clause", "https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js", f"{A}、{G}"),
    ("maplibre-gl-leaflet", "0.0.22", "ISC", "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js", f"{A}、{G}"),
    ("maplibre-contour", "0.1.0", "BSD-3-Clause", "https://unpkg.com/maplibre-contour@0.1.0/dist/index.min.js", G),
    ("TopoJSON", "3.0.2", "BSD-3-Clause", "https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js", A),
    ("taiwan-atlas（鄉鎮、村里界 1:10,000 轉檔）", "2021.9.20", "MIT", "https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/towns-10t.json", f"{A}、{G}"),
    ("html-to-image", "1.11.13", "MIT", "https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.13/html-to-image.min.js", f"{A}、{G}"),
    ("JSZip", "3.10.1", "MIT 或 GPL-3.0-or-later", "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", f"{A}、{G}"),
    ("SheetJS（xlsx）", "0.18.5", "Apache-2.0", "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", f"{A}、{G}"),
    ("Chart.js", "4.4.1", "MIT", "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js", R),
    ("@anthropic-ai/sdk", "1.3.0", "Apache-2.0", "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm", f"{A}、{G}（對話功能）"),
    ("Google Fonts：Noto Sans TC、Noto Serif TC、IBM Plex Mono", "", "SIL Open Font License 1.1（未逐一核對字型頁）", "https://fonts.googleapis.com/css2?family=Noto+Sans+TC", f"{I}、{A}、{G}、{R}"),
]:
    S("lib", f"{name} {ver}".strip(), "", url, "", lic, used, "ok",
      "CDN HTTP 200" + ("；授權取自套件 package.json" if "Google" not in name else ""), used_en=used)

# 用途英文：沒寫的就沿用中文
EN_MAP = {A: "Architecture map", G: "Geothermal map", I: "Home page", R: "Resource assessment"}
for i, s in enumerate(SRC, 1):
    s["id"] = f"S{i:03d}"
    if s["used_en"] == s["used"]:
        u = s["used"]
        for k, v in EN_MAP.items(): u = u.replace(k, v)
        s["used_en"] = u.replace("、", ", ").replace("（對話功能）", " (chat)")

def main():
    cnt = {k: sum(1 for s in SRC if s["status"] == k) for k in ST}
    meta = {"checked": CHECKED, "total": len(SRC), "count": cnt,
            "cats": [{"k": k, "zh": z, "en": e} for k, z, e in CATS],
            "status": {k: {"zh": z, "en": e} for k, (z, e) in ST.items()}}
    out = {"meta": meta, "sources": SRC}
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    with open(os.path.join(ROOT, "docs", "sources.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, "sources-data.js"), "w", encoding="utf-8") as f:
        f.write("// 資料來源與參考文獻清單（由 tools/build_sources.py 產生，請改那支程式，不要直接改這個檔）\n")
        f.write("window.SOURCES=" + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")

    # Excel 與 CSV：只收 partial／fail；使用者提供（無公開網址）另一張工作表
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter
    catname = {k: z for k, z, _ in CATS}
    head = ["編號", "類別", "名稱", "發布機關／作者", "網址", "在網站上的用途", "查證狀態", "失敗原因", "建議處理方式", "備註"]
    def row(s):
        return [s["id"], catname[s["cat"]], s["name"], s["org"], s["url"], s["used"], ST[s["status"]][0],
                s["fail"], s["suggest"], "；".join(x for x in [s["check"], s["note"]] if x)]
    bad = [s for s in SRC if s["status"] in ("partial", "fail")]
    usr = [s for s in SRC if s["status"] == "user"]
    wb = Workbook()
    ws = wb.active; ws.title = "無法存取或未能確認"
    ws2 = wb.create_sheet("使用者提供（無公開網址）")
    ws3 = wb.create_sheet("說明")
    widths = [8, 14, 44, 24, 44, 30, 14, 26, 40, 60]
    hfill = PatternFill("solid", fgColor="22313F")
    for w, rows in ((ws, bad), (ws2, usr)):
        w.append(head)
        for c in w[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = hfill; c.alignment = Alignment(vertical="center", wrap_text=True)
        for s in rows:
            w.append(row(s))
            if s["url"]:
                c = w.cell(row=w.max_row, column=5); c.hyperlink = s["url"]; c.font = Font(color="1F6FB5", underline="single")
        for i, wd in enumerate(widths, 1): w.column_dimensions[get_column_letter(i)].width = wd
        for r in w.iter_rows(min_row=2):
            for c in r: c.alignment = Alignment(vertical="top", wrap_text=True)
        w.freeze_panes = "C2"; w.auto_filter.ref = w.dimensions
    for line in [
        "臺灣地圖集：無法存取或未能確認的參考資料",
        f"查證日期：{CHECKED}；全部來源 {len(SRC)} 筆：已查證 {cnt['ok']}、部分確認 {cnt['partial']}、無法存取／未能確認 {cnt['fail']}、使用者提供（無公開網址）{cnt['user']}。",
        "部分確認：來源存在（網路搜尋或二手資料可證），但這次沒能直接連上原網址或取得全文。",
        "無法存取／未能確認：連線被拒、對方重設連線、網域無法解析，或查不到這份文獻／文章。",
        "連線測試在雲端環境進行（美國 IP），部分政府網站只允許臺灣 IP，需在臺灣網路環境再確認一次。",
        "完整清單：docs/sources.json；網站頁面：sources.html；產生程式：tools/build_sources.py。",
    ]:
        ws3.append([line])
    ws3.column_dimensions["A"].width = 110; ws3["A1"].font = Font(bold=True, size=13)
    xl = os.path.join(ROOT, "docs", "reference", "無法存取的參考資料.xlsx")
    wb.save(xl)
    with open(xl[:-5] + ".csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f); w.writerow(head); [w.writerow(row(s)) for s in bad]
    print(f"{len(SRC)} 筆：", {ST[k][0]: v for k, v in cnt.items()})

if __name__ == "__main__":
    main()
