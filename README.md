# 臺灣建築地圖／臺灣地熱地圖

Different map layer in Taiwan.

兩張以 Leaflet 製作的互動地圖，共用 `app.js` 與 `app.css`。

- `taiwan-architecture.html`：臺灣建築地圖（精選建築＋國家文化資產網的古蹟與歷史建築、臺北市地號查詢、土地權屬統計）
- `taiwan-geothermal.html`：臺灣地熱地圖（地熱探勘資訊平臺 92 組開放資料，可匯出 KML）

兩張地圖都可以切換中文／English，也能匯入 Excel／CSV 點位。

## 本機執行

```
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1
```

然後打開 http://localhost:8765 。

## 資料來源

- 底圖與圖資：內政部國土測繪中心 WMTS
- 文化資產：文化部文化資產局 國家文化資產網開放資料（2026-11-07 下載）
- 地熱：經濟部地質調查及礦業管理中心「地熱探勘資訊平臺」第一類開放資料（2026-11-07 下載）
- 臺北市公有土地資料、土地筆數面積統計：臺北市政府地政局（data.taipei）
- 向量底圖：OpenFreeMap／OpenStreetMap
