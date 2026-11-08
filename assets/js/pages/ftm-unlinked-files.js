/* FTM unlinked vault: one IndexedDB blob, deferred portfolio/performance association. */
(function () {
  "use strict";
  const engines=window.ItqanEngines;
  if(!engines?.StorageEngine||!engines?.IndexedDBFileStore||!engines?.ModalEngine)return;
  const storage=engines.StorageEngine,files=engines.IndexedDBFileStore,modal=engines.ModalEngine;
  const portfolioSections=["استراتيجيات التدريس","أوراق العمل والأنشطة","الخطط العلاجية والإثرائية","تحليل نتائج التعلم","البيئة التعليمية","الدورات والتطوير المهني","الشراكة الأسرية","خطابات الشكر والتقدير","وثائق أخرى"];
  const userId=()=>storage.getCurrentUser()?.id;
  const all=()=>((storage.getDB().unlinkedFiles||[]).filter(f=>f.userId===userId()));
  const get=id=>all().find(f=>f.id===id);
  const safeId=id=>/^unlinked-[a-zA-Z0-9_-]+$/.test(id);
  const fmt=size=>size>1024*1024?(size/1048576).toFixed(1)+" MB":Math.max(1,Math.ceil((size||0)/1024))+" KB";
  const el=(tag,txt,cls)=>{const n=document.createElement(tag);n.textContent=String(txt??"");if(cls)n.className=cls;return n;};
  const btn=(label,cls,fn)=>{const n=el("button",label,"btn btn-sm "+cls);n.type="button";n.addEventListener("click",fn);return n;};
  const alert=(type,title,message)=>engines.ToastEngine?.show({type,title,message});
  const close=()=>modal.close();
  function dialog(title,html){
    modal.open({type:"info",title,html,size:"lg",hideFooter:true});
    document.getElementById("unified-modal-dialog")?.classList.add("ftm-unlinked-modal");
  }
  function render(){
    const entries=all(),search=document.getElementById("ftm-unlinked-search")?.value?.trim().toLocaleLowerCase()||"";
    const shown=search?entries.filter(x=>(x.title+" "+x.fileName+" "+(x.note||"")).toLocaleLowerCase().includes(search)):entries;
    const count=document.getElementById("ftm-unlinked-count"),badge=document.getElementById("ftm-unlinked-nav-count");
    if(count)count.textContent=String(entries.length);
    if(badge)badge.textContent=String(entries.length);
    const grid=document.getElementById("ftm-unlinked-list");if(!grid)return;grid.replaceChildren();
    if(!shown.length){grid.append(el("p",search?"لا توجد نتائج مطابقة.":"لا توجد ملفات غير مرتبطة حتى الآن.","ftm-unlinked-empty"));return;}
    for(const item of shown){
      const card=el("article","","ftm-unlinked-card");
      card.append(el("h3",item.title,"ftm-unlinked-name"),
        el("div","📎 "+item.fileName+" • "+fmt(item.size),"ftm-unlinked-meta"),
        el("div","أضيف في "+new Date(item.uploadedAt).toLocaleString("ar-SA"),"ftm-unlinked-meta"));
      if(item.note)card.append(el("p",item.note,"ftm-unlinked-meta"));
      const cloudState=window.FTMAutoSync?.fileSyncState(item.id)||"local";
      const cloudLabel=cloudState==="synced"?"✓ نسخة الملف محفوظة سحابيًا"
        :cloudState==="pending"?"◷ بانتظار النسخ السحابي التلقائي"
        :"◌ الاتصال السحابي غير مفعّل في هذه الجلسة";
      const cloud=el("div",cloudLabel,"ftm-unlinked-cloud-status");
      cloud.dataset.state=cloudState;
      card.append(cloud);
      const actions=el("div","","ftm-unlinked-actions");
      actions.append(btn("👁 معاينة","btn-outline",()=>preview(item.id)),
        btn("🔗 ربط","btn-primary",()=>link(item.id)),
        btn("حذف","btn-ghost",()=>remove(item.id)));
      card.append(actions);grid.append(card);
    }
  }
  function openUpload(){
    dialog("إضافة ملف دون ربط",'<div class="form-group"><label class="form-label" for="fuv-file">الملف من الجهاز (صورة، PDF، مستند أو أي ملف)</label><input type="file" id="fuv-file" class="form-control"></div>'+
      '<div class="form-group"><label class="form-label" for="fuv-title">عنوان اختياري</label><input id="fuv-title" class="form-control" maxlength="180"></div>'+
      '<div class="form-group"><label class="form-label" for="fuv-note">ملاحظة اختيارية</label><textarea id="fuv-note" class="form-control" rows="2" maxlength="800"></textarea></div>'+
      '<p class="text-muted">يُحفظ الملف محليًا دون ربطه، ويمكن ربطه لاحقًا دون رفعه مرة أخرى.</p>'+
      '<div class="ftm-unlinked-modal-actions"><button id="fuv-cancel" type="button" class="btn btn-ghost">إلغاء</button><button id="fuv-save" type="button" class="btn btn-primary">حفظ دون ربط</button></div>');
    const pick=document.getElementById("fuv-file"),name=document.getElementById("fuv-title"),note=document.getElementById("fuv-note"),save=document.getElementById("fuv-save");
    pick.addEventListener("change",()=>{if(pick.files?.[0]&&!name.value)name.value=pick.files[0].name.replace(/\.[^.]+$/,"");});
    document.getElementById("fuv-cancel").addEventListener("click",close);
    save.addEventListener("click",async()=>{
      const file=pick.files?.[0],uid=userId();
      if(!file||!uid){alert("warning","اختيار الملف","اختاري ملفًا قبل الحفظ.");return;}
      save.disabled=true;
      const id="unlinked-"+(window.crypto?.randomUUID?.()||Date.now()+"-"+Math.random().toString(36).slice(2));
      try{
        if(!await files.saveFile(id,file))throw Error("فشل حفظ الملف في IndexedDB؛ تحققي من مساحة المتصفح.");
        const db=storage.getDB();db.unlinkedFiles=db.unlinkedFiles||[];
        db.unlinkedFiles.unshift({id,userId:uid,title:name.value.trim()||file.name,fileName:file.name,
          size:file.size,mimeType:file.type||"application/octet-stream",note:note.value.trim(),uploadedAt:new Date().toISOString()});
        try{storage.saveDB(db);}catch(e){await files.deleteFile(id);throw e;}
        close();
        window.FTMAutoSync?.queueBackup("unlinked-file-saved");
        render();
        alert("success","تم حفظ الملف","أُضيف إلى «الملفات غير المرتبطة». سيبدأ نسخه سحابيًا تلقائيًا عند تفعيل اتصال GitHub.");
      }catch(error){alert("danger","تعذر الحفظ",error.message);}
      finally{save.disabled=false;}
    });
  }
  function preview(id){
    const item=get(id);
    if(!item||!safeId(id))return;
    // Full-page viewer avoids sandboxed iframe / PDF plugin failures in modal overlays.
    window.location.assign("ftm-file-viewer.html?file="+encodeURIComponent(id));
  }
  function link(id){
    const item=get(id);if(!item||!safeId(id))return;
    const criteria=storage.getDB().criteria||[];
    dialog("ربط الملف: "+item.title,
      '<div class="form-group"><label class="form-label" for="fuv-kind">جهة الربط</label><select id="fuv-kind" class="form-select"><option value="portfolio">ملف الإنجاز المهني</option><option value="performance">الأداء الوظيفي</option></select></div>'+
      '<div class="form-group" id="fuv-sect-box"><label class="form-label" for="fuv-sect">قسم ملف الإنجاز</label><select id="fuv-sect" class="form-select"></select></div>'+
      '<div class="form-group" id="fuv-crit-box" hidden><label class="form-label" for="fuv-crit">معيار الأداء</label><select id="fuv-crit" class="form-select"></select></div>'+
      '<div class="form-group"><label class="form-label" for="fuv-linked-title">عنوان الشاهد</label><input id="fuv-linked-title" class="form-control" maxlength="180"></div>'+
      '<div class="form-group"><label class="form-label" for="fuv-desc">وصف (اختياري)</label><textarea id="fuv-desc" class="form-control" rows="2" maxlength="800"></textarea></div>'+
      '<p class="text-muted">يُنقل سجل الملف إلى الوجهة المطلوبة، ويُستخدم الملف الأصلي نفسه من دون نسخة إضافية.</p>'+
      '<div class="ftm-unlinked-modal-actions"><button type="button" id="fuv-link-cancel" class="btn btn-ghost">إلغاء</button><button type="button" id="fuv-link-save" class="btn btn-primary">تأكيد الربط</button></div>');
    const kind=document.getElementById("fuv-kind"),sect=document.getElementById("fuv-sect"),crit=document.getElementById("fuv-crit");
    for(const section of portfolioSections){const opt=new Option(section,section);sect.add(opt);}
    for(const c of criteria){const opt=new Option(c.title,c.id);crit.add(opt);}
    document.getElementById("fuv-linked-title").value=item.title||item.fileName;
    document.getElementById("fuv-desc").value=item.note||"";
    const syncFields=()=>{document.getElementById("fuv-sect-box").hidden=kind.value==="performance";document.getElementById("fuv-crit-box").hidden=kind.value!=="performance";};
    kind.addEventListener("change",syncFields);syncFields();
    document.getElementById("fuv-link-cancel").addEventListener("click",close);
    const save=document.getElementById("fuv-link-save");
    save.addEventListener("click",async()=>{
      const performance=kind.value==="performance",title=document.getElementById("fuv-linked-title").value.trim(),description=document.getElementById("fuv-desc").value.trim();
      if(!title){alert("warning","عنوان مطلوب","أدخلي عنوان الشاهد.");return;}
      if(performance&&!criteria.some(c=>c.id===crit.value)){alert("warning","معيار مطلوب","اختاري معيارًا صحيحًا.");return;}
      save.disabled=true;
      try{
        if(!((await files.getFile(id))?.blob))throw Error("الملف الأصلي غير متاح؛ لم يُنفّذ الربط.");
        const db=storage.getDB(),original=(db.unlinkedFiles||[]).find(x=>x.id===id&&x.userId===userId());
        if(!original||db.portfolioItems?.some(x=>x.id===id))throw Error("هذا الملف لم يعد متاحًا للربط.");
        db.portfolioItems=db.portfolioItems||[];
        const section=performance?"شواهد الأداء الوظيفي":sect.value;
        db.portfolioItems.unshift({
          id,userId:original.userId,title,description,section,type:section,
          status:"معتمد وموثق",scopeType:"خاص بالمعلمة الحالية (رحلة البناء)",
          date:new Date().toLocaleDateString("ar-SA"),criteriaId:performance?crit.value:null,
          fileName:original.fileName,fileSize:fmt(original.size),attachmentType:original.mimeType,
          githubDownloadUrl:null,linkedFromUnlinked:true
        });
        db.unlinkedFiles=db.unlinkedFiles.filter(x=>x.id!==id);
        storage.saveDB(db);close();render();
        window.dispatchEvent(new Event("itqan:portfolioChanged"));
        alert("success","تم الربط",performance?"ظهر الملف مع شواهد معيار الأداء المحدد.":"ظهر الملف في سجل الإنجاز.");
      }catch(e){alert("danger","تعذر الربط",e.message);}
      finally{save.disabled=false;}
    });
  }
  function remove(id){
    const item=get(id);if(!item||!safeId(id))return;
    modal.confirm({type:"danger",title:"حذف الملف غير المرتبط",message:"هل تريدين حذف هذا الملف نهائيًا من المتصفح؟",confirmText:"نعم، حذف الملف",cancelText:"إلغاء",
      onConfirm:()=>{
        (async()=>{
          if(!await files.deleteFile(id))throw Error("تعذر حذف الملف المحلي.");
          const db=storage.getDB();db.unlinkedFiles=(db.unlinkedFiles||[]).filter(f=>f.id!==id||f.userId!==userId());
          storage.saveDB(db);render();alert("success","حُذف الملف","أُزيل الملف من الخزنة المحلية.");
        })().catch(e=>alert("danger","تعذر الحذف",e.message));
      }
    });
  }
  function init(){
    ["ftm-upload-unlinked","ftm-upload-unlinked-in-section"].forEach(id=>document.getElementById(id)?.addEventListener("click",openUpload));
    document.getElementById("ftm-unlinked-search")?.addEventListener("input",render);
    window.addEventListener("itqan:activeUserChanged",render);
    window.addEventListener("itqan:cloudSyncChanged",render);
    window.addEventListener("storage",render);
    render();
  }
  document.addEventListener("DOMContentLoaded",init);
  window.FTMUnlinkedFiles=Object.freeze({render,openUpload});
})();
