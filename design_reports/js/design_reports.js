
    // System State
    const state = {
      currentTemplate: 1,
      admin: 'الإدارة العامة للتعليم بمنطقة مكة المكرمة',

      school: 'ابن سيرين الثانوية ببحرة',
      title: 'معرض الابتكار والذكاء الاصطناعي المدرسي',
      domain: 'العلمي والتقني',
      target: 'طلاب المرحلة الثانوية والمعلمون',
      date: '1447/05/18 هـ',
      beneficiaries: '280 مستفيد',
      location: 'الصالة الرياضية وقاعة الموهوبين',
      duration: 'يوم دراسي (4 ساعات)',
      objectives: [
        'تنمية مهارات التفكير الرقمي والابتكار لدى الطلاب',
        'تعريف المجتمع المدرسي بتطبيقات الذكاء الاصطناعي الحديثة',
        'تشجيع الطلاب على تصميم مشاريع تقنية واعدة تخدم رؤية المملكة 2030'
      ],
      description: 'تم تنظيم المعرض بمشاركة 22 مشروعاً ابتكارياً، وتخلله ورشة عمل تطبيقية ومسابقة لأفضل نموذج أولي بحضور المشرف التربوي ومشاركة فاعلة من الطلاب وأولياء الأمور.',
      officer: 'خالد بن علي المحوري',
      principal: 'خالد علي المحوري',
      // The original uploaded Ministry of Education logo is cropped and bundled locally.
      logoRight: `<img src="assets/ministry-of-education.webp" alt="شعار وزارة التعليم" class="moe-logo" />`,
      // No fabricated school logo. Users can upload their own school logo.
      logoLeft: '',
      photos: []
    };

    // Change Template Handler
    function changeTemplate(num) {
      state.currentTemplate = num;
      // Update template button styles
      for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`btn-tmpl-${i}`);
        if (i === num) {
          btn.className = 'tmpl-btn p-2 rounded-lg border text-center transition-all border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm font-bold';
        } else {
          btn.className = 'tmpl-btn p-2 rounded-lg border text-center transition-all border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-normal';
        }
      }
      renderReport();
      fitMobilePreview();
    }

    // Read form values and update state
    function updateReport() {
      state.admin = document.getElementById('inputEducationAdmin').value;

      state.school = document.getElementById('inputSchoolName').value;
      state.title = document.getElementById('inputProgName').value;
      state.domain = document.getElementById('inputDomain').value;
      state.target = document.getElementById('inputTargetAudience').value;
      state.date = document.getElementById('inputDate').value;
      state.beneficiaries = document.getElementById('inputBeneficiaries').value;
      state.location = document.getElementById('inputLocation').value;
      state.duration = document.getElementById('inputDuration').value;
      state.officer = document.getElementById('inputOfficer').value;
      state.principal = document.getElementById('inputPrincipal').value;
      state.description = document.getElementById('inputDescription').value;

      const objText = document.getElementById('inputObjectives').value;
      state.objectives = objText.split('\n').filter(item => item.trim().length > 0);

      renderReport();
      fitMobilePreview();
    }

    // Handle File upload for logos
    function handleLogoUpload(event, logoType) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          state[logoType] = `<img src="${e.target.result}" alt="Logo" class="max-h-16 max-w-20 object-contain rounded">`;
          renderReport();
        };
        reader.readAsDataURL(file);
      }
    }

    // Add new evidence photo
    function handleAddEvidencePhoto(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          state.photos.push({
            id: Date.now(),
            url: e.target.result,
            caption: 'توثيق جانب من المشاركة والتفاعل في البرنامج'
          });
          renderEvidenceList();
          renderReport();
        };
        reader.readAsDataURL(file);
      }
    }

    // Remove photo
    function removePhoto(id) {
      state.photos = state.photos.filter(p => p.id !== id);
      renderEvidenceList();
      renderReport();
      fitMobilePreview();
    }

    // Update Photo Caption
    function updatePhotoCaption(id, newCaption) {
      const photo = state.photos.find(p => p.id === id);
      if (photo) {
        photo.caption = newCaption;
        renderReport();
      }
    }

    // Render Side Panel Evidence List
    function renderEvidenceList() {
      const container = document.getElementById('evidenceListContainer');
      const badge = document.getElementById('evidenceCountBadge');
      badge.textContent = `${state.photos.length} شواهد`;

      if (state.photos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 font-medium">لم يتم إرفاق صور شواهد حتى الآن</p>`;
        return;
      }

      container.innerHTML = state.photos.map((p, index) => `
        <div class="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg group">
          <img src="${p.url}" class="w-14 h-14 object-cover rounded-md border border-slate-300" alt="evidence thumbnail">
          <div class="flex-1 min-w-0">
            <span class="text-[10px] text-emerald-700 font-bold block mb-1">شاهد رقم #${index + 1}</span>
            <input type="text" value="${p.caption}" oninput="updatePhotoCaption(${p.id}, this.value)" placeholder="اكتب وصفاً أو تعليقاً على الصورة..." class="w-full text-xs bg-white border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 outline-none">
          </div>
          <button onclick="removePhoto(${p.id})" title="حذف" class="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors">
            <i class="fa-regular fa-trash-can text-sm"></i>
          </button>
        </div>
      `).join('');
    }

    // Reset Data
    function resetData() {
      if(confirm('هل ترغب بتفريغ حقول النموذج؟')) {
        document.getElementById('inputProgName').value = '';
        document.getElementById('inputObjectives').value = '';
        document.getElementById('inputDescription').value = '';
        state.photos = [];
        updateReport();
        renderEvidenceList();
      }
    }

    // Fill Demo Data
    function fillDemoData() {
      document.getElementById('inputEducationAdmin').value = 'الإدارة العامة للتعليم بمنطقة مكة المكرمة';

      document.getElementById('inputSchoolName').value = 'ابن سيرين الثانوية ببحرة';
      document.getElementById('inputProgName').value = 'ملتقى يوم التأسيس السعودي 2026 - أصالة ونماء';
      document.getElementById('inputDomain').value = 'الوطني والبيئي';
      document.getElementById('inputTargetAudience').value = 'كافة منسوبي المدرسة وأولياء الأمور';
      document.getElementById('inputDate').value = '1447/08/04 هـ';
      document.getElementById('inputBeneficiaries').value = '520 مستفيد';
      document.getElementById('inputLocation').value = 'المسرح المدرسي والساحة الشعبية';
      document.getElementById('inputDuration').value = 'يومان دراسيان';
      document.getElementById('inputOfficer').value = 'خالد بن علي المحوري';
      document.getElementById('inputPrincipal').value = 'خالد علي المحوري';
      document.getElementById('inputObjectives').value = `غرس قيم الاعتزاز بالهوية الوطنية وتاريخ الدولة السعودية المجيد\nتعريف الأجيال الحالية بأبرز المحطات التاريخية والموروث الثقافي\nتعزيز المشاركة الفاعلة والمجتمعية بين المدرسة والأسرة`;
      document.getElementById('inputDescription').value = `أقيمت فعاليات احتفالية متكاملة اشتملت على عروض مسرحية تراثية، ومعرض فني للأزياء والمقتنيات الشعبية، وأوبريت وطني من أداء الطلاب، وسط تفاعل وحضور لافت.`;       state.photos = [];



      updateReport();
      renderEvidenceList();
    }

    /* ========================================================
       RENDER TEMPLATES ENGINE
       ======================================================== */
    function renderReport() {
      const container = document.getElementById('reportA4Paper');
      
      switch(state.currentTemplate) {
        case 1:
          container.innerHTML = templateClassicAdministrative();
          break;
        case 2:
          container.innerHTML = templateModernSupervisory();
          break;
        case 3:
          container.innerHTML = templatePhotoCentric();
          break;
        case 4:
          container.innerHTML = templateGuidanceAndCounseling();
          break;
        case 5:
          container.innerHTML = templateExecutiveCard();
          break;
        default:
          container.innerHTML = templateClassicAdministrative();
      }
    }

    /* Template 1: القالب الإداري الكلاسيكي المعتمد */
    function templateClassicAdministrative() {
      return `
        <!-- Official Header -->
        <div>
          <div class="flex items-center justify-between border-b-2 border-emerald-800 pb-4 mb-4">
            <div class="flex items-center gap-3">
              ${state.logoRight}
              <div class="text-xs leading-relaxed font-semibold text-slate-700">
                <p>المملكة العربية السعودية</p>
                <p>وزارة التعليم</p>
                <p class="font-bold text-emerald-900">${state.admin}</p>
                
                <p class="font-extrabold text-slate-900">${state.school}</p>
              </div>
            </div>
            
            <div class="text-center px-4">
              <span class="inline-block px-3 py-1 bg-emerald-800 text-white text-xs font-bold rounded mb-1">تقرير ختامي رسمي</span>
              <p class="text-[11px] text-slate-500 font-medium">العام الدراسي 1447هـ</p>
            </div>

            <div class="flex items-center gap-3">
              ${state.logoLeft}
            </div>
          </div>

          <!-- Title Banner -->
          <div class="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white text-center py-2.5 px-4 rounded-md shadow-sm mb-4">
            <h2 class="text-lg font-bold">${state.title || 'اسم البرنامج أو الفعالية'}</h2>
            <p class="text-[11px] text-emerald-200 mt-0.5 font-medium">مجال الفعالية: ${state.domain}</p>
          </div>

          <!-- Metadata Table (Classical Government Grid) -->
          <div class="border border-slate-300 rounded overflow-hidden mb-4 text-xs">
            <table class="w-full text-right border-collapse">
              <tr class="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                <td class="p-2 border-l border-slate-300 w-1/4">تاريخ التنفيذ:</td>
                <td class="p-2 border-l border-slate-300 w-1/4 text-slate-900 font-normal">${state.date}</td>
                <td class="p-2 border-l border-slate-300 w-1/4">مقر التنفيذ:</td>
                <td class="p-2 text-slate-900 font-normal">${state.location}</td>
              </tr>
              <tr class="border-b border-slate-300 text-slate-700">
                <td class="p-2 bg-slate-100 border-l border-slate-300 font-bold">الفئة المستهدفة:</td>
                <td class="p-2 border-l border-slate-300">${state.target}</td>
                <td class="p-2 bg-slate-100 border-l border-slate-300 font-bold">عدد المستفيدين:</td>
                <td class="p-2 font-bold text-emerald-800">${state.beneficiaries}</td>
              </tr>
              <tr class="text-slate-700">
                <td class="p-2 bg-slate-100 border-l border-slate-300 font-bold">المدة الزمنية:</td>
                <td class="p-2 border-l border-slate-300">${state.duration}</td>
                <td class="p-2 bg-slate-100 border-l border-slate-300 font-bold">المشرف المنفذ:</td>
                <td class="p-2 font-bold">${state.officer}</td>
              </tr>
            </table>
          </div>

          <!-- Objectives & Outcomes -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="border border-slate-200 rounded p-3 bg-slate-50/50">
              <h4 class="text-xs font-bold text-emerald-900 border-b border-emerald-200 pb-1.5 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-bullseye text-emerald-700"></i> أهداف البرنامج المحققة
              </h4>
              <ul class="text-[11px] space-y-1.5 text-slate-700 list-disc list-inside">
                ${state.objectives.map(o => `<li>${o}</li>`).join('')}
              </ul>
            </div>

            <div class="border border-slate-200 rounded p-3 bg-slate-50/50">
              <h4 class="text-xs font-bold text-emerald-900 border-b border-emerald-200 pb-1.5 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-file-lines text-emerald-700"></i> الملخص والمخرجات
              </h4>
              <p class="text-[11px] leading-relaxed text-slate-700 text-justify">
                ${state.description || 'لم يتم إضافة ملخص حتى الآن.'}
              </p>
            </div>
          </div>

          <!-- Evidence Images Gallery -->
          <div class="report-evidence-gallery mb-4">
            <h4 class="text-xs font-bold text-slate-800 border-r-4 border-emerald-800 pr-2 mb-2 flex items-center gap-1">
              <i class="fa-solid fa-camera-retro text-emerald-700"></i> شواهد التوثيق الميداني والأنشطة
            </h4>
            <div class="grid ${state.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3">
              ${state.photos.slice(0, 4).map(p => `
                <div class="border border-slate-300 rounded overflow-hidden bg-white shadow-sm flex flex-col">
                  <div class="h-40 bg-slate-100 overflow-hidden">
                    <img src="${p.url}" class="w-full h-full object-cover">
                  </div>
                  <div class="p-1.5 bg-slate-50 text-[10px] text-center text-slate-600 font-semibold border-t">
                    ${p.caption}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Official Signatures Footer -->
        <div class="border-t-2 border-slate-200 pt-3 mt-4">
          <div class="grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <p class="font-bold text-slate-700">رائد النشاط / المشرف المنفذ</p>
              <p class="text-slate-900 font-extrabold mt-1">${state.officer}</p>
              <div class="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <p class="text-[10px] text-slate-400 mt-1">التوقيع والاعتماد</p>
            </div>
            <div>
              <p class="font-bold text-slate-700">مدير / مديرة المدرسة</p>
              <p class="text-slate-900 font-extrabold mt-1">${state.principal}</p>
              <div class="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <p class="text-[10px] text-slate-400 mt-1">الختم والتوقيع الرسمي</p>
            </div>
          </div>
          <div class="text-center text-[9px] text-slate-400 mt-3 pt-2 border-t border-slate-100">
            تم توليد هذا التقرير إلكترونياً ومتوافق مع متطلبات التوثيق بالتعليم العام
          </div>
        </div>
      `;
    }

    /* Template 2: القالب الإشرافي الحديث الملون */
    function templateModernSupervisory() {
      return `
        <div>
          <!-- Header with Modern Gradient Accent -->
          <div class="bg-gradient-to-l from-emerald-700 via-teal-700 to-emerald-900 rounded-2xl p-5 text-white flex items-center justify-between shadow-md mb-4">
            <div class="flex items-center gap-3">
              <div class="p-1.5 bg-white/10 backdrop-blur rounded-xl">
                ${state.logoRight}
              </div>
              <div>
                <p class="text-[11px] text-emerald-200">${state.admin}</p>
                <h3 class="font-black text-sm md:text-base">${state.school}</h3>
                <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800">تقرير قياس الأثر والإنجاز</span>
              </div>
            </div>
            <div class="p-1.5 bg-white/10 backdrop-blur rounded-xl">
              ${state.logoLeft}
            </div>
          </div>

          <!-- Highlight Title Box -->
          <div class="text-center my-3">
            <span class="text-[11px] font-bold tracking-wider text-teal-700 uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              مجال البرنامج: ${state.domain}
            </span>
            <h1 class="text-xl font-black text-slate-900 mt-2">${state.title}</h1>
          </div>

          <!-- Modern Metrics Cards Grid -->
          <div class="grid grid-cols-4 gap-2 mb-4 text-center">
            <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
              <i class="fa-solid fa-users text-emerald-700 text-sm mb-1 block"></i>
              <span class="text-[10px] text-slate-500 font-semibold block">المستفيدون</span>
              <span class="text-xs font-black text-emerald-900">${state.beneficiaries}</span>
            </div>
            <div class="bg-teal-50/70 border border-teal-200 rounded-xl p-2.5">
              <i class="fa-solid fa-calendar-day text-teal-700 text-sm mb-1 block"></i>
              <span class="text-[10px] text-slate-500 font-semibold block">التاريخ</span>
              <span class="text-xs font-black text-teal-900">${state.date}</span>
            </div>
            <div class="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
              <i class="fa-solid fa-location-dot text-amber-700 text-sm mb-1 block"></i>
              <span class="text-[10px] text-slate-500 font-semibold block">المقر</span>
              <span class="text-xs font-black text-amber-900 truncate block">${state.location}</span>
            </div>
            <div class="bg-slate-100 border border-slate-200 rounded-xl p-2.5">
              <i class="fa-solid fa-clock text-slate-600 text-sm mb-1 block"></i>
              <span class="text-[10px] text-slate-500 font-semibold block">المدة</span>
              <span class="text-xs font-black text-slate-800">${state.duration}</span>
            </div>
          </div>

          <!-- Info Row -->
          <div class="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs mb-4 flex items-center justify-between">
            <span class="font-bold text-slate-600"><i class="fa-solid fa-user-tag text-emerald-600 ml-1"></i> المستهدفون: <strong class="text-slate-800">${state.target}</strong></span>
            <span class="font-bold text-slate-600"><i class="fa-solid fa-user-tie text-emerald-600 ml-1"></i> المشرف المنفذ: <strong class="text-slate-800">${state.officer}</strong></span>
          </div>

          <!-- 2 Columns: Objectives & Narrative -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 bg-white rounded-xl border-l-4 border-l-emerald-600 border border-slate-200 shadow-sm">
              <h4 class="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-check-double text-emerald-600"></i> مصفوفة أهداف البرنامج
              </h4>
              <ul class="text-[11px] text-slate-600 space-y-1.5">
                ${state.objectives.map(o => `<li class="flex items-start gap-1.5"><i class="fa-solid fa-angle-left text-emerald-500 text-[10px] mt-1"></i><span>${o}</span></li>`).join('')}
              </ul>
            </div>

            <div class="p-3 bg-white rounded-xl border-l-4 border-l-teal-600 border border-slate-200 shadow-sm">
              <h4 class="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-chart-pie text-teal-600"></i> أثر البرنامج والمخرجات
              </h4>
              <p class="text-[11px] text-slate-600 leading-relaxed text-justify">
                ${state.description}
              </p>
            </div>
          </div>

          <!-- Evidence Gallery (Modern Cards) -->
          <div class="report-evidence-gallery mb-2">
            <h4 class="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-images text-emerald-600"></i> توثيق الأنشطة والشواهد المرئية
            </h4>
            <div class="grid ${state.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3">
              ${state.photos.slice(0, 4).map(p => `
                <div class="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <div class="h-40 overflow-hidden bg-slate-100">
                    <img src="${p.url}" class="w-full h-full object-cover">
                  </div>
                  <div class="p-2 text-center text-[10px] font-bold text-slate-700 bg-slate-50 border-t">
                    ${p.caption}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer Signatures -->
        <div class="pt-4 mt-2 border-t border-slate-200">
          <div class="flex items-center justify-between text-xs px-6 text-center">
            <div>
              <p class="font-bold text-slate-500 text-[11px]">معد التقرير والمنفذ</p>
              <p class="font-extrabold text-slate-800 mt-1">${state.officer}</p>
              <div class="mt-6 border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>
            <div class="w-20 h-20 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
              ختم المدرسة
            </div>
            <div>
              <p class="font-bold text-slate-500 text-[11px]">يعتمد مدير المدرسة</p>
              <p class="font-extrabold text-slate-800 mt-1">${state.principal}</p>
              <div class="mt-6 border-b border-dashed border-slate-300 w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      `;
    }

    /* Template 3: قالب الإنجاز المصور المركز على الشواهد البصرية */
    function templatePhotoCentric() {
      return `
        <div>
          <!-- Clean Minimal Header -->
          <div class="flex items-center justify-between border-b pb-3 mb-3">
            <div class="flex items-center gap-2">
              ${state.logoRight}
              <div class="text-[10px] text-slate-600 font-semibold leading-tight">
                <p>${state.admin}</p>
                <p class="font-black text-slate-800 text-xs">${state.school}</p>
              </div>
            </div>
            <div class="text-center">
              <span class="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">سجل الشواهد المصورة</span>
            </div>
            <div>
              ${state.logoLeft}
            </div>
          </div>

          <!-- Program Title Block -->
          <div class="text-center bg-slate-900 text-white p-3 rounded-xl mb-3">
            <h2 class="text-base font-bold">${state.title}</h2>
            <div class="flex items-center justify-center gap-4 text-[10px] text-slate-300 mt-1">
              <span><i class="fa-regular fa-calendar ml-1 text-emerald-400"></i> ${state.date}</span>
              <span>•</span>
              <span><i class="fa-solid fa-location-pin ml-1 text-emerald-400"></i> ${state.location}</span>
              <span>•</span>
              <span><i class="fa-solid fa-users ml-1 text-emerald-400"></i> ${state.beneficiaries}</span>
            </div>
          </div>

          <!-- Narrative Summary Strip -->
          <div class="bg-emerald-50/80 border border-emerald-200 rounded-lg p-2.5 text-xs text-slate-700 leading-relaxed mb-3">
            <span class="font-bold text-emerald-900 ml-1">نبذة الإنجاز:</span>
            ${state.description}
          </div>

          <!-- Large Evidence Photo Grid (Centered Focus) -->
          <div class="report-evidence-gallery grid grid-cols-2 gap-3 mb-3">
            ${state.photos.map((p, idx) => `
              <div class="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                <div class="relative h-48 bg-slate-100 overflow-hidden">
                  <span class="absolute top-2 right-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded font-bold backdrop-blur">
                    الشاهد #${idx + 1}
                  </span>
                  <img src="${p.url}" class="w-full h-full object-cover">
                </div>
                <div class="p-2 text-[11px] font-bold text-slate-800 bg-white border-t border-slate-100 flex items-center gap-1.5">
                  <i class="fa-solid fa-quote-right text-emerald-600 text-xs"></i>
                  <span>${p.caption}</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Quick Objectives Pills -->
          <div class="border border-slate-200 rounded-xl p-2.5 bg-slate-50 mb-2">
            <span class="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">الأهداف المرتبطة بالنشاط:</span>
            <div class="flex flex-wrap gap-1.5">
              ${state.objectives.map(o => `<span class="bg-white border border-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-md font-medium"><i class="fa-solid fa-check text-emerald-600 text-[9px] ml-1"></i>${o}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-200 pt-3 flex items-center justify-between text-xs">
          <div>
            <span class="text-slate-400 text-[10px] block">إعداد المشرف:</span>
            <span class="font-bold text-slate-800">${state.officer}</span>
          </div>
          <div class="text-center text-[10px] text-slate-400">
            وثيقة مصورة صادرة عن النشاط الطلابي
          </div>
          <div class="text-left">
            <span class="text-slate-400 text-[10px] block">اعتماد الإدارة:</span>
            <span class="font-bold text-slate-800">${state.principal}</span>
          </div>
        </div>
      `;
    }

    /* Template 4: قالب التوجيه والإرشاد والفعاليات التربوية */
    function templateGuidanceAndCounseling() {
      return `
        <div>
          <!-- Header with Soft Pastoral / Guidance Theme -->
          <div class="border-b-4 border-teal-600 pb-3 mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              ${state.logoRight}
              <div class="text-xs">
                <p class="text-teal-900 font-bold">${state.admin}</p>
                
                <p class="font-extrabold text-slate-900">${state.school}</p>
              </div>
            </div>
            <div class="text-center">
              <span class="bg-teal-700 text-white text-xs px-3.5 py-1 rounded-full font-bold shadow-sm">
                وحدة التوجيه الطلابي والأنشطة
              </span>
              <p class="text-[10px] text-slate-400 mt-1 font-semibold">استمارة تقرير برنامج نوعي</p>
            </div>
            <div>
              ${state.logoLeft}
            </div>
          </div>

          <!-- Banner Program Name -->
          <div class="bg-teal-50 border border-teal-200 rounded-xl p-3.5 mb-4 text-center">
            <p class="text-[11px] font-bold text-teal-700 mb-1">تقرير تنفيذ البرنامج التربوي / الإرشادي</p>
            <h1 class="text-lg font-black text-teal-950">${state.title}</h1>
          </div>

          <!-- Comprehensive Details Layout -->
          <div class="grid grid-cols-3 gap-2.5 text-xs mb-4">
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">مجال الرعاية والنشاط:</span>
              <span class="font-bold text-teal-900">${state.domain}</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">المستهدفون:</span>
              <span class="font-bold text-slate-800">${state.target}</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">المستفيدون الفعليون:</span>
              <span class="font-bold text-teal-700">${state.beneficiaries}</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">تاريخ الانعقاد:</span>
              <span class="font-bold text-slate-800">${state.date}</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">بيئة ومكان التنفيذ:</span>
              <span class="font-bold text-slate-800">${state.location}</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-lg p-2 shadow-sm">
              <span class="text-slate-400 text-[10px] block">الزمن المستغرق:</span>
              <span class="font-bold text-slate-800">${state.duration}</span>
            </div>
          </div>

          <!-- Behavioral Goals & Process Summary -->
          <div class="space-y-3 mb-4 text-xs">
            <div class="border border-teal-100 bg-teal-50/40 rounded-xl p-3">
              <h4 class="font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                <i class="fa-solid fa-seedling text-teal-600"></i> المستهدفات السلوكية والتربوية
              </h4>
              <ul class="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
                ${state.objectives.map(o => `<li>${o}</li>`).join('')}
              </ul>
            </div>

            <div class="border border-slate-200 bg-white rounded-xl p-3 shadow-sm">
              <h4 class="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <i class="fa-solid fa-list-check text-teal-600"></i> مؤشرات التنفيذ والتوصيات
              </h4>
              <p class="text-[11px] text-slate-600 leading-relaxed text-justify">
                ${state.description}
              </p>
            </div>
          </div>

          <!-- Photographic Proofs -->
          <div class="report-evidence-gallery mb-2">
            <h4 class="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1">
              <i class="fa-regular fa-image text-teal-600"></i> شواهد البيئة المدرسية والتنفيذ
            </h4>
            <div class="grid ${state.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-3">
              ${state.photos.slice(0, 4).map(p => `
                <div class="rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <div class="h-36 bg-slate-100 overflow-hidden">
                    <img src="${p.url}" class="w-full h-full object-cover">
                  </div>
                  <div class="p-1.5 text-center text-[10px] font-semibold text-slate-700 bg-slate-50 border-t">
                    ${p.caption}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer Sign-off -->
        <div class="border-t-2 border-teal-600/30 pt-3 mt-2">
          <div class="grid grid-cols-2 text-center text-xs">
            <div>
              <p class="text-slate-500 text-[11px]">الموجه الطلابي / مشرف النشاط</p>
              <p class="font-bold text-teal-950 mt-1">${state.officer}</p>
            </div>
            <div>
              <p class="text-slate-500 text-[11px]">مدير المدرسة</p>
              <p class="font-bold text-teal-950 mt-1">${state.principal}</p>
            </div>
          </div>
        </div>
      `;
    }

    /* Template 5: قالب البطاقة التنفيذية المختصرة (One-Page Executive Summary) */
    function templateExecutiveCard() {
      return `
        <div>
          <!-- Header Minimalist -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
            <div class="flex items-center gap-3">
              ${state.logoRight}
              <div>
              <span class="text-[9px] font-bold text-slate-500 block uppercase">المملكة العربية السعودية • وزارة التعليم</span>
              <h2 class="font-black text-sm text-slate-900">${state.school}</h2>
              <span class="text-[10px] text-slate-600">${state.admin}</span>
              </div>
            </div>
            <div class="text-center">
              <span class="bg-emerald-700 text-white font-black text-xs px-3 py-1 rounded">بطاقة إنجاز وتنفيذ</span>
            </div>
            <div class="flex items-center gap-2">
              ${state.logoLeft}
            </div>
          </div>

          <!-- Bold Program Headline -->
          <div class="bg-slate-100 border-r-4 border-slate-900 p-3 rounded-l-lg mb-3">
            <span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">البرنامج المنفذ:</span>
            <h1 class="text-base font-extrabold text-slate-900 mt-0.5">${state.title}</h1>
          </div>

          <!-- Two Column Compact Summary -->
          <div class="grid grid-cols-12 gap-3 mb-3">
            
            <!-- Left Meta Stats (5 Cols) -->
            <div class="col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
              <div>
                <span class="text-slate-400 text-[10px] block">مجال النشاط:</span>
                <span class="font-bold text-slate-800">${state.domain}</span>
              </div>
              <div class="border-t pt-1">
                <span class="text-slate-400 text-[10px] block">المستفيدون:</span>
                <span class="font-black text-emerald-800 text-sm">${state.beneficiaries}</span>
              </div>
              <div class="border-t pt-1">
                <span class="text-slate-400 text-[10px] block">المستهدفون:</span>
                <span class="font-bold text-slate-700">${state.target}</span>
              </div>
              <div class="border-t pt-1">
                <span class="text-slate-400 text-[10px] block">التاريخ والمكان:</span>
                <span class="font-bold text-slate-700">${state.date} • ${state.location}</span>
              </div>
              <div class="border-t pt-1">
                <span class="text-slate-400 text-[10px] block">المنفذ:</span>
                <span class="font-bold text-slate-800">${state.officer}</span>
              </div>
            </div>

            <!-- Right Content (7 Cols) -->
            <div class="col-span-7 space-y-2.5 text-xs">
              <div class="border border-slate-200 rounded-xl p-2.5 bg-white">
                <h4 class="font-bold text-slate-900 text-xs mb-1 text-emerald-800">
                  <i class="fa-solid fa-flag text-xs ml-1"></i> الأهداف المتحققة
                </h4>
                <ul class="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
                  ${state.objectives.map(o => `<li>${o}</li>`).join('')}
                </ul>
              </div>

              <div class="border border-slate-200 rounded-xl p-2.5 bg-white">
                <h4 class="font-bold text-slate-900 text-xs mb-1 text-emerald-800">
                  <i class="fa-solid fa-align-right text-xs ml-1"></i> ملخص الإنجاز
                </h4>
                <p class="text-[11px] text-slate-600 leading-relaxed text-justify">
                  ${state.description}
                </p>
              </div>
            </div>

          </div>

          <!-- Documentation Photos Gallery -->
          <div class="report-evidence-gallery mb-3">
            <span class="text-xs font-bold text-slate-800 block mb-2">شواهد التنفيذ والتوثيق الميداني:</span>
            <div class="grid ${state.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2.5">
              ${state.photos.slice(0, 4).map(p => `
                <div class="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div class="h-36 bg-slate-100 overflow-hidden">
                    <img src="${p.url}" class="w-full h-full object-cover">
                  </div>
                  <div class="p-1.5 text-center text-[10px] text-slate-700 font-bold bg-slate-50 border-t">
                    ${p.caption}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Compact Bottom Footer -->
        <div class="border-t-2 border-slate-800 pt-3 flex items-center justify-between text-xs font-bold">
          <div>
            <span class="text-[10px] text-slate-400 block font-normal">المشرف المنفذ</span>
            <span>${state.officer}</span>
          </div>
          <div class="text-center text-[10px] text-slate-400 font-normal">
            المملكة العربية السعودية • الإدارة العامة للتعليم
          </div>
          <div class="text-left">
            <span class="text-[10px] text-slate-400 block font-normal">مدير المدرسة</span>
            <span>${state.principal}</span>
          </div>
        </div>
      `;
    }

    // Initialize application on page load
    window.onload = function() {
      renderEvidenceList();
      renderReport();
      fitMobilePreview();
      window.addEventListener('resize', fitMobilePreview, {passive:true});
    };
  
    // Adapt fixed A4 preview to small viewports without altering print dimensions.
    function fitMobilePreview() {
      const page = document.getElementById('reportA4Paper');
      const stage = page?.parentElement;
      if (!page || !stage) return;
      page.style.zoom = '1';
      if (window.matchMedia('(max-width:1023px)').matches) {
        const available = Math.max(280,stage.clientWidth - 18);
        page.style.zoom = String(Math.min(1,available / page.offsetWidth));
      }
    }