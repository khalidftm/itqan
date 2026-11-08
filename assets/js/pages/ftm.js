/* FTM school identity is page-local and does not rewrite shared school records. */
(() => {
  "use strict";
  const prefix = "itqan-ftm-school-v1:";
  const defaults = Object.freeze({
    educationAdministrationName: "الإدارة العامة للتعليم بمنطقة مكة المكرمة",
    schoolName: "ابتدائية بحرة المجاهدين الخامسة ببحرة المجاهدين"
  });
  const currentUserId = () => window.ItqanEngines?.StorageEngine?.getCurrentUser()?.id || "default";
  const key = userId => prefix + (userId || currentUserId());
  const get = userId => {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(key(userId)) || "{}") || {}; } catch {}
    const educationAdministrationName = typeof raw.educationAdministrationName === "string" && raw.educationAdministrationName.trim()
      ? raw.educationAdministrationName.trim() : defaults.educationAdministrationName;
    const schoolName = typeof raw.schoolName === "string" && raw.schoolName.trim()
      ? raw.schoolName.trim() : defaults.schoolName;
    return {educationAdministrationName, schoolName};
  };
  const save = (values, userId) => {
    const clean = {
      educationAdministrationName: String(values.educationAdministrationName || "").trim().slice(0, 160),
      schoolName: String(values.schoolName || "").trim().slice(0, 160)
    };
    if (!clean.educationAdministrationName || !clean.schoolName) throw new Error("اسم الإدارة التعليمية والمدرسة مطلوبان.");
    localStorage.setItem(key(userId), JSON.stringify(clean));
    return clean;
  };
  window.ITQAN_FTM_IDENTITY = Object.freeze({defaults, get, save});
})();

/* FTM menu: three persisted desktop modes and mobile drawer. */
document.addEventListener('DOMContentLoaded', () => {
  const modal = window.ItqanEngines?.ModalEngine;
  if (!modal) return;
  const menu = document.getElementById('ftm-menu-toggle');
  const dimmer = document.getElementById('ftm-menu-backdrop');
  const sidebar = document.getElementById('ftm-sidebar');
  const store = document.getElementById('tab-portfolio');
  const modes = ['expanded', 'icons', 'hidden'];
  const storageKey = 'itqan-ftm-sidebar-mode-v1';
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let currentMode = 'expanded';
  let moved = null;
  let focusBefore = null;
  const readMode = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
  const saveMode = mode => { try { localStorage.setItem(storageKey, mode); } catch { /* restricted browser storage */ } };
  function setDrawer(open) {
    document.body.classList.toggle('ftm-menu-open', open);
    if (dimmer) dimmer.hidden = !open;
    if (menu) menu.setAttribute('aria-expanded', String(open));
    if (mobileQuery.matches) sidebar?.setAttribute('aria-hidden', String(!open));
  }
  function applyMode(mode, persist = true) {
    currentMode = modes.includes(mode) ? mode : 'expanded';
    modes.forEach(value => document.body.classList.toggle('ftm-sidebar-' + value, value === currentMode));
    if (persist) saveMode(currentMode);
    if (!mobileQuery.matches) {
      if (menu) {
        const next = modes[(modes.indexOf(currentMode) + 1) % modes.length];
        menu.title = 'القائمة: ' + ({expanded:'كاملة',icons:'أيقونات فقط',hidden:'مخفية'}[currentMode]) + ' — اضغط للتبديل إلى ' + ({expanded:'كاملة',icons:'أيقونات فقط',hidden:'مخفية'}[next]);
        menu.setAttribute('aria-label',menu.title);
        menu.setAttribute('aria-expanded',String(currentMode !== 'hidden'));
      }
      sidebar?.setAttribute('aria-hidden', String(currentMode === 'hidden'));
      setDrawer(false);
      if (menu) menu.setAttribute('aria-expanded', String(currentMode !== 'hidden'));
    } else {
      menu?.setAttribute('aria-label', 'فتح أو إغلاق قائمة التنقل');
      menu?.setAttribute('title', 'فتح أو إغلاق القائمة');
      setDrawer(false);
    }
  }
  menu?.addEventListener('click', () => {
    if (mobileQuery.matches) setDrawer(!document.body.classList.contains('ftm-menu-open'));
    else applyMode(modes[(modes.indexOf(currentMode) + 1) % modes.length]);
  });
  dimmer?.addEventListener('click',() => setDrawer(false));
  mobileQuery.addEventListener?.('change',() => applyMode(currentMode, false));
  applyMode(readMode() || 'expanded', false);

  // This is a deployment/version indicator, NOT a user-data modification timestamp.
  // A version is marked current only if its manifest is served by GitHub Pages
  // and matches the current source manifest on GitHub main.
  const releaseBadge = document.getElementById("ftm-last-update");
  const releaseText = releaseBadge?.querySelector(".ftm-last-update-label");
  const formatCodeDate = iso => {
    const parsed = new Date(iso);
    if (!Number.isFinite(parsed.getTime())) throw new Error("تاريخ إصدار غير صالح");
    return new Intl.DateTimeFormat("ar-SA", {
      timeZone:"Asia/Riyadh",year:"numeric",month:"2-digit",day:"2-digit",
      hour:"2-digit",minute:"2-digit"
    }).format(parsed);
  };
  const printReleaseStatus = (status,description) => {
    if (releaseText) releaseText.textContent = status;
    if (releaseBadge) {
      releaseBadge.title = description || status;
      releaseBadge.setAttribute("aria-label", status);
    }
  };
  async function verifyRelease() {
    printReleaseStatus("جارٍ التحقق من نشر الصفحة...", "فحص نسخة الكود المنشورة على GitHub Pages");
    const cacheBust = String(Date.now());
    try {
      const publicUrl = new URL("assets/ftm-release.json", location.href);
      publicUrl.searchParams.set("v",cacheBust);
      const response = await fetch(publicUrl.href, {cache:"no-store"});
      if (!response.ok) throw new Error("لم يصل ملف إصدار الصفحة إلى الاستضافة بعد");
      const published = await response.json();
      if (typeof published.version !== "string" || !published.updatedAt) {
        throw new Error("بيانات الإصدار المنشور غير مكتملة");
      }
      const publishedTime = formatCodeDate(published.updatedAt);
      const base = "تحديث الصفحة: " + publishedTime;
      try {
        const mainUrl = new URL("https://raw.githubusercontent.com/khalidftm/itqan/main/assets/ftm-release.json");
        mainUrl.searchParams.set("v",cacheBust);
        const upstreamResponse = await fetch(mainUrl.href,{cache:"no-store"});
        if (!upstreamResponse.ok) throw new Error("تعذر قراءة إصدار GitHub");
        const main = await upstreamResponse.json();
        if (main.version === published.version) {
          printReleaseStatus(base + " ✓", "آخر نسخة برمجية على GitHub Pages مطابقة لملف الإصدار الموجود في المستودع. التاريخ هو تاريخ تحديث الكود، وليس وقت انتهاء النشر.");
        } else {
          printReleaseStatus(base + " • تحديث أحدث بانتظار النشر", "نسخة المستودع أحدث من النسخة التي وصلت إلى GitHub Pages. حدّث الصفحة بعد اكتمال النشر.");
        }
      } catch (error) {
        printReleaseStatus(base + " • لم تُقارن بالمستودع", "تم تحميل بيانات الإصدار من GitHub Pages، لكن تعذر مقارنة النسخة بمستودع GitHub: " + error.message);
      }
    } catch (error) {
      printReleaseStatus("تعذر التحقق من نشر آخر إصدار", error.message + ". تأكد من الاتصال أو أعد المحاولة.");
    }
  }
  document.getElementById("ftm-release-check")?.addEventListener("click", verifyRelease);
  verifyRelease();
  window.addEventListener("storage",event => {
    if (event.key?.startsWith("itqan-ftm-school-v1:")) renderSchool();
  });

  function renderSchool() {
    const values = window.ITQAN_FTM_IDENTITY.get();
    const education = document.getElementById("ftm-education-display");
    const school = document.getElementById("ftm-school-display");
    if (education) education.textContent = values.educationAdministrationName;
    if (school) school.textContent = values.schoolName;
    document.querySelectorAll(".js-user-school").forEach(node => { node.textContent = values.schoolName; });
  }
  renderSchool();
  function escapeAttr(value) {
    return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function editSchool() {
    if (mobileQuery.matches) setDrawer(false);
    const values = window.ITQAN_FTM_IDENTITY.get();
    modal.open({
      type:"form", title:"تحديث بيانات إدارة التعليم والمدرسة", size:"lg",
      html:`<div class="form-group"><label class="form-label" for="ftm-input-education">الإدارة العامة للتعليم</label><input id="ftm-input-education" class="form-control" type="text" maxlength="160" required value="${escapeAttr(values.educationAdministrationName)}"></div>
       <div class="form-group"><label class="form-label" for="ftm-input-school">اسم المدرسة</label><input id="ftm-input-school" class="form-control" type="text" maxlength="160" required value="${escapeAttr(values.schoolName)}"></div>
       <p class="text-muted">تُحفظ هذه البيانات في متصفحكِ لهذا المستخدم وتظهر في ترويسة الطباعة. لا تُعدّل سجلات المدارس العامة.</p>`,
      showCancel:true,cancelText:"إلغاء",confirmText:"حفظ البيانات",
      onConfirm:() => {
        const educationAdministrationName = document.getElementById("ftm-input-education")?.value.trim();
        const schoolName = document.getElementById("ftm-input-school")?.value.trim();
        try {
          window.ITQAN_FTM_IDENTITY.save({educationAdministrationName,schoolName});
          renderSchool();
          // This is a data edit, not a software release.
          window.dispatchEvent(new Event("itqan:ftmIdentityChanged"));
          window.ItqanEngines?.ToastEngine?.show({type:"success",title:"تم حفظ بيانات المدرسة",message:"تُستخدم البيانات المحفوظة في ملف الإنجاز ومعاينة الطباعة."});
        } catch (err) {
          window.ItqanEngines?.ToastEngine?.show({type:"warning",title:"تعذر الحفظ",message:err.message});
          return false;
        }
      }
    });
    document.getElementById("ftm-input-education")?.focus();
  }
  document.getElementById("ftm-edit-school")?.addEventListener("click",editSchool);
  document.getElementById("ftm-edit-school-inline")?.addEventListener("click",editSchool);
  const guideMarkup = `
    <div class="ftm-guide">
      <ol>
        <li><strong>تحديث بيانات المدرسة:</strong> افتحي «بيانات المدرسة»، عدّلي اسم إدارة التعليم والمدرسة، ثم «حفظ البيانات». ستظهر القيم في القوالب الأربعة.</li>
        <li><strong>تحديث السيرة الذاتية:</strong> اختاري «السيرة الذاتية»، ثم «تحرير وتحديث بطاقة السيرة الذاتية»، أدخلي المعلومات واضغطي زر الحفظ.</li>
        <li><strong>رفع شاهد أو تقرير:</strong> اضغطي «إضافة شاهد» أو «رفع الملفات والشواهد»، واختاري ملف PDF أو Word أو Excel أو صورة، ثم حددي القسم ومعيار الأداء، واكتبي عنوانًا ووصفًا واضحين، واضغطي «حفظ الملف وتوثيق الشاهد».</li>
        <li><strong>مراجعة الملفات:</strong> افتحي «سجل الشواهد والملفات» لمعاينة المرفقات أو تنزيلها أو حذف شاهد. يُحفظ الملف محليًا في IndexedDB على هذا الجهاز.</li>
        <li><strong>حفظ التقييم:</strong> افتحي «معايير الأداء»، حدّثي درجاتكِ، ثم اضغطي «حفظ واعتماد التقييم الذاتي».</li>
        <li><strong>الطباعة والتقارير:</strong> افتحي «قوالب الطباعة»، واختاري الرسمي أو المصوّر، طوليًا أو عرضيًا، ثم اختاري «طباعة» أو «تصدير PDF» من معاينة المتصفح. المعاينة الحالية تعرض سجل الشواهد وبياناتها، وليس محتوى المرفقات نفسه.</li>
        <li><strong>نسخة سحابية اختيارية:</strong> استخدمي «مزامنة GitHub» بعد ضبط إعداداتها إن احتجتِ لها. تأكدي أن المستودع خاص ومصرح برفع هذه البيانات إليه، ولا ترفعي بيانات الطالبات الحساسة إلى مستودع عام.</li>
      </ol>
      <p class="text-muted">يعرض أسفل القائمة موعد آخر حفظ محلي مسجّل. لا يدل هذا التاريخ على نجاح المزامنة السحابية.</p>
    </div>`;
  document.getElementById("ftm-open-guide")?.addEventListener("click",() => {
    if (mobileQuery.matches) setDrawer(false);
    modal.open({type:"info",title:"دليل العمل على ملف الإنجاز",size:"lg",html:guideMarkup,confirmText:"إغلاق"});
  });

  const originalOpen = modal.open.bind(modal);
  const originalClose = modal.close.bind(modal);
  const restore = () => { if (moved) { store.appendChild(moved); moved = null; } };
  modal.open = function(options) { restore(); return originalOpen(options); };
  modal.close = function() {
    const active = Boolean(moved);
    restore();
    const result = originalClose();
    if (active && focusBefore?.isConnected) focusBefore.focus();
    return result;
  };
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape') return;
    if (document.body.classList.contains('ftm-menu-open')) setDrawer(false);
    else if (moved) modal.close();
  });
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-workspace-tab]').forEach(item=>{
      item.toggleAttribute('aria-current', item === button);
      item.classList.toggle('active',item === button);
    });
    setDrawer(false);
    window.scrollTo({top:0,behavior:'auto'});
  }));
  function showPanel(kind, trigger) {
    const element=kind==='upload'
      ? document.getElementById('direct-file-dropzone')?.closest('.card')
      : document.getElementById('portfolio-items-grid')?.closest('.card');
    if(!element)return;
    focusBefore=trigger;
    restore();
    modal.open({type:'info',title:kind==='upload'?'مركز رفع الملفات والشواهد':'سجل الشواهد والملفات',html:'<div id="ftm-panel-slot"></div>',hideFooter:true,size:'lg'});
    const root=modal.ensureContainer();
    root.querySelector('#unified-modal-dialog')?.classList.add('ftm-dialog');
    root.querySelector('#ftm-panel-slot')?.appendChild(element);
    moved=element;
    setDrawer(false);
    root.querySelector('#unified-modal-close-x')?.focus();
  }
  document.querySelectorAll('[data-ftm-panel]').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.ftmPanel,button)));
});
