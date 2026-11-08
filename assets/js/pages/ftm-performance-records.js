/* FTM-only register for evidence linked to performance criteria.
 * Original file blobs remain in IndexedDB. The viewer reads them by the same ID.
 */
(function () {
  "use strict";
  const E=window.ItqanEngines;
  if(!E?.StorageEngine) return;
  const storage=E.StorageEngine;
  const $=id=>document.getElementById(id);
  const label=(tag,value,cls)=>{
    const node=document.createElement(tag);
    node.textContent=String(value??"");
    if(cls)node.className=cls;
    return node;
  };
  function records(){
    const user=storage.getCurrentUser();
    if(!user?.id) return [];
    const db=storage.getDB(), criteria=db.criteria||[];
    const names=new Map(criteria.map(c=>[String(c.id),String(c.title||"معيار أداء")]));
    const matches=(storage.getPortfolioForUser(user.id)||[])
      .filter(item=>item.criteriaId != null && item.criteriaId !== "" ||
        String(item.section||"").includes("الأداء الوظيفي"));
    return matches.map(item=>({
      item,
      criterion:names.get(String(item.criteriaId)) || (item.criteriaId?"معيار مرتبط":"شاهد أداء وظيفي")
    }));
  }
  function render(){
    const grid=$("ftm-performance-evidence-list");
    if(!grid)return;
    const all=records();
    const search=($("ftm-performance-files-search")?.value||"").trim().toLocaleLowerCase();
    const filtered=search ? all.filter(({item,criterion})=>
      [item.title,item.description,item.fileName,criterion].some(v=>
        String(v||"").toLocaleLowerCase().includes(search))) : all;
    grid.replaceChildren();
    for(const id of ["ftm-performance-files-count","ftm-performance-nav-count"]){
      const out=$(id); if(out)out.textContent=String(all.length);
    }
    if(!filtered.length){
      grid.append(label("p",search?"لا توجد شواهد تطابق البحث.":"لا توجد شواهد مرتبطة بمعايير الأداء الوظيفي حتى الآن.","ftm-performance-evidence-empty"));
      return;
    }
    for(const {item,criterion} of filtered){
      const card=label("article","","ftm-performance-evidence-item");
      card.append(
        label("h4",item.title||item.fileName||"شاهد بلا عنوان"),
        label("div","معيار الأداء: "+criterion,"ftm-performance-evidence-meta"),
        label("div","📎 "+(item.fileName||"لا يوجد مرفق")+" • "+(item.date||"—"),"ftm-performance-evidence-meta")
      );
      if(item.description)card.append(label("p",item.description,"ftm-performance-evidence-meta"));
      const actions=label("div","","ftm-performance-evidence-actions");
      const id=String(item.id||"");
      if(item.fileName && /^[A-Za-z0-9_-]{1,120}$/.test(id)){
        const link=label("a","👁 معاينة PDF أو الصورة","btn btn-sm btn-outline");
        link.href="ftm-file-viewer.html?file="+encodeURIComponent(id);
        link.title="يعرض الملف من تخزين هذا المتصفح، ولا يرفعه أو ينزله تلقائيًا";
        actions.append(link);
      }else{
        actions.append(label("span",item.fileName?"تعذر تكوين رابط المعاينة":"بيانات شاهد بدون ملف مرفق","ftm-performance-evidence-meta"));
      }
      const state=label("span","الملف محفوظ في خزنة المتصفح","ftm-performance-evidence-meta");
      state.title="النسخ إلى GitHub يحتاج خدمة رفع خلفية موثوقة؛ لا يُنشر الملف تلقائيًا من هذا السجل";
      card.append(actions,state);
      grid.append(card);
    }
  }
  function init(){
    $("ftm-performance-files-search")?.addEventListener("input",render);
    window.addEventListener("itqan:activeUserChanged",render);
    window.addEventListener("itqan:portfolioChanged",render);
    window.addEventListener("storage",render);
    // Some legacy save paths do not dispatch portfolioChanged.
    const save=storage.saveDB;
    storage.saveDB=function(...args){
      const result=save.apply(this,args);
      queueMicrotask(render);
      return result;
    };
    render();
  }
  document.addEventListener("DOMContentLoaded",init);
  window.FTMPerformanceRecords=Object.freeze({render});
})();
