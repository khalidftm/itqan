window.HSP3=window.HSP3||{};
(function(api){
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const digits=api.toArabicDigits;
api.makeContent=(type="table",options={})=>{
const label=options.title||"التقرير الإجمالي لأنواع استئذانات الموظفين";
if(type==="blank")return '<h1 class="page-title">'+esc(label)+'</h1>';
if(type==="statistics")return '<h1 class="page-title">'+esc(label)+'</h1><div class="stat-grid"><div class="stat"><b>٤٢</b>عدد الموظفين</div><div class="stat"><b>٥٣٢</b>عدد الطلبات</div><div class="stat"><b>٥</b>عدد الأنواع</div></div><h2 class="section-title">ملخص المؤشرات</h2><p class="paragraph">هذا مثال مستقل لمحتوى إحصائي دون ترويسة أو تذييل. يُركّب في القالب المحدد دون نسخ عناصر هوية الصفحة.</p>';
const count=options.rows||12;let rows="";
for(let i=1;i<=count;i++){let a=(i*3)%11,b=i%4,c=i%3,d=i%2,e=i%7;rows+='<tr data-break-unit="row"><td>'+digits(i)+'</td><td class="name">موظف تجريبي '+digits(i)+'</td>'+[a,b,c,d,e,a+b+c+d+e].map(n=>'<td>'+digits(n)+'</td>').join('')+'</tr>';}
return '<h1 class="page-title">'+esc(label)+'</h1><table class="data-table"><thead><tr>'+["م","اسم الموظف","طارئ","سنوية","عمل","تدريب","طبي","المجموع"].map(s=>'<th>'+s+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table>';
};
})(window.HSP3);