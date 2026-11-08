/**
 * ============================================================================
 * USER DASHBOARD SCRIPT (assets/js/pages/user-dashboard.js)
 * منطق العمل الفعلي لمعلمة مادة (لغتي) - الصف الثاني الابتدائي خلال مرحلة البناء:
 * - رفع الملفات والشواهد الفعلية (PDF, Word, Excel, الصور) وحفظها في IndexedDB + GitHub
 * - معاينة وتنزيل الملفات المرفوعة فعلياً داخل نافذة موحدة
 * - بطاقة السيرة الذاتية المهنية للمعلمة قابلة للتحرير والطباعة
 * - مكتبة المكونات الجاهزة المشتركة (عامة / للمرحلة الابتدائية / لمادة لغتي / لفئة المعلمة)
 * - معايير تقييم الأداء الوظيفي الـ 11 لفئة المعلمة مع شروحاتها التفصيلية وشواهدها
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const {
    GenderEngine,
    ModalEngine,
    BannerEngine,
    ToastEngine,
    IndexedDBFileStore,
    StorageEngine,
    MessageEngine
    // Only HSP3 print manager is used in FTM.
  } = window.ItqanEngines;

  let activeLibScopeFilter = 'ALL';

  function openHSP3Print() {
    window.location.assign('assets/hsp3/preview/itqan-print.html');
  }

  function getActiveUser() {
    let user = StorageEngine.getCurrentUser();
    if (!user || user.jobRole !== 'teacher' || user.gender !== 'female') {
      user =
        StorageEngine.getUsers().find((u) => u.jobRole === 'teacher' && u.gender === 'female') ||
        StorageEngine.getUsers()[0];
      StorageEngine.saveSessionUser(user);
    }
    return user;
  }

  let currentUser = getActiveUser();
  document.documentElement.setAttribute('data-design-model', 'model-2');
  GenderEngine.applyToDOM('female');

  // 1. رسالة ترحيبية داخلية موحدة قابلة للإغلاق بزر (×)
  function renderWelcomeAlert() {
    const school = { ...StorageEngine.getSchoolById(currentUser.schoolId), name: window.ITQAN_FTM_IDENTITY?.get(currentUser.id).schoolName || StorageEngine.getSchoolById(currentUser.schoolId).name };
    const roleLabel = GenderEngine.jobTitle(currentUser.jobRole, currentUser.gender);
    BannerEngine.render('#user-inline-alerts', {
      type: 'success',
      title: `${GenderEngine.t('welcome', currentUser.gender)} ${currentUser.name} (${roleLabel} — ${currentUser.subjectName || 'مادة لغتي'} — ${currentUser.gradeLevel || 'الصف الثاني الابتدائي'})`,
      message: `أنتِ تعملين الآن في وضع البناء الفعلي بمدرسة (${school.name}). تُحفظ جميع الملفات المرفوعة (PDF, Word, Excel, الصور) في خزنة المتصفح الكبرى (IndexedDB) مع إمكانية مزامنتها وحفظها سحابياً مجاناً عبر GitHub من زر (☁️ مزامنة وحفظ GitHub).`,
      clearPrevious: true
    });
  }

  // 2. تحديث بيانات الغلاف والهوية البصرية لملف الإنجاز
  function renderUserHeaderAndCover() {
    currentUser = getActiveUser();
    const g = currentUser.gender || GenderEngine.getCurrentGender();
    const school = { ...StorageEngine.getSchoolById(currentUser.schoolId), name: window.ITQAN_FTM_IDENTITY?.get(currentUser.id).schoolName || StorageEngine.getSchoolById(currentUser.schoolId).name };
    const jobTitle = GenderEngine.jobTitle(currentUser.jobRole, g);
    const portfolioTitle = GenderEngine.portfolioTitle(currentUser.jobRole, g);
    const portfolioItems = StorageEngine.getPortfolioForUser(currentUser.id);
    const includedCount = (currentUser.includedLibraryIds || []).length;

    const initials = currentUser.name.replace('أ.', '').trim().charAt(0) || 'س';
    document.querySelectorAll('.js-user-initials').forEach((el) => (el.textContent = initials));
    document.querySelectorAll('.js-user-name').forEach((el) => (el.textContent = currentUser.name));
    document.querySelectorAll('.js-user-role-badge').forEach((el) => (el.textContent = `${jobTitle} — ${currentUser.rank || ''}`));
    document.querySelectorAll('.js-user-school').forEach((el) => (el.textContent = school.name));
    document.querySelectorAll('.js-user-spec').forEach((el) => (el.textContent = `${currentUser.subjectName || currentUser.specialization} — ${currentUser.gradeLevel || ''}`));
    document.querySelectorAll('.js-portfolio-dynamic-title').forEach((el) => (el.textContent = portfolioTitle));
    document.querySelectorAll('.js-user-score').forEach((el) => (el.textContent = `${currentUser.selfEvaluationScore || 98}%`));
    document.querySelectorAll('.js-portfolio-count').forEach((el) => (el.textContent = portfolioItems.length));
    document.querySelectorAll('.js-library-count').forEach((el) => (el.textContent = includedCount));
    document.querySelectorAll('.js-eval-status').forEach((el) => (el.textContent = currentUser.evaluationStatus || 'معتمد'));

    const principalBadge = document.getElementById('principal-mode-indicator');
    if (principalBadge) {
      principalBadge.textContent =
        currentUser.jobRole === 'principal'
          ? `صلاحية قيادية: ${jobTitle}`
          : `صلاحية تربوية: ${jobTitle} (${currentUser.gradeLevel || 'ثاني ابتدائي'})`;
    }

    const userSwitcher = document.getElementById('quick-user-profile-select');
    if (userSwitcher) {
      const nonAdminUsers = StorageEngine.getUsers().filter((u) => u.systemRole === 'user');
      userSwitcher.innerHTML = nonAdminUsers
        .map(
          (u) =>
            `<option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.name} — (${GenderEngine.jobTitle(u.jobRole, u.gender)}: ${u.subjectName || u.specialization})</option>`
        )
        .join('');
    }
  }

  // Saved school names may contain user input: escape before innerHTML rendering.
  const escapeSchoolName = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  // 3. عرض وتحرير بطاقة السيرة الذاتية المهنية للمعلمة (CV Card)
  function renderCVCard() {
    const container = document.getElementById('cv-card-display-container');
    if (!container) return;

    const school = { ...StorageEngine.getSchoolById(currentUser.schoolId), name: window.ITQAN_FTM_IDENTITY?.get(currentUser.id).schoolName || StorageEngine.getSchoolById(currentUser.schoolId).name };
    const cv = currentUser.cvData || {
      qualification: 'بكالوريوس اللغة العربية والتربية + دبلوم الصفوف الأولية',
      university: 'جامعة الأميرة نورة بنت عبدالرحمن',
      graduationYear: '1438 هـ',
      ministerialNumber: '4489201',
      classesTaught: 'الصف الثاني الابتدائي (فصل 2/أ ، فصل 2/ب) — نصاب 18 حصة',
      vision: 'بناء جيل من التلميذات القارئات بطلاقة والمعتزات بلغتهن العربية الفصيحة وقيمهن الإسلامية والوطنية.',
      mission: 'تقديم تعليم نوعي محفز في مادة (لغتي) لطالبات الصف الثاني الابتدائي عبر توظيف استراتيجيات التعلم باللعب والتقنيات التفاعلية ومراعاة الفروق الفردية.',
      keySkills: 'تأسيس القراءة والكتابة بالقاعدة النورانية والوعي الصوتي، تصميم الألعاب القرائية الرقمية، بناء الخطط العلاجية والإثرائية، الإدارة الصفية المحفزة.',
      achievementsSummary: 'تحقيق نسبة إتقان 97% في مهارات الانطلاق القرائي والإملاء لطالبات الصف الثاني الابتدائي.'
    };

    container.innerHTML = `
      <div class="cv-info-block">
        <div class="cv-info-label">👤 الاسم الرباعي والرتبة التربوية</div>
        <div class="cv-info-value">${currentUser.name} — (${currentUser.rank || 'معلمة متقدمة'})</div>
      </div>
      <div class="cv-info-block">
        <div class="cv-info-label">🏫 المدرسة والمرحلة الدراسية</div>
        <div class="cv-info-value">${escapeSchoolName(school.name)} — (${currentUser.stage || 'المرحلة الابتدائية'})</div>
      </div>
      <div class="cv-info-block">
        <div class="cv-info-label">📚 التخصص والمادة والصف المسند</div>
        <div class="cv-info-value">${currentUser.subjectName || 'مادة لغتي'} — ${currentUser.gradeLevel || 'الصف الثاني الابتدائي'}</div>
      </div>
      <div class="cv-info-block">
        <div class="cv-info-label">🎓 المؤهل العلمي والجامعة</div>
        <div class="cv-info-value">${cv.qualification} — ${cv.university} (${cv.graduationYear})</div>
      </div>
      <div class="cv-info-block">
        <div class="cv-info-label">🔢 الرقم الوظيفي / الوزاري وسنوات الخبرة</div>
        <div class="cv-info-value">الرقم الوزاري: ${cv.ministerialNumber} &nbsp;|&nbsp; الخبرة: ${currentUser.experienceYears || 9} سنوات</div>
      </div>
      <div class="cv-info-block">
        <div class="cv-info-label">🗓️ الفصول المسندة والنصاب التدريسي</div>
        <div class="cv-info-value">${cv.classesTaught}</div>
      </div>
      <div class="cv-info-block" style="grid-column: 1 / -1;">
        <div class="cv-info-label">🌟 الرؤية التربوية الشخصية للمعلمة</div>
        <div class="cv-info-value">${cv.vision}</div>
      </div>
      <div class="cv-info-block" style="grid-column: 1 / -1;">
        <div class="cv-info-label">🎯 الرسالة المهنية في تدريس مادة (لغتي)</div>
        <div class="cv-info-value">${cv.mission}</div>
      </div>
      <div class="cv-info-block" style="grid-column: 1 / -1;">
        <div class="cv-info-label">💡 أبرز المهارات المهنية والتقنية</div>
        <div class="cv-info-value">${cv.keySkills}</div>
      </div>
      <div class="cv-info-block" style="grid-column: 1 / -1;">
        <div class="cv-info-label">🏆 ملخص أبرز المنجزات التربوية</div>
        <div class="cv-info-value">${cv.achievementsSummary}</div>
      </div>
    `;
  }

  function openEditCVModal() {
    const cv = currentUser.cvData || {};
    ModalEngine.open({
      type: 'execute',
      title: `تحرير وتخصيص ${GenderEngine.t('cv_card_title', currentUser.gender)}`,
      size: 'lg',
      confirmText: 'حفظ بطاقة السيرة الذاتية',
      cancelText: 'إلغاء',
      showCancel: true,
      html: `
        <form id="edit-cv-form">
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">الاسم الرباعي</label>
              <input type="text" class="form-control" id="cv-name" value="${currentUser.name}" />
            </div>
            <div class="form-group">
              <label class="form-label">المادة والصف الدراسي المسند</label>
              <input type="text" class="form-control" id="cv-grade" value="${currentUser.gradeLevel || 'الصف الثاني الابتدائي'}" />
            </div>
          </div>
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">المؤهل الأكاديمي والتخصص</label>
              <input type="text" class="form-control" id="cv-qual" value="${cv.qualification || 'بكالوريوس اللغة العربية والتربية'}" />
            </div>
            <div class="form-group">
              <label class="form-label">الجامعة وسنة التخرج</label>
              <input type="text" class="form-control" id="cv-univ" value="${cv.university || 'جامعة الأميرة نورة بنت عبدالرحمن'}" />
            </div>
          </div>
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">الفصول المسندة والنصاب التدريسي</label>
              <input type="text" class="form-control" id="cv-classes" value="${cv.classesTaught || 'الصف الثاني الابتدائي (2/أ ، 2/ب) — 18 حصة'}" />
            </div>
            <div class="form-group">
              <label class="form-label">الرقم الوزاري / الوظيفي</label>
              <input type="text" class="form-control" id="cv-min-num" value="${cv.ministerialNumber || '4489201'}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">الرؤية التربوية الشخصية للمعلمة</label>
            <textarea class="form-control" id="cv-vision" rows="2">${cv.vision || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">الرسالة المهنية في تدريس مادة لغتي</label>
            <textarea class="form-control" id="cv-mission" rows="2">${cv.mission || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">أبرز المهارات والمنجزات التربوية</label>
            <textarea class="form-control" id="cv-skills" rows="2">${cv.keySkills || ''}</textarea>
          </div>
        </form>
      `,
      onConfirm: () => {
        currentUser.name = document.getElementById('cv-name').value.trim() || currentUser.name;
        currentUser.gradeLevel = document.getElementById('cv-grade').value.trim() || currentUser.gradeLevel;
        currentUser.cvData = {
          ...(currentUser.cvData || {}),
          qualification: document.getElementById('cv-qual').value.trim(),
          university: document.getElementById('cv-univ').value.trim(),
          classesTaught: document.getElementById('cv-classes').value.trim(),
          ministerialNumber: document.getElementById('cv-min-num').value.trim(),
          vision: document.getElementById('cv-vision').value.trim(),
          mission: document.getElementById('cv-mission').value.trim(),
          keySkills: document.getElementById('cv-skills').value.trim()
        };

        StorageEngine.updateUser(currentUser);
        renderCVCard();
        renderUserHeaderAndCover();
        ToastEngine.show({
          type: 'success',
          title: 'تم تحديث بطاقة السيرة الذاتية',
          message: 'حُفظت بيانات السيرة الذاتية المهنية محليًا وأصبحت متاحة لمحرك HSP3 للطباعة.'
        });
        return true;
      }
    });
  }

  // 4. مكتبة المكونات والوثائق الجاهزة المشتركة
  function renderSharedLibrary() {
    const grid = document.getElementById('shared-library-grid');
    if (!grid) return;

    const allDocs = StorageEngine.getSharedLibrary();
    const includedIds = currentUser.includedLibraryIds || [];

    const filteredDocs =
      activeLibScopeFilter === 'ALL'
        ? allDocs
        : allDocs.filter((d) => d.scope === activeLibScopeFilter);

    grid.innerHTML = filteredDocs
      .map((doc) => {
        const isIncluded = includedIds.includes(doc.id);
        const scopeBadgeMap = {
          general: 'badge-primary',
          stage_primary: 'badge-accent',
          subject_lughati_g2: 'badge-gender',
          role_teacher: 'badge-info'
        };
        return `
          <div class="shared-lib-card ${isIncluded ? 'is-included' : ''}">
            <div>
              <div class="d-flex align-center justify-between flex-wrap gap-1 mb-2">
                <span class="badge ${scopeBadgeMap[doc.scope] || 'badge-primary'}">${doc.scopeLabel}</span>
                <span class="badge ${isIncluded ? 'badge-success' : 'badge-warning'}">
                  ${isIncluded ? '✔️ مضمّن في ملف إنجازي' : 'غير مضمّن حالياً'}
                </span>
              </div>
              <h4 class="fw-extrabold mb-1" style="font-size:1.02rem;">${doc.title}</h4>
              <p class="text-muted" style="font-size:0.86rem;">${doc.summary}</p>
            </div>
            <div class="d-flex gap-2 pt-2" style="border-top:1px solid var(--border-light); padding-top:0.75rem;">
              <button type="button" class="btn btn-sm btn-outline" data-read-lib-doc="${doc.id}">
                📖 قراءة واستعراض الوثيقة
              </button>
              <button type="button" class="btn btn-sm ${isIncluded ? 'btn-ghost' : 'btn-primary'} w-100" data-toggle-lib-doc="${doc.id}">
                ${isIncluded ? 'إزالة من ملف الإنجاز' : '+ تضمين في ملف إنجازي'}
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-read-lib-doc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-read-lib-doc');
        const doc = allDocs.find((d) => d.id === docId);
        if (!doc) return;
        ModalEngine.open({
          type: 'info',
          title: doc.title,
          size: 'lg',
          confirmText: 'طباعة عبر محرك HSP3',
          cancelText: 'إغلاق',
          showCancel: true,
          html: `
            <div class="mb-2 d-flex gap-2 flex-wrap">
              <span class="badge badge-gender">${doc.scopeLabel}</span>
              <span class="badge badge-primary">${doc.category}</span>
            </div>
            <div class="card" style="background:var(--bg-surface-alt); line-height:1.85;">
              ${doc.contentHtml}
            </div>
          `,
          onConfirm: () => {
            openHSP3Print();
            return false;
          }
        });
      });
    });

    grid.querySelectorAll('[data-toggle-lib-doc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const docId = btn.getAttribute('data-toggle-lib-doc');
        const doc = allDocs.find((d) => d.id === docId);
        const added = StorageEngine.toggleLibraryItemForUser(currentUser.id, docId);
        currentUser = getActiveUser();
        renderSharedLibrary();
        renderUserHeaderAndCover();
        ToastEngine.show({
          type: added ? 'success' : 'info',
          title: added ? 'تم تضمين المكون الجاهز في ملف إنجازكِ' : 'تم استبعاد المكون من ملف الإنجاز',
          message: `${doc ? doc.title : ''}`
        });
      });
    });
  }

  function openAddSharedComponentModal() {
    ModalEngine.open({
      type: 'execute',
      title: 'إنشاء وإضافة مكون أو وثيقة جديدة إلى المكتبة وملف الإنجاز',
      size: 'lg',
      confirmText: 'حفظ وتضمين في ملف الإنجاز',
      cancelText: 'إلغاء',
      showCancel: true,
      html: `
        <form id="add-lib-comp-form">
          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">نطاق المكون (مشترك أو خاص) <span class="required">*</span></label>
              <select class="form-select" id="lib-scope">
                <option value="subject_lughati_g2">مشترك لمادة لغتي — الصف الثاني الابتدائي</option>
                <option value="stage_primary">مشترك للمرحلة الابتدائية</option>
                <option value="general">عام لجميع المعلمين والمعلمات بالمملكة</option>
                <option value="role_teacher">خاص بفئة المعلمة / خاص بالمعلمة الحالية</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">التصنيف الموضوعي</label>
              <input type="text" class="form-control" id="lib-category" value="وثائق ومكونات مادة لغتي (ثاني ابتدائي)" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">عنوان الوثيقة أو المكون <span class="required">*</span></label>
            <input type="text" class="form-control" id="lib-title" placeholder="مثال: جدول توزيع مقرر لغتي للصف الثاني الابتدائي - الفصل الدراسي الثاني" required />
          </div>
          <div class="form-group">
            <label class="form-label">ملخص مختصر للوثيقة <span class="required">*</span></label>
            <input type="text" class="form-control" id="lib-summary" placeholder="وصف موجز يظهر في بطاقة المكون..." required />
          </div>
          <div class="form-group">
            <label class="form-label">المحتوى التفصيلي للوثيقة <span class="required">*</span></label>
            <textarea class="form-control" id="lib-content" rows="4" placeholder="اكتبي بنود الوثيقة أو الأهداف أو الشرح هنا..." required></textarea>
          </div>
        </form>
      `,
      onConfirm: () => {
        const scopeSelect = document.getElementById('lib-scope');
        const scope = scopeSelect.value;
        const scopeLabel = scopeSelect.options[scopeSelect.selectedIndex].text;
        const category = document.getElementById('lib-category').value.trim();
        const title = document.getElementById('lib-title').value.trim();
        const summary = document.getElementById('lib-summary').value.trim();
        const content = document.getElementById('lib-content').value.trim();

        if (!title || !content) {
          ToastEngine.show({
            type: 'warning',
            title: 'يرجى تعبئة الحقول المطلوبة',
            message: 'عنوان المكون ومحتواه التفصيلي إلزاميان.'
          });
          return false;
        }

        const created = StorageEngine.addSharedLibraryItem({
          scope,
          scopeLabel,
          category,
          title,
          summary: summary || title,
          contentHtml: `<p>${content.replace(/\n/g, '<br>')}</p>`
        });

        StorageEngine.toggleLibraryItemForUser(currentUser.id, created.id);
        currentUser = getActiveUser();
        renderSharedLibrary();
        renderUserHeaderAndCover();
        ToastEngine.show({
          type: 'success',
          title: 'تمت إضافة المكون وتضمينه',
          message: `تم حفظ "${title}" وتضمينه في ملف الإنجاز المهني.`
        });
        return true;
      }
    });
  }

  // 5. عرض ورفع الشواهد والملفات الفعلية (IndexedDB + GitHub Cloud)
  function renderPortfolioItems() {
    const grid = document.getElementById('portfolio-items-grid');
    if (!grid) return;

    const items = StorageEngine.getPortfolioForUser(currentUser.id);
    const criteriaList = StorageEngine.getDB().criteria || [];

    if (!items.length) {
      grid.innerHTML = `
        <div class="card text-center" style="grid-column: 1 / -1;">
          <h4 class="mb-1">لا توجد شواهد مرفوعة حالياً</h4>
          <p class="text-muted mb-3">اضغطي على منطقة رفع الملفات أعلاه لاختيار ملف من جهازكِ وإضافته لملف الإنجاز.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = items
      .map((item) => {
        const linkedCriterion = criteriaList.find((c) => c.id === item.criteriaId);
        return `
          <div class="evidence-card">
            <div>
              <div class="d-flex align-center justify-between flex-wrap gap-1 mb-2">
                <span class="badge badge-gender">${item.section}</span>
                <span class="badge badge-accent">${item.scopeType || 'خاص بالمعلمة الحالية'}</span>
              </div>
              <h4 class="fw-extrabold mb-1" style="font-size:1.02rem;">${item.title}</h4>
              <p class="text-muted mb-2" style="font-size:0.86rem;">${item.description || ''}</p>
              ${
                item.fileName
                  ? `<div class="file-attachment-chip mb-2">
                       📄 ${item.fileName} ${item.fileSize ? `(${item.fileSize})` : ''}
                       ${item.githubDownloadUrl ? ' <span class="badge badge-success" style="padding:0.1rem 0.45rem;">☁️ محفوظ في GitHub</span>' : ''}
                     </div>`
                  : ''
              }
              ${
                linkedCriterion
                  ? `<div style="font-size:0.79rem; color:var(--primary-700); font-weight:700;">🔗 مرتبط بمعيار: ${linkedCriterion.title}</div>`
                  : ''
              }
            </div>
            <div>
              <div class="d-flex align-center justify-between text-muted mb-2" style="font-size:0.79rem; border-top:1px solid var(--border-light); padding-top:0.6rem;">
                <span>📎 ${item.attachmentType || 'وثيقة PDF'}</span>
                <span>📅 ${item.date}</span>
              </div>
              <div class="d-flex gap-2 justify-between">
                <button type="button" class="btn btn-sm btn-outline w-100" data-view-evidence="${item.id}">👁️ معاينة وتنزيل الملف</button>
                <button type="button" class="btn btn-sm btn-ghost" data-delete-evidence="${item.id}">حذف</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-view-evidence]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-view-evidence');
        const item = items.find((x) => x.id === id);
        if (!item) return;
        const linkedCriterion = criteriaList.find((c) => c.id === item.criteriaId);

        // فحص هل يوجد ملف فعلي مخزن في IndexedDB لهذا الشاهد
        const storedRecord = await IndexedDBFileStore.getFile(item.id);
        let objectUrl = null;
        let isPdf = false;
        let isImage = false;

        if (storedRecord && storedRecord.blob) {
          objectUrl = URL.createObjectURL(storedRecord.blob);
          const mime = (storedRecord.type || '').toLowerCase();
          const fname = (storedRecord.name || item.fileName || '').toLowerCase();
          isPdf = mime.includes('pdf') || fname.endsWith('.pdf');
          isImage = mime.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/.test(fname);
        } else if (item.githubDownloadUrl) {
          objectUrl = item.githubDownloadUrl;
          const fname = (item.fileName || '').toLowerCase();
          isPdf = fname.endsWith('.pdf');
          isImage = /\.(png|jpg|jpeg|gif|webp)$/.test(fname);
        }

        let filePreviewHtml = '';
        if (objectUrl && isImage) {
          filePreviewHtml = `
            <div class="mb-3 text-center">
              <img src="${objectUrl}" alt="${item.title}" style="max-height:340px; border-radius:8px; border:1px solid var(--border-color);" />
            </div>
          `;
        } else if (objectUrl && isPdf) {
          filePreviewHtml = `
            <div class="mb-3">
              <iframe src="${objectUrl}" style="width:100%; height:360px; border:1px solid var(--border-color); border-radius:8px;"></iframe>
            </div>
          `;
        }

        const downloadActionHtml = objectUrl
          ? `<a href="${objectUrl}" download="${item.fileName || 'evidence-file'}" target="_blank" class="btn btn-sm btn-accent">⬇️ تنزيل الملف المرفوع الأصلي (${item.fileName})</a>`
          : `<span class="badge badge-info">شاهد نصي موثق (يمكنكِ رفع ملف فعلي من جهازكِ لربطه)</span>`;

        ModalEngine.open({
          type: 'info',
          title: `معاينة الشاهد والملف المرفق: ${item.title}`,
          size: 'lg',
          confirmText: 'طباعة عبر محرك HSP3',
          cancelText: 'إغلاق',
          showCancel: true,
          html: `
            <div class="gender-accent-card" style="padding:1.15rem; margin-bottom:1rem;">
              <div class="d-flex align-center justify-between flex-wrap gap-2 mb-2">
                <div><strong>القسم في ملف الإنجاز:</strong> ${item.section}</div>
                ${downloadActionHtml}
              </div>
              <div><strong>تصنيف الخصوصية والنطاق:</strong> <span class="badge badge-accent">${item.scopeType || 'خاص بالمعلمة الحالية'}</span></div>
              <div><strong>المعيار الوزاري المرتبط:</strong> ${linkedCriterion ? linkedCriterion.title : 'شاهد عام في ملف الإنجاز'}</div>
              <div><strong>الملف المرفق:</strong> <code>${item.fileName || 'وثيقة إلكترونية'}</code> (${item.fileSize || 'معتمد'})</div>
              <div><strong>تاريخ الرفع والتوثيق:</strong> ${item.date} &nbsp;|&nbsp; <span class="badge badge-success">${item.status}</span></div>
            </div>
            ${filePreviewHtml}
            <p><strong>الوصف التربوي والأثر المتحقق لطالبات الصف الثاني الابتدائي:</strong></p>
            <p class="mt-1">${item.description}</p>
          `,
          onConfirm: () => {
            openHSP3Print();
            return false;
          }
        });
      });
    });

    grid.querySelectorAll('[data-delete-evidence]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-evidence');
        const item = items.find((x) => x.id === id);
        if (!item) return;
        ModalEngine.confirm({
          type: 'danger',
          title: 'تأكيد حذف الشاهد من ملف الإنجاز',
          message: `هل أنتِ متأكدة من رغبتكِ في حذف الشاهد "${item.title}"؟`,
          confirmText: 'نعم، حذف الشاهد',
          cancelText: 'تراجع',
          onConfirm: () => {
            StorageEngine.deletePortfolioItem(id);
            renderPortfolioItems();
            renderPerformanceCriteria();
            renderUserHeaderAndCover();
            ToastEngine.show({
              type: 'warning',
              title: 'تم حذف الشاهد',
              message: 'تم تحديث سجل الشواهد في ذاكرة المتصفح.'
            });
          }
        });
      });
    });
  }

  // نافذة رفع ملف/شاهد جديد مع حفظ فعلي في IndexedDB + رفع اختياري تلقائي إلى GitHub
  function openAddEvidenceModal(preselectedFile = null, preselectedCriteriaId = 'c4') {
    const criteriaList = StorageEngine.getDB().criteria || [];
    const criteriaOptions = criteriaList
      .map(
        (c, idx) =>
          `<option value="${c.id}" ${c.id === preselectedCriteriaId ? 'selected' : ''}>${idx + 1}. ${c.title} (${c.weight}%)</option>`
      )
      .join('');

    const defaultFileName = preselectedFile ? preselectedFile.name : '';
    const defaultFileSize = preselectedFile ? `${Math.max(1, Math.round(preselectedFile.size / 1024))} KB` : '';
    const defaultTitle = preselectedFile
      ? preselectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')
      : '';

    ModalEngine.open({
      type: 'execute',
      title: '📤 رفع ملف وإضافة شاهد في ملف الإنجاز المهني (معلمة لغتي - ثاني ابتدائي)',
      size: 'lg',
      confirmText: '💾 حفظ الملف وتوثيق الشاهد الآن',
      cancelText: 'إلغاء',
      showCancel: true,
      html: `
        <form id="modal-upload-evidence-form">
          <div class="form-group">
            <label class="form-label">اختيار ملف الشاهد من جهازكِ (PDF / Word / Excel / صورة)</label>
            <input type="file" class="form-control" id="modal-ev-file-input" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" />
            ${
              defaultFileName
                ? `<div class="form-hint" style="color:var(--status-success-text); font-weight:700;">✔️ الملف المختار جاهز للحفظ: ${defaultFileName} (${defaultFileSize})</div>`
                : `<div class="form-hint">يُحفظ الملف كاملاً في خزنة المتصفح الكبرى (IndexedDB) ويُنسخ تلقائيًا إلى مستودع GitHub خاص إذا كان النسخ السحابي مفعّلًا.</div>`
            }
          </div>

          <div class="grid grid-2 gap-3">
            <div class="form-group">
              <label class="form-label">قسم ملف الإنجاز <span class="required">*</span></label>
              <select class="form-select" id="ev-section">
                <option value="استراتيجيات تدريس مادة لغتي (ثاني ابتدائي)">استراتيجيات تدريس مادة لغتي (ثاني ابتدائي)</option>
                <option value="أوراق عمل وأنشطة الفهم القرائي والإملاء">أوراق عمل وأنشطة الفهم القرائي والإملاء</option>
                <option value="الخطط العلاجية والإثرائية (تحسين النتائج)">الخطط العلاجية والإثرائية (تحسين النتائج)</option>
                <option value="تحليل نتائج المتعلمات وتشخيص المستويات">تحليل نتائج المتعلمات وتشخيص المستويات</option>
                <option value="تهيئة البيئة التعليمية المحفزة (ركن القراءة)">تهيئة البيئة التعليمية المحفزة (ركن القراءة)</option>
                <option value="الدورات والتطوير المهني والمجتمع المهني">الدورات والتطوير المهني والمجتمع المهني</option>
                <option value="التواصل مع أمهات الطالبات والشراكة الأسرية">التواصل مع أمهات الطالبات والشراكة الأسرية</option>
                <option value="خطابات الشكر والتقدير">خطابات الشكر والتقدير</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">تصنيف الخصوصية والنطاق <span class="required">*</span></label>
              <select class="form-select" id="ev-scope-type">
                <option value="خاص بالمعلمة الحالية (رحلة البناء)">خاص بالمعلمة الحالية (رحلة البناء)</option>
                <option value="خاص بأي معلمة (قالب قابل للاستخدام)">خاص بأي معلمة (قالب قابل للاستخدام)</option>
                <option value="مشترك لمعلمات مادة لغتي — الصف الثاني الابتدائي">مشترك لمعلمات مادة لغتي — الصف الثاني الابتدائي</option>
                <option value="مشترك لمعلمات المرحلة الابتدائية">مشترك لمعلمات المرحلة الابتدائية</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">ربط الشاهد بمعيار تقييم الأداء الوظيفي لفئة المعلمة <span class="required">*</span></label>
            <select class="form-select" id="ev-criteria-id">${criteriaOptions}</select>
          </div>

          <div class="form-group">
            <label class="form-label">عنوان الشاهد أو الملف المرفوع <span class="required">*</span></label>
            <input type="text" class="form-control" id="ev-title" value="${defaultTitle}" placeholder="مثال: ورقة عمل تفاعلية لتمييز اللام الشمسية والقمرية - لغتي ثاني ابتدائي" required />
          </div>

          <div class="form-group">
            <label class="form-label">وصف الشاهد والأثر التربوي المتحقق لطالبات الصف الثاني <span class="required">*</span></label>
            <textarea class="form-control" id="ev-desc" rows="3" placeholder="اكتبي وصفاً موجزاً للشاهد وأثره على مهارات القراءة والكتابة لدى التلميذات..." required>توثيق تطبيقي ضمن رحلة بناء ملف الإنجاز المهني لمعلمة مادة لغتي للصف الثاني الابتدائي.</textarea>
          </div>
        </form>
      `,
      onConfirm: () => {
        const fileInput = document.getElementById('modal-ev-file-input');
        const chosenFile = (fileInput && fileInput.files && fileInput.files[0]) || preselectedFile;
        const section = document.getElementById('ev-section').value;
        const scopeType = document.getElementById('ev-scope-type').value;
        const criteriaId = document.getElementById('ev-criteria-id').value;
        const title = document.getElementById('ev-title').value.trim();
        const description = document.getElementById('ev-desc').value.trim();

        if (!title || !description) {
          ToastEngine.show({
            type: 'warning',
            title: 'حقول مطلوبة',
            message: 'يرجى كتابة عنوان الشاهد ووصفه التربوي.'
          });
          return false;
        }

        const itemId = 'pf-' + Date.now();
        const fileName = chosenFile ? chosenFile.name : 'شاهد_موثق_لغتي_ثاني_ابتدائي.pdf';
        const fileSize = chosenFile
          ? `${Math.max(1, Math.round(chosenFile.size / 1024))} KB`
          : '1.2 MB';
        const ext = fileName.split('.').pop().toLowerCase();
        const typeMap = {
          pdf: 'وثيقة PDF معتمدة',
          doc: 'ملف Word (.doc)',
          docx: 'ملف Word (.docx)',
          xls: 'جدول بيانات Excel',
          xlsx: 'جدول بيانات Excel (.xlsx)',
          ppt: 'عرض تقديمي PowerPoint',
          pptx: 'عرض تقديمي PowerPoint',
          png: 'صورة شواهد عالية الدقة (PNG)',
          jpg: 'صورة شواهد موثقة (JPG)',
          jpeg: 'صورة شواهد موثقة (JPEG)'
        };
        const attachmentType = typeMap[ext] || 'ملف مرفق موثق';

        (async () => {
          // The attached file is saved locally first. Auto-backup, when privately
          // configured, transfers it without any per-file cloud action.
          const savedFile = chosenFile ? await IndexedDBFileStore.saveFile(itemId, chosenFile) : true;
          if (chosenFile && !savedFile) {
            ToastEngine.show({
              type:'danger',title:'تعذر حفظ الملف محليًا',
              message:'لم يُحفظ الملف في IndexedDB؛ لم يُنشأ الشاهد. أعيدي المحاولة.'
            });
            return;
          }
          const githubDownloadUrl = null;

          StorageEngine.addPortfolioItem({
            id: itemId,
            userId: currentUser.id,
            criteriaId,
            scopeType,
            section,
            title,
            type: section,
            fileName,
            fileSize,
            attachmentType,
            githubDownloadUrl,
            description
          });

          // The private-repository backup service watches local saves.
          // A public repository is never an automatic destination.
          window.FTMAutoSync?.queueBackup('evidence-saved');

          renderPortfolioItems();
          renderPerformanceCriteria();
          renderUserHeaderAndCover();
          ToastEngine.show({
            type: 'success',
            title: 'تم حفظ الملف وتوثيق الشاهد بنجاح',
            message: `تم حفظ "${title}" (${fileName}) ويمكنكِ معاينته وتنزيله في أي وقت.`
          });
        })();

        return true;
      }
    });
  }

  // 6. عرض معايير تقييم الأداء الوظيفي الـ 11 لفئة المعلمة مع شروحاتها التفصيلية وشواهدها
  function renderPerformanceCriteria() {
    const container = document.getElementById('criteria-list-container');
    if (!container) return;

    const criteria = StorageEngine.getDB().criteria || [];
    const scores = currentUser.criteriaScores || {};
    const userPortfolio = StorageEngine.getPortfolioForUser(currentUser.id);

    container.innerHTML = criteria
      .map((c, index) => {
        const val = scores[c.id] !== undefined ? scores[c.id] : c.weight;
        const linkedItems = userPortfolio.filter((item) => item.criteriaId === c.id);
        const indicatorsHtml = Array.isArray(c.indicators)
          ? c.indicators.map((ind) => `<li>${ind}</li>`).join('')
          : '';

        const linkedBadgesHtml = linkedItems.length
          ? linkedItems
              .map(
                (li) =>
                  `<span class="file-attachment-chip">📎 ${li.title} (${li.fileName || 'مرفق'})</span>`
              )
              .join(' ')
          : `<span class="text-muted" style="font-size:0.82rem;">لم يُرفق ملف مباشر لهذا المعيار بعد — اضغطي زر الإرفاق لإضافة شاهد</span>`;

        return `
          <div class="criteria-detailed-card">
            <div class="criteria-top-bar">
              <div>
                <div class="fw-extrabold" style="font-size:1.04rem;">${index + 1}. ${c.title}</div>
                <div class="d-flex gap-2 flex-wrap mt-1">
                  <span class="badge badge-primary">${c.category}</span>
                  <span class="badge badge-gender">الوزن النسبي: ${c.weight}%</span>
                  <span class="badge ${linkedItems.length ? 'badge-success' : 'badge-info'}">
                    الشواهد المرفقة: ${linkedItems.length}
                  </span>
                </div>
              </div>

              <div>
                <button type="button" class="btn btn-sm btn-outline" data-attach-to-criteria="${c.id}">
                  📎 إرفاق ملف/شاهد للمعيار
                </button>
              </div>

              <div class="score-slider-wrap">
                <input type="range" min="1" max="${c.weight}" step="0.5" value="${val}" data-criteria-slider="${c.id}" data-max="${c.weight}" />
                <span class="badge badge-accent" id="score-val-${c.id}">${val} / ${c.weight}</span>
              </div>

              <div>
                <button type="button" class="btn btn-sm btn-ghost" data-toggle-criteria-exp="${c.id}">
                  📖 الشرح والمؤشرات
                </button>
              </div>
            </div>

            <div class="criteria-explanation-box" id="criteria-exp-${c.id}">
              <div class="mb-2">
                <strong style="color:var(--gender-primary);">📌 شرح المعيار وضوابطه لفئة المعلمة:</strong>
                <p class="mt-1">${c.explanation || ''}</p>
              </div>
              ${
                indicatorsHtml
                  ? `
                  <div class="mb-2">
                    <strong style="color:var(--primary-800);">✔️ مؤشرات التحقق لمعلمة مادة (لغتي - الصف الثاني الابتدائي):</strong>
                    <ul style="list-style:disc; padding-right:1.35rem; margin-top:0.25rem;">${indicatorsHtml}</ul>
                  </div>
                `
                  : ''
              }
              <div class="mb-2">
                <strong>💡 أمثلة الشواهد المطلوبة والمقترحة:</strong>
                <span> ${c.suggestedEvidence || ''}</span>
              </div>
              <div style="padding-top:0.55rem; border-top:1px solid var(--border-color);">
                <strong>📂 شواهد وملفات المعلمة المرفقة بهذا المعيار:</strong>
                <div class="d-flex flex-wrap gap-2 mt-1">${linkedBadgesHtml}</div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    function recalculateTotal() {
      let sum = 0;
      const updatedScores = {};
      container.querySelectorAll('[data-criteria-slider]').forEach((slider) => {
        const cid = slider.getAttribute('data-criteria-slider');
        const max = slider.getAttribute('data-max');
        const num = parseFloat(slider.value);
        updatedScores[cid] = num;
        sum += num;
        const badge = document.getElementById(`score-val-${cid}`);
        if (badge) badge.textContent = `${num} / ${max}`;
      });

      const rounded = Math.round(sum * 10) / 10;
      const totalEl = document.getElementById('live-total-performance-score');
      const progressEl = document.getElementById('live-performance-progress');
      if (totalEl) totalEl.textContent = `${rounded}%`;
      if (progressEl) progressEl.style.width = `${Math.min(100, rounded)}%`;

      return { rounded, updatedScores };
    }

    container.querySelectorAll('[data-criteria-slider]').forEach((slider) => {
      slider.addEventListener('input', recalculateTotal);
    });

    container.querySelectorAll('[data-attach-to-criteria]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-attach-to-criteria');
        openAddEvidenceModal(null, cid);
      });
    });

    container.querySelectorAll('[data-toggle-criteria-exp]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.getAttribute('data-toggle-criteria-exp');
        const box = document.getElementById(`criteria-exp-${cid}`);
        if (box) box.classList.toggle('hidden');
      });
    });

    recalculateTotal();

    const saveEvalBtn = document.getElementById('btn-save-performance-eval');
    if (saveEvalBtn) {
      saveEvalBtn.onclick = () => {
        const { rounded, updatedScores } = recalculateTotal();
        ModalEngine.execute({
          title: 'جاري حفظ وتوثيق درجات الأداء الوظيفي للمعلمة...',
          message: `يتم الآن تحديث بطاقة الأداء الوظيفي لـ (${currentUser.name}) بمجموع (${rounded}%)...`,
          duration: 800,
          successTitle: 'تم حفظ استمارة الأداء الوظيفي',
          successMessage: `تم حفظ التقييم الذاتي بنجاح في ذاكرة المتصفح بدرجة إجمالية (${rounded}%).`,
          onComplete: () => {
            currentUser.selfEvaluationScore = rounded;
            currentUser.criteriaScores = updatedScores;
            StorageEngine.updateUser(currentUser);
            renderUserHeaderAndCover();
          }
        });
      };
    }
  }

  // 7. بوابة مديرة المدرسة لاعتماد الأداء الوظيفي وملفات الإنجاز
  function renderSchoolStaffManagement() {
    const tbody = document.getElementById('school-staff-tbody');
    if (!tbody) return;

    const allUsers = StorageEngine.getUsers().filter((u) => u.systemRole === 'user');
    tbody.innerHTML = allUsers
      .map((u) => {
        const school = StorageEngine.getSchoolById(u.schoolId);
        const roleLabel = GenderEngine.jobTitle(u.jobRole, u.gender);
        const pfCount = StorageEngine.getPortfolioForUser(u.id).length;
        const libCount = (u.includedLibraryIds || []).length;
        return `
          <tr>
            <td><strong>${u.name}</strong><br><small class="text-muted">هوية: ${u.nationalId}</small></td>
            <td>
              <span class="badge badge-gender">${roleLabel}</span>
              <div style="font-size:0.78rem; margin-top:2px;">${u.subjectName || u.specialization}</div>
            </td>
            <td>${school.name}</td>
            <td><strong>${u.selfEvaluationScore || 98}%</strong></td>
            <td>
              <span class="badge badge-primary">${pfCount} شواهد</span>
              <span class="badge badge-accent">${libCount} وثائق</span>
            </td>
            <td><span class="badge badge-success">${u.evaluationStatus || 'معتمد'}</span></td>
            <td>
              <div class="d-flex gap-1">
                <button type="button" class="btn btn-sm btn-primary" data-approve-staff="${u.id}">اعتماد التقييم</button>
                <button type="button" class="btn btn-sm btn-ghost" data-msg-staff="${u.id}">مراسلة</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('[data-approve-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-approve-staff');
        const targetUser = StorageEngine.getUsers().find((x) => x.id === uid);
        if (!targetUser) return;
        const targetRole = GenderEngine.jobTitle(targetUser.jobRole, targetUser.gender);
        const evaluatorRole = GenderEngine.jobTitle('principal', currentUser.gender);

        ModalEngine.open({
          type: 'confirm',
          title: `اعتماد الأداء الوظيفي وملف الإنجاز — ${targetUser.name}`,
          confirmText: 'اعتماد وحفظ الدرجة الرسمية',
          cancelText: 'إلغاء',
          showCancel: true,
          html: `
            <p class="mb-2">اعتماد ملف الإنجاز المهني واستمارة الأداء الوظيفي لـ (${targetRole}: <strong>${targetUser.name}</strong>):</p>
            <div class="form-group">
              <label class="form-label">الدرجة المعتمدة من إدارة المدرسة (من 100)</label>
              <input type="number" class="form-control" id="principal-approved-score" min="50" max="100" value="${targetUser.selfEvaluationScore || 98}" />
            </div>
            <div class="form-group">
              <label class="form-label">حالة الاعتماد</label>
              <select class="form-select" id="principal-approved-status">
                <option value="معتمد نهائياً من ${evaluatorRole}">معتمد نهائياً من ${evaluatorRole}</option>
                <option value="معتمد مع التوصية بالتكريم والتميز">معتمد مع التوصية بالتكريم والتميز</option>
                <option value="قيد البناء والمراجعة">قيد البناء والمراجعة</option>
              </select>
            </div>
          `,
          onConfirm: () => {
            const newScore = Number(document.getElementById('principal-approved-score').value) || 98;
            const newStatus = document.getElementById('principal-approved-status').value;
            targetUser.selfEvaluationScore = newScore;
            targetUser.principalEvaluationScore = newScore;
            targetUser.evaluationStatus = newStatus;
            StorageEngine.updateUser(targetUser);
            renderSchoolStaffManagement();
            renderUserHeaderAndCover();
            ToastEngine.show({
              type: 'success',
              title: 'تم اعتماد الأداء الوظيفي وملف الإنجاز',
              message: `تم تحديث حالة (${targetUser.name}) إلى: ${newStatus} (${newScore}%).`
            });
            return true;
          }
        });
      });
    });

    tbody.querySelectorAll('[data-msg-staff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-msg-staff');
        MessageEngine.openComposeModal(uid);
      });
    });
  }

  // 8. عرض الرسائل والمراسلات الداخلية
  function renderMessagesList() {
    const listEl = document.getElementById('user-messages-list');
    if (!listEl) return;

    const msgs = StorageEngine.getMessagesForUser(currentUser.id);
    const badgeEl = document.getElementById('unread-msg-count');
    if (badgeEl) badgeEl.textContent = msgs.length;

    listEl.innerHTML = msgs
      .map(
        (m) => `
        <div class="card mb-2 gender-accent-strip">
          <div class="d-flex align-center justify-between flex-wrap gap-2 mb-1">
            <h4 class="fw-extrabold" style="font-size:1rem;">📩 ${m.subject}</h4>
            <span class="badge badge-accent">${m.date}</span>
          </div>
          <div class="text-muted mb-2" style="font-size:0.84rem;">
            <strong>من:</strong> ${m.senderName} &nbsp;|&nbsp; <strong>إلى:</strong> ${m.recipientName}
          </div>
          <p style="font-size:0.93rem;">${m.body}</p>
        </div>
      `
      )
      .join('');
  }

  // 9. ربط منطقة السحب والإفلات ورفع الملفات الفعلية من جهاز المعلمة
  const dropzone = document.getElementById('direct-file-dropzone');
  const fileInput = document.getElementById('direct-file-input');
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        openAddEvidenceModal(fileInput.files[0]);
        fileInput.value = '';
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('is-dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        openAddEvidenceModal(e.dataTransfer.files[0]);
      }
    });
  }

  // 10. التنقل بين التبويبات الـ 6 في صفحة المعلمة
  document.querySelectorAll('[data-workspace-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-workspace-tab');
      document.querySelectorAll('[data-workspace-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.workspace-section').forEach((sec) => {
        sec.classList.toggle('is-active', sec.id === targetId);
      });
    });
  });

  // تصفية مكتبة المكونات الجاهزة حسب النطاق
  document.querySelectorAll('[data-lib-scope]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeLibScopeFilter = btn.getAttribute('data-lib-scope');
      document.querySelectorAll('[data-lib-scope]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderSharedLibrary();
    });
  });

  // ربط أزرار الإجراءات
  const btnAddEvidence = document.getElementById('btn-add-portfolio-evidence');
  if (btnAddEvidence) btnAddEvidence.addEventListener('click', () => openAddEvidenceModal());

  const btnAddEvidence2 = document.getElementById('btn-open-evidence-modal-2');
  if (btnAddEvidence2) btnAddEvidence2.addEventListener('click', () => openAddEvidenceModal());

  const btnEditCV = document.getElementById('btn-edit-cv-card');
  if (btnEditCV) btnEditCV.addEventListener('click', openEditCVModal);

  const btnAddSharedComp = document.getElementById('btn-add-shared-component');
  if (btnAddSharedComp) btnAddSharedComp.addEventListener('click', openAddSharedComponentModal);

  const btnComposeMsg = document.getElementById('btn-user-compose-msg');
  if (btnComposeMsg) {
    btnComposeMsg.addEventListener('click', () => MessageEngine.openComposeModal());
  }

  const profileSelect = document.getElementById('quick-user-profile-select');
  if (profileSelect) {
    profileSelect.addEventListener('change', () => {
      const selectedUser = StorageEngine.getUsers().find((u) => u.id === profileSelect.value);
      if (selectedUser) {
        StorageEngine.saveSessionUser(selectedUser);
        currentUser = selectedUser;
        GenderEngine.applyToDOM(selectedUser.gender);
        refreshAllUserViews();
        ToastEngine.show({
          type: 'info',
          title: 'تم تبديل ملف المستخدم النشط',
          message: `أنتِ الآن تستعرضين ملف: ${selectedUser.name}`
        });
      }
    });
  }

  function refreshAllUserViews() {
    currentUser = getActiveUser();
    // FTM: intentionally omit the lengthy welcome banner.
    renderUserHeaderAndCover();
    renderCVCard();
    renderSharedLibrary();
    renderPortfolioItems();
    renderPerformanceCriteria();
    renderSchoolStaffManagement();
    renderMessagesList();
  }

  window.addEventListener('itqan:ftmIdentityChanged', () => { renderUserHeaderAndCover(); renderCVCard(); });
  window.addEventListener('itqan:genderChanged', refreshAllUserViews);
  window.addEventListener('itqan:messagesUpdated', renderMessagesList);

  refreshAllUserViews();
});
