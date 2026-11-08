/* Bridge from ITQAN teacher portfolio to the isolated HSP3 print manager.
   It reads current local metadata and does not transmit or embed actual files. */
(function () {
  "use strict";
  const selectedTemplateKey = "itqan-hsp3-print-template";
  const safe = value => String(value ?? "").trim();
  function buildReport() {
    const storage = window.ItqanEngines?.StorageEngine;
    if (!storage) throw new Error("تعذر قراءة بيانات إتقان. افتح الصفحة من نفس نطاق ملف الإنجاز.");
    const user = storage.getCurrentUser();
    if (!user) throw new Error("لا توجد جلسة مستخدم متاحة في هذا المتصفح.");
    const items = storage.getPortfolioForUser(user.id) || [];
    const school = storage.getSchoolById(user.schoolId);
    const name = safe(user.name) || "المعلمة";
    const date = new Date().toLocaleDateString("ar-SA");
    const columns = ["م", "عنوان الشاهد", "التصنيف", "التاريخ", "الملف"];
    const rows = items.map((item, index) => [
      String(index + 1),
      safe(item.title) || "شاهد بلا عنوان",
      safe(item.type || item.section) || "—",
      safe(item.date) || "—",
      safe(item.fileName) || "لا يوجد ملف مرفق"
    ]);
    if (!rows.length) rows.push(["—", "لم تُضف شواهد إلى ملف الإنجاز بعد", "—", "—", "—"]);
    const grade = safe(user.gradeLevel);
    const subject = safe(user.subjectName || user.specialization);
    return {
      schoolName: safe(school?.name) || "اسم المدرسة",
      report: {
        title: "ملف الإنجاز المهني — " + name + (subject ? " — " + subject : "") + (grade ? " — " + grade : ""),
        columns, rows,
        statistics: [
          {label:"الشواهد الموثقة",value:String(items.length)},
          {label:"مكونات المكتبة",value:String((user.includedLibraryIds || []).length)},
          {label:"التقييم الذاتي",value:String(user.selfEvaluationScore ?? "—") + "%"}
        ],
        extraComponents: [{kind:"notes",options:{text:"طُبع هذا الكشف بتاريخ " + date + ". الوثائق الأصلية محفوظة في ملف إنجاز المستخدم ولا تُدرج تلقائيًا داخل الطباعة."}}],
        minTailRows:2
      }
    };
  }
  function launch() {
    const manager = window.hspPrintManager;
    if (!manager) return;
    const note = document.getElementById("itqan-print-message");
    try {
      const {schoolName, report} = buildReport();
      const flags = {statistics:true,principal:false,signature:false,stamp:false,employee:false,review:false,notes:false,deputy:false,officer:false,employeeSignature:false,bullets:false};
      let template = "official-portrait";
      try { template = localStorage.getItem(selectedTemplateKey) || template; } catch {}
      manager.open({
        mode:"design",
        template,
        schoolName,
        educationAdministrationName:"اسم إدارة التعليم",
        components:flags,
        report
      });
      const select = document.getElementById("hsp-print-template");
      select?.addEventListener("change", () => {
        try { localStorage.setItem(selectedTemplateKey, select.value); } catch {}
      });
      if (note) note.textContent = "تستخدم الطباعة أسماء الشواهد ومعلومات حسابك المحفوظة محليًا، مع إبقاء الملفات الأصلية دون إرسال.";
    } catch (error) {
      if (note) note.textContent = "تعذر تجهيز بيانات ملف الإنجاز: " + error.message;
      console.error("[ITQAN-HSP3]",error);
    }
  }
  document.addEventListener("DOMContentLoaded", launch);
})();
