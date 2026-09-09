// ════════════════ MÓDULO COMERCIAL — material para o cliente ════════════════
(function(){
  'use strict';
  var wrap  = document.querySelector('.wrap');
  var brand = document.querySelector('.topbar .brand');
  if(!wrap || !brand) return;

  // Dados das lâminas por empresa (PNG embutido em base64).
  // MATERIAIS vem de js/data/materiais.js

  var ICON = {
    calc:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="15" x2="8.01" y2="15"/><line x1="12" y1="15" x2="12.01" y2="15"/></svg>',
    mat:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    dl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
  };

  function currentTeam(){
    var on = document.querySelector('#company-seg button.on');
    return (on && on.dataset.team) || document.body.dataset.team || 'vindi';
  }

  // --- menu sanduíche ao lado do logo (só aparece no Comercial) ---
  var menuWrap = document.createElement('div');
  menuWrap.className = 'mesa-menu-wrap'; menuWrap.id = 'com-menu-wrap';
  menuWrap.innerHTML =
    '<button class="mesa-burger" id="com-burger" type="button" aria-label="Menu do Comercial" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>'+
    '<div class="mesa-menu" id="com-menu">'+
      '<div class="mesa-menu-title">Comercial</div>'+
      '<button class="mesa-menu-item" type="button" data-view="calc">'+ICON.calc+'<span>Calculadoras</span></button>'+
      '<button class="mesa-menu-item" type="button" data-view="materiais">'+ICON.mat+'<span>Material para o cliente</span></button>'+
    '</div>';
  brand.insertBefore(menuWrap, brand.firstChild);
  var burger = menuWrap.querySelector('#com-burger');
  var menu   = menuWrap.querySelector('#com-menu');

  // --- container da visão "Material para o cliente" ---
  var view = document.createElement('div');
  view.id = 'materiais-view';
  view.innerHTML =
    '<div class="mat-head">'+
      '<h2>Material para o cliente</h2>'+
      '<p>Baixe e envie ao cliente pelo WhatsApp ou e-mail. Imagens em alta resolução, com a identidade da empresa.</p>'+
    '</div>'+
    '<div class="mat-grid" id="mat-grid"></div>';
  wrap.appendChild(view);
  var grid = view.querySelector('#mat-grid');

  // A tabela "materiais" do Supabase NÃO é catálogo: é o log de downloads.
  // O catálogo vem do arquivo js/data/materiais.js (constante MATERIAIS).
  function listaDoTime(team){
    return MATERIAIS[team] || MATERIAIS.vindi || [];
  }

  function renderMateriais(){ pintarGrid(); }

  function pintarGrid(){
    var team = currentTeam();
    var arr = listaDoTime(team);
    grid.innerHTML = arr.map(function(m){
      return '<div class="mat-card">'+
          '<div class="mat-thumb"><img src="'+m.img+'" alt=""></div>'+
          '<div class="mat-info">'+
            '<h3>'+m.titulo+'</h3>'+
            '<p>'+m.desc+'</p>'+
            '<button class="btn-pdf mat-dl" type="button" data-team="'+team+'" data-id="'+m.id+'">'+ICON.dl+'Baixar imagem</button>'+
          '</div>'+
        '</div>';
    }).join('');
  }

  // ---- Registro do download na tabela "materiais" do Supabase ----
  // Colunas: lamina, equipe, usuario_id, usuario_nome (criado_em é preenchido
  // pelo próprio banco). Falha aqui nunca impede o download.
  function registrarDownload(team, m){
    var sb = window.giroDb || window.giroDB;
    if(!sb) return;
    var a = window.giroAuth || {};
    sb.from('materiais').insert({
      lamina:       m.titulo,
      equipe:       team,
      usuario_id:   a.id   || null,
      usuario_nome: a.nome || null
    }).then(function(res){
      if(res && res.error) console.warn('Download não registrado:', res.error.message);
    }, function(err){
      console.warn('Download não registrado:', err && err.message);
    });
  }

  grid.addEventListener('click', function(e){
    var b = e.target.closest('.mat-dl'); if(!b) return;
    var team = b.dataset.team, id = b.dataset.id;
    var arr = listaDoTime(team);
    var m = null; for(var i=0;i<arr.length;i++){ if(arr[i].id===id){ m=arr[i]; break; } }
    if(!m) return;
    var a = document.createElement('a');
    a.href = m.img; a.download = m.file;
    document.body.appendChild(a); a.click(); a.remove();
    registrarDownload(team, m);
  });

  // --- troca de visão (calculadoras <-> materiais) ---
  var currentView = 'calc';
  var _prev = window.giroApplyArea;
  function baseComercial(){ if(typeof _prev === 'function') _prev('comercial'); }
  function cards(){ return wrap.querySelectorAll(':scope > .card'); }

  function selectView(v){
    currentView = v;
    if(v === 'materiais'){
      cards().forEach(function(c){ c.style.display = 'none'; });
      view.style.display = 'block';
      renderMateriais();
    } else {
      view.style.display = 'none';
      cards().forEach(function(c){ c.style.display = ''; });
      baseComercial();
    }
    menu.querySelectorAll('.mesa-menu-item').forEach(function(b){ b.classList.toggle('on', b.dataset.view === v); });
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(_){}
  }

  function openMenu(o){ menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o?'true':'false'); }
  burger.addEventListener('click', function(e){ e.stopPropagation(); openMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function(e){
    var b = e.target.closest('.mesa-menu-item'); if(!b) return;
    selectView(b.dataset.view); openMenu(false);
  });
  document.addEventListener('click', function(e){ if(!menuWrap.contains(e.target)) openMenu(false); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') openMenu(false); });

  function layout(area){
    var com = (area === 'comercial');
    menuWrap.style.display = com ? 'flex' : 'none';
    if(!com){ openMenu(false); view.style.display = 'none'; return; }
    selectView(currentView);
  }

  var _oaa = window.giroApplyArea;
  window.giroApplyArea = function(area){ if(typeof _oaa === 'function') _oaa(area); layout(area); };

  // re-renderiza os materiais ao trocar de empresa (admin)
  if(typeof window.setTeam === 'function'){
    var _st = window.setTeam;
    window.setTeam = function(t){ _st(t); if(currentView === 'materiais' && document.body.dataset.area === 'comercial') renderMateriais(); };
  }

  layout((window.giroAuth && window.giroAuth.area) || document.body.dataset.area || 'comercial');
})();


// ════════════════ ÁREA DO USUÁRIO (perfil · senha · sair) ════════════════
(function(){
  'use strict';
  if(!window.supabase) return;

  var ov = document.createElement('div');
  ov.className = 'usr-ov'; ov.id = 'usr-ov';
  ov.innerHTML =
    '<div class="usr-card" role="dialog" aria-modal="true" aria-labelledby="usr-title">' +
      '<div class="usr-head"><h3 id="usr-title">Minha conta</h3>' +
        '<button class="usr-x" id="usr-x" type="button" aria-label="Fechar">&times;</button></div>' +
      '<div class="usr-tabs">' +
        '<button type="button" data-tab="perfil" class="on">Perfil</button>' +
        '<button type="button" data-tab="senha">Ajustar senha</button>' +
      '</div>' +
      '<div class="usr-body">' +
        '<div id="usr-perfil">' +
          '<div class="usr-row"><span class="usr-k">Nome</span><span class="usr-v" id="usr-nome">—</span></div>' +
          '<div class="usr-row"><span class="usr-k">E-mail</span><span class="usr-v" id="usr-email">—</span></div>' +
          '<div class="usr-row"><span class="usr-k">Empresa</span><span class="usr-v" id="usr-emp">—</span></div>' +
          '<div class="usr-row"><span class="usr-k">Área</span><span class="usr-v" id="usr-area">—</span></div>' +
          '<div class="usr-acts"><button class="usr-btn ghost" id="usr-sair" type="button">Sair da conta</button></div>' +
        '</div>' +
        '<div id="usr-senha" hidden>' +
          '<label for="usr-atual">Senha atual</label>' +
          '<input type="password" id="usr-atual" autocomplete="current-password">' +
          '<label for="usr-nova">Nova senha</label>' +
          '<input type="password" id="usr-nova" autocomplete="new-password">' +
          '<label for="usr-nova2">Repita a nova senha</label>' +
          '<input type="password" id="usr-nova2" autocomplete="new-password">' +
          '<div class="usr-msg" id="usr-msg"></div>' +
          '<div class="usr-acts"><button class="usr-btn" id="usr-salvar" type="button">Salvar nova senha</button></div>' +
          '<p class="usr-hint">Mínimo de 6 caracteres. Confirmamos a senha atual antes de trocar.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(ov);

  function q(id){ return document.getElementById(id); }
  function msg(t, cls){ var m = q('usr-msg'); m.textContent = t || ''; m.className = 'usr-msg' + (cls ? ' ' + cls : ''); }

  function preencher(){
    var a = window.giroAuth || {};
    q('usr-nome').textContent  = a.nome || '—';
    q('usr-email').textContent = a.email || '—';
    var chip = document.getElementById('acct-tag');
    q('usr-emp').textContent  = a.admin ? 'Admin · acesso total' : ((chip && chip.textContent.split(' · ')[0]) || (a.team || '—'));
    q('usr-area').textContent = a.admin ? 'Todas' : ((chip && chip.textContent.split(' · ')[1]) || (a.area || '—'));
  }

  function aba(nome){
    ov.querySelectorAll('.usr-tabs button').forEach(function(b){ b.classList.toggle('on', b.dataset.tab === nome); });
    q('usr-perfil').hidden = nome !== 'perfil';
    q('usr-senha').hidden  = nome !== 'senha';
    if(nome === 'senha') setTimeout(function(){ q('usr-atual').focus(); }, 40);
  }

  function abrir(){ preencher(); aba('perfil'); msg(''); ov.classList.add('open'); }
  function fechar(){
    ov.classList.remove('open');
    ['usr-atual','usr-nova','usr-nova2'].forEach(function(id){ q(id).value = ''; });
    msg('');
  }

  q('usr-x').addEventListener('click', fechar);
  ov.addEventListener('click', function(e){ if(e.target === ov) fechar(); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && ov.classList.contains('open')) fechar(); });
  ov.querySelectorAll('.usr-tabs button').forEach(function(b){
    b.addEventListener('click', function(){ msg(''); aba(this.dataset.tab); });
  });

  q('usr-sair').addEventListener('click', function(){
    fechar();
    var lo = document.getElementById('acct-logout');
    if(lo) lo.click();
  });

  q('usr-salvar').addEventListener('click', async function(){
    var atual = q('usr-atual').value, n1 = q('usr-nova').value, n2 = q('usr-nova2').value;
    var email = (window.giroAuth && window.giroAuth.email) || '';
    if(!atual){ msg('Informe a senha atual.', 'err'); return; }
    if(n1.length < 6){ msg('A nova senha deve ter ao menos 6 caracteres.', 'err'); return; }
    if(n1 !== n2){ msg('As senhas não coincidem.', 'err'); return; }
    if(n1 === atual){ msg('A nova senha precisa ser diferente da atual.', 'err'); return; }

    var btn = this; btn.disabled = true; msg('Verificando…');
    var sb = window.giroDb;
    if(!sb){ msg('Não foi possível falar com o servidor. Recarregue a página.', 'err'); btn.disabled = false; return; }

    try {
      var chk = await sb.auth.signInWithPassword({ email: email, password: atual });
      if(chk.error){ msg('Senha atual incorreta.', 'err'); btn.disabled = false; return; }
    } catch(e){ msg('Não foi possível verificar a senha atual.', 'err'); btn.disabled = false; return; }

    msg('Salvando…');
    try {
      var res = await sb.auth.updateUser({ password: n1 });
      if(res.error){ msg(res.error.message || 'Não foi possível salvar.', 'err'); btn.disabled = false; return; }
    } catch(e){ msg('Não foi possível salvar a nova senha.', 'err'); btn.disabled = false; return; }

    ['usr-atual','usr-nova','usr-nova2'].forEach(function(id){ q(id).value = ''; });
    msg('Senha alterada com sucesso.', 'ok');
    btn.disabled = false;
  });

  // Torna o nome no topo clicável e abre a área do usuário.
  function ligarChip(){
    var meta = document.querySelector('#acct-chip .acct-meta');
    if(!meta || meta.dataset.usrLigado) return;
    meta.dataset.usrLigado = '1';
    meta.classList.add('acct-open');
    meta.setAttribute('role', 'button');
    meta.setAttribute('tabindex', '0');
    meta.title = 'Minha conta';
    meta.addEventListener('click', abrir);
    meta.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); abrir(); } });
  }
  setInterval(ligarChip, 600);
  ligarChip();

  window.giroAbrirConta = abrir;
})();

