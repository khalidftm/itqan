(function(H){
"use strict";
const $=(s,r=document)=>r.querySelector(s);
const digits=H.toArabicDigits;
const labels={statistics:"الإحصاءات",principal:"اعتماد مدير المدرسة",signature:"التوقيع",stamp:"الختم الرسمي",employee:"اطلاع الموظف",review:"الإعداد والمراجعة والاعتماد",notes:"الملاحظات"};
function sample(n){
return {title:"تقرير بيانات الموظفين وإحصاءاتهم واعتماد المدير",
columns:["اسم الموظف","القسم","الحالة","الملاحظات"],
rows:Array.from({length:n},(_,i)=>["الموظف "+digits(i+1),"التعليم",i%3?"منتظم":"متأخر",i%7?"—":"ملاحظة تجريبية أطول لاختبار ارتفاع الصف والتفاف النص في الجدول"]),
statistics:[{label:"عدد الموظفين",value:digits(n)},{label:"الأقسام",value:"٣"},{label:"المنتظمون",value:digits(Math.floor(n*2/3))}]};
}
class PrintPreviewManager{
constructor(dialog){
this.dialog=dialog;this.root=$("#hsp-print-pages",dialog);this.screen=$("#hsp-print-viewport",dialog);this.status=$("#hsp-print-status",dialog);this.zoomIndicator=$("#hsp-print-zoom-label",dialog);
this.select=$("#hsp-print-template",dialog);this.rows=$("#hsp-print-row-count",dialog);
this.educationInput=$("#hsp-print-education",dialog);this.schoolInput=$("#hsp-print-school",dialog);
this.zoom=1;this.mode="fit-width";this.token=0;this.reportFactory=()=>sample(Math.max(1,Math.min(500,Number(this.rows.value)||45)));
this.focusReturn=null;this.presentationMode="design";this.externalReport=null;this.identity={};this.templateOverride=null;
H.profiles.forEach(p=>this.select.add(new Option(p.name,p.id)));
this.select.value="official-landscape";
this.bind();
}
bind(){
this.dialog.addEventListener("click",event=>{if(event.target===this.dialog)this.close();});
this.dialog.querySelectorAll("[data-print-action]").forEach(button=>button.addEventListener("click",()=>this.action(button.dataset.printAction)));
this.select.addEventListener("change",()=>this.refresh());
this.rows.addEventListener("change",()=>this.refresh());
this.educationInput?.addEventListener("change",()=>this.refresh());
this.schoolInput?.addEventListener("change",()=>this.refresh());
this.dialog.querySelectorAll("[data-print-component]").forEach(x=>x.addEventListener("change",()=>this.refresh()));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&this.dialog.open){e.preventDefault();this.close();} if(e.key==="Tab"&&this.dialog.open)this.trapFocus(e);});
window.addEventListener("resize",()=>{if(this.dialog.open&&this.mode!=="manual")this.applyFit(this.mode);});
}
trapFocus(e){const nodes=[...this.dialog.querySelectorAll("button:not([disabled]), select:not([disabled]), input:not([disabled])")].filter(el=>el.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
open(options={}){
this.focusReturn=document.activeElement;
this.presentationMode=options.mode==="viewer"?"viewer":"design";
this.externalReport=options.report&&(Array.isArray(options.report.rows)||Array.isArray(options.report.blocks))?options.report:null;
this.identity={educationAdministrationName:String(options.educationAdministrationName??"الإدارة العامة للتعليم بمنطقة مكة المكرمة"),schoolName:String(options.schoolName??"ابن سيرين الثانوية ببحرة - مسارات")};
if(this.educationInput)this.educationInput.value=this.identity.educationAdministrationName||"اسم إدارة التعليم";
if(this.schoolInput)this.schoolInput.value=this.identity.schoolName||"اسم المدرسة";
this.dialog.dataset.mode=this.presentationMode;
this.select.value=options.template&&H.profiles.some(p=>p.id===options.template)?options.template:this.select.value;
if(options.components&&typeof options.components==="object"){
this.dialog.querySelectorAll("[data-print-component]").forEach(input=>{if(Object.hasOwn(options.components,input.dataset.printComponent))input.checked=!!options.components[input.dataset.printComponent];});
}
const title=this.externalReport?.title||this.reportFactory().title;
const el=$("#hsp-print-report-title",this.dialog);if(el)el.textContent=title;
this.dialog.setAttribute("aria-label",title);
if(!this.dialog.open)this.dialog.showModal();
this.refresh();$("#hsp-print-close",this.dialog).focus();
}
close(){this.dialog.close();this.focusReturn?.focus?.();}
components(){return Object.fromEntries([...this.dialog.querySelectorAll("[data-print-component]")].map(x=>[x.dataset.printComponent,x.checked]));}
async refresh(){
const token=++this.token;this.status.textContent="جارٍ قياس الصفحات...";this.status.classList.remove("is-error");
const base=this.externalReport||this.reportFactory(),flags=this.components();
if(this.presentationMode==="design"){this.identity.educationAdministrationName=this.educationInput?.value||"اسم إدارة التعليم";this.identity.schoolName=this.schoolInput?.value||"اسم المدرسة";}
const titleEl=$("#hsp-print-report-title",this.dialog);if(titleEl)titleEl.textContent=String(base.title||"تقرير");
const report={...base,statistics:flags.statistics?(base.statistics||[]):[],minTailRows:base.minTailRows??3};
if(this.presentationMode==="viewer"&&this.externalReport){report.statistics=base.statistics||[];}
if(!(this.presentationMode==="viewer"&&this.externalReport) && (flags.principal||flags.signature||flags.stamp)){report.signoff={...(base.signoff||{}),title:flags.principal?"اعتماد مدير المدرسة":"التوقيع والختم",principal:flags.principal?(base.signoff?.principal||"مدير المدرسة"):"",showSignature:flags.signature,showStamp:flags.stamp};}else if(!(this.presentationMode==="viewer"&&this.externalReport)){delete report.signoff;}
report.extraComponents=Array.isArray(base.extraComponents)?base.extraComponents.slice():[];
if(flags.employee&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"employeeAcknowledgment",options:{name:"اسم الموظف",date:""}})
if(flags.review&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"reviewApproval",options:{preparedBy:"معد التقرير",reviewedBy:"المراجع",approvedBy:"المعتمد"}});
if(flags.notes&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"notes",options:{text:"ملاحظات إدارية تجريبية قابلة للتعديل لاحقًا."}});
if(flags.deputy&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"deputyApproval",options:{name:base.deputyName||""}});
if(flags.officer&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"hudooriOfficer",options:{name:base.officerName||"",role:base.officerRole||"مسؤول حضوري"}});
if(flags.employeeSignature&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"employeeSignature",options:{name:base.employeeName||""}});
if(flags.bullets&&!(this.presentationMode==="viewer"&&this.externalReport))report.extraComponents.push({kind:"bulletList",options:{items:base.bulletItems||["البند الأول","البند الثاني","البند الثالث"]}});
try{
const result=Array.isArray(report.blocks)?await H.paginateBlocks(this.root,report,{template:this.select.value,...this.identity}):await H.paginate(this.root,report,{template:this.select.value,...this.identity});
if(token!==this.token)return;
const warnings=result.diagnostics||[];
this.status.textContent="الصفحات: "+digits(result.pages)+" | السجلات: "+digits(result.rows)+(warnings.length?" | "+warnings.join("؛ "):" | جاهز للمعاينة");
this.root.classList.toggle("has-diagnostics",warnings.length>0);
this.applyFit(this.mode==="manual"?"manual":this.mode);
}catch(error){if(token!==this.token)return;this.status.textContent="تعذر تقسيم التقرير: "+error.message;this.status.classList.add("is-error");console.error("[HSP3 Print Manager]",error);}
}
setZoom(value){this.mode="manual";this.zoom=Math.min(1.7,Math.max(window.innerWidth<=760?0.12:0.3,Math.round(value*100)/100));this.updateZoom();}
applyFit(mode){this.mode=mode;const page=this.root.querySelector(".sheet");if(!page)return;
const pageWidth=page.getBoundingClientRect().width/(this.zoom||1),pageHeight=page.getBoundingClientRect().height/(this.zoom||1);
const areaWidth=this.screen.clientWidth-42,areaHeight=this.screen.clientHeight-42;
let next=mode==="fit-page"?Math.min(areaWidth/pageWidth,areaHeight/pageHeight):mode==="fit-width"?areaWidth/pageWidth:this.zoom;
this.zoom=Math.min(1.7,Math.max(window.innerWidth<=760?0.12:0.3,next));this.updateZoom();}
updateZoom(){this.root.style.zoom=String(this.zoom);this.zoomIndicator.textContent=digits(Math.round(this.zoom*100))+"٪";}
action(action){
switch(action){
case "close":this.close();break;
case "zoom-in":this.setZoom(this.zoom+0.1);break;
case "zoom-out":this.setZoom(this.zoom-0.1);break;
case "actual":this.setZoom(1);break;
case "fit-width":this.applyFit("fit-width");break;
case "fit-page":this.applyFit("fit-page");break;
case "print":case "pdf":if(this.status.classList.contains("is-error"))return;window.print();if(action==="pdf")this.status.textContent+=" | اختر «حفظ كملف PDF» من وجهة الطباعة.";break;
}}
}
H.PrintPreviewManager=PrintPreviewManager;
document.addEventListener("DOMContentLoaded",()=>{const d=document.getElementById("hsp-print-dialog");if(!d)return;const m=new PrintPreviewManager(d);window.hspPrintManager=m;
H.openPrintPreview=(options={})=>m.open(options);
document.querySelectorAll("[data-open-print-manager]").forEach(b=>b.addEventListener("click",()=>m.open({mode:b.dataset.openPrintManager||"design"})));
if(new URLSearchParams(location.search).get("open")==="1")m.open({mode:new URLSearchParams(location.search).get("mode")==="viewer"?"viewer":"design"});
});
})(window.HSP3);
