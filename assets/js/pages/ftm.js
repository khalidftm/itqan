/* FTM navigation and modal panels; page data logic is shared with the original dashboard. */
document.addEventListener('DOMContentLoaded', () => {
  const modal = window.ItqanEngines?.ModalEngine;
  if (!modal) return;
  const menu = document.getElementById('ftm-menu-toggle'), dimmer = document.getElementById('ftm-menu-backdrop');
  const store = document.getElementById('tab-portfolio');
  let moved = null, focusBefore = null;
  const openOriginal = modal.open.bind(modal), closeOriginal = modal.close.bind(modal);
  const restore = () => { if (moved) { store.appendChild(moved); moved = null; } };
  modal.open = function(options) { restore(); return openOriginal(options); };
  modal.close = function() { const active = !!moved; restore(); const result = closeOriginal(); if (active) focusBefore?.focus(); return result; };
  function toggleMenu(open) {
    document.body.classList.toggle('ftm-menu-open',open);
    menu?.setAttribute('aria-expanded',String(open));
    if (dimmer) dimmer.hidden = !open;
  }
  menu?.addEventListener('click',() => toggleMenu(!document.body.classList.contains('ftm-menu-open')));
  dimmer?.addEventListener('click',() => toggleMenu(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.body.classList.contains('ftm-menu-open'))toggleMenu(false);else if(moved)modal.close();}});
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-workspace-tab]').forEach(b=>{b.toggleAttribute('aria-current',b===button);});
    toggleMenu(false);window.scrollTo({top:0,behavior:'auto'});
  }));
  function show(kind,trigger){
    const element = kind === 'upload' ? document.getElementById('direct-file-dropzone')?.closest('.card') : document.getElementById('portfolio-items-grid')?.closest('.card');
    if (!element) return;
    focusBefore=trigger;restore();
    modal.open({type:'info',title:kind==='upload'?'مركز رفع الملفات والشواهد':'سجل الشواهد والملفات',html:'<div id="ftm-panel-slot"></div>',hideFooter:true,size:'lg'});
    const root=modal.ensureContainer();
    root.querySelector('#unified-modal-dialog')?.classList.add('ftm-dialog');
    root.querySelector('#ftm-panel-slot')?.appendChild(element);
    moved=element;toggleMenu(false);
    root.querySelector('#unified-modal-close-x')?.focus();
  }
  document.querySelectorAll('[data-ftm-panel]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.ftmPanel,button)));
});
