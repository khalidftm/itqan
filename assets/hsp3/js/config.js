/* Kept aligned with config/templates.json so HTML works from file:// without fetch. */
window.HSP3 = window.HSP3 || {};
window.HSP3.profiles = [
  {id:"official-landscape",name:"الرسمي العرضي",orientation:"landscape",w:297,h:210,header:24,footer:10,mode:"text"},
  {id:"branded-landscape",name:"المصور العرضي",orientation:"landscape",w:297,h:210,header:24,footer:10,mode:"image",headerImage:"../assets/images/header.png",footerImage:"../assets/images/footer.png"},
  {id:"official-portrait",name:"الرسمي الطولي",orientation:"portrait",w:210,h:297,header:34,footer:16,mode:"text"},
  {id:"branded-portrait",name:"المصور الطولي",orientation:"portrait",w:210,h:297,header:34,footer:16,mode:"image",headerImage:"../assets/images/header.png",footerImage:"../assets/images/footer.png"}
];
window.HSP3.metrics = {paddingTop:3,paddingBottom:3,paddingInline:10,safety:3};
window.HSP3.getProfile = id => window.HSP3.profiles.find(p=>p.id===id) || window.HSP3.profiles[0];
window.HSP3.toArabicDigits = s => String(s).replace(/[0-9]/g, n=>"٠١٢٣٤٥٦٧٨٩"[+n]);