"use strict";
(() => {
  const embedded=window.parent!==window;let requestedSection='catalog',starting=0,hostPoint='',hostIdentity='',resultPoint='';document.body.classList.toggle('bc-embedded',embedded);
  const $=id=>document.getElementById(id);let token='',access=null,mode='catalog',page=1,total=0,request=0,view='table',linkId='',linkPage=1,linkRequest=0,accessData=null,pendingLogin=null,compareId='',comparePage=1,compareRequest=0;
  const logisticsLabels={nao_informada:'Logística não informada',incompleta:'Logística incompleta',a_conferir:'Logística a conferir',conferida:'Logística conferida'};
  const labels={aguardando_custo:'Aguardando custo',aguardando_vinculo:'Aguardando vínculo',em_revisao:'Em revisão',divergencia_legada:'Divergência de fonte',composicao_pendente:'Composição pendente',composicao_desatualizada:'Recalcular composição',importado:'Importado · revisar',rascunho:'Em revisão',aprovado:'Aprovado',rejeitado:'Rejeitado'};
  const structure=code=>({S:'Simples',K:'Kit',V:'Com variações',F:'Fabricado',M:'Matéria-prima'}[String(code||'').toUpperCase()]||'A conferir');
  const variation=code=>({N:'Normal',P:'Pai',V:'Variação'}[String(code||'').toUpperCase()]||'Não informado');
  const money=c=>c==null?'Não informado':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(c)/100);
  function el(tag,text,cls){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;}
  const dashboard=el('section',null,'catalog-dashboard');dashboard.id='catalog-dashboard';dashboard.hidden=true;$('filters').before(dashboard);const pendingLogistics=el('option','Para conferir (todas)');pendingLogistics.value='pendentes';$('logistics-type').append(pendingLogistics);
  function focusCatalog({section='catalog',ncm='',logistica='',pendencia=''}={}){mode=section;page=1;$('search').value='';$('ncm-type').value=ncm;$('logistics-type').value=logistica;$('task-type').value=pendencia||'todas';load();}
  function drawDashboard(data){dashboard.replaceChildren(el('h2','Painel do ponto · '+data.ponto),el('p','Totais do cadastro do ponto. Busca e filtros abaixo refinam a lista; um produto pode ter mais de uma pendência.','subtle'));const grid=el('div',null,'product-kpis'),add=(title,value,copy,action,tone='neutral')=>{const card=el('article',null,'product-kpi '+tone);card.append(el('h3',title),el('strong',Number(value||0).toLocaleString('pt-BR')),el('p',copy,'subtle'));if(action){const b=el('button','Ver cadastros','quiet');b.onclick=action;b.disabled=!value;card.append(b);}grid.append(card);};const o=data.operacional;add('Cadastros no ponto',o.total,'Fichas do catálogo, sem somar unidades de estoque.',()=>focusCatalog());add('Logística conferida',o.conferidos,'Conferência registrada; não comprova saldo de estoque.',()=>focusCatalog({logistica:'conferida'}),'confirmed');add('Logística para conferir',o.para_conferir,'Inclui ficha incompleta, não informada ou a conferir.',()=>focusCatalog({logistica:'pendentes'}),'pending');add('NCM não informado',o.sem_ncm,'Conferir o cadastro fiscal e a ficha na Olist.',()=>focusCatalog({ncm:'missing'}),'pending');dashboard.append(grid);
    if(data.custos){const c=data.custos,issues=c.pendencias,privateGrid=el('div',null,'product-kpis');dashboard.append(el('h3','Pendências financeiras do ponto'));for(const [title,value,copy,action]of [['Custo a informar',issues.aguardando_custo||0,'Compradora ou pessoa autorizada complementa o custo.',()=>focusCatalog({section:'tasks',pendencia:'aguardando_custo'})],['Custos em revisão',issues.em_revisao||0,'Revisões aguardando a decisão de uma pessoa autorizada.',()=>focusCatalog({section:'tasks',pendencia:'em_revisao'})],['Composições para conferir',issues.composicao_pendente||0,'Produtos com composição de custo ainda pendente.',()=>focusCatalog({section:'tasks',pendencia:'composicao_pendente'})],['Entradas a vincular',c.entradas_a_vincular,'Compras ainda sem vínculo confirmado com uma ficha.',()=>focusCatalog({section:'entries'})]]){const card=el('article',null,'product-kpi pending');card.append(el('h3',title),el('strong',Number(value).toLocaleString('pt-BR')),el('p',copy,'subtle'));const b=el('button','Abrir pendências','quiet');b.onclick=action;b.disabled=!value;card.append(b);privateGrid.append(card);}if(issues.composicao_desatualizada){const stale=el('button','Ver '+issues.composicao_desatualizada+' composições desatualizadas','quiet');stale.onclick=()=>focusCatalog({section:'tasks',pendencia:'composicao_desatualizada'});privateGrid.append(stale);}dashboard.append(privateGrid,el('p','Aprovar uma revisão não define sozinha sua vigência. Confira as datas na ficha. Insumos e composições são cadastros diferentes; o padrão de embalagens informado vale somente para Bsan.','subtle'));}
  }

  const retry=el('button','Tentar novamente','quiet');retry.id='retry-load';retry.hidden=true;$('message').after(retry);
  retry.onclick=()=>{if(access)load().catch(showError);else if(token)start(token);};
  function message(s){$('message').textContent=s||'';$('message').hidden=!s;if(!s)retry.hidden=true;}
  function showError(e){message(e.message||String(e));retry.hidden=false;}
  function emitState(){if(embedded&&access)parent.postMessage({type:'bsan-produtos-state',section:mode,busy:!!document.querySelector('dialog[open]'),access:{ponto:$('point').value,pontos:access.pontos,financeiro:access.financeiro,administrar:access.administrar}},location.origin);}
  function setPoint(p){if(access?.pontos.includes(p)){$('point').value=p;emitState();}}
  function clearSensitive(){dashboard.replaceChildren();dirtyForms.clear();for(const d of document.querySelectorAll('dialog[open]'))d.close();for(const id of ['detail-body','table-body','cards','review-items','review-list','review-preview','review-detail-summary','sales-items','sales-list','sales-summary','pack-body','pack-list','material-body','material-list','composition-body','effective-body','publication-panel'])$(id)?.replaceChildren();$('count').textContent='';resultPoint='';}
  function options(id,points){const select=$(id);if([...select.options].map(o=>o.value).join('|')!==points.join('|'))select.replaceChildren(...points.map(p=>{const o=el('option',p);o.value=p;return o;}));}
  const permissionKey=value=>JSON.stringify(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,Array.isArray(v)?[...v].sort():v]));
  const dirtyForms=new Set();
  function hasDraft(){for(const form of dirtyForms)if(!form.isConnected||form.closest('dialog')&&!form.closest('dialog').open)dirtyForms.delete(form);return !!document.querySelector('dialog[open]')||dirtyForms.size>0||mode==='review'&&!$('review-form').hidden;}
  function markDraft(e){const form=e.target.closest?.('form');if(form&&form.id!=='filters'&&!form.id.endsWith('search'))dirtyForms.add(form);}
  document.addEventListener('input',markDraft,true);document.addEventListener('change',markDraft,true);document.addEventListener('reset',e=>dirtyForms.delete(e.target),true);
  async function api(url,options={}){const usedToken=token,r=await fetch('/api/produtos'+url,{...options,cache:'no-store',headers:{'Authorization':'Bearer '+token,...options.headers}});const d=await r.json();
    if(!r.ok){if(r.status===401&&usedToken===token){token='';$('workspace').hidden=true;$('login').hidden=embedded;if(embedded)parent.postMessage({type:'bsan-produtos-expired'},location.origin);}throw Object.assign(new Error(d.erro||'Não foi possível concluir.'),{status:r.status});}return d;}
  const publicationUI=window.ProdutosPublicacao.create({el,api,post:(url,data)=>post(url,data),getPoint:()=>$('point').value,onError:showError});
  const post=async(url,data)=>{const result=await api(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});dirtyForms.clear();return result;};
  const costUI=window.ProdutosCustos.create({el,api,post,money,getAccess:()=>access,getPoint:()=>$('point').value,setPoint,onSaved:()=>load(),onError:showError,onCompositionClose:id=>detail(id).catch(showError)});
  const packUI=window.ProdutosEmbalagens.create({el,api,post,money,getAccess:()=>access,getPoint:()=>$('point').value,setPoint,onError:showError});
  const prepUI=window.ProdutosFichasEmbalagem.create({el,api,post,getAccess:()=>access,getPoint:()=>$('point').value,setPoint,onPrepared:(r,id)=>packUI.openPrepared(r,id),onError:showError});
  const salesUI=window.ProdutosApuracao.create({el,api,money,getAccess:()=>access,onError:showError});
  const reviewUI=window.ProdutosConferencia.create({el,api,post,money,getAccess:()=>access});
  const effectiveUI=window.ProdutosVigencia.create({el,api,post,money,getAccess:()=>access,onError:showError,onClose:id=>detail(id).catch(showError)});
  function filters(){const q=new URLSearchParams({ponto:$('point').value,q:$('search').value,page:String(page),pageSize:'30'});
    if(mode!=='entries'){q.set('match',$('search-mode').value);if($('ncm-type').value)q.set('ncm',$('ncm-type').value);if($('logistics-type').value)q.set('logistica',$('logistics-type').value);if(mode==='tasks')q.set('pendencia',$('task-type').value);}return q;}
  function showView(){const cards=view==='cards'&&mode!=='entries';$('cards').hidden=!cards;document.querySelector('.table-wrap').hidden=cards;
    $('view-toggle').textContent=cards?'Ver tabela':'Ver cartões';$('view-toggle').setAttribute('aria-pressed',String(cards));}
  async function start(t,{refresh=false}={}){const generation=++starting,previous=access,selected=$('point').value,oldMode=mode;token=t;let next;
    try{next=await api('/acesso');}catch(e){if(generation!==starting)return;if(e.status===403){clearSensitive();access=null;$('workspace').hidden=true;if(embedded)parent.postMessage({type:'bsan-produtos-state',section:'catalog',access:{ponto:'',pontos:[],financeiro:[],administrar:false}},location.origin);}else if(token){access=previous;$('workspace').hidden=!previous;}showError(e);return;}
    if(generation!==starting)return;const changed=!!previous&&permissionKey(previous)!==permissionKey(next);if(changed)clearSensitive();access=next;$('login').hidden=true;$('workspace').hidden=false;$('logout').hidden=false;
    options('point',access.pontos);if(access.pontos.includes(hostPoint))$('point').value=hostPoint;else if(access.pontos.includes(selected))$('point').value=selected;
    options('entry-point',access.editar);
    $('new-entry').hidden=!access.editar.length;$('session').textContent=access.administrar?'Direção':access.financeiro.length?'Cadastro de custos':'Consulta operacional';
    $('accesses-tab').hidden=!access.administrar;$('sync-tab').hidden=!access.administrar;$('publication-tab').hidden=!access.administrar||!access.financeiro.length;$('review-tab').hidden=!access.administrar||!access.financeiro.length;$('sales-tab').hidden=!access.administrar||!access.financeiro.length;
    if(!access.pontos.length)message('Seu acesso a Produtos ainda não foi atribuído. Peça à direção a liberação do ponto.');
    if(embedded)mode=requestedSection;
    if(!previous||changed||oldMode!==mode||selected!==$('point').value||refresh&&!hasDraft()){try{await load();}catch(e){showError(e);}}
    else emitState();
  }
  async function load({scan=false}={}){if(!access)return;const req=++request,p=$('point').value,financial=access.financeiro.includes(p);dashboard.hidden=!['catalog','tasks','entries'].includes(mode);dashboard.replaceChildren();
    $('tasks-tab').hidden=!financial;$('entries-tab').hidden=!financial;$('materials-tab').hidden=!financial;$('pack-tab').hidden=!financial;$('new-entry').hidden=!access.editar.includes(p);
    if(!financial&&!['catalog','prep',...(access.administrar?['sync','accesses']:[])].includes(mode))mode='catalog';
    emitState();
    if(!p){$('empty').textContent='Seu acesso a Produtos ainda não foi atribuído. Solicite a liberação do ponto à Direção.';$('empty').hidden=false;return;}
    $('catalog-tab').classList.toggle('selected',mode==='catalog');$('tasks-tab').classList.toggle('selected',mode==='tasks');$('entries-tab').classList.toggle('selected',mode==='entries');
    const adminMode=['accesses','sync','materials','review','sales','pack','prep','publication'].includes(mode);$('accesses-tab').classList.toggle('selected',mode==='accesses');$('sync-tab').classList.toggle('selected',mode==='sync');$('materials-tab').classList.toggle('selected',mode==='materials');$('review-tab').classList.toggle('selected',mode==='review');$('review-panel').hidden=mode!=='review';
    $('admin-panel').hidden=mode!=='accesses';$('sync-panel').hidden=mode!=='sync';$('materials-panel').hidden=mode!=='materials';$('pack-tab').classList.toggle('selected',mode==='pack');$('pack-panel').hidden=mode!=='pack';$('sales-tab').classList.toggle('selected',mode==='sales');$('sales-panel').hidden=mode!=='sales';
    $('prep-tab').classList.toggle('selected',mode==='prep');$('prep-panel').hidden=mode!=='prep';$('publication-panel').hidden=mode!=='publication';$('publication-tab').classList.toggle('selected',mode==='publication');
    for(const id of ['filters','results-heading'])$(id).hidden=adminMode;
    if(adminMode){$('new-entry').hidden=true;$('cards').hidden=true;$('scan-hint').hidden=true;$('pagination').hidden=true;$('empty').hidden=true;document.querySelector('.table-wrap').hidden=true;message('');
      for(const id of ['review-point','sales-point'])if([...$(id).options].some(o=>o.value===p))$(id).value=p;
      if(mode==='publication'){await publicationUI.show();return;}
      if(mode==='materials'){try{await costUI.showMaterials();}catch(e){showError(e);}return;}
      if(mode==='prep'){try{await prepUI.show();}catch(e){showError(e);}return;}
      if(mode==='pack'){try{await packUI.show();}catch(e){showError(e);}return;}
      if(mode==='sales'){try{await salesUI.show();}catch(e){showError(e);}return;}
      if(mode==='review'){try{await reviewUI.show();}catch(e){showError(e);}return;}
      try{if(mode==='accesses'){const d=await api('/acessos');if(req!==request)return;accessData=d;const previous=$('access-user').value;
        $('access-user').replaceChildren(...d.usuarios.map(u=>{const o=el('option',u.nome+' · '+u.perfil+(u.ativo?'':' · inativo'));o.value=u.id;return o;}));if(d.usuarios.some(u=>u.id===previous))$('access-user').value=previous;renderGrants();}
        else{const d=await api('/integracoes');if(req!==request)return;renderSync(d);}}catch(e){if(req===request)showError(e);}return;}
    $('task-filter').hidden=mode!=='tasks';$('subtitle').textContent=financial?'Cadastro operacional, custos e pendências do ponto.':'Informações operacionais sincronizadas da Olist.';
    for(const id of ['match-filter','ncm-filter','logistics-filter','view-toggle','export'])$(id).hidden=mode==='entries';
    $('scan-hint').hidden=mode==='entries'||$('search-mode').value!=='exact';showView();
    if(resultPoint!==p){$('table-body').replaceChildren();$('cards').replaceChildren();$('count').textContent='';$('empty').textContent='Carregando o cadastro de '+p+'…';$('empty').hidden=false;}
    $('loading').hidden=false;message('');
    try{
      const q=filters();
      const [listing,overview]=await Promise.allSettled([api(mode==='entries'?'/entradas?'+q:'?'+q),api('/resumo?'+new URLSearchParams({ponto:p}))]);if(req!==request)return;if(listing.status!=='fulfilled')throw listing.reason;const d=listing.value;if(overview.status==='fulfilled')drawDashboard(overview.value);else{dashboard.append(el('p','Painel do ponto indisponível: '+overview.reason.message+'. A lista consultada permanece abaixo.','subtle'));const retrySummary=el('button','Tentar painel novamente','quiet');retrySummary.onclick=()=>load();dashboard.append(retrySummary);}
      const entries=mode==='entries';total=d.total??d.items.length;resultPoint=p;
      const titles=entries?['Produto / SKU','Origem','CTP informado','Situação','']:['Produto / SKU','Ponto','Estrutura',...(financial?['Última versão de custo']:[]),''];
      const head=el('tr');titles.forEach(t=>head.append(el('th',t)));$('table-head').replaceChildren(head);$('table-body').replaceChildren();$('cards').replaceChildren();
      for(const item of d.items){const tr=el('tr'),name=el('td');name.append(el('div',item.nome,'name'),el('div',item.sku||'SKU ainda não informado','sku'));if(!entries)name.append(el('span',logisticsLabels[item.logistica_estado]||'Logística não informada','tag '+(item.logistica_estado==='conferida'?'approved':'')));tr.append(name);
        if(entries){tr.append(el('td',item.fonte==='manual'?'Entrada de compra':'Importação legada'),el('td',money(item.total_centavos),'money'),el('td','Aguardando vínculo'));const td=el('td'),b=el('button','Conferir vínculo','quiet');b.onclick=()=>openLink(item.id);td.append(b);tr.append(td);}
        else{tr.append(el('td',item.ponto),el('td',structure(item.tipo)));
          if(financial){const c=el('td');if(item.custo){c.append(el('div',money(item.custo.total_centavos),'money'),el('span',labels[item.custo.estado]||item.custo.estado,'tag '+(item.custo.estado==='aprovado'?'approved':'pending')));}
            else c.append(el('span',item.pendencias?.some(x=>x.tipo==='aguardando_vinculo')?'Aguardando vínculo':'Aguardando custo','tag pending'));if(item.custo?.recalculo_pendente)c.append(el('span','Recalcular composição','tag pending'));tr.append(c);}
          const action=el('td'),button=el('button','Abrir ficha','quiet');button.onclick=()=>detail(item.id).catch(showError);action.append(button);tr.append(action);
          const card=el('article',null,'product-card');if(item.detalhes?.foto){const img=el('img',null,'card-photo');img.src=item.detalhes.foto;img.alt='';img.loading='lazy';img.referrerPolicy='no-referrer';card.append(img);}
          card.append(el('h3',item.nome),el('p',item.sku,'sku'),el('p',structure(item.tipo)+' · '+item.ponto,'subtle'),el('p','NCM: '+(item.ncm||'Não informado'),'subtle'),el('p',logisticsLabels[item.logistica_estado]||'Logística não informada','subtle'));
          if(financial)card.append(el('p',item.custo?'Último custo: '+money(item.custo.total_centavos)+' · '+(labels[item.custo.estado]||item.custo.estado):'Custo não informado','money'));
          const cb=el('button','Abrir ficha','quiet');cb.onclick=()=>detail(item.id).catch(showError);card.append(cb);$('cards').append(card);}
        $('table-body').append(tr);}
      $('count').textContent=entries?`${total.toLocaleString('pt-BR')} entradas aguardando vínculo`:`${total.toLocaleString('pt-BR')} produtos encontrados`;
      $('empty').hidden=d.items.length>0;$('empty').textContent=entries?'Nenhuma entrada aguardando vínculo neste ponto.':mode==='tasks'?'Nenhuma pendência deste tipo no ponto.':'Nenhum produto encontrado. Confira o ponto e a busca.';
      $('pagination').hidden=false;$('previous').disabled=page<=1;$('next').disabled=page*30>=total;$('page-info').textContent=`Página ${page} de ${Math.max(1,Math.ceil(total/30))}`;
      if(scan&&!entries&&$('search-mode').value==='exact'&&$('search').value&&total===1)await detail(d.items[0].id);
    }catch(e){if(req===request){$('table-body').replaceChildren();$('cards').replaceChildren();dashboard.replaceChildren();$('count').textContent='';$('empty').textContent='Consulta de '+p+' não confirmada. Tente novamente.';$('empty').hidden=false;showError(e);}}finally{if(req===request)$('loading').hidden=true;}}
  async function detail(pid){const d=await api('/'+pid);const box=$('detail-body');box.replaceChildren();$('detail-title').textContent=d.nome;
    if(d.detalhes?.foto){const photo=el('img',null,'product-photo');photo.src=d.detalhes.foto;photo.alt=d.nome;photo.referrerPolicy='no-referrer';photo.loading='lazy';box.append(photo);}
    const facts=el('div',null,'facts');for(const [label,value] of [['SKU',d.sku],['GTIN',d.gtin||'Não informado'],['Ponto',d.ponto],['Estrutura',structure(d.tipo)],['Nível de variação',variation(d.tipo_variacao)],['Situação',d.situacao],['NCM',d.ncm||'Não informado'],['Categoria',d.categoria||'Não informada'],['Data original',d.data_original||'Não informada'],['Atualização da ficha',new Date(d.atualizado_em).toLocaleString('pt-BR')]]){
      const f=el('div',null,'fact');f.append(el('span',label),el('div',value));facts.append(f);}box.append(facts);
    const copies=el('div',null,'copy-actions');for(const [label,value] of [['Copiar SKU',d.sku],['Copiar GTIN',d.gtin],['Copiar NCM',d.ncm]])if(value){const button=el('button',label,'quiet');button.onclick=()=>navigator.clipboard.writeText(value).then(()=>{button.textContent='Copiado';}).catch(()=>{button.textContent='Selecione e copie o campo acima';});copies.append(button);}box.append(copies);
    if(d.detalhes)box.append(el('p','Detalhes coletados: '+(d.detalhes.fonte_coletada_em?new Date(d.detalhes.fonte_coletada_em).toLocaleString('pt-BR'):'data de origem não informada'),'subtle'));
    for(const v of d.vinculos||[])box.append(el('p',`${v.conta} · ID Olist ${v.erp_id}`,'subtle'));
    box.append(logisticsSection(d));
    if(d.correspondencias?.length){const section=el('section',null,'section');section.append(el('h3','Correspondências confirmadas'));for(const p of d.correspondencias)section.append(el('p',p.sku+' · '+p.nome+' · '+p.vinculos.map(v=>v.conta+' / '+v.erp_id).join(', ')));box.append(section);}
    if(access.administrar){const compare=el('button','Comparar cadastros','secondary');compare.onclick=()=>{$('detail').close();openComparison(pid);};box.append(compare);}
    if(d.custos){const section=el('section',null,'section');section.append(el('h3','Custos e revisão'),el('p','Versões cadastradas. Consulte Vigência e custo na data para identificar qual valor vale para uma venda.','subtle'));
      const composition=el('button','Composição de custo','secondary');composition.onclick=()=>{$('detail').close();costUI.openComposition(pid).catch(showError);};section.append(composition);
      const effective=el('button','Vigência e custo na data','secondary');effective.onclick=()=>{$('detail').close();effectiveUI.open(pid).catch(showError);};section.append(effective);
      if(!d.custos.length)section.append(el('p','Custo ainda não informado. A pendência está na fila da compradora.'));
      for(const c of d.custos.slice(0,5)){const r=el('div',null,'record');r.append(el('strong',`${money(c.total_centavos)} · versão ${c.versao}`),el('span',' '+(labels[c.estado]||c.estado),'tag'),el('p',c.observacao));for(const pack of c.embalagens||[])r.append(el('p','Embalagem: '+pack.codigo+' · '+pack.nome+' · v'+pack.versao,'subtle'));section.append(r);}box.append(section);
      for(const pending of d.pendencias.filter(x=>x.estado==='aberta'))box.append(el('p',(labels[pending.tipo]||pending.tipo)+': '+pending.detalhe,'subtle'));
      for(const c of d.candidatos||[]){const r=el('div',null,'record');r.append(el('p','Entrada candidata: '+c.nome+' · '+c.sku));if(access.editar.includes(d.ponto)){const b=el('button','Conferir e vincular entrada','secondary');b.onclick=async()=>{if(!confirm('Confirma que esta entrada de compra pertence a este produto?'))return;try{await post('/entradas/'+c.id+'/vincular',{produto_id:pid});await detail(pid);await load();}catch(e){alert(e.message);}};r.append(b);}box.append(r);}
      if(access.editar.includes(d.ponto)){const form=el('form',null,'section');form.append(el('h3','Informar uma nova versão do custo'));
        for(const [key,label] of [['produto','Custo do produto (R$)'],['embalagem','Embalagem (R$)'],['observacao','Origem / motivo da alteração']]){const l=el('label',label),i=el('input');i.name=key;i.required=true;i.maxLength=key==='observacao'?1000:18;if(key!=='observacao')i.inputMode='decimal';else i.minLength=5;l.append(i);form.append(l);}
        const packagingCost=form.querySelector('[name=embalagem]'),packPicker=await packUI.picker(d.ponto,selected=>{packagingCost.disabled=!!selected;if(selected)packagingCost.value=(selected.custo_centavos/100).toFixed(2);});packagingCost.parentElement.before(packPicker.element);
        const save=el('button','Salvar para revisão');save.type='submit';form.append(save);
        form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{const pack=packPicker.read();await post('/'+pid+'/custos',{...Object.fromEntries(new FormData(form)),expectedVersion:d.custos[0]?.versao||0,...(pack?{embalagem_id:pack.id,embalagem_versao:pack.versao,expectedCompositionVersion:d.composicao_versao}:{} )});await detail(pid);await load();}catch(err){alert(err.message);}finally{save.disabled=false;}};box.append(form);}
      const latest=d.custos[0];if(latest&&latest.estado!=='aprovado'&&access.aprovar.includes(d.ponto)){const b=el('button','Aprovar custo conferido','secondary');b.onclick=async()=>{const obs=prompt('Descreva a conferência realizada (mínimo 5 caracteres):');if(obs===null)return;try{await post('/'+pid+'/aprovar',{expectedVersion:latest.versao,observacao:obs});await detail(pid);await load();}catch(e){alert(e.message);}};box.append(b);}}
    if(!$('detail').open)$('detail').showModal();}
  function logisticsSection(d){const section=el('section',null,'section logistics-section'),l=d.logistica;section.append(el('h3','Medidas e embalagem'),el('p',logisticsLabels[l?.estado]||'Logística não informada','tag '+(l?.estado==='conferida'?'approved':'pending')));if(!l?.origem){section.append(el('p','Aguardando os dados logísticos da Olist.'));return section;}
    const o=l.origem,n=l.normalizado,fmt=x=>x==null?'Não informado':new Intl.NumberFormat('pt-BR',{maximumFractionDigits:6}).format(x),facts=el('div',null,'facts');
    const values=n?[['Altura (cm)',n.altura_cm],['Largura (cm)',n.largura_cm],['Comprimento (cm)',n.comprimento_cm],['Diâmetro (cm)',n.diametro_cm],['Peso líquido (kg)',n.peso_liquido_kg],['Peso bruto (kg)',n.peso_bruto_kg]]:[['Altura',o.altura],['Largura',o.largura],['Comprimento',o.comprimento],['Diâmetro',o.diametro],['Peso líquido',o.pesoLiquido],['Peso bruto',o.pesoBruto]];
    if(!n)section.append(el('p','Valores importados da Olist. As unidades e a conferência ainda precisam ser confirmadas.','subtle'));
    for(const [label,value] of values.filter(([label])=>o.embalagem.tipo===3?!label.startsWith('Altura')&&!label.startsWith('Largura'):!label.startsWith('Diâmetro'))){const fact=el('div',null,'fact');fact.append(el('span',label),el('div',fmt(value)));facts.append(fact);}section.append(facts);
    section.append(el('p','Formato: '+({1:'Envelope',2:'Pacote / caixa',3:'Rolo / cilindro'}[o.embalagem.tipo]||'Não informado')+' · Embalagem: '+(o.embalagem.descricao||'Não identificada')));
    if(o.quantidadeVolumes)section.append(el('p','Volumes informados na origem: '+o.quantidadeVolumes,'subtle'));if(n?.cubagem_m3)section.append(el('p','Cubagem: '+fmt(n.cubagem_m3)+' m³','subtle'));
    for(const pending of l.pendencias)section.append(el('p',pending,'subtle'));
    if(l.pendencias.length)section.append(el('p','Complete ou corrija os dados na Olist e aguarde a atualização.'));
    if(l.conferencia)section.append(el('p','Conferido em '+new Date(l.conferencia.conferido_em).toLocaleString('pt-BR')+' · '+l.conferencia.observacao,'subtle'));
    if(access.conferir_logistica?.includes(d.ponto)&&!l.pendencias.length){const form=el('form',null,'section');form.append(el('h3',n?'Registrar nova conferência':'Conferir logística'));
      for(const [key,title,choices] of [['unidade_dimensao','Unidade das medidas',[['cm','Centímetros (cm)'],['mm','Milímetros (mm)'],['m','Metros (m)']]],['unidade_peso','Unidade do peso',[['kg','Quilogramas (kg)'],['g','Gramas (g)']]]]){const label=el('label',title),select=el('select');select.name=key;select.required=true;select.setAttribute('aria-label',title);const empty=el('option','Selecione a unidade da fonte');empty.value='';select.append(empty);for(const [v,t]of choices){const option=el('option',t);option.value=v;select.append(option);}label.append(select);form.append(label);}
      const note=el('label','Como foi feita a conferência'),input=el('input');input.name='observacao';input.required=true;input.minLength=5;input.maxLength=1000;note.append(input);form.append(note);
      const check=el('label','Conferi as medidas e o peso do pacote'),checkbox=el('input');checkbox.type='checkbox';checkbox.name='conferido';checkbox.required=true;check.prepend(checkbox);form.append(check);
      const save=el('button','Confirmar conferência logística');save.type='submit';form.append(save);const feedback=el('p',null,'message');feedback.hidden=true;form.append(feedback);
      form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await post('/'+d.id+'/conferir-logistica',{...Object.fromEntries(new FormData(form)),conferido:checkbox.checked,assinatura:l.assinatura,expectedVersion:l.versao});await detail(d.id);await load();}catch(err){feedback.textContent=err.message;feedback.hidden=false;}finally{save.disabled=false;}};section.append(form);}
    return section;}
  $('login-form').onsubmit=async e=>{e.preventDefault();message('');try{const current=$('password').value;const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('email').value,senha:current})});const d=await r.json();if(!r.ok)throw new Error(d.erro||'Confira o acesso.');$('password').value='';
    if(d.trocar){pendingLogin={token:d.token,current};$('password-form').reset();$('password-message').hidden=true;$('password-dialog').showModal();}else await start(d.token);}catch(err){showError(err);}};
  $('password-dialog').addEventListener('cancel',e=>e.preventDefault());$('cancel-password').onclick=()=>{pendingLogin=null;$('password-form').reset();$('password-dialog').close();};
  $('password-form').onsubmit=async e=>{e.preventDefault();if(!pendingLogin)return;const b=e.submitter;b.disabled=true;
    try{if($('new-password').value!==$('confirm-password').value)throw new Error('A confirmação precisa ser igual à nova senha.');
      const r=await fetch('/api/trocar-senha',{method:'POST',headers:{Authorization:'Bearer '+pendingLogin.token,'Content-Type':'application/json'},body:JSON.stringify({senha_atual:pendingLogin.current,senha_nova:$('new-password').value})});const d=await r.json();if(!r.ok)throw new Error(d.erro||'Não foi possível alterar a senha.');
      const saved=pendingLogin.token;pendingLogin=null;$('password-form').reset();$('password-dialog').close();await start(saved);
    }catch(err){$('password-message').textContent=err.message;$('password-message').hidden=false;}finally{b.disabled=false;}};
  async function openLink(id){linkId=id;linkPage=1;$('link-query').value='';$('link-candidates').replaceChildren();$('link-summary').replaceChildren();if(!$('link-dialog').open)$('link-dialog').showModal();await loadLink();}
  async function loadLink(){const req=++linkRequest;$('link-message').hidden=true;
    try{const d=await api('/entradas/'+linkId+'?'+new URLSearchParams({q:$('link-query').value,page:String(linkPage),pageSize:'15'}));if(req!==linkRequest)return;
      const e=d.entrada;$('link-summary').replaceChildren(el('strong',e.nome),el('p',(e.sku||'Sem SKU')+' · '+e.ponto+' · CTP '+money(e.total_centavos)));
      $('link-candidates').replaceChildren();$('link-count').textContent=d.total?`${d.total} candidatos · página ${d.page} de ${Math.ceil(d.total/d.pageSize)}`:'Nenhum candidato. Busque pelo nome ou SKU; se ainda não existir na Olist, mantenha a entrada aguardando vínculo.';
      $('link-previous').disabled=d.page<=1;$('link-next').disabled=d.page*d.pageSize>=d.total;
      for(const c of d.candidatos){const r=el('div',null,'record');r.append(el('strong',c.nome),el('p',c.sku+' · '+c.conta+' · ID Olist '+c.erp_id));
        const inspect=el('button','Abrir ficha','quiet');inspect.onclick=()=>{$('link-dialog').close();detail(c.id).catch(showError);};r.append(inspect);
        if(Number(c.tem_custo))r.append(el('p','Este produto já possui custo. Confira o histórico na ficha antes de alterar.','subtle'));
        if(access.editar.includes(e.ponto)&&e.estado==='aguardando_vinculo'){const b=el('button','Vincular a este produto','secondary');b.disabled=!!Number(c.tem_custo);
          b.onclick=async()=>{if(!confirm(`Vincular a compra “${e.nome}” ao produto “${c.nome}”, SKU ${c.sku}, conta ${c.conta}, ID ${c.erp_id}?`))return;b.disabled=true;
            try{await post('/entradas/'+e.id+'/vincular',{produto_id:c.id});$('link-dialog').close();await load();await detail(c.id);}catch(err){$('link-message').textContent=err.message;$('link-message').hidden=false;b.disabled=false;}};r.append(b);} $('link-candidates').append(r);}
    }catch(e){if(req===linkRequest){$('link-message').textContent=e.message;$('link-message').hidden=false;}}}
  $('link-search').onsubmit=e=>{e.preventDefault();linkPage=1;loadLink();};$('link-previous').onclick=()=>{linkPage--;loadLink();};$('link-next').onclick=()=>{linkPage++;loadLink();};$('close-link').onclick=()=>{$('link-dialog').close();linkRequest++;};
  $('filters').onsubmit=e=>{e.preventDefault();page=1;load({scan:true});};$('point').onchange=()=>{page=1;hostPoint=$('point').value;emitState();load();};
  $('search-mode').onchange=()=>{page=1;$('search').focus();$('search').select();load();};$('ncm-type').onchange=()=>{page=1;load();};$('logistics-type').onchange=()=>{page=1;load();};$('task-type').onchange=()=>{page=1;load();};
  $('view-toggle').onclick=()=>{view=view==='cards'?'table':'cards';showView();};
  $('export').onclick=async()=>{const b=$('export');b.disabled=true;try{const r=await fetch('/api/produtos/exportar?'+filters(),{cache:'no-store',headers:{Authorization:'Bearer '+token}});
    if(!r.ok){const e=await r.json();throw new Error(e.erro||'Não foi possível exportar.');}
    const href=URL.createObjectURL(await r.blob()),a=el('a');a.href=href;a.download='produtos-'+$('point').value.toLowerCase()+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
    message('Consulta exportada com os filtros e permissões do seu acesso.');}catch(e){showError(e);}finally{b.disabled=false;}};
  async function openComparison(id){compareId=id;comparePage=1;$('compare-query').value='';$('compare-candidates').replaceChildren();if(!$('compare-dialog').open)$('compare-dialog').showModal();await loadComparison();}
  function comparisonCard(p,title){const card=el('article',null,'admin-card');card.append(el('h3',title),el('strong',p.nome),el('p',p.sku+' · '+structure(p.tipo)),el('p','GTIN: '+(p.gtin||'Não informado'),'subtle'),el('p',p.vinculos.map(v=>v.conta+' · ID Olist '+v.erp_id).join(', '),'subtle'),el('p','Custo: '+(p.custo?money(p.custo.total_centavos)+' · '+(labels[p.custo.estado]||p.custo.estado):'Não informado'),'subtle'));return card;}
  async function loadComparison(){const req=++compareRequest;$('compare-message').hidden=true;
    try{const d=await api('/'+compareId+'/comparar?'+new URLSearchParams({q:$('compare-query').value,page:String(comparePage),pageSize:'10'}));if(req!==compareRequest)return;$('compare-candidates').replaceChildren();
      $('compare-count').textContent=d.total?`${d.total} candidatos · página ${d.page} de ${Math.ceil(d.total/d.pageSize)}`:'Sem candidatos por SKU/GTIN. Busque outro cadastro pelo nome ou código para comparar.';
      $('compare-previous').disabled=d.page<=1;$('compare-next').disabled=d.page*d.pageSize>=d.total;
      for(const item of d.items){const wrap=el('section',null,'comparison-item'),row=el('div',null,'comparison-row');row.append(comparisonCard(d.produto,'Cadastro de referência'),comparisonCard(item,'Cadastro candidato'));wrap.append(row,el('p',item.evidencias.length?item.evidencias.join(' · '):'Candidato localizado pela busca; identidade ainda não conferida.','subtle'));
        const states={mesmo_produto:'Correspondência confirmada',distintos:'Produtos distintos',revogada:'Decisão revogada',revisao_necessaria:'Cadastro alterado: conferir novamente'};if(item.relacao)wrap.append(el('p',states[item.relacao.estado]+' · '+item.relacao.observacao,'subtle'));
        const form=el('form'),decision=el('label','Decisão da conferência'),select=el('select');select.setAttribute('aria-label','Decisão da conferência');select.required=true;const opts=[['','Selecione após conferir'],['mesmo_produto','Mesmo produto físico'],['distintos','Produtos distintos'],...(item.relacao?[['revogada','Revogar decisão anterior']]:[])];for(const [v,t]of opts){const option=el('option',t);option.value=v;select.append(option);}decision.append(select);form.append(decision);
        const note=el('label','Motivo / evidência da decisão'),input=el('input');input.required=true;input.minLength=5;input.maxLength=1000;note.append(input);form.append(note);const save=el('button','Registrar decisão','secondary');save.type='submit';form.append(save);
        form.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{await post('/'+compareId+'/correspondencia',{produto_id:item.id,estado:select.value,observacao:input.value,expectedVersion:item.relacao?.versao||0,assinatura:d.produto.assinatura,assinatura_candidato:item.assinatura});await loadComparison();}catch(err){$('compare-message').textContent=err.message;$('compare-message').hidden=false;}finally{save.disabled=false;}};
        wrap.append(form);$('compare-candidates').append(wrap);}
    }catch(e){if(req===compareRequest){$('compare-message').textContent=e.message;$('compare-message').hidden=false;}}}
  $('compare-search').onsubmit=e=>{e.preventDefault();comparePage=1;loadComparison();};$('compare-previous').onclick=()=>{comparePage--;loadComparison();};$('compare-next').onclick=()=>{comparePage++;loadComparison();};$('close-compare').onclick=()=>{$('compare-dialog').close();compareRequest++;load();};
  function renderGrants(){const u=accessData?.usuarios.find(x=>x.id===$('access-user').value);$('access-grants').replaceChildren();$('access-message').hidden=true;if(!u)return;
    if(u.perfil==='direcao'){$('access-grants').append(el('p','Direção possui acesso administrativo aos dois pontos.'));return;}
    for(const p of accessData.pontos){const grant=accessData.acessos.find(g=>g.usuario_id===u.id&&g.ponto===p),form=el('form',null,'admin-card'),label=el('label','Permissão em '+p),select=el('select');select.setAttribute('aria-label','Permissão em '+p);
      const choices=[['0','Sem acesso'],['1','Consulta operacional'],...(!u.ativo||u.perfil==='estoque'?[]:[['2','Consulta de custos'],['3','Cadastro de custos'],['4','Aprovação de custos']])];
      for(const [v,l] of choices){const o=el('option',l);o.value=v;if(!u.ativo&&v!=='0')o.disabled=true;select.append(o);}
      const level=grant?.operacional?(u.perfil==='estoque'?1:grant.custo_aprovar?4:grant.custo_editar?3:grant.custo_ler?2:1):0;select.value=String(choices.some(c=>c[0]===String(level))?level:0);
      label.append(select);form.append(el('h3',p),label);if(!u.ativo)form.append(el('p','Usuário inativo: só é possível revogar as concessões.','subtle'));
      const b=el('button','Salvar acesso','secondary');b.type='submit';form.append(b);form.onsubmit=async e=>{e.preventDefault();b.disabled=true;
        try{const n=Number(select.value);await post('/acessos',{usuario_id:u.id,ponto:p,operacional:n>=1,custo_ler:n>=2,custo_editar:n>=3,custo_aprovar:n>=4,expectedVersion:Number(grant?.versao||0)});await load();$('access-message').textContent='Acesso salvo. A alteração passa a valer quando a pessoa atualizar a consulta.';$('access-message').hidden=false;}
        catch(err){$('access-message').textContent=err.message;$('access-message').hidden=false;}finally{b.disabled=false;}};$('access-grants').append(form);}}
  function renderSync(d){$('sync-sources').replaceChildren();$('sync-coverage').replaceChildren();if(!d.fontes.length)$('sync-sources').append(el('p','Atualização automática ainda não configurada neste ambiente.'));
    for(const s of d.fontes){const box=el('article',null,'admin-card');box.append(el('h3',s.chave==='catalogo'?'Catálogo Olist':'Detalhes Olist'),el('p',s.detalhe),el('p','Última tentativa: '+new Date(s.ultima_tentativa).toLocaleString('pt-BR'),'subtle'));
      if(s.ultimo_sucesso)box.append(el('p','Último processamento válido: '+new Date(s.ultimo_sucesso).toLocaleString('pt-BR'),'subtle'));if(s.dados?.capturado_em)box.append(el('p','Última coleta válida na Olist: '+new Date(s.dados.capturado_em).toLocaleString('pt-BR'),'subtle'));if(s.referencia)box.append(el('p','Arquivo avaliado: '+s.referencia,'subtle'));$('sync-sources').append(box);}
    for(const c of d.cobertura){const box=el('article',null,'admin-card');box.append(el('h3',c.conta),el('p',Number(c.quantidade).toLocaleString('pt-BR')+' cadastros · '+c.ponto),el('p','Importados em '+new Date(c.importado_em).toLocaleString('pt-BR'),'subtle'));$('sync-coverage').append(box);}}
  $('access-user').onchange=renderGrants;$('sync-refresh').onclick=()=>load();
  for(const id of ['review-point','sales-point']){const change=$(id).onchange;$(id).onchange=e=>{setPoint($(id).value);change?.call($(id),e);};}
  for(const [id,value] of [['catalog-tab','catalog'],['prep-tab','prep'],['tasks-tab','tasks'],['entries-tab','entries'],['materials-tab','materials'],['pack-tab','pack'],['review-tab','review'],['sales-tab','sales'],['accesses-tab','accesses'],['sync-tab','sync'],['publication-tab','publication']])$(id).onclick=()=>{dirtyForms.clear();mode=value;page=1;load();};
  $('previous').onclick=()=>{page--;load();};$('next').onclick=()=>{page++;load();};$('close-detail').onclick=()=>$('detail').close();$('close-entry').onclick=()=>$('entry-dialog').close();
  $('new-entry').onclick=()=>{$('entry-point').value=$('point').value;$('entry-point').disabled=embedded;$('entry-dialog').showModal();};
  $('entry-form').onsubmit=async e=>{e.preventDefault();try{await post('/entradas',{...Object.fromEntries(new FormData(e.target)),ponto:$('entry-point').value});e.target.reset();$('entry-dialog').close();mode='entries';page=1;await load();}catch(err){alert(err.message);}};
  $('logout').onclick=()=>{token='';access=null;location.reload();};
  for(const [button,perfil] of [['demo-buyer','compradora'],['demo-stock','estoque'],['demo-admin','direcao']])$(button).onclick=async()=>{
    try{const r=await fetch('/api/demo/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({perfil})});const d=await r.json();if(!r.ok)throw new Error(d.erro);await start(d.token);}catch(e){showError(e);}};
  fetch('/api/demo',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d?.demo){$('demo-banner').hidden=false;$('demo-profiles').hidden=false;}else if(d?.revisao_local){$('demo-banner').textContent='Revisão local · dados reais em cópia';$('demo-banner').hidden=false;}}).catch(()=>{});
  function setTheme(value){document.documentElement.dataset.theme=value==='light'?'light':'dark';}
  async function hostMessage(data){setTheme(data.theme);const section=['catalog','tasks','entries','materials','pack','prep','review','sales','sync','publication'].includes(data.section)?data.section:'catalog';
    if(hostIdentity&&data.identity&&hostIdentity!==data.identity){request++;clearSensitive();access=null;token='';}hostIdentity=String(data.identity||hostIdentity);
    requestedSection=section;const point=typeof data.point==='string'?data.point:'';
    if(access&&point&&point!==$('point').value&&document.querySelector('dialog[open]')){showError(new Error('Feche a ficha ou o formulário antes de trocar o ponto.'));emitState();return;}
    hostPoint=point;
    if(token===data.token&&access&&data.refresh!==true){const changed=mode!==section||access.pontos.includes(point)&&point!==$('point').value;mode=section;if(access.pontos.includes(point))$('point').value=point;if(changed){dirtyForms.clear();page=1;await load();}else emitState();}
    else await start(data.token,{refresh:data.refresh===true});
  }
  new MutationObserver(emitState).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
  window.addEventListener('message',e=>{if(!embedded||e.origin!==location.origin||e.source!==parent)return;
    if(e.data?.type==='bsan-produtos-theme'){setTheme(e.data.theme);return;}
    if(e.data?.type==='bsan-produtos-auth'&&typeof e.data.token==='string'){
      pendingLogin=(pendingLogin||Promise.resolve()).then(()=>hostMessage(e.data)).catch(showError);
    }
  });
  if(embedded){parent.postMessage({type:'bsan-produtos-ready'},location.origin);$('login').hidden=true;}else $('login').hidden=false;
})();
