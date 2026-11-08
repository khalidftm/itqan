/* HSP3 reusable administrative content components. No HTML interpolation of user strings. */
(function(H){
"use strict";
function el(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text??"");return x;}
function field(root,label,value){const wrap=el("div","hsp-admin-field");wrap.append(el("span","hsp-admin-label",label),el("strong","hsp-admin-value",value||"................................"));root.append(wrap);return wrap;}
function imageSlot(root,name,src){const slot=el("div","hsp-admin-image-slot");slot.append(el("span","hsp-admin-label",name));if(src){const img=el("img","hsp-admin-mark");img.src=src;img.alt=name;slot.append(img);}else slot.append(el("div","hsp-admin-dotted","مكان "+name));root.append(slot);return slot;}
function block(title){const s=el("section","hsp-admin-component");s.dataset.hspKeepTogether="true";s.append(el("h3","hsp-admin-heading",title));return s;}
const defs={
principalApproval(o={}){const s=block(o.title||"اعتماد مدير المدرسة");field(s,o.role||"مدير المدرسة",o.name);const marks=el("div","hsp-admin-mark-row");imageSlot(marks,"التوقيع",o.signatureSrc);imageSlot(marks,"الختم الرسمي",o.stampSrc);s.append(marks);return s;},
signature(o={}){const s=block(o.title||"التوقيع");field(s,"الاسم",o.name);imageSlot(s,"التوقيع",o.src);return s;},
stamp(o={}){const s=block(o.title||"الختم الرسمي");imageSlot(s,"الختم",o.src);return s;},
employeeAcknowledgment(o={}){const s=block(o.title||"اطلاع الموظف");field(s,"اسم الموظف",o.name);field(s,"التاريخ",o.date);imageSlot(s,"توقيع الموظف",o.signatureSrc);return s;},
reviewApproval(o={}){const s=block(o.title||"الإعداد والمراجعة والاعتماد");const g=el("div","hsp-admin-three");for(const [title,name] of [["إعداد",o.preparedBy],["مراجعة",o.reviewedBy],["اعتماد",o.approvedBy]]){const box=el("div","hsp-admin-cell");field(box,title,name);g.append(box);}s.append(g);return s;},
notes(o={}){const s=block(o.title||"ملاحظات إدارية");s.append(el("p","hsp-admin-notes",o.text||"................................................................................"));return s;},
employeeSignature(o={}){const s=block(o.title||"توقيع الموظف");field(s,"اسم الموظف",o.name);imageSlot(s,"التوقيع",o.signatureSrc);return s;},
hudooriOfficer(o={}){const role=String(o.role||"مسؤول حضوري");const s=block(o.title||"اعتماد "+role);field(s,role,o.name);imageSlot(s,"التوقيع",o.signatureSrc);return s;},
deputyApproval(o={}){const s=block(o.title||"اعتماد وكيل الشؤون المدرسية");field(s,o.role||"وكيل الشؤون المدرسية",o.name);imageSlot(s,"التوقيع",o.signatureSrc);return s;},
bulletList(o={}){const s=block(o.title||"بنود ختامية");s.classList.add("hsp-admin-bullets");const list=el("ul","hsp-admin-bullets-list");const items=Array.isArray(o.items)&&o.items.length?o.items:["البند الأول","البند الثاني","البند الثالث"];items.forEach(item=>list.append(el("li","",item)));s.append(list);return s;}
};
H.AdminComponents=Object.freeze({create(name,options){if(!Object.hasOwn(defs,name))throw Error("مكون غير معروف: "+name);return defs[name](options)},list(){return Object.keys(defs)}});
})(window.HSP3);