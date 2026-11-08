
    // Default Data State requested by user
    const defaultData = {
      teacherName: 'فاطمة الحربي',
      admin: 'الإدارة العامة للتعليم بمنطقة مكة المكرمة',
      school: 'ابتدائية بحرة المجاهدين الخامسة',
      year: '1448 هـ',
      rank: 'معلم متقدم',
      spec: 'لغة عربية',
      subject: 'لغتي',
      grade: 'الثاني ابتدائي',
      sections: '1 - 2 - 3',
      principal: 'أ. فوزية العتيبي',
      theme: 'rose',
      font: 'cairo'
    };

    // Current State
    let state = {...defaultData};

    // Theme Palettes (Tailored for Girls' Schools)
    const themes = {
      rose: {
        id: 'rose',
        primary: '#be185d',
        secondary: '#fbcfe8',
        accent: '#d97706',
        border: '#f472b6',
        bgCard: '#fff1f2',
        gradientStart: '#fff1f2',
        gradientEnd: '#fdf2f8',
        heading: '#831843'
      },
      lavender: {
        id: 'lavender',
        primary: '#7e22ce',
        secondary: '#e9d5ff',
        accent: '#b45309',
        border: '#c084fc',
        bgCard: '#faf5ff',
        gradientStart: '#faf5ff',
        gradientEnd: '#f3e8ff',
        heading: '#581c87'
      },
      sage: {
        id: 'sage',
        primary: '#0f766e',
        secondary: '#ccfbf1',
        accent: '#b45309',
        border: '#5eead4',
        bgCard: '#f0fdfa',
        gradientStart: '#f0fdfa',
        gradientEnd: '#e6fffa',
        heading: '#134e4a'
      }
    };

    // Load from LocalStorage on Startup
    function init() {
      const saved = localStorage.getItem('porto_professional_portfolio_v1');
      if (saved) {
        try {
          state = JSON.parse(saved);
        } catch(e) {
          console.error("Error loading saved data", e);
          state = {...defaultData};
        }
      }
      applyTheme(state.theme || 'rose');
      applyFont(state.font || 'cairo');
      renderData();
      fitPreviewToScreen();
    }

    // Render Data to DOM
    function renderData() {
      // Cover Page
      document.getElementById('disp-admin').innerText = state.admin;
      document.getElementById('disp-school').innerText = state.school;
      document.getElementById('disp-teacher-name').innerText = state.teacherName;
      document.getElementById('disp-rank').innerText = state.rank;
      document.getElementById('disp-spec').innerText = state.spec;
      document.getElementById('disp-subject').innerText = state.subject;
      document.getElementById('disp-grade').innerText = state.grade;
      document.getElementById('disp-sections').innerText = state.sections;
      document.getElementById('disp-year').innerText = state.year;
      document.getElementById('disp-school-foot').innerText = state.school;

      // Inner Pages Headers & Bio
      document.getElementById('disp-mini-head1').innerText = `ملف الإنجاز المهني • المعلمة ${state.teacherName}`;
      document.getElementById('disp-cv-name').innerText = state.teacherName;
      document.getElementById('disp-cv-rank').innerText = state.rank;
      document.getElementById('disp-cv-subject').innerText = `${state.subject} - ${state.grade}`;
      document.getElementById('disp-cv-school').innerText = state.school;
      document.getElementById('disp-cv-admin').innerText = state.admin;
      document.getElementById('disp-ethic-teacher').innerText = state.teacherName;
      document.getElementById('disp-ev-teacher').innerText = state.teacherName;
    }

    // Apply Colors Dynamically
    function applyTheme(themeName) {
      const t = themes[themeName] || themes.rose;
      state.theme = themeName;
      const root = document.documentElement;

      root.style.setProperty('--primary-color', t.primary);
      root.style.setProperty('--secondary-color', t.secondary);
      root.style.setProperty('--accent-color', t.accent);
      root.style.setProperty('--border-color', t.border);
      root.style.setProperty('--bg-card', t.bgCard);
      root.style.setProperty('--gradient-start', t.gradientStart);
      root.style.setProperty('--gradient-end', t.gradientEnd);
      root.style.setProperty('--heading-color', t.heading);

      // Update button highlights
      ['rose', 'lavender', 'sage'].forEach(name => {
        const btn = document.getElementById(`theme-btn-${name}`);
        if (name === themeName) {
          btn.className = "px-3 py-1.5 rounded-lg transition-all shadow-sm font-black bg-white " + 
            (name === 'rose' ? 'text-pink-700' : name === 'lavender' ? 'text-purple-700' : 'text-teal-700');
        } else {
          btn.className = "px-3 py-1.5 rounded-lg transition-all text-slate-600 font-normal hover:bg-white/50";
        }
      });

      saveToStorage();
    }

    function setTheme(name) {
      applyTheme(name);
    }

    // Font Family Switcher
    function setFontFamily(fontKey) {
      state.font = fontKey;
      applyFont(fontKey);
      saveToStorage();
    }

    function applyFont(fontKey) {
      const appBody = document.getElementById('appBody');
      const fontSelect = document.getElementById('fontSelect');
      
      appBody.classList.remove('font-cairo', 'font-tajawal', 'font-almarai', 'font-amiri');

      if (fontKey === 'tajawal') {
        appBody.classList.add('font-tajawal');
        appBody.style.fontFamily = "'Tajawal', 'Cairo', sans-serif";
      } else if (fontKey === 'almarai') {
        appBody.classList.add('font-almarai');
        appBody.style.fontFamily = "'Almarai', 'Cairo', sans-serif";
      } else if (fontKey === 'amiri') {
        appBody.classList.add('font-amiri');
        appBody.style.fontFamily = "'Amiri', serif";
      } else {
        appBody.classList.add('font-cairo');
        appBody.style.fontFamily = "'Cairo', sans-serif";
      }

      if (fontSelect) fontSelect.value = fontKey;
    }

    // Modal Operations
    function openEditModal() {
      document.getElementById('inp-teacher-name').value = state.teacherName;
      document.getElementById('inp-admin').value = state.admin;
      document.getElementById('inp-school').value = state.school;
      document.getElementById('inp-year').value = state.year;
      document.getElementById('inp-rank').value = state.rank;
      document.getElementById('inp-spec').value = state.spec;
      document.getElementById('inp-subject').value = state.subject;
      document.getElementById('inp-grade').value = state.grade;
      document.getElementById('inp-sections').value = state.sections;
      document.getElementById('inp-principal').value = state.principal || '';

      const modal = document.getElementById('dataModal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeEditModal() {
      const modal = document.getElementById('dataModal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    function saveData(event) {
      event.preventDefault();

      state.teacherName = document.getElementById('inp-teacher-name').value;
      state.admin = document.getElementById('inp-admin').value;
      state.school = document.getElementById('inp-school').value;
      state.year = document.getElementById('inp-year').value;
      state.rank = document.getElementById('inp-rank').value;
      state.spec = document.getElementById('inp-spec').value;
      state.subject = document.getElementById('inp-subject').value;
      state.grade = document.getElementById('inp-grade').value;
      state.sections = document.getElementById('inp-sections').value;
      state.principal = document.getElementById('inp-principal').value;

      saveToStorage();
      renderData();
      closeEditModal();
    }

    function restoreDefaults() {
      if (confirm('هل ترغبين باستعادة كافة البيانات الافتراضية الأولية؟')) {
        const curTheme = state.theme;
        const curFont = state.font;
        state = {...defaultData, theme: curTheme, font: curFont};
        saveToStorage();
        renderData();
        openEditModal();
      }
    }

    function saveToStorage() {
      localStorage.setItem('porto_professional_portfolio_v1', JSON.stringify(state));
    }

    // Start on load
    function fitPreviewToScreen() {
      const available=Math.max(240,Math.min(
        document.documentElement.clientWidth||window.innerWidth,
        window.visualViewport?.width||window.innerWidth
      )-24);
      const sheets=document.querySelectorAll('.a4-sheet');
      for(const sheet of sheets) {
        sheet.style.zoom='1';
        if(window.matchMedia('(max-width: 850px)').matches) {
          const originalWidth=sheet.getBoundingClientRect().width;
          sheet.style.zoom=String(Math.min(1,available/Math.max(1,originalWidth)));
        }
      }
    }
    window.addEventListener('DOMContentLoaded',init);
    window.addEventListener('resize',fitPreviewToScreen,{passive:true});
    window.visualViewport?.addEventListener('resize',fitPreviewToScreen,{passive:true});
  