// ════════════════ MÓDULO MESA — definição de limite ════════════════
(function(){
  'use strict';
  const $g = id => document.getElementById(id);

  // Marca os cards existentes pela ordem (sem alterar o HTML original)
  const cardsList = document.querySelectorAll('.wrap > .card');
  const ORDER = ['contrato','comparar','desconto','simulador'];
  cardsList.forEach((c,i)=>{ if(ORDER[i]) c.dataset.block = ORDER[i]; });

  const M = { prazo:150, _d:null };
  let mesaPdfTeam = 'vindi';   // identidade só do PDF (a tela segue Vindi)

  // ── card da Mesa (injetado como primeiro bloco) ──
  const card = document.createElement('div');
  card.className = 'card'; card.id = 'mesa-card'; card.dataset.block = 'mesa';
  card.style.display = 'none';
  card.innerHTML =
    '<div class="card-head">'+
      '<div>'+
        '<h2>Definição de limite <span class="mesa-tag">Mesa</span></h2>'+
        '<p>Informe faturamento, retenção da bandeira e vencimento. O limite máximo sai do VDR — o que o cliente consegue pagar por dia.</p>'+
      '</div>'+
    '</div>'+
    '<div class="card-body">'+
      '<div class="fields">'+
        '<div class="field">'+
          '<label for="m-fat">Faturamento mensal médio</label>'+
          '<div class="input-wrap has-prefix"><span class="input-prefix">R$</span>'+
            '<input type="number" id="m-fat" placeholder="0,00"></div>'+
        '</div>'+
        '<div class="field">'+
          '<label for="m-ret">% retido do faturamento (bandeira)</label>'+
          '<div class="input-wrap has-suffix"><span class="input-suffix">%</span>'+
            '<input type="number" id="m-ret" placeholder="0" step="0.5"></div>'+
        '</div>'+
        '<div class="field">'+
          '<label for="m-taxa">Taxa mensal</label>'+
          '<select id="m-taxa">'+
            '<option value="5.0" selected>5,0% ao mês</option>'+
            '<option value="4.5">4,5% ao mês</option>'+
            '<option value="4.0">4,0% ao mês</option>'+
            '<option value="3.5">3,5% ao mês</option>'+
            '<option value="3.0">3,0% ao mês</option>'+
            '<option value="2.5">2,5% ao mês</option>'+
          '</select>'+
        '</div>'+
        '<div class="field">'+
          '<label for="m-car">Carência (dias)</label>'+
          '<div class="input-wrap has-suffix"><span class="input-suffix">dias</span>'+
            '<input type="number" id="m-car" value="30" min="0" max="120" step="1"></div>'+
        '</div>'+
      '</div>'+

      '<div class="seg-label">Vencimento</div>'+
      '<div class="pills" id="m-prazo-pills">'+
        '<button class="pill" data-prazo="90" type="button">90 dias</button>'+
        '<button class="pill" data-prazo="120" type="button">120 dias</button>'+
        '<button class="pill on" data-prazo="150" type="button">150 dias</button>'+
        '<button class="pill" data-prazo="180" type="button">180 dias</button>'+
      '</div>'+

      '<div class="hl-stack">'+
        '<div class="hl hero-fill">'+
          '<div class="hl-label">Limite máximo — valor a liberar</div>'+
          '<div class="hl-value" id="m-lib">R$ 0,00</div>'+
          '<div class="hl-sub" id="m-lib-sub">Maior liberação que o VDR do cliente comporta</div>'+
        '</div>'+
        '<div class="hl-pair">'+
          '<div class="hl">'+
            '<div class="hl-label">VDR — retido por dia</div>'+
            '<div class="hl-value v-key" id="m-vrd">R$ 0,00</div>'+
            '<div class="hl-sub">Faturamento ÷ 30 × % retido</div>'+
          '</div>'+
          '<div class="hl">'+
            '<div class="hl-label">Contrato no limite</div>'+
            '<div class="hl-value v-ink" id="m-total">R$ 0,00</div>'+
            '<div class="hl-sub" id="m-total-sub">VDR × dias de pagamento</div>'+
          '</div>'+
        '</div>'+
      '</div>'+

      '<div class="res-grid">'+
        '<div class="rc"><div class="rc-label">Dias de pagamento</div><div class="rc-value v-key" id="m-dias">0 dias</div><div class="rc-sub" id="m-dias-sub">vencimento − carência</div></div>'+
        '<div class="rc"><div class="rc-label">Imposto (IOF)</div><div class="rc-value v-ink" id="m-iof">R$ 0,00</div><div class="rc-sub">no limite máximo</div></div>'+
        '<div class="rc"><div class="rc-label">CET ao mês</div><div class="rc-value v-accent" id="m-cetam">0,00%</div><div class="rc-sub">no limite máximo</div></div>'+
        '<div class="rc"><div class="rc-label">Equivalente mensal</div><div class="rc-value v-accent" id="m-vrd-mes">R$ 0,00</div><div class="rc-sub">VDR × 30 dias</div></div>'+
      '</div>'+

      '<div class="seg-label" style="margin-top:20px">Limite por vencimento — mesma taxa e carência</div>'+
      '<div class="mesa-prazos" id="m-prazos"></div>'+

      '<button class="btn-apply" id="m-aplicar" type="button" disabled>Usar este limite no cálculo do contrato</button>'+

      '<div class="note">'+
        '<div class="note-title">Como o limite é calculado</div>'+
        '<div class="note-body">Contrato máximo = VDR × dias de pagamento. Do contrato, descontam-se juros do período e IOF para chegar ao valor a liberar. Faturamento, % de retenção, vencimento, taxa e carência — todos alteram o resultado.</div>'+
      '</div>'+
    '</div>';
  document.querySelector('.wrap').insertBefore(card, cardsList[0]);

  // ── barra de identidade do PDF (dentro do bloco de contrato; só aparece na Mesa) ──
  const pdfBar = document.createElement('div');
  pdfBar.className = 'mesa-pdfbar'; pdfBar.id = 'm-pdfbar'; pdfBar.style.display = 'none';
  pdfBar.innerHTML =
    '<span class="mesa-pdfbar-label">Identidade do PDF</span>'+
    '<div class="seg" id="m-pdf-seg">'+
      '<button type="button" data-team="vindi" class="on">Vindi</button>'+
      '<button type="button" data-team="tray">Tray</button>'+
      '<button type="button" data-team="bling">Bling</button>'+
    '</div>'+
    '<span class="mesa-pdfbar-hint">A tela segue Vindi; só o PDF muda.</span>';
  const contratoCard = document.querySelector('.wrap > .card[data-block="contrato"]');
  const contratoBody = contratoCard ? contratoCard.querySelector('.card-body') : null;
  if(contratoBody) contratoBody.insertBefore(pdfBar, contratoBody.firstChild);
  $g('m-pdf-seg').addEventListener('click', function(e){
    const b = e.target.closest('button'); if(!b) return;
    mesaPdfTeam = b.dataset.team;
    this.querySelectorAll('button').forEach(x=>x.classList.toggle('on', x===b));
  });

  // Override do gerador de PDF: na Mesa, exporta na identidade escolhida (sem mexer na tela)
  const _gerarPDF = window.gerarPDF;
  window.gerarPDF = function(tipo){
    const mesa = document.body.dataset.area === 'mesa';
    if(mesa && mesaPdfTeam && mesaPdfTeam !== S.team){
      const orig = S.team; S.team = mesaPdfTeam;
      try { _gerarPDF(tipo); } finally { S.team = orig; }
    } else { _gerarPDF(tipo); }
  };

  // ── matemática (inversa das fórmulas existentes) ──
  function compute(fat, ret, taxa, car, prazo){
    const vrd = fat/30*(ret/100);
    const dias = Math.max(0, prazo - car);
    const totalMax = vrd*dias;
    const taxaIof = IOF_FIXO + IOF_DIA*prazo;
    const fator = Math.pow(1+taxa/100, prazo/30);
    const lib = totalMax*(1-taxaIof)/fator;
    const iof = lib>0 ? lib/(1-taxaIof)-lib : 0;
    const cetAm = (lib>0 && totalMax>0) ? (Math.pow(totalMax/lib, 30/prazo)-1)*100 : 0;
    return { vrd, dias, totalMax, lib, iof, cetAm };
  }

  function lerCar(){
    let car = parseInt($g('m-car').value,10);
    if(isNaN(car)||car<0) car=0; if(car>120) car=120;
    return car;
  }

  function calcMesa(){
    const fat  = parseFloat($g('m-fat').value)||0;
    const ret  = parseFloat($g('m-ret').value)||0;
    const taxa = parseFloat($g('m-taxa').value)||5.0;
    const car  = lerCar();
    const d = compute(fat, ret, taxa, car, M.prazo);
    M._d = Object.assign({fat, ret, taxa, car, prazo:M.prazo}, d);

    $g('m-lib').textContent = fmt(Math.max(0,d.lib));
    $g('m-lib-sub').textContent = d.lib>0
      ? ('Vencimento '+M.prazo+' dias · taxa '+taxa.toFixed(1).replace('.',',')+'% · carência '+car+'d')
      : 'Maior liberação que o VDR do cliente comporta';
    $g('m-vrd').textContent = fmt(d.vrd);
    $g('m-total').textContent = fmt(d.totalMax);
    $g('m-total-sub').textContent = 'VDR × '+d.dias+' dias de pagamento';
    $g('m-dias').textContent = d.dias+' dias';
    $g('m-dias-sub').textContent = M.prazo+'d − '+car+'d de carência';
    $g('m-iof').textContent = fmt(d.iof);
    $g('m-cetam').textContent = fmtPct(d.cetAm);
    $g('m-vrd-mes').textContent = fmt(d.vrd*30);

    $g('m-prazos').innerHTML = [90,120,150,180].map(p=>{
      const r = compute(fat, ret, taxa, car, p);
      return '<button type="button" class="mesa-pz'+(p===M.prazo?' on':'')+'" data-prazo="'+p+'">'+
        '<span class="mesa-pz-prazo">'+p+' dias</span>'+
        '<span class="mesa-pz-val">'+fmt(Math.max(0,r.lib))+'</span>'+
        '<span class="mesa-pz-sub">'+r.dias+'d de pagamento</span>'+
      '</button>';
    }).join('');

    $g('m-aplicar').disabled = !(d.lib>0);
  }

  function setMesaPrazo(p){
    M.prazo = p;
    document.querySelectorAll('#m-prazo-pills .pill').forEach(b=>b.classList.toggle('on', parseInt(b.dataset.prazo,10)===p));
    calcMesa();
  }

  // ── revela e alimenta o "Cálculo do contrato" com o limite definido ──
  function aplicar(){
    const d = M._d; if(!d || !(d.lib>0)) return;
    if(d.taxa === 2.5){ const opt=$g('opt-taxa-25'); if(opt){ opt.hidden=false; opt.disabled=false; } }
    $g('c-taxa').value = d.taxa.toFixed(1);
    S.prazo = d.prazo;
    document.querySelectorAll('#prazo-pills .pill').forEach(b=>b.classList.toggle('on', parseInt(b.textContent,10)===d.prazo));
    const cc=$g('c-carencia'); if(cc) cc.value = d.car;
    setCarencia(d.car);                               // função existente — recalcula tudo
    $g('c-liberado').value = d.lib.toFixed(2);
    calcContrato();
    const contrato = document.querySelector('.wrap > .card[data-block="contrato"]');
    if(contrato && document.body.dataset.area === 'mesa') contrato.style.display = '';
    if(contrato) contrato.scrollIntoView({behavior:'smooth', block:'start'});
  }

  // ── eventos ──
  ['m-fat','m-ret','m-car'].forEach(id=>$g(id).addEventListener('input', calcMesa));
  $g('m-taxa').addEventListener('change', calcMesa);
  $g('m-prazo-pills').addEventListener('click', function(e){
    const b = e.target.closest('.pill'); if(!b) return;
    setMesaPrazo(parseInt(b.dataset.prazo,10));
  });
  $g('m-prazos').addEventListener('click', function(e){
    const b = e.target.closest('.mesa-pz'); if(!b) return;
    setMesaPrazo(parseInt(b.dataset.prazo,10));
  });
  $g('m-aplicar').addEventListener('click', aplicar);

  // ── troca de visão por área (chamado pelo módulo de acesso) ──
  window.giroApplyArea = function(area){
    const mesa = area === 'mesa';
    card.style.display = mesa ? '' : 'none';
    document.querySelectorAll('.wrap > .card[data-block]').forEach(c=>{
      const b = c.dataset.block;
      if(b==='comparar' || b==='simulador' || b==='desconto') c.style.display = mesa ? 'none' : '';
      else if(b==='contrato') c.style.display = mesa ? 'none' : '';   // Mesa: só aparece via botão
    });
    // Ajustes avançados: liberados sem senha na Mesa; re-travados no Comercial
    if(mesa){ if(!ajustesLiberados) liberarAjustes(); }
    else { if(ajustesLiberados) bloquearAjustes(); }
    const bA = $g('btn-ajustes'); if(bA) bA.style.display = mesa ? 'none' : '';
    pdfBar.style.display = mesa ? '' : 'none';
    if(mesa) calcMesa();
  };
})();

// ════════════════ MÓDULO DE ACESSO (login/cadastro/admin) — Supabase ════════════════
(function(){
  'use strict';

  // ── Conexão com o Supabase (chave publicável: pode ficar no código) ──
  const SUPABASE_URL = 'https://fkaxigrygackbiehxssf.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_5pPocHO75LBzNb7O8rFalw_dB45d4-1';
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.giroDb = db;   // usado pela area do usuario
  window.giroDB = db; // reaproveitado depois para registrar histórico

  // ┌──────────────────────────────────────────────────────────────┐
  // │  PRÉ-ATRIBUIÇÃO DE ÁREA PARA E-MAILS VINDI (opcional)          │
  // └──────────────────────────────────────────────────────────────┘
  const VINDI_AREAS = {
    // 'exemplo@vindi.com.br': 'mesa',
  };

  const DOMINIOS = {
    'vindi.com.br': { team:'vindi' },
    'tray.net.br':  { team:'tray',  area:'comercial' },
    'bling.com.br': { team:'bling', area:'comercial' }
  };

  const qs = id => document.getElementById(id);
  const AREA_LABEL = { comercial:'Comercial', mesa:'Mesa' };
  const norm = e => String(e||'').trim().toLowerCase();
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const dominio = e => { const m = norm(e).match(/@([^@\s]+)$/); return m?m[1]:''; };
  const identidade = e => DOMINIOS[dominio(e)] || null;

  function resolverArea(email, escolha){
    const info = identidade(email); if(!info) return null;
    if(info.area) return info.area;
    const pre = VINDI_AREAS[norm(email)];
    return pre || escolha || null;
  }

  // ── mapeamento (time, área) ⇄ tipo da tabela "perfis" ──
  function tipoFrom(team, area){
    if(team === 'tray')  return 'comercial tray';
    if(team === 'bling') return 'comercial bling';
    if(team === 'vindi') return area === 'mesa' ? 'mesa de crédito' : 'comercial vindi';
    return 'comercial vindi';
  }
  function fromTipo(tipo, email){
    const info = identidade(email) || { team:'vindi' };
    const admin = tipo === 'adm';
    const team = info.team;
    let area = 'comercial';
    if(info.area) area = info.area;                 // tray/bling: sempre comercial
    else if(tipo === 'mesa de crédito') area = 'mesa';
    else area = VINDI_AREAS[norm(email)] || 'comercial';
    return { team, area, admin };
  }

  function traduzErro(msg){
    msg = String(msg||'');
    if(/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
    if(/already registered|already been registered|User already/i.test(msg)) return 'Este e-mail já tem cadastro. Faça login.';
    if(/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
    if(/at least 6/i.test(msg)) return 'A senha deve ter ao menos 6 caracteres.';
    return msg || 'Algo deu errado. Tente de novo.';
  }

  const gate = qs('auth-gate');
  const viewLogin = qs('auth-login');
  const viewCad = qs('auth-cadastro');
  const viewReset = qs('auth-reset');
  const viewNova = qs('auth-nova');
  let areaEscolhida = null;

  // ── Recuperação de senha ──────────────────────────────────────────────
  // O link do e-mail volta para a própria página com "#access_token=...&type=recovery".
  // Detectamos isso ANTES do init para não entrar direto no app: primeiro
  // pedimos a nova senha, só depois liberamos o acesso.
  const HASH_INICIAL = String(location.hash || '');
  let modoRecovery = /type=recovery/.test(HASH_INICIAL) || /[?&]type=recovery/.test(location.search);
  const URL_APP = location.origin + location.pathname;   // usada como redirectTo

  function erro(id, msg){ const el = qs(id); el.textContent = msg || ''; el.hidden = !msg; }

  function pintarIdentidade(email, modo){
    const info = identidade(email);
    const team = info ? info.team : 'vindi';
    const th = THEMES[team];
    gate.style.setProperty('--auth-accent', th.primary);

    const logo = qs('auth-logo'), fb = qs('auth-brand-fallback');
    if(info && th.logo){ logo.src = th.logo; logo.style.display=''; fb.style.display='none'; }
    else { logo.style.display='none'; fb.style.display=''; }

    const box = qs('auth-identity');
    const sep = qs('auth-idsep'), aLab = qs('auth-idarealabel'), aVal = qs('auth-idarea');
    const areaWrap = qs('cad-area-wrap'), locked = qs('cad-area-locked');

    if(!info){ box.hidden = true; areaWrap.hidden = true; locked.hidden = true; return; }

    box.hidden = false;
    qs('auth-idnome').textContent = th.name;
    const areaFix = info.area || VINDI_AREAS[norm(email)] || null;

    if(modo === 'cadastro'){
      if(team === 'vindi' && !areaFix){
        areaWrap.hidden = false; locked.hidden = true;
        const chosen = areaEscolhida;
        sep.hidden = aLab.hidden = aVal.hidden = !chosen;
        if(chosen) aVal.textContent = AREA_LABEL[chosen];
      } else {
        areaWrap.hidden = true; locked.hidden = false;
        locked.innerHTML = (team === 'vindi')
          ? 'Área: <b>'+AREA_LABEL[areaFix]+'</b> · pré-definida para este e-mail Vindi.'
          : 'Área: <b>Comercial</b> · definida automaticamente pelo e-mail <b>@'+dominio(email)+'</b>.';
        sep.hidden = aLab.hidden = aVal.hidden = false;
        aVal.textContent = AREA_LABEL[areaFix];
      }
    } else {
      areaWrap.hidden = true; locked.hidden = true;
      sep.hidden = aLab.hidden = aVal.hidden = true;
    }
  }

  function mostrar(view){
    viewLogin.hidden = view !== 'login';
    viewCad.hidden   = view !== 'cadastro';
    viewReset.hidden = view !== 'reset';
    viewNova.hidden  = view !== 'nova';
    erro('login-erro',''); erro('cad-erro',''); erro('reset-erro',''); erro('nova-erro','');

    const FOCO  = { login:'login-email', cadastro:'cad-nome', reset:'reset-email', nova:'nova-senha' };
    const CAMPO = { login:'login-email', cadastro:'cad-email', reset:'reset-email', nova:null };
    const campo = CAMPO[view];
    pintarIdentidade(campo ? qs(campo).value : '', view === 'cadastro' ? 'cadastro' : 'login');
    setTimeout(()=>{ const f = qs(FOCO[view]); if(f) f.focus(); }, 40);
  }

  function montarCluster(user, admin){
    let cluster = qs('acct-cluster');
    if(!cluster){
      cluster = document.createElement('div');
      cluster.className = 'acct-cluster'; cluster.id = 'acct-cluster';
      cluster.innerHTML =
        '<div class="switch" id="area-switch" hidden>' +
          '<span class="switch-label">Área</span>' +
          '<div class="seg" id="area-seg">' +
            '<button type="button" data-area="comercial">Comercial</button>' +
            '<button type="button" data-area="mesa">Mesa</button>' +
          '</div>' +
        '</div>' +
        '<button class="admin-btn" id="admin-open" type="button" hidden>Admin</button>' +
        '<div class="acct-chip" id="acct-chip">' +
          '<img id="acct-logo" alt="">' +
          '<div class="acct-meta"><span class="acct-nome" id="acct-nome"></span>' +
          '<span class="acct-tag" id="acct-tag"></span></div>' +
          '<button class="acct-logout" id="acct-logout" type="button">Sair</button>' +
        '</div>';
      const bar = document.querySelector('.topbar'); if(bar) bar.appendChild(cluster);
      qs('acct-logout').addEventListener('click', sair);
      qs('admin-open').addEventListener('click', openAdmin);
      qs('area-seg').querySelectorAll('button').forEach(b=>{
        b.addEventListener('click', function(){ setArea(this.dataset.area); });
      });
      const cs = qs('company-seg');
      if(cs) cs.addEventListener('click', function(e){
        if(!e.target.closest('button')) return;
        if(window.giroAuth){ window.giroAuth.team = S.team; document.body.dataset.team = S.team; }
      });
    }
    qs('area-switch').hidden = !admin;
    qs('admin-open').hidden = !admin;

    const th = THEMES[user.team];
    const logo = qs('acct-logo');
    if(!admin && th.logo){ logo.src = th.logo; logo.style.display=''; }
    else logo.style.display='none';
    qs('acct-nome').textContent = user.nome;
    qs('acct-tag').textContent = admin ? 'Admin · acesso total' : (th.name + ' · ' + AREA_LABEL[user.area]);
    setAreaButtons(user.area);
    cluster.style.display = 'flex';
  }

  function setAreaButtons(area){
    const seg = qs('area-seg'); if(!seg) return;
    seg.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b.dataset.area === area));
  }
  function setArea(area){
    if(!window.giroAuth) return;
    window.giroAuth.area = area;
    document.body.dataset.area = area;
    setAreaButtons(area);
    if(window.giroApplyArea) window.giroApplyArea(area);
  }

  function companySwitchEl(){
    const seg = qs('company-seg');
    return seg ? seg.closest('.switch') : null;
  }

  function entrar(user){
    const admin = !!user.admin;
    setTeam(user.team);
    document.body.dataset.team = user.team;
    document.body.dataset.area = user.area;
    document.body.dataset.admin = admin ? '1' : '0';
    window.giroAuth = { id:user.id, nome:user.nome, email:user.email, team:user.team, area:user.area, admin:admin, tipo:user.tipo };

    const cs = companySwitchEl();
    if(cs) cs.style.display = admin ? '' : 'none';

    montarCluster(user, admin);
    if(window.giroApplyArea) window.giroApplyArea(user.area);
    gate.hidden = true;
    document.body.classList.remove('auth-open');
  }

  async function entrarComPerfil(user){
    let perfil = null;
    try {
      const { data } = await db.from('perfis').select('nome,tipo').eq('id', user.id).maybeSingle();
      perfil = data;
    } catch(e){ perfil = null; }
    if(!perfil){
      const info = identidade(user.email) || { team:'vindi' };
      const area = info.area || VINDI_AREAS[norm(user.email)] || 'comercial';
      const tipo = tipoFrom(info.team, area);
      const nome = user.email.split('@')[0];
      try { await db.from('perfis').upsert({ id:user.id, nome, email:user.email, tipo }); } catch(e){}
      perfil = { nome, tipo };
    }
    const d = fromTipo(perfil.tipo, user.email);
    entrar({ id:user.id, nome:perfil.nome, email:user.email, team:d.team, area:d.area, admin:d.admin, tipo:perfil.tipo });
  }

  async function sair(){
    try { await db.auth.signOut(); } catch(e){}
    window.giroAuth = null;
    const cluster = qs('acct-cluster'); if(cluster) cluster.style.display = 'none';
    const cs = companySwitchEl(); if(cs) cs.style.display = '';
    delete document.body.dataset.admin; delete document.body.dataset.area; delete document.body.dataset.team;
    if(window.giroApplyArea) window.giroApplyArea('comercial');
    ['login-email','login-senha','cad-nome','cad-email','cad-senha','cad-senha2',
     'reset-email','nova-senha','nova-senha2'].forEach(id=>{ const el=qs(id); if(el) el.value=''; });
    const rl = qs('reset-locked'); if(rl){ rl.hidden = true; rl.innerHTML = ''; }
    const nq = qs('nova-quem');   if(nq){ nq.hidden = true; nq.innerHTML = ''; }
    areaEscolhida = null;
    document.querySelectorAll('#cad-area-seg button').forEach(b=>b.classList.remove('on'));
    gate.hidden = false;
    document.body.classList.add('auth-open');
    mostrar('login');
  }

  viewCad.addEventListener('submit', async function(e){
    e.preventDefault();
    const nome = qs('cad-nome').value.trim();
    const email = norm(qs('cad-email').value);
    const s1 = qs('cad-senha').value, s2 = qs('cad-senha2').value;

    if(!nome){ erro('cad-erro','Informe seu nome de usuário.'); return; }
    const info = identidade(email);
    if(!info){ erro('cad-erro','E-mail não autorizado. Use @vindi.com.br, @tray.net.br ou @bling.com.br.'); return; }
    const area = resolverArea(email, areaEscolhida);
    if(!area){ erro('cad-erro','Selecione sua área na Vindi (Comercial ou Mesa).'); return; }
    if(s1.length < 6){ erro('cad-erro','A senha deve ter ao menos 6 caracteres.'); return; }
    if(s1 !== s2){ erro('cad-erro','As senhas não coincidem.'); return; }

    erro('cad-erro','Criando cadastro…');
    let res;
    try { res = await db.auth.signUp({ email, password:s1 }); }
    catch(err){ erro('cad-erro', traduzErro(err && err.message)); return; }
    if(res.error){ erro('cad-erro', traduzErro(res.error.message)); return; }

    const tipo = tipoFrom(info.team, area);
    if(res.data && res.data.session){
      try { await db.from('perfis').upsert({ id:res.data.user.id, nome, email, tipo }); } catch(e){}
      erro('cad-erro','');
      entrar({ id:res.data.user.id, nome, email, team:info.team, area, admin:false, tipo });
    } else {
      erro('cad-erro','Cadastro criado! Confirme pelo e-mail que enviamos e depois faça login.');
      mostrar('login');
    }
  });

  viewLogin.addEventListener('submit', async function(e){
    e.preventDefault();
    const email = norm(qs('login-email').value);
    const senha = qs('login-senha').value;
    if(!identidade(email)){ erro('login-erro','E-mail não autorizado. Use @vindi.com.br, @tray.net.br ou @bling.com.br.'); return; }
    erro('login-erro','Entrando…');
    let res;
    try { res = await db.auth.signInWithPassword({ email, password:senha }); }
    catch(err){ erro('login-erro', traduzErro(err && err.message)); return; }
    if(res.error){ erro('login-erro', traduzErro(res.error.message)); return; }
    erro('login-erro','');
    await entrarComPerfil(res.data.user);
  });

  document.querySelectorAll('#cad-area-seg button').forEach(btn=>{
    btn.addEventListener('click', function(){
      areaEscolhida = this.dataset.area;
      document.querySelectorAll('#cad-area-seg button').forEach(b=>b.classList.toggle('on', b===this));
      pintarIdentidade(qs('cad-email').value, 'cadastro');
    });
  });

  qs('cad-email').addEventListener('input', function(){ pintarIdentidade(this.value, 'cadastro'); });
  qs('login-email').addEventListener('input', function(){ pintarIdentidade(this.value, 'login'); });
  qs('to-cadastro').addEventListener('click', function(e){ e.preventDefault(); mostrar('cadastro'); });
  qs('to-login').addEventListener('click', function(e){ e.preventDefault(); mostrar('login'); });

  // ══════════ ETAPA 1: pedir o link de recuperação ══════════
  qs('to-reset').addEventListener('click', function(e){
    e.preventDefault();
    qs('reset-email').value = qs('login-email').value;   // aproveita o que já foi digitado
    mostrar('reset');
  });
  qs('reset-to-login').addEventListener('click', function(e){ e.preventDefault(); mostrar('login'); });
  qs('reset-email').addEventListener('input', function(){ pintarIdentidade(this.value, 'login'); });

  viewReset.addEventListener('submit', async function(e){
    e.preventDefault();
    const email = norm(qs('reset-email').value);
    if(!identidade(email)){ erro('reset-erro','E-mail não autorizado. Use @vindi.com.br, @tray.net.br ou @bling.com.br.'); return; }

    erro('reset-erro','Enviando…');
    try {
      // Por segurança o Supabase NÃO diz se o e-mail existe ou não:
      // a resposta é a mesma para cadastro existente e inexistente.
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: URL_APP });
      if(error) throw error;
    } catch(err){
      const m = String((err && err.message) || '');
      if(/rate limit|too many|security purposes/i.test(m)){
        erro('reset-erro','Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.');
      } else {
        erro('reset-erro', traduzErro(m));
      }
      return;
    }
    erro('reset-erro','');
    const box = qs('reset-locked');
    box.hidden = false;
    box.innerHTML = 'Se existir um cadastro com <b>'+esc(email)+'</b>, o link de recuperação já está na caixa de entrada. '+
                    'Ele expira em 1 hora — confira também o lixo eletrônico.';
  });

  // ══════════ ETAPA 2: definir a nova senha (voltou pelo link) ══════════
  qs('nova-to-login').addEventListener('click', async function(e){
    e.preventDefault();
    modoRecovery = false;
    limparHash();
    try { await db.auth.signOut(); } catch(err){}
    mostrar('login');
  });

  viewNova.addEventListener('submit', async function(e){
    e.preventDefault();
    const s1 = qs('nova-senha').value, s2 = qs('nova-senha2').value;
    if(s1.length < 6){ erro('nova-erro','A senha deve ter ao menos 6 caracteres.'); return; }
    if(s1 !== s2){ erro('nova-erro','As senhas não coincidem.'); return; }

    erro('nova-erro','Salvando…');
    let res;
    // updateUser só funciona porque o link do e-mail criou uma sessão temporária.
    try { res = await db.auth.updateUser({ password:s1 }); }
    catch(err){ erro('nova-erro', traduzErroSenha(err && err.message)); return; }
    if(res.error){ erro('nova-erro', traduzErroSenha(res.error.message)); return; }

    erro('nova-erro','');
    modoRecovery = false;
    limparHash();
    qs('nova-senha').value = qs('nova-senha2').value = '';
    await entrarComPerfil(res.data.user);
  });

  function traduzErroSenha(msg){
    msg = String(msg||'');
    if(/session|not authenticated|JWT|expired|invalid/i.test(msg))
      return 'O link de recuperação expirou ou já foi usado. Peça um novo em "Esqueci minha senha".';
    if(/should be different|same as the old/i.test(msg)) return 'A nova senha precisa ser diferente da anterior.';
    return traduzErro(msg);
  }

  // Limpa o token da barra de endereço (evita reaproveitamento e link "sujo").
  function limparHash(){
    try { history.replaceState(null, '', URL_APP); } catch(err){ location.hash = ''; }
  }

  function abrirNovaSenha(user){
    modoRecovery = true;
    gate.hidden = false;
    document.body.classList.add('auth-open');
    pintarIdentidade((user && user.email) || '', 'login');
    const quem = qs('nova-quem');
    if(user && user.email){
      quem.hidden = false;
      quem.innerHTML = 'Definindo nova senha para <b>'+esc(user.email)+'</b>.';
    } else { quem.hidden = true; }
    mostrar('nova');
  }

  // O SDK dispara PASSWORD_RECOVERY ao ler o token do link no endereço.
  db.auth.onAuthStateChange(function(event, session){
    if(event === 'PASSWORD_RECOVERY'){ abrirNovaSenha(session && session.user); }
  });

  // ── Painel de administração (lê a tabela "perfis") ──
  function openAdmin(){
    if(!window.giroAuth || !window.giroAuth.admin) return;
    renderAdmin();
    qs('admin-panel').style.display = 'flex';
  }
  function closeAdmin(){
    qs('admin-panel').style.display = 'none';
    qs('admin-add-erro').hidden = true;
    qs('admin-add-email').value = '';
  }
  function adminErro(msg){ const el = qs('admin-add-erro'); el.textContent = msg; el.hidden = !msg; }

  async function renderAdmin(){
    let arr = [];
    try {
      const { data } = await db.from('perfis').select('id,nome,email,tipo').order('nome');
      arr = data || [];
    } catch(e){ arr = []; }

    const admins = arr.filter(p=>p.tipo==='adm');
    qs('admin-list').innerHTML = admins.length ? admins.map(p=>(
      '<div class="adm-row"><div class="adm-info"><span class="adm-email">'+esc(p.email)+'</span><span class="adm-sub">'+esc(p.nome||'')+'</span></div>'+
      '<div class="adm-act"><button class="mini-btn danger" data-act="demote" data-email="'+esc(p.email)+'">Tirar admin</button></div></div>'
    )).join('') : '<div class="admin-empty">Nenhum administrador.</div>';

    qs('admin-users').innerHTML = arr.length ? arr.map(p=>{
      const d = fromTipo(p.tipo, p.email); const th = THEMES[d.team];
      const adm = p.tipo==='adm';
      const tag = (th?th.name:'—') + ' · ' + (adm ? 'Admin' : (AREA_LABEL[d.area]||''));
      const btn = adm
        ? '<button class="mini-btn danger" data-act="demote" data-email="'+esc(p.email)+'">Tirar admin</button>'
        : '<button class="mini-btn accent" data-act="promote" data-email="'+esc(p.email)+'">Tornar admin</button>';
      return '<div class="adm-row"><div class="adm-info"><span class="adm-email">'+esc(p.nome||p.email)+'</span><span class="adm-sub">'+esc(p.email)+' · '+esc(tag)+'</span></div><div class="adm-act">'+btn+'</div></div>';
    }).join('') : '<div class="admin-empty">Ninguém cadastrado ainda.</div>';
  }

  async function setAdmin(email, makeAdmin){
    email = norm(email);
    let p = null;
    try { const { data } = await db.from('perfis').select('id,email,tipo').eq('email', email).maybeSingle(); p = data; }
    catch(e){ p = null; }
    if(!p){ adminErro('Essa pessoa ainda não tem cadastro.'); return; }
    let tipo;
    if(makeAdmin) tipo = 'adm';
    else { const info = identidade(email) || {team:'vindi'}; tipo = tipoFrom(info.team, info.area || 'comercial'); }
    const { error } = await db.from('perfis').update({ tipo }).eq('id', p.id);
    if(error){ adminErro('Não foi possível atualizar (você precisa ser admin).'); return; }
    adminErro(''); renderAdmin();
  }

  async function addAdmin(){
    const email = norm(qs('admin-add-email').value);
    if(!email){ adminErro('Informe um e-mail.'); return; }
    if(!identidade(email)){ adminErro('E-mail não autorizado. Use @vindi.com.br, @tray.net.br ou @bling.com.br.'); return; }
    await setAdmin(email, true);
    qs('admin-add-email').value = '';
  }

  qs('admin-close').addEventListener('click', closeAdmin);
  qs('admin-add-btn').addEventListener('click', addAdmin);
  qs('admin-add-email').addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); addAdmin(); } });
  qs('admin-panel').addEventListener('click', function(e){
    if(e.target === this){ closeAdmin(); return; }
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const act = btn.dataset.act, email = btn.dataset.email;
    if(act === 'promote') setAdmin(email, true);
    else if(act === 'demote') setAdmin(email, false);
  });

  qs('auth-foot').textContent = 'Acesso protegido · seus dados ficam salvos com segurança na nuvem.';

  (async function init(){
    document.body.classList.add('auth-open');
    let session = null;
    try { const { data } = await db.auth.getSession(); session = data ? data.session : null; }
    catch(e){ session = null; }

    // Veio do link do e-mail: NÃO entra no app, pede a nova senha primeiro.
    if(modoRecovery){
      abrirNovaSenha(session && session.user);
      return;
    }
    if(session && session.user){
      await entrarComPerfil(session.user);
      return;
    }
    gate.hidden = false;
    mostrar('login');
  })();
})();
