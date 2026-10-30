// build-online.js — monta o pacote de DEPLOY do PAINEL COMPLETO online (Fase 4).
// Fonte única: pega o BsanControl.html, REMOVE os dados embutidos (DETALHE/ROWS/SKU_*), e injeta
// um loader que busca /api/dataset (escopado por PONTO no servidor) e aplica reusando TODA a lógica
// das abas existentes (mesmo caminho do "Atualizar Dados"). Login + troca de senha já vêm no HTML.
// Visibilidade: gestor não vê DRE nem Comissão.
// Regenerável: edite o BsanControl e rode `node build-online.js` de novo.
//   uso:  node build-online.js            (saída em ~/bsancontrol-web)
const fs = require("fs");
const path = require("path");
const os = require("os");

const SRC = path.resolve(__dirname, "..", "..", "BsanControl.html");
// argv[2] e a PASTA de saida — flags nao podem ser confundidas com caminho (o --forcar virou
// uma pasta "--forcar" na primeira tentativa).
const FORCAR = process.argv.includes("--forcar");
const _destino = process.argv.slice(2).find(a => !a.startsWith("--"));
const OUT = path.resolve(_destino || path.join(os.homedir(), "bsancontrol-web"));
let html = fs.readFileSync(SRC, "utf8");
// Atualiza o padrão visual de forma idempotente, mantendo dados e funções existentes.
html = require("./visual/integrar").apply(html);
const antes = (html.length / 1024 / 1024).toFixed(1);

// ── 1) remove os dados embutidos (cada um é 1 linha; vira vazio, o loader preenche da API) ──
const vazios = { DETALHE: "[]", ROWS: "[]", SKU_MON: "[]", SKU_MKT: "[]", SKU_MKT_MON: "[]", TOP10: "{}", TOP10_EM: "{}" };
let stripped = 0;
html = html.split(/\n/).map(line => {
  const m = line.match(/^(\s*)(let|var|const)\s+(DETALHE|ROWS|SKU_MON|SKU_MKT|SKU_MKT_MON|TOP10|TOP10_EM)\s*=/);
  if (m && vazios[m[3]] !== undefined) { stripped++; return `${m[1]}${m[2]} ${m[3]} = ${vazios[m[3]]};`; }
  return line;
}).join("\n");
// ABORTA: embed que sobra nao e escopado por ponto — iria para o repo e poderia aparecer p/ o gestor errado.
if (stripped < 7) { console.error("ERRO: esperava remover 7 embeds, removi", stripped, "— algum nome mudou no BsanControl (DETALHE/ROWS/SKU_MON/SKU_MKT/SKU_MKT_MON/TOP10/TOP10_EM). Deploy ABORTADO."); process.exit(1); }
// ABORTA: qualquer OUTRO dado grande embutido numa variável. O HTML online é servido SEM login — o que estiver
// escrito nele fica público. (23/10/2026: a relação do Full foi embutida como FULL_REL e ficou aberta.)
// Dado de negócio só entra pela API (/api/extras), que exige login e filtra por gestor.
const embedGrande = html.split(/\n/).filter(l => /^\s*(let|var|const)\s+[A-Za-z_$][\w$]*\s*=\s*[\[{]/.test(l) && l.length > 20000);
if (embedGrande.length) { console.error("ERRO: dado embutido no HTML (iria público, sem login):", embedGrande.map(l => l.trim().slice(0, 60) + "… (" + Math.round(l.length / 1024) + " KB)").join(" | "), "— sirva pela API. Deploy ABORTADO."); process.exit(1); }

// ── online: remove a senha do DRE (o acesso já é controlado por login+perfil; gestor nem vê a aba) ──
const htmlAntesDre = html;
html = html.replace(/const DRE_HASH = "[^"]*";/, 'const DRE_HASH = "";');
// ABORTA: nao e risco de seguranca (a senha do DRE permanece), mas o DRE online fica inacessivel sem aviso.
if (html === htmlAntesDre) { console.error("ERRO: nao achei o DRE_HASH p/ neutralizar — a linha mudou no BsanControl. Deploy ABORTADO."); process.exit(1); }

// ── 2) injeta o loader + bootstrap online antes de </body> ──
const BOOT = `
<!-- ===== BsanControl ONLINE (Fase 4) — loader da API + login. Gerado por build-online.js ===== -->
<style>
#bc-dataload .sp{width:34px;height:34px;border:3px solid var(--bdr2,#223);border-top-color:#4f8ef7;border-radius:50%;animation:bcspin .8s linear infinite}
@keyframes bcspin{to{transform:rotate(360deg)}}
</style>
<script>
(function(){
  // aplica o dataset da API nos globais e re-renderiza (mesma sequência do handleFile)
  function mesesEntre(a,b){
    var out=[], y=+String(a||'').slice(0,4), m=+String(a||'').slice(5,7), ey=+String(b||'').slice(0,4), em=+String(b||'').slice(5,7), g=0;
    if(!y||!m||!ey||!em) return out;
    while((y<ey || (y===ey && m<=em)) && g<240){ out.push(y+'-'+String(m).padStart(2,'0')); m++; if(m>12){ m=1; y++; } g++; }
    return out;
  }
  var _bcDe='', _bcAte='';
  function bcAplicaDataset(d, op){
    op=op||{};
    ROWS = d.rows||[];
    SKU_MON = d.skuMon||[]; SKU_MKT = d.skuMkt||[]; SKU_MKT_MON = d.skuMktMon||[];
    try{ window._projCache=null; window._custosCache=null; window._skuMktIdxKey=null; }catch(e){}
    try{ projAllRows=[]; skuRentAllRows=[]; skuMktIndex={}; mktSkuIndex={}; }catch(e){}
    try{ TOP10={}; TOP10_EM={}; }catch(e){}
    var ex=d.extremos||[];
    var months=(ex[0]&&ex[1])?mesesEntre(ex[0],ex[1]):[...new Set(ROWS.map(function(r){return (r.date||'').slice(0,7);}))].filter(Boolean).sort();
    var ds=ROWS.map(function(r){return r.date;}).filter(Boolean).sort();
    var sAll=(ex[0]?String(ex[0]).slice(0,10):ds[0]), eAll=(ex[1]?String(ex[1]).slice(0,10):ds[ds.length-1]);
    var mes=(ds[ds.length-1]||eAll||'').slice(0,7);
    var s=mes?mes+'-01':sAll, e=ds[ds.length-1]||eAll;
    if(!op.manter && s&&e){ var a=document.getElementById('d-start'),b=document.getElementById('d-end'); if(a)a.value=s; if(b)b.value=e; try{_activeShortcutKey=mes;}catch(_){ } }
    try{ if(typeof AVAILABLE_MONTHS!=='undefined') AVAILABLE_MONTHS.splice(0,AVAILABLE_MONTHS.length,...months); }catch(_){}
    try{ buildSHORTS(); }catch(_){}
    try{ if(sAll&&eAll) SHORTS.all=[sAll,eAll]; }catch(_){}
    try{ if(!op.manter && mes && typeof SHORTS!=='undefined' && SHORTS[mes] && e && e<SHORTS[mes][1]) SHORTS[mes]=[mes+'-01', e]; }catch(_){}
    if(d.periodo){ _bcDe=String(d.periodo[0]||''); _bcAte=String(d.periodo[1]||''); }
    if(eAll && (!window._bcUltimaVenda || String(eAll)>String(window._bcUltimaVenda))) window._bcUltimaVenda=String(eAll).slice(0,10);
    try{ buildMonthShortcuts(); }catch(_){}
    if(op.render!==false){ try{ renderAll(); }catch(err){ console.error('renderAll',err); } }
    try{ updateScopeChip(); }catch(_){}
    try{ updateDataFreshness(); }catch(_){}
    try{ if(typeof vndParams==='function' && typeof window.bcBuscaVendas==='function') window.bcBuscaVendas(vndParams()); }catch(_){}
  }
  function bcVisibilidade(){
    var u=(typeof BCAUTH!=='undefined'?BCAUTH.user:null);
    function hide(id){ var x=document.getElementById(id); if(x)x.style.display='none'; }
    try{ var ub=document.querySelector('.upload-btn'); if(ub)ub.style.display='none'; }catch(e){}   // online: dados vêm da API, sem upload de xlsx
    if(!u || u.perfil!=='direcao') hide('nav-dre');   // DRE só a direção; coordenação vê o resto
    if(!u || (u.perfil!=='coordenacao' && u.perfil!=='direcao')) hide('env-upload-box');
    if(!u || u.perfil!=='direcao') hide('com-lancar-box');
    if(u && u.perfil==='direcao'){ var ab=document.getElementById('btn-admin'); if(ab)ab.style.display='inline-block'; }   // admin de usuários só p/ Direção
  }
  async function bcCarrega(silencioso){
    window._vndGer=(window._vndGer||0)+1; window._vndCache=null; window._vndVoo={};
    var el=document.getElementById('bc-dataload');
    try{
      if(el && !silencioso) el.style.display='flex';
      // RETRY com espera: o Render hiberna e a primeira requisição pode falhar até o processo acordar.
      // A abertura pede só o mês da última venda. "Tudo" e os outros atalhos ampliam depois.
      var r=null, ultimoErro=null;
      for(var tent=1; tent<=3; tent++){
        try{
          var txt=document.getElementById('bc-dataload-txt');
          if(txt && tent>1) txt.textContent='Servidor acordando… tentativa '+tent+' de 3';
          r=await authFetch('/api/dataset?meses=1',{cache:'no-cache'});
          if(r.ok) break;
          ultimoErro=new Error('HTTP '+r.status); r=null;
        }catch(err){ ultimoErro=err; r=null; }
        if(tent<3) await new Promise(function(res){ setTimeout(res, tent*4000); });   // 4s, depois 8s
      }
      if(!r) throw (ultimoErro||new Error('sem resposta'));
      var d=await r.json();
      var antesPeriodo=silencioso&&typeof getR==='function'?getR():null;
      bcAplicaDataset(d,{manter:!!silencioso,render:!silencioso});
      if(antesPeriodo){await bcGarantePeriodo(antesPeriodo[0],antesPeriodo[1]);renderAll();}
      bcVisibilidade();
      if(el) el.style.display='none';
      if(typeof activePage!=='undefined' && (typeof bcNavNeedsDetail==='function'?bcNavNeedsDetail(activePage):(activePage==='raiox'||activePage==='gerencial'))) bcCarregaDetalhe(true);
      bcCarregaExtras();    // puxa Ads/Estoque/Comissão/Produtos em 2º plano
    }catch(e){
      console.error('dataset',e);
      if(silencioso) return;   // refresh em 2º plano falhou → mantém o dado atual, sem assustar
      var t=document.getElementById('bc-dataload-txt');
      if(t){ t.innerHTML='Erro ao carregar dados.<br><small>'+String(e.message||e)+'</small><br><button onclick="window.bcCarregaDataset()" style="margin-top:10px;padding:7px 14px;border-radius:8px;border:1px solid #4f8ef7;background:none;color:#4f8ef7;cursor:pointer">tentar de novo</button>'; }
    }
  }
  var _detLoaded=false, _detDe='', _detAte='';
  async function bcCarregaDetalhe(forcar){
    var a=document.getElementById('d-start'), b=document.getElementById('d-end');
    var s=(a&&a.value)||'', e=(b&&b.value)||'';
    if(!forcar && _detLoaded && _detDe && _detAte && s>=_detDe && e<=_detAte) return;
    try{
      var url=s&&e?('/api/detalhe?de='+encodeURIComponent(s)+'&ate='+encodeURIComponent(e)):'/api/detalhe?meses=1';
      var r=await authFetch(url,{cache:'no-cache'});
      if(!r.ok) return;
      var d=await r.json();
      DETALHE = d.detalhe||[]; _detLoaded=true; window._detLoaded=true;
      _detDe=(d.periodo&&d.periodo[0])||s; _detAte=(d.periodo&&d.periodo[1])||e;
      if(typeof activePage!=='undefined' && (activePage==='raiox'||activePage==='gerencial')){ try{ renderPageOnly(activePage); }catch(err){} }
    }catch(e){ console.error('detalhe',e); }
  }
  async function bcGarantePeriodo(s,e){
    s=String(s||''); e=String(e||'');
    try{
      if(s&&e&&!(_bcDe&&_bcAte&&s>=_bcDe&&e<=_bcAte)){
        var de=(_bcDe&&_bcDe<s)?_bcDe:s, ate=(_bcAte&&_bcAte>e)?_bcAte:e;
        var r=await authFetch('/api/dataset?de='+encodeURIComponent(de)+'&ate='+encodeURIComponent(ate),{cache:'no-cache'});
        if(r.ok){
          var d=await r.json();
          bcAplicaDataset(d,{manter:true,render:false});
          _detLoaded=false; window._detLoaded=false; _detDe=''; _detAte='';
        }
      }
      if(typeof activePage!=='undefined' && (typeof bcNavNeedsDetail==='function'?bcNavNeedsDetail(activePage):(activePage==='raiox'||activePage==='gerencial'))) await bcCarregaDetalhe();
    }catch(err){ console.error('periodo',err); }
  }
  window.bcCarregaDetalhe = bcCarregaDetalhe;
  window.bcGarantePeriodo = bcGarantePeriodo;

  // ── abertura de custos por venda: SOB DEMANDA, uma operação por vez ──────────────────────────
  // Não vem no /api/detalhe de propósito. Lá são 148k linhas, e levar 16 campos a mais em cada uma
  // subiu o pico de 137 MB para 249 MB e matou o serviço por falta de memória (exit 134 / 502).
  // Aqui é só a operação aberta (pior caso ~45k linhas = 5,3 MB) e só quando o usuário abre a aba.
  var _abCache={};
  var _origGV = window._renderGerVendas;
  if (typeof _origGV === 'function') {
    window._renderGerVendas = function(rows, mkt){
      try{
        if(rows && rows.length && typeof window._gerGaranteAbertura==='function'){
          window._gerGaranteAbertura(rows[0].emp, mkt);
        }
      }catch(e){}
      return _origGV.apply(this, arguments);
    };
  }
  var _extLoaded=false;
  var _syncAtual=null;   // carimbo do último db-sync que o painel já aplicou (p/ o auto-refresh)
  async function bcCarregaExtras(){
    if(_extLoaded) return;
    try{
      var r=await authFetch('/api/extras',{cache:'no-cache'});
      if(!r.ok) return;
      var d=await r.json();
      if(typeof window.bcStoreVersions==='function')window.bcStoreVersions(d);
      if(d.ads) ADS=d.ads; if(d.adsCamp) ADS_CAMP=d.adsCamp; if(d.adsDia) ADS_DIA=d.adsDia;
      if(d.afiliadosDia) AFILIADOS_DIA=d.afiliadosDia; if(d.afiliadosFonte) AFILIADOS_FONTE=d.afiliadosFonte;
      if(d.estoque) ESTOQUE=d.estoque; if(d.produtos) PRODUTOS=d.produtos;
      if(d.acomp) ACOMP=d.acomp; if(d.acompItens) ACOMP_ITENS=d.acompItens;
      if(d.skuCad) CAD_SKU=d.skuCad;
      if(d.comissao) COMISSAO=d.comissao; if(d.comissaoDet) COMISSAO_DET=d.comissaoDet;
      if(Array.isArray(d.operacoes) && typeof METAS_GESTORES!=='undefined') METAS_GESTORES=Object.fromEntries(d.operacoes.map(o=>[o.empresa+'|'+o.marketplace,o.gestor]));
      if(typeof METAS_FONTE!=='undefined') METAS_FONTE={atualizadoEm:d._sync||'',origem:'Base sincronizada'};
      if(d.fullRel && typeof FULL_REL!=='undefined') FULL_REL=d.fullRel;   // relação do Full (só as operações do gestor)
      if(typeof ENVIOS!=='undefined') ENVIOS=Array.isArray(d.envios)?d.envios:(ENVIOS||[]);
      if(typeof COMISSAO!=='undefined' && !Array.isArray(COMISSAO)) COMISSAO=[];
      window._bcExtrasOk=true;
      if(d.custos && typeof CUSTOS!=='undefined' && d.custos.custos){ CUSTOS=d.custos; }   // custos op + afi/lives (Ads vem do dataset)
      if(d._sync){ _syncAtual=d._sync; try{ var el=document.getElementById('hdr-src'); if(el){ var mins=Math.round((Date.now()-new Date(d._sync).getTime())/60000); var rel=mins<1?'agora':(mins<60?('há '+mins+' min'):(mins<1440?('há '+Math.round(mins/60)+'h'):('há '+Math.round(mins/1440)+'d'))); el.textContent='🔄 Atualizado '+rel; el.title='última sincronização: '+new Date(d._sync).toLocaleString('pt-BR'); } }catch(e){} }
      _extLoaded=true;
      try{ renderPageOnly(activePage); }catch(e){}
    }catch(e){ console.error('extras',e); }
  }
  window.bcCarregaExtras = bcCarregaExtras;
  // AUTO-REFRESH: detecta dado novo (db-sync) e recarrega sozinho — ao voltar pra aba e a cada 3min
  async function bcChecaSync(){
    try{
      var r=await authFetch('/api/health',{cache:'no-store'});   // health não é cacheado → carimbo real do banco
      var d=await r.json();
      if(d && d._sync){
        if(_syncAtual && d._sync!==_syncAtual){ _detLoaded=false; window._detLoaded=false; _extLoaded=false; bcCarrega(true); }   // dado novo → recarrega silencioso
        else if(!_syncAtual){ _syncAtual=d._sync; }
      }
    }catch(e){}
  }
  window.bcChecaSync = bcChecaSync;
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) bcChecaSync(); });
  setInterval(function(){ if(!document.hidden) bcChecaSync(); }, 180000);   // a cada 3min, só com a aba visível
  // coord/direção sobem a planilha de Envios na própria plataforma → salva na nuvem pra todos
  window.bcSalvaEnvios = async function(rows){ return window.bcGravaVersionado('envios',rows); };
  // coord/direção sobem o custos_2026.xlsx na plataforma (custos op + afi/lives; Ads já vem do dataset)
  window.bcSalvaCustos = async function(custos){ return window.bcGravaVersionado('custos',custos); };
  window.bcSalvaComissao = async function(linhas){ return window.bcGravaVersionado('comissao',linhas); };
  // ── ADMIN de usuários (só Direção) ──
  function bcAdmEsc(s){ return String(s==null?'':s).replace(/[<>&"]/g,function(c){return ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'})[c];}); }
  window.bcAdminAbrir = async function(){
    bcAuthInjectCSS();
    var ov=document.getElementById('bc-admin');
    if(!ov){ ov=document.createElement('div'); ov.id='bc-admin'; document.body.appendChild(ov); ov.addEventListener('click',function(e){if(e.target===ov)ov.classList.remove('on');}); }
    ov.innerHTML='<div class="bca-card"><div style="padding:30px;text-align:center;color:var(--t3)">⏳ carregando usuários…</div></div>';
    ov.classList.add('on');
    try{
      var r=await authFetch('/api/admin/usuarios',{cache:'no-store'});
      var d=await r.json(); if(!d.ok) throw new Error(d.erro||('HTTP '+r.status));
      window._bcAdmUsers=d.usuarios||[]; window._bcAdmGest=d.gestores||[];
      window.bcAdminRender();
    }catch(e){ var c=document.querySelector('#bc-admin .bca-card'); if(c) c.innerHTML='<div style="padding:24px;color:var(--neg,#f87171)">⚠️ '+(e.message||e)+'</div>'; }
  };
  window.bcAdminRender = function(editId){
    var us=window._bcAdmUsers||[], gest=window._bcAdmGest||[];
    var pcor={direcao:'#8b5cf6',coordenacao:'#0ea5a0',gestor:'#4f8ef7'};
    var rows=us.map(function(x){
      return '<tr class="'+(x.ativo?'':'off')+'"><td><b>'+bcAdmEsc(x.nome)+'</b></td><td style="color:var(--t3)">'+bcAdmEsc(x.email)+'</td>'
       +'<td><span class="bca-pill" style="background:'+(pcor[x.perfil]||'#777')+'">'+x.perfil+'</span></td><td>'+bcAdmEsc(x.gestor_ref||'—')+'</td>'
       +'<td>'+(x.ativo?'✅':'⛔')+(x.senha_padrao?' <span title="ainda na senha padrão" style="color:#f59e0b">●</span>':'')+'</td>'
       +'<td style="white-space:nowrap"><button class="bca-mini" onclick="bcAdminEditar('+x.id+')">editar</button><button class="bca-mini" onclick="bcAdminReset('+x.id+',&quot;'+bcAdmEsc(x.nome)+'&quot;)">reset senha</button></td></tr>';
    }).join('');
    var ed=editId?us.find(function(u){return u.id===editId;}):null;
    var optG=gest.map(function(g){return '<option'+(ed&&ed.gestor_ref===g?' selected':'')+'>'+bcAdmEsc(g)+'</option>';}).join('');
    var optP=['gestor','coordenacao','direcao'].map(function(p){return '<option value="'+p+'"'+((ed&&ed.perfil===p)||(!ed&&p==='gestor')?' selected':'')+'>'+p+'</option>';}).join('');
    var form='<div style="margin-top:16px;border-top:1px solid var(--bdr2,#e6e8ee);padding-top:14px">'
     +'<div style="font-weight:700;font-size:13px;margin-bottom:10px">'+(ed?'Editar: '+bcAdmEsc(ed.nome):'+ Novo usuário')+'</div>'
     +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
     +'<div class="bca-f"><label>Nome</label><input id="bca-nome" value="'+(ed?bcAdmEsc(ed.nome):'')+'"></div>'
     +'<div class="bca-f"><label>E-mail</label><input id="bca-email" value="'+(ed?bcAdmEsc(ed.email):'')+'" '+(ed?'readonly style="opacity:.6"':'placeholder="ex.: fulano@grupobsan"')+'></div>'
     +'<div class="bca-f"><label>Perfil</label><select id="bca-perfil" onchange="bcAdminTogGest()">'+optP+'</select></div>'
     +'<div class="bca-f" id="bca-gest-box"><label>Gestor (carteira)</label><select id="bca-gest"><option value="">—</option>'+optG+'</select></div>'
     +'</div><div style="display:flex;gap:12px;margin-top:4px;align-items:center">'
     +'<label style="font-size:12px;color:var(--t2,#5a6578)"><input type="checkbox" id="bca-ativo" '+(!ed||ed.ativo?'checked':'')+'> ativo</label><div style="flex:1"></div>'
     +(ed?'<button class="bca-mini" onclick="bcAdminRender()">cancelar</button>':'')
     +'<button onclick="bcAdminSalvar()" style="background:#16a34a;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-weight:700;cursor:pointer;font-size:13px">Salvar</button>'
     +'</div><div id="bca-msg" style="font-size:12px;margin-top:8px;min-height:16px"></div></div>';
    var html='<div class="bca-card"><h3>⚙ Administração de usuários</h3><div class="sub">Crie, edite ou desative acessos. <b>gestor</b> = carteira dele · <b>coordenação</b>/<b>direção</b> = tudo. Novo usuário entra com senha <b>bsan@2026</b> e troca no 1º acesso. ● = ainda na padrão.</div>'
     +'<table class="bca-tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Gestor</th><th>Status</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+form
     +'<div style="text-align:right;margin-top:14px"><button class="bca-mini" onclick="bcAdminFechar()">fechar</button></div></div>';
    var card=document.querySelector('#bc-admin .bca-card'); if(card) card.outerHTML=html;
    window.bcAdminTogGest();
  };
  window.bcAdminFechar=function(){ var o=document.getElementById('bc-admin'); if(o)o.classList.remove('on'); };
  window.bcAdminTogGest=function(){ var p=document.getElementById('bca-perfil'), box=document.getElementById('bca-gest-box'); if(p&&box) box.style.display=(p.value==='gestor')?'flex':'none'; };
  window.bcAdminEditar=function(id){ window.bcAdminRender(id); };
  window.bcAdminSalvar=async function(){
    var msg=document.getElementById('bca-msg');
    var nome=document.getElementById('bca-nome').value.trim(), email=document.getElementById('bca-email').value.trim(), perfil=document.getElementById('bca-perfil').value, gestor_ref=document.getElementById('bca-gest').value, ativo=document.getElementById('bca-ativo').checked;
    if(!nome||!email){ msg.innerHTML='<span style="color:var(--neg,#f87171)">Nome e e-mail obrigatórios.</span>'; return; }
    if(perfil==='gestor'&&!gestor_ref){ msg.innerHTML='<span style="color:var(--neg,#f87171)">Escolha a carteira (gestor).</span>'; return; }
    msg.textContent='Salvando…';
    try{
      var r=await authFetch('/api/admin/usuarios',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:nome,email:email,perfil:perfil,gestor_ref:gestor_ref,ativo:ativo?1:0})});
      var d=await r.json(); if(!d.ok) throw new Error(d.erro||('HTTP '+r.status));
      var rr=await authFetch('/api/admin/usuarios',{cache:'no-store'}); var dd=await rr.json(); window._bcAdmUsers=dd.usuarios||[]; window._bcAdmGest=dd.gestores||[];
      window.bcAdminRender();
      var m2=document.getElementById('bca-msg'); if(m2) m2.innerHTML='<span style="color:#16a34a">✓ '+(d.acao==='criado'?'Criado — senha inicial bsan@2026':'Atualizado')+'</span>';
    }catch(e){ msg.innerHTML='<span style="color:var(--neg,#f87171)">⚠️ '+(e.message||e)+'</span>'; }
  };
  window.bcAdminReset=async function(id,nome){
    if(!confirm('Resetar a senha de '+nome+' para bsan@2026? Ele troca no próximo acesso.')) return;
    try{ var r=await authFetch('/api/admin/reset-senha',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:id})}); var d=await r.json(); if(!d.ok) throw new Error(d.erro);
      var rr=await authFetch('/api/admin/usuarios',{cache:'no-store'}); var dd=await rr.json(); window._bcAdmUsers=dd.usuarios||[]; window.bcAdminRender();
      alert('Senha de '+nome+' resetada para bsan@2026.');
    }catch(e){ alert('Erro: '+(e.message||e)); }
  };
  window.bcCarregaDataset = bcCarrega;
  window.bcAposLogin = function(){ bcVisibilidade(); bcCarrega(); };   // chamado pelo fluxo de login (bcPosLogin)
  // bootstrap: sem token → portão de login; com token → (troca forçada?) → carrega dataset
  function start(){
    try{ bcAuthInjectCSS(); }catch(e){}
    var cv=document.getElementById('bc-dataload');
    if(typeof BCAUTH!=='undefined' && BCAUTH.token){
      if(BCAUTH.user && BCAUTH.user.trocar){ if(cv)cv.style.display='none'; bcTrocarSenha(true); }
      else { bcAposLogin(); }   // bcCarrega mantém a capa até os dados chegarem
    } else { if(cv)cv.style.display='none'; try{ bcShowLogin(true); }catch(e){ console.error(e); } }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
</script>
`;
// capa que cobre DESDE o 1º frame (evita o flash do painel vazio antes dos dados chegarem) — estilo inline
const COVER = `<div id="bc-dataload" style="position:fixed;inset:0;z-index:9990;background:#0d1119;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;font-family:Inter,system-ui,sans-serif;color:#8891a8"><div class="sp"></div><div id="bc-dataload-txt">Carregando…</div></div>`;
html = html.replace(/<body[^>]*>/, m => m + COVER);
if (html.indexOf("</body>") >= 0) html = html.replace("</body>", BOOT + "\n</body>");
else html += BOOT;

// ── 2.5) GUARD: o destino tem código que a origem não tem? ─────────────────────────────────────
// POR QUE EXISTE (11/10/2026): este build é UNIDIRECIONAL — gera o acompanhamento.html a partir do
// BsanControl e sobrescreve o que estiver lá. Mas o repo de deploy (bsancontrol-web) foi editado
// DIRETO três vezes, e esse código nunca voltou para o BsanControl. Rodar o build teria APAGADO:
//   · o bucket "Queima de Margem" do Diagnóstico
//   · o cruzamento Ads×venda ciente do canal (corrigia Amazon e Magalu)
//   · a ponte item_id→SKU da Shopee
// Só não apagou porque alguém conferiu o diff à mão antes de publicar. Isso não pode depender de
// sorte: agora o build RECUSA sobrescrever quando acha linha que existe no destino e não no novo.
// Compara ignorando CRLF×LF e linhas em branco — sem isso o diff acusa o arquivo inteiro.
const _alvo = path.join(OUT, "acompanhamento.html");
if (fs.existsSync(_alvo) && !FORCAR) {
  const norm = t => new Set(String(t).replace(/\r/g, "").split("\n").map(l => l.trim()).filter(Boolean));
  const antigo = norm(fs.readFileSync(_alvo, "utf8")), novo = norm(html);
  const perdidas = [...antigo].filter(l => !novo.has(l));
  if (perdidas.length) {
    console.error("\n⛔ ABORTADO: " + perdidas.length + " linha(s) existem no DESTINO e não no build novo.");
    console.error("   O destino (" + _alvo + ") tem código que o BsanControl.html não tem.");
    console.error("   Publicar assim APAGA esse código.\n");
    console.error("   Amostra (até 15):");
    perdidas.slice(0, 15).forEach(l => console.error("     " + l.slice(0, 130)));
    console.error("\n   O que fazer:");
    console.error("     1) confira o histórico do repo de deploy:  git -C " + OUT + " log --oneline -10");
    console.error("     2) porte o que for código legítimo de volta para o BsanControl.html");
    console.error("     3) rode o build de novo — a lista tem de sobrar só o que ESTE build substitui");
    console.error("     4) se já conferiu e as linhas são mesmo as substituídas:  node build-online.js --forcar\n");
    process.exit(1);
  }
}

// ── 3) escreve a pasta de deploy ──
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "acompanhamento.html"), html);
const copy = f => fs.copyFileSync(path.join(__dirname, f), path.join(OUT, f));
fs.mkdirSync(path.join(OUT, "visual"), { recursive: true });
for (const f of ["areas.js", "areas.css", "integrar.js"]) fs.copyFileSync(path.join(__dirname, "visual", f), path.join(OUT, "visual", f));
copy("api.js"); copy("dbx.js"); copy("auth.js"); copy("espelho-planilhas.js"); copy("lancamento.js"); copy("supabase-ca.pem"); copy("vendas-pagina.js"); copy("datasets-versionados.js");
fs.writeFileSync(path.join(OUT, "package.json"), JSON.stringify({
  name: "bsancontrol-web", private: true, version: "1.0.0",
  description: "BsanControl online (painel completo, API + login por perfil, escopo por ponto)",
  engines: { node: ">=20" }, dependencies: { pg: "^8.13.0" }, scripts: { start: "node api.js" }
}, null, 2));
fs.writeFileSync(path.join(OUT, "render.yaml"), `services:
  - type: web
    name: bsancontrol
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: node api.js
    envVars:
      - key: AUTH_REQUIRED
        value: "1"
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET
        sync: false
`);
if (!fs.existsSync(path.join(OUT, ".gitignore"))) fs.writeFileSync(path.join(OUT, ".gitignore"), "node_modules/\ndb_config.json\n*.log\n");

const depois = (html.length / 1024 / 1024).toFixed(2);
console.log("✓ painel completo online montado em:", OUT);
console.log("  BsanControl:", antes, "MB  →  página online:", depois, "MB (embeds removidos:", stripped + ")");
console.log("  arquivos:", fs.readdirSync(OUT).filter(f => f[0] !== ".").join(", "));
