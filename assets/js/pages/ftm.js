/* FTM menu: three persisted desktop modes and mobile drawer. */
document.addEventListener('DOMContentLoaded', () => {
  const modal = window.ItqanEngines?.ModalEngine;
  if (!modal) return;
  const menu = document.getElementById('ftm-menu-toggle');
  const dimmer = document.getElementById('ftm-menu-backdrop');
  const sidebar = document.getElementById('ftm-sidebar');
  const store = document.getElementById('tab-portfolio');
  const modes = ['expanded', 'icons', 'hidden'];
  const storageKey = 'itqan-ftm-sidebar-mode-v1';
  const mobileQuery = window.matchMedia('(max-width: 760px)');
  let currentMode = 'expanded';
  let moved = null;
  let focusBefore = null;
  const readMode = () => { try { return localStorage.getItem(storageKey); } catch { return null; } };
  const saveMode = mode => { try { localStorage.setItem(storageKey, mode); } catch { /* restricted browser storage */ } };
  function setDrawer(open) {
    document.body.classList.toggle('ftm-menu-open', open);
    if (dimmer) dimmer.hidden = !open;
    if (menu) menu.setAttribute('aria-expanded', String(open));
    if (mobileQuery.matches) sidebar?.setAttribute('aria-hidden', String(!open));
  }
  function applyMode(mode, persist = true) {
    currentMode = modes.includes(mode) ? mode : 'expanded';
    modes.forEach(value => document.body.classList.toggle('ftm-sidebar-' + value, value === currentMode));
    if (persist) saveMode(currentMode);
    if (!mobileQuery.matches) {
      if (menu) {
        const next = modes[(modes.indexOf(currentMode) + 1) % modes.length];
        menu.title = 'القائمة: ' + ({expanded:'كاملة',icons:'أيقونات فقط',hidden:'مخفية'}[currentMode]) + ' — اضغط للتبديل إلى ' + ({expanded:'كاملة',icons:'أيقونات فقط',hidden:'مخفية'}[next]);
        menu.setAttribute('aria-label',menu.title);
        menu.setAttribute('aria-expanded',String(currentMode !== 'hidden'));
      }
      sidebar?.setAttribute('aria-hidden', String(currentMode === 'hidden'));
      setDrawer(false);
      if (menu) menu.setAttribute('aria-expanded', String(currentMode !== 'hidden'));
    } else {
      menu?.setAttribute('aria-label', 'فتح أو إغلاق قائمة التنقل');
      menu?.setAttribute('title', 'فتح أو إغلاق القائمة');
      setDrawer(false);
    }
  }
  menu?.addEventListener('click', () => {
    if (mobileQuery.matches) setDrawer(!document.body.classList.contains('ftm-menu-open'));
    else applyMode(modes[(modes.indexOf(currentMode) + 1) % modes.length]);
  });
  dimmer?.addEventListener('click',() => setDrawer(false));
  mobileQuery.addEventListener?.('change',() => applyMode(currentMode, false));
  applyMode(readMode() || 'expanded', false);

  const originalOpen = modal.open.bind(modal);
  const originalClose = modal.close.bind(modal);
  const restore = () => { if (moved) { store.appendChild(moved); moved = null; } };
  modal.open = function(options) { restore(); return originalOpen(options); };
  modal.close = function() {
    const active = Boolean(moved);
    restore();
    const result = originalClose();
    if (active && focusBefore?.isConnected) focusBefore.focus();
    return result;
  };
  document.addEventListener('keydown',event => {
    if (event.key !== 'Escape') return;
    if (document.body.classList.contains('ftm-menu-open')) setDrawer(false);
    else if (moved) modal.close();
  });
  document.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{
    document.querySelectorAll('[data-workspace-tab]').forEach(item=>{
      item.toggleAttribute('aria-current', item === button);
      item.classList.toggle('active',item === button);
    });
    setDrawer(false);
    window.scrollTo({top:0,behavior:'auto'});
  }));
  function showPanel(kind, trigger) {
    const element=kind==='upload'
      ? document.getElementById('direct-file-dropzone')?.closest('.card')
      : document.getElementById('portfolio-items-grid')?.closest('.card');
    if(!element)return;
    focusBefore=trigger;
    restore();
    modal.open({type:'info',title:kind==='upload'?'مركز رفع الملفات والشواهد':'سجل الشواهد والملفات',html:'<div id="ftm-panel-slot"></div>',hideFooter:true,size:'lg'});
    const root=modal.ensureContainer();
    root.querySelector('#unified-modal-dialog')?.classList.add('ftm-dialog');
    root.querySelector('#ftm-panel-slot')?.appendChild(element);
    moved=element;
    setDrawer(false);
    root.querySelector('#unified-modal-close-x')?.focus();
  }
  document.querySelectorAll('[data-ftm-panel]').forEach(button=>button.addEventListener('click',()=>showPanel(button.dataset.ftmPanel,button)));
});
