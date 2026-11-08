/**
 * ============================================================================
 * CORE ENGINES (assets/js/core/engines.js)
 * المحركات المركزية الموحدة للمشروع (تقرأ وتنفذ وفق PROJECT_INSTRUCTIONS.md)
 * - يمنع استخدام alert() نهائياً ويستبدل بـ ModalEngine
 * - محرك التأنيث والتذكير والهوية البصرية (GenderEngine)
 * - محرك الرسائل الداخلية مع زر X للإغلاق (BannerEngine & ToastEngine)
 * - محرك المكتبة المشتركة والمكونات الجاهزة (SharedLibraryData)
 * - محرك خزنة الملفات المحلية الكبيرة (IndexedDBFileStore)
 * - محرك الخزنة السحابية والمزامنة المجانية عبر جتهب (GitHubStorageEngine)
 * - محرك الطباعة الرسمي المشترك (PrintEngine)
 * - محرك المراسلات الداخلية (MessageEngine)
 * - محرك التخزين المحلي متعدد المدارس والصلاحيات (StorageEngine & AuthEngine)
 * - محرك النماذج التصميمية الثلاثة (ThemeEngine)
 * ============================================================================
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'ITQAN_EDU_PLATFORM_DB_V2';
  const THEME_KEY = 'ITQAN_ACTIVE_DESIGN_MODEL';
  const GENDER_PREVIEW_KEY = 'ITQAN_ACTIVE_GENDER_PREVIEW';
  const GITHUB_CONFIG_KEY = 'ITQAN_GITHUB_SYNC_CONFIG';

  /* ==========================================================================
     1. أيقونات SVG محلية موحدة (بدون أي مكتبات CDN خارجية)
     ========================================================================== */
  const Icons = {
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    confirm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    execute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
  };

  /* ==========================================================================
     2. محرك التأنيث والتذكير والهوية البصرية حسب الجنس (GenderEngine)
     ========================================================================== */
  const GenderDictionary = {
    teacher: { male: 'معلم', female: 'معلمة' },
    principal: { male: 'مدير مدرسة', female: 'مديرة مدرسة' },
    vice_principal: { male: 'وكيل مدرسة', female: 'وكيلة مدرسة' },
    counselor: { male: 'موجه طلابي', female: 'موجهة طلابية' },
    lab_prep: { male: 'محضر مختبر', female: 'محضرة مختبر' },
    admin: { male: 'مدير النظام', female: 'مديرة النظام' },
    user: { male: 'مستخدم', female: 'مستخدمة' },
    employee: { male: 'منسوب التعليم', female: 'منسوبة التعليم' },
    honorific: { male: 'الأستاذ', female: 'الأستاذة' },
    welcome: { male: 'مرحباً بك يا أستاذ', female: 'مرحباً بكِ يا أستاذة' },
    dear_educator: { male: 'عزيزي التربوي', female: 'عزيزتي التربوية' },
    portfolio_main_title: { male: 'ملف الإنجاز المهني للمعلم', female: 'ملف الإنجاز المهني للمعلمة' },
    leader_portfolio_title: { male: 'ملف الإنجاز القيادي لمدير المدرسة', female: 'ملف الإنجاز القيادي لمديرة المدرسة' },
    performance_sheet: { male: 'معايير واستمارة تقييم الأداء الوظيفي للمعلم', female: 'معايير واستمارة تقييم الأداء الوظيفي للمعلمة' },
    cv_card_title: { male: 'بطاقة السيرة الذاتية المهنية للمعلم', female: 'بطاقة السيرة الذاتية المهنية للمعلمة' },
    evaluator_title: { male: 'مدير المدرسة (المقيِّم)', female: 'مديرة المدرسة (المقيِّمة)' },
    evaluated_title: { male: 'المعلم المشمول بالتقييم', female: 'المعلمة المشمولة بالتقييم' },
    identity_badge: { male: 'الهوية البصرية: طابع رسمي (بنين)', female: 'الهوية البصرية: طابع مؤسسي راقٍ (بنات)' },
    self_eval_action: { male: 'حفظ واعتماد التقييم الذاتي للمعلم', female: 'حفظ واعتماد التقييم الذاتي للمعلمة' },
    school_category: { male: 'مدارس البنين', female: 'مدارس البنات' },
    completion_msg: { male: 'مكتمل وجاهز للمراجعة والاعتماد', female: 'مكتملة وجاهزة للمراجعة والاعتماد' },
    active_status: { male: 'مباشر على رأس العمل', female: 'مباشرة على رأس العمل' }
  };

  const GenderEngine = {
    getCurrentGender() {
      const sessionUser = StorageEngine.getCurrentUser();
      if (sessionUser && sessionUser.gender) {
        return sessionUser.gender;
      }
      return localStorage.getItem(GENDER_PREVIEW_KEY) || 'female';
    },

    setPreviewGender(gender) {
      const valid = gender === 'male' ? 'male' : 'female';
      localStorage.setItem(GENDER_PREVIEW_KEY, valid);
      const sessionUser = StorageEngine.getCurrentUser();
      if (sessionUser) {
        sessionUser.gender = valid;
        StorageEngine.saveSessionUser(sessionUser);
      }
      this.applyToDOM(valid);
      window.dispatchEvent(new CustomEvent('itqan:genderChanged', { detail: { gender: valid } }));
    },

    t(key, genderOverride) {
      const g = genderOverride || this.getCurrentGender();
      const entry = GenderDictionary[key];
      if (!entry) return key;
      return entry[g] || entry.female;
    },

    jobTitle(jobRoleKey, genderOverride) {
      return this.t(jobRoleKey || 'teacher', genderOverride);
    },

    portfolioTitle(jobRoleKey, genderOverride) {
      const g = genderOverride || this.getCurrentGender();
      const roleTitle = this.jobTitle(jobRoleKey, g);
      return `ملف الإنجاز المهني (${roleTitle})`;
    },

    applyToDOM(genderOverride) {
      const g = genderOverride || this.getCurrentGender();
      document.documentElement.setAttribute('data-gender-theme', g);

      document.querySelectorAll('[data-gender-key]').forEach((el) => {
        const key = el.getAttribute('data-gender-key');
        el.textContent = this.t(key, g);
      });

      document.querySelectorAll('[data-male][data-female]').forEach((el) => {
        el.textContent = g === 'female' ? el.getAttribute('data-female') : el.getAttribute('data-male');
      });

      document.querySelectorAll('[data-switch-gender]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-switch-gender') === g);
      });
    }
  };

  /* ==========================================================================
     3. محرك النوافذ الموحد (ModalEngine) - يمنع استخدام Alert نهائياً
     ========================================================================== */
  const ModalEngine = {
    backdropEl: null,

    ensureContainer() {
      if (this.backdropEl) return this.backdropEl;
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      backdrop.id = 'unified-modal-backdrop';
      backdrop.innerHTML = `
        <div class="modal-dialog" id="unified-modal-dialog" role="dialog" aria-modal="true">
          <div class="modal-header">
            <div class="modal-header-title-wrap">
              <span class="modal-status-badge" id="unified-modal-icon"></span>
              <h3 class="modal-title" id="unified-modal-title"></h3>
            </div>
            <button type="button" class="modal-close-btn" id="unified-modal-close-x" title="إغلاق">×</button>
          </div>
          <div class="modal-body" id="unified-modal-body"></div>
          <div class="modal-footer" id="unified-modal-footer"></div>
        </div>
      `;
      document.body.appendChild(backdrop);

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop && backdrop.dataset.dismissOnOutside !== 'false') {
          this.close();
        }
      });

      backdrop.querySelector('#unified-modal-close-x').addEventListener('click', () => this.close());
      this.backdropEl = backdrop;
      return backdrop;
    },

    open(options = {}) {
      const {
        type = 'info',
        title = 'تنبيه النظام',
        html = '',
        size = '',
        confirmText = 'موافق',
        cancelText = 'إلغاء الأمر',
        showCancel = false,
        hideFooter = false,
        dismissOnOutside = true,
        onConfirm = null,
        onCancel = null
      } = options;

      const backdrop = this.ensureContainer();
      const dialog = backdrop.querySelector('#unified-modal-dialog');
      const iconBox = backdrop.querySelector('#unified-modal-icon');
      const titleEl = backdrop.querySelector('#unified-modal-title');
      const bodyEl = backdrop.querySelector('#unified-modal-body');
      const footerEl = backdrop.querySelector('#unified-modal-footer');

      backdrop.dataset.dismissOnOutside = String(dismissOnOutside);
      dialog.className = `modal-dialog modal-type-${type} ${size ? 'modal-' + size : ''}`;
      iconBox.innerHTML = Icons[type] || Icons.info;
      titleEl.textContent = title;
      bodyEl.innerHTML = html;

      if (hideFooter) {
        footerEl.classList.add('hidden');
      } else {
        footerEl.classList.remove('hidden');
        footerEl.innerHTML = '';

        if (showCancel) {
          const cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.className = 'btn btn-ghost';
          cancelBtn.textContent = cancelText;
          cancelBtn.addEventListener('click', () => {
            this.close();
            if (typeof onCancel === 'function') onCancel();
          });
          footerEl.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        const btnColorMap = {
          danger: 'btn-danger',
          error: 'btn-danger',
          warning: 'btn-warning',
          confirm: 'btn-primary',
          success: 'btn-success',
          info: 'btn-primary',
          execute: 'btn-primary'
        };
        confirmBtn.className = `btn ${btnColorMap[type] || 'btn-primary'}`;
        confirmBtn.textContent = confirmText;
        confirmBtn.addEventListener('click', () => {
          if (typeof onConfirm === 'function') {
            const shouldStayOpen = onConfirm() === false;
            if (!shouldStayOpen) this.close();
          } else {
            this.close();
          }
        });
        footerEl.appendChild(confirmBtn);
      }

      requestAnimationFrame(() => {
        backdrop.classList.add('is-open');
      });
    },

    close() {
      if (!this.backdropEl) return;
      this.backdropEl.classList.remove('is-open');
    },

    alert({ type = 'info', title = 'إشعار النظام', message = '', confirmText = 'حسناً، فهمت', onConfirm = null }) {
      this.open({
        type,
        title,
        html: `<p>${message}</p>`,
        confirmText,
        showCancel: false,
        onConfirm
      });
    },

    confirm({
      type = 'confirm',
      title = 'تأكيد الإجراء',
      message = 'هل أنت متأكد من رغبتك في إتمام هذا الإجراء؟',
      confirmText = 'نعم، تأكيد التنفيذ',
      cancelText = 'تراجع',
      onConfirm = null,
      onCancel = null
    }) {
      this.open({
        type,
        title,
        html: `<p>${message}</p>`,
        confirmText,
        cancelText,
        showCancel: true,
        onConfirm,
        onCancel
      });
    },

    execute({
      title = 'جاري تنفيذ العملية...',
      message = 'يرجى الانتظار قليلاً ريثما تتم معالجة البيانات وحفظها.',
      duration = 800,
      successTitle = 'تم التنفيذ بنجاح',
      successMessage = 'تمت معالجة وحفظ التحديثات بنجاح.',
      onComplete = null
    }) {
      this.open({
        type: 'execute',
        title,
        html: `
          <div class="text-center">
            <div class="modal-spinner"></div>
            <p class="fw-semibold">${message}</p>
          </div>
        `,
        hideFooter: true,
        dismissOnOutside: false
      });

      setTimeout(() => {
        if (typeof onComplete === 'function') {
          onComplete();
        }
        this.alert({
          type: 'success',
          title: successTitle,
          message: successMessage
        });
      }, duration);
    }
  };

  window.alert = function (msg) {
    ModalEngine.alert({
      type: 'info',
      title: 'تنبيه النظام الموحد',
      message: String(msg)
    });
  };

  /* ==========================================================================
     4. محرك الرسائل الداخلية الموحدة مع زر X للإغلاق (BannerEngine & ToastEngine)
     ========================================================================== */
  const BannerEngine = {
    createAlertElement({ type = 'info', title = '', message = '' }) {
      const alertEl = document.createElement('div');
      alertEl.className = `page-alert page-alert-${type}`;
      alertEl.setAttribute('role', 'alert');

      const iconSvg = Icons[type] || Icons.info;
      alertEl.innerHTML = `
        <div class="page-alert-main">
          <span class="page-alert-icon">${iconSvg}</span>
          <div class="page-alert-content">
            ${title ? `<div class="page-alert-title">${title}</div>` : ''}
            <div class="page-alert-message">${message}</div>
          </div>
        </div>
        <button type="button" class="page-alert-close" aria-label="إغلاق الرسالة" title="إغلاق">×</button>
      `;

      const closeBtn = alertEl.querySelector('.page-alert-close');
      closeBtn.addEventListener('click', () => {
        alertEl.classList.add('is-closing');
        setTimeout(() => alertEl.remove(), 200);
      });

      return alertEl;
    },

    render(containerOrSelector, { type = 'info', title = '', message = '', clearPrevious = false }) {
      const container = typeof containerOrSelector === 'string'
        ? document.querySelector(containerOrSelector)
        : containerOrSelector;
      if (!container) return null;

      if (clearPrevious) {
        container.innerHTML = '';
      }

      const alertEl = this.createAlertElement({ type, title, message });
      container.prepend(alertEl);
      return alertEl;
    }
  };

  const ToastEngine = {
    stackEl: null,

    ensureStack() {
      if (this.stackEl) return this.stackEl;
      const stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
      this.stackEl = stack;
      return stack;
    },

    show({ type = 'success', title = '', message = '', duration = 4500 }) {
      const stack = this.ensureStack();
      const toast = BannerEngine.createAlertElement({ type, title, message });
      stack.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => {
          if (toast.parentNode) {
            toast.classList.add('is-closing');
            setTimeout(() => toast.remove(), 200);
          }
        }, duration);
      }
    }
  };

  /* ==========================================================================
     5. محرك خزنة الملفات المحلية الكبيرة (IndexedDBFileStore)
     يحفظ ملفات PDF / Word / Excel / الصور كاملة داخل المتصفح بدون حدود 5MB
     ========================================================================== */
  const IndexedDBFileStore = {
    dbName: 'ITQAN_BINARY_FILES_DB',
    storeName: 'uploaded_files',

    openDB() {
      return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
          reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'));
          return;
        }
        const req = window.indexedDB.open(this.dbName, 1);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'fileId' });
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      });
    },

    async saveFile(fileId, fileBlobOrObject) {
      try {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          const store = tx.objectStore(this.storeName);
          store.put({
            fileId,
            name: fileBlobOrObject.name || 'file',
            type: fileBlobOrObject.type || 'application/octet-stream',
            size: fileBlobOrObject.size || 0,
            blob: fileBlobOrObject,
            savedAt: new Date().toISOString()
          });
          tx.oncomplete = () => resolve(true);
          tx.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {
        console.warn('IndexedDB save fallback:', err);
        return false;
      }
    },

    async getFile(fileId) {
      try {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
          const tx = db.transaction(this.storeName, 'readonly');
          const store = tx.objectStore(this.storeName);
          const req = store.get(fileId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = (e) => reject(e.target.error);
        });
      } catch (err) {
        return null;
      }
    },

    async deleteFile(fileId) {
      try {
        const db = await this.openDB();
        return new Promise((resolve) => {
          const tx = db.transaction(this.storeName, 'readwrite');
          tx.objectStore(this.storeName).delete(fileId);
          tx.oncomplete = () => resolve(true);
        });
      } catch (err) {
        return false;
      }
    }
  };

  /* ==========================================================================
     6. محرك الخزنة السحابية والمزامنة المجانية عبر جتهب (GitHubStorageEngine)
     يحفظ الملفات الفعلية في مجلد uploads/ ويحفظ قاعدة البيانات في data/database.json
     ========================================================================== */
  const GitHubStorageEngine = {
    getAutoDetectedRepo() {
      // إذا كان الموقع يعمل على username.github.io/repo-name يكتشفه تلقائياً
      const host = window.location.hostname || '';
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (host.endsWith('.github.io')) {
        const owner = host.replace('.github.io', '');
        const repo = pathParts[0] || 'itqan';
        return { owner, repo, branch: 'main', token: '' };
      }
      return { owner: 'khalidftm', repo: 'itqan', branch: 'main', token: '' };
    },

    getConfig() {
      try {
        const saved = localStorage.getItem(GITHUB_CONFIG_KEY);
        if (saved) {
          return { ...this.getAutoDetectedRepo(), ...JSON.parse(saved) };
        }
      } catch (e) {}
      return this.getAutoDetectedRepo();
    },

    saveConfig(cfg) {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg));
    },

    isConfigured() {
      const cfg = this.getConfig();
      return Boolean(cfg.owner && cfg.repo && cfg.token);
    },

    // تحويل نص UTF-8 (عربي) إلى Base64 متوافق مع GitHub API
    utf8ToBase64(str) {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    },

    // تحويل Base64 قادم من GitHub API إلى نص UTF-8 (عربي)
    base64ToUtf8(b64) {
      const clean = (b64 || '').replace(/\s/g, '');
      const binary = window.atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    },

    // تحويل ملف (File / Blob) إلى Base64 لرفعه على GitHub
    fileToBase64(fileBlob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64Part = result.includes(',') ? result.split(',')[1] : result;
          resolve(base64Part);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(fileBlob);
      });
    },

    // الحصول على SHA للملف إذا كان موجوداً مسبقاً في مستودع GitHub لتحديثه
    async getFileSha(path, cfg) {
      const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${path}?ref=${encodeURIComponent(cfg.branch || 'main')}`;
      const headers = { Accept: 'application/vnd.github+json' };
      if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

      const res = await fetch(url, { headers });
      if (res.status === 200) {
        const data = await res.json();
        return data.sha;
      }
      return null;
    },

    // رفع ملف فعلي (PDF, Word, Excel, صورة) إلى مجلد uploads/ في مستودع GitHub
    async uploadBinaryFile(fileBlob, userId = 'sara') {
      const cfg = this.getConfig();
      if (!cfg.owner || !cfg.repo || !cfg.token) {
        return { ok: false, reason: 'not_configured' };
      }

      const safeFileName = (fileBlob.name || 'document.pdf').replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '_');
      const repoPath = `uploads/${userId}/${Date.now()}_${safeFileName}`;
      const base64Content = await this.fileToBase64(fileBlob);
      const existingSha = await this.getFileSha(repoPath, cfg);

      const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${repoPath}`;
      const body = {
        message: `رفع ملف شاهد جديد: ${safeFileName}`,
        content: base64Content,
        branch: cfg.branch || 'main'
      };
      if (existingSha) body.sha = existingSha;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `خطأ من GitHub API (${res.status})`);
      }

      const result = await res.json();
      return {
        ok: true,
        repoPath,
        downloadUrl: result.content && result.content.download_url,
        htmlUrl: result.content && result.content.html_url
      };
    },

    // حفظ قاعدة البيانات الكاملة للموقع في data/database.json على مستودع GitHub
    async pushDatabaseToGitHub() {
      const cfg = this.getConfig();
      if (!cfg.owner || !cfg.repo || !cfg.token) {
        throw new Error('يرجى إدخال اسم المستخدم واسم المستودع ومفتاح الوصول (Token) أولاً.');
      }

      const dbObj = StorageEngine.getDB();
      const jsonString = JSON.stringify(dbObj, null, 2);
      const base64Content = this.utf8ToBase64(jsonString);
      const repoPath = 'data/database.json';
      const existingSha = await this.getFileSha(repoPath, cfg);

      const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${repoPath}`;
      const body = {
        message: `تحديث قاعدة بيانات ملف الإنجاز والأداء الوظيفي - ${new Date().toLocaleString('ar-SA')}`,
        content: base64Content,
        branch: cfg.branch || 'main'
      };
      if (existingSha) body.sha = existingSha;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${cfg.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `تعذر الحفظ على GitHub (${res.status})`);
      }

      return await res.json();
    },

    // جلب قاعدة البيانات من data/database.json في مستودع GitHub لفتحها من أي جهاز
    async pullDatabaseFromGitHub() {
      const cfg = this.getConfig();
      if (!cfg.owner || !cfg.repo) {
        throw new Error('يرجى تحديد اسم حساب GitHub واسم المستودع أولاً.');
      }

      const repoPath = 'data/database.json';
      const url = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${repoPath}?ref=${encodeURIComponent(cfg.branch || 'main')}`;
      const headers = { Accept: 'application/vnd.github+json' };
      if (cfg.token) headers.Authorization = `Bearer ${cfg.token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`لم يتم العثور على ملف data/database.json في المستودع أو المستودع خاص (${res.status}).`);
      }

      const data = await res.json();
      const decodedJson = this.base64ToUtf8(data.content);
      const remoteDB = JSON.parse(decodedJson);

      if (remoteDB && remoteDB.users) {
        StorageEngine.saveDB(remoteDB);
        const currentUser = StorageEngine.getCurrentUser();
        if (currentUser) {
          const updatedSelf = remoteDB.users.find((u) => u.id === currentUser.id) || remoteDB.users[0];
          StorageEngine.saveSessionUser(updatedSelf);
        }
        return remoteDB;
      }
      throw new Error('ملف البيانات المسترد غير صالح.');
    },

    // نافذة إعدادات ومزامنة GitHub السحابية المجانية
    openSyncModal() {
      const cfg = this.getConfig();
      const isReady = this.isConfigured();

      ModalEngine.open({
        type: 'info',
        title: '☁️ الخزنة السحابية المجانية والمزامنة عبر GitHub (GitHubStorageEngine)',
        size: 'lg',
        confirmText: '💾 حفظ إعدادات الربط',
        cancelText: 'إغلاق',
        showCancel: true,
        html: `
          <div class="gender-accent-card mb-3" style="padding:1rem 1.2rem; font-size:0.88rem;">
            <div class="fw-extrabold mb-1">💡 كيف تعمل هذه الخزنة المجانية؟</div>
            <p>
              1. <strong>بدون إعدادات (تلقائياً):</strong> تُحفظ كافة ملفاتكِ المرفوعة (PDF, Word, Excel, الصور) فوراً في خزنة المتصفح الكبرى (<code>IndexedDB</code>) على هذا الجهاز.<br>
              2. <strong>عند ربط حسابكِ المجاني في GitHub:</strong> يتم رفع الملفات فعلياً إلى مجلد <code>uploads/</code> وحفظ بياناتكِ في <code>data/database.json</code> داخل مستودعكِ في GitHub لتتمكني من فتحها من جوالكِ أو أي كمبيوتر آخر!
            </p>
          </div>

          <form id="github-sync-config-form">
            <div class="grid grid-2 gap-3">
              <div class="form-group">
                <label class="form-label">اسم حسابك في GitHub (Owner / Username)</label>
                <input type="text" class="form-control" id="gh-owner" placeholder="مثال: khmob" value="${cfg.owner || ''}" dir="ltr" />
              </div>
              <div class="form-group">
                <label class="form-label">اسم المستودع في GitHub (Repository Name)</label>
                <input type="text" class="form-control" id="gh-repo" placeholder="مثال: itqan-portfolio" value="${cfg.repo || ''}" dir="ltr" />
              </div>
            </div>

            <div class="grid grid-2 gap-3">
              <div class="form-group">
                <label class="form-label">الفرع (Branch)</label>
                <input type="text" class="form-control" id="gh-branch" value="${cfg.branch || 'main'}" dir="ltr" />
              </div>
              <div class="form-group">
                <label class="form-label">مفتاح الوصول الشخصي المجاني (GitHub Personal Access Token)</label>
                <input type="password" class="form-control" id="gh-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" value="${cfg.token || ''}" dir="ltr" />
                <div class="form-hint">يُستخرج مجاناً من إعدادات GitHub &rarr; Developer settings &rarr; Personal access tokens (بصلاحية repo).</div>
              </div>
            </div>

            <div class="card mt-2" style="background:var(--bg-surface-alt); padding:1rem;">
              <div class="d-flex align-center justify-between flex-wrap gap-2">
                <div>
                  <strong style="font-size:0.9rem;">العمليات السحابية المباشرة مع مستودع GitHub:</strong>
                  <div class="text-muted" id="gh-sync-status-msg" style="font-size:0.82rem;">
                    ${isReady ? '✔️ إعدادات الربط جاهزة للمزامنة السحابية' : 'ℹ️ أدخلي بيانات المستودع والمفتاح أعلاه لتفعيل الرفع السحابي المباشر'}
                  </div>
                </div>
                <div class="d-flex gap-2 flex-wrap">
                  <button type="button" class="btn btn-sm btn-primary" id="btn-gh-push-now">
                    ☁️ رفع وحفظ بياناتي إلى GitHub الآن (Push)
                  </button>
                  <button type="button" class="btn btn-sm btn-outline" id="btn-gh-pull-now">
                    📥 جلب آخر نسخة من GitHub (Pull)
                  </button>
                </div>
              </div>
            </div>
          </form>
        `,
        onConfirm: () => {
          const newCfg = {
            owner: document.getElementById('gh-owner').value.trim(),
            repo: document.getElementById('gh-repo').value.trim(),
            branch: document.getElementById('gh-branch').value.trim() || 'main',
            token: document.getElementById('gh-token').value.trim()
          };
          this.saveConfig(newCfg);
          ToastEngine.show({
            type: 'success',
            title: 'تم حفظ إعدادات GitHub',
            message: newCfg.owner && newCfg.repo
              ? `تم ربط المنصة بالمستودع: ${newCfg.owner}/${newCfg.repo}`
              : 'تم تحديث إعدادات المزامنة.'
          });
          return true;
        }
      });

      // ربط أزرار الرفع والجلب داخل النافذة
      setTimeout(() => {
        const pushBtn = document.getElementById('btn-gh-push-now');
        const pullBtn = document.getElementById('btn-gh-pull-now');
        const statusMsg = document.getElementById('gh-sync-status-msg');

        const readCurrentInputs = () => {
          const cfgNow = {
            owner: document.getElementById('gh-owner').value.trim(),
            repo: document.getElementById('gh-repo').value.trim(),
            branch: document.getElementById('gh-branch').value.trim() || 'main',
            token: document.getElementById('gh-token').value.trim()
          };
          this.saveConfig(cfgNow);
          return cfgNow;
        };

        if (pushBtn) {
          pushBtn.addEventListener('click', async () => {
            readCurrentInputs();
            if (statusMsg) statusMsg.textContent = '⏳ جاري الاتصال بـ GitHub ورفع قاعدة البيانات...';
            pushBtn.disabled = true;
            try {
              await this.pushDatabaseToGitHub();
              if (statusMsg) statusMsg.textContent = '✅ تم رفع وحفظ جميع بياناتكِ بنجاح في data/database.json على GitHub!';
              ToastEngine.show({
                type: 'success',
                title: 'تم الحفظ السحابي على GitHub',
                message: 'تم تحديث ملف data/database.json في مستودعكِ بنجاح.'
              });
            } catch (err) {
              if (statusMsg) statusMsg.textContent = `❌ تعذر الرفع: ${err.message}`;
              ToastEngine.show({
                type: 'danger',
                title: 'خطأ في الاتصال بـ GitHub',
                message: err.message
              });
            } finally {
              pushBtn.disabled = false;
            }
          });
        }

        if (pullBtn) {
          pullBtn.addEventListener('click', async () => {
            readCurrentInputs();
            if (statusMsg) statusMsg.textContent = '⏳ جاري جلب أحدث البيانات من مستودع GitHub...';
            pullBtn.disabled = true;
            try {
              await this.pullDatabaseFromGitHub();
              if (statusMsg) statusMsg.textContent = '✅ تم جلب البيانات وتحديث المتصفح بنجاح! سيتم تحديث الصفحة...';
              ToastEngine.show({
                type: 'success',
                title: 'تم استرداد البيانات من GitHub',
                message: 'تم تحديث ملف الإنجاز والبيانات من المستودع السحابي.'
              });
              setTimeout(() => window.location.reload(), 900);
            } catch (err) {
              if (statusMsg) statusMsg.textContent = `❌ تعذر الجلب: ${err.message}`;
              ToastEngine.show({
                type: 'danger',
                title: 'تعذر جلب البيانات',
                message: err.message
              });
            } finally {
              pullBtn.disabled = false;
            }
          });
        }
      }, 60);
    }
  };

  /* ==========================================================================
     7. معايير تقييم الأداء الوظيفي لفئة المعلم/المعلمة مع شروحاتها التفصيلية
     ========================================================================== */
  const DefaultCriteria = [
    {
      id: 'c1',
      title: 'أداء الواجبات الوظيفية والالتزام بالأنظمة والتعليمات',
      weight: 10,
      category: 'الانضباط المهني',
      explanation: 'يقيس مدى التزام المعلمة بأوقات الدوام الرسمي، حضور الطابور الصباحي وحصص الانتظار والمناوبة، وتنفيذ التكليفات الإدارية والتربوية بدقة وانتظام وفق الأنظمة الوزارية.',
      indicators: [
        'الانتظام في الحضور والانصراف وعدم الغياب أو التأخر.',
        'المبادرة في تغطية حصص الانتظار والإشراف اليومي والمناوبة.',
        'التقيد بالتعاميم واللوائح المنظمة للعمل المدرسي.'
      ],
      suggestedEvidence: 'بيان الحضور والانصراف من نظام نور / حضوري، سجل المناوبة والإشراف، خطابات التكليف المنجزة.'
    },
    {
      id: 'c2',
      title: 'التفاعل مع المجتمع المهني وتبادل الخبرات التربوية',
      weight: 10,
      category: 'المجتمع المهني',
      explanation: 'يركز على المشاركة الفاعلة في مجتمعات التعلم المهنية داخل المدرسة وخارجها، وتبادل الزيارات الصفية مع معلمات الصفوف الأولية، وحضور الدورات والورش التدريبية.',
      indicators: [
        'تنفيذ زيارات صفية تبادلية مع معلمات مادة لغتي والصفوف الأولية.',
        'المشاركة في مجتمعات التعلم المهنية وحلقات النقاش التربوية.',
        'حضور البرامج التدريبية المعتمدة في المعهد الوطني للتطوير المهني.'
      ],
      suggestedEvidence: 'سجل الزيارات التبادلية، شهادات الدورات التدريبية، محاضر اجتماعات تخصص اللغة العربية / الصفوف الأولية.'
    },
    {
      id: 'c3',
      title: 'التفاعل والتواصل الإيجابي مع أولياء الأمور',
      weight: 10,
      category: 'الشراكة المجتمعية',
      explanation: 'يعنى بتعزيز الشراكة الفاعلة مع أمهات وأولياء أمور طالبات الصف الثاني الابتدائي وإطلاعهم الدوري على مستوى تقدم الطالبات في مهارات القراءة والكتابة بمادة لغتي.',
      indicators: [
        'إرسال تقارير دورية لأسر الطالبات حول مستوى إتقان مهارات لغتي.',
        'المشاركة الفاعلة في مجالس الأمهات واللقاءات التربوية.',
        'التواصل الإيجابي عبر المنصات الرسمية لمتابعة الخطط العلاجية والإثرائية.'
      ],
      suggestedEvidence: 'نماذج إشعارات أولياء الأمور، سجل التواصل مع أمهات الطالبات، تقارير المشاركة في مجلس الأمهات.'
    },
    {
      id: 'c4',
      title: 'التنويع في استراتيجيات التدريس الحديثة الملائمة للصفوف الأولية',
      weight: 10,
      category: 'الممارسات التدريسية',
      explanation: 'يقيس قدرة المعلمة على توظيف استراتيجيات تدريس نشطة ومشوقة تناسب خصائص طالبات الصف الثاني الابتدائي (التعلم باللعب، القصة، مسرح العرائس، البطاقات المروحية، التعلم التعاوني).',
      indicators: [
        'توظيف استراتيجيات التعلم النشط المناسبة لتعليم القراءة الجهرية والظواهر اللغوية.',
        'مراعاة الفروق الفردية وأنماط التعلم (البصري، السمعي، الحركي) لدى تلميذات الصف الثاني.',
        'تطبيق أنشطة تحفيزية تزيد من دافعية الطالبات نحو القراءة والتعبير.'
      ],
      suggestedEvidence: 'صور ونماذج من أوراق العمل التفاعلية، استمارات حضور المديرة/المشرفة، تقارير تطبيق استراتيجيات التعلم باللعب.'
    },
    {
      id: 'c5',
      title: 'تحسين نتائج المتعلمات ومعالجة الفاقد التعليمي',
      weight: 10,
      category: 'نواتج التعلم',
      explanation: 'يركز على تشخيص مستويات طالبات الصف الثاني الابتدائي في المهارات الأساسية لمادة لغتي (تحليل الكلمات، اللام الشمسية والقمرية، المدود، التنوين) وبناء خطط علاجية وإثرائية موثقة.',
      indicators: [
        'إجراء اختبارات تشخيصية قبلية وبعدية لقياس إتقان مهارات القراءة والإملاء.',
        'تنفيذ خطط علاجية للطالبات غير المتقنات وقياس الأثر المتحقق.',
        'تقديم برامج إثرائية للطالبات المتفوقات في القراءة الإبداعية والخط.'
      ],
      suggestedEvidence: 'ملف الخطط العلاجية والإثرائية لمادة لغتي، مقارنة نتائج الاختبار القبلي والبعدي، نماذج كراسات الطالبات المتحسنة.'
    },
    {
      id: 'c6',
      title: 'إعداد وتنفيذ خطة التعلم السنوية والفصلية واليومية',
      weight: 10,
      category: 'التخطيط التربوي',
      explanation: 'يقيس جودة إعداد خطط الدروس اليومية وتوزيع منهج (لغتي - الصف الثاني الابتدائي) وصياغة الأهداف السلوكية ومخرجات التعلم وربطها بالأنشطة والتقويم.',
      indicators: [
        'اكتمال توزيع المقرر الدراسي لمادة لغتي على أسابيع الفصل الدراسي.',
        'إعداد التحضير الإلكتروني والكتابي متضمناً الأهداف والاستراتيجيات والواجبات.',
        'الالتزام بالخطة الزمنية لتنفيذ الوحدات القرائية والظواهر الصوتية.'
      ],
      suggestedEvidence: 'توزيع مقرر لغتي للصف الثاني الابتدائي، نماذج التحضير، سجل متابعة إنجاز الخطة الفصلية.'
    },
    {
      id: 'c7',
      title: 'توظيف تقنيات ووسائل التعلم المناسبة',
      weight: 10,
      category: 'التعليم الرقمي والوسائل',
      explanation: 'يعنى بتفعيل منصة مدرستي، السبورة التفاعلية، العروض المرئية والقصص الرقمية الناطقة، والوسائل الحسية والبطاقات المصورة لتقريب مفاهيم مادة لغتي لطالبات الصف الثاني.',
      indicators: [
        'استخدام العروض التفاعلية والمقاطع الصوتية المعيارية للنصوص القرائية.',
        'إنتاج وسائل تعليمية محسوسة ولوحات حائطية للظواهر الإملائية واللغوية.',
        'تفعيل الأنشطة والواجبات الإثرائية عبر منصة مدرستي.'
      ],
      suggestedEvidence: 'روابط وصور الوسائل التعليمية المنتجة، تقارير تفعيل منصة مدرستي، عروض تقديمية لوحدات لغتي.'
    },
    {
      id: 'c8',
      title: 'تهيئة البيئة التعليمية المحفزة والجاذبة في الصفوف الأولية',
      weight: 5,
      category: 'البيئة الصفية',
      explanation: 'يركز على تنظيم بيئة فصل الصف الثاني الابتدائي مادياً ونفسياً، وإنشاء (ركن القراءة / مكتبة الفصل الصغير) ولوحات التعزيز والتحفيز الجاذبة للتلميذات.',
      indicators: [
        'تأسيس ركن قرائي تفاعلي داخل الفصل يضم قصصاً مشوقة مناسبة للصف الثاني.',
        'توظيف لوحات التعزيز الإيجابي (نجمات القراءة، أميرات الإملاء).',
        'تنظيم مقاعد الطالبات بما يدعم العمل التعاوني والأمان النفسي.'
      ],
      suggestedEvidence: 'صور ركن القراءة في الفصل، لوحات التعزيز والتحفيز، شهادات تحفيز الطالبات.'
    },
    {
      id: 'c9',
      title: 'الإدارة الصفية الفاعلة واستثمار زمن الحصة الدراسية',
      weight: 5,
      category: 'الإدارة الصفية',
      explanation: 'يقيس مهارة المعلمة في قيادة حجرة الصف الثاني الابتدائي، ضبط قواعد السلوك الإيجابي بلطف وحزم تربوي، وتوزيع زمن الحصة بين التمهيد والقراءة والتدريب والتقويم.',
      indicators: [
        'وضوح القواعد الصفية المتفق عليها مع تلميذات الصف الثاني الابتدائي.',
        'التوزيع المتوازن لزمن حصة لغتي بين القراءة الفردية والزمرية والتطبيق الكتابي.',
        'استحواذ انتباه الطالبات والحد من المشتتات داخل الفصل.'
      ],
      suggestedEvidence: 'ميثاق وقوانين الفصل المصورة، استمارة الملاحظة الصفية، سجل المتابعة اليومية.'
    },
    {
      id: 'c10',
      title: 'تحليل نتائج المتعلمات وتشخيص مستوياتهن العلمية',
      weight: 10,
      category: 'التقويم والقياس',
      explanation: 'يقيس دقة المعلمة في رصد وتحليل نتائج الفترات التقويمية لطالبات الصف الثاني الابتدائي في مهارات لغتي، واستخراج نسب الإتقان وتصنيف الطالبات وفق مستويات الأداء.',
      indicators: [
        'تحليل نتائج الطالبات إحصائياً وبيانياً عقب كل فترة تقويمية.',
        'تحديد المهارات ذات نسب الإتقان الأقل لمعالجتها (مثل: التاء المربوطة والمفتوحة، التنوين).',
        'توثيق تقدم مستوى الطالبات عبر فترات التقييم المستمر.'
      ],
      suggestedEvidence: 'جداول ورسوم بيانية لتحليل نتائج مادة لغتي (Excel / PDF)، تقارير تشخيص المهارات الأساسية.'
    },
    {
      id: 'c11',
      title: 'تنوع أساليب وأدوات التقويم المستمر والتكويني',
      weight: 10,
      category: 'التقويم والقياس',
      explanation: 'يركز على تنويع أدوات تقويم طالبات الصف الثاني الابتدائي في مادة لغتي بين التقويم الشفهي (الانطلاق القرائي والأداء التعبيري) والتقويم التحريري (الإملاء المنسوخ والمنظور والاختياري) وسلالم التقدير.',
      indicators: [
        'استخدام بطاقات ملاحظة وسلالم تقدير دقيقة لقياس مهارات القراءة الجهرية والفهم.',
        'تطبيق الإملاء المنظور والاختباري وأوراق العمل التقويمية المتدرجة.',
        'توظيف ملفات إنجاز الطالبات الصغيرة لمتابعة تطور الخط والكتابة.'
      ],
      suggestedEvidence: 'نماذج أوراق عمل تقويمية لمادة لغتي، سجل رصد مهارات الصف الثاني الابتدائي، كراسات الإملاء والخط.'
    }
  ];

  /* ==========================================================================
     8. مكتبة المكونات والوثائق الجاهزة المشتركة (DefaultSharedLibrary)
     ========================================================================== */
  const DefaultSharedLibrary = [
    {
      id: 'lib-general-1',
      scope: 'general',
      scopeLabel: 'عام لجميع المعلمين والمعلمات بالمملكة',
      category: 'الوثائق الوطنية والأخلاقيات المهنية',
      title: 'أهداف سياسة التعليم في المملكة العربية السعودية',
      summary: 'المرتكزات والغايات العامة للتعليم في المملكة العربية السعودية المعتمدة رسمياً لتضمينها في مقدمة ملف الإنجاز المهني.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>أولاً: الغاية العامة من التعليم في المملكة العربية السعودية</h4>
        <p>فهم الإسلام فهماً صحيحاً متكاملاً، وغرس العقيدة الإسلامية ونشرها، وتزويد المتعلم بالقيم والتعاليم الإسلامية وبالمثل العليا، وإكسابه المعارف والمهارات المختلفة، وتنمية الاتجاهات السلوكية البناءة، وتطوير المجتمع اقتصادياً واجتماعياً وثقافياً، وتهيئة الفرد ليكون عضواً نافعاً في بناء مجتمعه وخدمة وطنه.</p>
        <h4 class="mt-2">ثانياً: أبرز الأهداف الاستراتيجية للتعليم ورؤية السعودية 2030</h4>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li>تعزيز القيم الإسلامية والهوية الوطنية والانتماء للوطن وقيادته الرشيدة.</li>
          <li>تجويد نواتج التعلم الأساسية وبناء شخصية المتعلم المعتز بدينه ووطنه ولغته العربية.</li>
          <li>تنمية مهارات التفكير الناقد والإبداعي ومهارات المستقبل والتحول الرقمي.</li>
          <li>غرس قيم الانضباط والعمل والإتقان والمسؤولية المجتمعية.</li>
        </ul>
      `
    },
    {
      id: 'lib-general-2',
      scope: 'general',
      scopeLabel: 'عام لجميع المعلمين والمعلمات بالمملكة',
      category: 'الوثائق الوطنية والأخلاقيات المهنية',
      title: 'مدونة السلوك الوظيفي وأخلاقيات الوظيفة العامة',
      summary: 'الضوابط والواجبات الأخلاقية والمهنية للموظف العام ومنسوبي وزارة التعليم وفق الأنظمة المعتمدة.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>التزامات الموظف / الموظفة وفق مدونة السلوك الوظيفي</h4>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li><strong>النزاهة والأمانة:</strong> أداء مهام الوظيفة التعليمية بكل أمانة وإخلاص وتجرد وموضوعية.</li>
          <li><strong>الالتزام بالأنظمة:</strong> احترام الأنظمة واللوائح والتعليمات الوزارية وتنفيذها بدقة.</li>
          <li><strong>احترام الوقت والدوام الرسمي:</strong> تخصيص وقت العمل الرسمي لأداء الواجبات الوظيفية والتربوية.</li>
          <li><strong>حفظ المعلومات والخصوصية:</strong> المحافظة على سرية بيانات المتعلمين والمدرسة وعدم إفشائها.</li>
          <li><strong>التعامل الحسن:</strong> التعامل بلباقة واحترام مع الرؤساء والزملاء والطلاب/الطالبات وأولياء الأمور.</li>
        </ul>
      `
    },
    {
      id: 'lib-general-3',
      scope: 'general',
      scopeLabel: 'عام لجميع المعلمين والمعلمات بالمملكة',
      category: 'الوثائق الوطنية والأخلاقيات المهنية',
      title: 'ميثاق أخلاقيات مهنة التعليم في المملكة العربية السعودية',
      summary: 'الميثاق الأخلاقي والتربوي الذي ينظم علاقة المعلم/المعلمة بالرسالة التعليمية وبالمتعلمين والمجتمع والأسرة.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>محاور ميثاق أخلاقيات مهنة التعليم</h4>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li><strong>المادة الأولى (الرسالة):</strong> التعليم رسالة سامية تستمد أخلاقياتها من هدي الشريعة الإسلامية ومبادئ الحضارة العربية الإسلامية.</li>
          <li><strong>المادة الثانية (المعلم/المعلمة والأداء المهني):</strong> الاعتزاز بالمهنة، والتمكن من التخصص العلمي، والتطوير الذاتي المستمر.</li>
          <li><strong>المادة الثالثة (العلاقة مع المتعلمين):</strong> الرحمة والعدل، والقدوة الحسنة، ومراعاة الفروق الفردية، وتحفيز المتعلمين على الإبداع.</li>
          <li><strong>المادة الرابعة (العلاقة مع المجتمع والأسرة):</strong> تعزيز الثقة والتكامل التربوي مع الأسرة لبناء جيل صالح ومتميز.</li>
        </ul>
      `
    },
    {
      id: 'lib-stage-1',
      scope: 'stage_primary',
      scopeLabel: 'مشترك للمرحلة الابتدائية',
      category: 'أهداف وضوابط المرحلة الابتدائية',
      title: 'الأهداف العامة للمرحلة الابتدائية في المملكة العربية السعودية',
      summary: 'وثيقة الأهداف التربوية والتعليمية للمرحلة الابتدائية باعتبارها القاعدة التأسيسية لبناء المتعلمين والمتعلمات.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>أهداف المرحلة الابتدائية في التعليم العام السعودي</h4>
        <p>المرحلة الابتدائية هي القاعدة التي يرتكز عليها إعداد الناشئة إعداداً سليماً في مراحل العمر التالية، وتهدف إلى:</p>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li>تعهد العقيدة الإسلامية الصحيحة في نفس الطفل ورعايته بتربية إسلامية متكاملة في خلقه وجسمه وعقله ولغته.</li>
          <li>تدريبه على إقامة الصلاة وأخذه بآداب السلوك والفضائل والأخلاق الحسنة.</li>
          <li>تنمية المهارات الأساسية المختلفة وخاصة <strong>مهارات اللغة العربية (القراءة والكتابة والتحدث والاستماع)</strong> والمهارات العددية والحركية.</li>
          <li>تزويده بالقدر المناسب من المعلومات في مختلف الموضوعات وتعرفه بنعم الله في نفسه وبيئته.</li>
          <li>تنمية ذوقه البديعي وتعهد نشاطه الابتكاري وإعداده لما يلي هذه المرحلة من مراحل حياته.</li>
        </ul>
      `
    },
    {
      id: 'lib-stage-2',
      scope: 'stage_primary',
      scopeLabel: 'مشترك للمرحلة الابتدائية',
      category: 'أهداف وضوابط المرحلة الابتدائية',
      title: 'خصائص نمو طالبات الصفوف الأولية (الصف الثاني الابتدائي) وتطبيقاتها التربوية',
      summary: 'دليل إرشادي لمعلمة الصفوف الأولية يوضح الخصائص الجسمية والعقلية واللغوية والانفعالية لطالبة الصف الثاني الابتدائي.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>خصائص طالبة الصف الثاني الابتدائي (7 - 8 سنوات) وتطبيقاتها في التدريس</h4>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li><strong>النمو اللغوي:</strong> تتسع الحصيلة اللغوية وتزداد القدرة على التمييز بين الأصوات المتشابهة والانطلاق في القراءة الجهرية للجمل القصيرة والفقرات؛ لذا يُوصى بالإكثار من القصص المصورة والقراءة الزمرية والفردية.</li>
          <li><strong>النمو العقلي والحسي:</strong> يميل التفكير إلى المحسوسات والصور الملموسة؛ لذا يلزم توظيف البطاقات الملونة والوسائل الحسية والألعاب التعليمية.</li>
          <li><strong>النمو الحركي:</strong> تنمو العضلات الدقيقة لليد تدريجياً مما يساعد على تحسين مسك القلم والنسخ المنظم؛ مع مراعاة عدم إرهاق التلميذة بالكتابة المفرطة.</li>
          <li><strong>النمو الانفعالي والاجتماعي:</strong> تتأثر التلميذة كثيراً بالتشجيع والثناء الفوري من المعلمة؛ لذا يُفعل التعزيز الإيجابي المستمر.</li>
        </ul>
      `
    },
    {
      id: 'lib-subject-1',
      scope: 'subject_lughati_g2',
      scopeLabel: 'مشترك لمادة لغتي — الصف الثاني الابتدائي',
      category: 'مقررات ومعايير مادة لغتي (ثاني ابتدائي)',
      title: 'أهداف تدريس مادة (لغتي) في المرحلة الابتدائية والصف الثاني الابتدائي',
      summary: 'الأهداف التخصصية لتدريس اللغة العربية (مقرر لغتي) لطالبات الصف الثاني الابتدائي في الفهم القرائي والظواهر الصوتية والإملائية والتعبير.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>الأهداف الخاصة بتدريس مادة (لغتي) للصف الثاني الابتدائي</h4>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li><strong>الاستماع والتحدث:</strong> تنمية قدرة الطالبة على الإصغاء الواعي وفهم النص المسموع، والتحدث بلغة عربية فصيحة وميسرة للتعبير عن مشاهداتها وأفكارها.</li>
          <li><strong>القراءة الجهرية والفهم القرائي:</strong> نطق الكلمات والجمل مضبوطة بالشكل نطقاً سليماً، وتمثيل المعنى، واكتساب مفردات جديدة، واستنتاج الأفكار الرئيسة من النصوص القرائية.</li>
          <li><strong>الظواهر الصوتية والإملائية:</strong> إتقان التمييز قراءةً وكتابةً بين (اللام الشمسية واللام القمرية، حروف المد الثلاثة، التنوين بأنواعه، الشدة، التاء المربوطة والمفتوحة والهاء).</li>
          <li><strong>الكتابة والخط العربي:</strong> نسخ الكلمات والجمل بخط النسخ الجميل مع مراعاة قواعد الكتابة على السطر والكتابة في كراسة الإملاء المنسوخ والمنظور والاختباري.</li>
          <li><strong>التراكيب والأساليب اللغوية:</strong> توظيف أساليب الاستفهام، النفي، التمني، الترجي، والتفضيل، وأسماء الإشارة والضمائر في جمل مفيدة.</li>
        </ul>
      `
    },
    {
      id: 'lib-subject-2',
      scope: 'subject_lughati_g2',
      scopeLabel: 'مشترك لمادة لغتي — الصف الثاني الابتدائي',
      category: 'مقررات ومعايير مادة لغتي (ثاني ابتدائي)',
      title: 'قائمة المهارات الأساسية ومعايير الحد الأدنى لمادة (لغتي) — الصف الثاني الابتدائي',
      summary: 'جدول المهارات الأساسية المستهدفة بالتقويم المستمر لطالبات الصف الثاني الابتدائي في مادة لغتي.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>أهم معايير ومهارات الحد الأدنى لمادة لغتي — الصف الثاني الابتدائي</h4>
        <ol style="padding-right:1.4rem; line-height:1.9;">
          <li>قراءة نصوص قصيرة تتكون من جمل مألوفة قراءة جهرية مسترسلة ومضبوطة بالشكل.</li>
          <li>تحليل الكلمات صوتياً إلى مقاطع وحروف وتركيبها بدقة.</li>
          <li>تمييز اللام الشمسية واللام القمرية نطقاً وكتابةً.</li>
          <li>رسم الكلمات المختومة بالتاء المربوطة والتاء المفتوحة والهاء رسماً صحيحاً.</li>
          <li>كتابة كلمات تحوي ظواهر صوتية مدروسة (مد، تضعيف، تنوين) إملاءً منظوراً واختبارياً.</li>
          <li>ترتيب كلمات لتكوين جملة مفيدة اسمية أو فعلية.</li>
          <li>الإجابة عن أسئلة تفصيلية حول نص مقروء أو مسموع.</li>
        </ol>
      `
    },
    {
      id: 'lib-role-1',
      scope: 'role_teacher',
      scopeLabel: 'خاص بفئة المعلمة (الأداء الوظيفي)',
      category: 'أدلة وضوابط الأداء الوظيفي للمعلمة',
      title: 'دليل معايير تقييم الأداء الوظيفي لفئة المعلم/المعلمة وشروحاتها والأوزان النسبية',
      summary: 'مرجع شامل للبنود الـ 11 المعتمدة وزارياً لتقييم المعلمة، وتوزيع الدرجات (100 درجة)، والشواهد المطلوبة لكل معيار.',
      isIncludedByDefault: true,
      contentHtml: `
        <h4>ملخص الأوزان النسبية لمعايير تقييم الأداء الوظيفي لفئة المعلمة (100%)</h4>
        <p>تتوزع عناصر استمارة الأداء الوظيفي للمعلمة على (11) عنصراً موزونة على النحو الآتي:</p>
        <ul style="list-style:disc; padding-right:1.4rem; line-height:1.9;">
          <li>أداء الواجبات الوظيفية (10 درجات)</li>
          <li>التفاعل مع المجتمع المهني (10 درجات)</li>
          <li>التفاعل مع أولياء الأمور (10 درجات)</li>
          <li>التنويع في استراتيجيات التدريس (10 درجات)</li>
          <li>تحسين نتائج المتعلمات (10 درجات)</li>
          <li>إعداد وتنفيذ خطة التعلم (10 درجات)</li>
          <li>توظيف تقنيات ووسائل التعلم المناسبة (10 درجات)</li>
          <li>تهيئة البيئة التعليمية (5 درجات)</li>
          <li>الإدارة الصفية (5 درجات)</li>
          <li>تحليل نتائج المتعلمات وتشخيص مستوياتهن (10 درجات)</li>
          <li>تنوع أساليب وأدوات التقويم (10 درجات)</li>
        </ul>
      `
    }
  ];

  /* ==========================================================================
     9. محرك التخزين المحلي والبيانات الأولية للمعلمة الفعلية (StorageEngine)
     ========================================================================== */
  function createSeedDatabase() {
    return {
      schools: [
        {
          id: 'sch-104',
          name: 'ابتدائية الإبداع النموذجية للبنات',
          code: 'MOE-RYD-418',
          region: 'الإدارة العامة للتعليم بمنطقة الرياض',
          stage: 'المرحلة الابتدائية',
          genderType: 'female',
          principalName: 'أ. نورة بنت سلطان الغامدي',
          teachersCount: 39,
          status: 'active'
        },
        {
          id: 'sch-102',
          name: 'ثانوية الأميرة نورة بنت عبدالرحمن للبنات',
          code: 'MOE-RYD-204',
          region: 'الإدارة العامة للتعليم بمنطقة الرياض',
          stage: 'المرحلة الثانوية',
          genderType: 'female',
          principalName: 'أ. هند بنت خالد القحطاني',
          teachersCount: 48,
          status: 'active'
        },
        {
          id: 'sch-101',
          name: 'ثانوية الملك عبدالعزيز النموذجية للبنين',
          code: 'MOE-RYD-101',
          region: 'الإدارة العامة للتعليم بمنطقة الرياض',
          stage: 'المرحلة الثانوية',
          genderType: 'male',
          principalName: 'أ. عبدالرحمن بن سعد الدوسري',
          teachersCount: 42,
          status: 'active'
        },
        {
          id: 'sch-103',
          name: 'متوسطة الفيصلية الرائدة للبنين',
          code: 'MOE-JED-312',
          region: 'الإدارة العامة للتعليم بمحافظة جدة',
          stage: 'المرحلة المتوسطة',
          genderType: 'male',
          principalName: 'أ. ماجد بن علي الحربي',
          teachersCount: 35,
          status: 'active'
        }
      ],
      users: [
        {
          id: 'usr-teacher-f1',
          nationalId: '1030405060',
          email: 'sara@itqan.edu.sa',
          password: '123456',
          name: 'أ. سارة بنت عبدالله الشهري',
          systemRole: 'user',
          jobRole: 'teacher',
          gender: 'female',
          schoolId: 'sch-104',
          stage: 'المرحلة الابتدائية',
          gradeLevel: 'الصف الثاني الابتدائي',
          subjectName: 'مادة لغتي (اللغة العربية)',
          specialization: 'اللغة العربية — معلمة مادة لغتي للصف الثاني الابتدائي',
          rank: 'معلمة متقدمة',
          experienceYears: 9,
          phone: '0543334455',
          selfEvaluationScore: 98,
          principalEvaluationScore: 98,
          evaluationStatus: 'معتمد وموثق — رحلة البناء نشطة',
          includedLibraryIds: [
            'lib-general-1',
            'lib-general-2',
            'lib-general-3',
            'lib-stage-1',
            'lib-stage-2',
            'lib-subject-1',
            'lib-subject-2',
            'lib-role-1'
          ],
          cvData: {
            qualification: 'بكالوريوس اللغة العربية والتربية + دبلوم الصفوف الأولية',
            university: 'جامعة الأميرة نورة بنت عبدالرحمن',
            graduationYear: '1438 هـ',
            ministerialNumber: '4489201',
            classesTaught: 'الصف الثاني الابتدائي (فصل 2/أ ، فصل 2/ب) — نصاب 18 حصة',
            vision: 'بناء جيل من التلميذات القارئات بطلاقة والمعتزات بلغتهن العربية الفصيحة وقيمهن الإسلامية والوطنية.',
            mission: 'تقديم تعليم نوعي محفز في مادة (لغتي) لطالبات الصف الثاني الابتدائي عبر توظيف استراتيجيات التعلم باللعب والتقنيات التفاعلية ومراعاة الفروق الفردية.',
            keySkills: 'تأسيس القراءة والكتابة بالقاعدة النورانية والوعي الصوتي، تصميم الألعاب القرائية الرقمية، بناء الخطط العلاجية والإثرائية، الإدارة الصفية المحفزة.',
            achievementsSummary: 'تحقيق نسبة إتقان 97% في مهارات الانطلاق القرائي والإملاء لطالبات الصف الثاني الابتدائي، والفوز بجائزة المعلمة المتميزة على مستوى المكتب.'
          },
          criteriaScores: { c1: 10, c2: 10, c3: 10, c4: 10, c5: 9, c6: 10, c7: 10, c8: 5, c9: 5, c10: 10, c11: 9 }
        },
        {
          id: 'usr-principal-f1',
          nationalId: '1050607080',
          email: 'principal.f@itqan.edu.sa',
          password: '123456',
          name: 'أ. نورة بنت سلطان الغامدي',
          systemRole: 'user',
          jobRole: 'principal',
          gender: 'female',
          schoolId: 'sch-104',
          stage: 'المرحلة الابتدائية',
          gradeLevel: 'الإدارة المدرسية',
          subjectName: 'القيادة التربوية',
          specialization: 'القيادة التربوية والجودة الشاملة — المرحلة الابتدائية',
          rank: 'مديرة مدرسة خبيرة',
          experienceYears: 16,
          phone: '0535556677',
          selfEvaluationScore: 99,
          principalEvaluationScore: 99,
          evaluationStatus: 'معتمد',
          includedLibraryIds: ['lib-general-1', 'lib-general-2', 'lib-general-3', 'lib-stage-1']
        },
        {
          id: 'usr-teacher-m1',
          nationalId: '1020304050',
          email: 'fahad@itqan.edu.sa',
          password: '123456',
          name: 'أ. فهد بن محمد القحطاني',
          systemRole: 'user',
          jobRole: 'teacher',
          gender: 'male',
          schoolId: 'sch-101',
          stage: 'المرحلة الثانوية',
          gradeLevel: 'الصف الثالث الثانوي',
          subjectName: 'الرياضيات',
          specialization: 'الرياضيات والعلوم الرقمية',
          rank: 'معلم متقدم',
          experienceYears: 11,
          phone: '0552223344',
          selfEvaluationScore: 95,
          principalEvaluationScore: 96,
          evaluationStatus: 'معتمد من مدير المدرسة',
          includedLibraryIds: ['lib-general-1', 'lib-general-2', 'lib-general-3', 'lib-role-1'],
          criteriaScores: { c1: 10, c2: 9, c3: 9, c4: 10, c5: 10, c6: 10, c7: 10, c8: 5, c9: 5, c10: 9, c11: 9 }
        },
        {
          id: 'usr-principal-m1',
          nationalId: '1040506070',
          email: 'principal.m@itqan.edu.sa',
          password: '123456',
          name: 'أ. عبدالرحمن بن سعد الدوسري',
          systemRole: 'user',
          jobRole: 'principal',
          gender: 'male',
          schoolId: 'sch-101',
          specialization: 'الإدارة والقيادة المدرسية',
          rank: 'مدير مدرسة معتمد',
          experienceYears: 18,
          phone: '0564445566',
          selfEvaluationScore: 97,
          principalEvaluationScore: 97,
          evaluationStatus: 'معتمد',
          includedLibraryIds: ['lib-general-1', 'lib-general-2', 'lib-general-3']
        },
        {
          id: 'usr-admin-1',
          nationalId: '1000000001',
          email: 'admin@itqan.edu.sa',
          password: '123456',
          name: 'م. خالد بن عبدالله العتيبي',
          systemRole: 'admin',
          jobRole: 'admin',
          gender: 'male',
          schoolId: 'ALL',
          specialization: 'إدارة المنصة المركزية والتحول الرقمي',
          rank: 'مشرف عام النظام',
          phone: '0501112233'
        }
      ],
      portfolioItems: [
        {
          id: 'pf-sara-1',
          userId: 'usr-teacher-f1',
          criteriaId: 'c4',
          scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
          section: 'استراتيجيات تدريس مادة لغتي (ثاني ابتدائي)',
          title: 'حقيبة الألعاب القرائية التفاعلية لوحدة (أقاربي) و(أحب العمل) — لغتي ثاني ابتدائي',
          date: '1447/04/20 هـ',
          type: 'وسيلة واستراتيجية تدريس',
          status: 'معتمد وموثق',
          fileName: 'حقيبة_الألعاب_القرائية_لغتي_ثاني_ابتدائي.pdf',
          fileSize: '2.4 MB',
          attachmentType: 'ملف PDF + بطاقات مصورة',
          description: 'توظيف استراتيجية القطار السريع وساعي البريد وبائعة الزهور لتدريب طالبات الصف الثاني الابتدائي على قراءة الكلمات المختومة بالتنوين والتاء المربوطة.'
        },
        {
          id: 'pf-sara-2',
          userId: 'usr-teacher-f1',
          criteriaId: 'c5',
          scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
          section: 'الخطط العلاجية والإثرائية (تحسين النتائج)',
          title: 'برنامج (أميرات القراءة والانطلاق اللغوي) لمعالجة الفاقد في المهارات الأساسية للصف الثاني',
          date: '1447/04/15 هـ',
          type: 'خطة علاجية وإثرائية',
          status: 'معتمد وموثق',
          fileName: 'خطة_أميرات_القراءة_ثاني_ابتدائي.docx',
          fileSize: '1.1 MB',
          attachmentType: 'ملف Word (.docx) + كشف متابعة',
          description: 'خطة علاجية فردية لطالبات الصف الثاني الابتدائي في مهارتي التحليل الصوتي والإملاء المنظور، رفعت نسبة الإتقان من 82% إلى 97%.'
        },
        {
          id: 'pf-sara-3',
          userId: 'usr-teacher-f1',
          criteriaId: 'c10',
          scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
          section: 'تحليل نتائج المتعلمات وتشخيص المستويات',
          title: 'تحليل نتائج الفترة الأولى لمادة لغتي (فصل 2/أ وفصل 2/ب) بالرسوم البيانية',
          date: '1447/04/10 هـ',
          type: 'تحليل إحصائي',
          status: 'معتمد وموثق',
          fileName: 'تحليل_نتائج_لغتي_الصف_الثاني_الفترة_الأولى.xlsx',
          fileSize: '840 KB',
          attachmentType: 'جدول بيانات Excel (.xlsx)',
          description: 'تحليل شامل لمستوى إتقان 56 طالبة في الصف الثاني الابتدائي لجميع معايير الاستماع والتحدث والقراءة والكتابة.'
        },
        {
          id: 'pf-sara-4',
          userId: 'usr-teacher-f1',
          criteriaId: 'c8',
          scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
          section: 'تهيئة البيئة التعليمية المحفزة',
          title: 'توثيق ركن (مكتبتي الصغيرة) ولوحة (نجمات الإملاء) في فصل الصف الثاني الابتدائي',
          date: '1447/03/28 هـ',
          type: 'شواهد بيئة صفية',
          status: 'معتمد وموثق',
          fileName: 'توثيق_ركن_القراءة_الصف_الثاني.pdf',
          fileSize: '3.6 MB',
          attachmentType: 'تقرير مصور PDF',
          description: 'تجهيز ركن القراءة القصصية داخل الفصل بـ 45 قصة مصورة مشكولة بالحركات لتعزيز القراءة الحرة لدى التلميذات.'
        },
        {
          id: 'pf-sara-5',
          userId: 'usr-teacher-f1',
          criteriaId: 'c2',
          scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
          section: 'الدورات والتطوير المهني والمجتمع المهني',
          title: 'تنفيذ درس تطبيقي نموذجي في نص (صلة الرحم) بحضور مشرفة الصفوف الأولية ومعلمات المدرسة',
          date: '1447/03/19 هـ',
          type: 'درس تطبيقي + شهادة شكر',
          status: 'معتمد وموثق',
          fileName: 'تقرير_الدرس_التطبيقي_صلة_الرحم_ثاني_ابتدائي.pdf',
          fileSize: '1.9 MB',
          attachmentType: 'وثيقة PDF + شهادة حضور',
          description: 'تطبيق استراتيجيات القبعات الست والخرائط الذهنية المصورة في تدريس الفهم القرائي والظواهر اللغوية.'
        },
        {
          id: 'pf-1',
          userId: 'usr-teacher-m1',
          criteriaId: 'c4',
          scopeType: 'خاص بالمعلم',
          section: 'شواهد الأداء الوظيفي',
          title: 'مبادرة المختبر الافتراضي لتبسيط التفاضل والتكامل',
          date: '1447/04/12 هـ',
          type: 'مبادرة رقمية وتطبيقية',
          status: 'معتمد وموثق',
          fileName: 'المختبر_الافتراضي_رياضيات.pdf',
          fileSize: '1.8 MB',
          attachmentType: 'PDF + عرض تفاعلي',
          description: 'تطبيق عملي تفاعلي لطلاب الصف الثالث الثانوي أسهم في رفع متوسط التحصيل الدراسي بنسبة 18%.'
        }
      ],
      sharedLibrary: DefaultSharedLibrary,
      messages: [
        {
          id: 'msg-sara-1',
          senderId: 'usr-principal-f1',
          senderName: 'أ. نورة بنت سلطان الغامدي (مديرة ابتدائية الإبداع للبنات)',
          recipientId: 'usr-teacher-f1',
          recipientName: 'أ. سارة بنت عبدالله الشهري (معلمة لغتي - ثاني ابتدائي)',
          subject: 'إشادة واعتماد ملف الإنجاز المهني وشواهد مادة لغتي للصف الثاني الابتدائي',
          body: 'الأستاذة المتميزة سارة الشهري، اطلعت على ملف الإنجاز المهني الخاص بكِ وتوثيقكِ الرائع لأهداف المرحلة الابتدائية وأهداف مادة لغتي وخطة (أميرات القراءة) لطالبات الصف الثاني الابتدائي. جهود مباركة ومعتمدة بالدرجة الكاملة.',
          date: '1447/04/25 هـ - 09:30 ص',
          isRead: false
        },
        {
          id: 'msg-3',
          senderId: 'usr-admin-1',
          senderName: 'م. خالد العتيبي (مدير النظام المركزي)',
          recipientId: 'ALL',
          recipientName: 'كافة المدارس ومنسوبي ومنسوبات التعليم',
          subject: 'تفعيل الخزنة السحابية عبر GitHub ومكتبة المكونات الجاهزة',
          body: 'تم تفعيل محرك IndexedDB لحفظ الملفات الكبيرة في المتصفح بالإضافة إلى محرك GitHubStorageEngine لمزامنة ورفع ملفات الشواهد (PDF, Word, Excel, الصور) سحابياً مجاناً.',
          date: '1447/04/25 هـ - 10:00 ص',
          isRead: true
        }
      ],
      criteria: DefaultCriteria
    };
  }

  const StorageEngine = {
    getDB() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
          const seed = createSeedDatabase();
          this.saveDB(seed);
          return seed;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.sharedLibrary) parsed.sharedLibrary = DefaultSharedLibrary;
        if (!parsed.criteria || !parsed.criteria[0].explanation) parsed.criteria = DefaultCriteria;
        return parsed;
      } catch (e) {
        const seed = createSeedDatabase();
        return seed;
      }
    },

    saveDB(db) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    },

    resetDB() {
      const seed = createSeedDatabase();
      this.saveDB(seed);
      localStorage.setItem('ITQAN_CURRENT_USER', JSON.stringify(seed.users[0]));
      localStorage.setItem(GENDER_PREVIEW_KEY, 'female');
      return seed;
    },

    getSchools() {
      return this.getDB().schools || [];
    },

    getSchoolById(schoolId) {
      if (schoolId === 'ALL') {
        return { id: 'ALL', name: 'الإدارة المركزية لجميع المدارس', stage: 'مركزي', region: 'المملكة العربية السعودية' };
      }
      return this.getSchools().find((s) => s.id === schoolId) || this.getSchools()[0];
    },

    addSchool(schoolObj) {
      const db = this.getDB();
      const newSchool = {
        id: 'sch-' + Date.now(),
        teachersCount: 0,
        status: 'active',
        ...schoolObj
      };
      db.schools.unshift(newSchool);
      this.saveDB(db);
      return newSchool;
    },

    getUsers() {
      return this.getDB().users || [];
    },

    addUser(userObj) {
      const db = this.getDB();
      const newUser = {
        id: 'usr-' + Date.now(),
        selfEvaluationScore: 95,
        principalEvaluationScore: 95,
        evaluationStatus: 'قيد البناء والمراجعة',
        includedLibraryIds: ['lib-general-1', 'lib-general-2', 'lib-general-3', 'lib-role-1'],
        criteriaScores: { c1: 10, c2: 9, c3: 9, c4: 10, c5: 9, c6: 10, c7: 10, c8: 5, c9: 5, c10: 9, c11: 9 },
        ...userObj
      };
      db.users.push(newUser);
      this.saveDB(db);
      return newUser;
    },

    updateUser(updatedUser) {
      const db = this.getDB();
      const idx = db.users.findIndex((u) => u.id === updatedUser.id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updatedUser };
        this.saveDB(db);
      }
      const current = this.getCurrentUser();
      if (current && current.id === updatedUser.id) {
        this.saveSessionUser(db.users[idx] || updatedUser);
      }
    },

    getCurrentUser() {
      try {
        const raw = localStorage.getItem('ITQAN_CURRENT_USER');
        if (raw) {
          const u = JSON.parse(raw);
          const fresh = this.getUsers().find((x) => x.id === u.id);
          return fresh || u;
        }
      } catch (e) {}
      const defaultTeacher = this.getUsers()[0];
      this.saveSessionUser(defaultTeacher);
      return defaultTeacher;
    },

    saveSessionUser(user) {
      localStorage.setItem('ITQAN_CURRENT_USER', JSON.stringify(user));
      if (user && user.gender) {
        localStorage.setItem(GENDER_PREVIEW_KEY, user.gender);
      }
    },

    logout() {
      localStorage.removeItem('ITQAN_CURRENT_USER');
    },

    getPortfolioForUser(userId) {
      const db = this.getDB();
      return (db.portfolioItems || []).filter((item) => item.userId === userId);
    },

    addPortfolioItem(itemObj) {
      const db = this.getDB();
      const newItem = {
        id: itemObj.id || 'pf-' + Date.now(),
        date: '1447/04/25 هـ',
        status: 'معتمد وموثق',
        scopeType: 'خاص بالمعلمة الحالية (رحلة البناء)',
        ...itemObj
      };
      db.portfolioItems.unshift(newItem);
      this.saveDB(db);
      return newItem;
    },

    deletePortfolioItem(itemId) {
      const db = this.getDB();
      db.portfolioItems = db.portfolioItems.filter((item) => item.id !== itemId);
      this.saveDB(db);
      IndexedDBFileStore.deleteFile(itemId);
    },

    getSharedLibrary() {
      return this.getDB().sharedLibrary || DefaultSharedLibrary;
    },

    addSharedLibraryItem(libObj) {
      const db = this.getDB();
      const newItem = {
        id: 'lib-' + Date.now(),
        isIncludedByDefault: true,
        ...libObj
      };
      db.sharedLibrary.unshift(newItem);
      this.saveDB(db);
      return newItem;
    },

    toggleLibraryItemForUser(userId, libId) {
      const user = this.getUsers().find((u) => u.id === userId);
      if (!user) return false;
      const list = Array.isArray(user.includedLibraryIds) ? [...user.includedLibraryIds] : [];
      const idx = list.indexOf(libId);
      let added = false;
      if (idx === -1) {
        list.push(libId);
        added = true;
      } else {
        list.splice(idx, 1);
        added = false;
      }
      user.includedLibraryIds = list;
      this.updateUser(user);
      return added;
    },

    getMessagesForUser(userId) {
      const db = this.getDB();
      return (db.messages || []).filter(
        (m) => m.recipientId === userId || m.senderId === userId || m.recipientId === 'ALL'
      );
    },

    addMessage(msgObj) {
      const db = this.getDB();
      const newMsg = {
        id: 'msg-' + Date.now(),
        date: '1447/04/25 هـ - الآن',
        isRead: false,
        ...msgObj
      };
      db.messages.unshift(newMsg);
      this.saveDB(db);
      return newMsg;
    }
  };

  /* ==========================================================================
     10. محرك الصلاحيات والتوجيه الذكي (AuthEngine)
     ========================================================================== */
  const AuthEngine = {
    login(identifier, password) {
      const users = StorageEngine.getUsers();
      const cleanId = (identifier || '').trim().toLowerCase();
      const user = users.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanId) ||
          (u.nationalId && u.nationalId === cleanId)
      );

      if (!user) {
        return { ok: false, error: 'لم يتم العثور على حساب مسجل برقم الهوية أو البريد الإلكتروني المدخل.' };
      }
      if (password && user.password !== password) {
        return { ok: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد والمحاولة مجدداً.' };
      }

      StorageEngine.saveSessionUser(user);
      return { ok: true, user, redirectUrl: this.getRedirectUrl(user) };
    },

    loginByUserId(userId) {
      const user = StorageEngine.getUsers().find((u) => u.id === userId);
      if (!user) return { ok: false };
      StorageEngine.saveSessionUser(user);
      return { ok: true, user, redirectUrl: this.getRedirectUrl(user) };
    },

    getRedirectUrl(user) {
      if (!user) return 'login.html';
      if (user.systemRole === 'admin') {
        return 'admin-dashboard.html';
      }
      return 'user-dashboard.html';
    }
  };

  /* ==========================================================================
     11. محرك الرسائل والمراسلات المشترك (MessageEngine)
     ========================================================================== */
  const MessageEngine = {
    openComposeModal(defaultRecipientId = '') {
      const currentUser = StorageEngine.getCurrentUser();
      const allUsers = StorageEngine.getUsers().filter((u) => u.id !== currentUser.id);

      const optionsHtml = [
        `<option value="ALL">تعميم لكافة منسوبي ومنسوبات المدرسة / النظام</option>`,
        ...allUsers.map(
          (u) =>
            `<option value="${u.id}" ${u.id === defaultRecipientId ? 'selected' : ''}>${u.name} (${GenderEngine.jobTitle(u.jobRole, u.gender)})</option>`
        )
      ].join('');

      ModalEngine.open({
        type: 'info',
        title: 'إرسال رسالة أو توجيه رسمي جديد',
        size: 'lg',
        confirmText: 'إرسال الرسالة الآن',
        cancelText: 'إلغاء',
        showCancel: true,
        html: `
          <form id="compose-message-form">
            <div class="form-group">
              <label class="form-label">الجهة المستقبلة <span class="required">*</span></label>
              <select class="form-select" id="msg-recipient" required>${optionsHtml}</select>
            </div>
            <div class="form-group">
              <label class="form-label">عنوان الرسالة / الموضوع <span class="required">*</span></label>
              <input type="text" class="form-control" id="msg-subject" placeholder="مثال: إشادة بشواهد مادة لغتي للصف الثاني الابتدائي" required />
            </div>
            <div class="form-group">
              <label class="form-label">نص الرسالة أو التوجيه <span class="required">*</span></label>
              <textarea class="form-control" id="msg-body" rows="4" placeholder="اكتب نص الرسالة الرسمية هنا..." required></textarea>
            </div>
          </form>
        `,
        onConfirm: () => {
          const recSelect = document.getElementById('msg-recipient');
          const subject = document.getElementById('msg-subject').value.trim();
          const body = document.getElementById('msg-body').value.trim();

          if (!subject || !body) {
            ToastEngine.show({
              type: 'warning',
              title: 'بيانات غير مكتملة',
              message: 'يرجى كتابة عنوان ومحتوى الرسالة قبل الإرسال.'
            });
            return false;
          }

          const recId = recSelect.value;
          const recName = recSelect.options[recSelect.selectedIndex].text;

          StorageEngine.addMessage({
            senderId: currentUser.id,
            senderName: `${currentUser.name} (${GenderEngine.jobTitle(currentUser.jobRole, currentUser.gender)})`,
            recipientId: recId,
            recipientName: recName,
            subject,
            body
          });

          ToastEngine.show({
            type: 'success',
            title: 'تم إرسال الرسالة بنجاح',
            message: `تم تسليم رسالتك بعنوان "${subject}" إلى ${recName}.`
          });

          window.dispatchEvent(new CustomEvent('itqan:messagesUpdated'));
          return true;
        }
      });
    }
  };

  /* ==========================================================================
     12. محرك الطباعة الرسمي المشترك (PrintEngine)
     ========================================================================== */
  const PrintEngine = {
    ensurePrintMount() {
      let mount = document.getElementById('print-mount-container');
      if (!mount) {
        mount = document.createElement('div');
        mount.id = 'print-mount-container';
        document.body.appendChild(mount);
      }
      return mount;
    },

    buildOfficialReportHTML(user, reportType = 'full') {
      const gender = user.gender || GenderEngine.getCurrentGender();
      const school = StorageEngine.getSchoolById(user.schoolId);
      const criteria = StorageEngine.getDB().criteria || DefaultCriteria;
      const portfolio = StorageEngine.getPortfolioForUser(user.id);
      const allLib = StorageEngine.getSharedLibrary();
      const includedIds = user.includedLibraryIds || [];
      const includedDocs = allLib.filter((doc) => includedIds.includes(doc.id));

      const jobTitle = GenderEngine.jobTitle(user.jobRole, gender);
      const portfolioTitle = GenderEngine.portfolioTitle(user.jobRole, gender);
      const evaluatorTitle = GenderEngine.t('evaluator_title', gender);
      const cv = user.cvData || {};

      const cvSectionHtml = `
        <div class="print-section-heading">أولاً: ${GenderEngine.t('cv_card_title', gender)}</div>
        <div class="print-meta-grid" style="grid-template-columns: repeat(2, 1fr);">
          <div><strong>المؤهل الأكاديمي:</strong> ${cv.qualification || 'بكالوريوس تربوي'}</div>
          <div><strong>الجامعة وسنة التخرج:</strong> ${cv.university || 'جامعة سعودية'} (${cv.graduationYear || '1438 هـ'})</div>
          <div><strong>المرحلة والصف المسند:</strong> ${user.stage || 'المرحلة الابتدائية'} — ${user.gradeLevel || 'الصف الثاني الابتدائي'}</div>
          <div><strong>المادة والتخصص:</strong> ${user.subjectName || user.specialization || 'مادة لغتي'}</div>
          <div style="grid-column: 1 / -1;"><strong>الفصول والنصاب التدريسي:</strong> ${cv.classesTaught || 'الصف الثاني الابتدائي'}</div>
          <div style="grid-column: 1 / -1;"><strong>الرؤية التربوية:</strong> ${cv.vision || 'التميز في بناء المهارات اللغوية والتربوية.'}</div>
          <div style="grid-column: 1 / -1;"><strong>الرسالة المهنية:</strong> ${cv.mission || 'تقديم تعليم محفز ومبتكر يراعي الفروق الفردية.'}</div>
        </div>
      `;

      const sharedDocsHtml = includedDocs.length
        ? `
          <div class="print-section-heading">ثانياً: الوثائق التأسيسية والمكونات المضمنة في ملف الإنجاز (العامة / المرحلة / المادة)</div>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width:40px;">م</th>
                <th>عنوان الوثيقة / المكون الجاهز</th>
                <th>نطاق الوثيقة</th>
                <th>التصنيف</th>
              </tr>
            </thead>
            <tbody>
              ${includedDocs
                .map(
                  (d, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td><strong>${d.title}</strong><br><small>${d.summary}</small></td>
                    <td>${d.scopeLabel}</td>
                    <td>${d.category}</td>
                  </tr>
                `
                )
                .join('')}
            </tbody>
          </table>
        `
        : '';

      const criteriaRows = criteria
        .map((c, idx) => {
          const score = (user.criteriaScores && user.criteriaScores[c.id]) || c.weight;
          const linkedFiles = portfolio.filter((p) => p.criteriaId === c.id);
          return `
            <tr>
              <td>${idx + 1}</td>
              <td>
                <strong>${c.title}</strong>
                <div style="font-size:0.78rem; color:#4b5563; margin-top:2px;">${c.explanation}</div>
              </td>
              <td>${c.category}</td>
              <td>${c.weight}%</td>
              <td><strong>${score} / ${c.weight}</strong></td>
              <td>${linkedFiles.length ? `${linkedFiles.length} شاهد موثق` : 'مكتمل'}</td>
            </tr>
          `;
        })
        .join('');

      const portfolioRows = portfolio.length
        ? portfolio
            .map(
              (item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>
                <strong>${item.title}</strong>
                <br><small>${item.description || ''}</small>
                ${item.fileName ? `<div style="font-size:0.76rem; color:#0b5d46;">📎 الملف المرفق: ${item.fileName} (${item.fileSize || ''})</div>` : ''}
              </td>
              <td>${item.section}</td>
              <td>${item.scopeType || 'خاص بالمعلمة'}</td>
              <td>${item.date}</td>
              <td>${item.status}</td>
            </tr>
          `
            )
            .join('')
        : `<tr><td colspan="6" style="text-align:center;">لا توجد شواهد مضافة حالياً</td></tr>`;

      return `
        <div class="official-print-sheet">
          <div class="print-sheet-header">
            <div class="print-header-right">
              <div>المملكة العربية السعودية</div>
              <div>وزارة التعليم</div>
              <div>${school.region || 'الإدارة العامة للتعليم'}</div>
              <div>${school.name}</div>
            </div>
            <div class="print-header-center">
              <div class="print-emblem-box">وزارة التعليم</div>
              <div class="print-doc-title">
                ${reportType === 'portfolio' ? portfolioTitle : `وثيقة الأداء الوظيفي و${portfolioTitle}`}
              </div>
              <div style="font-size:0.84rem; color:#374151; font-weight:700;">
                ${user.subjectName || 'مادة لغتي'} — ${user.gradeLevel || 'الصف الثاني الابتدائي'} (العام الدراسي 1447 هـ)
              </div>
            </div>
            <div class="print-header-left">
              <div><strong>الرقم الوزاري:</strong> ${school.code || 'MOE-418'}</div>
              <div><strong>تاريخ الإصدار:</strong> 1447/04/25 هـ</div>
              <div><strong>حالة الوثيقة:</strong> ${user.evaluationStatus || 'معتمد'}</div>
            </div>
          </div>

          <div class="print-meta-grid">
            <div><strong>الاسم الرباعي:</strong> ${user.name}</div>
            <div><strong>الصفة والرتبة:</strong> ${jobTitle} (${user.rank || 'معلمة متقدمة'})</div>
            <div><strong>المادة والصف:</strong> ${user.subjectName || 'مادة لغتي'} — ${user.gradeLevel || 'الصف الثاني الابتدائي'}</div>
            <div><strong>السجل المدني:</strong> ${user.nationalId || '1030405060'}</div>
            <div><strong>المدرسة:</strong> ${school.name}</div>
            <div><strong>درجة الأداء الكلية:</strong> ${user.selfEvaluationScore || 98}% (التقدير: ممتاز)</div>
          </div>

          ${cvSectionHtml}
          ${sharedDocsHtml}

          <div class="print-section-heading">ثالثاً: معايير تقييم الأداء الوظيفي لفئة (${jobTitle}) وشروحاتها والدرجات الموزونة</div>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width:38px;">م</th>
                <th>معيار الأداء الوظيفي وشرحه</th>
                <th>المجال</th>
                <th>الوزن</th>
                <th>الدرجة</th>
                <th>الشواهد</th>
              </tr>
            </thead>
            <tbody>${criteriaRows}</tbody>
          </table>

          <div class="print-section-heading">رابعاً: سجل الملفات والشواهد المرفوعة في ملف الإنجاز المهني</div>
          <table class="print-table">
            <thead>
              <tr>
                <th style="width:38px;">م</th>
                <th>عنوان الشاهد والملف المرفوع</th>
                <th>القسم</th>
                <th>الخصوصية</th>
                <th>التاريخ</th>
                <th>الاعتماد</th>
              </tr>
            </thead>
            <tbody>${portfolioRows}</tbody>
          </table>

          <div class="print-signatures">
            <div class="print-sig-box">
              <div class="print-sig-title">توقيع ${jobTitle}</div>
              <div>الاسم: ${user.name}</div>
              <div>التوقيع: ...........................</div>
            </div>
            <div class="print-sig-box">
              <div class="print-sig-title">اعتماد ${evaluatorTitle}</div>
              <div>الاسم: ${school.principalName || 'إدارة المدرسة'}</div>
              <div>التوقيع: ...........................</div>
            </div>
            <div class="print-sig-box">
              <div class="print-sig-title">الختم الرسمي للمدرسة</div>
              <div style="color:#6b7280; font-size:0.8rem;">(موثق إلكترونياً عبر منصة إتقان المركزية)</div>
            </div>
          </div>
        </div>
      `;
    },

    previewAndPrint(user, reportType = 'full') {
      const targetUser = user || StorageEngine.getCurrentUser();
      const reportHtml = this.buildOfficialReportHTML(targetUser, reportType);
      const mount = this.ensurePrintMount();
      mount.innerHTML = reportHtml;

      ModalEngine.open({
        type: 'info',
        title: 'معاينة وطباعة وثيقة ملف الإنجاز والأداء الوظيفي الرسمية (A4)',
        size: 'xl',
        confirmText: '🖨️ طباعة / حفظ كملف PDF الآن',
        cancelText: 'إغلاق المعاينة',
        showCancel: true,
        html: reportHtml,
        onConfirm: () => {
          window.print();
          return false;
        }
      });
    }
  };

  /* ==========================================================================
     13. محرك النماذج التصميمية الثلاثة وشريط المعاينة (ThemeEngine)
     ========================================================================== */
  const ThemeEngine = {
    models: {
      'model-1': {
        id: 'model-1',
        name: 'النموذج الأول: الهوية الوطنية الرسمية (الزمردي الملكي)',
        shortName: '1️⃣ النموذج الرسمي الوطني'
      },
      'model-2': {
        id: 'model-2',
        name: 'النموذج الثاني: التصميم الرقمي العصري (Modern Bento & Glass)',
        shortName: '2️⃣ النموذج العصري Bento'
      },
      'model-3': {
        id: 'model-3',
        name: 'النموذج الثالث: الاستوديو التنفيذي الهادئ (Minimalist Editorial)',
        shortName: '3️⃣ النموذج التنفيذي الهادئ'
      }
    },

    getCurrentModel() {
      if (document.documentElement.hasAttribute('data-lock-teacher-page')) {
        return 'model-2';
      }
      return localStorage.getItem(THEME_KEY) || 'model-2';
    },

    setModel(modelId, notify = true) {
      const validModel = this.models[modelId] ? modelId : 'model-2';
      localStorage.setItem(THEME_KEY, validModel);
      document.documentElement.setAttribute('data-design-model', validModel);

      document.querySelectorAll('[data-switch-model]').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-switch-model') === validModel);
      });

      document.querySelectorAll('[data-active-model-name]').forEach((el) => {
        el.textContent = this.models[validModel].name;
      });

      window.dispatchEvent(new CustomEvent('itqan:modelChanged', { detail: { model: validModel } }));

      if (notify) {
        ToastEngine.show({
          type: 'info',
          title: 'تم تطبيق التصميم فوراً',
          message: `أنتِ الآن تعاينين: ${this.models[validModel].name}`
        });
      }
    },

    injectSwitcherDock() {
      // Standalone document viewers use shared data engines, not global site navigation.
      if (document.documentElement.hasAttribute('data-no-global-dock')) return;
      if (document.getElementById('global-design-switcher-dock')) return;

      const currentModel = this.getCurrentModel();
      const currentGender = GenderEngine.getCurrentGender();
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';

      const dock = document.createElement('div');
      dock.id = 'global-design-switcher-dock';
      dock.className = 'design-switcher-dock no-print';
      dock.innerHTML = `
        <button type="button" class="design-switcher-toggle-tab" id="dock-minimize-btn">
          🎨 شريط معاينة التصاميم الـ 3 والهوية والمزامنة (إخفاء/إظهار)
        </button>
        <div class="switcher-inner">
          <div class="switcher-group">
            <span class="switcher-label">اختر التصميم (3 نماذج):</span>
            <button type="button" class="switcher-pill ${currentModel === 'model-1' ? 'active' : ''}" data-switch-model="model-1">
              1️⃣ الرسمي الوطني
            </button>
            <button type="button" class="switcher-pill ${currentModel === 'model-2' ? 'active' : ''}" data-switch-model="model-2">
              2️⃣ العصري Bento
            </button>
            <button type="button" class="switcher-pill ${currentModel === 'model-3' ? 'active' : ''}" data-switch-model="model-3">
              3️⃣ التنفيذي الهادئ
            </button>
          </div>

          <div class="switcher-group">
            <span class="switcher-label">محرك الجنس:</span>
            <button type="button" class="switcher-pill ${currentGender === 'female' ? 'active' : ''}" data-switch-gender="female">
              👩 مؤنث (معلمة لغتي)
            </button>
            <button type="button" class="switcher-pill ${currentGender === 'male' ? 'active' : ''}" data-switch-gender="male">
              👨 مذكر (معلم/مدير)
            </button>
            <button type="button" class="switcher-pill active" id="dock-github-sync-btn" title="فتح إعدادات الخزنة السحابية عبر GitHub">
              ☁️ مزامنة GitHub السحابية
            </button>
          </div>

          <div class="switcher-group">
            <span class="switcher-label">الصفحات:</span>
            <a href="index.html" class="switcher-nav-link ${currentPage === 'index.html' || currentPage === '' ? 'active' : ''}">الرئيسية</a>
            <a href="login.html" class="switcher-nav-link ${currentPage === 'login.html' ? 'active' : ''}">الدخول</a>
            <a href="register.html" class="switcher-nav-link ${currentPage === 'register.html' ? 'active' : ''}">التسجيل</a>
            <a href="user-dashboard.html" class="switcher-nav-link ${currentPage === 'user-dashboard.html' ? 'active' : ''}">صفحة المعلمة</a>
            <a href="admin-dashboard.html" class="switcher-nav-link ${currentPage === 'admin-dashboard.html' ? 'active' : ''}">مدير النظام</a>
          </div>
        </div>
      `;

      document.body.appendChild(dock);

      dock.querySelectorAll('[data-switch-model]').forEach((btn) => {
        btn.addEventListener('click', () => {
          this.setModel(btn.getAttribute('data-switch-model'), true);
        });
      });

      dock.querySelectorAll('[data-switch-gender]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const g = btn.getAttribute('data-switch-gender');
          GenderEngine.setPreviewGender(g);
          ToastEngine.show({
            type: 'success',
            title: 'تم تحديث محرك التأنيث والتذكير والهوية البصرية',
            message: g === 'female'
              ? 'تم تفعيل هوية ومصطلحات المؤنث (معلمة مادة لغتي — الصف الثاني الابتدائي).'
              : 'تم تفعيل هوية ومصطلحات المذكر (معلم / مدير مدرسة).'
          });
        });
      });

      const ghBtn = dock.querySelector('#dock-github-sync-btn');
      if (ghBtn) {
        ghBtn.addEventListener('click', () => GitHubStorageEngine.openSyncModal());
      }

      dock.querySelector('#dock-minimize-btn').addEventListener('click', () => {
        dock.classList.toggle('is-minimized');
      });
    },

    init() {
      StorageEngine.getDB();
      if (document.documentElement.hasAttribute('data-lock-teacher-page')) {
        this.setModel('model-2', false);
        GenderEngine.setPreviewGender('female');
        return;
      }
      this.setModel(this.getCurrentModel(), false);
      GenderEngine.applyToDOM();
      this.injectSwitcherDock();
    }
  };

  if (document.documentElement.hasAttribute('data-lock-teacher-page')) {
    document.documentElement.setAttribute('data-design-model', 'model-2');
    document.documentElement.setAttribute('data-gender-theme', 'female');
  } else {
    document.documentElement.setAttribute('data-design-model', localStorage.getItem(THEME_KEY) || 'model-2');
    document.documentElement.setAttribute('data-gender-theme', localStorage.getItem(GENDER_PREVIEW_KEY) || 'female');
  }

  document.addEventListener('DOMContentLoaded', () => {
    ThemeEngine.init();
  });

  window.ItqanEngines = {
    Icons,
    GenderEngine,
    ModalEngine,
    BannerEngine,
    ToastEngine,
    IndexedDBFileStore,
    GitHubStorageEngine,
    StorageEngine,
    AuthEngine,
    MessageEngine,
    PrintEngine,
    ThemeEngine
  };
})(window);
