// ════════════════ MÓDULO MESA — menu sanduíche no topo ════════════════
(function(){
  'use strict';
  const wrap = document.querySelector('.wrap'); if(!wrap) return;
  const limite   = document.getElementById('mesa-card');
  const aporte   = document.getElementById('aporte-card');
  const contrato = document.querySelector('.card[data-block="contrato"]');
  if(!limite || !contrato) return;   // módulos da Mesa não presentes

  const ICON = {
    limite:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>',
    contrato:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
    aporte:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/></svg>'
  };
  const item = (view,label)=>'<button class="mesa-menu-item" type="button" data-view="'+view+'">'+ICON[view]+'<span>'+label+'</span></button>';

  // --- botão sanduíche + menu, inseridos ao lado do logo ---
  const wrapEl = document.createElement('div');
  wrapEl.className='mesa-menu-wrap'; wrapEl.id='mesa-menu-wrap';
  wrapEl.innerHTML =
    '<button class="mesa-burger" id="mesa-burger" type="button" aria-label="Menu da Mesa" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>'+
    '<div class="mesa-menu" id="mesa-menu">'+
      '<div class="mesa-menu-title">Mesa</div>'+
      item('limite','Definição de limite')+
      item('contrato','Cálculo do contrato')+
      (aporte ? item('aporte','Calculadora de aporte') : '')+
    '</div>';
  const brand = document.querySelector('.topbar .brand');
  if(!brand) return;
  brand.insertBefore(wrapEl, brand.firstChild);

  const burger = wrapEl.querySelector('#mesa-burger');
  const menu   = wrapEl.querySelector('#mesa-menu');
  let currentView = 'limite';

  function selectView(v){
    currentView = v;
    limite.style.display   = (v==='limite')   ? '' : 'none';
    contrato.style.display = (v==='contrato') ? '' : 'none';
    if(aporte) aporte.style.display = (v==='aporte') ? '' : 'none';
    menu.querySelectorAll('.mesa-menu-item').forEach(b=>b.classList.toggle('on', b.dataset.view===v));
  }
  function openMenu(o){ menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o?'true':'false'); }

  burger.addEventListener('click', function(e){ e.stopPropagation(); openMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function(e){
    const b=e.target.closest('.mesa-menu-item'); if(!b) return;
    selectView(b.dataset.view); openMenu(false);
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){}
  });
  document.addEventListener('click', function(e){ if(!wrapEl.contains(e.target)) openMenu(false); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') openMenu(false); });

  // "Usar este limite no cálculo do contrato" leva para a view do contrato
  const aplicarBtn = document.getElementById('m-aplicar');
  if(aplicarBtn) aplicarBtn.addEventListener('click', function(){
    if(document.body.dataset.area==='mesa'){ selectView('contrato'); try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){} }
  });

  function layout(area){
    const mesa = area==='mesa';
    wrapEl.style.display = mesa ? 'flex' : 'none';
    if(!mesa){ openMenu(false); return; }   // comercial: layout normal fica com os outros módulos
    selectView(currentView);                // mesa: só a view escolhida aparece, em largura total
  }

  layout((window.giroAuth && window.giroAuth.area) || document.body.dataset.area || 'comercial');
  const _oaa = window.giroApplyArea;
  window.giroApplyArea = function(area){ if(typeof _oaa==='function') _oaa(area); layout(area); };
})();
