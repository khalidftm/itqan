# دمج محرك وقوالب HSP3 للطباعة في إتقان

**المصدر:** مستودع `alharbikh/HSP3_reports` (الفرع `main`). نُقلت ملفات المحرك والقوالب إلى `assets/hsp3/` مع عزلها عن محرك `PrintEngine` القديم.

## القوالب الأربعة (A4)
- `official-portrait`: رسمي طولي
- `branded-portrait`: مصوّر طولي
- `official-landscape`: رسمي عرضي
- `branded-landscape`: مصوّر عرضي

## الاستخدام
- من `ftm.html`: زر «قوالب الطباعة» في الشريط العلوي أو «طباعة بقوالب HSP3» في الملخص.
- الصفحة المباشرة: `assets/hsp3/preview/itqan-print.html`.
- معاينة المدير الأصلية بالبيانات التجريبية: `assets/hsp3/preview/print-manager.html`.
- اختيار القالب ثم طباعة أو حفظ PDF من نافذة الطباعة الخاصة بالمتصفح.
- يتولى `js/itqan-bridge.js` قراءة ملف المستخدم وشواهد الإنجاز عبر `ItqanEngines.StorageEngine` من نفس نطاق المتصفح؛ **تُطبع عناوين ومعلومات الملفات، لا محتويات PDF/Word الأصلية**.

## الملفات
- `js/config.js`: تعريفات القوالب الأربعة.
- `config/templates.json`: تعريفات الأبعاد والمناطق.
- `js/composer.js` و `js/paginator.js`: تركيب أوراق الطباعة وتقسيمها.
- `js/components.js`: مكونات الاعتماد والتوقيع والملحقات (بدون صور خاصة).
- `js/print-manager.js`: نافذة المعاينة، التكبير، الطباعة، وتصدير PDF.
- `css/print.css`, `css/print-manager.css`, `css/components.css`, `css/fonts.css`.
- `assets/images/header.png`, `footer.png`, `admin_logo.jpg`: الصور المعتمدة.
- `assets/fonts/tajawal/`: خط تجوال المرخّص للاستخدام داخل التقرير مع ملف الرخصة؛ واجهة المدير تستخدم Cairo المحلي.
- عدّلت هوية الترويسة/التذييل الرسمية إلى «إتقان» دون تغيير مقياس الورق.

## ضوابط الخصوصية وحدود الاختبار
لم تُنقل ملفات التوقيع والختم الشخصية `Khalid-Signature-Original-Clean.png` و `STMP.PNG` من المستودع الخاص، حتى لا تُنشر على GitHub Pages العامة.
لا يُعتمد الاختبار البنيوي بديلًا عن التحقق البصري في Chrome. يُختبر كل قالب، رأس الصفحة وتذييلها، تقسيم الصفحات، المعاينة، الطباعة الفعلية أو Save as PDF، وإغلاق النافذة، على بيانات ملف حقيقي وتجريبي.
