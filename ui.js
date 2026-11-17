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
