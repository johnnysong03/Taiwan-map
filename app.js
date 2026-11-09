const APP=document.body.dataset.app||"arch"; // arch = 臺灣建築地圖, geo = 臺灣地熱地圖
// 手機版（螢幕寬度 760px 以下）：地圖全螢幕，側欄變成底部拉板，狀態有 peek（收合）、half（半開）、full（全開）
const MOBILE=matchMedia("(max-width:760px)");
document.body.dataset.sheet="peek";
function sheet(s){ if(!MOBILE.matches) return; document.body.dataset.sheet=s; if(s==="peek") document.getElementById("side").scrollTop=0; }
// ---------- 語言切換（中文／English） ----------
// 介面文字的英文翻譯。資料本身（建築名稱、地址）多數只有中文，會照原文顯示。
const LANG=(()=>{try{return localStorage.getItem("lang")==="en"?"en":"zh"}catch(e){return "zh"}})();
const EN=LANG==="en";
const TR={
  // 年代、來源、文資等級
  "清代":"Qing","日治":"Japanese era","戰後":"Postwar","當代":"Contemporary","年代不詳":"Undated",
  "精選建築":"Featured","古蹟":"Monument","歷史建築":"Historic building","聚落建築群":"Settlement","紀念建築":"Memorial building",
  "國定古蹟":"National monument","直轄市定古蹟":"Municipal monument","縣(市)定古蹟":"County/city monument","重要聚落建築群":"Important settlement",
  // 類型
  "城門":"City gate","宗教":"Religious","住宅":"Residence","官署":"Government","商業":"Commercial","產業":"Industrial","文化":"Cultural","教育":"Education","醫療":"Medical","交通":"Transport",
  "其他":"Other","其他設施":"Other facility","博物館":"Museum","原住民部落":"Indigenous village","商店":"Shop","城郭":"City wall","堤閘":"Levee/sluice","墓葬":"Tomb","學校":"School",
  "宅第":"Residence","官邸":"Official residence","寺廟":"Temple","市場":"Market","戲劇院":"Theatre","教堂":"Church","書院":"Academy","橋樑":"Bridge","機關":"Agency",
  "漢人街庄":"Han village","燈塔":"Lighthouse","牌坊":"Memorial arch","眷村":"Military village","碑碣":"Stele","祠堂":"Ancestral hall","行":"Trading house","衙署":"Yamen",
  "車站":"Station","辦公廳舍":"Office","近代宿舍":"Modern dormitory","醫院":"Hospital","關塞":"Fortification","集會堂":"Assembly hall",
  // 縣市
  "基隆市":"Keelung City","臺北市":"Taipei City","新北市":"New Taipei City","桃園市":"Taoyuan City","新竹市":"Hsinchu City","新竹縣":"Hsinchu County","苗栗縣":"Miaoli County",
  "臺中市":"Taichung City","彰化縣":"Changhua County","南投縣":"Nantou County","雲林縣":"Yunlin County","嘉義市":"Chiayi City","嘉義縣":"Chiayi County","臺南市":"Tainan City",
  "高雄市":"Kaohsiung City","屏東縣":"Pingtung County","宜蘭縣":"Yilan County","花蓮縣":"Hualien County","臺東縣":"Taitung County","澎湖縣":"Penghu County","金門縣":"Kinmen County","連江縣":"Lienchiang County",
  // 底圖與圖資
  "電子地圖（大字）":"e-Map (large labels)","通用電子地圖":"Taiwan e-Map","電子地圖（無文字）":"e-Map (no labels)","等高線地形圖":"Topographic (contours)","地形暈渲＋路名":"Shaded relief + roads",
  "正射影像（衛星）":"Orthophoto (aerial)","正射影像＋路名":"Orthophoto + roads","向量底圖（OpenStreetMap）":"Vector map (OpenStreetMap)",
  "公有土地地籍圖":"Public land cadastre","地段外圍圖（段籍圖）":"Land section boundaries","分棟建物框":"Building footprints","國土利用現況調查":"Land use survey","村里界":"Village boundaries",
  "地形陰影":"Hillshade","等高線":"Contours","等高線（國土測繪中心圖磚）":"Contours (NLSC tiles)","地質敏感區（山崩與地滑）":"Geologically sensitive (landslide)","土壤液化潛勢":"Soil liquefaction potential","鄉鎮區界":"Township boundaries",
  // 色調
  "泛黃古地圖":"Antique map","朱墨官圖":"Cinnabar survey","青花藍曬":"Blueprint","水墨素描":"Ink sketch","夜燈":"Night","海軍藍":"Navy","原色":"Natural","淡灰":"Light gray","暖白":"Warm white","深色":"Dark","高對比":"High contrast",
  // 地熱
  "全臺":"All Taiwan","大屯山區":"Tatun","宜蘭":"Yilan","花蓮":"Hualien","臺東":"Taitung","臺東霧鹿":"Taitung Wulu","臺中谷關":"Taichung Guguan","南投廬山":"Nantou Lushan",
  "南投東埔":"Nantou Dongpu","臺南關子嶺":"Tainan Guanziling","高雄寶來":"Kaohsiung Baolai",
  "地質圖":"Geology map","地質剖面線":"Geological section","線型構造":"Lineament","鑽井":"Well","大地電磁測點":"MT station","裂隙調查":"Fracture survey","定年":"Dating",
  "同位素":"Isotope","氣體分析":"Gas analysis","地溫計":"Geothermometer","水質":"Water quality","資料點":"Data point",
  "公有":"Public","私有":"Private","公私共有":"Mixed",
};
const T=s=>EN?(TR[s]??s):s;
const L2=(zh,en)=>EN?en:zh;
document.documentElement.lang=EN?"en":"zh-Hant";
// 靜態文字：元素上的 data-en 放英文；data-en-ph 是輸入框提示字
if(EN){
  document.querySelectorAll("[data-en]").forEach(el=>el.innerHTML=el.dataset.en);
  document.querySelectorAll("[data-en-ph]").forEach(el=>el.placeholder=el.dataset.enPh);
  if(document.body.dataset.enTitle) document.title=document.body.dataset.enTitle;
}
(()=>{const b=document.getElementById("langbtn"); if(!b) return; b.textContent=EN?"中文":"English";
  b.onclick=()=>{try{localStorage.setItem("lang",EN?"zh":"en")}catch(e){} location.reload();};})();

// ---------- data (示範) ----------
const ERAS = [
  {k:"清代", c:"--qing"}, {k:"日治", c:"--japan"}, {k:"戰後", c:"--postwar"}, {k:"當代", c:"--modern"}, {k:"年代不詳", c:"--muted"}
];
const B = [
 ["臺北府城北門（承恩門）",1884,"清代官方","清代","城門","中正區",25.0478,121.5114,"古蹟","臺北府城五座城門中唯一保留原貌者，閩南式碉堡造型。"],
 ["艋舺龍山寺",1738,"王益順（1920年代重建）","清代","宗教","萬華區",25.0372,121.4999,"古蹟","現貌多為日治時期由溪底派匠師王益順主持重建，木雕與剪黏精緻。"],
 ["大龍峒保安宮",1805,"同安匠師","清代","宗教","大同區",25.0731,121.5155,"古蹟","曾獲聯合國教科文組織亞太文化資產保存獎。"],
 ["大稻埕霞海城隍廟",1859,"—","清代","宗教","大同區",25.0557,121.5100,"古蹟","廟埕狹小卻香火鼎盛，鄰迪化街商圈。"],
 ["林安泰古厝",1783,"林氏家族","清代","住宅","中山區",25.0719,121.5288,"古蹟","四合院民宅，1980年代因道路拓寬拆遷至濱江街重組。"],
 ["臺北賓館",1901,"福田東吾、野村一郎","日治","官署","中正區",25.0393,121.5143,"古蹟","原總督官邸，巴洛克式立面與日式庭園並存。"],
 ["西門紅樓",1908,"近藤十郎","日治","商業","萬華區",25.0420,121.5068,"古蹟","八角樓加十字樓的公營市場，紅磚建築代表作。"],
 ["華山1914文化創意產業園區",1914,"—","日治","產業","中正區",25.0441,121.5294,"古蹟","前身為臺北酒廠，廠房再利用為文創園區。"],
 ["國立臺灣博物館",1915,"野村一郎、荒木榮一","日治","文化","中正區",25.0428,121.5149,"古蹟","希臘神殿式立面與圓頂大廳，臺灣最早的博物館。"],
 ["監察院（臺北州廳）",1915,"森山松之助","日治","官署","中正區",25.0448,121.5222,"古蹟","馬薩式屋頂與圓頂塔樓，原為臺北州廳。"],
 ["臺灣基督長老教會濟南教會",1916,"井手薰","日治","宗教","中正區",25.0427,121.5208,"古蹟","紅磚哥德式教堂，尖塔與扶壁明顯。"],
 ["北投溫泉博物館",1913,"森山松之助","日治","文化","北投區",25.1365,121.5079,"古蹟","原北投公共浴場，仿英式鄉村建築加日式木構。"],
 ["紀州庵",1917,"—","日治","住宅","中正區",25.0193,121.5225,"古蹟","日式料亭遺構，現為紀州庵文學森林。"],
 ["總統府（臺灣總督府）",1919,"長野宇平治（原案）、森山松之助","日治","官署","中正區",25.0401,121.5120,"古蹟","辰野式紅磚與白飾帶，中央塔高約60公尺。"],
 ["臺大醫院舊館",1921,"近藤十郎","日治","醫療","中正區",25.0414,121.5165,"古蹟","文藝復興式立面，當時東亞最大醫院之一。"],
 ["臺北當代藝術館（建成小學校）",1921,"—","日治","教育","大同區",25.0506,121.5196,"古蹟","原建成小學校，後為臺北市政府舊廈。"],
 ["光點台北（美國大使館官邸）",1926,"—","日治","住宅","中山區",25.0548,121.5226,"古蹟","原美國駐臺北領事館，白色殖民式建築。"],
 ["臺大校史館（舊總圖書館）",1928,"—","日治","教育","大安區",25.0170,121.5367,"古蹟","臺北帝國大學時期圖書館。"],
 ["北門郵局（臺北郵便局）",1930,"栗山俊一","日治","官署","中正區",25.0471,121.5113,"古蹟","仿文藝復興式，正面巨柱列。"],
 ["司法院（臺灣總督府高等法院）",1934,"井手薰","日治","官署","中正區",25.0378,121.5110,"古蹟","帶興亞式語彙的折衷主義，中央高塔。"],
 ["中山堂（臺北公會堂）",1936,"井手薰","日治","文化","中正區",25.0431,121.5103,"古蹟","1945年受降典禮所在地，面磚為國防色。"],
 ["松山文創園區（松山菸廠）",1937,"—","日治","產業","信義區",25.0440,121.5606,"古蹟","現代主義工業建築，巴洛克花園與生態池。"],
 ["國立歷史博物館",1955,"—","戰後","文化","中正區",25.0326,121.5103,"","位於南海學園，以中國宮殿式外觀改建。"],
 ["寶藏巖歷史聚落",1960,"居民自建","戰後","住宅","中正區",25.0105,121.5321,"歷史建築","依山而建的違建聚落，轉型為國際藝術村。"],
 ["國立故宮博物院",1965,"黃寶瑜","戰後","文化","士林區",25.1024,121.5485,"","中國宮殿式新古典建築，依外雙溪山勢配置。"],
 ["國父紀念館",1972,"王大閎","戰後","文化","信義區",25.0400,121.5602,"","以現代手法詮釋傳統大屋頂，起翹屋簷。"],
 ["圓山大飯店",1973,"楊卓成","戰後","商業","中山區",25.0786,121.5262,"","十四層宮殿式大樓，臺北天際線地標。"],
 ["中正紀念堂",1980,"楊卓成","戰後","文化","中正區",25.0347,121.5218,"","藍琉璃瓦八角攢尖頂，白色大理石牆。"],
 ["臺北市立美術館",1983,"高而潘","戰後","文化","中山區",25.0725,121.5246,"","以「井」字構成的懸挑量體，臺灣第一座現代美術館。"],
 ["國家戲劇院",1987,"楊卓成","戰後","文化","中正區",25.0357,121.5181,"","與國家音樂廳對稱配置於自由廣場兩側。"],
 ["臺北101",2004,"李祖原","當代","商業","信義區",25.0339,121.5645,"","八節竹節造型，曾為世界最高建築。"],
 ["臺北市立圖書館北投分館",2006,"九典聯合建築師事務所","當代","教育","北投區",25.1366,121.5065,"","臺灣首座綠建築圖書館，木構與太陽能屋頂。"],
 ["陶朱隱園",2018,"Vincent Callebaut","當代","住宅","信義區",25.0392,121.5668,"","DNA雙螺旋造型住宅，每層旋轉4.5度。"],
 ["臺北流行音樂中心",2020,"Reiser + Umemoto","當代","文化","南港區",25.0517,121.5985,"","表演廳與文化館以空橋串聯。"],
 ["臺北表演藝術中心",2022,"OMA（Rem Koolhaas、David Gianotten）","當代","文化","士林區",25.0846,121.5249,"","三座劇場插入中央立方體，「星球」劇場外凸。"],
].map((r,i)=>({id:i+1,name:r[0],year:r[1],arch:r[2],era:r[3],type:r[4],city:"臺北市",dist:r[5],lat:r[6],lng:r[7],status:r[8],note:r[9],src:"精選建築"}));

// 全臺精選當代與近代建築（座標為約略位置）
[
 ["東海大學路思義教堂",1963,"貝聿銘、陳其寬","戰後","宗教","臺中市","西屯區",24.1793,120.6003,"古蹟","雙曲面薄殼結構，以菱形琉璃瓦覆面。"],
 ["國立故宮博物院南部院區",2015,"姚仁喜","當代","文化","嘉義縣","太保市",23.4722,120.2930,"","以墨、暈、飛白為意象，量體以曲面串連。"],
 ["蘭陽博物館",2010,"姚仁喜","當代","文化","宜蘭縣","頭城鎮",24.8686,121.8296,"","單面山造型，傾斜立面呼應北關海岸岩層。"],
 ["臺中國家歌劇院",2016,"伊東豊雄","當代","文化","臺中市","西屯區",24.1630,120.6403,"","以曲牆「壺中居」構成連續的洞穴空間。"],
 ["國家體育場（高雄世運主場館）",2009,"伊東豊雄","當代","文化","高雄市","左營區",22.7006,120.2957,"","螺旋形鋼構外殼，屋頂鋪設太陽能板。"],
 ["國立臺灣大學社會科學院",2013,"伊東豊雄","當代","教育","臺北市","大安區",25.0189,121.5428,"","圖書館以如蓮葉般的細柱支撐波浪屋頂。"],
 ["衛武營國家藝術文化中心",2018,"Mecanoo（Francine Houben）","當代","文化","高雄市","鳳山區",22.6227,120.3426,"","以榕樹為意象的連續屋頂，下方為開放廣場。"],
 ["高雄流行音樂中心",2021,"Manuel Monteserín Lahoz（西班牙）","當代","文化","高雄市","苓雅區",22.6206,120.2861,"","沿愛河灣展開的鯨魚與珊瑚造型量體。"],
 ["高雄港埠旅運中心",2023,"Reiser + Umemoto","當代","交通","高雄市","苓雅區",22.6131,120.2885,"","曲面白色量體，位於亞洲新灣區港邊。"],
 ["美麗島站「光之穹頂」",2008,"高松伸（車站）、Narcissus Quagliata（穹頂）","當代","交通","高雄市","新興區",22.6314,120.3020,"","以玻璃彩繪構成的大型穹頂。"],
 ["亞洲現代美術館",2013,"安藤忠雄","當代","文化","臺中市","霧峰區",24.0400,120.6963,"","三個正三角形量體錯位疊合，配合水景。"],
 ["臺中綠美圖",2025,"妹島和世＋西澤立衛（SANAA）、石昭永","當代","文化","臺中市","西屯區",24.1586,120.6460,"","美術館與圖書館結合，量體架高讓公園延伸其下。"],
 ["臺南市美術館二館",2019,"坂茂、石昭永","當代","文化","臺南市","中西區",22.9906,120.2017,"","五角形碎形屋頂，下方錯落白色展覽盒。"],
 ["奇美博物館",2015,"—","當代","文化","臺南市","仁德區",22.9346,120.2261,"","歐洲古典風格建築，位於臺南都會公園。"],
 ["國立臺灣歷史博物館",2011,"簡學義","當代","文化","臺南市","安南區",23.0555,120.1835,"","低矮水平量體臥於濕地，結合生態池。"],
 ["雲門劇場",2015,"黃聲遠（田中央聯合建築師事務所）","當代","文化","新北市","淡水區",25.1786,121.4395,"","以鑄鋁外牆與山坡綠地融合的表演場館。"],
 ["羅東文化工場",2012,"黃聲遠（田中央聯合建築師事務所）","當代","文化","宜蘭縣","羅東鎮",24.6748,121.7656,"","巨大鋼構棚架與空中藝廊，開放給市民穿越。"],
 ["宜蘭縣政中心",1997,"象設計集團","戰後","官署","宜蘭縣","宜蘭市",24.7489,121.7581,"","以合院與迴廊構成的地方政府廳舍。"],
 ["日月潭向山遊客中心",2011,"團紀彥","當代","文化","南投縣","魚池鄉",23.8508,120.9047,"","兩道清水混凝土曲牆圍出面向湖面的框景。"],
 ["國立臺灣美術館",1988,"—","戰後","文化","臺中市","西區",24.1410,120.6634,"","臺灣第一座公立美術館，後方連接美術園道。"],
 ["臺南市立圖書館新總館",2020,"MECANOO、石昭永","當代","教育","臺南市","永康區",23.0231,120.2366,"","倒階梯量體與細長柱列，靈感來自廟宇格柵。"],
 ["臺北表演藝術中心",2022,"OMA","當代","文化","臺北市","士林區",25.0846,121.5249,"","（已列於臺北精選）",true],
].filter(r=>!r[11]).forEach(r=>B.push({id:B.length+1,name:r[0],year:r[1],arch:r[2],era:r[3],type:r[4],city:r[5],dist:r[6],lat:r[7],lng:r[8],status:r[9],note:r[10],src:"精選建築"}));

// 文化資產（古蹟、歷史建築、聚落建築群、紀念建築）：國家文化資產網開放資料
const eraOf=y=>!y?"年代不詳":y<1895?"清代":y<1945?"日治":y<2000?"戰後":"當代";
(()=>{const cur=B.slice();
  (window.HERITAGE||[]).forEach(h=>{
    if(cur.some(c=>Math.abs(c.lat-h.lat)<0.0007&&Math.abs(c.lng-h.lng)<0.0007)) return; // 已在精選清單
    B.push({id:B.length+1,name:h.n,year:h.y,yearGuess:true,arch:"",era:eraOf(h.y),type:(h.t||h.c).split("、")[0],types:h.t,
      city:h.city,dist:h.dist,addr:h.addr,lat:h.lat,lng:h.lng,status:h.l,note:"",src:h.c,url:h.u,img:h.img});
  });})();

if(APP!=="arch") B.length=0;

// ---------- TWD97 TM2 (121°) ----------
function toTM2(lat,lng){
  const a=6378137,f=1/298.257222101,k0=0.9999,E0=250000,l0=121*Math.PI/180;
  const e2=f*(2-f),ep2=e2/(1-e2),p=lat*Math.PI/180,l=lng*Math.PI/180;
  const s=Math.sin(p),c=Math.cos(p),t=Math.tan(p);
  const N=a/Math.sqrt(1-e2*s*s),T=t*t,C=ep2*c*c,A=c*(l-l0);
  const e4=e2*e2,e6=e4*e2;
  const M=a*((1-e2/4-3*e4/64-5*e6/256)*p-(3*e2/8+3*e4/32+45*e6/1024)*Math.sin(2*p)+(15*e4/256+45*e6/1024)*Math.sin(4*p)-(35*e6/3072)*Math.sin(6*p));
  const x=E0+k0*N*(A+(1-T+C)*A**3/6+(5-18*T+T*T+72*C-58*ep2)*A**5/120);
  const y=k0*(M+N*t*(A*A/2+(5-T+9*C+4*C*C)*A**4/24+(61-58*T+T*T+600*C-330*ep2)*A**6/720));
  return [x,y];
}
const fmtTM2=(lat,lng)=>{const [x,y]=toTM2(lat,lng);return `X ${x.toFixed(1)}  Y ${y.toFixed(1)}`};

// ---------- map & NLSC layers ----------
const nlsc = (id, opt={}) => L.tileLayer(`https://wmts.nlsc.gov.tw/wmts/${id}/default/GoogleMapsCompatible/{z}/{y}/{x}`,
  Object.assign({maxZoom:20, maxNativeZoom:19, attribution:'© 內政部國土測繪中心'}, opt));

const map = L.map("map",{zoomControl:false, minZoom:7, maxZoom:21, zoomSnap:0.25,
  maxBounds:L.latLngBounds([20.5,116.5],[27.5,124.5]), maxBoundsViscosity:.8}).setView([23.75,120.95],8);
map.createPane("base").classList.add("leaflet-base-pane"); map.getPane("base").style.zIndex=200;
map.createPane("otiles").classList.add("leaflet-overlay-tiles-pane"); map.getPane("otiles").style.zIndex=250;
map.createPane("roads").classList.add("leaflet-road-pane"); map.getPane("roads").style.zIndex=240;
const BP={pane:"base"}, OP={pane:"otiles"};
// 道路網圖層：重新上成墨褐色，疊在底圖上強調道路
const ROADS = nlsc("ROAD",{pane:"roads",opacity:.45}).addTo(map);
document.getElementById("roadop").oninput=e=>{ROADS.setOpacity(+e.target.value); syncRoads();};
const BASES = {
  "電子地圖（大字）": nlsc("EMAP98",BP),
  "通用電子地圖": nlsc("EMAP",BP),
  "電子地圖（無文字）": nlsc("EMAPX99",BP),
  "等高線地形圖": nlsc("EMAP5",BP),
  "地形暈渲＋路名": L.layerGroup([nlsc("MOI_SHADERMAP",Object.assign({maxNativeZoom:16},BP)), nlsc("EMAP12",BP)]),
  "正射影像（衛星）": nlsc("PHOTO2",BP),
  "正射影像＋路名": L.layerGroup([nlsc("PHOTO2",BP), nlsc("EMAP2",BP)]),
};
// ---------- 向量等高線：用 AWS Terrain Tiles（terrarium 編碼高程）在瀏覽器即時畫線，計曲線加粗並標高程 ----------
map.createPane("contour"); map.getPane("contour").style.zIndex=255; map.getPane("contour").style.pointerEvents="none";
// 各縮放層級的 [首曲線, 計曲線] 間距（公尺）
const CONTOUR_TH={9:[200,1000],10:[100,500],11:[100,500],12:[50,250],13:[20,100],14:[10,50],15:[10,50]};
let mlcLoad=null, demSrc=null;
const loadMlc=()=>mlcLoad??=new Promise((ok,fail)=>{ if(window.mlcontour) return ok();
  const s=document.createElement("script"); s.src="https://unpkg.com/maplibre-contour@0.1.0/dist/index.min.js"; s.onload=ok; s.onerror=()=>{mlcLoad=null;fail();}; document.head.appendChild(s); });
const cssVar=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const ContourLayer=L.Layer.extend({
  options:{opacity:.85},
  onAdd(m){ this._active=true;
    loadMlc().then(()=>{ if(!this._active||!window.maplibregl||!L.maplibreGL) return;
      if(!demSrc){ demSrc=new mlcontour.DemSource({url:"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",encoding:"terrarium",maxzoom:12,worker:true,cacheSize:120}); demSrc.setupMaplibre(maplibregl); }
      this._gl=L.maplibreGL({pane:"contour",interactive:false,style:this._style(),
        attribution:L2('等高線高程：<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>','Contour elevation: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>')}).addTo(m);
      this._applyOpacity();
      this._obs=new MutationObserver(()=>this._restyle()); this._obs.observe(document.documentElement,{attributes:true,attributeFilter:["data-tone"]});
    }).catch(()=>{});
  },
  onRemove(m){ this._active=false; if(this._gl){ m.removeLayer(this._gl); this._gl=null; } this._obs?.disconnect(); },
  setOpacity(o){ this.options.opacity=o; this._applyOpacity(); return this; },
  _applyOpacity(){ const c=this._gl?.getContainer?.(); if(c) c.style.opacity=this.options.opacity; },
  _colors(){ return {line:cssVar("--contour")||"#8a5a2b", halo:cssVar("--sheet")||"#ffffff"}; },
  _style(){ const {line,halo}=this._colors(), src="c", sl="contours";
    return {version:8, glyphs:"https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
      // 線和標籤分成兩個來源：字型檔載不到時只會少標籤，線條照樣顯示
      sources:(()=>{const t=[demSrc.contourProtocolUrl({thresholds:CONTOUR_TH,contourLayer:"contours",elevationKey:"ele",levelKey:"level",buffer:1})];
        return {c:{type:"vector",tiles:t,maxzoom:15},cl:{type:"vector",tiles:t,maxzoom:15}};})(),
      layers:[
        {id:"c-minor",type:"line",source:src,"source-layer":sl,filter:["all",["==",["get","level"],0],[">",["get","ele"],0]],
          layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":line,"line-opacity":.55,"line-width":["interpolate",["linear"],["zoom"],9,.35,13,.6,16,.9]}},
        {id:"c-major",type:"line",source:src,"source-layer":sl,filter:["all",[">",["get","level"],0],[">",["get","ele"],0]],
          layout:{"line-join":"round","line-cap":"round"},paint:{"line-color":line,"line-opacity":.9,"line-width":["interpolate",["linear"],["zoom"],9,.8,13,1.3,16,1.9]}},
        {id:"c-label",type:"symbol",source:"cl","source-layer":sl,minzoom:11,filter:["all",[">",["get","level"],0],[">",["get","ele"],0]],
          layout:{"symbol-placement":"line","symbol-spacing":320,"text-max-angle":25,"text-padding":4,"text-size":["interpolate",["linear"],["zoom"],11,10,15,12],
            "text-field":["concat",["number-format",["get","ele"],{}]," m"],"text-font":["Noto Sans Regular"]},
          paint:{"text-color":line,"text-halo-color":halo,"text-halo-width":1.6}}]};
  },
  _restyle(){ const g=this._gl?.getMaplibreMap?.(); if(!g||!g.getLayer("c-minor")) return; const {line,halo}=this._colors();
    ["c-minor","c-major"].forEach(id=>g.setPaintProperty(id,"line-color",line));
    g.setPaintProperty("c-label","text-color",line); g.setPaintProperty("c-label","text-halo-color",halo); },
});
const OVERS = APP==="arch" ? {
  "公有土地地籍圖": nlsc("LAND_OPENDATA",OP),
  "地段外圍圖（段籍圖）": nlsc("LANDSECT",OP),
  "分棟建物框": nlsc("BUILDX",OP),
  "國土利用現況調查": nlsc("LUIMAP",OP),
  "村里界": nlsc("Village",OP),
} : {
  "地形陰影": nlsc("MOI_HILLSHADE",Object.assign({maxNativeZoom:16},OP)),
  "等高線": new ContourLayer(),
  "等高線（國土測繪中心圖磚）": nlsc("MOI_CONTOUR_2",OP),
  "地質敏感區（山崩與地滑）": nlsc("GeoSensitive2",OP),
  "土壤液化潛勢": nlsc("SoilLiquefaction",OP),
  "國土利用現況調查": nlsc("LUIMAP",OP),
  "鄉鎮區界": nlsc("TOWN",OP),
};
// paper grain
(()=>{const c=document.createElement("canvas");c.width=c.height=220;const x=c.getContext("2d"),d=x.createImageData(220,220);
  for(let i=0;i<d.data.length;i+=4){const v=200+Math.random()*55|0;d.data[i]=v;d.data[i+1]=v-8;d.data[i+2]=v-30;d.data[i+3]=Math.random()<.5?40:0;}
  x.putImageData(d,0,0);document.getElementById("grain").style.setProperty("--grain",`url(${c.toDataURL()})`);})();
L.control.zoom({position:"bottomright"}).addTo(map);
L.control.scale({position:"bottomright", imperial:false}).addTo(map);
let base = BASES["電子地圖（大字）"].addTo(map);

// ---------- Google Earth：用連結在 Google Earth 網頁版開啟同一個位置（不需要 API 金鑰） ----------
const earthUrl=(lat,lng,dist)=>`https://earth.google.com/web/@${(+lat).toFixed(6)},${(+lng).toFixed(6)},0a,${Math.round(dist)}d,35y,0h,45t,0r`;
const zoomDist=z=>Math.max(300,40000000/Math.pow(2,z)*1.6);
const earthCtl=L.control({position:"bottomright"});
earthCtl.onAdd=()=>{const a=L.DomUtil.create("a","earthbtn");a.target="_blank";a.rel="noopener";a.textContent=L2("在 Google Earth 開啟","Open in Google Earth");
  a.title=L2("在 Google Earth 網頁版開啟目前的地圖範圍","Open the current view in Google Earth on the web");L.DomEvent.disableClickPropagation(a);return a;};
earthCtl.addTo(map);
const syncEarth=()=>{const c=map.getCenter();document.querySelector(".earthbtn").href=earthUrl(c.lat,c.lng,zoomDist(map.getZoom()));};
map.on("moveend",syncEarth); syncEarth();

const basesEl=document.getElementById("bases"), oversEl=document.getElementById("overs");
// 道路強調圖層只疊在國土測繪中心的底圖上
function syncRoads(){
  const raster=!(vec&&map.hasLayer(vec));
  document.getElementById("roadset").classList.toggle("off",!raster);
  if(raster&&+document.getElementById("roadop").value>0){ if(!map.hasLayer(ROADS)) ROADS.addTo(map); }
  else if(map.hasLayer(ROADS)) map.removeLayer(ROADS);
}
const VEC_KEY="向量底圖（OpenStreetMap）";
let lastBaseRadio="b0";
function chooseBase(k){const rb=document.querySelector(`input[name="base"][data-k="${k}"]`); if(rb&&!rb.checked){rb.checked=true; rb.onchange();}}
Object.keys(BASES).concat([VEC_KEY]).forEach((k,i)=>{
  const id="b"+i, lab=document.createElement("label");
  lab.innerHTML=`<input type="radio" name="base" id="${id}" ${k==="電子地圖（大字）"?"checked":""}> ${T(k)}`;
  const rb=lab.querySelector("input"); rb.dataset.k=k;
  rb.onchange=()=>{
    if(k===VEC_KEY){
      if(!setVector(true)){ document.getElementById(lastBaseRadio).checked=true; return; }
      lastBaseRadio=id; syncRoads(); return;
    }
    setVector(false);
    map.removeLayer(base); base=BASES[k].addTo(map); base.bringToBack?.(); lastBaseRadio=id; syncRoads();
  };
  basesEl.appendChild(lab);
});
// 向量底圖的地形陰影：用 AWS Terrain Tiles 高程畫山體明暗，墊在水域與道路底下
let vecHS=false; try{vecHS=localStorage.getItem("vecHS")==="1";}catch(e){}
const hsLab=document.createElement("label"); hsLab.className="hsopt";
hsLab.innerHTML=`<input type="checkbox" id="vechs" ${vecHS?"checked":""}> ${L2("加上地形陰影（向量底圖）","Add hillshade (vector map)")}`;
basesEl.appendChild(hsLab);
const hsBox=hsLab.querySelector("input");
function vecHillshade(){
  const g=vec?.getMaplibreMap?.(); if(!g) return;
  if(!g.style?._loaded){ g.once("styledata",vecHillshade); return; } // 樣式檔讀完就能加圖層，不必等所有圖磚
  const has=!!g.getLayer("hs");
  if(vecHS&&!has){
    if(!g.getSource("dem")) g.addSource("dem",{type:"raster-dem",encoding:"terrarium",tileSize:256,maxzoom:12,
      tiles:["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      attribution:L2('地形陰影高程：<a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>','Hillshade elevation: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a>')});
    g.addLayer({id:"hs",type:"hillshade",source:"dem",paint:{"hillshade-exaggeration":.38,"hillshade-illumination-direction":315,
      "hillshade-shadow-color":"#1e2a38","hillshade-highlight-color":"#ffffff","hillshade-accent-color":"#3b4a5c"}},g.getLayer("water")?"water":undefined);
  } else if(!vecHS&&has) g.removeLayer("hs");
}
const syncHsBox=()=>{ const on=!!(vec&&map.hasLayer(vec)); hsBox.disabled=!on; hsLab.title=on?"":L2("先選「向量底圖」才能使用","Choose the vector base map first"); hsLab.classList.toggle("off",!on); };
hsBox.onchange=()=>{ vecHS=hsBox.checked; try{localStorage.setItem("vecHS",vecHS?"1":"0");}catch(e){} vecHillshade(); };
basesEl.addEventListener("change",e=>{ if(e.target.name==="base") setTimeout(syncHsBox,0); });
Object.keys(OVERS).forEach((k,i)=>{
  const id="o"+i, lab=document.createElement("label"), lyr=OVERS[k];
  lyr.setOpacity(0.85);
  lab.innerHTML=`<input type="checkbox" id="${id}"> ${T(k)}`;
  lab.querySelector("input").onchange=e=>{
    if(e.target.checked){ lyr.addTo(map); if(map.getZoom()<16 && /地籍|段籍|建物框/.test(k)) map.setZoom(17); }
    else map.removeLayer(lyr);
  };
  oversEl.appendChild(lab);
});
document.getElementById("opacity").oninput=e=>Object.values(OVERS).forEach(l=>l.setOpacity(+e.target.value));
document.getElementById("lmin").onclick=e=>{const p=document.getElementById("layers");p.classList.toggle("min");e.target.textContent=p.classList.contains("min")?L2("展開","Expand"):L2("收合","Collapse")};

map.on("mousemove",e=>{
  document.getElementById("cw").textContent=`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
  document.getElementById("ct").textContent=fmtTM2(e.latlng.lat,e.latlng.lng);
});

// 手機（760px 以下）彈窗寬度不超過螢幕寬減 90px，否則 iPhone 13（390px）上會被切掉右半邊
const POPW=innerWidth>760?360:Math.max(200,Math.min(360,innerWidth-90));
Object.assign(L.Popup.prototype.options,{maxHeight:300,minWidth:Math.min(270,POPW),maxWidth:POPW,autoPanPaddingTopLeft:L.point(30,30),autoPanPaddingBottomRight:L.point(innerWidth>760?280:20,40)});
// ---------- 匯入點位：Excel／CSV ----------
// TWD97 TM2（121°）轉 WGS84 經緯度
function fromTM2(x,y){
  const a=6378137,f=1/298.257222101,k0=0.9999,E0=250000,l0=121*Math.PI/180;
  const e2=f*(2-f),ep2=e2/(1-e2),e1=(1-Math.sqrt(1-e2))/(1+Math.sqrt(1-e2));
  const M=y/k0, mu=M/(a*(1-e2/4-3*e2*e2/64-5*e2**3/256));
  const p1=mu+(3*e1/2-27*e1**3/32)*Math.sin(2*mu)+(21*e1*e1/16-55*e1**4/32)*Math.sin(4*mu)+(151*e1**3/96)*Math.sin(6*mu)+(1097*e1**4/512)*Math.sin(8*mu);
  const C1=ep2*Math.cos(p1)**2,T1=Math.tan(p1)**2,N1=a/Math.sqrt(1-e2*Math.sin(p1)**2),R1=a*(1-e2)/Math.pow(1-e2*Math.sin(p1)**2,1.5),D=(x-E0)/(N1*k0);
  const lat=p1-(N1*Math.tan(p1)/R1)*(D*D/2-(5+3*T1+10*C1-4*C1*C1-9*ep2)*D**4/24+(61+90*T1+298*C1+45*T1*T1-252*ep2-3*C1*C1)*D**6/720);
  const lng=l0+(D-(1+2*T1+C1)*D**3/6+(5-2*C1+28*T1-3*C1*C1+8*ep2+24*T1*T1)*D**5/120)/Math.cos(p1);
  return [lat*180/Math.PI,lng*180/Math.PI];
}
map.createPane("imp"); map.getPane("imp").style.zIndex=640;
const impRenderer=L.canvas({pane:"imp",padding:.3});
const IMP_COLORS=["#d62828","#1d6fb8","#2a9d58","#8e44ad","#e07b00","#111111"];
const IMPORTS=[];
let XLSXready=null;
function loadXLSX(){ return XLSXready??=new Promise((ok,fail)=>{ if(window.XLSX) return ok();
  const s=document.createElement("script"); s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload=ok; s.onerror=fail; document.head.appendChild(s); }); }
const impEsc=s=>String(s??"").replace(/[<>&"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[c]));
const numOf=v=>{if(typeof v==="number")return v; const n=parseFloat(String(v).replace(/[,，\s]/g,"")); return isNaN(n)?null:n;};
function guessCols(cols){
  const find=re=>cols.find(c=>re.test(String(c).trim()))||"";
  const lat=find(/^(lat|latitude|緯度|wgs84_?lat|lat_?wgs84|y_?wgs84|緯)$/i)||find(/lat|緯度/i);
  const lng=find(/^(lng|lon|long|longitude|經度|wgs84_?lon|lon_?wgs84|x_?wgs84|經)$/i)||find(/lon|lng|經度/i);
  const x=find(/^(x|twd97_?x|x_?twd97|x座標|橫座標|e|easting|x坐標)$/i)||find(/twd97.*x|x.*twd97|x座標|x坐標/i);
  const y=find(/^(y|twd97_?y|y_?twd97|y座標|縱座標|n|northing|y坐標)$/i)||find(/twd97.*y|y.*twd97|y座標|y坐標/i);
  const name=find(/^(名稱|name|title|地點|站名|建築名稱|案名|地名|標題)$/i)||find(/名稱|name|title|地點|站名/i)||cols.find(c=>c!==lat&&c!==lng&&c!==x&&c!==y)||"";
  if(lat&&lng) return {sys:"wgs",cx:lng,cy:lat,name};
  if(x&&y) return {sys:"twd97",cx:x,cy:y,name};
  return {sys:"auto",cx:lng||x||cols[0]||"",cy:lat||y||cols[1]||"",name};
}
function toLatLng(r,cfg){
  const vx=numOf(r[cfg.cx]), vy=numOf(r[cfg.cy]); if(vx==null||vy==null) return null;
  let sys=cfg.sys; if(sys==="auto") sys=Math.abs(vx)>1000||Math.abs(vy)>1000?"twd97":"wgs";
  let lat,lng;
  if(sys==="twd97") [lat,lng]=fromTM2(vx,vy);
  else { lat=vy; lng=vx; if(Math.abs(lat)>90&&Math.abs(lng)<=90) [lat,lng]=[lng,lat]; }
  if(!(lat>=-90&&lat<=90&&lng>=-180&&lng<=180)) return null;
  return [lat,lng];
}
function impPopup(r,cols,cfg,ll){
  const title=impEsc(r[cfg.name]||L2("匯入點位","Imported point"));
  const rows=cols.filter(c=>r[c]!==""&&r[c]!=null).map(c=>`<tr><td>${impEsc(c)}</td><td>${impEsc(r[c])}</td></tr>`).join("");
  return `<div class="geopop"><h4>${title}</h4><div class="m">WGS84 ${ll[0].toFixed(6)}, ${ll[1].toFixed(6)}<br>TWD97 ${fmtTM2(ll[0],ll[1])}</div><table>${rows}</table>
    <div style="margin-top:6px"><a href="${earthUrl(ll[0],ll[1],800)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div></div>`;
}
function addImport(imp,fit){
  const g=L.layerGroup(); let ok=0, bad=0; const pts=[];
  imp.rows.forEach(r=>{const ll=toLatLng(r,imp.cfg); if(!ll){bad++;return;} ok++; pts.push(ll);
    L.circleMarker(ll,{renderer:impRenderer,radius:6,color:"#ffffff",weight:1.5,fillColor:imp.color,fillOpacity:.95})
      .bindPopup(()=>impPopup(r,imp.cols,imp.cfg,ll)).bindTooltip(impEsc(r[imp.cfg.name]||""),{direction:"top",offset:[0,-6]}).addTo(g);});
  imp.layer=g.addTo(map); imp.ok=ok; imp.bad=bad; imp.bounds=pts.length?L.latLngBounds(pts):null;
  IMPORTS.push(imp); renderImpList(); saveImports();
  if(fit&&imp.bounds) map.flyToBounds(imp.bounds.pad(.15),{maxZoom:15,duration:.7});
}
function renderImpList(){
  const el=document.getElementById("implist"); el.innerHTML="";
  IMPORTS.forEach((imp,i)=>{const d=document.createElement("div"); d.className="impitem";
    d.innerHTML=`<span class="sw" style="background:${imp.color}"></span><span class="nm" title="${impEsc(imp.file)}">${impEsc(imp.file)}</span>
      <span class="count">${imp.ok.toLocaleString()}${imp.bad?` / ${L2("略過","skipped")} ${imp.bad}`:""}</span>
      <button type="button" class="linkbtn" data-a="fit">${L2("縮放","Zoom")}</button><button type="button" class="linkbtn" data-a="del">${L2("移除","Remove")}</button>`;
    d.querySelector('[data-a="fit"]').onclick=()=>imp.bounds&&map.flyToBounds(imp.bounds.pad(.15),{maxZoom:15,duration:.7});
    d.querySelector('[data-a="del"]').onclick=()=>{map.removeLayer(imp.layer); IMPORTS.splice(IMPORTS.indexOf(imp),1); renderImpList(); saveImports();};
    el.appendChild(d);});
}
function saveImports(){ try{ const s=JSON.stringify(IMPORTS.map(i=>({file:i.file,cols:i.cols,rows:i.rows,cfg:i.cfg,color:i.color})));
  if(s.length<3e6) localStorage.setItem("imports_"+APP,s); else localStorage.removeItem("imports_"+APP);}catch(e){} }
function showImpConfig(file,cols,rows,sheets,wb){
  const box=document.getElementById("impcfg"), g=guessCols(cols), color=IMP_COLORS[IMPORTS.length%IMP_COLORS.length];
  const opts=sel=>cols.map(c=>`<option value="${impEsc(c)}"${c===sel?" selected":""}>${impEsc(c)}</option>`).join("");
  box.innerHTML=`<div class="impfile">${impEsc(file)} · ${rows.length.toLocaleString()} ${L2("列","rows")}</div>
    ${sheets&&sheets.length>1?`<label>${L2("工作表","Sheet")}<select id="impsheet">${sheets.map(s=>`<option>${impEsc(s)}</option>`).join("")}</select></label>`:""}
    <label>${L2("座標系統","Coordinates")}<select id="impsys">
      <option value="auto"${g.sys==="auto"?" selected":""}>${L2("自動判斷","Detect automatically")}</option>
      <option value="wgs"${g.sys==="wgs"?" selected":""}>${L2("WGS84 經緯度","WGS84 lat/long")}</option>
      <option value="twd97"${g.sys==="twd97"?" selected":""}>${L2("TWD97 TM2 X／Y（公尺）","TWD97 TM2 X/Y (metres)")}</option></select></label>
    <label>${L2("經度或 X 欄","Longitude or X column")}<select id="impcx">${opts(g.cx)}</select></label>
    <label>${L2("緯度或 Y 欄","Latitude or Y column")}<select id="impcy">${opts(g.cy)}</select></label>
    <label>${L2("名稱欄","Name column")}<select id="impname"><option value="">${L2("（不使用）","(none)")}</option>${opts(g.name)}</select></label>
    <label>${L2("顏色","Colour")}<input type="color" id="impcolor" value="${color}"></label>
    <div class="row"><button type="button" class="btn" id="impgo">${L2("加入地圖","Add to map")}</button><button type="button" class="linkbtn" id="impcancel">${L2("取消","Cancel")}</button></div>
    <div class="src" id="impmsg"></div>`;
  box.hidden=false;
  const sheetSel=box.querySelector("#impsheet"); if(sheetSel) sheetSel.onchange=()=>{const ws=wb.Sheets[sheetSel.value];
    const rs=XLSX.utils.sheet_to_json(ws,{defval:"",raw:true}); const cs=rs.length?Object.keys(rs[0]):[]; showImpConfig(file,cs,rs,sheets,wb); document.getElementById("impsheet").value=sheetSel.value;};
  box.querySelector("#impcancel").onclick=()=>{box.hidden=true;box.innerHTML="";};
  box.querySelector("#impgo").onclick=()=>{
    const cfg={sys:box.querySelector("#impsys").value,cx:box.querySelector("#impcx").value,cy:box.querySelector("#impcy").value,name:box.querySelector("#impname").value};
    const okN=rows.filter(r=>toLatLng(r,cfg)).length;
    if(!okN){box.querySelector("#impmsg").textContent=L2("用這兩個欄位找不到有效座標，請確認欄位和座標系統。","No valid coordinates in these columns. Check the columns and coordinate system."); return;}
    addImport({file,cols,rows,cfg,color:box.querySelector("#impcolor").value},true); box.hidden=true; box.innerHTML="";
  };
}
document.getElementById("impfile").onchange=async e=>{
  const f=e.target.files[0]; e.target.value=""; if(!f) return;
  const box=document.getElementById("impcfg"); box.hidden=false; box.innerHTML=`<div class="src">${L2("讀取中…","Reading…")}</div>`;
  try{
    await loadXLSX();
    const buf=await f.arrayBuffer();
    const wb=/\.(csv|txt)$/i.test(f.name)?XLSX.read(new TextDecoder("utf-8").decode(buf),{type:"string"}):XLSX.read(buf,{type:"array"});
    const sheets=wb.SheetNames, rows=XLSX.utils.sheet_to_json(wb.Sheets[sheets[0]],{defval:"",raw:true});
    if(!rows.length){box.innerHTML=`<div class="src">${L2("這個檔案沒有資料列。第一列要是欄位名稱。","No data rows found. The first row should hold column names.")}</div>`;return;}
    showImpConfig(f.name,Object.keys(rows[0]),rows,sheets,wb);
  }catch(err){ box.innerHTML=`<div class="src">${L2("無法讀取這個檔案，請確認是 Excel（.xlsx／.xls）或 CSV。","Could not read this file. Use Excel (.xlsx/.xls) or CSV.")}</div>`; }
};
(()=>{try{const s=localStorage.getItem("imports_"+APP); if(s) JSON.parse(s).forEach(i=>addImport(i,false));}catch(e){}})();

if(APP==="arch"){
// ---------- markers, filters, list ----------
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const eraVar = e => (ERAS.find(x=>x.k===e)||ERAS[ERAS.length-1]).c;
const state = {eras:new Set(ERAS.map(e=>e.k)), type:"", src:"", city:"", q:"", sel:null, inview:true};
const cluster = L.markerClusterGroup({showCoverageOnHover:false, maxClusterRadius:45, disableClusteringAtZoom:16, chunkedLoading:true});
map.addLayer(cluster);
const markers = {};
function pinIcon(b,on){const c=css(eraVar(b.era)), cur=b.src==="精選建築";
  return L.divIcon({className:"",iconSize:cur?[16,16]:[12,12],html:`<div class="pin${on?" on":""}${cur?"":" sm"}" style="background:${c};color:${c}"></div>`})}
B.forEach(b=>{
  const m=L.marker([b.lat,b.lng],{icon:pinIcon(b,false),title:b.name,keyboard:true});
  m.on("click",()=>select(b.id,false));
  markers[b.id]=m;
});

const erasEl=document.getElementById("eras");
ERAS.forEach(e=>{
  const n=B.filter(b=>b.era===e.k).length;
  const bt=document.createElement("button");
  bt.className="chip"; bt.type="button"; bt.setAttribute("aria-pressed","true");
  bt.innerHTML=`<span class="dot" style="background:var(${e.c})"></span>${T(e.k)}<span class="count">${n.toLocaleString()}</span>`;
  bt.onclick=()=>{state.eras.has(e.k)?state.eras.delete(e.k):state.eras.add(e.k);bt.setAttribute("aria-pressed",state.eras.has(e.k));render(true);};
  erasEl.appendChild(bt);
});
const countBy=(f)=>{const m={};B.forEach(b=>{const k=f(b);if(k)m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1]);};
const fillSel=(id,entries,order)=>{const s=document.getElementById(id);(order?entries.sort(order):entries).forEach(([k,n])=>s.add(new Option(EN?`${T(k)} (${n.toLocaleString()})`:`${k}（${n.toLocaleString()}）`,k)));return s;};
const CITY_ORDER=["基隆市","臺北市","新北市","桃園市","新竹市","新竹縣","苗栗縣","臺中市","彰化縣","南投縣","雲林縣","嘉義市","嘉義縣","臺南市","高雄市","屏東縣","宜蘭縣","花蓮縣","臺東縣","澎湖縣","金門縣","連江縣"];
const srcSel=fillSel("srcsel",countBy(b=>b.src));
const citySel=fillSel("city",countBy(b=>b.city),(a,b)=>CITY_ORDER.indexOf(a[0])-CITY_ORDER.indexOf(b[0]));
const typeSel=fillSel("type",countBy(b=>b.type));
srcSel.onchange=e=>{state.src=e.target.value;render(true)};
citySel.onchange=e=>{state.city=e.target.value;state.inview=false;document.getElementById("inview").checked=false;
  if(state.city){const pts=B.filter(b=>b.city===state.city).map(b=>[b.lat,b.lng]);if(pts.length)map.flyToBounds(pts,{padding:[30,30],maxZoom:14,duration:.7});}
  render(true)};
typeSel.onchange=e=>{state.type=e.target.value;render(true)};
document.getElementById("inview").onchange=e=>{state.inview=e.target.checked;render(false)};
let qT=null;
document.getElementById("q").oninput=e=>{clearTimeout(qT);qT=setTimeout(()=>{state.q=e.target.value.trim().toLowerCase();render(true)},180)};

function filtered(){
  return B.filter(b=>state.eras.has(b.era)&&(!state.type||b.type===state.type)&&(!state.src||b.src===state.src)&&(!state.city||b.city===state.city)&&
    (!state.q||[b.name,b.arch,b.city,b.dist,b.addr,b.type,b.types,b.status,String(b.year||"")].join(" ").toLowerCase().includes(state.q)));
}
let lastF=null;
const LIST_MAX=300;
function render(markersToo=true){
  const f=filtered();
  if(markersToo||!lastF){ cluster.clearLayers(); cluster.addLayers(f.map(b=>markers[b.id])); lastF=f; }
  const bnd=map.getBounds();
  const v=(state.inview?f.filter(b=>bnd.contains([b.lat,b.lng])):f).slice()
    .sort((a,b)=>(a.src==="精選建築"?0:1)-(b.src==="精選建築"?0:1)||(a.year??9999)-(b.year??9999));
  document.getElementById("count").textContent=EN?`${f.length.toLocaleString()} of ${B.length.toLocaleString()} on map${state.inview?`, ${v.length.toLocaleString()} in view`:""}`:`地圖上 ${f.length.toLocaleString()} / ${B.length.toLocaleString()} 件${state.inview?`，目前範圍內 ${v.length.toLocaleString()} 件`:""}`;
  const list=document.getElementById("list"); list.innerHTML="";
  const frag=document.createDocumentFragment();
  v.slice(0,LIST_MAX).forEach(b=>{
    const li=document.createElement("li"); li.tabIndex=0; li.dataset.id=b.id;
    if(b.id===state.sel) li.className="on";
    const who=b.src==="精選建築"?b.arch:T(b.status||b.src);
    li.innerHTML=`<span class="no" style="color:var(${eraVar(b.era)})">●</span><span><span class="nm">${b.name}</span><span class="meta">${who}・${EN?T(b.city):b.city+(b.dist||"")}</span></span><span class="yr">${b.year??"—"}</span>`;
    li.onclick=()=>select(b.id,true);
    li.onkeydown=e=>{if(e.key==="Enter")select(b.id,true)};
    frag.appendChild(li);
  });
  if(v.length>LIST_MAX){const li=document.createElement("li");li.className="more";li.textContent=L2(`還有 ${(v.length-LIST_MAX).toLocaleString()} 件未列出，請放大地圖或用篩選縮小範圍`,`${(v.length-LIST_MAX).toLocaleString()} more not listed. Zoom in or use the filters.`);frag.appendChild(li);}
  if(!v.length){const li=document.createElement("li");li.className="more";li.textContent=state.inview?L2("目前地圖範圍內沒有符合的建築，移動地圖或取消「只列出地圖範圍內」","No matching buildings in view. Move the map or turn off “Only list what is in view”."):EN?"No matching buildings":"沒有符合的建築";frag.appendChild(li);}
  list.appendChild(frag);
}
let mvT=null; map.on("moveend",()=>{if(state.inview){clearTimeout(mvT);mvT=setTimeout(()=>render(false),150);}});
function select(id,fly){
  const prev=state.sel; state.sel=id;
  if(prev&&markers[prev]) markers[prev].setIcon(pinIcon(B[prev-1],false));
  const b=B[id-1]; markers[id].setIcon(pinIcon(b,true));
  if(fly) map.flyTo([b.lat,b.lng],Math.max(map.getZoom(),17),{duration:.8});
  const g=`https://www.google.com/maps/search/?api=1&query=${b.lat},${b.lng}`;
  const card=document.getElementById("card");
  card.style.setProperty("--c",`var(${eraVar(b.era)})`);
  const cur=b.src==="精選建築";
  card.innerHTML=`<button class="x" type="button" aria-label="${L2("關閉","Close")}">×</button><div class="in">
    <div class="era">${T(b.era)} · ${EN?(b.types||b.type).split("、").map(T).join(", "):(b.types||b.type)}</div>
    <h3>${b.name}</h3>
    ${b.img?`<img class="photo" src="${b.img}" alt="${b.name}${L2("代表照片"," photo")}" loading="lazy" onerror="this.remove()">`:""}
    <dl>${cur?`<dt>${L2("完工","Completed")}</dt><dd>${b.year}</dd><dt>${L2("設計","Architect")}</dt><dd>${b.arch}</dd>`:`<dt>${L2("年代","Date")}</dt><dd>${b.year?L2(`約 ${b.year}（取自沿革記載）`,`c. ${b.year} (from the history text)`):L2("不詳","Unknown")}</dd>`}
    <dt>${cur?L2("行政區","District"):L2("地址","Address")}</dt><dd>${EN?T(b.city)+" · ":""}${b.city}${b.dist||""}${b.addr?" "+b.addr:""}</dd>
    ${b.status?`<dt>${L2("文資","Heritage")}</dt><dd>${T(b.status)}</dd>`:""}
    <dt>TWD97</dt><dd class="tm2">${fmtTM2(b.lat,b.lng)}</dd></dl>
    ${b.note?`<p>${b.note}</p>`:""}
    <div class="links">
      ${b.url?`<a href="${b.url.replace(/^http:/,"https:")}" target="_blank" rel="noopener">${L2("國家文化資產網","National Cultural Heritage Database")}</a>`:""}
      <a href="https://easymap.land.moi.gov.tw/" target="_blank" rel="noopener">${L2("地籍圖資便民系統","Cadastral map service")}</a>
      ${b.city==="臺北市"?`<a href="https://zonemap.udd.gov.taipei/ZoneMapOP/" target="_blank" rel="noopener">${L2("臺北市使用分區查詢","Taipei zoning lookup")}</a>`:""}
      <a href="${earthUrl(b.lat,b.lng,600)}" target="_blank" rel="noopener">Google Earth</a>
      <a href="${g}" target="_blank" rel="noopener">${L2("Google 地圖","Google Maps")}</a>
    </div>${cur?"":`<div class="src" style="font-size:11.5px;color:var(--muted)">${L2("資料：文化部文化資產局 國家文化資產網開放資料","Data: Bureau of Cultural Heritage, Ministry of Culture (open data)")}</div>`}</div>`;
  card.hidden=false; sheet("peek");
  card.querySelector(".x").onclick=()=>{card.hidden=true;markers[id].setIcon(pinIcon(b,false));state.sel=null;render(false)};
  render(false);
  document.querySelector(`#list li[data-id="${id}"]`)?.scrollIntoView({block:"nearest"});
}
render();

// ---------- 土地權屬（行政區統計） ----------
// 來源：臺北市政府地政局「臺北市土地筆數面積及公告土地現值統計」115年檔（data.taipei），單位：公頃、筆
const OWN_SRC = "臺北市地政局，115年各行政區已辦竣所有權登記土地統計";
const OWN = {
  "松山區":{pub:[5175,499.76],pri:[11466,277.58],mix:[984,45.39]},
  "信義區":{pub:[7565,521.66],pri:[18406,519.79],mix:[1841,78.58]},
  "大安區":{pub:[10361,649.41],pri:[19480,402.02],mix:[2041,83.69]},
  "中山區":{pub:[8146,812.25],pri:[17782,460.97],mix:[1092,61.53]},
  "中正區":{pub:[9368,442.22],pri:[15542,230.05],mix:[706,45.10]},
  "大同區":{pub:[5865,207.59],pri:[20502,188.63],mix:[497,14.77]},
  "萬華區":{pub:[6229,324.96],pri:[21950,209.89],mix:[830,44.81]},
  "文山區":{pub:[17286,1442.16],pri:[28374,1478.60],mix:[2270,157.45]},
  "南港區":{pub:[8772,917.81],pri:[14954,1082.37],mix:[1320,164.01]},
  "內湖區":{pub:[9935,956.54],pri:[17031,1931.96],mix:[1880,269.02]},
  "士林區":{pub:[22046,2700.39],pri:[48546,3045.47],mix:[2436,171.33]},
  "北投區":{pub:[21165,3245.01],pri:[37606,2301.07],mix:[1586,97.79]},
};
for (const d of Object.values(OWN)) d.area = d.pub[1]+d.pri[1]+d.mix[1];
const OWN_COL = {pub:"#2f4a6b", pri:"#a8452a", mix:"#8c7b5c"};
const RAMP = {pub:["#e6dcc0","#5d7591","#1f3249"], pri:["#ecd8b8","#b5582e","#5a1f0c"]};
const mixHex=(a,b,t)=>"#"+[0,2,4].map(i=>Math.round(parseInt(a.substr(i+1,2),16)*(1-t)+parseInt(b.substr(i+1,2),16)*t).toString(16).padStart(2,"0")).join("");
const rampAt=(k,t)=>t<.5?mixHex(RAMP[k][0],RAMP[k][1],t*2):mixHex(RAMP[k][1],RAMP[k][2],(t-.5)*2);
const LO=0.25, HI=0.70; // 色階範圍（面積比例）
let ownLayer=null, townsGeo=null;
const pct=(d,k)=>d[k][1]/d.area;

function ownPopup(name){
  const d=OWN[name]; const row=(k,lab)=>`<tr><td><span class="sw" style="background:${OWN_COL[k]}"></span>${lab}</td><td>${(pct(d,k)*100).toFixed(1)}%</td><td>${d[k][1].toLocaleString()} ha</td><td>${d[k][0].toLocaleString()} 筆</td></tr>`;
  return `<div class="ownpop"><h4>${name}</h4>
    <div class="bar">${["pub","pri","mix"].map(k=>`<span style="width:${pct(d,k)*100}%;background:${OWN_COL[k]}"></span>`).join("")}</div>
    <table>${row("pub",T("公有"))}${row("pri",T("私有"))}${row("mix",T("公私共有"))}</table>
    <div class="src">${L2(`合計 ${d.area.toFixed(2)} 公頃。私有含自然人與法人，統計未再細分。<br>資料：${OWN_SRC}`,`Total ${d.area.toFixed(2)} ha. Private land includes individuals and companies; the statistics do not split them.<br>Data: Department of Land Administration, Taipei City Government`)}</div></div>`;
}
async function loadTowns(){
  if(townsGeo) return townsGeo;
  const topo = await fetch("https://cdn.jsdelivr.net/npm/taiwan-atlas@2021.9.20/towns-10t.json").then(r=>r.json());
  const all = topojson.feature(topo, topo.objects.towns);
  townsGeo = {type:"FeatureCollection", features: all.features.filter(f=>f.properties.COUNTYID==="A")};
  return townsGeo;
}
async function showOwn(k){
  if(ownLayer){ map.removeLayer(ownLayer); ownLayer=null; }
  const lg=document.getElementById("ownlegend");
  if(!k){ lg.hidden=true; return; }
  const geo=await loadTowns();
  ownLayer=L.geoJSON(geo,{
    style:f=>{const d=OWN[f.properties.TOWNNAME]; const t=d?Math.min(1,Math.max(0,(pct(d,k)-LO)/(HI-LO))):0;
      return {color:"#3a2816",weight:1.2,dashArray:"5 3",fillColor:d?rampAt(k,t):"#999",fillOpacity:.55};},
    onEachFeature:(f,l)=>{const n=f.properties.TOWNNAME; if(!OWN[n]) return;
      l.bindPopup(ownPopup(n),{maxWidth:320});
      l.bindTooltip(`${n.replace("區","")} ${(pct(OWN[n],k)*100).toFixed(0)}%`,{permanent:true,direction:"center",className:"dlabel"});
      l.on("mouseover",()=>l.setStyle({weight:2.5,dashArray:null})); l.on("mouseout",()=>l.setStyle({weight:1.2,dashArray:"5 3"}));}
  }).addTo(map);
  cluster.bringToFront?.();
  lg.innerHTML=`<div class="ramp" style="background:linear-gradient(90deg,${[0,.25,.5,.75,1].map(t=>rampAt(k,t)).join(",")})"></div>
    <div class="ticks"><span>≤${LO*100}%</span><span>${(LO+HI)*50}%</span><span>≥${HI*100}%</span></div>
    <div class="src">${L2("點行政區看公有／私有／公私共有明細","Click a district for public / private / mixed details")}</div>`;
  lg.hidden=false;
  map.flyToBounds(ownLayer.getBounds(),{paddingTopLeft:[20,20],paddingBottomRight:[innerWidth>760?260:20,20],duration:.6});
}
document.querySelectorAll('input[name="own"]').forEach(r=>r.onchange=()=>showOwn(r.value).catch(err=>{
  document.getElementById("ownlegend").hidden=false;
  document.getElementById("ownlegend").innerHTML=`<div class="src">${L2("行政區邊界載入失敗，請確認網路連線後再試一次。","District boundaries failed to load. Check your connection and try again.")}</div>`;
}));

window._arch={markers,pinIcon,state};
}

if(APP==="geo"){
// ---------- 地熱與地質（全臺，地熱探勘資訊平臺） ----------
const GEO_SRC='資料：經濟部地質調查及礦業管理中心「地熱探勘資訊平臺」第一類開放資料，下載日期 2026-11-07';
const GLAB={PH:"pH",pH:"pH",EC:"導電度",electrical:"導電度",TDS:"總溶解固體",Salinity:"鹽度",ORP:"氧化還原電位",DO:"溶氧",RDO:"溶氧",Temp:"水溫",MeasureT:"實測水溫",
  Cl:"氯 Cl⁻",SO42:"硫酸根 SO₄²⁻",SO4:"硫酸根 SO₄²⁻",HCO3:"碳酸氫根 HCO₃⁻",CO3:"碳酸根 CO₃²⁻",CO32:"碳酸根 CO₃²⁻",NO3:"硝酸根 NO₃⁻",No3:"硝酸根 NO₃⁻",PO4:"磷酸根 PO₄³⁻",PO43:"磷酸根 PO₄³⁻",NH4:"銨 NH₄⁺",
  Na:"鈉 Na",K:"鉀 K",k:"鉀 K",Ca:"鈣 Ca",Ca2:"鈣 Ca²⁺",Mg:"鎂 Mg",Mg2:"鎂 Mg²⁺",Fe:"鐵 Fe",Fe_all:"總鐵",Fe2:"亞鐵 Fe²⁺",Al:"鋁 Al",Al3:"鋁 Al³⁺",
  Si:"矽 Si",Si4:"矽 Si",SiO2:"二氧化矽 SiO₂",F:"氟 F⁻",Br:"溴 Br",B:"硼 B",B3:"硼 B",BOH3:"硼酸",HBO2:"偏硼酸",H25:"硫化氫",S:"硫 S",
  Li:"鋰 Li",Sr:"鍶 Sr",Ba:"鋇 Ba",Mn:"錳 Mn",As:"砷 As",Pb:"鉛 Pb",Zn:"鋅 Zn",Cu:"銅 Cu",Cd:"鎘 Cd",Cr:"鉻 Cr",Ni:"鎳 Ni",Co:"鈷 Co",Mo:"鉬 Mo",
  Sb:"銻 Sb",Se:"硒 Se",Sn:"錫 Sn",Ti:"鈦 Ti",U:"鈾 U",Ag:"銀 Ag",Be:"鈹 Be",Bi:"鉍 Bi",Cs:"銫 Cs",Rb:"銣 Rb",Ra:"鐳 Ra",NO:"一氧化氮",
  "TNa-K":"鈉鉀地溫計","TNa-K-Ca":"鈉鉀鈣地溫計","TK-Mg":"鉀鎂地溫計",TSiO2:"二氧化矽地溫計","Chal-Con":"玉髓地溫計","Q-adiabatic":"石英地溫計（絕熱）","Q-Conductive":"石英地溫計（傳導）",
  CO2:"二氧化碳",H2S:"硫化氫",SO2:"二氧化硫",CH4:"甲烷",N2:"氮",N:"氮",O2:"氧",Ar:"氬",He:"氦",H2:"氫",CO:"一氧化碳",HCl:"氯化氫",HCL:"氯化氫",C2H6:"乙烷",C3H8:"丙烷",
  Stotal:"總硫",N2CO:"氮＋一氧化碳",N2andCO:"氮＋一氧化碳",GasType:"氣體類型",
  He3He4:"³He/⁴He",He3overHe4:"³He/⁴He",threeHe4He:"³He/⁴He",He4Ne20:"⁴He/²⁰Ne",He4overNe20:"⁴He/²⁰Ne",Ne20overHe4:"²⁰Ne/⁴He",HeoverNe20:"He/²⁰Ne",fourHe20He:"⁴He/²⁰Ne",
  He4:"⁴He",fourHe:"⁴He",HeIsotope:"氦同位素",Mantle:"地函來源（%）",Crust:"地殼來源（%）",Air:"大氣來源（%）",
  dD:"δD",deltaD:"δD",dD18:"δ¹⁸O",delta18O:"δ¹⁸O",dO17SMOW:"δ¹⁷O",O17excess:"¹⁷O 過剩",dC13:"δ¹³C",oneThreeC:"δ¹³C",Sr87overSr86:"⁸⁷Sr/⁸⁶Sr",
  stdD:"δD 標準差",stdD18:"δ¹⁸O 標準差",stdDeltaD:"δD 標準差",stdDelta18O:"δ¹⁸O 標準差",std_Sr87overSr86:"⁸⁷Sr/⁸⁶Sr 標準差",Error:"誤差",
  Age:"年代（百萬年）",Method:"方法",Source:"文獻",source:"來源",SampleNo:"樣本編號",Site:"地點",sitename:"地點",SiteNo:"站號",siteid:"站號",No:"編號",Type:"類型",cType:"類型",
  SamplingDate:"採樣日期",samplingDate:"採樣日期",year:"採樣年",altitude:"海拔（m）",
  Dip:"傾角（°）",Strike:"走向（°）",Dilation_T:"擴張傾向",L:"剖面下限（m）",U:"剖面上限（m）",sectionName:"剖面名稱",
  name:"名稱",elevation:"井口高程（m）",total_depth:"鑽探深度（m）",vertical_depth:"垂直深度（m）",bottom_dx:"井底水平位移（m）",bottom_dir:"井底方位",start_date:"開鑽日期",end_date:"完鑽日期",note:"備註",
  Hole_No:"孔號",Proj_No:"計畫編號",Proj_Name:"計畫名稱",Well_Depth:"井深（m）",STATION_ADDR:"地址",CUR_ELEVATION:"高程（m）",Date_drill_begin:"開鑽日期",Date_drill_end:"完鑽日期",
  Z:"高程（m）",theDate:"量測日期",Operator:"操作人員",Auditor:"審核人員",dievceNo:"儀器",Loaction:"地區",
  Lithology:"岩性",SLine_ID:"測線編號",SLine_Length:"測線長度（m）",SLine_Strike:"測線走向",SLine_Dip:"測線傾角",SPlane_Attitude:"裂面位態",SPlane_Desc:"裂面描述",SPlane_Dir:"量測方向",Remark:"備註",
  Survey_Date:"調查日期",Survey_Place:"調查地點",Surveyor_1:"調查人員",
  rockname:"岩層名稱",rock:"岩層代號",rocklabel:"地層代號",code:"代號",abberv:"縮寫",category:"分類"};
const GLAB_EN={PH:"pH",pH:"pH",EC:"Conductivity",electrical:"Conductivity",TDS:"Total dissolved solids",Salinity:"Salinity",ORP:"Redox potential (ORP)",DO:"Dissolved oxygen",RDO:"Dissolved oxygen",Temp:"Water temperature",MeasureT:"Measured temperature",
  Cl:"Chloride Cl⁻",SO42:"Sulfate SO₄²⁻",SO4:"Sulfate SO₄²⁻",HCO3:"Bicarbonate HCO₃⁻",CO3:"Carbonate CO₃²⁻",CO32:"Carbonate CO₃²⁻",NO3:"Nitrate NO₃⁻",No3:"Nitrate NO₃⁻",PO4:"Phosphate PO₄³⁻",PO43:"Phosphate PO₄³⁻",NH4:"Ammonium NH₄⁺",
  Na:"Sodium Na",K:"Potassium K",k:"Potassium K",Ca:"Calcium Ca",Ca2:"Calcium Ca²⁺",Mg:"Magnesium Mg",Mg2:"Magnesium Mg²⁺",Fe:"Iron Fe",Fe_all:"Total iron",Fe2:"Ferrous iron Fe²⁺",Al:"Aluminium Al",Al3:"Aluminium Al³⁺",
  Si:"Silicon Si",Si4:"Silicon Si",SiO2:"Silica SiO₂",F:"Fluoride F⁻",Br:"Bromine Br",B:"Boron B",B3:"Boron B",BOH3:"Boric acid",HBO2:"Metaboric acid",H25:"Hydrogen sulfide",S:"Sulfur S",
  Li:"Lithium Li",Sr:"Strontium Sr",Ba:"Barium Ba",Mn:"Manganese Mn",As:"Arsenic As",Pb:"Lead Pb",Zn:"Zinc Zn",Cu:"Copper Cu",Cd:"Cadmium Cd",Cr:"Chromium Cr",Ni:"Nickel Ni",Co:"Cobalt Co",Mo:"Molybdenum Mo",
  Sb:"Antimony Sb",Se:"Selenium Se",Sn:"Tin Sn",Ti:"Titanium Ti",U:"Uranium U",Ag:"Silver Ag",Be:"Beryllium Be",Bi:"Bismuth Bi",Cs:"Caesium Cs",Rb:"Rubidium Rb",Ra:"Radium Ra",NO:"Nitric oxide",
  "TNa-K":"Na–K geothermometer","TNa-K-Ca":"Na–K–Ca geothermometer","TK-Mg":"K–Mg geothermometer",TSiO2:"Silica geothermometer","Chal-Con":"Chalcedony geothermometer","Q-adiabatic":"Quartz geothermometer (adiabatic)","Q-Conductive":"Quartz geothermometer (conductive)",
  CO2:"Carbon dioxide",H2S:"Hydrogen sulfide",SO2:"Sulfur dioxide",CH4:"Methane",N2:"Nitrogen",N:"Nitrogen",O2:"Oxygen",Ar:"Argon",He:"Helium",H2:"Hydrogen",CO:"Carbon monoxide",HCl:"Hydrogen chloride",HCL:"Hydrogen chloride",C2H6:"Ethane",C3H8:"Propane",
  Stotal:"Total sulfur",N2CO:"N₂ + CO",N2andCO:"N₂ + CO",GasType:"Gas type",
  He3He4:"³He/⁴He",He3overHe4:"³He/⁴He",threeHe4He:"³He/⁴He",He4Ne20:"⁴He/²⁰Ne",He4overNe20:"⁴He/²⁰Ne",Ne20overHe4:"²⁰Ne/⁴He",HeoverNe20:"He/²⁰Ne",fourHe20He:"⁴He/²⁰Ne",
  He4:"⁴He",fourHe:"⁴He",HeIsotope:"Helium isotope",Mantle:"Mantle source (%)",Crust:"Crustal source (%)",Air:"Atmospheric source (%)",
  dD:"δD",deltaD:"δD",dD18:"δ¹⁸O",delta18O:"δ¹⁸O",dO17SMOW:"δ¹⁷O",O17excess:"¹⁷O excess",dC13:"δ¹³C",oneThreeC:"δ¹³C",Sr87overSr86:"⁸⁷Sr/⁸⁶Sr",
  stdD:"δD std. dev.",stdD18:"δ¹⁸O std. dev.",stdDeltaD:"δD std. dev.",stdDelta18O:"δ¹⁸O std. dev.",std_Sr87overSr86:"⁸⁷Sr/⁸⁶Sr std. dev.",Error:"Error",
  Age:"Age (Ma)",Method:"Method",Source:"Reference",source:"Source",SampleNo:"Sample no.",Site:"Site",sitename:"Site",SiteNo:"Site no.",siteid:"Site no.",No:"No.",Type:"Type",cType:"Type",
  SamplingDate:"Sampling date",samplingDate:"Sampling date",year:"Sampling year",altitude:"Altitude (m)",
  Dip:"Dip (°)",Strike:"Strike (°)",Dilation_T:"Dilation tendency",L:"Section bottom (m)",U:"Section top (m)",sectionName:"Section name",
  name:"Name",elevation:"Wellhead elevation (m)",total_depth:"Drilled depth (m)",vertical_depth:"Vertical depth (m)",bottom_dx:"Bottom-hole displacement (m)",bottom_dir:"Bottom-hole bearing",start_date:"Spud date",end_date:"Completion date",note:"Note",
  Hole_No:"Hole no.",Proj_No:"Project no.",Proj_Name:"Project",Well_Depth:"Well depth (m)",STATION_ADDR:"Address",CUR_ELEVATION:"Elevation (m)",Date_drill_begin:"Spud date",Date_drill_end:"Completion date",
  Z:"Elevation (m)",theDate:"Survey date",Operator:"Operator",Auditor:"Reviewer",dievceNo:"Instrument",Loaction:"Area",
  Lithology:"Lithology",SLine_ID:"Scanline ID",SLine_Length:"Scanline length (m)",SLine_Strike:"Scanline strike",SLine_Dip:"Scanline dip",SPlane_Attitude:"Fracture attitude",SPlane_Desc:"Fracture description",SPlane_Dir:"Measurement direction",Remark:"Remark",
  Survey_Date:"Survey date",Survey_Place:"Survey site",Surveyor_1:"Surveyor",
  rockname:"Rock unit",rock:"Unit code",rocklabel:"Unit label",code:"Code",abberv:"Abbreviation",category:"Category"};
// 水化學濃度：mg/L
const MGL=new Set(["TDS","Cl","SO42","SO4","HCO3","CO3","CO32","NO3","No3","PO4","PO43","NH4","Na","K","k","Ca","Ca2","Mg","Mg2","Fe","Fe_all","Fe2","Al","Al3",
  "Si","Si4","SiO2","F","Br","B","B3","BOH3","HBO2","H25","S","Li","Sr","Ba","Mn","As","Pb","Zn","Cu","Cd","Cr","Ni","Co","Mo","Sb","Se","Sn","Ti","U","Ag","Be","Bi","Cs","Rb","DO","RDO","NO"]);
const DEGC=new Set(["Temp","MeasureT","TNa-K","TNa-K-Ca","TK-Mg","TSiO2","Chal-Con","Q-adiabatic","Q-Conductive"]);
const SKIP=new Set(["id","OBJECTID","lat","lng","coorx","coory","x97","y97","properties","photoName","Coord_Start","Coord_End","startPositionX","startPositionY","endPositionX","endPositionY","dievceSN","Surveyor_2","Surveyor_3"]);
const isWaterSet=key=>/chemistry_(hotspring|cmwell)$|_wq$|hotsprint_analysis$|_geotemperature$/.test(key);
const fmtV=v=>{if(typeof v==="string"){if(/^b\.?d\.?l\.?$/i.test(v.trim()))return L2("低於偵測極限","below detection limit");const n=+v;if(v.trim()!==""&&!isNaN(n))v=n;else return v;}
  return typeof v==="number"?(Math.abs(v)<0.001&&v!==0?v.toExponential(2):v.toLocaleString(undefined,{maximumFractionDigits:4})):v;};
// 民國日期（例如 711114、1050302）轉成「民國 71 年 11 月 14 日（1982-11-14）」，避免被當成數字加千分位
function rocDate(k,v){
  if(!/date/i.test(k)) return null; const m=String(v??"").trim().match(/^(\d{2,3})(\d{2})(\d{2})$/); if(!m) return null;
  const y=+m[1],mo=+m[2],d=+m[3]; if(mo<1||mo>12||d<1||d>31) return null;
  const iso=`${y+1911}-${m[2]}-${m[3]}`; return L2(`民國 ${y} 年 ${mo} 月 ${d} 日（${iso}）`,iso);
}
function propTable(p,key){
  const water=isWaterSet(key);
  const rows=Object.keys(p).filter(k=>!SKIP.has(k)&&p[k]!==null&&p[k]!==""&&p[k]!==undefined).map(k=>{
    const unit=water&&MGL.has(k)?" mg/L":DEGC.has(k)?" °C":"";
    const v=rocDate(k,p[k])??fmtV(p[k]), num=typeof v==="number"||!isNaN(+String(v).replace(/,/g,""));return `<tr><td>${(EN?GLAB_EN[k]:GLAB[k])||k}</td><td${num?" class=\"n\"":""}>${v}${num?unit:""}</td></tr>`;});
  return rows.length?`<table>${rows.join("")}</table>`:"";
}
const KMZ_SRC=L2("資料：使用者提供的井位資料（井位.kmz）；圖片與報告連結為原始網址","Data: user-supplied well locations (井位.kmz); images and report links point to their original hosts");
const pop=(t,m,body,src=GEO_SRC)=>`<div class="geopop"><h4>${t}</h4>${m?`<div class="m">${m}</div>`:""}${body}<div class="src">${src}</div></div>`;
// 井位.kmz 的彈出內容：說明、圖片（點圖開原尺寸）、報告連結
const hesc=s=>String(s??"").replace(/[<>&"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[ch]));
const kwellBody=p=>(p.desc?`<p style="margin:0 0 6px">${hesc(p.desc)}</p>`:"")+
  (p.imgs||[]).map(u=>`<a href="${hesc(u)}" target="_blank" rel="noopener"><img src="${hesc(u)}" alt="${hesc(p.name)}" loading="lazy" style="display:block;width:100%;max-height:260px;object-fit:contain;margin:4px 0;border:1px solid var(--rule);background:#fff" onerror="this.parentNode.remove()"></a>`).join("")+
  (p.links||[]).map(u=>`<div><a href="${hesc(u)}" target="_blank" rel="noopener">${L2("報告連結","Report link")}：${hesc(u)}</a></div>`).join("");
const KWELL_TYPES=[["#c2255c","地質調查井","Geological survey well"],["#2b8a3e","水井","Water well"],["#1c7ed6","地熱探勘井","Geothermal exploration well"]];
const phColor=ph=>ph==null||isNaN(ph)?"#8a8a8a":ph<3?"#c0392b":ph<5?"#e67e22":ph<7?"#d4ac0d":"#2e86c1";
function rockColor(p){const lab=String(p.rocklabel||p.code||p.rock||p.abberv||p.rockname||"");let h=0;for(const ch of lab)h=(h*31+ch.charCodeAt(0))%9973;
  const cat=p.category||"";const [a,b]=cat.includes("大屯")?[5,25]:cat.includes("觀音")?[275,305]:cat.includes("沉積")?[45,95]:[0,360];
  return `hsl(${a+(h%(b-a))} ${cat.includes("沉積")?45:55}% ${55+(h%20)}%)`;}
map.createPane("geo"); map.getPane("geo").style.zIndex=420;
map.createPane("geofill"); map.getPane("geofill").style.zIndex=390;
const dot=(color,r=6,w=1.5)=>({pane:"geo",radius:r,color:"#ffffff",weight:w,fillColor:color,fillOpacity:.95});

// 目錄：地區與資料集名稱
const REGION_VIEW={"全臺":[23.7,120.95,7.5],"大屯山區":[25.17,121.55,11.5],"宜蘭":[24.6,121.62,11],"花蓮":[23.5,121.37,11],"臺東":[22.75,121.0,10],"臺東霧鹿":[23.17,121.03,12],
  "臺中谷關":[24.2,121.0,12],"南投廬山":[24.03,121.18,12.5],"南投東埔":[23.56,120.93,12.5],"臺南關子嶺":[23.33,120.5,12.5],"高雄寶來":[23.1,120.7,12]};
function geoKind(key,geom){
  if(/^kmz_/.test(key)) return "kwell";
  if(/-gm$/.test(key)) return "gm";
  if(/section|profile/.test(key)) return "section";
  if(/lineament|_line$/.test(key)) return "line";
  if(/drill/.test(key)) return "drill";
  if(/tvgsite/.test(key)) return "mt";
  if(/fissure|fracture/.test(key)) return "fissure";
  if(/dating/.test(key)) return "dating";
  if(/isotope/.test(key)) return "iso";
  if(/gas|endanalysis|bubble/.test(key)) return "gas";
  if(/geotemperature/.test(key)) return "temp";
  if(isWaterSet(key)) return "water";
  return /Line/.test(geom)?"line":"pt";
}
const KIND={kwell:["井位（KMZ）","#c2255c"],gm:["地質圖","#d98c5f"],section:["地質剖面線","#2c3e50"],line:["線型構造","#7b3f9e"],drill:["鑽井","#34495e"],mt:["大地電磁測點","#7f8c8d"],
  fissure:["裂隙調查","#b03a2e"],dating:["定年","#8e5a2b"],iso:["同位素","#8e44ad"],gas:["氣體分析","#16a085"],temp:["地溫計","#e67e22"],water:["水質","#2e86c1"],pt:["資料點","#555"],
  wexp:["地熱探勘井","#c92a2a"],wsvy:["地質調查井","#5f3dc4"],wwat:["水井","#2b8a3e"],
  sexp:["探勘許可","#e8590c"],sdev:["開發許可","#a61e4d"],sdemo:["示範獎勵","#1971c2"]};
// 現有地熱案場（能源署）：探勘許可＝橘色三角形、開發許可＝酒紅色六角形、示範獎勵＝藍色星形；申請中用空心
const SITE_SHAPE={sexp:"12,2 22,20 2,20",sdev:"12,1.5 21.5,7 21.5,17 12,22.5 2.5,17 2.5,7",sdemo:"12,1.5 14.9,8.6 22.5,9.2 16.7,14.1 18.5,21.6 12,17.6 5.5,21.6 7.3,14.1 1.5,9.2 9.1,8.6"};
const siteIcon=(k,s,hollow)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="display:block;overflow:visible;filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.45))"><polygon points="${SITE_SHAPE[k]}" fill="${hollow?"#fff":KIND[k][1]}" stroke="${hollow?KIND[k][1]:"#fff"}" stroke-width="${hollow?3:2}" stroke-linejoin="round"/></svg>`;
const SITE_TR={"探勘許可":"Exploration permit","開發許可":"Development permit","示範獎勵":"Demonstration incentive","已通過":"Approved","申請中":"Under review"};
const st=s=>EN?(SITE_TR[s]||s):s;
const SITE_SRC=L2('資料：經濟部能源署「地熱發電單一服務窗口」<a href="https://ea01.moeaea.gov.tw/b0403/SupplyChainNew/Index" target="_blank" rel="noopener">國內地熱案場</a>（2026-11-09 下載，網站更新日期 2026/10/27）',
  'Data: Energy Administration, MOEA, Geothermal Single Service Window, <a href="https://ea01.moeaea.gov.tw/b0403/SupplyChainNew/Index" target="_blank" rel="noopener">domestic geothermal sites</a> (downloaded 2026-11-09; site updated 2026-10-27)');
function siteBody(p){
  const where=p.precision==="town"?L2(`${p.county}${p.town}`,p.placeEn):L2(p.county,p.placeEn);
  const rows=[[L2("公司名稱","Company"),hesc(p.company)],p.project?[L2("案名","Project"),hesc(p.project)]:null,
    [L2("地點（能源署原文）","Location (as listed)"),hesc(p.loc)+(p.part?L2(`（第 ${p.part.split("/")[0]} 處，共 ${p.part.split("/")[1]} 處）`,` (site ${p.part})`):"")],
    [L2("類別","Category"),st(p.cat)],[L2("狀態","Status"),st(p.status)],
    p.also?.length?[L2("同公司也列在","Same company also in"),p.also.map(([c,s])=>EN?`${st(c)} (${st(s)})`:`${c}（${s}）`).join(L2("、","; "))]:null].filter(Boolean);
  return `<table>${rows.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>`+
    `<div class="m" style="margin-top:6px">${L2(`約略位置：能源署頁面沒有座標，這個點放在${where}的代表點${p.spread?"附近（同區多筆時稍微錯開）":""}，不是案場實際位置。`,
      `Approximate location: the source has no coordinates, so this point sits at a representative point of ${where}${p.spread?" (offset slightly where several sites share an area)":""}. It is not the actual site.`)}</div>`;
}
// 井的符號：探勘井＝紅色菱形、地質調查井＝紫色方形、水井＝綠色圓形（s 為邊長 px）
const WICON={wexp:s=>`<div style="width:${s}px;height:${s}px;background:#c92a2a;border:2px solid #fff;transform:rotate(45deg) scale(.85);box-shadow:0 1px 3px rgba(0,0,0,.45)"></div>`,
  wsvy:s=>`<div style="width:${s}px;height:${s}px;background:#5f3dc4;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></div>`,
  wwat:s=>`<div style="width:${s}px;height:${s}px;background:#2b8a3e;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.45)"></div>`};
const GEO_CAT=(window.GEOTEX_CATALOG||[]).map(([key,s,n,geom,kb])=>{
  let region,name;
  if(s.startsWith("大地電磁法測點")){region=(s.match(/\)\((\S+)/)||[])[1]||"全臺";name="大地電磁法測點";}
  else if(s.startsWith("中油")){region="全臺";name=s.replace(/\([A-Za-z][^()]*\)$/,"");}
  else if(s.startsWith("大屯火山群地質圖")){region="大屯山區";name="大屯火山群地質圖";}
  else{const [r,...rest]=s.split("：");region=r.replace(/\([^()]*\)$/,"");name=(rest.join("：")||r).replace(/\([A-Za-z][^()]*\)$/,"");}
  region=region.replace(/地區$/,"").replace(/^臺東霧鹿$/,"臺東霧鹿");
  const enName=s.startsWith("大地電磁法測點")?"Magnetotelluric (MT) stations":s.startsWith("大屯火山群地質圖")?"Tatun Volcano Group geology map":(((s.split("：").slice(1).join("：")||s).match(/\(([A-Za-z][^()]*)\)$/)||[])[1]||name);
  return {key,region,name:EN?enName:name,n,geom,kb,kind:geoKind(key,geom)};
});
// 井：從各地區清單抽出，依用途分成四類，每類一次列出全臺的井。結元公司的 KMZ 依點的顏色拆成探勘井、地質調查井、水井。
const JY=window.GEOTEX_D?.kmz_jieyuan?.features||[];
const WSUB={exp:["wexp","地熱探勘井","exploration wells"],svy:["wsvy","地質調查井","geological survey wells"],wat:["wwat","水井","water wells"],spr:["water"],
  sexp:["sexp"],sdev:["sdev"],sdemo:["sdemo"]};
const WELL_GROUPS=[
  {id:"geo",zh:"地熱井",en:"Geothermal wells",items:[["geo_geothermaldrill","exp"],["kmz_sihuangziping","exp"],["kmz_matsao","exp"],["kmz_jieyuan","exp","#1c7ed6"],
    ["kmz_jieyuan","svy","#c2255c"],["geo_hualien_drill","svy"],["geo_taitung_drill","svy"],["geo_ttwulu_drill","svy"],["geo_tcguguan_drill","svy"]]},
  {id:"water",zh:"水井",en:"Water wells",items:[["kmz_jieyuan","wat","#2b8a3e"],["env","envWel"]]},
  {id:"spring",zh:"溫泉井",en:"Hot spring wells",note:["這組原名「井體水化學」，是井內水樣的化學分析；歸為溫泉井是暫定，分類未能確認。","Originally named well-water chemistry; filing it as hot spring wells is provisional and unconfirmed."],items:[["chemistry_cmwell","spr"]]},
  {id:"eng",zh:"工程井",en:"Engineering boreholes",items:[["env","envBor"]]},
  // 現有地熱案場：放在「現有地熱案場」區塊（box），三類各一個勾選
  {id:"site",box:"sitechecks",zh:"現有地熱案場",en:"Existing geothermal projects",
    note:["能源署頁面沒有座標，點位是鄉鎮（只寫縣市的用縣市）代表點，屬約略位置。同一公司可能同時列在好幾類，各類各畫一點。",
      "The source lists no coordinates; points sit at township (or county) representative points and are approximate. A company listed in several categories gets one point per category."],
    items:[["ea_explore","sexp"],["ea_develop","sdev"],["ea_demo","sdemo"]]},
];
const WELL_ITEMS=[];
WELL_GROUPS.forEach(g=>{g.items=g.items.map(([key,sub,pick])=>{
  if(key==="env") return {env:sub};
  const b=GEO_CAT.find(c=>c.key===key); if(!b) return null;
  const [kind,zh,en]=WSUB[sub], name=(b.region==="全臺"?"":T(b.region)+"・")+(/drill$/.test(key)&&sub==="svy"?L2(zh,"Geological survey wells"):b.name)+(pick?L2(`・${zh}`,` – ${en}`):"");
  const c={...b,key:pick?`${key}_${sub}`:key,src:key,pick,well:g.id,kind,name,n:pick?JY.filter(f=>f.properties.color===pick).length:b.n};
  WELL_ITEMS.push(c); return c;}).filter(Boolean);});
for(let i=GEO_CAT.length-1;i>=0;i--) if(WELL_ITEMS.some(w=>w.src===GEO_CAT[i].key)) GEO_CAT.splice(i,1);
GEO_CAT.push(...WELL_ITEMS);
const geoOn={};
function makeGeoLayer(c,fc){
  const k=c.kind, title=f=>{const p=f.properties;return p.Site||p.sitename||p.name||p.Survey_Place||p.SiteNo||p.siteid||p.No||p.Hole_No||p.SLine_ID||p.sectionName||c.name;};
  const meta=c.well?c.name:`${T(c.region)}・${c.name}`, isK=/^kmz_/.test(c.src||c.key);
  const bind=(f,l)=>l.bindPopup(()=>{const ll=l.getLatLng?l.getLatLng():l.getBounds().getCenter();
    if(SITE_SHAPE[k]) return pop(hesc(f.properties.company),L2(`現有地熱案場・${f.properties.cat}・${f.properties.status}`,`Existing project · ${st(f.properties.cat)} · ${st(f.properties.status)}`),siteBody(f.properties),SITE_SRC);
    if(isK) return pop(hesc(title(f)),meta,kwellBody(f.properties)+
      `<div style="margin-top:6px"><a href="${earthUrl(ll.lat,ll.lng,1500)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div>`,KMZ_SRC);
    return pop(k==="gm"?(f.properties.rockname||c.name):title(f),meta,propTable(f.properties,c.key)+
      `<div style="margin-top:6px"><a href="${earthUrl(ll.lat,ll.lng,l.getLatLng?1500:6000)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div>`);});
  if(k==="gm") return L.geoJSON(fc,{pane:"geofill",style:f=>({color:"#5a4632",weight:.6,fillColor:rockColor(f.properties),fillOpacity:.5}),onEachFeature:bind});
  if(k==="line"||k==="section") return L.geoJSON(fc,{pane:"geo",style:k==="line"?{color:"#7b3f9e",weight:1.5,opacity:.85}:{color:"#2c3e50",weight:2.5,dashArray:"8 4"},onEachFeature:bind});
  return L.geoJSON(fc,{
    pointToLayer:(f,ll)=>{const p=f.properties;
      if(SITE_SHAPE[k]) return L.marker(ll,{pane:"geo",icon:L.divIcon({className:"",iconSize:[18,18],html:siteIcon(k,18,p.status==="申請中")})})
        .bindTooltip(hesc(p.company)+(p.project?`（${hesc(p.project)}）`:""),{direction:"top",offset:[0,-9]});
      if(WICON[k]) return L.marker(ll,{pane:"geo",icon:L.divIcon({className:"",iconSize:[14,14],html:WICON[k](k==="wexp"?14:12)})}).bindTooltip(hesc(title(f)),{direction:"top",offset:[0,-8]});
      if(k==="kwell") return L.marker(ll,{pane:"geo",icon:L.divIcon({className:"",iconSize:[14,14],html:`<div style="width:14px;height:14px;background:${p.color||KIND.kwell[1]};border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,.45)"></div>`})}).bindTooltip(hesc(p.name),{direction:"top",offset:[0,-8]});
      if(k==="drill") return L.marker(ll,{pane:"geo",icon:L.divIcon({className:"",iconSize:[13,13],html:'<div style="width:13px;height:13px;background:#34495e;border:2px solid #fff;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>'})});
      if(k==="water") return L.circleMarker(ll,dot(phColor(+(p.PH??p.pH)),6.5));
      return L.circleMarker(ll,dot(KIND[k][1],k==="mt"||k==="dating"?4.5:5.5,1.2));},
    style:{color:KIND[k][1],weight:2},onEachFeature:bind});
}
const loaded={};
function loadSet(key){ if(window.GEOTEX_D?.[key]) return Promise.resolve(window.GEOTEX_D[key]);
  return loaded[key]??=new Promise((ok,fail)=>{const s=document.createElement("script");s.src=`geotex/${key}.js`;
  s.onload=()=>window.GEOTEX_D&&window.GEOTEX_D[key]?ok(window.GEOTEX_D[key]):fail();s.onerror=fail;document.head.appendChild(s);}); }
function geoLegend(){
  const lg=document.getElementById("geolegend"), on=GEO_CAT.filter(c=>geoOn[c.key]), parts=[];
  if(on.some(c=>c.kind==="water"&&!c.well)) parts.push(`<div class="row">${L2("水質 pH：","Water pH: ")}${[["<3","#c0392b"],["3–5","#e67e22"],["5–7","#d4ac0d"],["≥7","#2e86c1"]].map(([t,c])=>`<span><span class="k" style="background:${c};border-radius:50%"></span>${t}</span>`).join("")}</div>`);
  if(on.some(c=>c.key==="geo_tatun-gm")) parts.push(`<div class="row">${L2("大屯地質：","Tatun geology: ")}${[[L2("大屯山火成岩","Tatun volcanics"),"hsl(15 55% 62%)"],[L2("觀音山火成岩","Kuanyin volcanics"),"hsl(290 55% 62%)"],[L2("沉積岩","Sedimentary"),"hsl(70 45% 65%)"]].map(([t,c])=>`<span><span class="k" style="background:${c}"></span>${t}</span>`).join("")}</div>`);
  if(on.length) parts.push(`<div class="row">${L2(`已開啟 ${on.length} 個圖層`,`${on.length} layer${on.length>1?"s":""} on`)} <button type="button" class="btn" id="geooff" style="padding:2px 10px;font-size:12px">${L2("全部關閉","Turn all off")}</button></div><div class="src">${L2("水化學濃度單位為 mg/L，地溫計與水溫為 °C。","Water chemistry concentrations are in mg/L; geothermometers and water temperature in °C.")}</div>`);
  lg.innerHTML=parts.join(""); lg.hidden=!parts.length;
  const off=document.getElementById("geooff"); if(off) off.onclick=()=>{GEO_CAT.forEach(c=>{if(geoOn[c.key]){map.removeLayer(c.layer);geoOn[c.key]=false;const b=document.getElementById("gx_"+c.key);if(b)b.checked=false;}});["envWel","envBor"].forEach(id=>{const b=document.getElementById(id);if(b?.checked){b.checked=false;b.dispatchEvent(new Event("change"));}});renderGeoChecks();geoLegend();};
  wellLegend();
}
// 井的圖例：符號、溫泉井的 pH 色階，再加上即時觀測井與工程鑽孔（那兩個由環境資料區塊提供）
function wellLegend(){
  const lg=document.getElementById("welllegend"); if(!lg) return;
  const on=WELL_ITEMS.filter(c=>geoOn[c.key]), parts=[], kinds=new Set(on.map(c=>c.kind));
  const sym=["wexp","wsvy","wwat"].filter(k=>kinds.has(k));
  if(sym.length) parts.push(`<div class="row">${sym.map(k=>`<span class="wl">${WICON[k](9)}${L2(KIND[k][0],WSUB[{wexp:"exp",wsvy:"svy",wwat:"wat"}[k]][2].replace(/^./,ch=>ch.toUpperCase()))}</span>`).join("")}</div>`);
  if(kinds.has("water")) parts.push(`<div class="row">${L2("溫泉井水質 pH：","Hot spring well pH: ")}${[["<3","#c0392b"],["3–5","#e67e22"],["5–7","#d4ac0d"],["≥7","#2e86c1"]].map(([t,c])=>`<span><span class="k" style="background:${c};border-radius:50%"></span>${t}</span>`).join("")}</div>`);
  const env=window._wellEnvLegend?.()||""; if(env) parts.push(env);
  lg.innerHTML=parts.join(""); lg.hidden=!parts.length; syncWells(); siteLegend();
}
// 現有地熱案場圖例：開啟的類別符號，加上實心＝已通過、空心＝申請中
function siteLegend(){
  const lg=document.getElementById("sitelegend"); if(!lg) return;
  const on=WELL_ITEMS.filter(c=>geoOn[c.key]&&SITE_SHAPE[c.kind]);
  if(!on.length){lg.hidden=true;lg.innerHTML="";return;}
  const k0=on[0].kind;
  lg.innerHTML=`<div class="row">${on.map(c=>`<span class="wl">${siteIcon(c.kind,12)}${L2(KIND[c.kind][0],st(KIND[c.kind][0]))}</span>`).join("")}</div>`+
    `<div class="row"><span class="wl">${siteIcon(k0,12)}${L2("已通過","Approved")}</span><span class="wl">${siteIcon(k0,12,true)}${L2("申請中","Under review")}</span></div>`+
    `<div class="src">${L2("點位為鄉鎮或縣市代表點，屬約略位置。","Points are township or county representative points (approximate).")} ${SITE_SRC}</div>`;
  lg.hidden=false;
}
const syncWells=()=>WELL_GROUPS.forEach(g=>g.sync?.());
window._wellLegend=wellLegend;
async function toggleGeo(c,on,box){
  if(!on){ if(c.layer) map.removeLayer(c.layer); geoOn[c.key]=false; geoLegend(); return; }
  box.disabled=true;
  try{ const fc=await loadSet(c.src||c.key); c.fc??=c.pick?{...fc,features:fc.features.filter(f=>f.properties.color===c.pick)}:fc; c.layer??=makeGeoLayer(c,c.fc); }
  catch(e){ box.checked=false; box.disabled=false; syncWells(); const lg=document.getElementById("geolegend"); lg.hidden=false;
    lg.innerHTML=`<div class="src">${L2(`找不到 geotex/${c.src||c.key}.js，請確認 geotex 資料夾和這個網頁放在一起。`,`Cannot find geotex/${c.src||c.key}.js. Keep the geotex folder next to this page.`)}</div>`; return; }
  box.disabled=false; c.layer.addTo(map); geoOn[c.key]=true; geoLegend();
  const b=c.layer.getBounds?.(); if(b&&b.isValid()&&!map.getBounds().intersects(b)) map.flyToBounds(b,{paddingBottomRight:[innerWidth>760?280:20,20],maxZoom:13,duration:.7});
}
const regSel=document.createElement("select"); regSel.id="georegion"; regSel.setAttribute("aria-label","地熱調查地區");
// 調查地區依北、中、南、東分組（全臺的資料若有，放最前面）；井已移到下方「井」區塊，不算在地區裡
const REGION_ZONES=[["北部","North",["大屯山區","宜蘭"]],["中部","Central",["臺中谷關","南投廬山","南投東埔"]],["南部","South",["臺南關子嶺","高雄寶來"]],["東部","East",["花蓮","臺東","臺東霧鹿"]]];
const regions=[...new Set(GEO_CAT.filter(c=>!c.well).map(c=>c.region))];
const regOpt=r=>{const k=GEO_CAT.filter(c=>c.region===r&&!c.well).length;return new Option(EN?`${T(r)} (${k} datasets)`:`${r}（${k} 組）`,r);};
if(regions.includes("全臺")) regSel.add(regOpt("全臺"));
[...REGION_ZONES,["其他","Other",regions.filter(r=>r!=="全臺"&&!REGION_ZONES.some(z=>z[2].includes(r)))]].forEach(([zh,en,rs])=>{
  rs=rs.filter(r=>regions.includes(r)); if(!rs.length) return;
  const og=document.createElement("optgroup"); og.label=L2(zh,en); rs.forEach(r=>og.appendChild(regOpt(r))); regSel.appendChild(og);});
regSel.value="大屯山區";
regSel.onchange=()=>{renderGeoChecks();const v=REGION_VIEW[regSel.value];if(v)map.flyTo([v[0],v[1]],v[2],{duration:.7});};
document.getElementById("geochecks").before(regSel);
function renderGeoChecks(){
  const box=document.getElementById("geochecks"); box.innerHTML="";
  GEO_CAT.filter(c=>c.region===regSel.value&&!c.well).sort((a,b)=>Object.keys(KIND).indexOf(a.kind)-Object.keys(KIND).indexOf(b.kind)).forEach(c=>{
    const lab=document.createElement("label"), id="gx_"+c.key;
    lab.innerHTML=`<input type="checkbox" id="${id}" ${geoOn[c.key]?"checked":""}> <span class="sw" style="background:${KIND[c.kind][1]}${c.kind==="gm"?";border-radius:2px":""}"></span>${c.name}<span class="count" style="margin-left:auto;padding-left:6px">${c.n}</span>`;
    const cb=lab.querySelector("input"); cb.onchange=()=>toggleGeo(c,cb.checked,cb); box.appendChild(lab);
  });
}
// 「井」區塊：每類一個總開關（勾了就開全臺這類的井），底下列出各組資料可以單獨開關。只建一次，環境資料區塊之後會接上 envWel、envBor 的開關。
const ENV_WELL={envWel:[L2("水文地質觀測井（地調中心，即時）","Hydrogeological observation wells (GSMMA, live)"),L2("即時","live"),"#1e88e5"],
  envBor:[L2("工程鑽孔分布（地調中心）","Engineering boreholes (GSMMA)"),L2("約 7.3 萬","~73k"),"#444"]};
function renderWellChecks(){
  if(!document.getElementById("wellchecks")) return;
  WELL_GROUPS.forEach(g=>{
    const box=document.getElementById(g.box||"wellchecks"); if(!box) return;
    const wrap=document.createElement("div"); wrap.className="wgroup";
    const head=document.createElement("label"); head.className="whead";
    head.innerHTML=`<input type="checkbox"> <b>${L2(g.zh,g.en)}</b><span class="count">${L2(`${g.items.length} 組`,`${g.items.length} set${g.items.length>1?"s":""}`)}</span>`;
    const list=document.createElement("div"); list.className="witems"; const subs=[];
    g.items.forEach(it=>{
      const lab=document.createElement("label");
      if(it.env){ const [nm,cnt,col]=ENV_WELL[it.env];
        lab.innerHTML=`<input type="checkbox" id="${it.env}"> <span class="sw" style="background:${col}${it.env==="envBor"?";border-radius:1px":""}"></span>${nm}<span class="count">${cnt}</span>`; }
      else{ lab.innerHTML=`<input type="checkbox" id="gx_${it.key}"> <span class="wsym">${SITE_SHAPE[it.kind]?siteIcon(it.kind,12):WICON[it.kind]?WICON[it.kind](8):`<span class="sw" style="background:${KIND.water[1]}"></span>`}</span>${it.name}<span class="count">${it.n}</span>`;
        const cb=lab.querySelector("input"); cb.onchange=()=>toggleGeo(it,cb.checked,cb); }
      const cb=lab.querySelector("input"); cb.addEventListener("change",()=>g.sync()); subs.push(cb); list.appendChild(lab);
    });
    const hc=head.querySelector("input");
    g.sync=()=>{const k=subs.filter(s=>s.checked).length; hc.checked=k===subs.length; hc.indeterminate=k>0&&k<subs.length;};
    hc.onchange=()=>{const on=hc.checked; subs.forEach(s=>{if(s.checked!==on&&!s.disabled){s.checked=on;s.dispatchEvent(new Event("change"));}}); g.sync();};
    wrap.append(head,list);
    if(g.note){const n=document.createElement("div"); n.className="src"; n.textContent=L2(...g.note); wrap.appendChild(n);}
    box.appendChild(wrap);
  });
}
renderWellChecks();
// ---------- 匯出 KML：把目前開啟的圖層存成 Google Earth 可以開啟的檔案 ----------
const xesc=s=>String(s??"").replace(/[<>&]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[ch]));
const kcoord=c=>c.map(p=>`${p[0]},${p[1]},${p[2]??0}`).join(" ");
function kgeom(g){
  if(!g) return "";
  const ring=r=>`<outerBoundaryIs><LinearRing><coordinates>${kcoord(r)}</coordinates></LinearRing></outerBoundaryIs>`;
  const poly=p=>`<Polygon>${ring(p[0])}${p.slice(1).map(h=>`<innerBoundaryIs><LinearRing><coordinates>${kcoord(h)}</coordinates></LinearRing></innerBoundaryIs>`).join("")}</Polygon>`;
  switch(g.type){
    case "Point": return `<Point><coordinates>${g.coordinates[0]},${g.coordinates[1]},0</coordinates></Point>`;
    case "MultiPoint": return `<MultiGeometry>${g.coordinates.map(p=>`<Point><coordinates>${p[0]},${p[1]},0</coordinates></Point>`).join("")}</MultiGeometry>`;
    case "LineString": return `<LineString><tessellate>1</tessellate><coordinates>${kcoord(g.coordinates)}</coordinates></LineString>`;
    case "MultiLineString": return `<MultiGeometry>${g.coordinates.map(l=>`<LineString><tessellate>1</tessellate><coordinates>${kcoord(l)}</coordinates></LineString>`).join("")}</MultiGeometry>`;
    case "Polygon": return poly(g.coordinates);
    case "MultiPolygon": return `<MultiGeometry>${g.coordinates.map(poly).join("")}</MultiGeometry>`;
  } return "";
}
const kcolor=hex=>{const h=hex.replace("#","");return "ff"+h.slice(4,6)+h.slice(2,4)+h.slice(0,2);};
function exportKML(){
  const on=GEO_CAT.filter(c=>geoOn[c.key]); if(!on.length) return;
  const folders=on.map(c=>{const fc=c.fc||window.GEOTEX_D[c.src||c.key], col=kcolor(KIND[c.kind][1]);
    const isS=!!SITE_SHAPE[c.kind], icon=n=>`<Style id="s_${c.key}${n?"_p":""}"><IconStyle><color>${n?"88"+col.slice(2):col}</color><scale>${isS?1:0.8}</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/shaded_dot.png</href></Icon></IconStyle><LineStyle><color>${col}</color><width>2</width></LineStyle><PolyStyle><color>66${col.slice(2)}</color></PolyStyle></Style>`;
    const style=icon(false)+(isS?icon(true):"");
    const pms=fc.features.map(f=>{const p=f.properties||{};
      const nm=isS?p.company+(p.project?`（${p.project}）`:"")+L2(`・${p.status}`,` – ${st(p.status)}`):p.rockname||p.Site||p.sitename||p.name||p.SiteNo||p.siteid||p.No||p.Hole_No||p.SLine_ID||p.sectionName||c.name;
      const desc=isS?siteBody(p)+`<div>${SITE_SRC}</div>`:/^kmz_/.test(c.src||c.key)?kwellBody(p):propTable(p,c.src||c.key);
      return `<Placemark><name>${xesc(nm)}</name><styleUrl>#s_${c.key}${isS&&p.status==="申請中"?"_p":""}</styleUrl><description><![CDATA[${desc}]]></description>${kgeom(f.geometry)}</Placemark>`;}).join("\n");
    return `<Folder><name>${xesc(isS?L2("現有地熱案場・","Existing projects – ")+c.name:c.well?c.name:c.region+"・"+c.name)}</name>${style}\n${pms}</Folder>`;}).join("\n");
  const srcs=[on.some(c=>!SITE_SHAPE[c.kind])?GEO_SRC:"",on.some(c=>SITE_SHAPE[c.kind])?SITE_SRC.replace(/<[^>]+>/g,"")+L2("；點位為鄉鎮或縣市代表點，屬約略位置","; points are approximate township or county representative points"):""].filter(Boolean).join("\n");
  const kml=`<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>臺灣地熱地圖匯出</name><description>${xesc(srcs)}</description>\n${folders}\n</Document></kml>`;
  const url=URL.createObjectURL(new Blob([kml],{type:"application/vnd.google-earth.kml+xml"}));
  const a=document.createElement("a"); a.href=url; a.download=`臺灣地熱地圖_${on.length}個圖層.kml`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
const kmlBtn=document.getElementById("kmlbtn"); if(kmlBtn) kmlBtn.onclick=exportKML;
const _geoLegend=geoLegend;
geoLegend=function(){_geoLegend(); if(kmlBtn){const n=GEO_CAT.filter(c=>geoOn[c.key]).length; kmlBtn.disabled=!n; kmlBtn.textContent=n?L2(`匯出 KML（${n} 個圖層）`,`Export KML (${n} layer${n>1?"s":""})`):L2("匯出 KML（先勾選圖層）","Export KML (select layers first)");}};
geoLegend();

// ---------- 我的標示：點地圖新增、可編輯名稱／備註／顏色／形狀／照片／連結，可拖曳；存在瀏覽器 localStorage ----------
const MK_KEY="geo-mymarks";
const MK_COLORS=["#c0392b","#e67e22","#d4ac0d","#2e8b57","#1f6fb5","#7d3c98","#3a2816"];
const MK_SHAPES=[["circle",L2("圓形","Circle")],["square",L2("方形","Square")],["diamond",L2("菱形","Diamond")],["triangle",L2("三角形","Triangle")],
  ["star",L2("星形","Star")],["spring",L2("溫泉符號 ♨","Hot spring ♨")],["flag",L2("旗子","Flag")]];
// 各形狀的 SVG（24×24 畫布）；標示與選擇按鈕共用同一套圖形
// 地質／油氣業常用符號：線條式符號，畫法參考業界常見慣例（FGDC-STD-013-2006 第 19.5 節為油氣井符號，細節未逐一比對）
// 每個函式回傳 SVG 內容：k＝線條色、f＝填色、w＝線寬；外框白邊用同一組圖形畫成白色、加粗墊在底下
const ray=(n,r1,r2,off=0)=>Array.from({length:n},(_,i)=>{const t=(i*360/n+off)*Math.PI/180;return `M${(12+r1*Math.cos(t)).toFixed(2)} ${(12+r1*Math.sin(t)).toFixed(2)}L${(12+r2*Math.cos(t)).toFixed(2)} ${(12+r2*Math.sin(t)).toFixed(2)}`;}).join("");
const txt=(t,k,size=9)=>`<text x="12" y="12.2" text-anchor="middle" dominant-baseline="central" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${size}" fill="${k}">${t}</text>`;
const wisps="M8.5 10c-1.4-1.6 1.4-2.6 0-4.5s0-2.6 0-2.6M12 10c-1.4-1.6 1.4-2.6 0-4.5s0-2.6 0-2.6M15.5 10c-1.4-1.6 1.4-2.6 0-4.5s0-2.6 0-2.6";
const MK_SYM={
  w_loc:  (k,f,w)=>`<circle cx="12" cy="12" r="6" fill="#fff" stroke="${k}" stroke-width="${w}"/>`,
  w_oil:  (k,f,w)=>`<circle cx="12" cy="12" r="6" fill="${f}" stroke="${k}" stroke-width="${w}"/>`,
  w_gas:  (k,f,w)=>`<path d="${ray(8,6,11)}" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="#fff" stroke="${k}" stroke-width="${w}"/>`,
  w_og:   (k,f,w)=>`<path d="${ray(8,6,11)}" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="${f}" stroke="${k}" stroke-width="${w}"/>`,
  w_dry:  (k,f,w)=>`<path d="${ray(4,5.5,11,45)}" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="#fff" stroke="${k}" stroke-width="${w}"/>`,
  w_aoil: (k,f,w)=>`<path d="${ray(4,5.5,11,45)}" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="${f}" stroke="${k}" stroke-width="${w}"/>`,
  w_inj:  (k,f,w)=>`<circle cx="12" cy="12" r="6" fill="#fff" stroke="${k}" stroke-width="${w}"/><path d="M3 21 16.5 7.5M11 7.5h5.5V13" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`,
  w_water:(k,f,w)=>`<circle cx="12" cy="12" r="8" fill="#fff" stroke="${k}" stroke-width="${w}"/>${txt("W",k,9.5)}`,
  w_geo:  (k,f,w)=>`<circle cx="12" cy="12" r="8" fill="#fff" stroke="${k}" stroke-width="${w}"/>${txt("G",k,9.5)}`,
  fumarole:(k,f,w)=>`<path d="${wisps}" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><path d="M5 21.5 12 13l7 8.5Z" fill="#fff" stroke="${k}" stroke-width="${w}" stroke-linejoin="round"/>`,
  solfatara:(k,f,w)=>`<path d="${wisps}" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/><path d="M5 21.5 12 13l7 8.5Z" fill="${f}" stroke="${k}" stroke-width="${w}" stroke-linejoin="round"/>`,
  mudvolc:(k,f,w)=>`<path d="M2.5 20h19l-6-8h-7Z" fill="#fff" stroke="${k}" stroke-width="${w}" stroke-linejoin="round"/><path d="M10.5 12c0-2 3-2 3 0M8 8.5c1-1.5 2-1.5 2.5-.5M16 8.5c-1-1.5-2-1.5-2.5-.5" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/>`,
  bubble: (k,f,w)=>`<circle cx="8" cy="15" r="4.2" fill="#fff" stroke="${k}" stroke-width="${w}"/><circle cx="15.5" cy="13" r="3.2" fill="#fff" stroke="${k}" stroke-width="${w}"/><circle cx="12" cy="6.5" r="2.4" fill="#fff" stroke="${k}" stroke-width="${w}"/>`,
  s_rock: (k,f,w)=>`<path d="M5 5 19 19M19 5 5 19" stroke="${k}" stroke-width="${w+0.8}" stroke-linecap="round"/>`,
  s_water:(k,f,w)=>`<path d="M12 2.5C9 7.5 6 11 6 15a6 6 0 0 0 12 0c0-4-3-7.5-6-12.5Z" fill="${f}" stroke="${k}" stroke-width="${w}" stroke-linejoin="round"/>`,
  outcrop:(k,f,w)=>`<rect x="3.5" y="6" width="17" height="12" fill="#fff" stroke="${k}" stroke-width="${w}"/><path d="M3.5 12 9.5 6M3.5 18l12-12M9.5 18l11-11M15.5 18l5-5" stroke="${k}" stroke-width="${w*0.7}"/>`,
  fossil: (k,f,w)=>`<path d="M12 12.2c.8-.3 1 .9.2 1.3-1.5.6-2.6-1-2-2.4.8-1.9 3.4-2 4.6-.4 1.6 2 .4 5-2 5.6-3 .8-5.6-1.6-5.4-4.6.3-3.8 4.3-6 7.7-4.8 4.4 1.6 5.6 7 3 10.5" fill="none" stroke="${k}" stroke-width="${w}" stroke-linecap="round"/>`,
  survey: (k,f,w)=>`<path d="M12 3.5 21 19.5H3Z" fill="#fff" stroke="${k}" stroke-width="${w}" stroke-linejoin="round"/><circle cx="12" cy="14" r="2.2" fill="${f}"/>`,
};
const MK_GROUPS=[
  [L2("基本形狀","Basic shapes"),["circle","square","diamond","triangle","star","spring","flag"]],
  [L2("油氣與地熱井","Oil, gas and geothermal wells"),["w_loc","w_oil","w_gas","w_og","w_dry","w_aoil","w_inj","w_water","w_geo"]],
  [L2("地熱與火山地表徵兆","Geothermal and volcanic features"),["fumarole","solfatara","mudvolc","bubble"]],
  [L2("採樣與調查點","Sampling and survey points"),["s_rock","s_water","outcrop","fossil","survey"]],
];
MK_SHAPES.push(
  ["w_loc",L2("預定井位","Location / proposed well")],["w_oil",L2("油井","Oil well")],["w_gas",L2("氣井","Gas well")],["w_og",L2("油氣井","Oil and gas well")],
  ["w_dry",L2("乾井（已廢棄）","Dry hole, abandoned")],["w_aoil",L2("廢棄油井","Abandoned oil well")],["w_inj",L2("注入井","Injection well")],
  ["w_water",L2("水井","Water well")],["w_geo",L2("地熱井","Geothermal well")],
  ["fumarole",L2("噴氣孔","Fumarole")],["solfatara",L2("硫氣孔","Solfatara")],["mudvolc",L2("泥火山","Mud volcano")],["bubble",L2("冒泡點","Gas bubbling")],
  ["s_rock",L2("岩樣採樣點","Rock sample")],["s_water",L2("水樣採樣點","Water sample")],["outcrop",L2("露頭","Outcrop")],["fossil",L2("化石產地","Fossil locality")],["survey",L2("測量點","Survey point")]);
const mkShapeName=k=>(MK_SHAPES.find(x=>x[0]===k)||[])[1]||k;
function mkSvg(shape,c,px=24,halo=true){
  if(MK_SYM[shape]){const sym=MK_SYM[shape];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;overflow:visible">${halo?`<g opacity=".95">${sym("#fff","#fff",4.4)}</g>`:""}${sym(c,c,1.9)}</svg>`;}
  const st=halo?`stroke="#fff" stroke-width="2.2" stroke-linejoin="round"`:`stroke="none"`;
  const f=`fill="${c}" ${st}`;
  const g={
    circle:`<circle cx="12" cy="12" r="8.5" ${f}/>`,
    square:`<rect x="4" y="4" width="16" height="16" rx="1.5" ${f}/>`,
    diamond:`<path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" ${f}/>`,
    triangle:`<path d="M12 3 21.5 20h-19Z" ${f}/>`,
    star:`<path d="M12 2.2l2.9 6.2 6.7.8-5 4.6 1.3 6.7L12 17.1l-5.9 3.4 1.3-6.7-5-4.6 6.7-.8Z" ${f}/>`,
    spring:(()=>{const steam="M7.5 10.5c-1.6-1.8 1.6-3 0-5.2s0-3 0-3M12 10.5c-1.6-1.8 1.6-3 0-5.2s0-3 0-3M16.5 10.5c-1.6-1.8 1.6-3 0-5.2s0-3 0-3";
      return (halo?`<path d="${steam}" fill="none" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/>`:"")+
        `<path d="${steam}" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/><path d="M2.5 13.5h19a9.5 8 0 0 1-19 0Z" ${f}/>`;})(),
    flag:`<path d="M5 2.5V22" stroke="#3a2816" stroke-width="2" stroke-linecap="round"/><path d="M6 3h13l-3 4.5 3 4.5H6Z" ${f}/>`,
  }[shape]||"";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true" style="display:block;overflow:visible;${halo?"filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))":""}">${g}</svg>`;
}
let marks=[]; try{marks=JSON.parse(localStorage.getItem(MK_KEY)||"[]")||[];}catch(e){marks=[];}
const mkSave=()=>{try{localStorage.setItem(MK_KEY,JSON.stringify(marks.map(({layer,...m})=>m)));}catch(e){}};
map.createPane("mymarks"); map.getPane("mymarks").style.zIndex=640;
const mkGroup=L.layerGroup().addTo(map);
const mkIcon=m=>{const flag=m.shape==="flag";
  return L.divIcon({className:"mkicon",iconSize:[26,26],iconAnchor:flag?[6,26]:[13,13],popupAnchor:flag?[4,-24]:[0,-12],html:mkSvg(m.shape||"circle",m.color||MK_COLORS[0],26)});};
const lines=s=>String(s||"").split(/\s*\n\s*/).map(x=>x.trim()).filter(Boolean);
const safeUrl=u=>/^https?:\/\//i.test(u)?u:"";
function mkView(m){
  const ll=m.layer.getLatLng();
  return `<div class="geopop mkpop"><h4>${hesc(m.name||L2("未命名標示","Untitled marker"))}</h4>
    <div class="m">${mkShapeName(m.shape||"circle")}</div>
    <div class="m">WGS84 ${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}<br>TWD97 ${fmtTM2(ll.lat,ll.lng)}</div>
    ${m.note?`<p style="margin:0 0 6px;white-space:pre-wrap">${hesc(m.note)}</p>`:""}
    ${lines(m.imgs).map(safeUrl).filter(Boolean).map(u=>`<a href="${hesc(u)}" target="_blank" rel="noopener"><img src="${hesc(u)}" alt="" loading="lazy" style="display:block;width:100%;max-height:220px;object-fit:contain;margin:4px 0;border:1px solid var(--rule);background:#fff" onerror="this.parentNode.remove()"></a>`).join("")}
    ${lines(m.links).map(safeUrl).filter(Boolean).map(u=>`<div style="word-break:break-all"><a href="${hesc(u)}" target="_blank" rel="noopener">${hesc(u)}</a></div>`).join("")}
    <div class="mkrow"><button type="button" class="btn" data-a="edit">${L2("編輯","Edit")}</button>
      <a href="${earthUrl(ll.lat,ll.lng,1500)}" target="_blank" rel="noopener">Google Earth</a></div>
    <div class="src">${L2("拖曳標示可以移動位置","Drag the marker to move it")}</div></div>`;
}
function mkEdit(m){
  return `<form class="geopop mkform"><h4>${L2("編輯標示","Edit marker")}</h4>
    <label>${L2("名稱","Name")}<input name="name" type="text" value="${hesc(m.name)}" placeholder="${L2("例如：GZP-E 預定井位","e.g. planned well site")}"></label>
    <label>${L2("備註","Note")}<textarea name="note" rows="3">${hesc(m.note)}</textarea></label>
    <div class="mkl">${L2("顏色","Colour")}</div>
    <div class="mkchoice">${MK_COLORS.map(c=>`<button type="button" data-c="${c}" aria-label="${c}" aria-pressed="${c===m.color}" style="background:${c}"></button>`).join("")}</div>
    <div class="mkl">${L2("形狀","Shape")}</div>
    ${MK_GROUPS.map(([g,keys])=>`<div class="mkg">${g}</div><div class="mkchoice mkshape">${keys.map(s=>{const n=mkShapeName(s);return `<button type="button" data-s="${s}" aria-pressed="${s===m.shape}" title="${n}" aria-label="${n}">${mkSvg(s,m.color||MK_COLORS[0],22,false)}</button>`;}).join("")}</div>`).join("")}
    <div class="mkshapename">${mkShapeName(m.shape||"circle")}</div>
    <label>${L2("照片網址（一行一個）","Photo URLs (one per line)")}<textarea name="imgs" rows="2" placeholder="https://…">${hesc(m.imgs)}</textarea></label>
    <label>${L2("連結（一行一個）","Links (one per line)")}<textarea name="links" rows="2" placeholder="https://…">${hesc(m.links)}</textarea></label>
    <div class="mkrow"><button type="submit" class="btn">${L2("完成","Done")}</button><button type="button" class="linkbtn" data-a="del">${L2("刪除這個標示","Delete this marker")}</button></div></form>`;
}
function mkOpen(m,edit){
  // 彈出內容用 DOM 元素綁定，重新開啟時保留輸入中的內容與事件
  const el=document.createElement("div"); el.innerHTML=edit?mkEdit(m):mkView(m);
  if(!edit) el.querySelector('[data-a="edit"]').onclick=()=>mkOpen(m,true);
  else{
    const f=el.querySelector("form");
    const sync=()=>{m.name=f.name.value.trim();m.note=f.note.value;m.imgs=f.imgs.value;m.links=f.links.value;mkSave();mkList();};
    f.addEventListener("input",sync);
    const pick=(sel,attr,key)=>f.querySelectorAll(sel).forEach(b=>b.onclick=()=>{m[key]=b.dataset[attr];f.querySelectorAll(sel).forEach(x=>x.setAttribute("aria-pressed",x===b));m.layer.setIcon(mkIcon(m));m.layer.getPopup()?.update();mkSave();mkList();});
    pick("[data-c]","c","color"); pick("[data-s]","s","shape");
    f.querySelectorAll("[data-s]").forEach(b=>b.addEventListener("click",()=>{f.querySelector(".mkshapename").textContent=mkShapeName(b.dataset.s);}));
    f.querySelectorAll("[data-c]").forEach(b=>b.addEventListener("click",()=>f.querySelectorAll("[data-s]").forEach(x=>x.innerHTML=mkSvg(x.dataset.s,m.color,22,false))));
    f.onsubmit=e=>{e.preventDefault();sync();mkOpen(m,false);};
    f.querySelector('[data-a="del"]').onclick=()=>{m.layer.closePopup();mkGroup.removeLayer(m.layer);marks=marks.filter(x=>x!==m);mkSave();mkList();};
    if(!m.name) setTimeout(()=>f.name.focus(),80);
  }
  m.layer.unbindPopup().bindPopup(el,{maxWidth:300,minWidth:250,maxHeight:edit?420:320}).openPopup();
}
function mkAddLayer(m){
  m.layer=L.marker([m.lat,m.lng],{pane:"mymarks",icon:mkIcon(m),draggable:true,autoPan:true}).addTo(mkGroup);
  m.layer.on("click",()=>{ if(!m.layer.isPopupOpen()) mkOpen(m,false); });
  m.layer.on("dragend",()=>{const ll=m.layer.getLatLng();m.lat=+ll.lat.toFixed(7);m.lng=+ll.lng.toFixed(7);mkSave();});
  if(m.name) m.layer.bindTooltip(()=>hesc(m.name),{direction:"top",offset:[0,-10]});
  return m;
}
function mkList(){
  const box=document.getElementById("marklist"); if(!box) return;
  box.innerHTML=marks.map((m,i)=>`<button type="button" class="mkitem" data-i="${i}"><span class="sw" style="background:${m.color}"></span><span class="nm">${hesc(m.name||L2("未命名標示","Untitled marker"))}</span></button>`).join("");
  box.querySelectorAll(".mkitem").forEach(b=>b.onclick=()=>{const m=marks[+b.dataset.i];map.flyTo([m.lat,m.lng],Math.max(map.getZoom(),15),{duration:.6});map.once("moveend",()=>mkOpen(m,false));});
  ["markkml","markcsv","markclear"].forEach(id=>{const b=document.getElementById(id);if(b) b.disabled=!marks.length;});
  marks.forEach(m=>{ if(m.layer){ m.layer.unbindTooltip(); if(m.name) m.layer.bindTooltip(()=>hesc(m.name),{direction:"top",offset:[0,-10]}); } });
}
marks.forEach(mkAddLayer); mkList();
// 新增模式：按「新增標示」後點地圖放下標示
let mkAdding=false; window._mkAdding=()=>mkAdding;
const mkBanner=document.createElement("div"); mkBanner.id="mkbanner"; mkBanner.hidden=true;
mkBanner.innerHTML=`<span>${L2("點地圖放置標示","Tap the map to place a marker")}</span><button type="button" class="linkbtn">${L2("取消","Cancel")}</button>`;
document.getElementById("mapwrap").appendChild(mkBanner);
const mkMode=on=>{mkAdding=on;mkBanner.hidden=!on;map.getContainer().style.cursor=on?"crosshair":"";
  const b=document.getElementById("markadd"); if(b) b.textContent=on?L2("取消新增","Cancel adding"):L2("新增標示","Add a marker");};
mkBanner.querySelector("button").onclick=()=>mkMode(false);
document.getElementById("markadd").onclick=()=>{mkMode(!mkAdding); if(mkAdding&&MOBILE.matches){const lay=document.getElementById("layers");if(!lay.classList.contains("min"))document.getElementById("lmin").click();sheet("peek");}};
map.on("click",e=>{ if(!mkAdding) return;
  const m=mkAddLayer({id:Date.now(),name:"",note:"",color:MK_COLORS[0],shape:"circle",imgs:"",links:"",lat:+e.latlng.lat.toFixed(7),lng:+e.latlng.lng.toFixed(7)});
  marks.push(m); mkSave(); mkList(); mkMode(false); setTimeout(()=>mkOpen(m,true),30); });
// 匯出
const mkDownload=(text,name,type)=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);};
const mkStamp=()=>new Date().toISOString().slice(0,10);
document.getElementById("markkml").onclick=()=>{ if(!marks.length) return;
  const pm=marks.map(m=>{const desc=[m.note?hesc(m.note).replace(/\n/g,"<br>"):"",...lines(m.imgs).map(safeUrl).filter(Boolean).map(u=>`<img src="${hesc(u)}" width="400">`),...lines(m.links).map(safeUrl).filter(Boolean).map(u=>`<a href="${hesc(u)}">${hesc(u)}</a>`)].filter(Boolean).join("<br>");
    const ed=["note","color","shape","imgs","links"].map(k=>`<Data name="${k}"><value>${xesc(m[k]||"")}</value></Data>`).join("");
    return `<Placemark><name>${xesc(m.name||"未命名標示")}</name><Style><IconStyle><color>${kcolor(m.color||MK_COLORS[0])}</color><Icon><href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href></Icon></IconStyle></Style><description><![CDATA[${desc}]]></description><ExtendedData>${ed}</ExtendedData><Point><coordinates>${m.lng},${m.lat},0</coordinates></Point></Placemark>`;}).join("\n");
  mkDownload(`<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>我的標示</name>\n${pm}\n</Document></kml>`,`我的標示_${mkStamp()}.kml`,"application/vnd.google-earth.kml+xml");};
document.getElementById("markcsv").onclick=()=>{ if(!marks.length) return;
  const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=[["名稱","備註","緯度","經度","TWD97_X","TWD97_Y","顏色","形狀","照片","連結"].map(q).join(",")].concat(marks.map(m=>{const [x,y]=toTM2(m.lat,m.lng);
    return [m.name,m.note,m.lat,m.lng,x.toFixed(2),y.toFixed(2),m.color,mkShapeName(m.shape),lines(m.imgs).join(" "),lines(m.links).join(" ")].map(q).join(",");}));
  mkDownload("﻿"+rows.join("\r\n"),`我的標示_${mkStamp()}.csv`,"text/csv;charset=utf-8");};
document.getElementById("markclear").onclick=()=>{ if(!marks.length) return;
  if(!confirm(L2(`確定刪除全部 ${marks.length} 個標示？建議先匯出備份。`,`Delete all ${marks.length} markers? Export a backup first.`))) return;
  mkGroup.clearLayers(); marks=[]; mkSave(); mkList(); };
// 匯入 KML／KMZ（本工具匯出的檔案會還原所有欄位；其他 KML 取名稱、說明與座標）
document.getElementById("markimp").onchange=async e=>{
  const file=e.target.files[0]; e.target.value=""; if(!file) return;
  const hint=document.getElementById("markhint");
  try{
    let text;
    if(/\.kmz$/i.test(file.name)){
      if(!window.JSZip) await new Promise((ok,fail)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";s.onload=ok;s.onerror=fail;document.head.appendChild(s);});
      const zip=await JSZip.loadAsync(file); const kml=Object.values(zip.files).find(f=>/\.kml$/i.test(f.name)); if(!kml) throw 0;
      text=await kml.async("string");
    } else text=await file.text();
    const d=new DOMParser().parseFromString(text,"text/xml"); let n=0;
    d.querySelectorAll("Placemark").forEach(p=>{
      const co=p.querySelector("Point coordinates"); if(!co) return;
      const [lng,lat]=co.textContent.trim().split(/[\s,]+/).map(Number); if(isNaN(lat)||isNaN(lng)) return;
      const ed=k=>p.querySelector(`ExtendedData Data[name="${k}"] value`)?.textContent;
      const raw=p.querySelector("description")?.textContent||"";
      const tmp=document.createElement("div"); tmp.innerHTML=raw.replace(/<\/?br\s*\/?>/gi,"\n").replace(/<img[^>]*>/gi,"");
      const imgs=ed("imgs")??[...raw.matchAll(/<img[^>]*src="([^"]+)"/gi)].map(x=>x[1]).join("\n");
      const links=ed("links")??[...raw.matchAll(/href="([^"]+)"/gi)].map(x=>x[1]).join("\n");
      tmp.querySelectorAll("a").forEach(a=>a.remove());
      const color=ed("color"), shape=ed("shape");
      const m=mkAddLayer({id:Date.now()+n,name:(p.querySelector("name")?.textContent||"").trim(),note:ed("note")??tmp.textContent.replace(/\n{2,}/g,"\n").trim(),
        color:MK_COLORS.includes(color)?color:MK_COLORS[4],shape:MK_SHAPES.some(s=>s[0]===shape)?shape:"circle",imgs,links,lat:+lat.toFixed(7),lng:+lng.toFixed(7)});
      marks.push(m); n++;
    });
    mkSave(); mkList();
    hint.textContent=L2(`已從 ${file.name} 匯入 ${n} 個標示。`,`Imported ${n} markers from ${file.name}.`);
    if(n) map.flyToBounds(L.latLngBounds(marks.slice(-n).map(m=>[m.lat,m.lng])).pad(.2),{maxZoom:15,duration:.7});
  }catch(err){ hint.textContent=L2("讀不到這個檔案，請確認是 KML 或 KMZ。","Could not read this file. Check that it is a KML or KMZ."); }
};

if(!GEO_CAT.length){document.getElementById("geochecks").innerHTML='<div class="src">找不到 geotex/catalog.js，地熱資料無法顯示。</div>';} else renderGeoChecks();

}

// ---------- 色調 ----------
const TONES=[
  {k:"natural",name:"原色",a:"#ffffff",b:"#6aa84f"},
  {k:"gray",name:"淡灰",a:"#f2f3f4",b:"#8a939b"},
  {k:"warm",name:"暖白",a:"#fbf6ec",b:"#c47a45"},
  {k:"dark",name:"深色",a:"#1d232a",b:"#f0a35e"},
  {k:"contrast",name:"高對比",a:"#ffffff",b:"#000000"},
  {k:"navy",name:"海軍藍",a:"#2e3d4f",b:"#e8836a"},
];
let vec=null;
function setVector(on){
  if(on){
    if(!vec){
      if(!window.maplibregl||!L.maplibreGL||!window.NAVY_STYLE){ return false; }
      map.createPane("vec"); map.getPane("vec").style.zIndex=200;
      vec=L.maplibreGL({style:NAVY_STYLE,pane:"vec",localIdeographFontFamily:"'Noto Sans TC','Microsoft JhengHei','PingFang TC',sans-serif",
        attribution:'© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'});
    }
    map.removeLayer(base); if(!map.hasLayer(vec)) vec.addTo(map); setTimeout(()=>{vecHillshade();syncHsBox();},0);
  } else if(vec&&map.hasLayer(vec)) map.removeLayer(vec);
  setTimeout(syncHsBox,0);
  return true;
}
let curTone=null;
function setTone(k){
  // 海軍藍預設換成向量底圖；離開海軍藍時，若仍是向量底圖就換回電子地圖。之後都可以在「底圖」自由改選。
  if(k==="navy"&&curTone!=="navy") chooseBase(VEC_KEY);
  else if(k!=="navy"&&curTone==="navy"&&vec&&map.hasLayer(vec)) chooseBase("電子地圖（大字）");
  curTone=k;
  if(k) document.documentElement.dataset.tone=k; else delete document.documentElement.dataset.tone;
  document.querySelectorAll(".tone").forEach(b=>b.setAttribute("aria-pressed",b.dataset.k===k));
  document.getElementById("tonename").textContent=T(TONES.find(t=>t.k===k).name);
  if(window._arch) B.forEach(b=>_arch.markers[b.id].setIcon(_arch.pinIcon(b,b.id===_arch.state.sel)));
  try{localStorage.setItem("tone",k)}catch(e){}
}
TONES.forEach(t=>{const b=document.createElement("button");b.type="button";b.className="tone";b.dataset.k=t.k;
  b.title=T(t.name);b.setAttribute("aria-label",T(t.name));b.style.setProperty("--a",t.a);b.style.setProperty("--b",t.b);
  b.onclick=()=>setTone(t.k);document.getElementById("tones").appendChild(b);});
let savedTone=""; try{savedTone=localStorage.getItem("tone")||""}catch(e){}
setTone(TONES.some(t=>t.k===savedTone)?savedTone:"natural"); syncHsBox(); // 舊的色調（泛黃古地圖等）已移除，改回原色

// ---------- 土地使用分區（兩張地圖共用：判斷、卡片、定義） ----------
// 分區定義（卡片下方的註解）。中文照法條原文，英文為本站翻譯。
// 非都市：區域計畫法施行細則第 11 條（民國 102 年 10 月 23 日修正）；都市計畫：都市計畫法第 32～38、42 條（民國 110 年 5 月 26 日修正）。
const NU_DEF={
  AA:["優良農地或曾經投資建設重大農業改良設施，經會同農業主管機關認為必須加以特別保護而劃定者。","Good farmland, or land with major agricultural improvements, designated with the agriculture authority for special protection.","第 11 條第 1 款"],
  AB:["特定農業區以外供農業使用之土地。","Agricultural land outside special agricultural zones.","第 11 條第 2 款"],
  AD:["為促進工業整體發展，會同有關機關劃定者。","Designated with the relevant agencies to promote overall industrial development.","第 11 條第 3 款"],
  AC:["為調和、改善農村居住與生產環境及配合政府興建住宅社區政策之需要，會同有關機關劃定者。","Designated to improve rural living and production environments and to support government housing-community policy.","第 11 條第 4 款"],
  AE:["為保育利用森林資源，並維護生態平衡及涵養水源，依森林法等有關法規，會同有關機關劃定者。","Designated under the Forestry Act and related rules to conserve and use forest resources, keep ecological balance and protect water sources.","第 11 條第 5 款"],
  AF:["為保護自然生態資源、景觀、環境，與防治沖蝕、崩塌、地滑、土石流失等地質災害，及涵養水源等水土保育，依有關法規，會同有關機關劃定者。","Designated to protect natural resources, landscape and environment, prevent erosion, landslides and debris loss, and conserve soil and water.","第 11 條第 6 款"],
  AG:["為維護自然景觀，改善國民康樂遊憩環境，依有關法規，會同有關機關劃定者。","Designated to preserve natural scenery and improve public recreation.","第 11 條第 7 款"],
  AJ:["為保護國家特有之自然風景、史蹟、野生物及其棲息地，並供國民育樂及研究，依國家公園法劃定者。","Designated under the National Park Act to protect unique scenery, historic sites, wildlife and habitats, for recreation and research.","第 11 條第 8 款"],
  AK:["為保護水道、確保河防安全及水流宣洩，依水利法等有關法規，會同有關機關劃定者。","Designated under the Water Act and related rules to protect waterways, flood defences and drainage.","第 11 條第 9 款"],
  AL:["為促進海域資源與土地之保育及永續合理利用，防治海域災害及環境破壞，依有關法規及實際用海需要劃定者。","Designated to conserve and sustainably use marine resources and prevent marine disasters and damage.","第 11 條第 10 款"],
  AH:["（其他使用區或特定專用區）為利各目的事業推動業務之實際需要，依有關法規，會同有關機關劃定並註明其用途者。","(Other use or special-use zone) Designated for the practical needs of specific sectors, with the use stated.","第 11 條第 11 款"],
};
const NU_DEF_SRC=L2("區域計畫法施行細則","Enforcement Rules of the Regional Plan Act");
// 都市計畫分區：依分區名稱判斷適用的條文（比對順序有差：專用區先於住宅、用地放在分區之後）
const URBAN_DEF=[
  [/河川區/,"依水利法公告之河川治理計畫範圍內之土地。","Land within a river management plan announced under the Water Act.",L2("內政部國土管理署「都市計畫土地使用分區面積編製說明」","NLMA urban zoning statistics notes")],
  [/專用區/,"特定專用區內土地及建築物，不得違反其特定用途之使用。","Land and buildings in a special-use zone may not be used against its designated purpose.","都市計畫法第 38 條"],
  [/住宅/,"住宅區為保護居住環境而劃定，其土地及建築物之使用，不得有礙居住之寧靜、安全及衛生。","Designated to protect the living environment; uses may not harm residential quiet, safety or hygiene.","都市計畫法第 34 條"],
  [/商業/,"商業區為促進商業發展而劃定，其土地及建築物之使用，不得有礙商業之便利。","Designated to promote commerce; uses may not hinder commercial convenience.","都市計畫法第 35 條"],
  [/工業/,"工業區為促進工業發展而劃定，其土地及建築物，以供工業使用為主；具有危險性及公害之工廠，應特別指定工業區建築之。","Designated to promote industry; mainly for industrial use, with hazardous plants confined to specially designated areas.","都市計畫法第 36 條"],
  [/行政區|文教區|風景區/,"其他行政、文教、風景等使用區內土地及建築物，以供其規定目的之使用為主。","Administrative, educational, scenic and similar zones are mainly for their designated purpose.","都市計畫法第 37 條"],
  [/農業區|保護區/,"都市計畫地區，得視地理形勢，使用現況或軍事安全上之需要，保留農業地區或設置保護區，並限制其建築使用。","Agricultural or conservation areas kept for terrain, current use or military security, with building restricted.","都市計畫法第 33 條"],
  [/用地/,"屬公共設施用地。都市計畫地區範圍內，應視實際情況設置道路、公園、綠地、廣場、學校、市場、機關、上下水道、郵政、電信、變電所等公共設施用地。","Public facility land: roads, parks, green space, plazas, schools, markets, government, utilities and similar, as needed.","都市計畫法第 42 條"],
  [/./,"都市計畫得劃定住宅、商業、工業等使用區，並得視實際情況，劃定其他使用區域或特定專用區。","Urban plans may designate residential, commercial, industrial and other zones or special-use zones as needed.","都市計畫法第 32 條"],
];
const zDefHTML=(zh,en,cite)=>`<div class="zdef"><b>${L2("分區定義","Definition")}</b>　${L2(zh,en)}<span class="cite">（${L2("依據：","Source: ")}${cite}）</span></div>`;
const nuDefHTML=code=>{const d=NU_DEF[code]; return d?zDefHTML(d[0],d[1],`${NU_DEF_SRC}${L2(d[2],"Art. 11")}`):"";};
const urbanDefHTML=name=>{const d=URBAN_DEF.find(x=>x[0].test(name)); return d?zDefHTML(d[1],d[2],d[3]):"";};

// 資料都放在 zoning/ 資料夾，點到哪個縣市才載入該縣市的檔案：
//   tpe.js   臺北市都市計畫使用分區（細部計畫，臺北市政府都市發展局）
//   ntpc.js  新北市都市計畫土地使用分區（新北市政府城鄉發展局）
//   nu-?.js  非都市土地使用分區圖（112年，內政部；? 是縣市代碼，與國土測繪中心地段查詢的 ctyCode 相同）
// 使用地類別沒有向量資料，讀國土測繪中心 WMTS 圖磚 nURBAN2 在該點的顏色；嘉義市、金門、連江沒有非都市向量檔，使用分區也改讀 nURBAN1。
// 都是以點位判斷，不是逐筆地號的邊界。
const ZSRC={
  tpe:{zh:"臺北市政府都市發展局「臺北市都市計畫使用分區圖」（細部計畫）",en:"Taipei City Urban Development Dept., urban plan zoning map (detailed plans)"},
  ntpc:{zh:"新北市政府城鄉發展局「新北市都市計畫土地使用分區及範圍圖」",en:"New Taipei City Urban and Rural Development Dept., urban plan zoning map"},
  nu:{zh:"內政部「非都市土地使用分區圖（112年）」",en:"Ministry of the Interior, non-urban land zoning map (2023)"},
  tile:{zh:"內政部國土測繪中心 WMTS「非都市土地使用分區圖」「非都市土地使用地類別圖」",en:"NLSC WMTS layers: non-urban land zoning and land-use type"},
};
const zSrc=k=>L2(ZSRC[k].zh,ZSRC[k].en);
const NU_CTY=new Set("BCDEFGHJKMNOPQTUVX".split("")); // 有非都市向量檔的縣市代碼
// 非都市分區與使用地的名稱、代碼依內政部地政司代碼表（data.gov.tw/dataset/25113）；AK 河川區、AL 海域區見於非都市土地使用分區圖。
const NU_NAMES={AA:"特定農業區",AB:"一般農業區",AC:"鄉村區",AD:"工業區",AE:"森林區",AF:"山坡地保育區",AG:"風景區",AH:"特定專用區",AJ:"國家公園區",AK:"河川區",AL:"海域區",
  EA:"甲種建築用地",EB:"乙種建築用地",EC:"丙種建築用地",ED:"丁種建築用地",EE:"農牧用地",EF:"礦業用地",EG:"交通用地",EH:"水利用地",EJ:"遊憩用地",
  EK:"古蹟保存用地",EL:"生態保護用地",EM:"國土保安用地",EN:"墳墓用地",EP:"特定目的事業用地",EQ:"鹽業用地",ER:"窯業用地",ES:"林業用地",ET:"養殖用地",EZ:"暫未編定"};
const NU_EN={AA:"Special agricultural zone",AB:"General agricultural zone",AC:"Rural zone",AD:"Industrial zone",AE:"Forest zone",AF:"Slopeland conservation zone",AG:"Scenic zone",AH:"Special-use zone",AJ:"National park zone",AK:"River zone",AL:"Marine zone",
  EA:"Class A building land",EB:"Class B building land",EC:"Class C building land",ED:"Class D building land",EE:"Agriculture & husbandry land",EF:"Mining land",EG:"Transport land",EH:"Water conservancy land",EJ:"Recreation land",
  EK:"Heritage preservation land",EL:"Ecological protection land",EM:"National security land",EN:"Cemetery land",EP:"Special-purpose business land",EQ:"Salt industry land",ER:"Kiln industry land",ES:"Forestry land",ET:"Aquaculture land",EZ:"Not yet designated"};
// 非都市使用分區圖磚顏色：依「非都市土地使用分區類別圖」與「11種使用分區」圖例，和圖磚實際的 10 種主色逐一比對而得。
// 灰色 (102,102,102) 經內政部向量檔比對為海域區（AL，例如新北市石門沿岸）；圖磚在外海是透明的。
const NU1_KEY=[[[255,255,0],"AA"],[[255,165,0],"AB"],[[115,0,0],"AD"],[[255,0,0],"AC"],[[38,115,0],"AE"],[[76,230,0],"AF"],
  [[255,0,197],"AG"],[[115,0,76],"AJ"],[[0,38,115],"AK"],[[0,197,255],"AH"],[[102,102,102],"AL"]];
const NU_RGB=Object.fromEntries(NU1_KEY.map(([c,k])=>[k,c]));
// 顯示分類依「圖3-1-1 非都市土地使用分區類別圖」的 10 類；圖例沒有單獨列出的特定專用區（AH）、海域區（AL）等歸入「其他使用區或專用區」。
const NU_CLASS=[["AA","特定農業區","Special agricultural zone"],["AB","一般農業區","General agricultural zone"],["AD","工業區","Industrial zone"],["AC","鄉村區","Rural zone"],
  ["AE","森林區","Forest zone"],["AF","山坡地保育區","Slopeland conservation zone"],["AG","風景區","Scenic zone"],["AJ","國家公園區","National park zone"],["AK","河川區","River zone"],
  ["AH","其他使用區或專用區","Other use or special-use zone"]].map(([k,zh,en])=>({k,zh,en,c:NU_RGB[k]}));
const nuClass=code=>NU_CLASS.find(x=>x.k===code)||NU_CLASS[NU_CLASS.length-1];
// 卡片上的分區文字：圖例類別名稱；原始分區名稱與圖例不同時，括號附上原名與代碼
const nuZoneText=code=>{const c=nuClass(code), own=NU_NAMES[code], lab=L2(c.zh,c.en);
  return own&&own!==c.zh?`${lab}（${L2(own,NU_EN[code])}，${code}）`:`${lab}（${code}）`;};
const NU2_KEY=[]; // 使用地類別：官方圖例尚待補上
const nuName=c=>EN?NU_EN[c]:NU_NAMES[c];
// 取最接近的圖例色（容許圖磚邊緣的混色），差太多就當作圖例未列
const nuMatch=(rgb,key)=>{let best=null,bd=1e9;for(const [c,code] of key){const d=Math.hypot(rgb[0]-c[0],rgb[1]-c[1],rgb[2]-c[2]);if(d<bd){bd=d;best=code;}}return bd<=40?best:null;};
// 都市計畫分區上色：顏色採內政部「都市計畫書圖製作要點」第七點附件三「都市計畫圖例」的 R.G.B 值；
// 附件三把好幾種分區用同一色，這裡合併成一列；未訂定的類別（特定專用區、道路交通、水利設施等）用中性色；郵電、醫療、自來水依附件三併入機關用地色。
// re 比對臺北市的分區代碼，nre 比對新北市的分區名稱（新北資料沒有代碼）。比對順序有差：例如廣場要排在公園之前。
const ZG=[
  {k:"mag",re:/^(PED|PTA3|PUG)/,nre:/廣場|高速公路|加油/,c:"rgb(255,0,255)",zh:"廣場、高速公路、加油站",en:"Plazas, freeways, gas stations"},
  {k:"water",re:/^(PW|W$|PFA)/,nre:/河川|河道|行水/,c:"rgb(127,255,255)",zh:"河川區、河道",en:"Rivers, river channels"},
  {k:"util",re:/^(PUB|PUA|PUD|PTB|PPA|PPB|PPC|PFD2)/,nre:/變電|電力|鐵路|垃圾|污水|汙水|煤氣|瓦斯|屠宰|焚化|鐵塔/,c:"rgb(183,183,183)",zh:"電力、鐵路、垃圾、污水、煤氣設施",en:"Power, railway, refuse, sewage, gas"},
  {k:"fun",re:/^PDA/,nre:/殯|火葬/,c:"rgb(255,255,127)",zh:"殯葬設施",en:"Funeral facilities"},
  {k:"green",re:/^(L$|PE|PDB)/,nre:/公園|綠地|體育|兒童遊樂|墓|風景|園道|綠帶/,c:"rgb(0,255,0)",zh:"風景區、公園綠地、體育場、墳墓",en:"Scenic, parks & green space, sports, cemeteries"},
  {k:"mkt",re:/^(PM|PTD)/,nre:/市場|停車/,c:"rgb(255,63,0)",zh:"市場、停車場",en:"Markets, parking"},
  {k:"edu",re:/^(C|PS|PGA0)/,nre:/學|文教|文小|文中|文高|文大|社教/,c:"rgb(191,127,255)",zh:"文教區、學校、社教",en:"Education, schools"},
  {k:"gov",re:/^(G|PG|PTE$|PUF|PUC|PH|PUE)/,nre:/機關|行政|郵|電信|醫|衛生|自來水|消防|警|航空/,c:"rgb(0,127,255)",zh:"行政區、機關（含郵電、醫療、自來水）、航空站",en:"Administrative, government (incl. post, telecom, medical, water works), airport"},
  {k:"res",re:/^R/,nre:/住宅/,c:"rgb(255,255,0)",zh:"住宅區",en:"Residential"},
  {k:"com",re:/^B/,nre:/商業/,c:"rgb(255,0,63)",zh:"商業區",en:"Commercial"},
  {k:"ind",re:/^I/,nre:/工業|港埠/,c:"rgb(127,63,0)",zh:"工業區、港埠",en:"Industrial, ports"},
  {k:"store",re:/^$/,nre:/倉儲/,c:"rgb(76,38,0)",zh:"倉儲區",en:"Warehousing"},
  {k:"cons",re:/^(A$|T$|K)/,nre:/農業|保護|保存|宗教|寺廟/,c:"rgb(127,255,0)",zh:"農業區、保護區、保存區、宗教專用區",en:"Agriculture, conservation, preservation, religious"},
  {k:"other",re:/./,nre:/./,c:"#cfc6b4",zh:"附件三未訂定（特定專用區、道路交通、水利設施等）",en:"Not defined in the standard legend (special-use, transport, drainage, etc.)"},
];
const zGroup=(key,code,name)=>key==="ntpc"?ZG.find(g=>g.nre.test(name)):ZG.find(g=>g.re.test(code));
const zColor=(key,code,name)=>key.startsWith("nu-")?`rgb(${nuClass(code).c.join(",")})`:zGroup(key,code,name).c;
const ZN={data:{}, load:{}, urbanLayers:{}, n1:nlsc("nURBAN1",Object.assign({maxNativeZoom:17,opacity:.7},OP)), n2:nlsc("nURBAN2",Object.assign({maxNativeZoom:17,opacity:.7},OP))};
// 載入 zoning/<key>.js，解碼差分整數座標，順便算每個面的外框
function loadZone(key){
  if(ZN.load[key]) return ZN.load[key];
  ZN.load[key]=new Promise((ok,fail)=>{const s=document.createElement("script");s.src=`zoning/${key}.js`;s.onload=ok;s.onerror=fail;document.head.appendChild(s);})
  .then(()=>{
    const D=window.ZONING[key];
    D.f.forEach(f=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      f.r=f[1].map(fl=>{const pts=[];let x=0,y=0;for(let i=0;i<fl.length;i+=2){x+=fl[i];y+=fl[i+1];const X=x/1e6,Y=y/1e6;pts.push([X,Y]);
        if(X<x0)x0=X;if(X>x1)x1=X;if(Y<y0)y0=Y;if(Y>y1)y1=Y;}return pts;});
      f.b=[x0,y0,x1,y1]; f.a=(x1-x0)*(y1-y0); f[1]=null;});
    ZN.data[key]=D; return D;
  }).catch(err=>{delete ZN.load[key]; throw err;});
  return ZN.load[key];
}
// 奇偶規則判斷點是否在面內（SHP 的環方向不一致，不分內外環）
function inRings(rings,x,y){let inside=false;
  for(const p of rings) for(let i=0,j=p.length-1;i<p.length;j=i++){const [xi,yi]=p[i],[xj,yj]=p[j];
    if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;}
  return inside;}
// 點落在哪個面；有重疊時取外框最小的面
async function zoneAt(key,lat,lng){
  const D=await loadZone(key); let best=null;
  for(const f of D.f){const b=f.b; if(lng<b[0]||lng>b[2]||lat<b[1]||lat>b[3]) continue;
    if((!best||f.a<best.a) && inRings(f.r,lng,lat)) best=f;}
  return best?{key,code:D.codes[best[0]][0],name:D.codes[best[0]][1],date:D.date}:null;
}
// 讀 WMTS 圖磚在該點的像素顏色（第 17 級，約 1.2 公尺一格；圖磚有開放 CORS）
const tileCache=new Map();
async function pixelAt(layer,lat,lng,z=17){
  const n=2**z, xf=(lng+180)/360*n, r=lat*Math.PI/180, yf=(1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n;
  const tx=Math.floor(xf), ty=Math.floor(yf), key=`${layer}/${z}/${ty}/${tx}`;
  let ctx=tileCache.get(key);
  if(!ctx){
    const blob=await fetch(`https://wmts.nlsc.gov.tw/wmts/${layer}/default/GoogleMapsCompatible/${z}/${ty}/${tx}`).then(r=>{if(!r.ok) throw new Error(r.status);return r.blob();});
    const bmp=await createImageBitmap(blob), c=document.createElement("canvas"); c.width=bmp.width; c.height=bmp.height;
    ctx=c.getContext("2d",{willReadFrequently:true}); ctx.drawImage(bmp,0,0);
    if(tileCache.size>40) tileCache.delete(tileCache.keys().next().value);
    tileCache.set(key,ctx);
  }
  const s=ctx.canvas.width/256, d=ctx.getImageData(Math.min(255,Math.floor((xf-tx)*256))*s|0,Math.min(255,Math.floor((yf-ty)*256))*s|0,1,1).data;
  return d[3]<128?null:[d[0],d[1],d[2]];
}
const sw=rgb=>`<span class="zsw" style="background:rgb(${rgb.join(",")})"></span>`;
const swc=c=>`<span class="zsw" style="background:${c}"></span>`;
const zNote=()=>`<div class="src">${L2("以點選位置判斷，不是逐筆地號的邊界；位在分區交界時可能判斷錯誤。正式分區請以主管機關核發的土地使用分區證明為準。","Based on the clicked point, not on parcel boundaries, so it may be wrong near zone edges. Official zoning comes from a zoning certificate issued by the local government.")}</div>`;
const srcLine=(k,date)=>`<div class="src">${L2(`資料：${ZSRC[k].zh}，資料集更新 ${date}。`,`Data: ${ZSRC[k].en}, dataset updated ${date}.`)}</div>`;
// 使用地類別（讀圖磚顏色）
function useTypeRow(rgb){
  const lab=L2("使用地類別","Land-use type");
  if(!rgb) return `<dt>${lab}</dt><dd>${L2("（圖上無資料）","(no data)")}</dd>`;
  const code=nuMatch(rgb,NU2_KEY);
  return `<dt>${lab}</dt><dd>${sw(rgb)}${code?nuName(code):NU2_KEY.length?L2("圖例未列的顏色","Colour not in the legend"):L2("顏色對照尚待官方圖例確認","Colour key not yet confirmed against the official legend")}</dd>`;
}
async function zoneHTML(cc,lat,lng){
  // 1. 都市計畫（臺北市、新北市）
  const urbanKey=cc==="A"?"tpe":cc==="F"?"ntpc":null;
  if(urbanKey){
    const z=await zoneAt(urbanKey,lat,lng);
    if(z) return `<dl class="zone"><dt>${L2("都市計畫使用分區","Urban plan zoning")}</dt><dd>${swc(zColor(urbanKey,z.code,z.name))}${z.name}${urbanKey==="tpe"?`（${z.code}）`:""}</dd></dl>`+urbanDefHTML(z.name)+srcLine(urbanKey,z.date)+zNote();
    if(cc==="A") return `<dl class="zone"><dt>${L2("都市計畫使用分區","Urban plan zoning")}</dt><dd>${L2("這個點不在任何分區面內，多半是道路。","This point is not inside any zone polygon. It is most likely a road.")}</dd></dl>`+srcLine("tpe",ZN.data.tpe.date)+zNote();
  }
  // 2. 非都市土地：使用分區用內政部向量檔，使用地類別讀圖磚
  if(NU_CTY.has(cc)){
    const [z,c2]=await Promise.all([zoneAt("nu-"+cc,lat,lng),pixelAt("nURBAN2",lat,lng).catch(()=>null)]);
    if(z) return `<dl class="zone">${L2("<dt class=\"h\">非都市土地</dt>","<dt class=\"h\">Non-urban land</dt>")}<dt>${L2("使用分區","Zone")}</dt><dd>${swc(zColor(z.key,z.code))}${nuZoneText(z.code)}</dd>${useTypeRow(c2)}</dl>`+nuDefHTML(z.code)+
      srcLine("nu",z.date)+`<div class="src">${L2(`使用地類別：${ZSRC.tile.zh}，依圖磚顏色判讀，圖磚未標示更新日期。`,`Land-use type: ${ZSRC.tile.en}, read from the tile colour; the tiles carry no update date.`)}</div>`+zNote();
    return `<dl class="zone"><dt>${L2("土地使用分區","Zoning")}</dt><dd>${L2("不在非都市土地分區圖範圍內，多半位在都市計畫區或國家公園。本站目前只有臺北市、新北市的都市計畫分區，其他縣市請洽該縣市的都市計畫查詢系統。","Not covered by the non-urban zoning map, so it is most likely inside an urban plan area or a national park. This site only has urban plan zoning for Taipei and New Taipei; check the local government's urban planning service elsewhere.")}</dd></dl>`+
      srcLine(cc==="F"?"ntpc":"nu",cc==="F"?ZN.data.ntpc.date:ZN.data["nu-"+cc].date);
  }
  // 3. 沒有向量檔的縣市（嘉義市、金門、連江）：使用分區與使用地類別都讀圖磚
  const [c1,c2]=await Promise.all([pixelAt("nURBAN1",lat,lng),pixelAt("nURBAN2",lat,lng)]);
  if(!c1&&!c2) return `<dl class="zone"><dt>${L2("土地使用分區","Zoning")}</dt><dd>${L2("不在非都市土地分區圖範圍內，可能是都市計畫區或國家公園。本站目前只有臺北市、新北市的都市計畫分區，其他縣市請洽該縣市的都市計畫查詢系統。","Not covered by the non-urban zoning map, so it is probably inside an urban plan area or a national park. This site only has urban plan zoning for Taipei and New Taipei; check the local government's urban planning service elsewhere.")}</dd></dl>`+
    `<div class="src">${L2(`資料：${ZSRC.tile.zh}。`,`Data: ${ZSRC.tile.en}.`)}</div>`;
  const c1code=c1&&nuMatch(c1,NU1_KEY);
  const row1=!c1?`<dt>${L2("使用分區","Zone")}</dt><dd>${L2("（圖上無資料）","(no data)")}</dd>`:`<dt>${L2("使用分區","Zone")}</dt><dd>${sw(c1)}${c1code?nuZoneText(c1code):L2("圖例未列的顏色","Colour not in the legend")}</dd>`;
  return `<dl class="zone">${L2("<dt class=\"h\">非都市土地</dt>","<dt class=\"h\">Non-urban land</dt>")}${row1}${useTypeRow(c2)}</dl>`+(c1code?nuDefHTML(c1code):"")+
    `<div class="src">${L2(`資料：${ZSRC.tile.zh}，依圖磚顏色對照圖例判讀，圖磚未標示更新日期。`,`Data: ${ZSRC.tile.en}, read from the tile colour against the legend; the tiles carry no update date.`)}</div>${zNote()}`;
}
async function appendZone(info,cc,lat,lng){
  const box=document.createElement("div"); box.className="zonebox"; box.innerHTML=`<div class="m">${L2("查詢土地使用分區中…","Looking up land-use zoning…")}</div>`; info.appendChild(box);
  try{ box.innerHTML=await zoneHTML(cc,lat,lng); }
  catch(err){ box.innerHTML=`<div class="m">${L2("土地使用分區查詢失敗，請確認網路連線後再點一次。","Zoning lookup failed. Check your connection and click again.")}</div>`; }
}
if(APP==="arch"){
// ---------- 地號查詢 ----------
const LQ = {mode:false, loaded:null, sect:"", pin:null};
const $ = id => document.getElementById(id);
// 分頁：B 建築作品、L 地號查詢、C Claude 對話
function setTab(m){
  const l=m==="L"; LQ.mode=l;
  ["B","L","C"].forEach(k=>$("tab"+k)?.setAttribute("aria-selected",m===k));
  $("paneB").hidden=m!=="B"; $("footB").hidden=m!=="B"; $("paneL").hidden=!l; if($("paneC")) $("paneC").hidden=m!=="C";
  map.getContainer().style.cursor=l?"crosshair":"";
  if(l){ loadPub(); const cb=$("o0"); if(!cb.checked) cb.click(); }
  if(m==="C") sheet("full");
}
window._archTab=setTab;
$("tabB").onclick=()=>setTab("B"); $("tabL").onclick=()=>setTab("L");

function loadPub(){
  if(LQ.loaded) return LQ.loaded;
  LQ.loaded=new Promise((ok,fail)=>{const s=document.createElement("script");s.src="publand-data.js";s.onload=ok;s.onerror=fail;document.head.appendChild(s);})
  .then(()=>{
    const P=window.PUBLAND, sel=$("lsect"); sel.innerHTML=`<option value="">${L2("選擇地段（或點地圖）","Choose a land section (or click the map)")}</option>`;
    const byD={}; for(const [c,v] of Object.entries(P.sect)) (byD[v[1]]??=[]).push([c,v[0]]);
    for(const d of Object.keys(byD).sort()){const g=document.createElement("optgroup");g.label=d;
      byD[d].sort((a,b)=>a[1].localeCompare(b[1],"zh-Hant")).forEach(([c,n])=>g.appendChild(new Option(`${n}（${c}）`,c)));sel.appendChild(g);}
    $("lupd").textContent=L2(`檔案日期 ${P.updated}，共 ${P.count.toLocaleString()} 筆`,`file dated ${P.updated}, ${P.count.toLocaleString()} parcels`);
  }).catch(()=>{$("lsect").innerHTML=`<option value="">${L2("公有地資料載入失敗","Public land data failed to load")}</option>`;
    $("lhint").textContent=L2("找不到 publand-data.js，請確認它和這個網頁放在同一個資料夾。","Cannot find publand-data.js. Keep it in the same folder as this page.");});
  return LQ.loaded;
}
const fmtNo=s=>{const m=+s.slice(0,4),c=+s.slice(4);return c?`${m}-${c}`:`${m}`};
function parseNo(t){t=t.trim().replace(/[－—–]/g,"-");
  if(/^\d{8}$/.test(t)) return t;
  const m=t.match(/^(\d{1,4})(?:-(\d{1,4}))?$/); if(!m) return null;
  return m[1].padStart(4,"0")+(m[2]||"0").padStart(4,"0");}
function parcels(code){
  const v=window.PUBLAND?.sect[code]; if(!v) return [];
  if(!v._p) v._p=v[2].split(";").map(r=>{const a=r.split(",");return {no:a[0],area:+a[1],type:+a[2],ratio:a[3],mgr:+a[4]}});
  return v._p;
}
function showSect(code){
  LQ.sect=code; $("lsect").value=code; $("lresult").hidden=true;
  const P=window.PUBLAND, list=$("plist"), head=$("lhead"); list.innerHTML="";
  if(!code){head.hidden=true;return;}
  const ps=parcels(code), cnt={};
  ps.forEach(p=>cnt[p.type]=(cnt[p.type]||0)+1);
  head.innerHTML=ps.length?`<span>${L2(`本段公有地號 ${ps.length} 筆`,`${ps.length} public parcels in this section`)}</span>`+Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`<span>${P.types[t]} ${n}</span>`).join("")
    :`<span>${L2("本段在清冊中沒有公有地號","No public parcels listed in this section")}</span>`;
  head.hidden=false;
  const MAX=400;
  ps.slice(0,MAX).forEach(p=>{const li=document.createElement("li");li.dataset.no=p.no;
    li.innerHTML=`<span class="no">${fmtNo(p.no)}</span><span class="ty">${p.ratio||P.types[p.type]}</span><span class="ar">${p.area.toLocaleString()} m²</span>`;
    li.onclick=()=>{$("lno").value=fmtNo(p.no);lookup();};list.appendChild(li);});
  if(ps.length>MAX){const li=document.createElement("li");li.innerHTML=`<span class="more">${L2(`另有 ${ps.length-MAX} 筆，請直接輸入地號查詢`,`${ps.length-MAX} more. Type a parcel number to look it up.`)}</span>`;list.appendChild(li);}
}
$("lsect").onchange=e=>{showSect(e.target.value);};
function lookup(){
  const P=window.PUBLAND, out=$("lresult"); if(!P) return;
  const code=$("lsect").value, no=parseNo($("lno").value);
  out.hidden=false; out.className="";
  if(!code){out.innerHTML=L2("請先選擇地段，或在地圖上點一下。","Choose a land section first, or click the map.");return;}
  if(!no){out.innerHTML=L2("地號格式看不懂。請輸入像「6」「6-1」或 8 碼的「00060001」。","Parcel number not recognized. Use a format like 6, 6-1 or 00060001.");return;}
  const v=P.sect[code], p=parcels(code).find(x=>x.no===no);
  document.querySelectorAll("#plist li.on").forEach(li=>li.classList.remove("on"));
  if(p){
    out.className="pub";
    out.innerHTML=`<div class="m">${v[1]}・${v[0]}</div><div class="t">${L2(`${fmtNo(no)} 地號・公有`,`Parcel ${fmtNo(no)} · Public`)}</div>
      <dl><dt>${L2("權屬","Ownership")}</dt><dd>${P.types[p.type]}</dd><dt>${L2("比例","Share")}</dt><dd>${p.ratio||P.types[p.type]+"(100%)"}</dd>
      <dt>${L2("面積","Area")}</dt><dd>${p.area.toLocaleString()} m²${L2(`（約 ${(p.area*0.3025).toFixed(1)} 坪）`,"")}</dd><dt>${L2("管理機關","Managing agency")}</dt><dd>${P.mgr[p.mgr]}</dd></dl>`;
    const li=document.querySelector(`#plist li[data-no="${no}"]`); if(li){li.classList.add("on");li.scrollIntoView({block:"nearest"});}
  } else {
    out.className="pri";
    out.innerHTML=`<div class="m">${v[1]}・${v[0]}</div><div class="t">${L2(`${fmtNo(no)} 地號・非公有`,`Parcel ${fmtNo(no)} · Not public`)}</div>
      <div>${L2("不在公有土地清冊中，應為私有地，或是地號不存在、尚未登記。要知道是自然人或法人持有，需申請第二類謄本。","Not in the public land register, so it is private land, unregistered, or the number does not exist. A land register transcript shows whether an individual or a company owns it.")}</div>`;
  }
}
$("lform").onsubmit=e=>{e.preventDefault();lookup();};

// 分區疊圖與圖例
function zoneLegend(){
  const lg=$("zonelegend"), parts=[];
  if($("zTpe").checked) parts.push(`<div class="zl"><b>${L2("都市計畫使用分區（臺北市、新北市）","Urban plan zoning (Taipei, New Taipei)")}</b>`+ZG.map(g=>`<span><i style="background:${g.c}"></i>${L2(g.zh,g.en)}</span>`).join("")+
    `<div class="src">${L2("顏色依內政部「都市計畫書圖製作要點」第七點附件三「都市計畫圖例」；最後一類附件三未訂定，為本站自訂。新北市資料只有分區名稱，依名稱歸類。","Colours follow the standard urban plan legend (Ministry of the Interior, Urban Plan Documents and Maps Production Directions, Point 7, Annex 3); the last group is not defined there and was chosen by this site. New Taipei data only has zone names, so it is grouped by name.")}</div></div>`);
  if($("zN1").checked) parts.push(`<div class="zl"><b>${L2("非都市土地使用分區","Non-urban land zoning")}</b>`+NU_CLASS.map(x=>`<span><i style="background:rgb(${x.c.join(",")})"></i>${L2(x.zh,x.en)}</span>`).join("")+
    `<div class="src">${L2("分類依「圖3-1-1 非都市土地使用分區類別圖」；特定專用區、海域區等歸入「其他使用區或專用區」。","Classes follow Figure 3-1-1 (non-urban land zoning classes); special-use and marine zones are grouped under “other use or special-use zone”.")}</div></div>`);
  if($("zN1").checked||$("zN2").checked) parts.push(`<div class="zl"><b>${L2("非都市土地","Non-urban land")}</b><div class="src">${L2("國土測繪中心圖磚，只畫非都市土地；放大超過 17 級會沿用 17 級圖磚。點地圖可查該點的分區。","NLSC tiles cover non-urban land only; beyond zoom 17 the level-17 tiles are stretched. Click the map to read the zone at a point.")}</div></div>`);
  lg.innerHTML=parts.join(""); lg.hidden=!parts.length;
}
async function urbanLayer(key){
  if(ZN.urbanLayers[key]) return ZN.urbanLayers[key];
  const D=await loadZone(key), rd=L.canvas({pane:"otiles",padding:.3}), op=+$("opacity").value;
  return ZN.urbanLayers[key]=L.layerGroup(D.f.map(f=>{const [code,name]=D.codes[f[0]];
    return L.polygon(f.r.map(p=>p.map(([x,y])=>[y,x])),{renderer:rd,interactive:false,stroke:true,weight:.4,color:"#4a3a28",opacity:.5,fillColor:zColor(key,code,name),fillOpacity:.55*op});}));
}
$("zTpe").onchange=async e=>{
  const on=e.target.checked;
  if(!on){ Object.values(ZN.urbanLayers).forEach(l=>map.removeLayer(l)); zoneLegend(); return; }
  e.target.disabled=true;
  try{
    const ls=await Promise.all(["tpe","ntpc"].map(urbanLayer));
    if(e.target.checked) ls.forEach(l=>l.addTo(map));
    if(!map.getBounds().intersects(L.latLngBounds([24.67,121.28],[25.30,122.01]))) map.flyTo([25.05,121.52],12,{duration:.6});
  }catch(err){ e.target.checked=false; $("zonelegend").hidden=false; $("zonelegend").innerHTML=`<div class="src">${L2("都市計畫分區資料載入失敗，請確認 zoning 資料夾和網頁放在一起。","Urban plan zoning data failed to load. Keep the zoning folder next to this page.")}</div>`; e.target.disabled=false; return; }
  e.target.disabled=false; zoneLegend();
};
[["zN1","n1"],["zN2","n2"]].forEach(([id,k])=>$(id).onchange=e=>{ if(e.target.checked){ZN[k].addTo(map); if(map.getZoom()<12) map.setZoom(12);} else map.removeLayer(ZN[k]); zoneLegend(); });
$("opacity").addEventListener("input",e=>{const v=+e.target.value; ZN.n1.setOpacity(v); ZN.n2.setOpacity(v);
  Object.values(ZN.urbanLayers).forEach(g=>g.eachLayer(l=>l.setStyle({fillOpacity:.55*v})));});

map.on("click", async e=>{
  if(!LQ.mode) return;
  const {lat,lng}=e.latlng;
  if(LQ.pin) LQ.pin.setLatLng(e.latlng); else LQ.pin=L.marker(e.latlng,{icon:L.divIcon({className:"",iconSize:[14,14],html:'<div class="clickpin"></div>'}),interactive:false}).addTo(map);
  const info=$("sectinfo"); info.hidden=false; sheet("half"); info.innerHTML=`<div class="m">${L2("查詢地段中…","Looking up the land section…")}</div>`;
  try{
    await loadPub();
    const xml=await fetch(`https://api.nlsc.gov.tw/other/TownVillagePointQuery/${lng.toFixed(6)}/${lat.toFixed(6)}`).then(r=>r.text());
    const d=new DOMParser().parseFromString(xml,"text/xml"), g=t=>d.querySelector(t)?.textContent||"";
    if(!g("sectCode")){info.innerHTML=`<div class="m">${L2("這個位置查不到地段，可能在河川或未登記地。","No land section here. It may be a river or unregistered land.")}</div>`;
      if(g("ctyCode")) appendZone(info,g("ctyCode"),lat,lng); return;}
    if(g("ctyName")!=="臺北市"){info.innerHTML=`<div class="t">${g("sectName")}</div><div class="m">${g("ctyName")}${g("townName")}・${g("officeName")}${L2("地政事務所・段代碼 ","Land Office · section code ")}${g("sectCode")}<br>${L2("公有地清冊只涵蓋臺北市。","The public land register covers Taipei City only.")}</div>`;showSect("");
      appendZone(info,g("ctyCode"),lat,lng); return;}
    info.innerHTML=`<div class="t">${g("sectName")}</div><div class="m">${g("ctyName")}${g("townName")}・${g("villageName")}・${g("officeName")}${L2("地政事務所・段代碼 ","Land Office · section code ")}${g("sectCode")}<br>TWD97 ${fmtTM2(lat,lng)}</div>`;
    showSect(g("sectCode"));
    appendZone(info,g("ctyCode"),lat,lng);
    if(map.getZoom()<17) map.setView(e.latlng,17);
  }catch(err){ info.innerHTML=`<div class="m">${L2("地段查詢失敗，請確認網路連線後再點一次。","Land section lookup failed. Check your connection and click again.")}</div>`; }
});

}

if(APP==="geo"){
// ---------- 地震與環境資料 ----------
// 氣象署（地震報告、氣象測站）：瀏覽器直接呼叫開放資料 API，需要使用者自己的授權碼，只存在 localStorage。
// 溫泉露頭、土石流潛勢溪流、西南海域地熱流：已轉成 env/*.js 放在版本庫，勾選時才載入。
const $e=id=>document.getElementById(id);
const eesc=s=>String(s??"").replace(/[<>&"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[ch]));
const epop=(t,m,body,src)=>`<div class="geopop"><h4>${eesc(t)}</h4>${m?`<div class="m">${m}</div>`:""}${body}<div class="src">${src}</div></div>`;
const erow=rows=>`<table>${rows.filter(r=>r[1]!==""&&r[1]!=null).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join("")}</table>`;
const eEarth=(lat,lng,d)=>`<div style="margin-top:6px"><a href="${earthUrl(lat,lng,d)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div>`;
map.createPane("env"); map.getPane("env").style.zIndex=640;
const envRd=L.canvas({pane:"env",padding:.3});
const ENV={cwaKey:"", layers:{}, data:{}};
try{ ENV.cwaKey=localStorage.getItem("cwaKey")||""; }catch(e){}
const CWA="https://opendata.cwa.gov.tw/api/v1/rest/datastore/";
const SRC_CWA=L2("資料：交通部中央氣象署開放資料平臺（即時查詢）","Data: Central Weather Administration open data (live)");
function cwaUI(){ const need=["envEqS","envEqL","envWst"].some(id=>$e(id).checked);
  $e("cwabox").hidden=!need||!!ENV.cwaKey; $e("cwainfo").hidden=!ENV.cwaKey; }
async function cwaGet(ds){
  const r=await fetch(`${CWA}${ds}?Authorization=${encodeURIComponent(ENV.cwaKey)}`);
  if(r.status===401) throw new Error("key");
  if(!r.ok) throw new Error("http "+r.status);
  return r.json();
}
// 地震：圓的大小看規模，顏色看深度（淺層紅、中層橘、深層藍）
const eqColor=d=>d<30?"#c0392b":d<70?"#e67e22":"#2e6da4";
async function eqLayer(ds,label){
  const j=await cwaGet(ds), list=j.records?.Earthquake||[];
  return L.layerGroup(list.map(e=>{const i=e.EarthquakeInfo, ep=i.Epicenter, m=i.EarthquakeMagnitude?.MagnitudeValue, d=i.FocalDepth;
    const ll=[ep.EpicenterLatitude,ep.EpicenterLongitude];
    return L.circleMarker(ll,{renderer:envRd,radius:Math.max(4,(m||3)*2.6-4),color:"#fff",weight:1.2,fillColor:eqColor(d),fillOpacity:.8})
      .bindTooltip(`M${m} ${i.OriginTime.slice(0,16).replace("T"," ")}`,{direction:"top"})
      .bindPopup(()=>epop(`${L2("規模","M")} ${m}・${i.OriginTime.slice(0,16).replace("T"," ")}`,`${label}・${L2("編號","No.")} ${e.EarthquakeNo}`,
        erow([[L2("位置","Location"),eesc(ep.Location)],[L2("深度","Depth"),`${d} km`],[L2("規模","Magnitude"),`${eesc(i.EarthquakeMagnitude?.MagnitudeType)} ${m}`],
          [L2("內容","Report"),eesc(e.ReportContent)]])+
        (e.Web?`<div style="margin-top:6px"><a href="${eesc(e.Web)}" target="_blank" rel="noopener">${L2("氣象署地震報告","CWA earthquake report")}</a></div>`:"")+eEarth(ll[0],ll[1],60000),SRC_CWA));}));
}
async function stationLayer(){
  const [a,b]=await Promise.all([cwaGet("C-B0074-001"),cwaGet("C-B0074-002")]);
  const pick=(j,kind)=>(j.records?.data?.stationStatus?.station||j.records?.data?.station||[]).filter(s=>s.status==="現存測站").map(s=>[s,kind]);
  const all=[...pick(a,L2("有人站","Staffed")),...pick(b,L2("無人站","Automatic"))];
  return L.layerGroup(all.map(([s,kind])=>{const ll=[+s.StationLatitude,+s.StationLongitude];
    return L.circleMarker(ll,{renderer:envRd,radius:kind===L2("有人站","Staffed")?5.5:3.5,color:"#fff",weight:1,fillColor:kind===L2("有人站","Staffed")?"#1b6f8a":"#5fa8c4",fillOpacity:.9})
      .bindTooltip(eesc(s.StationName),{direction:"top"})
      .bindPopup(()=>epop(s.StationName,`${kind}・${s.StationID}`,erow([[L2("縣市","County"),eesc(s.CountyName)],[L2("地址","Address"),eesc(s.Location)],
        [L2("海拔","Altitude"),`${s.StationAltitude} m`],[L2("啟用日期","Since"),eesc(s.StationStartDate)]])+eEarth(ll[0],ll[1],3000),SRC_CWA));}));
}
// 靜態資料：env/<key>.js
const envLoad={};
function loadEnv(key){ return envLoad[key]??=new Promise((ok,fail)=>{const s=document.createElement("script");s.src=`env/${key}.js`;
  s.onload=()=>window.ENVDATA?.[key]?ok(window.ENVDATA[key]):fail(new Error("empty"));s.onerror=()=>{delete envLoad[key];fail(new Error("load"));};document.head.appendChild(s);}); }
const SRC_HSP=L2("資料：經濟部地質調查及礦業管理中心「溫泉露頭調查資料」（2025-06-20 更新）","Data: GSMMA hot spring outcrop survey (updated 2025-06-20)");
const SRC_HFL=L2("資料：經濟部地質調查及礦業管理中心「西南海域地熱流探測調查」93～104 年度（2025-06-20 更新）","Data: GSMMA SW offshore heat-flow surveys 2004–2015 (updated 2025-06-20)");
const SRC_DEB=L2("資料：農業部農村發展及水土保持署「115年度土石流潛勢溪流」（2026-08-24 更新）","Data: ARDSWC debris-flow potential streams, 2026 edition (updated 2026-08-24)");
const DEB_COL={"高":"#c0392b","中":"#e67e22","低":"#d4ac0d","持續觀察":"#7f8c8d"};
// 原住民族委員會「原住民族地區溫泉服務網」（嘉南藥理大學執行）：原住民族地區溫泉的法令、輔導與旅遊資訊
const APC_URL="https://apc.cnu.edu.tw/";
const APC_LINK=`<div style="margin-top:4px"><a href="${APC_URL}" target="_blank" rel="noopener">${L2("原住民族地區溫泉服務網（法令、輔導與旅遊資訊）","Indigenous-area hot spring service site (rules, guidance, travel)")}</a></div>`;
async function hspLayer(){ const D=await loadEnv("hotspring");
  return L.layerGroup(D.rows.map(([lat,lng,n,c,t,q])=>L.circleMarker([lat,lng],{renderer:envRd,radius:5.5,color:"#fff",weight:1.2,fillColor:"#d35400",fillOpacity:.95})
    .bindTooltip(eesc(n),{direction:"top"}).bindPopup(()=>epop(n,`${eesc(c)}${eesc(t)}`,erow([[L2("泉質","Spring type"),eesc(q)]])+eEarth(lat,lng,3000)+APC_LINK,SRC_HSP)))); }
async function hflLayer(){ const D=await loadEnv("heatflow");
  return L.layerGroup(D.rows.map(([lat,lng,no,yr,dep,probe,ty,period])=>L.circleMarker([lat,lng],{renderer:envRd,radius:4.5,color:"#fff",weight:1,fillColor:"#16a085",fillOpacity:.95})
    .bindTooltip(`${L2("站位","Station")} ${eesc(no)}`,{direction:"top"})
    .bindPopup(()=>epop(`${L2("站位","Station")} ${no}`,`${eesc(period)}・${yr}`,erow([[L2("水深","Water depth"),`${dep} m`],[L2("探針深度","Probe depth"),`${probe} cm`],[L2("探針類型","Probe type"),eesc(ty)]])+eEarth(lat,lng,60000),SRC_HFL)))); }
async function debLayer(){ const D=await loadEnv("debris"), F=D.fields, ix=k=>F.indexOf(k);
  return L.layerGroup(D.f.map(([a,parts])=>{const lls=parts.map(fl=>{const pts=[];let x=0,y=0;for(let i=0;i<fl.length;i+=2){x+=fl[i];y+=fl[i+1];pts.push([y/1e5,x/1e5]);}return pts;});
    const risk=a[ix("Risk")];
    return L.polyline(lls,{renderer:envRd,color:DEB_COL[risk]||"#7f8c8d",weight:3,opacity:.9})
      .bindTooltip(`${eesc(a[ix("Debrisno")])} ${eesc(a[ix("Name")])}`,{sticky:true})
      .bindPopup(e=>epop(`${a[ix("Debrisno")]} ${a[ix("Name")]}`,eesc(a[ix("Full")]),erow([[L2("風險潛勢","Risk"),eesc(risk)],[L2("保全住戶","Households at risk"),eesc(a[ix("TRes_Class")])],
        [L2("類型","Type"),eesc(a[ix("Type")])],[L2("流域","Basin"),eesc(a[ix("Basin")])],[L2("長度","Length"),`${a[ix("Length")]} km`],[L2("地層","Geology"),eesc(a[ix("Stra_1")])],[L2("地標","Landmark"),eesc(a[ix("Mark")])]])+
        eEarth(e.latlng.lat,e.latlng.lng,4000),SRC_DEB));}));
}
// 地調中心 WMS（只支援 EPSG:4326，用 Leaflet 的 WMS 圖層以 4326 範圍請求）
const GSMMA_WMS="https://geomap.gsmma.gov.tw/mapguide/mapagent/mapagent.fcgi";
map.createPane("envtiles"); map.getPane("envtiles").style.zIndex=630;
const gsmmaWms=layer=>L.tileLayer.wms(GSMMA_WMS,{layers:layer,format:"image/png",transparent:true,version:"1.3.0",crs:L.CRS.EPSG4326,pane:"envtiles",
  maxZoom:20,attribution:"© 經濟部地質調查及礦業管理中心"});
const SRC_LSL=L2("資料：農業部農村發展及水土保持署「115年度94處大規模崩塌潛勢區」與影響範圍（2026-01-14 更新）","Data: ARDSWC 94 large-scale landslide potential areas and impact zones, 2026 edition (updated 2026-01-14)");
const SRC_VOL=L2("資料：經濟部地質調查及礦業管理中心「火山災害潛勢圖」（大屯火山群各亞群、龜山島）","Data: GSMMA volcanic hazard potential maps (Tatun volcano group, Guishan Island)");
const RISK_COL={"高":"#c0392b","中":"#e67e22","低":"#d4ac0d"};
const dec5=fl=>{const pts=[];let x=0,y=0;for(let i=0;i<fl.length;i+=2){x+=fl[i];y+=fl[i+1];pts.push([y/1e5,x/1e5]);}return pts;};
async function lslLayer(){ const D=await loadEnv("landslide"), A=D.area.fields, B=D.impact.fields, ia=k=>A.indexOf(k), ib=k=>B.indexOf(k), g=L.layerGroup();
  D.impact.f.forEach(([a,ps])=>ps.forEach(rings=>L.polygon(rings.map(dec5),{renderer:envRd,color:"#8e44ad",weight:1,dashArray:"4 3",fillColor:"#8e44ad",fillOpacity:.12})
    .bindPopup(()=>epop(`${a[ib("Islno")]} ${L2("影響範圍","impact zone")}`,eesc(a[ib("County")]+a[ib("Town")]+a[ib("Vill")]),erow([[L2("風險潛勢","Risk"),eesc(a[ib("Risk")])],
      [L2("保全住戶","Households at risk"),`${eesc(a[ib("Total_Res")])}（${eesc(a[ib("TRes_Class")])}）`]]),SRC_LSL)).addTo(g)));
  D.area.f.forEach(([a,ps])=>ps.forEach(rings=>{const c=RISK_COL[a[ia("Risk")]]||"#7f8c8d";
    L.polygon(rings.map(dec5),{renderer:envRd,color:c,weight:2,fillColor:c,fillOpacity:.35}).bindTooltip(`${eesc(a[ia("lslno")])} ${eesc(a[ia("Name")])}`,{sticky:true})
      .bindPopup(e=>epop(`${a[ia("lslno")]} ${a[ia("Name")]}`,eesc(a[ia("Full")]),erow([[L2("風險潛勢","Risk"),eesc(a[ia("Risk")])],[L2("類型","Type"),eesc(a[ia("Type")])],
        [L2("保全住戶","Households at risk"),`${eesc(a[ia("Dw_count")])}（${eesc(a[ia("TRes_Class")])}）`],[L2("面積","Area"),`${eesc(a[ia("P_area")])} ha`],
        [L2("流域","Basin"),eesc(a[ia("Basin")])],[L2("地層","Geology"),eesc(a[ia("Stra_1")])],[L2("地標","Landmark"),eesc(a[ia("Mark")])]])+eEarth(e.latlng.lat,e.latlng.lng,5000),SRC_LSL)).addTo(g);}));
  return g; }
// 火山災害潛勢：下拉選單選災害類型，火山口位置一直顯示
const VOL_COL={"熔岩流":"#c0392b","火山碎屑流":"#8e44ad","火山泥流":"#795548","火山灰(夏季)":"#7f8c8d","火山灰(冬季)":"#34495e","海嘯":"#2e86c1"};
const volHazOf=l=>l.hazard==="火山灰"?"火山灰(夏季)":l.hazard; // 龜山島的火山灰不分季節，兩個季節都顯示
async function volLayer(){ const D=await loadEnv("volcano"), sel=$e("volhaz").value, g=L.layerGroup(), c=VOL_COL[sel];
  D.layers.forEach(l=>{
    const show=l.hazard==="火山口位置"||volHazOf(l)===sel||(l.hazard==="火山灰"&&sel==="火山灰(冬季)");
    if(!show) return;
    const head=()=>epop(`${l.vent}・${L2(l.hazard,l.hazard)}`,`${l.group}${l.group==="龜山島"?"":L2("火山亞群","volcano subgroup")}`,"",SRC_VOL);
    l.f.forEach(f=>{
      if(f[0]==="pt") L.circleMarker([f[1],f[2]],{renderer:envRd,radius:7,color:"#fff",weight:2,fillColor:"#b03a2e",fillOpacity:1})
        .bindTooltip(`${l.vent}${L2("火山口","crater")}`,{direction:"top"}).bindPopup(head).addTo(g);
      else if(f[0]==="ln") L.polyline(f[2].map(dec5),{renderer:envRd,color:c,weight:2.5,dashArray:"6 4"})
        .bindTooltip(`${l.vent} ${L2("火山灰等厚線","ash isopach")} ${eesc(f[1])}`,{sticky:true}).bindPopup(head).addTo(g);
      else L.polygon(f[2].map(dec5),{renderer:envRd,color:c,weight:1.2,fillColor:c,fillOpacity:l.hazard==="海嘯"?({"<0.3公尺":.2,"0.3~3公尺":.4,">3公尺":.65})[f[1]]??.35:.3})
        .bindTooltip(`${l.vent} ${eesc(L2(l.hazard,l.hazard))}${f[1]?" "+eesc(f[1]):""}`,{sticky:true}).bindPopup(head).addTo(g);
    });
  });
  return g; }
// 地調中心「臺灣水文地質資訊系統」觀測井：勾選時即時以 POST 取得 GeoJSON（不需金鑰，CORS 開放）
const HYDRO="https://hydro.geologycloud.tw";
const SRC_WEL=L2("資料：經濟部地質調查及礦業管理中心「臺灣水文地質資訊系統」（即時查詢）","Data: GSMMA Taiwan Hydrogeological Information System (live)");
const WEL_SET=[["mt","#6d4c41",L2("地礦中心・山區","GSMMA mountain")],["p","#1e88e5",L2("地礦中心・平原","GSMMA plain")],["wra","#00897b",L2("水利署","Water Resources Agency")],["wrap","#8e24aa",L2("水利規劃分署","WRA Planning Branch")]];
async function welLayer(){
  const g=L.layerGroup(); let n=0;
  const res=await Promise.all(WEL_SET.map(([k])=>fetch(`${HYDRO}/data/${k}/hydrostation`,{method:"POST"}).then(r=>{if(!r.ok) throw new Error("http "+r.status);return r.json();})));
  res.forEach((j,i)=>{const [k,c,lab]=WEL_SET[i]; (j.data?.features||[]).forEach(f=>{const p=f.properties,[lng,lat]=f.geometry.coordinates; n++;
    const yn=v=>v?L2("有","yes"):L2("無","no");
    L.circleMarker([lat,lng],{renderer:envRd,radius:4.5,color:"#fff",weight:1,fillColor:c,fillOpacity:.95}).bindTooltip(eesc(p.STATION_NAME),{direction:"top"})
      .bindPopup(()=>epop(p.STATION_NAME,`${lab}・${eesc(p.STATION_NMBR)}`,erow([[L2("縣市","County"),eesc(p.City_Name)],[L2("流域","Basin"),eesc(p.River_Name)],[L2("水文地質分區","Hydrogeological unit"),eesc(p.Wsect_Name)],
        [L2("井深","Well depth"),p.Well_Depth!=null?`${p.Well_Depth} m`:""],[L2("地面高程","Ground elevation"),p.CUR_ELEVATION!=null?`${p.CUR_ELEVATION} m`:""],[L2("鑽井年","Drilled"),eesc(p.EXEYEAR)],[L2("鑽井方式","Drilling"),eesc(p.Drill_Type)],
        [L2("岩心影像","Core images"),yn(p.Rock_Image)],[L2("水位資料","Water level data"),yn(p.Water_Line)],[L2("水質資料","Water quality data"),yn(p.Water_Test)]])+
        `<div style="margin-top:6px"><a href="${HYDRO}/map" target="_blank" rel="noopener">${L2("在臺灣水文地質資訊系統查看岩心與水位","View cores and water levels in the official system")}</a></div>`+eEarth(lat,lng,3000),SRC_WEL)).addTo(g);});});
  if(!n) throw new Error("empty");
  return g;
}
// 地調中心工程地質探勘資料庫：鑽孔點位分布（圖台的 WMS 代理，只畫點、點不出屬性；正式 API 需申請）
const GEOTECH="https://geotech.gsmma.gov.tw/imoeagis";
const borLayer=async()=>L.tileLayer.wms(`${GEOTECH}/api/MapsProxy/DrillHoles`,{layers:"geocore2020:GeoServiceDrCoord",format:"image/png",transparent:true,version:"1.3.0",
  pane:"envtiles",maxZoom:20,attribution:"© 經濟部地質調查及礦業管理中心 工程地質探勘資料庫"});
// 地調中心順向坡目錄圖磚（只到第 15 級）
const dipLayer=async()=>L.tileLayer("https://landslide.geologycloud.tw/jlwmts/jetlink/Dislope/GoogleMapsCompatible/{z}/{x}/{y}.png",{pane:"envtiles",maxZoom:20,maxNativeZoom:15,opacity:.85,attribution:"© 經濟部地質調查及礦業管理中心"});
// 林業保育署國土生態綠網：下拉選單切換 8 種圖資
const SRC_ECO=d=>L2(`資料：農業部林業及自然保育署「國土生態綠網」圖資（${d}）`,`Data: Forestry and Nature Conservation Agency, national ecological network (${d})`);
const ECO_ZONE_COL=["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"];
const HOT_COL={1:"#fee08b",2:"#fdae61",3:"#f46d43",4:"#a50026"};
async function ecoLayer(){
  const k=$e("ecosel").value, D=await loadEnv("eco-"+k), g=L.layerGroup(), src=SRC_ECO(D.date), F=D.fields||[], ix=n=>F.indexOf(n);
  const poly=(ps,st,tip,pop)=>ps.forEach(rings=>{const l=L.polygon(rings.map(dec5),Object.assign({renderer:envRd,weight:1.2},st)); if(tip) l.bindTooltip(tip,{sticky:true}); if(pop) l.bindPopup(pop); l.addTo(g);});
  if(k==="zone") D.f.forEach(([a,ps],i)=>poly(ps,{color:"#555",fillColor:ECO_ZONE_COL[i%12],fillOpacity:.35},eesc(a[0]),()=>epop(a[0],"",erow([[L2("面積","Area"),`${Math.round(a[1]).toLocaleString()} ha`]]),src)));
  if(k==="focus"||k==="axis"){ const nm=k==="focus"?"Name":"name";
    D.f.forEach(([a,ps])=>poly(ps,{color:k==="focus"?"#2e7d32":"#00838f",fillColor:k==="focus"?"#66bb6a":"#4dd0e1",fillOpacity:.3},eesc(a[ix(nm)]),
      ()=>epop(a[ix(nm)],k==="focus"?eesc(a[ix("Zone")]):`${eesc(a[ix("zone")])}・${eesc(a[ix("type")])}・${eesc(a[ix("fd")])}`,
        erow(k==="focus"?[[L2("位置","Location"),eesc(a[ix("Location")])],[L2("棲地","Habitat"),eesc(a[ix("Habitat")])],[L2("關注動物","Animals"),eesc(a[ix("Animal")])],[L2("關注植物","Plants"),eesc(a[ix("Plant")])],[L2("目的","Purpose"),eesc(a[ix("Purpose")])],[L2("面積","Area"),`${Math.round(+a[ix("Area_ha")]).toLocaleString()} ha`]]
          :[[L2("範圍","Area"),eesc(a[ix("region")])],[L2("棲地","Habitat"),eesc(a[ix("habitat")])],[L2("策略","Strategy"),eesc(a[ix("strategy")])],[L2("面積","Area"),`${Math.round(+a[ix("area_ha")]).toLocaleString()} ha`],[L2("版本","Edition"),eesc(a[ix("Edition")])]]),src))); }
  if(k==="hotspot") D.f.forEach(([v,ps])=>poly(ps,{color:HOT_COL[v],weight:.5,fillColor:HOT_COL[v],fillOpacity:.55},L2(`${v}${v>=4?" 類以上":" 類"}動物類群熱點`,`Hotspot for ${v}${v>=4?"+":""} animal groups`)));
  if(k==="satoyama") D.f.forEach(([v,ps])=>poly(ps,{color:"#689f38",weight:.5,fillColor:"#9ccc65",fillOpacity:.5},L2("重要關注里山地景","Satoyama landscape of concern")));
  if(k==="stream") D.f.forEach(([a,ps])=>poly(ps,{color:"#0277bd",fillColor:"#29b6f6",fillOpacity:.6,weight:2},eesc(a[0]),()=>epop(a[0],L2("關注獨流溪","Independent stream of concern"),erow([[L2("備註","Note"),eesc(a[2])]]),src)));
  if(k==="river") D.f.forEach(([a,parts])=>L.polyline(parts.map(dec5),{renderer:envRd,color:"#0277bd",weight:3,opacity:.9}).bindTooltip(eesc(a[ix("NAME")]),{sticky:true})
    .bindPopup(()=>epop(a[ix("NAME")],`${eesc(a[ix("drainage_t")])}・${eesc(a[ix("COUNTY20_1")])}`,erow([[L2("關注物種","Species of concern"),eesc(a[ix("Note")])]]),src)).addTo(g));
  if(k==="pond") D.rows.forEach(([lat,lng,sp,sn,de,so])=>L.circleMarker([lat,lng],{renderer:envRd,radius:5,color:"#fff",weight:1,fillColor:"#00897b",fillOpacity:.95}).bindTooltip(eesc(sp),{direction:"top"})
    .bindPopup(()=>epop(sp,`<i>${eesc(sn)}</i>`,erow([[L2("地點","Place"),eesc(de)],[L2("資料來源","Source"),eesc(so)]])+eEarth(lat,lng,3000),src)).addTo(g));
  return g;
}
// 土地使用分區：疊非都市分區圖磚；勾選時點地圖（不是點在其他圖層上）跳出該點的地段、分區與定義
const zonLayer=async()=>ZN.n1;
map.on("click",async e=>{
  if(!$e("envZon").checked||e.propagatedFrom||(window._mkAdding&&window._mkAdding())) return;
  const {lat,lng}=e.latlng, pop=L.popup({maxWidth:320,minWidth:260}).setLatLng(e.latlng)
    .setContent(`<div class="geopop zonepop"><div class="m">${L2("查詢地段與土地使用分區中…","Looking up the land section and zoning…")}</div></div>`).openOn(map);
  try{
    const xml=await fetch(`https://api.nlsc.gov.tw/other/TownVillagePointQuery/${lng.toFixed(6)}/${lat.toFixed(6)}`).then(r=>r.text());
    const d=new DOMParser().parseFromString(xml,"text/xml"), g=t=>d.querySelector(t)?.textContent||"";
    const head=g("sectName")?`<h4>${eesc(g("sectName"))}</h4><div class="m">${eesc(g("ctyName")+g("townName"))}・${L2("段代碼","Section")} ${eesc(g("sectCode"))}</div>`
      :`<h4>${L2("查不到地段","No land section")}</h4><div class="m">${eesc(g("ctyName")+g("townName"))||L2("可能在海上或河川","Possibly at sea or in a river")}</div>`;
    const body=g("ctyCode")?await zoneHTML(g("ctyCode"),lat,lng):`<div class="src">${L2("這個位置不在任何縣市範圍內。","This point is outside all counties.")}</div>`;
    if(map.hasLayer(pop)) pop.setContent(`<div class="geopop zonepop">${head}<div class="zonebox">${body}</div></div>`);
  }catch(err){ if(map.hasLayer(pop)) pop.setContent(`<div class="geopop zonepop"><div class="m">${L2("查詢失敗，請確認網路連線後再點一次。","Lookup failed. Check your connection and click again.")}</div></div>`); }
});
const ENV_DEF={
  envZon:{make:zonLayer},
  envEqS:{cwa:1,make:()=>eqLayer("E-A0015-001",L2("顯著有感地震","Notable felt earthquake"))},
  envEqL:{cwa:1,make:()=>eqLayer("E-A0016-001",L2("小區域有感地震","Local felt earthquake"))},
  envWst:{cwa:1,make:stationLayer},
  envHsp:{make:hspLayer}, envDeb:{make:debLayer}, envHfl:{make:hflLayer},
  envFlt:{make:async()=>gsmmaWms("WMS/25K_Geomap_fault_2021")}, envFsa:{make:async()=>gsmmaWms("WMS/Sensitive_area_fault")},
  envLsl:{make:lslLayer}, envVol:{make:volLayer},
  envWel:{make:welLayer}, envDip:{make:dipLayer}, envEco:{make:ecoLayer}, envBor:{make:borLayer},
};
function envLegend(msg){
  const on=id=>$e(id).checked, parts=[];
  if(on("envZon")) parts.push(`<div class="zl"><b>${L2("非都市土地使用分區","Non-urban land zoning")}</b>`+NU_CLASS.map(x=>`<span><i style="background:rgb(${x.c.join(",")})"></i>${L2(x.zh,x.en)}</span>`).join("")+
    `<div class="src">${L2("點地圖查該點的分區與定義；臺北市、新北市都市計畫區也查得到。分類依「圖3-1-1 非都市土地使用分區類別圖」。","Click the map for the zone and its definition; urban plan areas in Taipei and New Taipei are covered too.")}</div></div>`);
  if(on("envEqS")||on("envEqL")) parts.push(`<div class="zl"><b>${L2("有感地震（最近各 16 筆）","Felt earthquakes (latest 16 each)")}</b>`+
    [["#c0392b",L2("深度 &lt; 30 km","Depth &lt; 30 km")],["#e67e22","30–70 km"],["#2e6da4","&gt; 70 km"]].map(([c,t])=>`<span><i style="background:${c};border-radius:50%"></i>${t}</span>`).join("")+
    `<div class="src">${L2("圓越大規模越大。","Larger circles mean larger magnitude.")}</div></div>`);
  if(on("envWst")) parts.push(`<div class="zl"><b>${L2("氣象測站（現存）","Weather stations (active)")}</b><span><i style="background:#1b6f8a;border-radius:50%"></i>${L2("有人站","Staffed")}</span><span><i style="background:#5fa8c4;border-radius:50%"></i>${L2("無人站","Automatic")}</span></div>`);
  if(on("envDeb")) parts.push(`<div class="zl"><b>${L2("土石流潛勢溪流","Debris-flow potential streams")}</b>`+Object.entries(DEB_COL).map(([k,c])=>`<span><i style="background:${c}"></i>${L2(k==="持續觀察"?"持續觀察":k+"潛勢",k==="持續觀察"?"Under observation":({"高":"High","中":"Medium","低":"Low"})[k])}</span>`).join("")+`</div>`);
  if(on("envHsp")) parts.push(`<div class="zl"><span><i style="background:#d35400;border-radius:50%"></i>${L2("溫泉露頭","Hot spring outcrop")}</span><div class="src">${L2("原住民族地區溫泉的法令與輔導資訊見","For rules and guidance on hot springs in indigenous areas, see the")} <a href="${APC_URL}" target="_blank" rel="noopener">${L2("原住民族地區溫泉服務網","indigenous-area hot spring service site")}</a>${L2("。",".")}</div></div>`);
  if(on("envHfl")) parts.push(`<div class="zl"><span><i style="background:#16a085;border-radius:50%"></i>${L2("西南海域地熱流探測站","SW offshore heat-flow station")}</span></div>`);
  if(on("envFlt")||on("envFsa")) parts.push(`<div class="zl"><b>${L2("活動斷層","Active faults")}</b><div class="src">${L2("地調中心 WMS 圖層，線型與顏色依原圖；點不出屬性。","GSMMA WMS layer drawn as published; not clickable.")}</div></div>`);
  if(on("envLsl")) parts.push(`<div class="zl"><b>${L2("大規模崩塌潛勢區","Large-scale landslide potential")}</b>`+Object.entries(RISK_COL).map(([k,c])=>`<span><i style="background:${c}"></i>${L2(k+"潛勢",({"高":"High","中":"Medium","低":"Low"})[k])}</span>`).join("")+
    `<span><i style="background:transparent;border:1px dashed #8e44ad"></i>${L2("影響範圍","Impact zone")}</span></div>`);
  if(on("envVol")){ const s=$e("volhaz").value; parts.push(`<div class="zl"><b>${L2("火山災害潛勢","Volcanic hazard potential")}・${$e("volhaz").selectedOptions[0].textContent}</b>`+
    `<span><i style="background:${VOL_COL[s]}"></i>${L2("影響範圍","Affected area")}${s.startsWith("火山灰")?L2("（虛線為等厚線）"," (dashed: isopachs)"):""}</span><span><i style="background:#b03a2e;border-radius:50%"></i>${L2("火山口位置","Crater")}</span>`+
    `<div class="src">${L2("磺嘴山火山灰（冬季）官方檔案內容不符且損毀，未收錄；另有兩個損毀的子檔略過。","The official file for Huangzuishan winter ash fall is mislabelled and corrupt, so it is not shown; two other corrupt sub-files were skipped.")}</div></div>`); }
  if(on("envDip")) parts.push(`<div class="zl"><b>${L2("順向坡","Dip slopes")}</b><div class="src">${L2("地調中心圖磚，顏色依原圖；放大超過 15 級會沿用 15 級圖磚。","GSMMA tiles drawn as published; level-15 tiles are stretched beyond zoom 15.")}</div></div>`);
  if(on("envEco")){ const k=$e("ecosel").value; parts.push(`<div class="zl"><b>${L2("國土生態綠網","National ecological network")}・${$e("ecosel").selectedOptions[0].textContent}</b>`+
    (k==="hotspot"?Object.entries(HOT_COL).map(([v,c])=>`<span><i style="background:${c}"></i>${L2(v+(v==4?" 類以上":" 類")+"動物類群",`${v}${v==4?"+":""} animal groups`)}</span>`).join(""):"")+
    `<div class="src">${L2("日期依官方檔名標示的版本年月。","Dates follow the version stamped in the official file names.")}</div></div>`); }
  if(msg) parts.push(`<div class="src">${msg}</div>`);
  $e("envlegend").innerHTML=parts.join(""); $e("envlegend").hidden=!parts.length;
  window._wellLegend?.();
}
// 觀測井與工程鑽孔的圖例放在側欄「井」區塊（wellLegend 會呼叫這裡）
window._wellEnvLegend=()=>{const on=id=>$e(id).checked, p=[];
  if(on("envWel")) p.push(`<div class="zl"><b>${L2("水文地質觀測井","Hydrogeological wells")}</b>`+WEL_SET.map(([k,c,lab])=>`<span><i style="background:${c};border-radius:50%"></i>${lab}</span>`).join("")+`</div>`);
  if(on("envBor")) p.push(`<div class="zl"><b>${L2("工程鑽孔分布","Engineering boreholes")}</b><div class="src">${L2("地調中心工程地質探勘資料庫（約 7.3 萬孔），只顯示位置。孔號、深度與柱狀圖請到","GSMMA engineering geology database (about 73,000 holes), locations only. For hole numbers, depths and logs, open the")} <a href="${GEOTECH}/Home/Map" target="_blank" rel="noopener">${L2("工程地質探勘資料庫圖台","official map")}</a>${L2("查詢。","." )}</div></div>`);
  return p.join("");};
async function envToggle(id){
  const box=$e(id), def=ENV_DEF[id]; cwaUI();
  if(!box.checked){ if(ENV.layers[id]) map.removeLayer(ENV.layers[id]); envLegend(); return; }
  if(def.cwa&&!ENV.cwaKey){ envLegend(L2("請先輸入氣象署授權碼。","Enter your CWA key first.")); $e("cwakey").focus(); return; }
  box.disabled=true;
  try{
    ENV.layers[id]??=await def.make();
    if(box.checked) ENV.layers[id].addTo(map);
    envLegend();
  }catch(err){
    box.checked=false;
    envLegend(err.message==="key"?L2("氣象署授權碼無效，請清除後重新輸入。","The CWA key was rejected. Clear it and enter it again.")
      :L2("資料載入失敗，請確認網路連線後再試一次。","Data failed to load. Check your connection and try again."));
  }finally{ box.disabled=false; cwaUI(); }
}
Object.keys(ENV_DEF).forEach(id=>$e(id).onchange=()=>envToggle(id));
// 火山：顯示災害類型選單；換類型時重畫
const volSync=()=>{ $e("volhaz").hidden=!$e("envVol").checked; };
$e("envEco").addEventListener("change",()=>{ $e("ecosel").hidden=!$e("envEco").checked; });
$e("ecosel").onchange=()=>{ if(ENV.layers.envEco) map.removeLayer(ENV.layers.envEco); delete ENV.layers.envEco; if($e("envEco").checked) envToggle("envEco"); };
$e("envVol").addEventListener("change",volSync);
$e("volhaz").onchange=()=>{ if(ENV.layers.envVol) map.removeLayer(ENV.layers.envVol); delete ENV.layers.envVol; if($e("envVol").checked) envToggle("envVol"); };
$e("envVol").addEventListener("change",()=>{ if($e("envVol").checked&&map.getZoom()<10) map.flyTo([25.12,121.62],11,{duration:.6}); });
$e("cwaform").onsubmit=e=>{e.preventDefault(); const v=$e("cwakey").value.trim(); if(!v) return;
  ENV.cwaKey=v; try{localStorage.setItem("cwaKey",v);}catch(err){} $e("cwakey").value="";
  ["envEqS","envEqL","envWst"].forEach(id=>{ delete ENV.layers[id]; if($e(id).checked) envToggle(id); }); cwaUI(); };
$e("cwadel").onclick=()=>{ ENV.cwaKey=""; try{localStorage.removeItem("cwaKey");}catch(err){}
  ["envEqS","envEqL","envWst"].forEach(id=>{ if(ENV.layers[id]) map.removeLayer(ENV.layers[id]); delete ENV.layers[id]; $e(id).checked=false; }); cwaUI(); envLegend(); };
cwaUI();
}

// ---------- Claude 對話欄 ----------
// 使用者自備 Anthropic API 金鑰：金鑰只存在這個瀏覽器的 localStorage，由瀏覽器直接送到 Anthropic API，不經過本站。
// 本站是公開的靜態網頁，程式碼裡不能放金鑰，所以不提供共用金鑰。
// SDK 第一次開啟對話時才從 jsDelivr 載入（官方 @anthropic-ai/sdk 的 ESM 版本）。
const CHAT={sdk:null, client:null, key:"", history:[], busy:false};
const CHAT_MODEL="claude-opus-5-5";
const CHAT_SDK_URL="https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.3.0/+esm";
const CHAT_KEY_STORE="anthropicKey";
try{ CHAT.key=localStorage.getItem(CHAT_KEY_STORE)||""; }catch(e){}
const chatSystem=()=>[
  APP==="arch"
    ? "你是「臺灣建築地圖」網站裡的助理。這個網站用 Leaflet 顯示臺灣的建築作品、古蹟與歷史建築、地號查詢（地段、臺北市公有地、土地使用分區），底圖與圖資來自內政部國土測繪中心。"
    : "你是「臺灣地熱地圖」網站裡的助理。這個網站用 Leaflet 顯示經濟部地質調查及礦業管理中心地熱探勘資訊平臺的開放資料（調查區、鑽井、地溫計、水質、地質圖等），底圖與圖資來自內政部國土測繪中心。",
  "每則使用者訊息前面會附上〔目前地圖狀態〕，那是網頁自動帶入的畫面資訊，請拿來理解使用者在問哪裡，不要整段複述。",
  "回答時：法規、數據、網址、人名沒有把握就直接說不確定，不要編造；土地使用分區、權屬等以主管機關文件為準時要提醒。",
  EN ? "Reply in English unless the user writes in Chinese." : "用台灣繁體中文回答，口語但專業，簡潔就好。",
].join("\n");
// 收集目前地圖畫面的資訊，附在每則訊息前
function mapContext(){
  const c=map.getCenter(), lines=[];
  lines.push(`中心 WGS84 ${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}（TWD97 ${fmtTM2(c.lat,c.lng)}），縮放 ${map.getZoom()}`);
  const base=document.querySelector('input[name="base"]:checked')?.closest("label")?.textContent.trim();
  if(base) lines.push("底圖："+base);
  const on=[...document.querySelectorAll('#layers input[type="checkbox"]:checked')].map(b=>b.closest("label")?.textContent.trim()).filter(Boolean);
  if(on.length) lines.push("已開啟圖層："+on.join("、"));
  const vis=id=>{const el=document.getElementById(id); return el&&!el.hidden&&el.innerText.trim()?el.innerText.trim().replace(/\n+/g," / ").slice(0,1200):"";};
  const sect=vis("sectinfo"); if(sect) lines.push("地號查詢結果："+sect);
  const card=vis("card"); if(card) lines.push("目前選取的建築："+card);
  const geo=[...document.querySelectorAll('#geochecks input:checked')].map(b=>b.closest("label")?.textContent.trim()).filter(Boolean);
  if(geo.length) lines.push("地熱資料勾選："+geo.join("、"));
  return "〔目前地圖狀態〕\n"+lines.join("\n");
}
function chatEsc(s){return s.replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function chatAdd(role,text){
  const li=document.createElement("li"); li.className="cm "+role; li.textContent=text;
  document.getElementById("chatlog").appendChild(li); li.scrollIntoView({block:"end"}); return li;
}
function chatRenderKey(){
  const has=!!CHAT.key;
  document.getElementById("chatkeybox").hidden=has;
  document.getElementById("chatform").hidden=!has;
  document.getElementById("chatkeyinfo").hidden=!has;
}
async function chatClient(){
  if(CHAT.client) return CHAT.client;
  if(!CHAT.sdk) CHAT.sdk=(await import(CHAT_SDK_URL)).default;
  // dangerouslyAllowBrowser：金鑰是使用者自己的、只存在使用者自己的瀏覽器，才開啟這個選項
  CHAT.client=new CHAT.sdk({apiKey:CHAT.key, dangerouslyAllowBrowser:true});
  return CHAT.client;
}
function chatErr(err){
  const A=CHAT.sdk;
  if(A&&err instanceof A.AuthenticationError) return L2("API 金鑰無效，請按「更換金鑰」重新輸入。","The API key was rejected. Use “Change key” to enter it again.");
  if(A&&err instanceof A.PermissionDeniedError) return L2("這把金鑰沒有使用這個模型的權限。","This key is not allowed to use this model.");
  if(A&&err instanceof A.RateLimitError) return L2("請求太頻繁或額度不足，稍等一下再試。","Rate limited or out of credit. Wait a moment and try again.");
  if(A&&err instanceof A.APIConnectionError) return L2("連不上 Anthropic API，請確認網路連線。","Could not reach the Anthropic API. Check your connection.");
  if(A&&err instanceof A.APIError) return L2(`API 錯誤（${err.status??"?"}）：`,`API error (${err.status??"?"}): `)+(err.message||"");
  return L2("對話載入失敗：","Chat failed: ")+(err?.message||err);
}
async function chatSend(text){
  if(CHAT.busy||!text.trim()) return;
  CHAT.busy=true; document.getElementById("chatsend").disabled=true;
  chatAdd("user",text);
  const out=chatAdd("assistant",L2("思考中…","Thinking…")); out.classList.add("pending");
  // 地圖狀態附在使用者訊息前；對話紀錄只往後加，不改舊訊息（前綴快取與 thinking 區塊都需要）
  const userMsg={role:"user",content:mapContext()+"\n\n"+text};
  const messages=[...CHAT.history,userMsg];
  try{
    const client=await chatClient();
    const stream=client.beta.messages.stream({
      model:CHAT_MODEL, max_tokens:16000,
      system:[{type:"text",text:chatSystem(),cache_control:{type:"ephemeral"}}],
      output_config:{effort:"low"},
      betas:["server-side-fallback-2026-07-01"], fallbacks:"default", // 被安全機制拒絕時由伺服器改用適合的模型
      messages,
    });
    let got="";
    stream.on("text",d=>{ if(!got){out.textContent="";out.classList.remove("pending");} got+=d; out.textContent=got; out.scrollIntoView({block:"end"}); });
    const msg=await stream.finalMessage();
    out.classList.remove("pending");
    if(msg.stop_reason==="refusal"){ out.textContent=got||L2("這個問題被 Claude 的安全機制拒絕回答，換個問法試試。","Claude declined to answer this. Try rephrasing."); }
    else if(!got) out.textContent=L2("（沒有文字回覆）","(no text reply)");
    if(msg.stop_reason==="max_tokens") out.textContent+=L2("\n（回覆太長被截斷）","\n(reply cut off: too long)");
    CHAT.history.push(userMsg,{role:"assistant",content:msg.content});
  }catch(err){
    out.classList.remove("pending"); out.classList.add("err"); out.textContent=chatErr(err);
    if(CHAT.sdk&&err instanceof CHAT.sdk.AuthenticationError){ CHAT.client=null; }
  }finally{ CHAT.busy=false; document.getElementById("chatsend").disabled=false; }
}
function buildChatPane(){
  const side=document.getElementById("side");
  const pane=document.createElement("div"); pane.id="paneC"; pane.className="pane"; pane.hidden=true;
  pane.innerHTML=`<div class="controls chatpane">
    <div class="hint">${L2("問 Claude 跟地圖有關的問題。每次提問會自動附上目前的地圖位置、開啟的圖層和查詢結果。","Ask Claude about the map. Each question automatically includes the current map position, open layers and lookup results.")}</div>
    <div id="chatkeybox">
      <label for="chatkey" class="label">${L2("你的 Anthropic API 金鑰","Your Anthropic API key")}</label>
      <form id="chatkeyform" class="row"><input id="chatkey" type="password" autocomplete="off" placeholder="sk-ant-…" aria-label="API key"><button class="btn" type="submit">${L2("儲存","Save")}</button></form>
      <div class="src">${L2("金鑰只存在這個瀏覽器，由瀏覽器直接送到 Anthropic，不會經過本站；費用由你的 Anthropic 帳號支付。共用電腦用完請按「清除金鑰」。","The key stays in this browser and goes straight to Anthropic, never through this site. Usage is billed to your Anthropic account. On a shared computer, clear the key when you are done.")}</div>
    </div>
    <div id="chatkeyinfo" class="src" hidden>${L2(`模型 ${CHAT_MODEL}・金鑰已存在這個瀏覽器`,`Model ${CHAT_MODEL} · key saved in this browser`)}
      <button type="button" class="linkbtn" id="chatkeychg">${L2("更換金鑰","Change key")}</button>
      <button type="button" class="linkbtn" id="chatkeydel">${L2("清除金鑰","Clear key")}</button>
      <button type="button" class="linkbtn" id="chatclear">${L2("清除對話","Clear chat")}</button></div>
    <ol id="chatlog"></ol>
    <form id="chatform" hidden>
      <textarea id="chatin" rows="3" placeholder="${L2("例如：這個地號的分區可以蓋什麼？","e.g. What can be built in this zone?")}" aria-label="${L2("訊息","Message")}"></textarea>
      <button class="btn" id="chatsend" type="submit">${L2("送出","Send")}</button>
    </form>
    <div class="src">${L2("Claude 可能會出錯，重要資訊請以官方資料為準。","Claude can make mistakes. Check important facts against official sources.")}</div>
  </div>`;
  side.insertBefore(pane, side.querySelector(":scope > .foot"));
  const $c=id=>document.getElementById(id);
  $c("chatkeyform").onsubmit=e=>{e.preventDefault(); const v=$c("chatkey").value.trim(); if(!v) return;
    CHAT.key=v; CHAT.client=null; try{localStorage.setItem(CHAT_KEY_STORE,v);}catch(err){} $c("chatkey").value=""; chatRenderKey(); $c("chatin").focus();};
  $c("chatkeychg").onclick=()=>{ $c("chatkeybox").hidden=false; $c("chatkey").focus(); };
  $c("chatkeydel").onclick=()=>{ CHAT.key=""; CHAT.client=null; try{localStorage.removeItem(CHAT_KEY_STORE);}catch(err){} chatRenderKey(); };
  $c("chatclear").onclick=()=>{ CHAT.history=[]; $c("chatlog").innerHTML=""; };
  $c("chatform").onsubmit=e=>{e.preventDefault(); const t=$c("chatin").value; $c("chatin").value=""; chatSend(t);};
  $c("chatin").onkeydown=e=>{ if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){ e.preventDefault(); $c("chatform").requestSubmit(); } };
  chatRenderKey();
  return pane;
}
(()=>{
  const pane=buildChatPane(), $c=id=>document.getElementById(id);
  if(APP==="arch"){
    const tc=document.createElement("button"); tc.type="button"; tc.setAttribute("role","tab"); tc.id="tabC"; tc.setAttribute("aria-selected","false"); tc.textContent="Claude";
    document.querySelector("#side .tabs").appendChild(tc);
    tc.onclick=()=>window._archTab("C");
  } else {
    // 地熱地圖原本沒有分頁：加一列「地熱資料／Claude」
    const tabs=document.createElement("div"); tabs.className="tabs"; tabs.setAttribute("role","tablist");
    tabs.innerHTML=`<button type="button" role="tab" id="tabG" aria-selected="true">${L2("地熱資料","Geothermal data")}</button><button type="button" role="tab" id="tabC" aria-selected="false">Claude</button>`;
    const gp=document.querySelector("#side .geopane"); gp.parentNode.insertBefore(tabs,gp);
    const set=c=>{ $c("tabG").setAttribute("aria-selected",!c); $c("tabC").setAttribute("aria-selected",c); gp.hidden=c; pane.hidden=!c; if(c) sheet("full"); };
    $c("tabG").onclick=()=>set(false); $c("tabC").onclick=()=>set(true);
  }
})();

// ---------- 手機版底部拉板：拖曳或點把手切換 收合／半開／全開 ----------
(()=>{
  const side=document.getElementById("side"), body=document.body, lay=document.getElementById("layers");
  const grab=document.createElement("div");
  grab.id="grab"; grab.tabIndex=0; grab.setAttribute("role","button");
  grab.setAttribute("aria-label",L2("展開或收合面板","Expand or collapse the panel"));
  grab.innerHTML="<span></span>"; side.prepend(grab);
  const order=["peek","half","full"];
  const next=()=>sheet(order[(order.indexOf(body.dataset.sheet)+1)%order.length]);
  grab.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();next();}};
  let y0=null,h0=0,moved=false;
  grab.addEventListener("pointerdown",e=>{
    if(!MOBILE.matches) return;
    y0=e.clientY; h0=side.getBoundingClientRect().height; moved=false;
    grab.setPointerCapture(e.pointerId); side.style.transition="none";
  });
  grab.addEventListener("pointermove",e=>{
    if(y0===null) return;
    const dy=y0-e.clientY; if(Math.abs(dy)>6) moved=true;
    if(moved) side.style.height=Math.max(90,Math.min(innerHeight-40,h0+dy))+"px";
  });
  const end=()=>{
    if(y0===null) return;
    const h=side.getBoundingClientRect().height; y0=null;
    side.style.transition=""; side.style.height="";
    if(!moved){next();return;}
    sheet(h<innerHeight*.3?"peek":h<innerHeight*.72?"half":"full");
  };
  grab.addEventListener("pointerup",end); grab.addEventListener("pointercancel",end);
  // 收合時點標題區也能展開（連結和按鈕照常運作）
  side.querySelector(".titleblock").addEventListener("click",e=>{
    if(body.dataset.sheet==="peek"&&!e.target.closest("a,button")) sheet("half");
  });
  // 打字時鍵盤會擋住下半部，直接全開
  side.addEventListener("focusin",e=>{ if(e.target.matches('input[type="search"],input[type="text"]')) sheet("full"); });
  // 分頁、地區、資料勾選放在拉板裡，切換時至少半開
  side.addEventListener("change",e=>{ if(body.dataset.sheet==="peek"&&e.target.matches("select")) sheet("half"); });
  document.querySelectorAll(".tabs button").forEach(b=>b.addEventListener("click",()=>{ if(body.dataset.sheet==="peek") sheet("half"); }));
  // 圖層面板在手機上預設收合，點地圖時也自動收起
  const fold=()=>{ if(MOBILE.matches&&!lay.classList.contains("min")) document.getElementById("lmin").click(); };
  fold(); map.on("click",fold);
  map.on("popupopen",()=>document.body.classList.add("popup-on")).on("popupclose",()=>document.body.classList.remove("popup-on"));
  side.addEventListener("transitionend",e=>{ if(e.propertyName==="height") map.invalidateSize(); });
  MOBILE.addEventListener("change",()=>{ fold(); setTimeout(()=>map.invalidateSize(),60); });
})();
