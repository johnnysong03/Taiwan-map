// ---------- 介面整理（ui.js）：在 app.js 之後載入，只整理版面與操作，不改各圖層本身 ----------
// A：左側區塊可收合、搜尋圖層、「已開啟」標籤列；右側圖層面板各區塊可收合
// B：手機版把右上「圖層」面板的內容搬進底部拉板的「圖層」「工具」分頁
// C：網址記錄畫面（位置、縮放、底圖、調查地區、開啟的圖層），可直接分享；也記住上次的畫面
(()=>{
const $=id=>document.getElementById(id);
const hesc=s=>String(s??"").replace(/[<>&"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[ch]));
const store={get:k=>{try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const side=$("side"), layers=$("layers");
const isGeo=APP==="geo", G=window._geo||{};

// ---------- 共用：圖層開關清單 ----------
// 所有有 id 的勾選框（左側與右側圖層面板），不含「一組全開」的總開關
const labelText=lab=>{ if(!lab) return ""; const c=lab.cloneNode(true); c.querySelectorAll("input,select,.count,svg,.wsym,.sw,i").forEach(e=>e.remove()); return c.textContent.replace(/\s+/g," ").trim(); };
const groupOf=el=>{
  const d=el.closest("details.lgrp"); if(d) return d.querySelector("summary")?.textContent.trim()||"";
  const s=el.closest("details.usec"); if(s) return s.querySelector("summary .ut")?.textContent.trim()||"";
  const f=el.closest("fieldset"); if(f) return f.querySelector("legend")?.textContent.trim()||"";
  return ""; };
function toggles(){
  const out=[], seen=new Set();
  document.querySelectorAll('#side input[type=checkbox][id], #layers input[type=checkbox][id], #uiLay input[type=checkbox][id], #uiTool input[type=checkbox][id]').forEach(i=>{
    if(seen.has(i.id)||i.closest("#uisearch,#uichips")) return; seen.add(i.id);
    const lab=i.closest("label"); out.push({id:i.id,name:labelText(lab)||i.id,group:groupOf(i),el:i});
  });
  // 地熱地圖：其他調查地區的資料（目前沒列在畫面上）
  if(isGeo&&G.GEO_CAT) G.GEO_CAT.filter(c=>!c.well&&!seen.has("gx_"+c.key)).forEach(c=>{
    out.push({id:"gx_"+c.key,name:c.name,group:L2("調查地區・","Survey area · ")+T(c.region),region:c.region,el:null});});
  return out;
}
const isOn=t=>t.el?t.el.checked:!!G.geoOn?.[t.id.slice(3)];
// 打開或關閉一個圖層：不在畫面上的調查地區資料先切換地區
function setToggle(t,on){
  let el=t.el||$(t.id);
  if(!el&&t.region&&G.regSel){ G.regSel.value=t.region; G.renderGeoChecks(); el=$(t.id); openSec(el); }
  if(el&&on&&!restoring) openSec(el);
  if(el&&el.checked!==on) el.click();
}

// ---------- A：左側區塊改成可收合 ----------
const FOLD_KEY="ui-fold-"+APP, fold=store.get(FOLD_KEY)||{};
const badge=sec=>{ const n=[...sec.querySelectorAll("input[type=checkbox][id]:checked")].length; const b=sec.querySelector(":scope>summary .ub"); if(b){b.textContent=n?n:"";b.hidden=!n;} };
function makeSec(title,key,nodes,parent,before){
  const d=document.createElement("details"); d.className="usec"; d.dataset.k=key;
  d.innerHTML=`<summary><span class="ut">${title}</span><span class="ub" hidden></span></summary>`;
  const body=document.createElement("div"); body.className="ubody"; nodes.forEach(n=>body.appendChild(n)); d.appendChild(body);
  parent.insertBefore(d,before);
  d.addEventListener("toggle",()=>{ fold[key]=d.open; store.set(FOLD_KEY,fold); });
  return d;
}
function openSec(el){ let d=el?.closest("details"); while(d){ d.open=true; d=d.parentElement?.closest("details"); } el?.closest("fieldset.ufold")?.classList.remove("closed"); }
const secs=[];
if(isGeo&&$("geoset")){
  const gs=$("geoset"); let cur=null;
  [...gs.children].forEach(ch=>{
    if(ch.classList.contains("label")){ cur={title:ch.innerHTML,key:ch.dataset.en||ch.textContent,head:ch,nodes:[]}; secs.push(cur); return; }
    if(ch.id==="kmlbtn"||ch.classList.contains("ghint")){ cur=null; return; }
    if(cur) cur.nodes.push(ch);
  });
  secs.forEach((s,i)=>{ const d=makeSec(s.title,s.key,s.nodes,gs,s.head); s.head.remove(); s.el=d;
    const hasOn=!!d.querySelector("input[type=checkbox]:checked");
    d.open=fold[s.key]??(i===0||hasOn); });
}
// 右側圖層面板：每個區塊點標題可收合（底圖、疊加圖資預設展開）
const FS_OPEN=["toneset","bases","overs"];
document.querySelectorAll("#layers > fieldset").forEach(fs=>{
  const lg=fs.querySelector(":scope>legend"); if(!lg) return;
  fs.classList.add("ufold"); const k="fs:"+fs.id;
  const closed=fold[k]??!FS_OPEN.includes(fs.id);
  if(closed&&!fs.querySelector("input[type=checkbox]:checked")) fs.classList.add("closed");
  lg.tabIndex=0; lg.setAttribute("role","button");
  const tog=()=>{ fs.classList.toggle("closed"); fold[k]=fs.classList.contains("closed"); store.set(FOLD_KEY,fold); };
  lg.addEventListener("click",tog); lg.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){e.preventDefault();tog();} });
});

// ---------- A：搜尋圖層＋已開啟標籤 ----------
const top=document.createElement("div"); top.id="uitop";
top.innerHTML=`<div id="uisearch"><input type="search" id="uiq" placeholder="${L2("搜尋圖層…（例如：饋線、斷層、溫泉）","Search layers… (e.g. feeder, fault)")}" aria-label="${L2("搜尋圖層","Search layers")}" autocomplete="off"><div id="uires" hidden></div></div>
  <div id="uichips" hidden><div class="uchl"></div><div class="uchb"><button type="button" class="linkbtn" id="uishare">${L2("複製分享連結","Copy share link")}</button><button type="button" class="linkbtn" id="uioff">${L2("全部關閉","Turn all off")}</button></div></div>`;
const host=isGeo?document.querySelector("#side .geopane"):null;
if(host) host.prepend(top);
const q=$("uiq"), res=$("uires");
const norm=s=>s.toLowerCase().replace(/[\s（）()・·\-_／/]/g,"");
function renderRes(){
  if(!q) return;
  const v=norm(q.value); if(!v){ res.hidden=true; res.innerHTML=""; return; }
  const hits=toggles().filter(t=>norm(t.name+" "+t.group).includes(v)).slice(0,40);
  res.innerHTML=hits.length?hits.map((t,i)=>`<label class="ures"><input type="checkbox" data-i="${i}" ${isOn(t)?"checked":""}> <span>${hesc(t.name)}</span><small>${hesc(t.group)}</small></label>`).join("")
    :`<div class="src">${L2("沒有符合的圖層。","No matching layers.")}</div>`;
  res.querySelectorAll("input").forEach(cb=>cb.onchange=()=>{ setToggle(hits[+cb.dataset.i],cb.checked); setTimeout(refresh,50); });
  res.hidden=false;
}
if(host){ q.addEventListener("input",renderRes); q.addEventListener("keydown",e=>{ if(e.key==="Escape"){q.value="";renderRes();} }); }
const chipsBox=$("uichips");
function renderChips(){
  if(!chipsBox) return;
  const on=toggles().filter(isOn), list=chipsBox.querySelector(".uchl");
  chipsBox.hidden=!on.length;
  list.innerHTML=on.map((t,i)=>`<button type="button" class="uchip" data-i="${i}" title="${L2("點一下關閉","Tap to turn off")}">${hesc(t.name)}<span aria-hidden="true">×</span></button>`).join("");
  list.querySelectorAll(".uchip").forEach(b=>b.onclick=()=>{ setToggle(on[+b.dataset.i],false); setTimeout(refresh,50); });
  const off=$("uioff"); if(off) off.onclick=()=>{ on.forEach(t=>setToggle(t,false)); setTimeout(refresh,50); };
}
function refresh(){ secs.forEach(s=>badge(s.el)); renderChips(); if(res&&!res.hidden) renderRes(); saveState(); }
let rt=0; const later=()=>{ clearTimeout(rt); rt=setTimeout(refresh,120); };
document.addEventListener("change",e=>{ if(e.target.closest("#uires")) return; later(); },true);

// ---------- B：手機版把圖層面板搬進底部拉板 ----------
const tabs=document.querySelector("#side .tabs");
if(tabs&&layers){
  const TOOL=["shotset","measset","impset","markset","truckset"];
  const mk=(id)=>{ const d=document.createElement("div"); d.id=id; d.className="controls upane"; d.hidden=true; side.insertBefore(d,tabs.nextSibling); return d; };
  const pT=mk("uiTool"), pL=mk("uiLay");   // 順序：圖層在前、工具在後
  const bt=(id,zh,en)=>{ const b=document.createElement("button"); b.type="button"; b.setAttribute("role","tab"); b.id=id; b.className="utab"; b.setAttribute("aria-selected","false"); b.textContent=L2(zh,en); return b; };
  const tL=bt("tabUL","圖層","Layers"), tT=bt("tabUT","工具","Tools");
  const first=tabs.querySelector("button"), cTab=tabs.querySelector("#tabC");
  if(cTab) cTab.before(tL,tT); else tabs.append(tL,tT);
  const orig=[...layers.children].filter(n=>n.tagName!=="H2");
  let hid=[];
  const restore=()=>{ hid.forEach(n=>n.hidden=false); hid=[]; pL.hidden=pT.hidden=true; tL.setAttribute("aria-selected","false"); tT.setAttribute("aria-selected","false"); };
  const show=p=>{
    if(!hid.length) [...side.children].forEach(n=>{ if(n===p||n===pL||n===pT||n.id==="grab"||n.classList.contains("titleblock")||n.classList.contains("tabs")||n.hidden) return; n.hidden=true; hid.push(n); });
    pL.hidden=p!==pL; pT.hidden=p!==pT;
    tabs.querySelectorAll("button").forEach(b=>b.setAttribute("aria-selected",String((b===tL&&p===pL)||(b===tT&&p===pT))));
    if(document.body.dataset.sheet==="peek") sheet("half");
  };
  tL.onclick=()=>show(pL); tT.onclick=()=>show(pT);
  tabs.addEventListener("click",e=>{ const b=e.target.closest("button"); if(b&&b!==tL&&b!==tT) restore(); },true);
  const place=()=>{
    if(MOBILE.matches){ orig.forEach(n=>(TOOL.includes(n.id)?pT:pL).appendChild(n)); }
    else{ if(!pL.hidden||!pT.hidden){ restore(); first.click(); } orig.forEach(n=>layers.appendChild(n)); }
  };
  place(); MOBILE.addEventListener("change",place);
}

// ---------- C：網址與上次狀態 ----------
const LAST_KEY="ui-last-"+APP;
let restoring=false, st=0;
function getState(){
  const c=map.getCenter(), s={v:[+c.lat.toFixed(5),+c.lng.toFixed(5),+map.getZoom().toFixed(2)]};
  const b=document.querySelector('input[name=base]:checked'); if(b) s.b=b.id;
  if(isGeo&&G.regSel) s.r=G.regSel.value;
  s.on=toggles().filter(isOn).map(t=>t.id);
  const op=$("opacity"); if(op&&op.value!==op.defaultValue) s.o=op.value;
  return s;
}
const enc=s=>"#@"+s.v.join(",")+(s.b?"&b="+s.b:"")+(s.r?"&r="+encodeURIComponent(s.r):"")+(s.on.length?"&on="+s.on.map(encodeURIComponent).join(","):"")+(s.o?"&o="+s.o:"");
function dec(h){
  const m=/^#@(-?[\d.]+),(-?[\d.]+),([\d.]+)(.*)$/.exec(h||""); if(!m) return null;
  const s={v:[+m[1],+m[2],+m[3]],on:[]}; new URLSearchParams(m[4].replace(/^&/,"")).forEach((v,k)=>{ if(k==="on") s.on=v.split(",").filter(Boolean); else s[k]=v; });
  return s;
}
function saveState(){ if(restoring) return; clearTimeout(st); st=setTimeout(()=>{ const s=getState(); history.replaceState(null,"",enc(s)); store.set(LAST_KEY,s); },300); }
async function applyState(s){
  restoring=true;
  try{
    if(s.b){ const b=$(s.b); if(b&&!b.checked) b.click(); }
    if(s.o){ const op=$("opacity"); if(op){ op.value=s.o; op.dispatchEvent(new Event("input")); } }
    map.setView([s.v[0],s.v[1]],s.v[2],{animate:false});
    const all=toggles();
    for(const id of s.on){ const t=all.find(x=>x.id===id); if(!t) continue; openSec(t.el); setToggle(t,true); }
    if(isGeo&&s.r&&G.regSel&&G.regSel.value!==s.r){ G.regSel.value=s.r; G.renderGeoChecks(); }
    await new Promise(r=>setTimeout(r,1200));
    map.setView([s.v[0],s.v[1]],s.v[2],{animate:false});   // 圖層載入時可能會自動移到資料範圍，還原成分享時的畫面
  }finally{ restoring=false; refresh(); }
}
map.on("moveend",saveState);
const share=$("uishare");
if(share) share.onclick=async()=>{ const s=getState(); const url=location.href.split("#")[0]+enc(s);
  try{ await navigator.clipboard.writeText(url); share.textContent=L2("已複製連結","Link copied"); }
  catch(e){ prompt(L2("複製這個連結：","Copy this link:"),url); }
  setTimeout(()=>share.textContent=L2("複製分享連結","Copy share link"),2000); };
const init=dec(location.hash)||store.get(LAST_KEY);
if(init&&init.v) applyState(init); else refresh();
window._ui={toggles,getState,applyState,refresh};
})();

// ---------- D：找地點（鄉鎮、村里、案場、井、鑽孔、饋線代號、座標）＋定位我的位置 ----------
(()=>{
if(APP!=="geo") return;
const hesc=s=>String(s??"").replace(/[<>&"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[ch]));
let IDX=null, pin=null, acc=null;
const loadIdx=()=>IDX??=new Promise((ok,fail)=>{ const s=document.createElement("script"); s.src="geotex/search-index.js";
  s.onload=()=>ok(window.SEARCH_INDEX); s.onerror=()=>{IDX=null;fail(new Error("load"));}; document.head.appendChild(s); });
const ctl=L.control({position:"topleft"});
ctl.onAdd=()=>{ const d=L.DomUtil.create("div","uifind");
  d.innerHTML=`<div class="ufrow"><input type="search" id="uifq" placeholder="${L2("找地點：鄉鎮、村里、案場、井、饋線代號、座標","Find: township, village, site, well, feeder, coordinates")}" aria-label="${L2("找地點","Find a place")}" autocomplete="off">
    <button type="button" id="uiloc" title="${L2("定位我的位置","Show my location")}" aria-label="${L2("定位我的位置","Show my location")}"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2"/></svg></button></div>
    <div id="uifr" hidden></div>`;
  L.DomEvent.disableClickPropagation(d); L.DomEvent.disableScrollPropagation(d); return d; };
ctl.addTo(map);
const q=document.getElementById("uifq"), out=document.getElementById("uifr");
const norm=s=>String(s||"").toLowerCase().replace(/[\s・·\-_()（）]/g,"").replace(/台/g,"臺");
function local(){
  const D=window.GEOTEX_D||{}, r=[];
  Object.entries(D).forEach(([k,fc])=>{
    if(/^ea_/.test(k)) fc.features.forEach(f=>{ const p=f.properties, nm=p.info?.name?L2(p.info.name[0],p.info.name[1]):(p.project?`${p.company}（${p.project}）`:p.company);
      r.push({t:nm,s:`${L2("地熱案場","Geothermal site")}・${p.cat}・${p.county}${p.town}`,k:p.company+p.project+p.loc,ll:[f.geometry.coordinates[1],f.geometry.coordinates[0]],z:15,kind:"site"}); });
    else if(/^kmz_/.test(k)) fc.features.forEach(f=>r.push({t:f.properties.name,s:L2("井位（KMZ）","Well (KMZ)"),k:f.properties.name,ll:[f.geometry.coordinates[1],f.geometry.coordinates[0]],z:16,kind:"well"}));
    else if(k==="bh_logs") fc.features.forEach(f=>{ const p=f.properties; r.push({t:`${L2("鑽孔","Borehole")} ${p.hole}`,s:p.name||p.loc||"",k:p.hole+p.name+p.loc+p.proj,ll:[p.lat,p.lng],z:16,kind:"bh"}); });
  });
  return r;
}
function coordHit(v){
  const n=v.replace(/[，,]/g," ").trim().split(/\s+/).map(Number); if(n.length!==2||n.some(isNaN)) return null;
  let [a,b]=n;
  if(Math.abs(a)>1000&&Math.abs(b)>1000&&typeof fromTM2==="function"){ const [lat,lng]=a>b?fromTM2(b,a):fromTM2(a,b); return {t:`TWD97 ${a}, ${b}`,s:`${lat.toFixed(5)}, ${lng.toFixed(5)}`,ll:[lat,lng],z:16,kind:"xy"}; }
  if(a>100&&b<90) [a,b]=[b,a];
  if(a>=20&&a<=27&&b>=118&&b<=123) return {t:`${a}, ${b}`,s:L2("經緯度","Latitude, longitude"),ll:[a,b],z:16,kind:"xy"};
  return null;
}
let seq=0;
async function search(){
  const raw=q.value.trim(), v=norm(raw), my=++seq; if(!v){ out.hidden=true; return; }
  const hits=[]; const c=coordHit(raw); if(c) hits.push(c);
  const score=x=>{ const t=norm(x.t), k=norm(x.k||""); return t===v?0:t.startsWith(v)?1:t.includes(v)?2:k.includes(v)?3:9; };
  local().forEach(x=>{ const sc=score(x); if(sc<9) hits.push({...x,sc}); });
  let idx=null; try{ idx=await loadIdx(); }catch(e){}
  if(my!==seq) return;
  if(idx){
    idx.towns.forEach(([cty,tw,lng,lat])=>{ const x={t:tw,s:cty,k:cty+tw,ll:[lat,lng],z:13,kind:"town"}; const sc=Math.min(score(x),norm(cty+tw).includes(v)?2:9); if(sc<9) hits.push({...x,sc}); });
    if(v.length>=2) idx.villages.forEach(([cty,tw,vl,lng,lat])=>{ const x={t:vl,s:cty+tw,k:cty+tw+vl,ll:[lat,lng],z:15,kind:"vill"}; const sc=score(x); if(sc<9) hits.push({...x,sc:sc+.5}); });
    const up=raw.toUpperCase().replace(/\s/g,"");
    if(/^[A-Z0-9]{2,5}$/.test(up)) idx.feeders.forEach(([f,k,lng,lat])=>{ if(f.startsWith(up)) hits.push({t:f,s:L2("台電饋線・","Taipower feeder · ")+(window.FEEDER_META?.counties?.[k]?.name||k),ll:[lat,lng],z:14,kind:"feeder",sc:f===up?0:1}); });
  }
  hits.sort((a,b)=>(a.sc??0)-(b.sc??0)); const top=hits.slice(0,14);
  out.innerHTML=top.length?top.map((h,i)=>`<button type="button" class="ufh" data-i="${i}"><b>${hesc(h.t)}</b><small>${hesc(h.s)}</small></button>`).join("")+
    (idx?`<div class="src">${L2("鄉鎮村里：內政部 2021 版界線；饋線：台電開放資料，位置是變壓器的中間位置。","Townships/villages: MOI boundaries (2021); feeders: Taipower open data, placed at the middle of their transformers.")}</div>`:"")
    :`<div class="src">${L2("找不到。可以輸入鄉鎮、村里、案場公司、井號、饋線代號（例如 CX39），或座標「25.2, 121.6」、TWD97「310000 2790000」。","Nothing found. Try a township, village, site company, well, feeder code (e.g. CX39), or coordinates.")}</div>`;
  out.querySelectorAll(".ufh").forEach(b=>b.onclick=()=>go(top[+b.dataset.i]));
  out.hidden=false;
}
function mark(ll,label){
  if(pin) map.removeLayer(pin);
  pin=L.marker(ll,{icon:L.divIcon({className:"",iconSize:[22,22],iconAnchor:[11,11],html:'<div class="ufpin"></div>'}),interactive:false,zIndexOffset:1000})
    .bindTooltip(hesc(label),{permanent:true,direction:"top",offset:[0,-12],className:"uftip"}).addTo(map);
}
function go(h){
  out.hidden=true; q.blur();
  if(h.kind==="feeder"){ const fd=document.getElementById("fdon"); if(fd&&!fd.checked) fd.click(); }
  map.flyTo(h.ll,Math.max(h.z,Math.min(map.getZoom(),h.z+2)),{duration:.8});
  mark(h.ll,h.t);
  if(MOBILE.matches) sheet("peek");
}
let tm=0; q.addEventListener("input",()=>{ clearTimeout(tm); tm=setTimeout(search,180); });
q.addEventListener("focus",()=>{ loadIdx().catch(()=>{}); if(q.value.trim()) search(); });
q.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); out.querySelector(".ufh")?.click(); } if(e.key==="Escape"){ q.value=""; out.hidden=true; } });
map.on("click",()=>{ out.hidden=true; });
// 定位我的位置（瀏覽器會先問要不要分享位置；位置只在這個瀏覽器使用，不會送出）
document.getElementById("uiloc").onclick=()=>{
  if(!navigator.geolocation){ alert(L2("這個瀏覽器不支援定位。","Location is not supported in this browser.")); return; }
  const btn=document.getElementById("uiloc"); btn.classList.add("busy");
  navigator.geolocation.getCurrentPosition(p=>{ btn.classList.remove("busy");
    const ll=[p.coords.latitude,p.coords.longitude];
    if(acc) map.removeLayer(acc); acc=L.circle(ll,{radius:p.coords.accuracy,color:"#1e88e5",weight:1,fillOpacity:.08,interactive:false}).addTo(map);
    mark(ll,L2(`我的位置（誤差約 ${Math.round(p.coords.accuracy)} m）`,`My location (±${Math.round(p.coords.accuracy)} m)`));
    map.flyTo(ll,Math.max(map.getZoom(),15),{duration:.8}); },
  e=>{ btn.classList.remove("busy"); alert(e.code===1?L2("沒有定位權限。請在瀏覽器設定允許這個網站使用位置。","Location permission denied."):L2("暫時無法取得位置，請稍後再試。","Could not get your location. Try again later.")); },
  {enableHighAccuracy:true,timeout:15000,maximumAge:60000});
};
})();
