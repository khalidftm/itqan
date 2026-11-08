/**
 * ============================================================================
 * ADMIN DASHBOARD SCRIPT (assets/js/pages/admin-dashboard.js)
 * منطق صفحة مدير النظام / مالك الموقع المركزي متعدد المدارس
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const {
    GenderEngine,
    ModalEngine,
    BannerEngine,
    ToastEngine,
    StorageEngine,
    MessageEngine,
    PrintEngine
  } = window.ItqanEngines;

  // 1. رسالة ترحيبية داخلية لمدير النظام قابلة للإغلاق بزر (×)
  BannerEngine.render('#admin-inline-alerts', {
    type: 'info',
    title: 'لوحة التحكم المركزية لمدير / مالك المنصة (إدارة متعددة المدارس)',
    message: 'من هذه الواجهة يمكنك إدارة المدارس المشتركة (بنين وبنات)، إضافة المدارس والمدراء والمعلمين، مراقبة مؤشرات الأداء الوظيفي وملفات الإنجاز، وتصدير نسخة احتياطية من قاعدة البيانات المحلية.'
  });

  // 2. تحديث مؤشرات القياس المركزية (KPIs)
  function renderAdminKPIs() {
    const db = StorageEngine.getDB();
    const schools = db.schools || [];
    const users = db.users || [];
    const portfolios = db.portfolioItems || [];

    const avgScore =
      users.length > 0
        ? Math.round(
            users.reduce((acc, u) => acc + (u.selfEvaluationScore || 95), 0) / users.length
          )
        : 96;

    const elSchools = document.getElementById('admin-kpi-schools');
    const elUsers = document.getElementById('admin-kpi-users');
    const elPortfolios = document.getElementById('admin-kpi-portfolios');
    const elAvg = document.getElementById('admin-kpi-avg');

    if (elSchools) elSchools.textContent = schools.length;
    if (elUsers) elUsers.textContent = users.length;
    if (elPortfolios) elPortfolios.textContent = portfolios.length;
    if (elAvg) elAvg.textContent = `${avgScore}%`;
  }

  // 3. عرض دليل المدارس المسجلة في المنصة المركزية
  function renderSchoolsDirectory() {
    const grid = document.getElementById('admin-schools-grid');
    if (!grid) return;

    const schools = StorageEngine.getSchools();
    grid.innerHTML = schools
      .map((s) => {
        const isFemale = s.genderType === 'female';
        const schoolUsers = StorageEngine.getUsers().filter((u) => u.schoolId === s.id);
        return `
          <div class="school-card ${isFemale ? 'gender-girls' : 'gender-boys'}">
            <div>
              <div class="d-flex align-center justify-between mb-2">
                <span class="badge ${isFemale ? 'badge-gender' : 'badge-primary'}">
                  ${isFemale ? 'مدارس البنات' : 'مدارس البنين'} — ${s.stage}
                </span>
                <span class="badge badge-accent">${s.code}</span>
              </div>
              <h4 class="fw-extrabold mb-1" style="font-size:1.05rem;">${s.name}</h4>
              <p class="text-muted" style="font-size:0.86rem;">📍 ${s.region}</p>
              <p class="mt-2" style="font-size:0.88rem;">
                <strong>${GenderEngine.jobTitle('principal', s.genderType)}:</strong> ${s.principalName}
              </p>
            </div>
            <div class="d-flex align-center justify-between pt-2" style="border-top:1px solid var(--border-light); padding-top:0.75rem;">
              <span class="text-muted" style="font-size:0.83rem;">الحسابات المرتبطة: <strong>${schoolUsers.length}</strong> (${s.teachersCount} منسوب)</span>
              <span class="badge badge-success">نشطة</span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // نافذة إضافة مدرسة جديدة
  function openAddSchoolModal() {
    ModalEngine.open({
      type: 'execute',
      title: 'إضافة مدرسة جديدة إلى المنصة المركزية',
      size: 'lg',
      confirmText: 'اعتماد وإضافة المدرسة',
      cancelText: 'إلغاء',
      showCancel: true,
      html: `
        <form id="admin-add-school-form">
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">اسم المدرسة الرسمي <span class="required">*</span></label>
              <input type="text" class="form-control" id="sch-name" placeholder="مثال: ثانوية طويق النموذجية" required />
            </div>
            <div class="form-group">
              <label class="form-label">الرقم الوزاري للمدرسة <span class="required">*</span></label>
              <input type="text" class="form-control" id="sch-code" placeholder="مثال: MOE-RYD-510" required />
            </div>
          </div>
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">الإدارة العامة للتعليم <span class="required">*</span></label>
              <input type="text" class="form-control" id="sch-region" value="الإدارة العامة للتعليم بمنطقة الرياض" required />
            </div>
            <div class="form-group">
              <label class="form-label">المرحلة الدراسية</label>
              <select class="form-select" id="sch-stage">
                <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                <option value="المرحلة الثانوية" selected>المرحلة الثانوية</option>
              </select>
            </div>
          </div>
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">تصنيف المدرسة (لتفعيل محرك الهوية والجنس)</label>
              <select class="form-select" id="sch-gender">
                <option value="male">مدارس البنين (مذكر)</option>
                <option value="female">مدارس البنات (مؤنث)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">اسم مدير / مديرة المدرسة <span class="required">*</span></label>
              <input type="text" class="form-control" id="sch-principal" placeholder="الاسم الثلاثي أو الرباعي" required />
            </div>
          </div>
        </form>
      `,
      onConfirm: () => {
        const name = document.getElementById('sch-name').value.trim();
        const code = document.getElementById('sch-code').value.trim();
        const region = document.getElementById('sch-region').value.trim();
        const stage = document.getElementById('sch-stage').value;
        const genderType = document.getElementById('sch-gender').value;
        const principalName = document.getElementById('sch-principal').value.trim();

        if (!name || !code || !principalName) {
          ToastEngine.show({
            type: 'warning',
            title: 'بيانات غير مكتملة',
            message: 'يرجى إدخال اسم المدرسة والرقم الوزاري واسم المدير/المديرة.'
          });
          return false;
        }

        StorageEngine.addSchool({
          name,
          code,
          region,
          stage,
          genderType,
          principalName,
          teachersCount: 30
        });

        renderSchoolsDirectory();
        renderAdminKPIs();
        ToastEngine.show({
          type: 'success',
          title: 'تمت إضافة المدرسة بنجاح',
          message: `أصبحت "${name}" متاحة للتسجيل وإدارة الأداء الوظيفي في المنصة المركزية.`
        });
        return true;
      }
    });
  }

  // 4. عرض جدول كافة المستخدمين والصلاحيات (مدير موقع / مستخدم: معلم - مدير مدرسة)
  function renderAllUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    const users = StorageEngine.getUsers();
    tbody.innerHTML = users
      .map((u) => {
        const school = StorageEngine.getSchoolById(u.schoolId);
        const jobLabel = GenderEngine.jobTitle(u.jobRole, u.gender);
        const sysRoleLabel = u.systemRole === 'admin' ? 'مدير / مالك الموقع' : 'مستخدم';
        return `
          <tr>
            <td><strong>${u.name}</strong><br><small class="text-muted">${u.email}</small></td>
            <td>${u.nationalId}</td>
            <td><span class="badge ${u.systemRole === 'admin' ? 'badge-accent' : 'badge-primary'}">${sysRoleLabel}</span></td>
            <td><span class="badge badge-gender">${jobLabel}</span></td>
            <td>${u.gender === 'female' ? '👩 مؤنث' : '👨 مذكر'}</td>
            <td>${school.name}</td>
            <td><strong>${u.selfEvaluationScore || 96}%</strong></td>
            <td>
              <div class="d-flex gap-1">
                <button type="button" class="btn btn-sm btn-outline" data-admin-print-user="${u.id}">طباعة التقرير</button>
                <button type="button" class="btn btn-sm btn-ghost" data-admin-msg-user="${u.id}">مراسلة</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-admin-print-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-admin-print-user');
        const user = StorageEngine.getUsers().find((x) => x.id === uid);
        if (user) PrintEngine.previewAndPrint(user, 'full');
      });
    });

    tbody.querySelectorAll('[data-admin-msg-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-admin-msg-user');
        MessageEngine.openComposeModal(uid);
      });
    });
  }

  // 5. عرض معايير الأداء الوظيفي الوزارية المعتمدة في النظام
  function renderAdminCriteriaTable() {
    const tbody = document.getElementById('admin-criteria-tbody');
    if (!tbody) return;

    const criteria = StorageEngine.getDB().criteria || [];
    tbody.innerHTML = criteria
      .map(
        (c, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${c.title}</strong></td>
          <td><span class="badge badge-primary">${c.category}</span></td>
          <td><strong>${c.weight}%</strong></td>
          <td><span class="badge badge-success">مفعل في جميع المدارس</span></td>
        </tr>
      `
      )
      .join('');
  }

  // 6. التبديل بين تبويبات صفحة مدير النظام
  document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-admin-tab');
      document.querySelectorAll('[data-admin-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.workspace-section').forEach((sec) => {
        sec.classList.toggle('is-active', sec.id === targetId);
      });
    });
  });

  // 7. أزرار الإجراءات المركزية (إضافة مدرسة، تعميم رسالة، تصدير JSON، استعادة الضبط)
  const btnAddSchool = document.getElementById('btn-admin-add-school');
  if (btnAddSchool) btnAddSchool.addEventListener('click', openAddSchoolModal);

  const btnBroadcast = document.getElementById('btn-admin-broadcast');
  if (btnBroadcast) {
    btnBroadcast.addEventListener('click', () => MessageEngine.openComposeModal('ALL'));
  }

  const btnExportJson = document.getElementById('btn-admin-export-db');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      const dbJson = JSON.stringify(StorageEngine.getDB(), null, 2);
      const blob = new Blob([dbJson], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'itqan-education-db-backup.json';
      a.click();
      URL.revokeObjectURL(url);

      ToastEngine.show({
        type: 'success',
        title: 'تم تصدير قاعدة البيانات المحلية',
        message: 'تم تنزيل ملف النسخة الاحتياطية (JSON) الجاهز للربط المستقبلي مع قواعد البيانات.'
      });
    });
  }

  const btnResetDb = document.getElementById('btn-admin-reset-db');
  if (btnResetDb) {
    btnResetDb.addEventListener('click', () => {
      ModalEngine.confirm({
        type: 'warning',
        title: 'إعادة ضبط البيانات التجريبية في المتصفح',
        message: 'هل ترغب في إعادة تهيئة ذاكرة المتصفح (LocalStorage) إلى البيانات القياسية الافتراضية؟',
        confirmText: 'نعم، استعادة البيانات الافتراضية',
        cancelText: 'إلغاء',
        onConfirm: () => {
          StorageEngine.resetDB();
          renderAdminKPIs();
          renderSchoolsDirectory();
          renderAllUsersTable();
          ToastEngine.show({
            type: 'success',
            title: 'تمت استعادة البيانات القياسية',
            message: 'تم تحديث كافة الجداول والمدارس بنجاح.'
          });
        }
      });
    });
  }

  window.addEventListener('itqan:genderChanged', () => {
    renderSchoolsDirectory();
    renderAllUsersTable();
  });

  renderAdminKPIs();
  renderSchoolsDirectory();
  renderAllUsersTable();
  renderAdminCriteriaTable();
});
