// ════════════════ LOGOS (base64) ════════════════
const LOGO_DARK  = LOGOS.LOGO_DARK;
const LOGO_WHITE = LOGOS.LOGO_WHITE;
const LOGO_SYM   = LOGOS.LOGO_SYM;

// ════════════════ TEMAS POR EMPRESA ════════════════
const BLING_LOGO  = LOGOS.BLING_LOGO;
const BLING_WHITE = LOGOS.BLING_WHITE;
const TRAY_LOGO   = LOGOS.TRAY_LOGO;
const TRAY_WHITE  = LOGOS.TRAY_WHITE;

const THEMES = {
  vindi:{
    name:'Vindi', ready:true,
    bg:'#FDFDFD', line:'#E0E2EB', header:'#F5F6FA',
    primary:'#0064FA', primaryDeep:'#294AE0', secondary:'#08B5FF', secondarySoft:'#3DC5FF',
    ink:'#0A0F1F', muted:'#6B7184',
    primaryRgb:[0,100,250], secondaryRgb:[8,181,255],
    fontTitle:"'Zalando Sans','Sora',system-ui,sans-serif", fontBody:"'Sora',system-ui,sans-serif", titleWeight:600,
    logo:LOGO_DARK, logoWhite:LOGO_WHITE, symbol:LOGO_SYM, logoWhiteAR:3.387
  },
  // Identidade oficial. Fontes comerciais (Gilroy/Diodrum) entram via kit licenciado; fallback livre enquanto isso.
  bling:{
    name:'Bling', ready:true,
    bg:'#FDFDFD', line:'#B8F2CD', header:'#8BE0AA',
    primary:'#34AD61', primaryDeep:'#2A8F50', secondary:'#12B842', secondarySoft:'#7ED9A0',
    ink:'#0E2118', muted:'#3F5C4A',
    primaryRgb:[52,173,97], secondaryRgb:[18,184,66],
    fontTitle:"'Gilroy','Poppins',system-ui,sans-serif", fontBody:"'Gilroy','Poppins',system-ui,sans-serif", titleWeight:900,
    logo:BLING_LOGO, logoWhite:BLING_WHITE, symbol:BLING_LOGO, logoWhiteAR:2.065
  },
  tray:{
    name:'Tray', ready:true,
    bg:'#FDFDFD', line:'#ECF5FB', header:'#ECF5FB',
    primary:'#252D69', primaryDeep:'#00012A', secondary:'#00A0DC', secondarySoft:'#6FC3E8',
    ink:'#0B0F2A', muted:'#6A7392',
    primaryRgb:[37,45,105], secondaryRgb:[0,160,220],
    fontTitle:"'Diodrum','Satoshi',system-ui,sans-serif", fontBody:"'Satoshi',system-ui,sans-serif", titleWeight:600,
    logo:TRAY_LOGO, logoWhite:TRAY_WHITE, symbol:TRAY_LOGO, logoWhiteAR:1.880
  }
};

// ════════════════ CONSTANTES (espelhadas da planilha) ════════════════
const PLANOS = {
  90:  { dc_amort:60,  du_amort:41  },
  120: { dc_amort:90,  du_amort:62  },
  150: { dc_amort:120, du_amort:82  },
  180: { dc_amort:150, du_amort:103 }
};
const IOF_FIXO = 0.0038;
const IOF_DIA  = 0.000082;
function calcIOF(liberado, prazo){
  const taxa_iof = IOF_FIXO + IOF_DIA * prazo;
  const principal = liberado / (1 - taxa_iof);
  return principal - liberado;
}
const CARENCIA_PADRAO = 30;   // carência padrão, em dias corridos

// ════════════════ AJUSTES PROTEGIDOS POR SENHA ════════════════
// ┌──────────────────────────────────────────────────────────┐
// │  TROQUE A SENHA ABAIXO pela que você quiser usar.          │
// └──────────────────────────────────────────────────────────┘
const SENHA_AJUSTES = 'giro@2026';
let ajustesLiberados = false;

// ════════════════ ESTADO ════════════════
const S = { team:'vindi', prazo:150, carencia:CARENCIA_PADRAO, cmpPrazos:[], cmpValues:{},
            pdfInclude:{ taxa:true, cetAm:true, cetAa:true }, descIncluiContrato:true };

// ════════════════ HELPERS ════════════════
const fmt    = v => 'R$ ' + (+v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtPct = v => (+v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const fmtN   = v => (+v).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0});
const $      = id => document.getElementById(id);

function calcPlano(liberado, taxaMes, prazo){
  const pl        = PLANOS[prazo];
  const iof       = calcIOF(liberado, prazo);
  const principal = liberado + iof;
  const meses     = prazo / 30;
  const total     = principal * Math.pow(1 + taxaMes/100, meses);
  const juros     = total - liberado;
  const cetAm     = (Math.pow(total/liberado, 1/meses) - 1) * 100;
  const cetDia    = (Math.pow(total/liberado, 1/prazo)  - 1);
  const cetAa     = (Math.pow(1 + cetDia, 365) - 1) * 100;
  const retDC     = total / pl.dc_amort;
  const retDU     = total / pl.du_amort;
  return { liberado, iof, principal, taxaMes, prazo, meses, total, juros, cetAm, cetAa, retDC, retDU, pl };
}
function zeroPlano(taxaMes, prazo){
  const pl = PLANOS[prazo];
  return { liberado:0, iof:0, principal:0, taxaMes, prazo, meses:prazo/30,
           total:0, juros:0, cetAm:0, cetAa:0, retDC:0, retDU:0, pl };
}

// ════════════════ TEMA ════════════════
function applyTheme(t){
  const th = THEMES[t]; const r = document.documentElement.style;
  r.setProperty('--bg',th.bg);
  r.setProperty('--line',th.line);
  r.setProperty('--header',th.header);
  r.setProperty('--primary',th.primary);
  r.setProperty('--primary-deep',th.primaryDeep);
  r.setProperty('--secondary',th.secondary);
  r.setProperty('--secondary-soft',th.secondarySoft);
  r.setProperty('--ink',th.ink);
  r.setProperty('--muted',th.muted);
  r.setProperty('--title', th.fontTitle);
  r.setProperty('--body', th.fontBody);
  r.setProperty('--title-weight', th.titleWeight);

  const logo = $('brand-logo'), fb = $('brand-fallback'), mark = $('hero-mark');
  if(th.logo){ logo.src=th.logo; logo.style.display=''; fb.style.display='none'; }
  else { logo.style.display='none'; fb.style.display=''; fb.textContent=th.name; }
  if(th.symbol){ mark.src=th.symbol; mark.style.display=''; } else { mark.style.display='none'; }

  $('theme-banner').style.display = th.ready ? 'none' : '';
  $('theme-banner-name').textContent = th.name;
}
function setTeam(t){
  S.team = t;
  document.querySelectorAll('#company-seg button').forEach(b=>b.classList.toggle('on', b.dataset.team===t));
  applyTheme(t);
}

function setPrazo(p, btn){
  S.prazo = p;
  document.querySelectorAll('#prazo-pills .pill').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  calcContrato();
}

// ════════════════ AJUSTES PROTEGIDOS ════════════════
function setCarencia(v){
  let n = parseInt(v, 10);
  if(isNaN(n) || n < 0) n = 0;
  if(n > 120) n = 120;
  S.carencia = n;
  const r = $('s-range');
  r.min = String(n + 1);
  if(parseInt(r.value, 10) < n + 1){ r.value = n + 1; $('s-val').textContent = (n + 1) + ' dias'; }
  const hint = $('s-carencia-hint');
  if(hint) hint.textContent = `(inclui ${n}d de carência — mín. ${n + 1})`;
  calcContrato();
}
function abrirModalAjustes(){
  if(ajustesLiberados){ bloquearAjustes(); return; }   // já liberado → re-bloqueia
  $('modal-ajustes').style.display = 'flex';
  $('modal-senha').value = '';
  $('modal-erro').style.display = 'none';
  setTimeout(()=>$('modal-senha').focus(), 60);
}
function fecharModalAjustes(){ $('modal-ajustes').style.display = 'none'; }
function confirmarSenha(){
  if($('modal-senha').value === SENHA_AJUSTES){ liberarAjustes(); fecharModalAjustes(); }
  else { $('modal-erro').style.display = ''; $('modal-senha').select(); }
}
function liberarAjustes(){
  ajustesLiberados = true;
  const opt = $('opt-taxa-25'); opt.hidden = false; opt.disabled = false;
  $('c-carencia').disabled = false;
  $('field-carencia').classList.add('liberado');
  $('field-taxa').classList.add('liberado');
  $('btn-ajustes').classList.add('on');
  $('btn-ajustes-txt').textContent = 'Ajustes liberados';
}
function bloquearAjustes(){
  ajustesLiberados = false;
  const opt = $('opt-taxa-25'); opt.hidden = true; opt.disabled = true;
  if($('c-taxa').value === '2.5'){ $('c-taxa').value = '3.0'; }   // volta a uma taxa padrão
  const cc = $('c-carencia'); cc.value = CARENCIA_PADRAO; cc.disabled = true;
  $('field-carencia').classList.remove('liberado');
  $('field-taxa').classList.remove('liberado');
  $('btn-ajustes').classList.remove('on');
  $('btn-ajustes-txt').textContent = 'Ajustes avançados';
  setCarencia(CARENCIA_PADRAO);   // recalcula tudo no padrão
}

// ════════════════ BLOCO 1 — CONTRATO (sempre visível, zerado) ════════════════
function calcContrato(){
  const lib  = parseFloat($('c-liberado').value) || 0;
  const taxa = parseFloat($('c-taxa').value)     || 5.0;
  const has  = lib > 0;
  const d    = has ? calcPlano(lib, taxa, S.prazo) : zeroPlano(taxa, S.prazo);
  S._contrato = has ? d : null;

  $('hl-lib').textContent     = fmt(d.liberado);
  $('hl-taxa').textContent    = fmtPct(taxa);
  $('hl-prazo').textContent   = d.prazo + ' dias';
  $('hl-tot').textContent     = fmt(d.total);
  $('hl-tot-sub').textContent = `Custo total: ${fmt(d.juros + d.iof)}`;

  $('c-chips').innerHTML = `
    <span class="chip accent">${d.prazo} dias</span>
    <span class="chip">Taxa ${taxa.toFixed(1).replace('.',',')}% ao mês</span>
    <span class="chip">Imposto ${fmt(d.iof)}</span>
    <span class="chip">Carência ${S.carencia}d</span>
    <span class="chip">Amort. ${d.pl.dc_amort}d corridos</span>`;

  $('rc-principal').textContent = fmt(d.principal);
  $('rc-iof').textContent       = `Imposto (IOF): ${fmt(d.iof)}`;
  $('rc-juros').textContent     = fmt(d.juros);
  $('rc-cetaa').textContent     = fmtPct(d.cetAa);
  $('rc-cetam').textContent     = fmtPct(d.cetAm);
  $('rc-amort').textContent     = d.pl.dc_amort + ' dias';
  $('rc-car').textContent       = S.carencia + ' dias';

  // Propaga p/ desconto somente com contrato real
  if(has){
    if(!$('d-lib').value || $('d-lib').dataset.auto === '1'){ $('d-lib').value = lib.toFixed(2); $('d-lib').dataset.auto = '1'; }
    if(!$('d-dvt').value || $('d-dvt').dataset.auto === '1'){ $('d-dvt').value = d.total.toFixed(2); $('d-dvt').dataset.auto = '1'; }
    $('d-plano-hint').style.display = '';
    $('d-plano-desc').textContent = `${d.prazo} dias · Liberado ${fmt(d.liberado)} · Total ${fmt(d.total)}`;
    S.cmpPrazos.forEach(p => { if(!(p in S.cmpValues) || S.cmpValues[p] === S._lastSeed) S.cmpValues[p] = lib; });
    S._lastSeed = lib;
  } else {
    $('d-plano-hint').style.display = 'none';
  }

  calcDesconto();
  renderCmp();
  calcSim();
}

// ════════════════ COMPARADOR ════════════════
// A grade antiga (só por prazo) foi substituída pelo comparador v3, que roda em
// módulo próprio no fim do arquivo. Estes stubs existem porque calcContrato()
// ainda chama renderCmp() no fim de cada recálculo.
function renderCmp(){ if(window.cmp3 && window.cmp3.render) window.cmp3.render(); }
function refreshCmp(){ renderCmp(); }

// ════════════════ BLOCO 2 — DESCONTO (sempre visível, zerado) ════════════════
function simulaDesconto(principal, taxaMes, diasCarencia, vrd, dvt){
  const taxa_dia = Math.pow(1 + taxaMes, 1/30) - 1;
  let saldo_pr = principal, saldo_jr = 0;
  for(let i=0;i<diasCarencia;i++) saldo_jr += saldo_pr * taxa_dia;
  let total_pago = 0, dias = 0;
  while((saldo_pr + saldo_jr) > 0.005 && dias < 1500){
    dias++;
    saldo_jr += saldo_pr * taxa_dia;
    let pag = Math.min(vrd, saldo_pr + saldo_jr);
    const pag_jr = Math.min(pag, saldo_jr); pag -= pag_jr;
    const pag_pr = Math.min(pag, saldo_pr);
    saldo_jr -= pag_jr; saldo_pr -= pag_pr;
    total_pago += (pag_jr + pag_pr);
    if(saldo_pr < 0.005 && saldo_jr < 0.005) break;
  }
  return { dias_amort: dias, total_pago, saldo_final: saldo_pr + saldo_jr };
}
function zerosDesconto(){
  $('d-hl-dvt').textContent='R$ 0,00'; $('d-prazo').textContent='R$ 0,00';
  $('d-prazo-sub').textContent='Com desconto'; $('d-desconto').textContent='R$ 0,00';
  $('d-desconto-sub').textContent='Economia do cliente'; $('d-dias-quit').textContent='0 dias';
  $('d-dias-quit-sub').textContent='dias corridos (incl. carência)'; $('d-val-pago').textContent='R$ 0,00';
  $('d-val-pago-sub').textContent='—'; $('d-vrd-exib').textContent='R$ 0,00'; $('d-vrd-du-exib').textContent='R$ 0,00';
  S._desconto = null;
}
function calcDesconto(){
  const fat = parseFloat($('d-fat').value) || 0;
  const ret = parseFloat($('d-ret').value) || 0;
  const lib = parseFloat($('d-lib').value) || 0;
  const dvt = parseFloat($('d-dvt').value) || 0;
  if(!fat || !ret || !lib || !dvt){ zerosDesconto(); return; }

  const taxaMes  = S._contrato ? S._contrato.taxaMes / 100 : 0.05;
  const taxa_dia = Math.pow(1 + taxaMes, 1/30) - 1;
  const vrd    = (fat / 30) * (ret / 100);
  const vrd_du = (fat / 22) * (ret / 100);
  const prazo     = S._contrato ? S._contrato.prazo : 180;
  const principal = S._contrato ? S._contrato.principal : lib / (1 - (0.0038 + 0.000082 * prazo));
  const saldo_d30 = principal * Math.pow(1 + taxa_dia, S.carencia);
  if(vrd <= 0 || vrd <= saldo_d30 * taxa_dia){ zerosDesconto(); return; }

  const nper_exato = Math.log(vrd / (vrd - saldo_d30 * taxa_dia)) / Math.log(1 + taxa_dia);
  const tempo      = Math.ceil(nper_exato) + S.carencia;
  const sim        = simulaDesconto(principal, taxaMes, S.carencia, vrd, dvt);
  const val_pago   = sim.total_pago;
  const desconto   = dvt - val_pago;

  const step = vrd * 0.05; const faixa = [];
  for(let dd=-2; dd<=2; dd++){
    const vrd_f = vrd + dd * step;
    if(vrd_f <= saldo_d30 * taxa_dia) continue;
    const n_f = Math.log(vrd_f / (vrd_f - saldo_d30 * taxa_dia)) / Math.log(1 + taxa_dia);
    const t_f = Math.ceil(n_f) + S.carencia;
    const sim_f = simulaDesconto(principal, taxaMes, S.carencia, vrd_f, dvt);
    faixa.push({ delta:dd, tempo:t_f, pago:sim_f.total_pago, desc:dvt - sim_f.total_pago, isBase:dd===0 });
  }

  $('d-hl-dvt').textContent       = fmt(dvt);
  $('d-prazo').textContent        = fmt(val_pago);
  $('d-prazo-sub').textContent    = `Com desconto — ~${fmtN(tempo)} dias`;
  $('d-desconto').textContent     = fmt(Math.max(0, desconto));
  $('d-desconto-sub').textContent = `${fmt(dvt)} − ${fmt(val_pago)}`;
  $('d-dias-quit').textContent    = `~${fmtN(tempo)} dias`;
  $('d-dias-quit-sub').textContent= `${nper_exato.toFixed(1)} dias de pagamento + ${S.carencia}d carência`;
  $('d-val-pago').textContent     = fmt(val_pago);
  $('d-val-pago-sub').textContent = `${sim.dias_amort} dias × ${fmt(vrd)}/dia (aprox.)`;
  $('d-vrd-exib').textContent     = fmt(vrd) + '/dia';
  $('d-vrd-du-exib').textContent  = fmt(vrd_du) + '/dia útil';

  S._desconto = { fat, ret, lib, dvt, vrd, vrd_du, vrd_exib:vrd, taxa_dia, prazo, vp:principal,
                  saldo_d30, nper_exato, tempo, val_pago, desconto, faixa, taxaMes };
}

// ════════════════ BLOCO 3 — SIMULADOR DE PRAZO ════════════════
function pmtAnuidade(pv, taxa, n){ if(n <= 0) return pv; return pv * (taxa * Math.pow(1+taxa, n)) / (Math.pow(1+taxa, n) - 1); }
function simulaQuitacao(principal, taxa_dia, dias_carencia, dias_amort, vrd){
  let saldo = principal;
  for(let i=0;i<dias_carencia;i++) saldo *= (1 + taxa_dia);
  let total = 0;
  for(let i=0;i<dias_amort;i++){ saldo *= (1 + taxa_dia); const pag = Math.min(vrd, saldo); saldo -= pag; total += pag; }
  return { total, saldo };
}
function zerosSim(){
  $('s-dias-amort').textContent='0 dias'; $('s-dias-sub').textContent='—';
  $('s-vrd').textContent='R$ 0,00'; $('s-vp-desc').textContent='R$ 0,00'; $('s-vp-sub').textContent='—';
  $('s-saldo').textContent='R$ 0,00'; $('s-desc-nom').textContent='R$ 0,00'; $('s-vrd-mes').textContent='R$ 0,00';
  S._sim=null;
}
function calcSim(){
  const c = S._contrato;
  if(!c){ $('s-contrato-hint').style.display=''; zerosSim(); return; }
  $('s-contrato-hint').style.display='none';

  const range = $('s-range');
  range.min = String(S.carencia + 1);
  range.max = c.prazo;
  if(parseInt(range.value) > c.prazo){ range.value = c.prazo; $('s-val').textContent = c.prazo + ' dias'; }
  if(parseInt(range.value) < S.carencia + 1){ range.value = S.carencia + 1; $('s-val').textContent = (S.carencia + 1) + ' dias'; }

  const prazo_esc  = parseInt(range.value);
  const taxaMes    = c.taxaMes / 100;
  const taxa_dia   = Math.pow(1 + taxaMes, 1/30) - 1;
  const dias_amort = prazo_esc - S.carencia;
  const principal  = c.principal;
  const saldo_d30  = principal * Math.pow(1 + taxa_dia, S.carencia);
  const vrd        = pmtAnuidade(saldo_d30, taxa_dia, dias_amort);
  const vrd_mes    = vrd * 30;
  const sim        = simulaQuitacao(principal, taxa_dia, S.carencia, dias_amort, vrd);
  const total_pago = sim.total;
  const desc_nom   = c.total - total_pago;
  const vp_desc    = desc_nom / Math.pow(1 + taxa_dia, prazo_esc);

  $('s-dias-amort').textContent = `${dias_amort} dias`;
  $('s-dias-sub').textContent   = `${prazo_esc}d total − ${S.carencia}d carência`;
  $('s-vrd').textContent        = fmt(vrd) + '/dia';
  $('s-vp-desc').textContent    = fmt(Math.max(0, desc_nom));
  $('s-vp-sub').textContent     = `Valor de hoje: ${fmt(Math.max(0, vp_desc))}`;
  $('s-saldo').textContent      = fmt(total_pago);
  $('s-desc-nom').textContent   = fmt(Math.max(0, desc_nom));
  $('s-vrd-mes').textContent    = fmt(vrd_mes);

  S._sim = { prazo:prazo_esc, dias_amort, prazo_contrato:c.prazo, lib:c.liberado, principal,
             dvt:c.total, taxaMes, taxa_dia, saldo_d30, total_pago, vrd, vrd_mes, desc_nom, vp_desc };
}

// ════════════════ PDF (logo + cores da empresa) ════════════════
function renderPagina(doc, tipo){
  const th = THEMES[S.team];
  const W=210, H=297, M=16, CW=W-2*M;
  const c=th.primaryRgb, c2=th.secondaryRgb;
  const now = new Date().toLocaleDateString('pt-BR');
  const hx = h => { h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
  const cd=hx(th.primaryDeep), ink=hx(th.ink), muted=hx(th.muted);
  const op = a => { try{ doc.setGState(new doc.GState({opacity:a})); }catch(e){} };
  function gradH(x,y,w,h,a,b){ const n=Math.max(28,Math.ceil(w)), sw=w/n;
    for(let i=0;i<n;i++){ const t=i/(n-1);
      doc.setFillColor(Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t));
      doc.rect(x+i*sw,y,sw+0.5,h,'F'); } }
  function accent(x,y,w){ gradH(x,y,w,2.1,c,c2); }
  function section(title,y){
    doc.setFont('helvetica','bold'); doc.setFontSize(12.5); doc.setTextColor(ink[0],ink[1],ink[2]);
    doc.text(title,M,y); accent(M,y+2.6,15); return y+9.5;
  }
  function row(label,value,y,hl){
    const rh=8.1;
    if(hl){ doc.setFillColor(c[0],c[1],c[2]); op(0.07);
      doc.roundedRect(M-2.5,y-4.7,CW+5,rh,1.6,1.6,'F'); op(1); }
    doc.setFont('helvetica','normal'); doc.setFontSize(8.1); doc.setTextColor(muted[0],muted[1],muted[2]);
    doc.setCharSpace(0.25); doc.text(String(label).toUpperCase(),M,y); doc.setCharSpace(0);
    doc.setFont('helvetica','bold'); doc.setFontSize(hl?10.8:10);
    if(hl) doc.setTextColor(c[0],c[1],c[2]); else doc.setTextColor(ink[0],ink[1],ink[2]);
    doc.text(String(value),W-M,y,{align:'right'});
    if(!hl){ doc.setDrawColor(228,230,238); doc.setLineWidth(0.2); doc.line(M,y+3,W-M,y+3); }
    return y+rh;
  }
  function stats(items,y){
    const n=items.length, gap=6, cw=(CW-(n-1)*gap)/n, hh=25;
    items.forEach((it,i)=>{
      const x=M+i*(cw+gap);
      if(it.hero){
        doc.setFillColor(c[0],c[1],c[2]); doc.roundedRect(x,y,cw,hh,2.6,2.6,'F');
        op(0.13); doc.setFillColor(255,255,255); doc.circle(x+cw-3,y-1,15,'F'); op(1);
        op(0.82); doc.setFont('helvetica','normal'); doc.setFontSize(7.4); doc.setTextColor(255,255,255);
        doc.setCharSpace(0.3); doc.text(it.label.toUpperCase(),x+5,y+8.4); doc.setCharSpace(0); op(1);
        doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(255,255,255);
        doc.text(String(it.value),x+5,y+18.5);
      } else {
        doc.setFillColor(255,255,255); doc.setDrawColor(224,226,235); doc.setLineWidth(0.4);
        doc.roundedRect(x,y,cw,hh,2.6,2.6,'FD'); doc.setLineWidth(0.2);
        doc.setFont('helvetica','normal'); doc.setFontSize(7.4); doc.setTextColor(muted[0],muted[1],muted[2]);
        doc.setCharSpace(0.3); doc.text(it.label.toUpperCase(),x+5,y+8.4); doc.setCharSpace(0);
        doc.setFont('helvetica','bold'); doc.setFontSize(14.5); doc.setTextColor(ink[0],ink[1],ink[2]);
        doc.text(String(it.value),x+5,y+18.5);
      }
    });
    return y+hh+8;
  }

  // ---------- HEADER ----------
  const HH=46;
  gradH(0,0,W,HH,c,cd);
  op(0.12); doc.setFillColor(255,255,255); doc.circle(W-6,-4,30,'F'); op(1);
  if(th.logoWhite){ try{ const lw=(th.logoWhiteAR||3.387)*12.4; doc.addImage(th.logoWhite,'PNG',M,13.5,lw,12.4); }
    catch(e){ doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(255,255,255); doc.text(th.name,M,24); } }
  else { doc.setFont('helvetica','bold'); doc.setFontSize(20); doc.setTextColor(255,255,255); doc.text(th.name,M,24); }
  const titulos = { contrato:'Detalhes do contrato', comparar:'Comparativo de planos', desconto:'Simulação de desconto', simulador:'Simulador de prazo' };
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.text('Giro Rápido', W-M, 19.5, {align:'right'});
  op(0.92); doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(titulos[tipo], W-M, 27, {align:'right'});
  op(0.72); doc.setFontSize(8.4); doc.text('Emitido em '+now, W-M, 33.5, {align:'right'}); op(1);

  let y=60; doc.setTextColor(30,30,40);

  if(tipo==='contrato' && S._contrato){
    const d=S._contrato;
    y=stats([{hero:true,label:'Valor liberado',value:fmt(d.liberado)},
             {label:'Vencimento',value:d.prazo+' dias'},
             {label:'Carência',value:S.carencia+' dias'}],y);
    y=section('Condições',y);
    y=row('Prazo total',d.prazo+' dias',y);
    y=row('Carência',S.carencia+' dias corridos',y);
    y=row('Tempo de pagamento',d.pl.dc_amort+' dias corridos',y);
    if(S.pdfInclude.taxa) y=row('Taxa mensal',fmtPct(d.taxaMes),y);
    y+=6; y=section('Financeiro',y);
    y=row('Valor liberado',fmt(d.liberado),y);
    y=row('Imposto (IOF)',fmt(d.iof),y);
    y=row('Valor financiado',fmt(d.principal),y);
    y=row('Valor dos juros',fmt(d.juros),y);
    y=row('Valor total do contrato',fmt(d.total),y,true);
    if(S.pdfInclude.cetAm || S.pdfInclude.cetAa){
      y+=6; y=section('Custo Efetivo Total — CET',y);
      if(S.pdfInclude.cetAm) y=row('CET ao mês',fmtPct(d.cetAm),y,true);
      if(S.pdfInclude.cetAa) y=row('CET ao ano',fmtPct(d.cetAa),y,true);
    }

  } else if(tipo==='comparar' && S._comparar){
    const {rows,taxa}=S._comparar;
    if(!rows || rows.length===0){
      y=section('Comparativo de planos',y);
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(110,110,125);
      doc.text('Selecione ao menos 2 planos com valor liberado.',M,y);
    } else {
      const n=rows.length, gap=3.5, cardW=(CW-(n-1)*gap)/n, top=y, cardH=90, pad=3.2;
      const maxLib=Math.max(...rows.map(d=>d.liberado));
      const linhas=(d)=>[
        ['TOTAL DO CONTRATO', fmt(d.total), true],['VALOR FINANCIADO', fmt(d.principal), false],
        ['IMPOSTO (IOF)', fmt(d.iof), false],['JUROS', fmt(d.juros), false],
        S.pdfInclude.taxa  ? ['TAXA', fmtPct(taxa), false] : null,
        S.pdfInclude.cetAm ? ['CET AO MÊS', fmtPct(d.cetAm), false] : null,
        S.pdfInclude.cetAa ? ['CET AO ANO', fmtPct(d.cetAa), false] : null,
        ['CARÊNCIA', S.carencia+' dias', false],['TEMPO DE PAGAMENTO', d.pl.dc_amort+' dias', false]
      ].filter(Boolean);
      rows.forEach((d,i)=>{
        const x=M+i*(cardW+gap); const isMax=d.liberado===maxLib; const innerX=x+pad, innerW=cardW-pad*2;
        doc.setFillColor(255,255,255);
        if(isMax){ doc.setDrawColor(c[0],c[1],c[2]); doc.setLineWidth(0.7); } else { doc.setDrawColor(224,226,235); doc.setLineWidth(0.4); }
        doc.roundedRect(x,top,cardW,cardH,2.6,2.6,'FD'); doc.setLineWidth(0.2);
        const bandX=x+0.8,bandY=top+0.8,bandW=cardW-1.6,bandH=11;
        doc.setFillColor(247,248,250); doc.rect(bandX,bandY,bandW,bandH,'F');
        doc.setDrawColor(224,226,235); doc.line(bandX,bandY+bandH,bandX+bandW,bandY+bandH);
        doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(ink[0],ink[1],ink[2]);
        doc.text(`${d.prazo} dias`, innerX, top+7.4);
        if(isMax){ doc.setFont('helvetica','bold'); doc.setFontSize(5.2);
          const bt='MAIOR LIMITE', bw=doc.getTextWidth(bt)+5, bhh=5.4, bx=x+cardW-pad-bw, byy=top+2.4;
          doc.setFillColor(c[0],c[1],c[2]); doc.roundedRect(bx,byy,bw,bhh,1.4,1.4,'F');
          doc.setTextColor(255,255,255); doc.text(bt,bx+bw/2,byy+3.7,{align:'center'}); }
        const ry=top+bandH+0.8;
        doc.setFont('helvetica','normal'); doc.setFontSize(5.4); doc.setTextColor(120,120,135);
        doc.text('VALOR LIBERADO', innerX, ry+4);
        const boxY=ry+5.6, boxH=8.4;
        doc.setDrawColor(210,214,224); doc.setLineWidth(0.35); doc.roundedRect(innerX,boxY,innerW,boxH,1.5,1.5,'S'); doc.setLineWidth(0.2);
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(c[0],c[1],c[2]);
        doc.text(fmt(d.liberado), innerX+2.8, boxY+5.6);
        let rowY=boxY+boxH+5.4; const rowH=5.9;
        linhas(d).forEach(([lbl,val,hl])=>{
          if(hl){ doc.setFillColor(c[0],c[1],c[2]); op(0.09); doc.rect(innerX-1,rowY-3.6,innerW+2,rowH,'F'); op(1); }
          doc.setFont('helvetica','normal'); doc.setFontSize(5.4); doc.setTextColor(120,120,135); doc.text(lbl,innerX,rowY);
          doc.setFont('helvetica','bold');
          if(hl){ doc.setFontSize(7.4); doc.setTextColor(c[0],c[1],c[2]); } else { doc.setFontSize(6.8); doc.setTextColor(35,35,45); }
          doc.text(String(val),x+cardW-pad,rowY,{align:'right'});
          doc.setDrawColor(233,235,241); doc.line(innerX,rowY+2.3,x+cardW-pad,rowY+2.3); rowY+=rowH;
        });
      });
      y=top+cardH+10;
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(110,110,125);
      doc.text(`Taxa aplicada: ${fmtPct(taxa)}  ·  Carência: ${S.carencia} dias corridos (todos os planos).`, M, y);
      doc.setTextColor(30,30,40);
    }

  } else if(tipo==='desconto' && S._desconto){
    const d=S._desconto;
    y=stats([{hero:true,label:'Desconto obtido',value:fmt(Math.max(0,d.desconto))},
             {label:'Valor do contrato',value:fmt(d.dvt)},
             {label:'Valor total pago',value:fmt(d.val_pago)}],y);
    y=section('Dados do cliente',y);
    y=row('Faturamento mensal médio',fmt(d.fat),y);
    y=row('% retido do faturamento',fmtPct(d.ret),y);
    y=row('Valor retido por dia (corridos)',fmt(d.vrd)+'/dia',y,true);
    y=row('Valor retido por dia útil',fmt(d.vrd_du)+'/dia útil',y);
    y+=5; y=section('Simulação de desconto',y);
    y=row('Valor liberado',fmt(d.lib),y);
    y=row('Valor total do contrato',fmt(d.dvt),y);
    y=row('Dias de pagamento',d.nper_exato.toFixed(1)+' dias',y);
    y=row('Prazo total (c/ '+S.carencia+'d carência)','~'+fmtN(d.tempo)+' dias',y,true);
    y=row('Valor total pago (c/ desconto)',fmt(d.val_pago),y,true);
    y=row('Desconto obtido',fmt(Math.max(0,d.desconto)),y,true);
    y+=4; y=section('Estimativa de prazo e desconto',y);
    doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(130,130,145);
    doc.text('Impacto de variações de ±2 faixas no volume de recebíveis liquidados.',M,y,{maxWidth:CW}); y+=6;
    // tabela
    const cx=[M+3.5, M+CW*0.52, M+CW*0.76, W-M-2];
    doc.setFillColor(c[0],c[1],c[2]); doc.roundedRect(M,y,CW,8.2,1.6,1.6,'F');
    doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(7.8);
    doc.text('VARIAÇÃO',cx[0],y+5.3);
    doc.text('PRAZO TOTAL',cx[1],y+5.3,{align:'right'});
    doc.text('VALOR PAGO',cx[2],y+5.3,{align:'right'});
    doc.text('DESCONTO',cx[3],y+5.3,{align:'right'}); y+=8.2;
    const trh=7.5;
    d.faixa.forEach(f=>{
      if(f.isBase){ doc.setFillColor(c[0],c[1],c[2]); op(0.08); doc.rect(M,y,CW,trh,'F'); op(1); }
      const lbl=f.delta===0?'Base':(f.delta<0?`-${Math.abs(f.delta)*5}% fat`:`+${f.delta*5}% fat`);
      doc.setFont('helvetica',f.isBase?'bold':'normal'); doc.setFontSize(8.4);
      doc.setTextColor(f.isBase?c[0]:70,f.isBase?c[1]:70,f.isBase?c[2]:70); doc.text(lbl,cx[0],y+5.3);
      doc.setTextColor(ink[0],ink[1],ink[2]); doc.setFont('helvetica',f.isBase?'bold':'normal');
      doc.text('~'+fmtN(f.tempo)+'d',cx[1],y+5.3,{align:'right'});
      doc.text(fmt(f.pago),cx[2],y+5.3,{align:'right'});
      doc.setTextColor(c[0],c[1],c[2]); doc.text(fmt(Math.max(0,f.desc)),cx[3],y+5.3,{align:'right'});
      doc.setDrawColor(228,230,238); doc.setLineWidth(0.2); doc.line(M,y+trh,W-M,y+trh); y+=trh;
    });
    y+=5; doc.setFontSize(7.4); doc.setFont("helvetica","italic"); doc.setTextColor(160,160,172);
    doc.text('* Estimativa baseada no faturamento médio e retenção diária. Prazo exato não deve ser divulgado ao cliente.',M,y,{maxWidth:CW});

  } else if(tipo==='simulador' && S._sim){
    const d=S._sim;
    y=stats([{hero:true,label:'Retido por dia',value:fmt(d.vrd)},
             {label:'Pagamento',value:d.dias_amort+' dias'},
             {label:'Desconto (hoje)',value:fmt(Math.max(0,d.vp_desc))}],y);
    y=section('Dados do contrato',y);
    y=row('Valor liberado',fmt(d.lib),y);
    y=row('Valor total do contrato',fmt(d.dvt),y);
    y=row('Prazo total simulado',d.prazo+' dias (incl. '+S.carencia+'d carência)',y);
    y=row('Dias de pagamento',d.dias_amort+' dias',y);
    y+=6; y=section('Resultado da simulação',y);
    y=row('Total pago (soma das retenções)',fmt(d.total_pago),y);
    y=row('Valor retido por dia (fixo)',fmt(d.vrd)+'/dia',y,true);
    y=row('Equivalente por mês',fmt(d.vrd_mes),y);
    y=row('Desconto total (contrato - total pago)',fmt(Math.max(0,d.desc_nom)),y,true);
    y=row('Desconto a valor de hoje',fmt(Math.max(0,d.vp_desc)),y);
  } else {
    doc.setFontSize(12); doc.text('Preencha os campos antes de gerar o PDF.',M,y);
  }

  // ---------- FOOTER ----------
  const validade = new Date(Date.now()+7*86400000).toLocaleDateString('pt-BR');
  const legal='Sujeito a análise de crédito. Vindi - Todos os direitos reservados – correspondente bancário da BMP SCM (Brasil) CNPJ 11.581.339/0001-45 – Av. Paulista, 1294, 6º andar – São Paulo – SP, CEP: 01310-915 www.moneyp.com.br. Aprovação sujeita a análise de crédito.';
  doc.setFont('helvetica','normal'); doc.setFontSize(6.4);
  const legalLines=doc.splitTextToSize(legal, W-24); const llH=2.7;
  const bandH=8.5+legalLines.length*llH+3.5, bandTop=H-bandH;
  doc.setFillColor(246,247,250); doc.rect(0,bandTop,W,bandH,'F');
  gradH(0,bandTop,W,0.7,c,c2);
  doc.setFontSize(7.6); doc.setTextColor(120,120,135);
  const dataY=bandTop+5.4;
  doc.text(`Simulação gerada em ${now}  ·  válida por 7 dias (até ${validade})  ·  Giro Rápido  ·  ${th.name}`, W/2, dataY, {align:'center'});
  doc.setFontSize(6.4); doc.setTextColor(150,150,162);
  const ly=dataY+4.4; legalLines.forEach((ln,i)=>doc.text(ln, W/2, ly+i*llH, {align:'center'}));
}

// Sincroniza os checkboxes "Mostrar no PDF" (compartilhados entre os blocos)
function setPdfInclude(el){
  const k = el.dataset.pdf;
  if(!(k in S.pdfInclude)) return;
  S.pdfInclude[k] = el.checked;
  document.querySelectorAll('.pdf-opts input[data-pdf="'+k+'"]').forEach(x=>{ x.checked = el.checked; });
}

// Escolhe se o PDF de desconto sai com o cálculo do contrato acoplado (padrão) ou só o desconto.
function setDescContrato(el){ S.descIncluiContrato = el.checked; }

// Gera o PDF final. No simulador de desconto, anexa antes o cálculo do contrato (se marcado).
function gerarPDF(tipo){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  if(tipo === 'desconto'){
    if(S.descIncluiContrato){
      renderPagina(doc, 'contrato');   // página 1: cálculo do contrato
      doc.addPage();
      renderPagina(doc, 'desconto');   // página 2: simulação de desconto
    } else {
      renderPagina(doc, 'desconto');   // só o desconto
    }
  } else {
    renderPagina(doc, tipo);
  }
  const th = THEMES[S.team];
  const now = new Date().toLocaleDateString('pt-BR');
  const nomes = { contrato:'Contrato', comparar:'Comparativo', desconto:'Desconto', simulador:'Simulador' };
  const sufixo = (tipo === 'desconto') ? (S.descIncluiContrato ? 'Contrato-Desconto' : 'Desconto') : nomes[tipo];
  doc.save(`GiroRapido_${sufixo}_${th.name}_${now.replace(/\//g,'-')}.pdf`);
}

// reset auto-fill ao editar manualmente
$('d-dvt').addEventListener('input', function(){ this.dataset.auto='0'; });
$('d-lib').addEventListener('input', function(){ this.dataset.auto='0'; });

// ════════════════ INIT ════════════════
applyTheme('vindi');
calcContrato();   // renderiza tudo zerado
