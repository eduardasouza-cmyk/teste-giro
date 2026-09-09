// ════════════════ COMPARADOR v3 ════════════════
// Substitui a grade antiga (só por prazo). Roda isolado para não colidir com
// os globais do app ($, S, fmt, calcIOF, gerarPDF).
(function(){
  'use strict';
  var card = document.getElementById('cmp3'); if(!card) return;
  var $c = function(id){ return document.getElementById(id); };

  var PRAZOS    = [90,120,150,180];
  var PLANOS_C  = { 90:{dc:60,du:41}, 120:{dc:90,du:62}, 150:{dc:120,du:82}, 180:{dc:150,du:103} };
  var BANDEIRAS = { master:{ nome:'Mastercard' }, visa:{ nome:'Visa' } };
  var CARENCIA_C = 30;
  var IOF_F = 0.0038, IOF_D = 0.000082;
  function iofDe(lib, p){ return lib/(1-(IOF_F+IOF_D*p)) - lib; }

  // Sem valores pré-preenchidos: o vendedor digita o liberado de cada coluna.
  var E = { bands:['master','visa'], prazos:[120,150], vals:{}, ultimo:null };
  var chave = function(b,p){ return b+':'+p; };
  var valor = function(b,p){ var k=chave(b,p); return k in E.vals ? E.vals[k] : 0; };

  function conta(lib, taxa, prazo){
    var iof = iofDe(lib, prazo), principal = lib + iof, meses = prazo/30;
    var total = principal * Math.pow(1 + taxa/100, meses);
    return { lib:lib, iof:iof, principal:principal, total:total, juros: total - lib,
      cetAm:(Math.pow(total/lib, 1/meses)-1)*100,
      cetAa:(Math.pow(Math.pow(total/lib, 1/prazo), 365)-1)*100,
      dc:PLANOS_C[prazo].dc, retDia: total/PLANOS_C[prazo].dc };
  }

  $c('cmp3-bar').addEventListener('click', function(e){
    var b = e.target.closest('[data-band]'), p = e.target.closest('[data-prazo]');
    if(b){ var k=b.dataset.band;
      E.bands = E.bands.indexOf(k)>=0 ? E.bands.filter(function(x){return x!==k;}) : E.bands.concat([k]); }
    if(p){ var n=+p.dataset.prazo;
      E.prazos = E.prazos.indexOf(n)>=0 ? E.prazos.filter(function(x){return x!==n;})
                                        : E.prazos.concat([n]).sort(function(a,c){return a-c;}); }
    if(b||p) render();
  });
  ['cmp3-taxa','cmp3-cet','cmp3-ret'].forEach(function(id){ $c(id).addEventListener('change', render); });

  function render(){
    card.querySelectorAll('[data-band]').forEach(function(el){ el.classList.toggle('on', E.bands.indexOf(el.dataset.band)>=0); });
    card.querySelectorAll('[data-prazo]').forEach(function(el){ el.classList.toggle('on', E.prazos.indexOf(+el.dataset.prazo)>=0); });

    var bands  = ['master','visa'].filter(function(b){ return E.bands.indexOf(b)>=0; });
    var prazos = PRAZOS.filter(function(p){ return E.prazos.indexOf(p)>=0; });
    if(!bands.length || !prazos.length){ $c('cmp3-empty').style.display=''; $c('cmp3-sheet').style.display='none'; E.ultimo=null; return; }
    $c('cmp3-empty').style.display='none'; $c('cmp3-sheet').style.display='';

    var taxa = parseFloat($c('cmp3-taxa').value) || 5;
    var cols = [];
    bands.forEach(function(b){ prazos.forEach(function(p){
      var lib = valor(b,p);
      cols.push({ b:b, p:p, lib:lib, first:p===prazos[0], d: lib>0 ? conta(lib,taxa,p) : null });
    }); });
    var preenchidas = cols.filter(function(c){ return c.d; });
    var min = preenchidas.length ? Math.min.apply(null, preenchidas.map(function(c){ return c.d.total; })) : null;

    E.ultimo = { cols:cols, bands:bands, prazos:prazos, taxa:taxa, min:min,
                 cet:$c('cmp3-cet').checked, ret:$c('cmp3-ret').checked };
    var sep = function(c){ return c.first && cols.indexOf(c)>0 ? ' gsep' : ''; };

    var head = '<thead>';
    if(bands.length > 1){
      head += '<tr><th class="grp-th lbl"></th>' + bands.map(function(b,i){
        return '<th class="grp-th'+(i>0?' gsep':'')+'" colspan="'+prazos.length+'">'+BANDEIRAS[b].nome+'</th>'; }).join('') + '</tr>';
    }
    head += '<tr><th class="plan-th lbl">' + (bands.length>1 ? '' : BANDEIRAS[bands[0]].nome) + '</th>' +
      cols.map(function(c){ return '<th class="plan-th'+sep(c)+'">Plano '+c.p+' dias</th>'; }).join('') + '</tr></thead>';

    var linha = function(rot, fn, cls, sub){
      return '<tr class="'+(cls||'')+'"><td class="lbl">'+rot+(sub?'<span class="sub">'+sub+'</span>':'')+'</td>' +
        cols.map(function(c){ return '<td class="'+sep(c).trim()+'">'+(c.d?fn(c.d,c):'—')+'</td>'; }).join('') + '</tr>';
    };

    var body = '<tbody>';
    body += '<tr class="lib"><td class="lbl">Valor liberado<span class="sub">digite para simular</span></td>' +
      cols.map(function(c){ return '<td class="'+sep(c).trim()+'"><input class="lib" type="number" step="500" placeholder="0" value="'+(c.lib||'')+'" data-k="'+chave(c.b,c.p)+'"></td>'; }).join('') + '</tr>';
    body += linha('Valor financiado', function(d){ return fmt(d.principal); }, 'zebra', 'liberado + IOF');
    body += linha('Imposto (IOF)',    function(d){ return fmt(d.iof); });
    body += linha('Valor dos juros',  function(d){ return fmt(d.juros); }, 'zebra');
    if(E.ultimo.cet){
      body += linha('CET ao mês', function(d){ return fmtPct(d.cetAm); });
      body += linha('CET ao ano', function(d){ return fmtPct(d.cetAa); }, 'zebra');
    }
    if(E.ultimo.ret) body += linha('Retido por dia', function(d){ return fmt(d.retDia); }, '', 'total ÷ dias de amortização');
    body += '<tr class="total"><td class="lbl">Valor da dívida total</td>' + cols.map(function(c){
      var melhor = c.d && min!==null && Math.abs(c.d.total-min) < .005;
      return '<td class="'+sep(c).trim()+(melhor?' best':'')+'">'+(c.d?fmt(c.d.total):'—')+'</td>';
    }).join('') + '</tr>';
    body += '</tbody>';

    $c('cmp3-tbl').innerHTML = head + body;
    $c('cmp3-tbl').querySelectorAll('input.lib').forEach(function(inp){
      inp.addEventListener('input', function(){
        var k = inp.dataset.k, pos = inp.selectionStart;
        E.vals[k] = parseFloat(inp.value) || 0;
        render();
        var volta = $c('cmp3-tbl').querySelector('input.lib[data-k="'+k+'"]');
        if(volta){ volta.focus(); try{ volta.setSelectionRange(pos,pos); }catch(e){} }
      });
    });
  }

  // ════════ PDF DO CLIENTE — identidade da empresa selecionada ════════
  function gerarPdfCmp(){
    var R = E.ultimo;
    if(!R || !R.cols.length){ alert('Escolha ao menos uma bandeira e um vencimento.'); return; }
    if(!R.cols.some(function(c){ return c.d; })){ alert('Informe o valor liberado de ao menos uma coluna.'); return; }

    var th = THEMES[S.team] || THEMES.vindi;
    var hx = function(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; };
    var c = th.primaryRgb, cd = hx(th.primaryDeep), ink = hx(th.ink), muted = hx(th.muted);
    var LINHA=[224,226,235], ZEBRA=[247,249,254], LIB=[255,244,214];

    var cols = R.cols, bands = R.bands, prazos = R.prazos;
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit:'mm', format:'a4', orientation: cols.length > 4 ? 'landscape' : 'portrait' });
    var W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 14;
    var agora = new Date().toLocaleDateString('pt-BR');
    var set  = function(k){ doc.setTextColor(k[0],k[1],k[2]); };
    var fill = function(k){ doc.setFillColor(k[0],k[1],k[2]); };
    var draw = function(k){ doc.setDrawColor(k[0],k[1],k[2]); };
    var op   = function(a){ try{ doc.setGState(new doc.GState({opacity:a})); }catch(e){} };
    function gradH(x,y,w,h,a,b){ var n=Math.max(28,Math.ceil(w)), sw=w/n;
      for(var i=0;i<n;i++){ var t=i/(n-1);
        doc.setFillColor(Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t),Math.round(a[2]+(b[2]-a[2])*t));
        doc.rect(x+i*sw,y,sw+0.5,h,'F'); } }

    // faixa de topo com o logo da empresa
    gradH(0,0,W,34,c,cd);
    op(0.12); doc.setFillColor(255,255,255); doc.circle(W-6,-4,26,'F'); op(1);
    var posto = false;
    if(th.logoWhite){ try{ var lw=(th.logoWhiteAR||3.387)*10.5; doc.addImage(th.logoWhite,'PNG',M,10,lw,10.5); posto=true; }catch(e){} }
    if(!posto){ doc.setFont('helvetica','bold'); doc.setFontSize(17); doc.setTextColor(255,255,255); doc.text(th.name, M, 18); }
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold');   doc.setFontSize(14);  doc.text('Giro Rápido', W-M, 15, {align:'right'});
    doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.text('Comparativo de planos', W-M, 21.5, {align:'right'});
    doc.setFontSize(8); doc.text('Emitido em '+agora, W-M, 27, {align:'right'});
    doc.setFontSize(9.5); doc.text('Simulação de crédito', M, 26);

    var y = 48;
    set(ink); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('Condições da simulação', M, y); y += 6;
    set(muted); doc.setFont('helvetica','normal'); doc.setFontSize(9);
    var cond = 'Taxa de '+R.taxa.toFixed(1).replace('.',',')+'% ao mês · Carência de '+CARENCIA_C+' dias · ' +
               'Bandeiras: '+bands.map(function(b){ return BANDEIRAS[b].nome; }).join(' e ')+' · Vencimentos: '+prazos.join(', ')+' dias';
    doc.text(doc.splitTextToSize(cond, W-2*M), M, y); y += 10;

    var labelW = cols.length > 4 ? 62 : 58;
    var colW = (W - 2*M - labelW) / cols.length;
    var fs = cols.length > 6 ? 7.2 : cols.length > 4 ? 8.2 : 9;
    var rowH = 8;
    var cx = function(i){ return M + labelW + i*colW + colW - 3; };

    if(bands.length > 1){
      fill(ZEBRA); doc.rect(M, y, W-2*M, 7, 'F');
      set(muted); doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
      bands.forEach(function(b,bi){
        var x0 = M + labelW + bi*prazos.length*colW;
        doc.text(BANDEIRAS[b].nome.toUpperCase(), x0 + (prazos.length*colW)/2, y+4.7, {align:'center'});
      });
      y += 7;
    }
    fill(ZEBRA); doc.rect(M, y, W-2*M, rowH, 'F');
    set(ink); doc.setFont('helvetica','bold'); doc.setFontSize(fs);
    if(bands.length === 1) doc.text(BANDEIRAS[bands[0]].nome, M+3, y+5.6);
    cols.forEach(function(c2,i){ doc.text('Plano '+c2.p+' dias', cx(i), y+5.6, {align:'right'}); });
    y += rowH;
    draw(LINHA); doc.setLineWidth(.2); doc.line(M, y, W-M, y);

    var linhaPdf = function(rot, fn, opt){
      opt = opt || {};
      if(opt.zebra){ fill(ZEBRA); doc.rect(M, y, W-2*M, rowH, 'F'); }
      if(opt.lib){   fill(LIB);   doc.rect(M, y, W-2*M, rowH, 'F'); }
      if(opt.total){ fill(c);     doc.rect(M, y, W-2*M, rowH+1.5, 'F'); }
      doc.setFont('helvetica', opt.total ? 'bold' : 'normal');
      doc.setFontSize(opt.total ? fs+.6 : fs);
      if(opt.total) doc.setTextColor(255,255,255); else set(ink);
      doc.text(rot, M+3, y+5.6);
      cols.forEach(function(c2,i){ doc.text(String(c2.d ? fn(c2.d,c2) : '—'), cx(i), y+5.6, {align:'right'}); });
      y += opt.total ? rowH+1.5 : rowH;
      if(!opt.total){ draw(LINHA); doc.line(M, y, W-M, y); }
    };

    linhaPdf('Valor liberado',   function(d){ return fmt(d.lib); },       {lib:true});
    linhaPdf('Valor financiado', function(d){ return fmt(d.principal); }, {zebra:true});
    linhaPdf('Imposto (IOF)',    function(d){ return fmt(d.iof); });
    linhaPdf('Valor dos juros',  function(d){ return fmt(d.juros); },     {zebra:true});
    if(R.cet){
      linhaPdf('CET ao mês', function(d){ return fmtPct(d.cetAm); });
      linhaPdf('CET ao ano', function(d){ return fmtPct(d.cetAa); }, {zebra:true});
    }
    if(R.ret) linhaPdf('Retido por dia', function(d){ return fmt(d.retDia); });
    linhaPdf('Valor da dívida total', function(d){ return fmt(d.total); }, {total:true});

    var bi = -1;
    for(var i=0;i<cols.length;i++){ if(cols[i].d && Math.abs(cols[i].d.total-R.min) < .005){ bi=i; break; } }
    if(bi >= 0){
      y += 7; set(c); doc.setFont('helvetica','bold'); doc.setFontSize(9);
      doc.text('Menor custo total: '+BANDEIRAS[cols[bi].b].nome+' '+cols[bi].p+' dias — '+fmt(R.min), M, y);
    }

    var fy = H - 20;
    draw(LINHA); doc.line(M, fy, W-M, fy);
    set(muted); doc.setFont('helvetica','normal'); doc.setFontSize(7);
    doc.text('Simulação sem valor contratual. Valores sujeitos a análise de crédito e às condições vigentes na contratação.', M, fy+5);
    doc.text(th.name+' — correspondente bancário da BMP SCM (Brasil) CNPJ 11.581.339/0001-45 — Av. Paulista, 1294, 6º andar — São Paulo/SP.', M, fy+9.5);

    doc.save('GiroRapido_Comparativo_'+th.name+'_'+agora.replace(/\//g,'-')+'.pdf');
    if(window.giroRegistrarPDF) window.giroRegistrarPDF('comparar');
  }

  $c('cmp3-pdf').addEventListener('click', gerarPdfCmp);

  // Exposto para o applyTheme/calcContrato pedirem um redesenho.
  window.cmp3 = { render: render };
  render();
})();
