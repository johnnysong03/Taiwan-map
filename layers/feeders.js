// ---------- 台電饋線圖層（從 app.js 拆出；地熱地圖專用，在 app.js 之後、ui.js 之前載入） ----------
// 資料：geotex/feeders/（tools/build_feeders.py 產生）。用到 app.js 的全域 map、L2。
(()=>{
if(typeof APP==="undefined"||APP!=="geo") return;
const hesc=s=>String(s??"").replace(/[<>&"]/g,ch=>({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;"}[ch]));
// ---------- 台電饋線（可併網容量）：geotex/feeders/，由 tools/build_feeders.py 產生 ----------
// 官方只有「變壓器座標＋所屬饋線」與「饋線可併網容量」，沒有線路走向：縮小畫各饋線的服務範圍（變壓器外擴約 120 m），放大（zoom ≥ 14）畫變壓器點。
const FD=(()=>{
  const box=document.getElementById("feederbox"); if(!box||!window.FEEDER_META) return null;
  const M=window.FEEDER_META, PZ=14;
  const CLS=[[0,0,"#b2182b",L2("0（已無容量）","0 (none left)")],[0.001,999.99,"#ef6548","1–999"],[1000,2999.99,"#fdae61","1,000–2,999"],[3000,4999.99,"#a6d96a","3,000–4,999"],[5000,1e12,"#1a9850","≥ 5,000"]];
  const NOC="#9e9e9e", col=c=>c==null?NOC:(CLS.find(([a,b])=>c>=a&&c<=b)||CLS[4])[2];
  const upd=Object.values(M.counties).map(c=>c.updated).sort(), T0=M.totals, U0=upd[0], U1=upd[upd.length-1];
  const SRC=L2(`資料：台灣電力公司「全國各縣市再生能源可併網容量」開放資料（<a href="https://data.gov.tw/dataset/161874" target="_blank" rel="noopener">data.gov.tw 161874</a>，檔案日期 ${U0===U1?U0:U0+"～"+U1}）。`,
    `Data: Taipower open data on renewable grid-connection capacity (<a href="https://data.gov.tw/dataset/161874" target="_blank" rel="noopener">data.gov.tw 161874</a>, files dated ${U0===U1?U0:U0+" to "+U1}).`);
  const NOTE=L2(`台電只公開變壓器位置與所屬饋線，沒有線路走向。「推估線路」是把同一條饋線的變壓器以總長最短的方式連起來（超過 ${(M.maxEdge||2000)/1000} km 的連線不畫），「服務範圍」是變壓器外擴約 120 m，兩者都只是示意，不是實際架設的線路。變壓器座標由 TWD67 換算，台電圖資本身有偏移，僅供參考。可併網容量會變動，申請併網以台電公告為準。`,
    `Taipower publishes transformer locations and their feeders only, not line routes. "Estimated lines" join each feeder's transformers by the shortest total length (links over ${(M.maxEdge||2000)/1000} km omitted); "service areas" are about 120 m around transformers. Both are schematic, not actual lines. Coordinates converted from TWD67 and Taipower notes its own offsets. Capacity changes over time; Taipower's notice is authoritative.`);
  const fmtC=c=>c==null?L2("容量表未列","not in capacity table"):`${c.toLocaleString(undefined,{maximumFractionDigits:1})} kW`;
  const rd=L.canvas({pane:"geofill",padding:.3,tolerance:4}), areaG=L.layerGroup(), A={}, Ln={}, Tr={}, loading={};
  let mode="line", curKind="";
  const LZ=M.loZoom||12, LnLo={};   // 縮放 LZ 以下用簡化線路（約 1/4 大小），放大再換完整線路
  const load=(k,kind)=>loading[k+kind]??=new Promise((ok,fail)=>{const s=document.createElement("script");s.src=`geotex/feeders/${k}_${kind}.js`;s.onload=ok;s.onerror=fail;document.head.appendChild(s);});
  const inView=()=>{const b=map.getBounds();return Object.entries(M.counties).filter(([,c])=>b.intersects(L.latLngBounds([c.bbox[1],c.bbox[0]],[c.bbox[3],c.bbox[2]]))).map(([k])=>k);};
  const pop=(k,f,n)=>`<div class="geopop"><h4>${L2("饋線","Feeder")} ${hesc(f)}</h4><div class="m">${L2("台電饋線・","Taipower feeder · ")}${hesc(M.counties[k].name)}</div>`+
    `<table class="sitetab"><tr><td>${L2("可併網容量","Grid capacity left")}</td><td><b style="color:${col(Ax(k,f))}">${fmtC(Ax(k,f))}</b></td></tr>`+
    (n!=null?`<tr><td>${L2("變壓器數","Transformers")}</td><td>${n.toLocaleString()}</td></tr>`:"")+`<tr><td>${L2("資料日期","File date")}</td><td>${M.counties[k].updated}</td></tr></table>`+
    `<div class="m" style="margin-top:6px">${NOTE}</div><div class="src">${SRC}</div></div>`;
  const CAP={}; const Ax=(k,f)=>CAP[k]?.[f];
  let on=false, status=document.createElement("div"); status.className="src";
  const NN={};
  function mkLine(k,lo){ const key=lo?k+"@lo":k, d=window.FEEDER_L[key], per=d.feeders.map(()=>[]); CAP[k]??={}; NN[k]={};
    d.feeders.forEach((f,i)=>{CAP[k][f]=d.C[i]; NN[k][f]=d.N[i];});
    for(const [fi,a] of d.L){ let x=a[0],y=a[1]; const ll=[[y/1e5+21,x/1e5+119]]; for(let j=2;j<a.length;j+=2){x+=a[j];y+=a[j+1];ll.push([y/1e5+21,x/1e5+119]);} per[fi].push(ll); }
    const g=L.layerGroup(); per.forEach((ls,i)=>{ if(!ls.length) return; const f=d.feeders[i], c=d.C[i];
      g.addLayer(L.polyline(ls,{renderer:rd,color:col(c),weight:2,opacity:.9,smoothFactor:1.5}).bindPopup(()=>pop(k,f,NN[k][f]))); });
    delete window.FEEDER_L[key]; return g; }
  const kindNow=()=>mode==="line"?(map.getZoom()<LZ?"linelo":"line"):"area";
  async function refresh(){ if(!on) return; const ks=inView(), kind=kindNow(), S=kind==="line"?Ln:kind==="linelo"?LnLo:A, miss=ks.filter(k=>!S[k]);
    if(miss.length){ status.textContent=L2("載入饋線資料中…","Loading feeders…");
      try{ await Promise.all(miss.map(k=>load(k,kind))); }catch(e){ status.textContent=L2("饋線資料載入失敗，請確認 geotex/feeders 資料夾和網頁放在一起。","Could not load geotex/feeders."); return; } }
    if(kind!==kindNow()) return;
    for(const k of miss){ if(S[k]) continue;   // 同時有兩次 refresh 在等同一個檔時，只建一次
      if(kind!=="area"){ S[k]=mkLine(k,kind==="linelo"); continue; } const fc=window.FEEDER_A[k]; CAP[k]??={}; fc.features.forEach(f=>CAP[k][f.properties.f]=f.properties.c);
      A[k]=L.geoJSON(fc,{renderer:rd,style:f=>({color:col(f.properties.c),weight:.7,opacity:.8,fillColor:col(f.properties.c),fillOpacity:.3}),
        onEachFeature:(f,l)=>l.bindPopup(()=>pop(k,f.properties.f,f.properties.n))}); delete window.FEEDER_A[k]; }
    if(!on) return; if(curKind!==kind){ areaG.clearLayers(); curKind=kind; } ks.forEach(k=>{if(!areaG.hasLayer(S[k])) areaG.addLayer(S[k]);});
    if(map.getZoom()>=PZ){ const mt=ks.filter(k=>!Tr[k]); if(mt.length){ try{ await Promise.all(mt.map(k=>load(k,"tr"))); }catch(e){}
        mt.forEach(k=>{const d=window.FEEDER_T?.[k]; if(!d) return; const b=atob(d.b64),u=new Uint8Array(b.length); for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);
          const v=new DataView(u.buffer),n=u.length/10,t={n,feeders:d.feeders,lng:new Float64Array(n),lat:new Float64Array(n),fi:new Uint16Array(n)};
          for(let i=0;i<n;i++){t.lng[i]=v.getUint32(i*10,true)/1e6+119;t.lat[i]=v.getUint32(i*10+4,true)/1e6+21;t.fi[i]=v.getUint16(i*10+8,true);} Tr[k]=t; delete window.FEEDER_T[k];}); } }
    draw(); }
  // 變壓器點：畫布直接畫
  map.createPane("feedtr"); map.getPane("feedtr").style.zIndex=406; map.getPane("feedtr").style.pointerEvents="none";
  let cvs=null, hits=[];
  function draw(){ if(!cvs) return; const sz=map.getSize(), dpr=window.devicePixelRatio||1; cvs.width=sz.x*dpr; cvs.height=sz.y*dpr; cvs.style.width=sz.x+"px"; cvs.style.height=sz.y+"px";
    L.DomUtil.setPosition(cvs,map.containerPointToLayerPoint([0,0])); cvs.style.opacity=1; const g=cvs.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,sz.x,sz.y); hits=[];
    const z=map.getZoom(); let shown=0;
    [A,Ln,LnLo].forEach(S=>Object.values(S).forEach(g=>g.eachLayer(l=>{l.options.interactive=z<PZ;})));  // 放大看變壓器時，範圍面只顯示、不搶點擊
    if(!on||z<PZ){ status.textContent=on?(mode==="line"?L2(`顯示各饋線的推估線路；放大到街區層級（縮放 ${PZ} 以上）會顯示變壓器。`,`Showing estimated feeder lines; zoom to level ${PZ}+ for transformers.`):L2(`顯示各饋線的服務範圍；放大到街區層級（縮放 ${PZ} 以上）會顯示變壓器。`,`Showing feeder service areas; zoom to level ${PZ}+ for transformers.`)):""; return; }
    const pb=map.getPixelBounds().min;
    for(const k of inView()){ const t=Tr[k]; if(!t) continue;
      for(let i=0;i<t.n;i++){ const p=map.project([t.lat[i],t.lng[i]],z), x=p.x-pb.x, y=p.y-pb.y; if(x<-5||y<-5||x>sz.x+5||y>sz.y+5) continue;
        g.beginPath(); g.arc(x,y,3,0,6.2832); g.fillStyle=col(Ax(k,t.feeders[t.fi[i]])); g.fill(); g.lineWidth=1; g.strokeStyle="#fff"; g.stroke(); hits.push([x,y,k,i]); shown++; } }
    status.textContent=L2(`畫面內 ${shown.toLocaleString()} 個變壓器，點一下看所屬饋線。`,`${shown.toLocaleString()} transformers in view; tap one for its feeder.`); }
  map.on("click",e=>{ if(!on||map.getZoom()<PZ) return; const p=e.containerPoint; let best=null,bd=9;
    for(const h of hits){const d=Math.hypot(h[0]-p.x,h[1]-p.y); if(d<bd){bd=d;best=h;}} if(!best) return;
    const t=Tr[best[2]], f=t.feeders[t.fi[best[3]]]; L.popup().setLatLng([t.lat[best[3]],t.lng[best[3]]]).setContent(pop(best[2],f,null).replace(`<h4>`,`<h4>${L2("變壓器・","Transformer · ")}`)).openOn(map); });
  map.on("moveend zoomend resize",refresh); map.on("zoomstart",()=>{if(cvs)cvs.style.opacity=0;});
  box.innerHTML=`<label class="qhead"><input type="checkbox" id="fdon"> <span class="sw" style="background:conic-gradient(#b2182b 0 20%,#ef6548 0 40%,#fdae61 0 60%,#a6d96a 0 80%,#1a9850 0)"></span>${L2("台電饋線（可併網容量）","Taipower feeders (grid capacity)")}<span class="count">${T0.feeders.toLocaleString()}</span></label>
    <div id="fdpanel" hidden><div class="fdmode"><label><input type="radio" name="fdmode" value="line" checked> ${L2("推估線路","Estimated lines")}</label><label><input type="radio" name="fdmode" value="area"> ${L2("服務範圍","Service areas")}</label></div><div class="qleg">${CLS.map(([,,c,t])=>`<span><i style="background:${c};border-radius:2px"></i>${t}</span>`).join("")}<span><i style="background:${NOC};border-radius:2px"></i>${L2("容量表未列","not listed")}</span></div>
    <div class="src">${L2(`可併網容量（kW）。全臺 ${T0.feeders.toLocaleString()} 條饋線、${T0.tr.toLocaleString()} 個變壓器；${T0.noCap.toLocaleString()} 條饋線不在容量表（灰色），容量表另有 ${T0.capNoTr.toLocaleString()} 條沒有變壓器座標、無法上圖。`,
      `Remaining grid capacity (kW). ${T0.feeders.toLocaleString()} feeders, ${T0.tr.toLocaleString()} transformers; ${T0.noCap.toLocaleString()} feeders missing from the capacity table (grey), ${T0.capNoTr.toLocaleString()} listed feeders have no transformer coordinates.`)}</div></div>`;
  const panel=box.querySelector("#fdpanel"); panel.appendChild(status);
  panel.querySelectorAll('input[name="fdmode"]').forEach(r=>r.onchange=()=>{ if(!r.checked) return; mode=r.value; areaG.clearLayers(); refresh(); });
  [NOTE,SRC].forEach(t=>{const d=document.createElement("div");d.className="src";d.innerHTML=t;panel.appendChild(d);});
  box.querySelector("#fdon").onchange=e=>{ on=e.target.checked; panel.hidden=!on;
    if(on){ areaG.addTo(map); cvs??=L.DomUtil.create("canvas","",map.getPane("feedtr")); cvs.style.position="absolute"; cvs.style.display=""; refresh(); }
    else{ map.removeLayer(areaG); if(cvs) cvs.style.display="none"; status.textContent=""; } };
  return {refresh};
})();
window._FD=FD;
})();
