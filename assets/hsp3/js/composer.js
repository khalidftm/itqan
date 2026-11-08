(function(api){
const $=(s,r=document)=>r.querySelector(s);
const digit=api.toArabicDigits;
// Resolve from this script so local file previews and Cloudflare Pages use the same image.
const officialLogoUrl=new URL("../assets/images/admin_logo.jpg",document.currentScript.src).href;
function header(p,options={}){return '<header class="sheet-header"><div class="header-cell"><strong>المملكة العربية السعودية</strong><span>وزارة التعليم</span><span>'+safe(options.educationAdministrationName||"الإدارة العامة للتعليم بمنطقة مكة المكرمة")+'</span><span>'+safe(options.schoolName||"ابتدائية بحرة المجاهدين الخامسة ببحرة المجاهدين")+'</span></div><div class="header-cell"><div class="logo-placeholder"><img class="official-admin-logo" src="'+officialLogoUrl+'" alt="شعار الإدارة"></div></div><div class="header-cell"><strong>ملف الإنجاز المهني</strong><span>إتقان</span></div></header>';}
function footer(n,total){return '<footer class="sheet-footer"><span>إتقان — ملف الإنجاز المهني</span><span>الصفحة '+digit(n)+' من '+digit(total)+'</span><span>تاريخ الطباعة: '+digit(new Date().toLocaleDateString("en-GB").replaceAll("/","-"))+'</span></footer>';}
function imageTag(url,kind){return '<img class="sheet-image '+kind+'" src="'+url+'" alt="صورة '+(kind==="head"?"الترويسة":"التذييل")+'" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\'"><div class="image-missing '+kind+'" style="display:none">لم تُضف صورة '+(kind==="head"?"الهيدر":"الفوتر")+' بعد — '+url+'</div>';}
function safe(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
api.mount=(root,options={})=>{
const p=api.getProfile(options.template),type=options.content||"table";const count=Math.max(1,Number(options.pages)||1),rows=Number(options.rows)||12;
root.innerHTML="";
for(let i=0;i<count;i++){
const shell=document.createElement("article");shell.className="sheet preview-guide"+(p.mode==="text"?" sheet--official":"");
shell.style.setProperty("--page-w",p.w+"mm");shell.style.setProperty("--page-h",p.h+"mm");shell.style.setProperty("--head-h",p.header+"mm");shell.style.setProperty("--foot-h",p.footer+"mm");
shell.innerHTML=(p.mode==="image"?'<div class="hsp-branded-header">'+imageTag(p.headerImage,"head")+'<div class="hsp-branded-education" data-hsp-identity="education">'+safe(options.educationAdministrationName||"اسم إدارة التعليم")+'</div><div class="hsp-branded-school" data-hsp-identity="school">'+safe(options.schoolName||"اسم المدرسة")+'</div></div>':header(p,options))+'<main class="sheet-content"></main>'+(p.mode==="image"?imageTag(p.footerImage,"foot"):footer(i+1,count));
$(".sheet-content",shell).innerHTML=api.makeContent(type,{rows,title:options.title});
root.appendChild(shell);
}
document.body.dataset.orientation=p.orientation;
const old=document.getElementById("dynamic-print-size");if(old)old.remove();
const style=document.createElement("style");style.id="dynamic-print-size";style.textContent="@media print{@page{size:A4 "+p.orientation+";margin:0}}";document.head.appendChild(style);
};
})(window.HSP3);