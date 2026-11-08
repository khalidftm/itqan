/**
 * ============================================================================
 * AUTH PAGES SCRIPT (assets/js/pages/auth.js)
 * منطق صفحتي تسجيل الدخول (login.html) والتسجيل الجديد (register.html)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const {
    GenderEngine,
    ModalEngine,
    BannerEngine,
    ToastEngine,
    StorageEngine,
    AuthEngine
  } = window.ItqanEngines;

  // 1. رسالة إرشادية موحدة قابلة للإغلاق بزر (×)
  const alertBox = document.getElementById('auth-inline-alerts');
  if (alertBox) {
    const isRegisterPage = Boolean(document.getElementById('register-form'));
    BannerEngine.render(alertBox, {
      type: 'info',
      title: isRegisterPage
        ? 'إنشاء حساب تربوي جديد مرتبط بالمدرسة ومحرك الهوية الجنسية'
        : 'نظام الدخول الذكي والتوجيه التلقائي حسب الصلاحية والمهمة',
      message: isRegisterPage
        ? 'اختر الجنس (ذكر / أنثى) لملاحظة تحول المسميات الوظيفية والهوية البصرية تلقائياً عبر محرك التأنيث والتذكير.'
        : 'يقوم النظام بفحص تصنيف الحساب وتوجيه (مدير النظام/مالك الموقع) إلى لوحة الإدارة المركزية، وتوجيه (المعلم/المعلمة أو مدير/مديرة المدرسة) إلى صفحة المستخدم المخصصة.'
    });
  }

  // 2. منطق صفحة تسجيل الدخول (login.html)
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value.trim();

      const res = AuthEngine.login(identifier, password);
      if (!res.ok) {
        BannerEngine.render('#auth-inline-alerts', {
          type: 'danger',
          title: 'تعذر تسجيل الدخول',
          message: res.error,
          clearPrevious: false
        });
        ModalEngine.alert({
          type: 'danger',
          title: 'بيانات الدخول غير صحيحة',
          message: res.error
        });
        return;
      }

      const roleTitle = GenderEngine.jobTitle(res.user.jobRole, res.user.gender);
      ModalEngine.execute({
        title: 'جاري التحقق وتوجيه الحساب...',
        message: `تم التحقق من حساب: ${res.user.name} (${roleTitle}). جاري الانتقال إلى الواجهة المخصصة...`,
        duration: 850,
        successTitle: 'تم تسجيل الدخول بنجاح',
        successMessage: `مرحباً بك في منصة إتقان — جاري فتح صفحتك الآن...`,
        onComplete: () => {
          window.location.href = res.redirectUrl;
        }
      });
    });

    // أزرار تعبئة ودخول سريع للحسابات التجريبية الخمسة
    document.querySelectorAll('[data-demo-login]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const userId = btn.getAttribute('data-demo-login');
        const user = StorageEngine.getUsers().find((u) => u.id === userId);
        if (!user) return;

        document.getElementById('login-identifier').value = user.nationalId;
        document.getElementById('login-password').value = user.password;
        GenderEngine.setPreviewGender(user.gender);

        const res = AuthEngine.loginByUserId(userId);
        if (res.ok) {
          const roleTitle = GenderEngine.jobTitle(user.jobRole, user.gender);
          ModalEngine.execute({
            title: `دخول سريع: ${roleTitle}`,
            message: `جاري الدخول بحساب (${user.name}) وتطبيق هوية ${user.gender === 'female' ? 'المؤنث' : 'المذكر'}...`,
            duration: 800,
            successTitle: 'تم التوجيه بنجاح',
            successMessage: 'جاري الانتقال إلى لوحة العمل...',
            onComplete: () => {
              window.location.href = res.redirectUrl;
            }
          });
        }
      });
    });
  }

  // 3. منطق صفحة التسجيل الجديد (register.html)
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const schoolSelect = document.getElementById('reg-school');
    const genderInputs = document.querySelectorAll('[data-reg-gender]');
    const roleCards = document.querySelectorAll('[data-reg-role]');
    let selectedGender = GenderEngine.getCurrentGender();
    let selectedJobRole = 'teacher';

    function populateSchoolOptions(genderFilter) {
      if (!schoolSelect) return;
      const schools = StorageEngine.getSchools();
      const filtered = schools.filter((s) => !genderFilter || s.genderType === genderFilter);
      const list = filtered.length ? filtered : schools;
      schoolSelect.innerHTML = list
        .map((s) => `<option value="${s.id}">${s.name} — (${s.region})</option>`)
        .join('');
    }

    function updateGenderAndRoleUI(gender) {
      selectedGender = gender;
      GenderEngine.setPreviewGender(gender);
      populateSchoolOptions(gender);

      genderInputs.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-reg-gender') === gender);
      });
    }

    genderInputs.forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = btn.getAttribute('data-reg-gender');
        updateGenderAndRoleUI(g);
      });
    });

    roleCards.forEach((card) => {
      card.addEventListener('click', () => {
        selectedJobRole = card.getAttribute('data-reg-role');
        roleCards.forEach((c) => c.classList.toggle('active', c === card));
      });
    });

    // تهيئة أولية
    updateGenderAndRoleUI(selectedGender);

    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const nationalId = document.getElementById('reg-national-id').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const specialization = document.getElementById('reg-specialization').value.trim();
      const rank = document.getElementById('reg-rank').value;
      const schoolId = document.getElementById('reg-school').value;
      const password = document.getElementById('reg-password').value.trim();

      if (!name || !nationalId || !email || !password) {
        BannerEngine.render('#auth-inline-alerts', {
          type: 'warning',
          title: 'حقول مطلوبة غير مكتملة',
          message: 'يرجى تعبئة الاسم الرباعي ورقم الهوية والبريد الإلكتروني وكلمة المرور.'
        });
        return;
      }

      // التحقق من عدم تكرار رقم الهوية
      const exists = StorageEngine.getUsers().some((u) => u.nationalId === nationalId);
      if (exists) {
        ModalEngine.alert({
          type: 'warning',
          title: 'رقم الهوية مسجل مسبقاً',
          message: 'يوجد حساب مسجل بنفس رقم الهوية الوطنية في ذاكرة المتصفح. يمكنك تسجيل الدخول مباشرة.'
        });
        return;
      }

      const newUser = StorageEngine.addUser({
        name,
        nationalId,
        email,
        password,
        systemRole: 'user',
        jobRole: selectedJobRole,
        gender: selectedGender,
        schoolId,
        specialization: specialization || 'تربوي عام',
        rank: rank || GenderEngine.jobTitle(selectedJobRole, selectedGender)
      });

      // إضافة شاهد ترحيبي أولي في ملف الإنجاز للمستخدم الجديد
      StorageEngine.addPortfolioItem({
        userId: newUser.id,
        section: 'السيرة المهنية والرؤية التربوية',
        title: `وثيقة الرؤية والرسالة المهنية — ${name}`,
        type: 'وثيقة أساسية',
        attachmentType: 'PDF معتمد',
        description: 'تم إنشاؤها تلقائياً عند تأسيس ملف الإنجاز المهني في منصة إتقان.'
      });

      StorageEngine.saveSessionUser(newUser);

      ModalEngine.execute({
        title: 'جاري تأسيس ملف الإنجاز وبطاقة الأداء الوظيفي...',
        message: `يتم الآن إعداد مساحة العمل الخاصة بـ (${name}) وفق الهوية البصرية لـ (${GenderEngine.jobTitle(selectedJobRole, selectedGender)})...`,
        duration: 1000,
        successTitle: 'تم إنشاء الحساب وملف الإنجاز بنجاح',
        successMessage: 'جاري نقلك الآن إلى صفحة المستخدم الخاصة بك...',
        onComplete: () => {
          window.location.href = 'user-dashboard.html';
        }
      });
    });
  }
});
