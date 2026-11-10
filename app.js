const $=s=>document.querySelector(s);
let books=[],portal=[],resultSets={},bookHeaders=[],portalHeaders=[],activeTab="Matched";

$("#booksFile").addEventListener("change",e=>loadFile(e.target.files[0],"books"));
$("#portalFile").addEventListener("change",e=>loadFile(e.target.files[0],"portal"));
$("#runBtn").addEventListener("click",run);
$("#exportBtn").addEventListener("click",exportWorkbook);

async function loadFile(file,type){
  if(!file)return;
  $(`#${type}Name`).textContent=file.name;
  const data=await file.arrayBuffer();
  const wb=XLSX.read(data,{type:"array",cellDates:true});
  const ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
  if(type==="books"){books=rows;bookHeaders=Object.keys(rows[0]||{});}
  else{portal=rows;portalHeaders=Object.keys(rows[0]||{});}
  populateSelectors();
  $("#runBtn").disabled=!(books.length&&portal.length);
}

function populateSelectors(){
  const all=[...new Set([...bookHeaders,...portalHeaders])];
  const fill=(id,words)=>{
    const el=$(id); el.innerHTML='<option value="">Auto-detect</option>';
    all.forEach(h=>{if(words.some(w=>h.toLowerCase().includes(w)))el.insertAdjacentHTML("beforeend",`<option value="${esc(h)}">${esc(h)}</option>`)});
  };
  fill("#partyCol",["party","supplier","vendor","name"]);
  fill("#invoiceCol",["invoice","inv no","bill no","document no"]);
  fill("#dateCol",["date"]);
  fill("#taxableCol",["taxable"]);
}

function pick(row,selector,words){
  const selected=$(selector).value;
  if(selected&&row[selected]!==undefined)return row[selected];
  const key=Object.keys(row).find(k=>words.some(w=>k.toLowerCase().includes(w)));
  return key?row[key]:"";
}
function norm(s){
  return String(s??"").toLowerCase().replace(/m\/s|m s|ms/g,"").replace(/[^a-z0-9]/g,"").trim();
}
function num(v){
  if(typeof v==="number")return v;
  const n=parseFloat(String(v??"").replace(/,/g,"").replace(/[₹$]/g,"").trim());
  return Number.isFinite(n)?n:0;
}
function dateKey(v){
  if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
  const s=String(v??"").trim();
  return s.toLowerCase().replace(/[^0-9a-z]/g,"");
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

function run(){
  const tol=num($("#tolerance").value);
  const B=books.map((r,i)=>({...r,__i:i,__party:norm(pick(r,"#partyCol",["party","supplier","vendor","name"])),__inv:norm(pick(r,"#invoiceCol",["invoice","inv no","bill no","document no"])),__date:dateKey(pick(r,"#dateCol",["date"])),__tax:num(pick(r,"#taxableCol",["taxable"]))}));
  const P=portal.map((r,i)=>({...r,__i:i,__party:norm(pick(r,"#partyCol",["party","supplier","vendor","name"])),__inv:norm(pick(r,"#invoiceCol",["invoice","inv no","bill no","document no"])),__date:dateKey(pick(r,"#dateCol",["date"])),__tax:num(pick(r,"#taxableCol",["taxable"]))}));
  const used=new Set(),matched=[],booksMissing=[],portalMissing=[];
  for(const b of B){
    let best=-1,bestDiff=Infinity;
    for(let j=0;j<P.length;j++){
      if(used.has(j))continue;
      const p=P[j];
      if(!b.__party||b.__party!==p.__party)continue;
      if(b.__inv&&p.__inv&&b.__inv!==p.__inv)continue;
      const d=Math.abs(b.__tax-p.__tax);
      if(d<=tol&&d<bestDiff){best=j;bestDiff=d;}
    }
    if(best>=0){used.add(best);matched.push(pairRow(b,P[best],bestDiff));}
    else booksMissing.push(flatRow(b,"Books - Not in Portal"));
  }
  P.forEach((p,j)=>{if(!used.has(j))portalMissing.push(flatRow(p,"Portal - Not in Books"));});
  const booksTax=B.reduce((s,r)=>s+r.__tax,0), portalTax=P.reduce((s,r)=>s+r.__tax,0), matchedTax=matched.reduce((s,r)=>s+num(r["Books Taxable Value"]),0);
  resultSets={Matched:matched,"Books - Not in Portal":booksMissing,"Portal - Not in Books":portalMissing};
  renderSummary(B.length,P.length,matched.length,booksMissing.length,portalMissing.length,booksTax,portalTax);
  renderTabs();
  $("#results").classList.remove("hidden");
}

function pairRow(b,p,diff){
  return {"Status":"Matched","Party Name":b.__party,"Invoice No. (Books)":b.__inv,"Invoice No. (Portal)":p.__inv,"Invoice Date (Books)":b.__date,"Invoice Date (Portal)":p.__date,"Books Taxable Value":b.__tax,"Portal Taxable Value":p.__tax,"Difference":diff};
}
function flatRow(r,status){
  return {"Status":status,"Party Name":r.__party,"Invoice No.":r.__inv,"Invoice Date":r.__date,"Taxable Value":r.__tax};
}
function renderSummary(bl,pl,m,bn,pn,bt,pt){
  const diff=bt-pt;
  $("#summary").innerHTML=[
    ["Books invoices",bl,""],
    ["Portal invoices",pl,""],
    ["Matched",m,"ok"],
    ["Books not in Portal",bn,"bad"],
    ["Portal not in Books",pn,"warn"],
    ["Taxable difference",diff.toFixed(2),Math.abs(diff)<0.01?"ok":"bad"]
  ].map(x=>`<div class="metric"><div class="label">${x[0]}</div><div class="value ${x[2]}">${x[1]}</div></div>`).join("");
  $("#summary").classList.remove("hidden");
  $("#statusText").textContent=`Books taxable: ${bt.toFixed(2)} | Portal taxable: ${pt.toFixed(2)} | Difference: ${diff.toFixed(2)}`;
}
function renderTabs(){
  const tabs=$("#tabs"); tabs.innerHTML="";
  Object.keys(resultSets).forEach(k=>{
    const b=document.createElement("button");b.className="tab"+(k===activeTab?" active":"");b.textContent=`${k} (${resultSets[k].length})`;
    b.onclick=()=>{activeTab=k;renderTabs();renderTable(resultSets[k])};tabs.appendChild(b);
  });
  renderTable(resultSets[activeTab]);
}
function renderTable(rows){
  const t=$("#resultTable"); if(!rows.length){t.innerHTML="<tr><td>No records</td></tr>";return;}
  const h=Object.keys(rows[0]); t.innerHTML=`<thead><tr>${h.map(x=>`<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.Status==="Matched"?"match":r.Status.includes("Books")?"missing":"mismatch"}">${h.map(k=>`<td>${esc(r[k])}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function exportWorkbook(){
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(books),"Books");
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(portal),"Portal");
  const recon=[...resultSets.Matched,...resultSets["Books - Not in Portal"],...resultSets["Portal - Not in Books"]];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(recon),"Reconciliation");
  XLSX.writeFile(wb,"GST_Reconciliation.xlsx");
}
