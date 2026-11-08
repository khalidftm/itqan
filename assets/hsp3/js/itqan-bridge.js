/* ITQAN ↔ HSP3 print bridge: viewer-only report, four accessible A4 templates. */
(function () {
  "use strict";

  const templateKey = "itqan-hsp3-print-template";
  const identityPrefix = "itqan-ftm-school-v1:";
  const defaults = Object.freeze({
    educationAdministrationName: "الإدارة العامة للتعليم بمنطقة مكة المكرمة",
    schoolName: "ابتدائية بحرة المجاهدين الخامسة ببحرة المجاهدين"
  });
  const value = input => String(input ?? "").trim();
  const savedIdentity = userId => {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(identityPrefix + userId) || "{}") || {}; } catch {}
    return {
      educationAdministrationName: value(stored.educationAdministrationName) || defaults.educationAdministrationName,
      schoolName: value(stored.schoolName) || defaults.schoolName
    };
  };

  function reportFromUser() {
    const storage = window.ItqanEngines?.StorageEngine;
    if (!storage) throw new Error("محرك بيانات إتقان غير متاح.");
    const user = storage.getCurrentUser();
    if (!user) throw new Error("لا توجد بيانات مستخدم نشط في هذا المتصفح.");
    const items = storage.getPortfolioForUser(user.id) || [];
    const name = value(user.name) || "المعلمة";
    const grade = value(user.gradeLevel);
    const subject = value(user.subjectName || user.specialization);
    const rows = items.map((item, index) => [
      String(index + 1),
      value(item.title) || "شاهد بدون عنوان",
      value(item.type || item.section) || "—",
      value(item.date) || "—",
      value(item.fileName) || "دون ملف"
    ]);
    if (!rows.length) rows.push(["—", "لم تُضف شواهد إلى ملف الإنجاز بعد", "—", "—", "—"]);
    return {
      identity:savedIdentity(user.id),
      report:{
        title:"ملف الإنجاز المهني — " + name +
          (subject ? " — " + subject : "") + (grade ? " — " + grade : ""),
        columns:["م", "عنوان الشاهد", "التصنيف", "التاريخ", "اسم الملف"],
        rows,
        statistics:[
          {label:"الشواهد",value:String(items.length)},
          {label:"المكونات المضمنة",value:String((user.includedLibraryIds || []).length)},
          {label:"التقييم الذاتي",value:String(user.selfEvaluationScore ?? "—") + "%"}
        ],
        extraComponents:[{
          kind:"notes",
          options:{text:"تم إعداد هذا الكشف في " + new Date().toLocaleDateString("ar-SA") +
            ". المرفقات محفوظة في ملف الإنجاز ولا تُضمّن ملفاتها الأصلية في هذا الكشف."}
        }],
        minTailRows:2
      }
    };
  }

  function getTemplate() {
    let stored = null;
    try { stored = localStorage.getItem(templateKey); } catch {}
    return window.HSP3?.profiles?.some(p => p.id === stored) ? stored : "official-portrait";
  }

  function openCurrentReport() {
    const manager = window.hspPrintManager;
    if (!manager) return;
    const note = document.getElementById("itqan-print-message");
    try {
      const {identity, report} = reportFromUser();
      manager.open({
        mode:"viewer",
        template:getTemplate(),
        educationAdministrationName:identity.educationAdministrationName,
        schoolName:identity.schoolName,
        report,
        components:{statistics:true,principal:false,signature:false,stamp:false,
          employee:false,review:false,notes:false,deputy:false,officer:false,
          employeeSignature:false,bullets:false}
      });
      const toolbarSelect = document.getElementById("itqan-template-switch");
      if (toolbarSelect) toolbarSelect.value = manager.select.value;
      if (note) note.textContent = "تظهر بيانات الشواهد المحفوظة في متصفحكِ. تعرض هذه المعاينة الكشف ولا تضمّن محتويات الملفات الأصلية.";
      if (window.matchMedia("(max-width: 760px)").matches) {
        // Run after the sheet has been measured; only screen zoom changes.
        manager.mode = "fit-width";
        manager.refresh();
      }
    } catch (error) {
      if (note) note.textContent = "تعذر إعداد الطباعة: " + error.message;
      console.error("[ITQAN-HSP3]",error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const manager = window.hspPrintManager;
    const toolbarSelect = document.getElementById("itqan-template-switch");
    if (!manager || !toolbarSelect) return;
    (window.HSP3?.profiles || []).forEach(profile => {
      toolbarSelect.add(new Option(profile.name, profile.id));
    });
    toolbarSelect.addEventListener("change", () => {
      manager.select.value = toolbarSelect.value;
      try { localStorage.setItem(templateKey, toolbarSelect.value); } catch {}
      manager.mode = "fit-width";
      manager.refresh();
    });
    document.getElementById("itqan-reopen-print")?.addEventListener("click", openCurrentReport);
    openCurrentReport();
  });
})();
