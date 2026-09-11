// ════════════════ MÓDULO MESA — calculadora de aporte ════════════════
(function(){
  'use strict';
  const $g = id => document.getElementById(id);
  const wrap = document.querySelector('.wrap');
  if(!wrap) return;

  let historico = [];
  const brl = v => fmt(v);                 // reaproveita o formatador BRL do app
  const nowStr = () => new Date().toLocaleString('pt-BR');
  const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  // ---- CNPJ: sempre gravado no formato 00.000.000/0000-00 ----
  const soDigitos = v => String(v||'').replace(/\D/g,'').slice(0,14);
  function formataCNPJ(v){
    const d = soDigitos(v);
    let out = d.slice(0,2);
    if(d.length > 2)  out += '.' + d.slice(2,5);
    if(d.length > 5)  out += '.' + d.slice(5,8);
    if(d.length > 8)  out += '/' + d.slice(8,12);
    if(d.length > 12) out += '-' + d.slice(12,14);
    return out;
  }

  const PIX = 1.00, FEE_PCT = 0.005;

  // ---- card na identidade Giro Rápido ----
  const card = document.createElement('div');
  card.className = 'card'; card.id = 'aporte-card'; card.dataset.block = 'aporte';
  card.style.display = 'none';
  card.innerHTML =
    '<div class="card-head">'+
      '<div>'+
        '<h2>Calculadora de aporte <span class="mesa-tag">Mesa</span></h2>'+
        '<p>Informe o desembolso e o principal para obter o aporte total necessário.</p>'+
      '</div>'+
      '<div class="head-actions">'+
        '<button class="btn-pdf" id="ap-csv" type="button">'+
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'+
          'Baixar planilha (CSV)'+
        '</button>'+
      '</div>'+
    '</div>'+
    '<div class="card-body">'+
      '<div class="fields">'+
        '<div class="field">'+
          '<label for="ap-cnpj">CNPJ do cliente</label>'+
          '<div class="input-wrap"><input type="text" id="ap-cnpj" placeholder="00.000.000/0000-00"></div>'+
        '</div>'+
        '<div class="field">'+
          '<label for="ap-des">Valor do desembolso</label>'+
          '<div class="input-wrap has-prefix"><span class="input-prefix">R$</span><input type="number" id="ap-des" step="0.01" placeholder="0,00"></div>'+
        '</div>'+
        '<div class="field">'+
          '<label for="ap-prin">Valor do principal</label>'+
          '<div class="input-wrap has-prefix"><span class="input-prefix">R$</span><input type="number" id="ap-prin" step="0.01" placeholder="0,00"></div>'+
        '</div>'+
      '</div>'+

      '<div class="ap-erro" id="ap-erro" hidden></div>'+
      '<button class="btn-apply" id="ap-calc" type="button">Calcular e salvar no histórico</button>'+
      '<div class="ap-sync" id="ap-sync" hidden></div>'+

      '<div class="hl-stack">'+
        '<div class="hl hero-fill">'+
          '<div class="hl-label">Valor total de aporte necessário</div>'+
          '<div class="hl-value" id="ap-total">R$ 0,00</div>'+
          '<div class="hl-sub">Desembolso + FEE + PIX + IOF</div>'+
        '</div>'+
      '</div>'+

      '<div class="res-grid">'+
        '<div class="rc"><div class="rc-label">Desembolso</div><div class="rc-value v-ink" id="ap-r-des">R$ 0,00</div><div class="rc-sub">valor solicitado</div></div>'+
        '<div class="rc"><div class="rc-label">FEE empresa</div><div class="rc-value v-key" id="ap-r-fee">R$ 0,00</div><div class="rc-sub">0,5% do desembolso</div></div>'+
        '<div class="rc"><div class="rc-label">PIX</div><div class="rc-value v-ink" id="ap-r-pix">R$ 0,00</div><div class="rc-sub">custo fixo</div></div>'+
        '<div class="rc"><div class="rc-label">IOF a ser pago</div><div class="rc-value v-accent" id="ap-r-iof">R$ 0,00</div><div class="rc-sub">principal − desembolso</div></div>'+
      '</div>'+

      '<div class="seg-label" style="margin-top:20px">Histórico de cálculos</div>'+
      '<div class="aporte-hist-wrap">'+
        '<table class="aporte-hist" id="ap-tabela">'+
          '<thead><tr><th>CNPJ</th><th>Data e hora</th><th>Desembolso</th><th>FEE</th><th>PIX</th><th>IOF</th><th>Total aporte</th></tr></thead>'+
          '<tbody id="ap-tbody"></tbody>'+
        '</table>'+
        '<div class="aporte-empty" id="ap-empty">Nenhum cálculo salvo ainda.</div>'+
      '</div>'+

      '<div class="note">'+
        '<div class="note-title">Como o aporte é calculado</div>'+
        '<div class="note-body">Aporte total = Desembolso + FEE (0,5% do desembolso) + PIX (custo fixo) + IOF (principal − desembolso). Cada cálculo é gravado na tabela <b>aportes</b> do Supabase e volta a aparecer aqui no próximo acesso. Use o CSV para levar os dados para uma planilha.</div>'+
      '</div>'+
    '</div>';

  const comparar = document.querySelector('.wrap > .card[data-block="comparar"]');
  if(comparar) wrap.insertBefore(card, comparar); else wrap.appendChild(card);

  function erroAp(msg){ const el=$g('ap-erro'); el.textContent=msg||''; el.hidden=!msg; }
  function sync(msg, cls){ const el=$g('ap-sync'); el.textContent=msg||''; el.className='ap-sync'+(cls?' '+cls:''); el.hidden=!msg; }

  // ---- Supabase: grava e lê a tabela "aportes" ----
  const banco = () => window.giroDb || window.giroDB || null;

  async function salvarNoBanco(reg){
    const sb = banco();
    if(!sb) return { ok:false, msg:'Sem conexão com o servidor.' };
    try{
      const u = await sb.auth.getUser();
      const uid = u && u.data && u.data.user ? u.data.user.id : null;
      const a = window.giroAuth || {};
      const res = await sb.from('aportes').insert({
        cnpj: reg.cnpj,
        desembolso: reg.des,
        fee: reg.fee,
        pix: reg.pix,
        iof: reg.iof,
        total: reg.total,
        usuario_id: uid || a.id || null,
        usuario_nome: a.nome || null
      });
      if(res.error) return { ok:false, msg: res.error.message };
      return { ok:true };
    }catch(e){
      return { ok:false, msg: e.message || 'Falha ao gravar o cálculo.' };
    }
  }

  // Datas ficam em colunas de nome variável conforme a tabela; pegamos a primeira que existir.
  function dataDaLinha(row){
    const bruto = row.created_at || row.criado_em || row.data || row.data_hora || null;
    if(!bruto) return '—';
    const d = new Date(bruto);
    return isNaN(d) ? String(bruto) : d.toLocaleString('pt-BR');
  }

  async function carregarDoBanco(){
    const sb = banco();
    if(!sb) return;
    try{
      const res = await sb.from('aportes').select('*').order('id', { ascending:false }).limit(200);
      if(res.error || !res.data) return;
      const lidos = res.data.map(r => ({
        cnpj: String(r.cnpj || ''),
        data: dataDaLinha(r),
        des: Number(r.desembolso) || 0,
        fee: Number(r.fee) || 0,
        pix: Number(r.pix) || 0,
        iof: Number(r.iof) || 0,
        total: Number(r.total) || 0,
        salvo: true
      })).reverse();          // a tabela renderiza do mais novo para o mais antigo
      historico = lidos.concat(historico.filter(r => !r.salvo));
      renderTabela();
    }catch(e){ /* sem histórico anterior: começa vazio */ }
  }

  function calcular(){
    const digitos = soDigitos($g('ap-cnpj').value);
    const cnpj = formataCNPJ(digitos);
    const des  = parseFloat($g('ap-des').value);
    const prin = parseFloat($g('ap-prin').value);
    if(!digitos){ erroAp('Informe o CNPJ do cliente.'); return; }
    if(digitos.length !== 14){ erroAp('O CNPJ precisa ter 14 dígitos.'); return; }
    if(isNaN(des) || des<=0){ erroAp('Informe um valor de desembolso válido.'); return; }
    if(isNaN(prin) || prin<=0){ erroAp('Informe um valor de principal válido.'); return; }
    if(prin < des){ erroAp('O principal não pode ser menor que o desembolso.'); return; }
    erroAp('');

    const fee = des * FEE_PCT;
    const iof = prin - des;
    const total = des + fee + PIX + iof;

    $g('ap-total').textContent = brl(total);
    $g('ap-r-des').textContent = brl(des);
    $g('ap-r-fee').textContent = brl(fee);
    $g('ap-r-pix').textContent = brl(PIX);
    $g('ap-r-iof').textContent = brl(iof);

    const reg = { cnpj, data:nowStr(), des, fee, pix:PIX, iof, total, salvo:false };
    historico.push(reg);
    renderTabela();
    sync('Salvando no Supabase…');

    salvarNoBanco(reg).then(function(r){
      reg.salvo = r.ok;
      renderTabela();
      if(r.ok) sync('Cálculo salvo para ' + reg.cnpj + '.', 'ok');
      else sync('O cálculo ficou só nesta sessão — o Supabase recusou a gravação: ' + r.msg, 'err');
    });

    $g('ap-cnpj').value=''; $g('ap-des').value=''; $g('ap-prin').value='';
    $g('ap-cnpj').focus();
  }

  function renderTabela(){
    const has = historico.length>0;
    $g('ap-tabela').style.display = has ? '' : 'none';
    $g('ap-empty').style.display = has ? 'none' : '';
    $g('ap-tbody').innerHTML = [...historico].reverse().map(r=>
      '<tr'+(r.salvo===false ? ' class="pendente"' : '')+'>'+
        '<td class="col-cnpj">'+esc(r.cnpj)+'</td>'+
        '<td>'+esc(r.data)+'</td>'+
        '<td>'+brl(r.des)+'</td>'+
        '<td class="col-fee">'+brl(r.fee)+'</td>'+
        '<td>'+brl(r.pix)+'</td>'+
        '<td>'+brl(r.iof)+'</td>'+
        '<td class="col-total">'+brl(r.total)+'</td>'+
      '</tr>'
    ).join('');
  }

  function exportarCSV(){
    if(historico.length===0){ erroAp('Não há dados para exportar.'); return; }
    const n = v => v.toFixed(2).replace('.',',');
    let csv = 'CNPJ;Data e Hora;Desembolso;FEE Empresa;Custo PIX;IOF a ser pago;Total Aporte\n';
    historico.forEach(r=>{ csv += r.cnpj+';'+r.data+';'+n(r.des)+';'+n(r.fee)+';'+n(r.pix)+';'+n(r.iof)+';'+n(r.total)+'\n'; });
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', 'historico_aportes.csv');
    link.style.visibility='hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }

  // pontua o CNPJ enquanto a pessoa digita
  $g('ap-cnpj').addEventListener('input', function(){
    const fim = this.selectionStart === this.value.length;
    this.value = formataCNPJ(this.value);
    if(fim){ try{ this.setSelectionRange(this.value.length, this.value.length); }catch(e){} }
  });

  $g('ap-calc').addEventListener('click', calcular);
  $g('ap-csv').addEventListener('click', exportarCSV);
  ['ap-cnpj','ap-des','ap-prin'].forEach(id=>$g(id).addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); calcular(); } }));
  renderTabela();

  // ---- só na Mesa: envelopa o giroApplyArea existente sem alterá-lo ----
  // O histórico só é buscado quando a Mesa aparece: aí a sessão já existe e o RLS reconhece o usuário.
  let jaCarregou = false;
  function aplicar(area){
    const naMesa = (area === 'mesa');
    card.style.display = naMesa ? '' : 'none';
    if(naMesa && !jaCarregou){ jaCarregou = true; carregarDoBanco(); }
  }
  aplicar((window.giroAuth && window.giroAuth.area) || document.body.dataset.area || 'comercial');
  const _oaa = window.giroApplyArea;
  window.giroApplyArea = function(area){ if(typeof _oaa==='function') _oaa(area); aplicar(area); };
})();
