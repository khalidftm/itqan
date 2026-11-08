/**
 * ============================================================================
 * HOME PAGE SCRIPT (assets/js/pages/home.js)
 * منطق الصفحة الرئيسية والتفاعل مع المحركات الموحدة والنماذج الثلاثة
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const {
    GenderEngine,
    ModalEngine,
    BannerEngine,
    ToastEngine,
    StorageEngine,
    AuthEngine,
    PrintEngine,
    MessageEngine,
    ThemeEngine
  } = window.ItqanEngines;

  // 1. عرض رسالة داخلية ترحيبية موحدة قابلة للإغلاق بزر (×)
  BannerEngine.render('#home-inline-alerts', {
    type: 'info',
    title: 'مرحباً بك في النسخة المركزية لمنصة إتقان (التعليم العام بالمملكة العربية السعودية)',
    message: 'تم تفعيل المحركات الموحدة (محرك النوافذ Modal، محرك الرسائل الداخلية بزر الإغلاق X، محرك التأنيث والتذكير، ومحرك الطباعة الرسمي A4). يمكنك التبديل بين النماذج التصميمية الـ 3 من البطاقات أدناه أو من الشريط السفلي.'
  });

  // 2. تحديث الإحصائيات الحية من ذاكرة المتصفح (StorageEngine)
  function renderLiveStats() {
    const schools = StorageEngine.getSchools();
    const users = StorageEngine.getUsers();
    const db = StorageEngine.getDB();

    const schoolsCountEl = document.getElementById('stat-schools-count');
    const usersCountEl = document.getElementById('stat-users-count');
    const portfolioCountEl = document.getElementById('stat-portfolio-count');

    if (schoolsCountEl) schoolsCountEl.textContent = schools.length;
    if (usersCountEl) usersCountEl.textContent = users.length;
    if (portfolioCountEl) portfolioCountEl.textContent = (db.portfolioItems || []).length;
  }

  renderLiveStats();

  // 3. بطاقات اختيار النموذج التصميمي (1 / 2 / 3) في الصفحة الرئيسية
  function syncModelCards() {
    const activeModel = ThemeEngine.getCurrentModel();
    document.querySelectorAll('.model-selector-card').forEach((card) => {
      const cardModel = card.getAttribute('data-model-card');
      card.classList.toggle('is-selected', cardModel === activeModel);
    });
  }

  document.querySelectorAll('.model-selector-card').forEach((card) => {
    card.addEventListener('click', () => {
      const modelId = card.getAttribute('data-model-card');
      ThemeEngine.setModel(modelId, true);
      syncModelCards();
    });
  });

  window.addEventListener('itqan:modelChanged', syncModelCards);
  syncModelCards();

  // 4. أزرار تجربة المحركات الموحدة مباشرة من الصفحة الرئيسية
  const btnTestSuccessModal = document.getElementById('btn-demo-modal-success');
  if (btnTestSuccessModal) {
    btnTestSuccessModal.addEventListener('click', () => {
      ModalEngine.alert({
        type: 'success',
        title: 'نموذج نافذة نجاح موحدة (بدون Alert)',
        message: 'تم اعتماد شواهد الأداء الوظيفي وربطها بملف الإنجاز المهني بنجاح وفق الهوية اللونية المعتمدة.'
      });
    });
  }

  const btnTestWarningModal = document.getElementById('btn-demo-modal-warning');
  if (btnTestWarningModal) {
    btnTestWarningModal.addEventListener('click', () => {
      ModalEngine.alert({
        type: 'warning',
        title: 'تنبيه مراجعة البنود الوزارية',
        message: 'يرجى التأكد من إرفاق شاهد واحد على الأقل لبند "تحسين نتائج المتعلمين" قبل إرسال الملف للاعتماد النهائي.'
      });
    });
  }

  const btnTestConfirmModal = document.getElementById('btn-demo-modal-confirm');
  if (btnTestConfirmModal) {
    btnTestConfirmModal.addEventListener('click', () => {
      ModalEngine.confirm({
        type: 'confirm',
        title: 'تأكيد رفع ملف الإنجاز للاعتماد',
        message: 'هل ترغب في إرسال ملف الإنجاز المهني وبطاقة الأداء الوظيفي إلى إدارة المدرسة للمراجعة والاعتماد الرسمي؟',
        confirmText: 'نعم، إرسال للاعتماد',
        cancelText: 'مراجعة الملف أولاً',
        onConfirm: () => {
          ModalEngine.execute({
            title: 'جاري إرسال وتوثيق الملف...',
            message: 'يتم الآن فحص اكتمال البنود الـ 11 وتوليد رقم التوثيق الإلكتروني...',
            duration: 950,
            successTitle: 'تم الإرسال والاعتماد المبدئي',
            successMessage: 'تم إرسال ملف الإنجاز بنجاح وإشعار إدارة المدرسة عبر محرك الرسائل الداخلي.'
          });
        }
      });
    });
  }

  const btnTestInlineBanner = document.getElementById('btn-demo-inline-banner');
  if (btnTestInlineBanner) {
    btnTestInlineBanner.addEventListener('click', () => {
      const types = ['success', 'warning', 'danger', 'info'];
      const pick = types[Math.floor(Math.random() * types.length)];
      const titles = {
        success: 'رسالة نجاح داخلية موحدة (مع زر إغلاق X)',
        warning: 'رسالة تحذير داخلية موحدة (مع زر إغلاق X)',
        danger: 'رسالة تنبيه هام داخلية (مع زر إغلاق X)',
        info: 'رسالة إرشادية داخلية موحدة (مع زر إغلاق X)'
      };
      BannerEngine.render('#home-inline-alerts', {
        type: pick,
        title: titles[pick],
        message: 'هذه الرسالة تم توليدها عبر محرك الرسائل الداخلية الموحد (BannerEngine). يمكنك إغلاقها بالضغط على زر (×) في الزاوية اليسرى.'
      });
    });
  }

  const btnTestPrint = document.getElementById('btn-demo-print-engine');
  if (btnTestPrint) {
    btnTestPrint.addEventListener('click', () => {
      const gender = GenderEngine.getCurrentGender();
      const sampleUser = StorageEngine.getUsers().find((u) => u.jobRole === 'teacher' && u.gender === gender) || StorageEngine.getUsers()[1];
      PrintEngine.previewAndPrint(sampleUser, 'full');
    });
  }

  const btnTestMsg = document.getElementById('btn-demo-message-engine');
  if (btnTestMsg) {
    btnTestMsg.addEventListener('click', () => {
      MessageEngine.openComposeModal();
    });
  }

  // 5. أزرار الدخول السريع المباشر بالحسابات التجريبية (معلم، معلمة، مدير مدرسة، مديرة مدرسة، مدير النظام)
  document.querySelectorAll('[data-quick-login-user]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const userId = btn.getAttribute('data-quick-login-user');
      const res = AuthEngine.loginByUserId(userId);
      if (res.ok) {
        ModalEngine.execute({
          title: 'جاري تهيئة الجلسة وتوجيه المستخدم...',
          message: `مرحباً ${res.user.name} — يتم الآن ضبط محرك التأنيث والتذكير والهوية البصرية وتوجيهك إلى صفحتك...`,
          duration: 750,
          successTitle: 'تم الدخول بنجاح',
          successMessage: 'جاري الانتقال الآن...',
          onComplete: () => {
            window.location.href = res.redirectUrl;
          }
        });
      }
    });
  });
});
