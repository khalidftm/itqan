/* Standalone, same-origin viewer for PDF and images in FTM IndexedDB. */
document.addEventListener("DOMContentLoaded", async () => {
  "use strict";
  const engines=window.ItqanEngines;
  const status=document.getElementById("ftm-viewer-status");
  const section=document.getElementById("ftm-viewer-section");
  const content=document.getElementById("ftm-viewer-content");
  const tools=document.getElementById("ftm-viewer-tools");
  const help=document.getElementById("ftm-viewer-help");
  const showError=message=>{
    status.textContent=message;status.dataset.state="error";
    section.hidden=true;
  };
  try {
    if(!engines?.StorageEngine || !engines?.IndexedDBFileStore)throw Error("تعذر تشغيل خزنة ملفات المتصفح.");
    const id=new URLSearchParams(location.search).get("file")||"";
    if(!/^[a-zA-Z0-9_-]{1,120}$/.test(id))throw Error("رابط الملف غير صالح.");
    const user=engines.StorageEngine.getCurrentUser();
    if(!user?.id)throw Error("لا توجد جلسة معلمة نشطة. افتحي ملف الإنجاز أولًا.");
    const db=engines.StorageEngine.getDB();
    const linked=(db.portfolioItems||[]).find(item=>String(item.id)===id&&item.userId===user.id);
    const pending=(db.unlinkedFiles||[]).find(item=>String(item.id)===id&&item.userId===user.id);
    const item=linked||pending;
    if(!item)throw Error("الملف غير موجود ضمن ملفات حساب المعلمة الحالي.");
    const record=await engines.IndexedDBFileStore.getFile(id);
    if(!record?.blob || typeof record.blob.arrayBuffer!=="function") {
      throw Error("الملف محفوظ في السجل لكن النسخة الأصلية غير موجودة على هذا الجهاز. أعيدي رفعه أو استعادته من نسخة احتياطية.");
    }
    const name=String(record.name||item.fileName||"ملف");
    const mime=String(record.type||record.blob.type||item.mimeType||"").toLowerCase();
    const isPdf=mime.includes("pdf")||/\.pdf$/i.test(name);
    const isImage=["image/png","image/jpeg","image/webp","image/gif","image/bmp"].includes(mime)||/\.(jpe?g|png|webp|gif|bmp)$/i.test(name);
    const url=URL.createObjectURL(record.blob);
    window.addEventListener("pagehide",()=>URL.revokeObjectURL(url),{once:true});
    document.getElementById("ftm-viewer-name").textContent=item.title||name;
    document.getElementById("ftm-viewer-details").textContent=name+" • "+Math.ceil((record.size||record.blob.size||0)/1024)+" KB";
    document.getElementById("ftm-viewer-subtitle").textContent=linked?"شاهد مرتبط بملف الإنجاز أو الأداء":"ملف غير مرتبط";
    const open=document.getElementById("ftm-viewer-open");
    open.href=url;
    const download=document.getElementById("ftm-viewer-download");
    download.href=url;download.download=name;
    if(isImage){
      const image=document.createElement("img");
      image.alt=item.title||name;image.src=url;
      image.onerror=()=>{content.replaceChildren();content.append(Object.assign(document.createElement("p"),{textContent:"تعذر عرض الصورة. جرّبي فتح الملف في تبويب المتصفح."}));};
      content.append(image);
      help.textContent="تُعرض الصورة مباشرة من المتصفح، دون إرسالها إلى أي خادم أو تنزيلها إلى جهازك.";
    }else if(isPdf){
      const frame=document.createElement("iframe");
      frame.title="معاينة ملف PDF";frame.src=url;
      // No iframe sandbox: Chrome's built-in PDF viewer can fail inside sandboxed blob frames.
      content.append(frame);
      help.textContent="إن لم تظهر صفحات PDF داخل النافذة، استخدمي «فتح في تبويب المتصفح دون تنزيل». يعتمد عرض PDF على دعم المتصفح، وتبقى نسخة الملف الأصلية محفوظة في IndexedDB.";
    }else{
      content.append(Object.assign(document.createElement("p"),{
        textContent:"لا تتوفر معاينة مدمجة لهذا النوع من الملفات. يمكنك فتحه ببرنامج مناسب أو تنزيله."
      }));
      open.hidden=true;
      help.textContent="المعاينة المباشرة متاحة للصور وPDF، أما المستندات الأخرى فقد تحتاج برنامجًا متخصصًا.";
    }
    status.hidden=true;section.hidden=false;tools.hidden=false;
  }catch(error){
    showError(error.message||"تعذّر فتح هذا الملف.");
  }
});
