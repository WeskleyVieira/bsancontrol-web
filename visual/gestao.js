/* Financeiro da Direção (01/11/2026): Fechamento das comissões por operação, Custos recorrentes e Carteiras dos gestores.
   Mesmos componentes das áreas (cartões, blocos, tabelas). Tudo vale "a partir do mês"; só a Direção vê e altera. */
(function(){'use strict';
 const $=id=>document.getElementById(id),el=(t,c,x)=>{const n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n;};
 const PAGES={'gestao-fechamento':'Fechamento','gestao-custos':'Custos','gestao-carteiras':'Carteiras'};
 const S={mes:{},dados:{},msg:{}};
 const brl=v=>v==null||!Number.isFinite(+v)?'—':(+v).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
 const pct=v=>v==null||!Number.isFinite(+v)?'—':(+v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
 const data=v=>v?new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
 const mesNome=m=>{const[y,mm]=m.split('-').map(Number);return new Date(y,mm-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});};
 const mesMais=(m,k)=>{const[y,mm]=m.split('-').map(Number);const d=new Date(Date.UTC(y,mm-1+k,1));return d.toISOString().slice(0,7);};
 const hoje=()=>new Date(Date.now()-3*36e5).toISOString().slice(0,7);
 const ehDirecao=()=>typeof bcNavSession==='function'&&bcNavSession()?.perfil==='direcao';
 const online=()=>typeof authFetch==='function'&&typeof painelOnline==='function'&&painelOnline();
 // ── registro da página no mapa de áreas (mesmo padrão dos módulos de produtos e pós-venda) ──
 for(const [id,label] of Object.entries(PAGES)){const page=el('section','page bc-area gs-page');page.id='page-'+id;document.querySelector('.page')?.parentElement.append(page);
  NAV_PAGES.push({id,label});const nav=el('button','ntab',label);nav.id='nav-'+id;nav.type='button';nav.onclick=()=>bcGroupedOpen('financeiro',id);$('main-nav')?.append(nav);}
 const fin=BCGroupMap.find(g=>g.id==='financeiro');if(fin)fin.items.push(...Object.entries(PAGES).map(([id,label])=>({id,label,page:id})));
 const allowed=bcGroupedAllowed;bcGroupedAllowed=function(item,user=bcNavSession()){return PAGES[item.page]?user?.perfil==='direcao':allowed(item,user);};
 const go=goPage;goPage=function(id){if(PAGES[id]&&!ehDirecao())return;return go.apply(this,arguments);};
 const chrome=bcChromeRefresh;bcChromeRefresh=function(){const out=chrome.apply(this,arguments);const t={'gestao-fechamento':'Fecha a comissão de cada operação quando a venda do mês está 100% liquidada. Mostra o que se paga e o que mudou depois do fechamento.','gestao-custos':'Custos fixos se repetem sozinhos; os variáveis ficam estimados até você confirmar a conta do mês.','gestao-carteiras':'Responsável por cada operação. A troca vale a partir do mês escolhido.'}[activePage];if(t)bcChromeText($('bc-scope-note'),t);return out;};
 const render=renderPageOnly;renderPageOnly=function(id){if(PAGES[id]){abrir(id);return;}return render.apply(this,arguments);};
 // ── utilidades ──
 const note=t=>el('p','ger-note',t);
 function button(t,fn,cls='sum-button'){const b=el('button',cls,t);b.type='button';b.onclick=fn;return b;}
 function block(titulo,sub){const n=el('section','ger-block');n.append(el('h2','',titulo));if(sub)n.append(note(sub));return n;}
 function card(t,v,h){const n=el('article','sum-card');n.append(el('h3','',t),el('strong','sum-value'+(/^-|^−/.test(v)?' sum-negative':''),v),note(h));return n;}
 function cards(...c){const n=el('div','sum-kpis sum-kpis-four');n.append(...c);return n;}
 function control(label,node){const l=el('label','ger-control');l.append(el('span','',label),node);return l;}
 function selectMes(id,meses,valor,fn){const s=el('select');s.id=id;for(const m of meses)s.append(new Option(mesNome(m),m));s.value=valor;s.onchange=()=>fn(s.value);return control('Mês',s);}
 function tabela(cols,rows,vazio){const w=el('div','ger-table-wrap bc-table-scroll');w.tabIndex=0;const t=el('table','ger-table tbl'),h=el('thead'),hr=el('tr');for(const c of cols){const th=el('th','',c.label);th.scope='col';hr.append(th);}h.append(hr);t.append(h);const b=el('tbody');
  for(const r of rows){const tr=el('tr');for(const c of cols){const td=el('td',c.num?'ger-number':'');const v=c.value(r);if(v instanceof Node)td.append(v);else td.textContent=v??'';if(c.neg&&c.neg(r))td.classList.add('sum-negative');tr.append(td);}b.append(tr);}
  if(!rows.length){const tr=el('tr'),td=el('td','',vazio||'Nada neste mês.');td.colSpan=cols.length;tr.append(td);b.append(tr);}t.append(b);w.append(t);return w;}
 async function api(path,body){const r=await authFetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});let d={};try{d=await r.json();}catch(e){}if(!r.ok||d.ok===false)throw new Error(d.erro||('HTTP '+r.status));return d;}
 function aviso(id,t,tom){S.msg[id]={t,tom};const n=$('gs-msg-'+id);if(n){n.textContent=t;n.dataset.tone=tom||'';}}
 function raiz(id){const p=$('page-'+id);p.replaceChildren();if(typeof bcVisualGuide==='function'&&BCAreas[id])bcVisualGuide(p,BCAreas[id]);const m=el('p','gs-msg');m.id='gs-msg-'+id;m.setAttribute('role','status');if(S.msg[id]){m.textContent=S.msg[id].t;m.dataset.tone=S.msg[id].tom||'';}p.append(m);return p;}
 BCAreas['gestao-fechamento']={selector:'#page-gestao-fechamento',title:'Fechamento',read:'Cada operação fecha quando as vendas do mês estão 100% liquidadas. Fechar congela o valor (foto). O que mudar depois (devolução, estorno) aparece como ajuste e entra no mês seguinte.',scope:'Paga, teto e regra valem a partir do mês escolhido e entram no próximo cálculo (atualizar ou fechar). Operações marcadas como não pagas aparecem para leitura de desempenho.',next:'Selecione as operações liquidadas e use Fechar selecionadas: o PC fecha em até 15 minutos. O Recibo resume o que cada gestor recebe.'};
 BCAreas['gestao-custos']={selector:'#page-gestao-custos',title:'Custos',read:'Fixo repete o mesmo valor todo mês até mudar. Variável (luz, água, VR/VT) fica estimado pelo último valor até você confirmar a conta. Pontual vale só no mês dele.',scope:'Reajuste: edite o cadastro com o novo valor a partir do mês. Desligamento: preencha o fim. "É comissão" fica fora da DRE e do lucro da regra de 10%.',next:'Confirme as contas variáveis do mês e use Publicar na DRE.'};
 BCAreas['gestao-carteiras']={selector:'#page-gestao-carteiras',title:'Carteiras',read:'Cada operação tem um responsável. A troca vale a partir do mês escolhido, para tarefas, histórico e comissão não se dividirem no meio do mês.',scope:'O gestor precisa ter usuário com o mesmo nome de gestor na Administração para ver a carteira.',next:'Escolha o mês, troque o responsável e salve. Entra no próximo atualizar.'};
 function abrir(id){const p=raiz(id);if(!ehDirecao()){p.append(note('Somente a Direção acessa esta página.'));return;}if(!online()){p.append(note('Disponível no BsanControl online, com login.'));return;}
  if(id==='gestao-fechamento')fechamento(p);else if(id==='gestao-custos')custos(p);else carteiras(p);}
 const ultimos=(n,ate)=>{const out=[];for(let i=0;i<n;i++)out.push(mesMais(ate,-i));return out;};

 // ── 1 + 4. FECHAMENTO: regras por operação, situação, fechar, recibo e ajustes ──
 async function fechamento(p){const mes=S.mes.f||mesMais(hoje(),-1);S.mes.f=mes;
  const top=el('div','ger-controls');top.append(selectMes('gs-f-mes',ultimos(14,hoje()),mes,v=>{S.mes.f=v;abrir('gestao-fechamento');}));p.append(top);
  const corpo=el('div');corpo.append(note('Carregando…'));p.append(corpo);
  let d;try{d=await api('/api/gestao/estado?mes='+mes);}catch(e){corpo.replaceChildren(note('Não foi possível carregar: '+e.message));return;}
  S.dados.f=d;const ops=d.operacoes.filter(o=>o.comissao),com=o=>o.comissao||{};
  const paga=o=>!!o.gestor&&o.regra?.paga!==false&&com(o).paga!=='não',fechada=o=>!!o.fechamento||!!com(o).fechado_em,pago=o=>!!o.fechamento?.pago_em;
  // pronta = 100% liquidada E a informação existe (sem o % liquidado, nunca se presume liquidada)
  const pronta=o=>!fechada(o)&&com(o).liquidado_pct!=null&&+com(o).liquidado_pct>=100&&!+com(o).vendas_abertas;
  const aPagar=ops.filter(o=>paga(o)&&fechada(o)).reduce((s,o)=>s+(+com(o).bonus_final_rs||0),0),aberto=ops.filter(o=>paga(o)&&!fechada(o)).reduce((s,o)=>s+(+com(o).bonus_final_rs||0),0);
  const ajustes=ops.filter(o=>paga(o)&&fechada(o)&&Math.abs(+com(o).diferenca_rs||0)>=0.01);
  const jaPago=ops.filter(o=>paga(o)&&pago(o)).reduce((s,o)=>s+(+o.fechamento.bonus_rs||0),0);
  corpo.replaceChildren(cards(card('A pagar (fechado)',brl(aPagar-jaPago),ops.filter(o=>paga(o)&&fechada(o)&&!pago(o)).length+' operações fechadas esperando pagamento.'),card('Pago',brl(jaPago),ops.filter(o=>paga(o)&&pago(o)).length+' operações com pagamento registrado.'),card('Ainda aberto',brl(aberto),ops.filter(o=>paga(o)&&!fechada(o)).length+' operações esperando liquidação. Valor estimado.'),
   card('Operações fechadas',ops.filter(fechada).length+' de '+ops.length,'Inclui as que não são pagas.'),card('Ajustes desde o fechamento',brl(ajustes.reduce((s,o)=>s+(+com(o).diferenca_rs||0),0)),ajustes.length?ajustes.length+' operações mudaram depois de fechadas. Entram no mês seguinte.':'Nenhuma operação mudou depois de fechada.')));
  const sel=new Set();
  const regraSel=o=>{const s=el('select');s.setAttribute('aria-label','Regra de '+o.operacao);s.append(new Option('Metas','metas'),new Option('% do lucro líquido','lucro_liquido'));s.value=o.regra?.regra||'metas';s.onchange=()=>salvarRegra(o,{regra:s.value,pct_lucro:s.value==='lucro_liquido'?(o.regra?.pct_lucro||0.10):null});return s;};
  const pagaChk=o=>{const c=el('input');c.type='checkbox';c.checked=paga(o);c.setAttribute('aria-label','Pagar a comissão de '+o.operacao);c.onchange=()=>salvarRegra(o,{paga:c.checked});return c;};
  const tetoIn=o=>{const i=el('input','gs-num');i.type='number';i.step='0.001';i.min='0';i.max='50';i.placeholder=com(o).teto_pct!=null?String(com(o).teto_pct):'';i.value=o.regra?.teto!=null?String(+(o.regra.teto*100).toFixed(3)):'';i.setAttribute('aria-label','Teto % de '+o.operacao);i.onchange=()=>salvarRegra(o,{teto:i.value===''?'':(+i.value)/100});return i;};
  const situ=o=>{const c=com(o);if(o.fechamento){const f=o.fechamento;return 'Fechada em '+data(f.fechado_em).slice(0,10)+(f.fechado_por?' por '+f.fechado_por:'')+(f.pago_em?' · paga em '+f.pago_em.split('-').reverse().join('/'):paga(o)?' · a pagar':'');}
   if(c.fechado_em){const dif=+c.diferenca_rs||0;return 'Fechada em '+data(c.fechado_em).slice(0,10)+(Math.abs(dif)>=0.01?' · ajuste '+(dif>0?'+':'')+brl(dif):'');}
   if(c.liquidado_pct==null)return 'Aberta · liquidação não informada (entra no próximo atualizar)';
   return pronta(o)?'Aberta · 100% liquidada, pronta para fechar':'Aberta · '+(+c.vendas_abertas||0)+' vendas sem liquidar ('+brl(c.fat_aberto)+')';};
  // PAGO EM e REABRIR (12/11/2026): direto no banco. Pagamento só em operação fechada que recebe comissão; paga não reabre.
  const pagoIn=o=>{if(!o.fechamento||!paga(o))return '—';const i=el('input');i.type='date';i.value=o.fechamento.pago_em||'';i.setAttribute('aria-label','Data do pagamento de '+o.operacao);
   i.onchange=async()=>{try{await api('/api/gestao/pagar',{mes,operacoes:[o.operacao],pago_em:i.value});aviso('gestao-fechamento',o.operacao+(i.value?': pagamento registrado.':': pagamento desmarcado.'),'good');abrir('gestao-fechamento');}catch(e){aviso('gestao-fechamento',e.message,'bad');}};return i;};
  const reabrirBt=o=>{if(!o.fechamento||o.fechamento.pago_em)return '';return button('Reabrir',async()=>{if(!confirm('Reabrir '+o.operacao+' de '+mesNome(mes)+'? Ela volta a ser recalculada no próximo atualizar.'))return;
   try{await api('/api/gestao/reabrir',{mes,operacao:o.operacao});aviso('gestao-fechamento',o.operacao+' reaberta.','good');abrir('gestao-fechamento');}catch(e){aviso('gestao-fechamento',e.message,'bad');}});};
  const marcar=o=>{const c=el('input');c.type='checkbox';c.disabled=!pronta(o)&&!(!fechada(o)&&+com(o).vendas_abertas>0);c.setAttribute('aria-label','Selecionar '+o.operacao+' para fechar');c.onchange=()=>{c.checked?sel.add(o.operacao):sel.delete(o.operacao);};if(pronta(o)){c.checked=true;sel.add(o.operacao);}return c;};
  const box=block('Comissão de '+mesNome(mes),'Paga, teto e regra valem a partir deste mês e entram no próximo cálculo. As operações 100% liquidadas já vêm marcadas para fechar.');
  const bar=el('div','ger-controls');bar.append(button('Fechar selecionadas',async()=>{if(!sel.size){aviso('gestao-fechamento','Selecione ao menos uma operação aberta.','bad');return;}
    if(!confirm('Fechar '+sel.size+' operação(ões) de '+mesNome(mes)+'? O valor fica congelado para pagamento.'))return;
    try{const r=await api('/api/gestao/fechar',{mes,operacoes:[...sel]});aviso('gestao-fechamento',r&&r.aviso?r.aviso:'Fechadas. O valor ficou congelado para pagamento.',r&&r.aviso?'bad':'good');abrir('gestao-fechamento');}catch(e){aviso('gestao-fechamento',e.message,'bad');}}),button('Recibo por gestor',()=>recibo(d)));
  box.append(bar,tabela([{label:'Fechar',value:marcar},{label:'Operação',value:o=>o.operacao},{label:'Gestor',value:o=>o.gestor||'sem gestor'},{label:'Paga',value:pagaChk},{label:'Regra',value:regraSel},
   {label:'Teto %',value:tetoIn},{label:'Liquidado',num:true,value:o=>com(o).liquidado_pct!=null?pct(com(o).liquidado_pct):'—'},{label:'Bônus',num:true,value:o=>brl(com(o).bonus_final_rs),neg:o=>!paga(o)},{label:'Situação',value:situ},{label:'Pago em',value:pagoIn},{label:'',value:reabrirBt}],ops,'Sem comissão calculada para este mês.'));
  corpo.append(box);
  if(d.fechamentos?.length){const h=block('Pedidos de fechamento','Os mais recentes primeiro.');h.append(tabela([{label:'Pedido em',value:c=>data(c.criado_em)},{label:'Mês',value:c=>String(c.demanda_id||'').replace('comissao|','')},{label:'Operações',value:c=>String(c.anuncio||'').split('\n').length},{label:'Situação',value:c=>c.estado},{label:'Resultado',value:c=>c.resultado||''}],d.fechamentos));corpo.append(h);}
  async function salvarRegra(o,mud){const r=o.regra||{};const corpo={desde:mes,operacao:o.operacao,paga:'paga' in mud?mud.paga:r.paga!==false,teto:'teto' in mud?mud.teto:(r.teto??''),regra:mud.regra||r.regra||'metas',pct_lucro:'pct_lucro' in mud?mud.pct_lucro:(r.pct_lucro??''),rateio_desde:r.rateio_desde||''};
   try{await api('/api/gestao/regra',corpo);aviso('gestao-fechamento',o.operacao+': regra salva a partir de '+mesNome(mes)+'. Entra no próximo cálculo.','good');abrir('gestao-fechamento');}catch(e){aviso('gestao-fechamento',e.message,'bad');abrir('gestao-fechamento');}}
 }
 function recibo(d){const por={};for(const o of d.operacoes){const c=o.comissao;if(!c||!c.fechado_em||o.regra?.paga===false||c.paga==='não')continue;const g=o.gestor||'sem gestor';(por[g]=por[g]||[]).push(o);}
  let dlg=$('gs-recibo');if(!dlg){dlg=el('dialog','ger-dialog gs-recibo');dlg.id='gs-recibo';document.body.append(dlg);}dlg.replaceChildren();
  const h=el('header');h.append(el('h2','','Recibo de comissão · '+mesNome(d.mes)),button('Imprimir',()=>window.print()),button('Fechar',()=>dlg.close()));dlg.append(h);
  const nomes=Object.keys(por).sort();if(!nomes.length)dlg.append(note('Nenhuma operação fechada e paga neste mês.'));
  for(const g of nomes){const L=por[g],tot=L.reduce((s,o)=>s+(+o.comissao.bonus_final_rs||0),0);const sec=block(g+' · '+brl(tot),L.length+' operação(ões) fechada(s).');
   sec.append(tabela([{label:'Operação',value:o=>o.operacao},{label:'Regra',value:o=>o.comissao.regra||'metas'},{label:'Faturamento',num:true,value:o=>brl(o.comissao.faturamento)},{label:'Margem',num:true,value:o=>brl(o.comissao.margem_cont)},{label:'Metas',num:true,value:o=>pct(o.comissao.progresso_metas)},{label:'Bônus',num:true,value:o=>brl(o.comissao.bonus_final_rs)},{label:'Fechada em',value:o=>data(o.comissao.fechado_em).slice(0,10)}],L));dlg.append(sec);}
  dlg.showModal();}

 // ── 3. CUSTOS recorrentes ──
 async function custos(p){const mes=S.mes.c||hoje();S.mes.c=mes;
  const top=el('div','ger-controls');top.append(selectMes('gs-c-mes',ultimos(14,mesMais(hoje(),1)),mes,v=>{S.mes.c=v;abrir('gestao-custos');}),button('Novo custo',()=>editar(null)),button('Publicar na DRE',publicar));p.append(top);
  const corpo=el('div');corpo.append(note('Carregando…'));p.append(corpo);
  let d;try{d=await api('/api/gestao/custos?mes='+mes);}catch(e){corpo.replaceChildren(note('Não foi possível carregar: '+e.message));return;}S.dados.c=d;
  const itens=d.itens,soma=f=>itens.filter(f).reduce((s,i)=>s+i.valor_mes,0),est=itens.filter(i=>i.status==='estimado');
  corpo.replaceChildren(cards(card('Custos do mês',brl(soma(i=>!i.comissao)),itens.length+' lançamentos. Comissões fora do total.'),card('A confirmar',brl(soma(i=>i.status==='estimado')),est.length?est.length+' variáveis estimados pelo último valor.':'Nada a confirmar.'),
   card('Compartilhado Ponto 1',brl(soma(i=>i.empresa==='Ponto 1 (compartilhado)')),'Rateado entre as empresas do Ponto 1 na DRE.'),card('Compartilhado Ponto 2',brl(soma(i=>i.empresa==='Ponto 2 (compartilhado)')),'Rateado no Ponto 2.')));
  const valorIn=i=>{const w=el('span','gs-inline');const v=el('input','gs-num');v.type='number';v.step='0.01';v.min='0';v.value=String(i.valor_mes);v.setAttribute('aria-label','Valor de '+i.descricao+' em '+mesNome(mes));
   const b=button(i.status==='confirmado'?'Salvar':'Confirmar',async()=>{try{S.dados.c=await api('/api/gestao/custo-mes',{mes,custo_id:i.id,valor:v.value});aviso('gestao-custos',i.descricao+': valor de '+mesNome(mes)+' confirmado.','good');abrir('gestao-custos');}catch(e){aviso('gestao-custos',e.message,'bad');}});w.append(v,b);return w;};
  const sit={fixo:'Fixo',estimado:'Estimado — confirmar',confirmado:'Confirmado'};
  const grupos=[...new Set(itens.map(i=>i.empresa))];
  for(const g of grupos){const L=itens.filter(i=>i.empresa===g);const b=block(g+' · '+brl(L.filter(i=>!i.comissao).reduce((s,i)=>s+i.valor_mes,0)));
   b.append(tabela([{label:'Descrição',value:i=>i.descricao+(i.comissao?' (comissão)':'')},{label:'Categoria',value:i=>i.categoria||''},{label:'Tipo',value:i=>({fixo:'Fixo',variavel:'Variável',pontual:'Pontual'})[i.tipo]},
    {label:'Valor do mês',value:valorIn},{label:'Situação',value:i=>sit[i.status]||i.status},{label:'Vigência',value:i=>(i.desde||'')+(i.ate?' a '+i.ate:' em diante')},{label:'Cadastro',value:i=>button('Editar',()=>editar(i))}],L));corpo.append(b);}
  if(!itens.length)corpo.append(note('Nenhum custo ativo neste mês. Use Novo custo ou importe a planilha (gestao-sync.js --importar-planilha).'));
  function publicar(){const de=prompt('Publicar na DRE de qual mês (AAAA-MM)?','2026-01');if(!de)return;const ate=prompt('Até qual mês (AAAA-MM)?',hoje());if(!ate)return;
   api('/api/gestao/custos-dre',{de,ate}).then(r=>aviso('gestao-custos','DRE atualizada: '+r.meses.length+' meses ('+de+' a '+ate+').','good')).catch(e=>aviso('gestao-custos',e.message,'bad'));}
  function editar(i){let dlg=$('gs-custo');if(!dlg){dlg=el('dialog','ger-dialog');dlg.id='gs-custo';document.body.append(dlg);}dlg.replaceChildren();const f=el('form','gs-form');f.method='dialog';
   const campo=(nome,label,valor,tipo='text')=>{const x=el('input');x.name=nome;x.type=tipo;x.value=valor??'';if(tipo==='number'){x.step='0.01';x.min='0';}return control(label,x);};
   const sel=(nome,label,ops,valor)=>{const s=el('select');s.name=nome;for(const[v,t]of ops)s.append(new Option(t,v));s.value=valor;return control(label,s);};
   const com=el('input');com.type='checkbox';com.name='comissao';com.checked=!!i?.comissao;
   f.append(el('h2','',i?'Editar custo':'Novo custo'),campo('descricao','Descrição',i?.descricao),sel('empresa','Empresa ou ponto',d.empresas.map(e=>[e,e]),i?.empresa||'Ponto 1 (compartilhado)'),campo('categoria','Categoria',i?.categoria),
    sel('tipo','Tipo',[['fixo','Fixo'],['variavel','Variável (estimado até confirmar)'],['pontual','Pontual']],i?.tipo||'fixo'),campo('valor','Valor',i?.valor,'number'),campo('dia','Dia do vencimento',i?.dia,'number'),
    campo('desde','Vale a partir de (AAAA-MM)',i?.desde||mes),campo('ate','Até (AAAA-MM, vazio = em diante)',i?.ate||''),control('É comissão (fica fora da DRE e do lucro)',com),
    note(i?'Reajuste: para manter o histórico, preencha o fim deste cadastro no mês anterior e crie um novo com o valor novo.':'O custo se repete sozinho nos próximos meses conforme o tipo.'));
   const acoes=el('div','ger-controls');acoes.append(button('Salvar',async()=>{const v=Object.fromEntries(new FormData(f));v.comissao=com.checked;v.mes=mes;if(i)v.id=i.id;try{await api('/api/gestao/custo',v);dlg.close();aviso('gestao-custos','Custo salvo.','good');abrir('gestao-custos');}catch(e){alert(e.message);}}),button('Cancelar',()=>dlg.close()));f.append(acoes);dlg.append(f);dlg.showModal();}
 }

 // ── 2. CARTEIRAS por mês ──
 async function carteiras(p){const mes=S.mes.k||mesMais(hoje(),1);S.mes.k=mes;
  const top=el('div','ger-controls');top.append(selectMes('gs-k-mes',[...ultimos(6,mesMais(hoje(),3))],mes,v=>{S.mes.k=v;abrir('gestao-carteiras');}));p.append(top);
  const corpo=el('div');corpo.append(note('Carregando…'));p.append(corpo);
  let d;try{d=await api('/api/gestao/estado?mes='+mes);}catch(e){corpo.replaceChildren(note('Não foi possível carregar: '+e.message));return;}
  const box=block('Responsáveis a partir de '+mesNome(mes),'Troque o gestor e salve. Os meses anteriores ficam com o responsável de cada um.');
  const gestorSel=o=>{const w=el('span','gs-inline'),s=el('select');s.setAttribute('aria-label','Gestor de '+o.operacao);s.append(new Option('Sem gestor',''));for(const g of d.gestores)s.append(new Option(g,g));s.value=o.gestor||'';
   const b=button('Salvar',async()=>{try{await api('/api/gestao/carteira',{desde:mes,empresa:o.empresa,marketplace:o.marketplace,gestor:s.value});aviso('gestao-carteiras',o.operacao+': '+(s.value||'sem gestor')+' a partir de '+mesNome(mes)+'.','good');abrir('gestao-carteiras');}catch(e){aviso('gestao-carteiras',e.message,'bad');}});w.append(s,b);return w;};
  box.append(tabela([{label:'Operação',value:o=>o.operacao},{label:'Responsável',value:gestorSel}],d.operacoes));
  const hist=block('Histórico de trocas','Cada linha vale do mês indicado em diante, até a próxima troca da mesma operação.');
  hist.append(tabela([{label:'A partir de',value:r=>mesNome(r.desde)},{label:'Operação',value:r=>r.empresa+' · '+r.marketplace},{label:'Responsável',value:r=>r.gestor||'sem gestor'},{label:'Por',value:r=>r.por||''},{label:'Em',value:r=>data(r.em)}],d.historico));
  corpo.replaceChildren(box,hist);
 }
})();
