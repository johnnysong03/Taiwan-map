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
  "地形陰影":"Hillshade","等高線":"Contours","地質敏感區（山崩與地滑）":"Geologically sensitive (landslide)","土壤液化潛勢":"Soil liquefaction potential","鄉鎮區界":"Township boundaries",
  // 色調
  "泛黃古地圖":"Antique map","朱墨官圖":"Cinnabar survey","青花藍曬":"Blueprint","水墨素描":"Ink sketch","夜燈":"Night","海軍藍":"Navy",
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
const OVERS = APP==="arch" ? {
  "公有土地地籍圖": nlsc("LAND_OPENDATA",OP),
  "地段外圍圖（段籍圖）": nlsc("LANDSECT",OP),
  "分棟建物框": nlsc("BUILDX",OP),
  "國土利用現況調查": nlsc("LUIMAP",OP),
  "村里界": nlsc("Village",OP),
} : {
  "地形陰影": nlsc("MOI_HILLSHADE",Object.assign({maxNativeZoom:16},OP)),
  "等高線": nlsc("MOI_CONTOUR_2",OP),
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

Object.assign(L.Popup.prototype.options,{maxHeight:300,minWidth:270,maxWidth:360,autoPanPaddingTopLeft:L.point(30,30),autoPanPaddingBottomRight:L.point(innerWidth>760?280:20,40)});
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
  name:"名稱",elevation:"井口高程（m）",total_depth:"鑽探深度（m）",vertical_depth:"垂直深度（m）",start_date:"開鑽日期",end_date:"完鑽日期",note:"備註",
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
  name:"Name",elevation:"Wellhead elevation (m)",total_depth:"Drilled depth (m)",vertical_depth:"Vertical depth (m)",start_date:"Spud date",end_date:"Completion date",note:"Note",
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
function propTable(p,key){
  const water=isWaterSet(key);
  const rows=Object.keys(p).filter(k=>!SKIP.has(k)&&p[k]!==null&&p[k]!==""&&p[k]!==undefined).map(k=>{
    const unit=water&&MGL.has(k)?" mg/L":DEGC.has(k)?" °C":"";
    const v=fmtV(p[k]), num=typeof v==="number"||!isNaN(+String(v).replace(/,/g,""));return `<tr><td>${(EN?GLAB_EN[k]:GLAB[k])||k}</td><td${num?" class=\"n\"":""}>${v}${num?unit:""}</td></tr>`;});
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
  fissure:["裂隙調查","#b03a2e"],dating:["定年","#8e5a2b"],iso:["同位素","#8e44ad"],gas:["氣體分析","#16a085"],temp:["地溫計","#e67e22"],water:["水質","#2e86c1"],pt:["資料點","#555"]};
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
const geoOn={};
function makeGeoLayer(c,fc){
  const k=c.kind, title=f=>{const p=f.properties;return p.Site||p.sitename||p.name||p.Survey_Place||p.SiteNo||p.siteid||p.No||p.Hole_No||p.SLine_ID||p.sectionName||c.name;};
  const meta=`${T(c.region)}・${c.name}`;
  const bind=(f,l)=>l.bindPopup(()=>{const ll=l.getLatLng?l.getLatLng():l.getBounds().getCenter();
    if(k==="kwell") return pop(hesc(title(f)),meta,kwellBody(f.properties)+
      `<div style="margin-top:6px"><a href="${earthUrl(ll.lat,ll.lng,1500)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div>`,KMZ_SRC);
    return pop(k==="gm"?(f.properties.rockname||c.name):title(f),meta,propTable(f.properties,c.key)+
      `<div style="margin-top:6px"><a href="${earthUrl(ll.lat,ll.lng,l.getLatLng?1500:6000)}" target="_blank" rel="noopener">${L2("在 Google Earth 開啟這裡","Open here in Google Earth")}</a></div>`);});
  if(k==="gm") return L.geoJSON(fc,{pane:"geofill",style:f=>({color:"#5a4632",weight:.6,fillColor:rockColor(f.properties),fillOpacity:.5}),onEachFeature:bind});
  if(k==="line"||k==="section") return L.geoJSON(fc,{pane:"geo",style:k==="line"?{color:"#7b3f9e",weight:1.5,opacity:.85}:{color:"#2c3e50",weight:2.5,dashArray:"8 4"},onEachFeature:bind});
  return L.geoJSON(fc,{
    pointToLayer:(f,ll)=>{const p=f.properties;
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
  if(on.some(c=>c.kind==="water")) parts.push(`<div class="row">${L2("水質 pH：","Water pH: ")}${[["<3","#c0392b"],["3–5","#e67e22"],["5–7","#d4ac0d"],["≥7","#2e86c1"]].map(([t,c])=>`<span><span class="k" style="background:${c};border-radius:50%"></span>${t}</span>`).join("")}</div>`);
  if(on.some(c=>c.key==="geo_tatun-gm")) parts.push(`<div class="row">${L2("大屯地質：","Tatun geology: ")}${[[L2("大屯山火成岩","Tatun volcanics"),"hsl(15 55% 62%)"],[L2("觀音山火成岩","Kuanyin volcanics"),"hsl(290 55% 62%)"],[L2("沉積岩","Sedimentary"),"hsl(70 45% 65%)"]].map(([t,c])=>`<span><span class="k" style="background:${c}"></span>${t}</span>`).join("")}</div>`);
  if(on.some(c=>c.key==="kmz_jieyuan")) parts.push(`<div class="row">${L2("結元公司鑽井：","Jieyuan wells: ")}${KWELL_TYPES.map(([c,z,e])=>`<span><span class="k" style="background:${c};transform:rotate(45deg) scale(.8)"></span>${L2(z,e)}</span>`).join("")}</div>`);
  if(on.length) parts.push(`<div class="row">${L2(`已開啟 ${on.length} 個圖層`,`${on.length} layer${on.length>1?"s":""} on`)} <button type="button" class="btn" id="geooff" style="padding:2px 10px;font-size:12px">${L2("全部關閉","Turn all off")}</button></div><div class="src">${L2("水化學濃度單位為 mg/L，地溫計與水溫為 °C。","Water chemistry concentrations are in mg/L; geothermometers and water temperature in °C.")}</div>`);
  lg.innerHTML=parts.join(""); lg.hidden=!parts.length;
  const off=document.getElementById("geooff"); if(off) off.onclick=()=>{GEO_CAT.forEach(c=>{if(geoOn[c.key]){map.removeLayer(c.layer);geoOn[c.key]=false;}});renderGeoChecks();geoLegend();};
}
async function toggleGeo(c,on,box){
  if(!on){ if(c.layer) map.removeLayer(c.layer); geoOn[c.key]=false; geoLegend(); return; }
  box.disabled=true;
  try{ const fc=await loadSet(c.key); c.layer??=makeGeoLayer(c,fc); }
  catch(e){ box.checked=false; box.disabled=false; const lg=document.getElementById("geolegend"); lg.hidden=false;
    lg.innerHTML=`<div class="src">${L2(`找不到 geotex/${c.key}.js，請確認 geotex 資料夾和這個網頁放在一起。`,`Cannot find geotex/${c.key}.js. Keep the geotex folder next to this page.`)}</div>`; return; }
  box.disabled=false; c.layer.addTo(map); geoOn[c.key]=true; geoLegend();
  const b=c.layer.getBounds?.(); if(b&&b.isValid()&&!map.getBounds().intersects(b)) map.flyToBounds(b,{paddingBottomRight:[innerWidth>760?280:20,20],maxZoom:13,duration:.7});
}
const regSel=document.createElement("select"); regSel.id="georegion"; regSel.setAttribute("aria-label","地熱調查地區");
const regions=[...new Set(GEO_CAT.map(c=>c.region))].sort((a,b)=>(a==="全臺"?-1:b==="全臺"?1:0)||(REGION_VIEW[b]?.[0]??0)-(REGION_VIEW[a]?.[0]??0));
regions.forEach(r=>{const k=GEO_CAT.filter(c=>c.region===r).length;regSel.add(new Option(EN?`${T(r)} (${k} datasets)`:`${r}（${k} 組）`,r));});
regSel.value="大屯山區";
regSel.onchange=()=>{renderGeoChecks();const v=REGION_VIEW[regSel.value];if(v)map.flyTo([v[0],v[1]],v[2],{duration:.7});};
document.getElementById("geochecks").before(regSel);
function renderGeoChecks(){
  const box=document.getElementById("geochecks"); box.innerHTML="";
  GEO_CAT.filter(c=>c.region===regSel.value).sort((a,b)=>Object.keys(KIND).indexOf(a.kind)-Object.keys(KIND).indexOf(b.kind)).forEach(c=>{
    const lab=document.createElement("label"), id="gx_"+c.key;
    lab.innerHTML=`<input type="checkbox" id="${id}" ${geoOn[c.key]?"checked":""}> <span class="sw" style="background:${KIND[c.kind][1]}${c.kind==="gm"?";border-radius:2px":""}"></span>${c.name}<span class="count" style="margin-left:auto;padding-left:6px">${c.n}</span>`;
    const cb=lab.querySelector("input"); cb.onchange=()=>toggleGeo(c,cb.checked,cb); box.appendChild(lab);
  });
}
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
  const folders=on.map(c=>{const fc=window.GEOTEX_D[c.key], col=kcolor(KIND[c.kind][1]);
    const style=`<Style id="s_${c.key}"><IconStyle><color>${col}</color><scale>0.8</scale><Icon><href>http://maps.google.com/mapfiles/kml/shapes/shaded_dot.png</href></Icon></IconStyle><LineStyle><color>${col}</color><width>2</width></LineStyle><PolyStyle><color>66${col.slice(2)}</color></PolyStyle></Style>`;
    const pms=fc.features.map(f=>{const p=f.properties||{};
      const nm=p.rockname||p.Site||p.sitename||p.name||p.SiteNo||p.siteid||p.No||p.Hole_No||p.SLine_ID||p.sectionName||c.name;
      const desc=c.kind==="kwell"?kwellBody(p):propTable(p,c.key);
      return `<Placemark><name>${xesc(nm)}</name><styleUrl>#s_${c.key}</styleUrl><description><![CDATA[${desc}]]></description>${kgeom(f.geometry)}</Placemark>`;}).join("\n");
    return `<Folder><name>${xesc(c.region+"・"+c.name)}</name>${style}\n${pms}</Folder>`;}).join("\n");
  const kml=`<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>臺灣地熱地圖匯出</name><description>${xesc(GEO_SRC)}</description>\n${folders}\n</Document></kml>`;
  const url=URL.createObjectURL(new Blob([kml],{type:"application/vnd.google-earth.kml+xml"}));
  const a=document.createElement("a"); a.href=url; a.download=`臺灣地熱地圖_${on.length}個圖層.kml`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}
const kmlBtn=document.getElementById("kmlbtn"); if(kmlBtn) kmlBtn.onclick=exportKML;
const _geoLegend=geoLegend;
geoLegend=function(){_geoLegend(); if(kmlBtn){const n=GEO_CAT.filter(c=>geoOn[c.key]).length; kmlBtn.disabled=!n; kmlBtn.textContent=n?L2(`匯出 KML（${n} 個圖層）`,`Export KML (${n} layer${n>1?"s":""})`):L2("匯出 KML（先勾選圖層）","Export KML (select layers first)");}};
geoLegend();

if(!GEO_CAT.length){document.getElementById("geochecks").innerHTML='<div class="src">找不到 geotex/catalog.js，地熱資料無法顯示。</div>';} else renderGeoChecks();

}

// ---------- 色調 ----------
const TONES=[
  {k:"",name:"泛黃古地圖",a:"#ead9b4",b:"#5a3d20"},
  {k:"cinnabar",name:"朱墨官圖",a:"#efe3c8",b:"#c0392b"},
  {k:"indigo",name:"青花藍曬",a:"#dfe4e6",b:"#1f4e8c"},
  {k:"ink",name:"水墨素描",a:"#ecebe4",b:"#2a2a28"},
  {k:"night",name:"夜燈",a:"#1b1914",b:"#e0a650"},
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
    map.removeLayer(base); if(!map.hasLayer(vec)) vec.addTo(map);
  } else if(vec&&map.hasLayer(vec)) map.removeLayer(vec);
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
setTone(TONES.some(t=>t.k===savedTone)?savedTone:"");

if(APP==="arch"){
// ---------- 地號查詢 ----------
const LQ = {mode:false, loaded:null, sect:"", pin:null};
const $ = id => document.getElementById(id);
function setTab(l){
  LQ.mode=l; $("tabB").setAttribute("aria-selected",!l); $("tabL").setAttribute("aria-selected",l);
  $("paneB").hidden=l; $("footB").hidden=l; $("paneL").hidden=!l;
  map.getContainer().style.cursor=l?"crosshair":"";
  if(l){ loadPub(); const cb=$("o0"); if(!cb.checked) cb.click(); }
}
$("tabB").onclick=()=>setTab(false); $("tabL").onclick=()=>setTab(true);

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

map.on("click", async e=>{
  if(!LQ.mode) return;
  const {lat,lng}=e.latlng;
  if(LQ.pin) LQ.pin.setLatLng(e.latlng); else LQ.pin=L.marker(e.latlng,{icon:L.divIcon({className:"",iconSize:[14,14],html:'<div class="clickpin"></div>'}),interactive:false}).addTo(map);
  const info=$("sectinfo"); info.hidden=false; sheet("half"); info.innerHTML=`<div class="m">${L2("查詢地段中…","Looking up the land section…")}</div>`;
  try{
    await loadPub();
    const xml=await fetch(`https://api.nlsc.gov.tw/other/TownVillagePointQuery/${lng.toFixed(6)}/${lat.toFixed(6)}`).then(r=>r.text());
    const d=new DOMParser().parseFromString(xml,"text/xml"), g=t=>d.querySelector(t)?.textContent||"";
    if(!g("sectCode")){info.innerHTML=`<div class="m">${L2("這個位置查不到地段，可能在河川或未登記地。","No land section here. It may be a river or unregistered land.")}</div>`;return;}
    if(g("ctyName")!=="臺北市"){info.innerHTML=`<div class="t">${g("sectName")}</div><div class="m">${g("ctyName")}${g("townName")}${L2("：公有地清冊只涵蓋臺北市。",": the public land register covers Taipei City only.")}</div>`;showSect("");return;}
    info.innerHTML=`<div class="t">${g("sectName")}</div><div class="m">${g("ctyName")}${g("townName")}・${g("villageName")}・${g("officeName")}${L2("地政事務所・段代碼 ","Land Office · section code ")}${g("sectCode")}<br>TWD97 ${fmtTM2(lat,lng)}</div>`;
    showSect(g("sectCode"));
    if(map.getZoom()<17) map.setView(e.latlng,17);
  }catch(err){ info.innerHTML=`<div class="m">${L2("地段查詢失敗，請確認網路連線後再點一次。","Land section lookup failed. Check your connection and click again.")}</div>`; }
});

}

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
  side.addEventListener("transitionend",e=>{ if(e.propertyName==="height") map.invalidateSize(); });
  MOBILE.addEventListener("change",()=>{ fold(); setTimeout(()=>map.invalidateSize(),60); });
})();
