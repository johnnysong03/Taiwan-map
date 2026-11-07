// 「海軍藍」向量底圖樣式：白底、深藍水域、灰藍綠地、珊瑚色主要道路
// 資料：OpenFreeMap（OpenStreetMap 貢獻者），OpenMapTiles 圖層結構
(function(){
  const C = {
    land:"#f5f5f3", water:"#2e3d4f", park:"#5f6f84", wood:"#6b7a8d", building:"#e6e6e3",
    hwy:"#e8836a", hwyCase:"#d9705a", major:"#ffffff", majorCase:"#d4d7db", minor:"#e2e3e5",
    rail:"#c4c7cc", text:"#2a2f37", textSoft:"#4b5260", halo:"#ffffff", waterText:"#c9d3df"
  };
  const name = ["coalesce", ["get","name:zh-Hant"], ["get","name"], ["get","name:latin"]];
  const font = ["Noto Sans Regular"], bold = ["Noto Sans Bold"], ital = ["Noto Sans Italic"];
  const z = (...stops) => ["interpolate", ["exponential", 1.5], ["zoom"], ...stops];
  const cls = (...c) => ["match", ["get","class"], c, true, false];

  window.NAVY_STYLE = {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
    layers: [
      { id:"bg", type:"background", paint:{ "background-color":C.land } },
      { id:"wood", type:"fill", source:"omt", "source-layer":"landcover", filter:cls("wood","forest"),
        paint:{ "fill-color":C.wood, "fill-opacity":["interpolate",["linear"],["zoom"],8,.25,13,.55] } },
      { id:"grass", type:"fill", source:"omt", "source-layer":"landcover", filter:cls("grass"),
        paint:{ "fill-color":C.park, "fill-opacity":.45 } },
      { id:"park", type:"fill", source:"omt", "source-layer":"park",
        paint:{ "fill-color":C.park, "fill-opacity":.85 } },
      { id:"landuse-misc", type:"fill", source:"omt", "source-layer":"landuse", filter:cls("cemetery","stadium","pitch","school","university","hospital"),
        paint:{ "fill-color":"#e9eaec" } },
      { id:"water", type:"fill", source:"omt", "source-layer":"water", paint:{ "fill-color":C.water } },
      { id:"waterway", type:"line", source:"omt", "source-layer":"waterway",
        paint:{ "line-color":C.water, "line-width":z(8,.6,16,4) } },
      { id:"building", type:"fill", source:"omt", "source-layer":"building", minzoom:14,
        paint:{ "fill-color":C.building, "fill-outline-color":"#dadad6" } },

      { id:"rail", type:"line", source:"omt", "source-layer":"transportation", filter:cls("rail","transit"),
        paint:{ "line-color":C.rail, "line-width":z(10,.6,16,2), "line-dasharray":[3,2] } },
      { id:"road-minor", type:"line", source:"omt", "source-layer":"transportation", minzoom:12,
        filter:cls("minor","service","track","path"),
        layout:{ "line-cap":"round","line-join":"round" },
        paint:{ "line-color":C.minor, "line-width":z(12,.5,16,4,18,10) } },
      { id:"road-major-case", type:"line", source:"omt", "source-layer":"transportation", minzoom:10,
        filter:cls("secondary","tertiary"),
        layout:{ "line-cap":"round","line-join":"round" },
        paint:{ "line-color":C.majorCase, "line-width":z(10,1,16,9,18,20) } },
      { id:"road-major", type:"line", source:"omt", "source-layer":"transportation", minzoom:10,
        filter:cls("secondary","tertiary"),
        layout:{ "line-cap":"round","line-join":"round" },
        paint:{ "line-color":C.major, "line-width":z(10,.6,16,7,18,17) } },
      { id:"road-primary", type:"line", source:"omt", "source-layer":"transportation", minzoom:8,
        filter:cls("primary"),
        layout:{ "line-cap":"round","line-join":"round" },
        paint:{ "line-color":C.hwy, "line-opacity":.75, "line-width":z(8,.6,12,1.6,16,8,18,18) } },
      { id:"road-hwy", type:"line", source:"omt", "source-layer":"transportation",
        filter:cls("motorway","trunk"),
        layout:{ "line-cap":"round","line-join":"round" },
        paint:{ "line-color":C.hwy, "line-width":z(6,.8,12,3,16,11,18,22) } },
      { id:"bridge-outline", type:"line", source:"omt", "source-layer":"transportation", minzoom:13,
        filter:["all", ["==",["get","brunnel"],"bridge"], cls("motorway","trunk","primary")],
        paint:{ "line-color":C.hwyCase, "line-width":z(13,1,18,3), "line-gap-width":z(13,3,16,8,18,18) } },

      { id:"water-name", type:"symbol", source:"omt", "source-layer":"water_name",
        filter:["==",["geometry-type"],"Point"],
        layout:{ "text-field":name, "text-font":ital, "text-size":13 },
        paint:{ "text-color":C.waterText } },
      { id:"water-name-line", type:"symbol", source:"omt", "source-layer":"water_name",
        filter:["==",["geometry-type"],"LineString"],
        layout:{ "text-field":name, "text-font":ital, "text-size":13, "symbol-placement":"line" },
        paint:{ "text-color":C.waterText } },
      { id:"road-name", type:"symbol", source:"omt", "source-layer":"transportation_name", minzoom:13,
        filter:cls("motorway","trunk","primary","secondary","tertiary"),
        layout:{ "text-field":name, "text-font":font, "symbol-placement":"line", "text-size":z(13,11,17,14), "text-max-angle":30 },
        paint:{ "text-color":C.textSoft, "text-halo-color":C.halo, "text-halo-width":1.6 } },
      { id:"poi-park", type:"symbol", source:"omt", "source-layer":"poi", minzoom:14,
        filter:cls("park","attraction","museum","place_of_worship","college","school","town_hall"),
        layout:{ "text-field":name, "text-font":font, "text-size":12, "text-max-width":8 },
        paint:{ "text-color":C.textSoft, "text-halo-color":C.halo, "text-halo-width":1.4 } },
      { id:"place-small", type:"symbol", source:"omt", "source-layer":"place", minzoom:12,
        filter:cls("neighbourhood","quarter","suburb","hamlet"),
        layout:{ "text-field":name, "text-font":bold, "text-size":z(12,12,16,15), "text-letter-spacing":.12, "text-max-width":7 },
        paint:{ "text-color":C.textSoft, "text-halo-color":C.halo, "text-halo-width":1.8 } },
      { id:"place-town", type:"symbol", source:"omt", "source-layer":"place",
        filter:cls("town","village"),
        layout:{ "text-field":name, "text-font":font, "text-size":z(9,13,14,19), "text-max-width":7 },
        paint:{ "text-color":C.text, "text-halo-color":C.halo, "text-halo-width":2 } },
      { id:"place-city", type:"symbol", source:"omt", "source-layer":"place",
        filter:cls("city"),
        layout:{ "text-field":name, "text-font":font, "text-size":z(7,16,13,30) },
        paint:{ "text-color":C.text, "text-halo-color":C.halo, "text-halo-width":2.2 } }
    ]
  };
})();
