(function(H){
"use strict";
const query=(el,s)=>el.querySelector(s);
const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const fits=el=>el.scrollHeight<=el.clientHeight+2;
const num=H.toArabicDigits;
function add(parent,tag,cls,text){const el=document.createElement(tag);el.className=cls||"";el.textContent=String(text??"");parent.append(el);return el;}
function table(columns){const t=document.createElement("table");t.className="data-table";const head=t.createTHead().insertRow();columns.forEach(c=>add(head,"th","",c));t.createTBody();return t;}
function row(table,values){const tr=table.tBodies[0].insertRow();values.forEach((v,i)=>{const td=tr.insertCell();td.textContent=String(v??"");if(i===0)td.className="name";});return tr;}
function tail(report){const section=document.createElement("section");section.className="hsp-report-tail";if(report.statistics?.length){add(section,"h2","section-title","إحصاءات التقرير");const grid=add(section,"div","stat-grid","");for(const s of report.statistics){const card=add(grid,"div","stat","");add(card,"b","",s.value);add(card,"span","",s.label);}}
if(report.signoff){const sign=add(section,"section","hsp-signoff","");add(sign,"strong","",report.signoff.title||"اعتماد التقرير");add(sign,"p","",report.signoff.principal||"مدير المدرسة");const marks=add(sign,"div","hsp-signoff-marks","");for(const [kind,label] of [["signature","التوقيع"],["stamp","الختم"]]){if((kind==="signature"&&report.signoff.showSignature===false)||(kind==="stamp"&&report.signoff.showStamp===false))continue;const part=add(marks,"div","hsp-signoff-mark","");add(part,"span","",label);if(report.signoff[kind]){const img=document.createElement("img");img.src=report.signoff[kind];img.alt=label;part.append(img);}}}if(Array.isArray(report.extraComponents)&&report.extraComponents.length){if(!H.AdminComponents)throw Error("مكتبة المكونات الإدارية غير محملة");for(const entry of report.extraComponents){section.append(H.AdminComponents.create(entry.kind,entry.options||{}));}}return section;}
async function ready(root){await document.fonts.ready;await Promise.all([...root.querySelectorAll("img")].map(async img=>{try{if(!img.complete)await img.decode();}catch{}}));await tick();}
async function paginate(target,report,options={}){
if(!report?.columns?.length)throw Error("أعمدة التقرير مطلوبة");
const diagnostics=[],template=options.template||"official-landscape",limit=options.maxPages||500;
H.mount(target,{template,pages:1,content:"blank",title:"",educationAdministrationName:options.educationAdministrationName,schoolName:options.schoolName});
const base=query(target,".sheet").cloneNode(true);target.replaceChildren();
const pages=[];function makePage(){if(pages.length>=limit)throw Error("تجاوز الحد الأعلى للصفحات");const page=base.cloneNode(true),main=query(page,".sheet-content");main.replaceChildren();add(main,"h1","page-title",report.title||"تقرير الموظفين");const t=table(report.columns);main.append(t);target.append(page);const item={page,main,table:t,body:t.tBodies[0]};pages.push(item);return item;}
let current=makePage();await ready(target);
if(!fits(current.main))throw Error("عنوان التقرير ورأس الجدول يتجاوزان المساحة");
const source=(report.rows||[]).map(r=>r.map(v=>String(v??"")));
for(const data of source){let tr=row(current.table,data);if(!fits(current.main)){tr.remove();current=makePage();tr=row(current.table,data);if(!fits(current.main)){tr.remove();throw Error("صف طويل جدًا لا يتسع لصفحة كاملة، يحتاج سياسة تقسيم الخلايا");}}}
const end=tail(report);current.main.append(end);await ready(target);
if(!fits(current.main)){
end.remove();let final=makePage();final.main.append(end);await ready(target);
if(!fits(final.main))throw Error("كتلة الإحصاءات والاعتماد أكبر من صفحة كاملة؛ يلزم تقسيم مستقل لها");
const min=Math.min(source.length,Math.max(0,Number(report.minTailRows??3)));let moved=0;
for(let attempt=0;attempt<source.length&&moved<min;attempt++){
let donor=null;for(let i=pages.length-2;i>=0;i--){if(pages[i].body.rows.length){donor=pages[i];break;}}if(!donor)break;
const tr=donor.body.lastElementChild;final.body.prepend(tr);if(!fits(final.main)){donor.body.append(tr);break;}moved++;
}
if(moved<min)diagnostics.push("تعذر نقل الحد الأدنى من الصفوف مع التواقيع؛ المنقول "+num(moved)+" من "+num(min));
if(moved===0&&source.length)diagnostics.push("تحذير: صفحة توقيعات منفردة، لا تسمح المساحة بنقل صف من الجدول");
for(let i=pages.length-2;i>=0;i--){if(!pages[i].body.rows.length){pages[i].page.remove();pages.splice(i,1);}}
}
const actual=pages.flatMap(p=>[...p.body.rows].map(r=>[...r.cells].map(c=>c.textContent)));
if(actual.length!==source.length||actual.some((r,i)=>JSON.stringify(r)!==JSON.stringify(source[i])))throw Error("خطأ: اختلاف صفوف التقرير بعد التقسيم");
pages.forEach((p,i)=>{const spans=query(p.page,".sheet-footer")?.querySelectorAll("span");if(spans?.[1])spans[1].textContent="الصفحة "+num(i+1)+" من "+num(pages.length);});
await ready(target);if(pages.some(p=>!fits(p.main)))throw Error("تجاوز للمساحة الآمنة بعد التقسيم");
diagnostics.forEach(x=>console.warn("[HSP3:pagination]",x));
return {pages:pages.length,rows:actual.length,lastPageRows:pages[pages.length-1].body.rows.length,diagnostics};
}

/* Stage II: DOM blocks from the 36 structural report renderers.
 * Keep the existing row-only paginator intact for archived JSON reports.
 * Split tables at actual row boundaries; repeat original thead and section
 * heading, and retain the four standard HSP3 print headers and footers.
 */
async function paginateBlocks(target,report,options={}){
if(!Array.isArray(report?.blocks)||!report.blocks.length)throw Error("محتوى نموذج التقرير غير متوفر");
const limit=options.maxPages||500,diagnostics=[];
H.mount(target,{template:options.template||"official-landscape",pages:1,content:"blank",title:"",
  educationAdministrationName:options.educationAdministrationName,schoolName:options.schoolName});
const base=query(target,".sheet").cloneNode(true);
target.replaceChildren();
const sheets=[];
const layoutClass=String(report.bodyClass||"").split(/\s+/).filter(x=>/^rb-[\w-]+$/.test(x)).join(" ");
function makePage(){
 if(sheets.length>=limit)throw Error("تجاوز الحد الأعلى للصفحات");
 const sheet=base.cloneNode(true),main=query(sheet,".sheet-content");
 main.replaceChildren();
 const wrapper=document.createElement("div");
 wrapper.className="hsp-embedded-report "+layoutClass;
 wrapper.dir="rtl";main.append(wrapper);target.append(sheet);
 const item={sheet,main,wrapper};sheets.push(item);return item;
}
let current=makePage();await ready(target);
const clone=node=>node.cloneNode(true);
const sourceTables=report.blocks.reduce((sum,node)=>sum+node.querySelectorAll("tbody tr").length,0);
const nonTable=report.blocks.filter(node=>!(node.matches?.("table")||node.querySelector("table"))).length;
let tableRows=0,ordinaryBlocks=0;
function tryAdd(node){
 current.wrapper.append(node);
 const result=fits(current.main);
 if(!result)node.remove();
 return result;
}
function nextPage(){current=makePage();}
function freshSection(source,tableOriginal,first){
 const directTable=source.matches("table");
 const section=directTable?document.createElement("section"):clone(source);
 const old=directTable?null:section.querySelector("table");
 const t=clone(tableOriginal);
 if(t.tBodies.length)t.tBodies[0].replaceChildren();
 if(old)old.replaceWith(t);
 else section.append(t);
 // Only the first chunk retains non-heading blocks immediately following the
 // table. A split chunk retains its own heading + table header.
 if(!first){
   for(const node of [...section.children]){
     if(node!==t&&!node.querySelector?.("table")&&!/^(H[1-6])$/.test(node.tagName))node.remove();
   }
 }
 return {section,table:t};
}
for(let i=0;i<report.blocks.length;i++){
 const source=report.blocks[i],tableOriginal=source.matches?.("table")?source:source.querySelector("table");
 if(!tableOriginal||!tableOriginal.tBodies.length){
   const node=clone(source);node.dataset.hspBlockIndex=String(i);
   if(!tryAdd(node)){
     if(current.wrapper.children.length)nextPage();
     if(!tryAdd(node)){
       // Charts and ranking grids may exceed an A4 content area. Preserve
       // each card as an indivisible unit and split the group across sheets.
       // Reuse the original element's class and layout CSS on each chunk.
       if(source.children.length<2)throw Error("كتلة تقرير كبيرة لا تتسع لصفحة A4");
       let part=null;
       for(const original of source.children){
         if(!part){
           part=source.cloneNode(false);
           current.wrapper.append(part);
         }
         const child=clone(original);part.append(child);
         if(!fits(current.main)){
           child.remove();
           if(!part.children.length){
             part.remove();
             if(!current.wrapper.children.length)throw Error("عنصر تقرير أكبر من صفحة A4");
             nextPage();
           }else{
             nextPage();
           }
           part=source.cloneNode(false);current.wrapper.append(part);part.append(child);
           if(!fits(current.main))throw Error("عنصر رسومي لا يتسع في صفحة A4");
         }
       }
       diagnostics.push("قُسّمت مجموعة رسوم أو بطاقات عبر عدة صفحات");
     }
   }
   ordinaryBlocks++;continue;
 }
 const rows=[...tableOriginal.tBodies[0].rows];
 let unit=freshSection(source,tableOriginal,true);
 // First try the complete table, preserving its original layout.
 const complete=clone(source);
 if(tryAdd(complete)){tableRows+=rows.length;continue;}
 // Otherwise stream rows, keeping thead repeated on each new page.
 let index=0;
 while(index<rows.length){
   if(!unit.section.isConnected){
     current.wrapper.append(unit.section);
     if(!fits(current.main)){
       unit.section.remove();
       if(!current.wrapper.children.length)throw Error("عنوان جدول أو رأسه أكبر من مساحة الصفحة");
       nextPage();current.wrapper.append(unit.section);
       if(!fits(current.main))throw Error("رأس جدول أكبر من صفحة A4");
     }
   }
   const tr=clone(rows[index]);
   unit.table.tBodies[0].append(tr);
   if(!fits(current.main)){
     tr.remove();
     if(!unit.table.tBodies[0].rows.length){
       unit.section.remove();
       if(!current.wrapper.children.length)throw Error("صف جدول أكبر من صفحة A4");
       nextPage();unit=freshSection(source,tableOriginal,false);
       continue;
     }
     nextPage();unit=freshSection(source,tableOriginal,false);
   }else{index++;tableRows++;}
 }
}
if(report.statistics?.length||report.signoff||report.extraComponents?.length){
 const end=tail(report);
 if(!tryAdd(end)){
   nextPage();
   if(!tryAdd(end))throw Error("المكونات الإدارية الختامية تتجاوز صفحة كاملة");
   diagnostics.push("وُضعت المكونات الختامية في صفحة مستقلة بسبب حجم المحتوى");
 }
}
for(const item of sheets){
 if(!item.wrapper.children.length)throw Error("صفحة فارغة بعد التقسيم");
 if(!fits(item.main))throw Error("تجاوز المحتوى حدود صفحة A4");
}
const actualRows=sheets.reduce((total,item)=>total+item.wrapper.querySelectorAll("tbody tr").length,0);
if(actualRows!==sourceTables||tableRows!==sourceTables||ordinaryBlocks!==nonTable)
 throw Error("اختلاف مكونات التقرير بعد تقسيم الصفحات");
sheets.forEach((item,i)=>{
 const spans=query(item.sheet,".sheet-footer")?.querySelectorAll("span");
 if(spans?.[1])spans[1].textContent="الصفحة "+num(i+1)+" من "+num(sheets.length);
});
await ready(target);
return {pages:sheets.length,rows:tableRows,blocks:report.blocks.length,diagnostics};
}
H.paginateBlocks=paginateBlocks;

H.paginate=paginate;
})(window.HSP3);