/* Migração visual das áreas existentes. Sem chamadas de rede, gravação ou recálculo de negócio. */
const BCAreas={
 overview:{selector:'#page-overview',title:'Visão Geral',read:'Comece por faturamento e Pós-Ads. Os destaques mostram perdas, avanços e quedas; os cards abrem cada conta para investigação.',scope:'Ponto, empresa, marketplace e período seguem o cabeçalho. Referência automática: mês anterior completo ou intervalo anterior de mesma duração. Publicidade rateada e fontes pendentes ficam identificadas.',next:'Abra um canal ou compare uma conta no pop-up. A meta mensal de faturamento tem alcance próprio, indicado na faixa; Ver ritmo do mês abre o Forecast.'},
 vendas:{selector:'#page-vendas',title:'Vendas',read:'Use os cards de situação, os indicadores e a busca para localizar vendas. Título e CTP estão na visão essencial. O resumo cobre todo o filtro; a tabela é paginada.',scope:'A consulta usa o intervalo do cabeçalho; os filtros da tabela refinam os registros exibidos.',next:'Ordene, abra o detalhe ou o Raio-X. Exportar página baixa as linhas exibidas; Exportar filtro baixa o recorte completo, com cancelamento disponível.'},
 raiox:{selector:'#page-raiox',title:'Raio-X',read:'Procure pelo SKU ou nome do produto. Confira preço/custo médios, evolução de vendas e margem, e os cards por operação.',scope:'Ponto, empresa, marketplace e período seguem o cabeçalho. Escolha margem real disponível ou margem com teto; valores ausentes e devoluções permanecem identificados.',next:'Compare os canais e o histórico. Ver vendas deste SKU abre o filtro exato; Voltar ao Raio-X preserva a análise. Meses parciais não são comparados automaticamente a meses inteiros.'},
 diario:{selector:'#page-diario',title:'Diário',read:'Comece pelo faturamento, pedidos, ticket e pela composição pré/pós-Ads. Dia, semana e mês ficam visíveis logo abaixo.',scope:'Escolha o dia, mês completo ou intervalo próprio do Diário. A base percentual respeita os canais, incluindo o líquido da Temu. Ads e afiliados no líquido são separados na composição.',next:'Use a leitura do período para priorizar contas. O placar mostra notas e movimentos; contribuição e evolução explicam a mudança. O bubble cruza faturamento, margem percentual e unidades.'},
 envios:{selector:'#page-envios',title:'Envios',read:'Leia as contagens, a cobertura dos registros e as diferenças no fluxo antes de abrir os dias de cada operação.',scope:'Cartões, gráficos e detalhamento usam a mesma janela e operação. Período vazio não recebe registros de outro intervalo. Último dia é identificado separadamente; ausência de registro não é zero.',next:'Use o formulário ou a planilha modelo para registrar contagens, com conferência e controle de versão. A quantidade registrada não comprova pedidos únicos nem baixa de estoque.'},
 acompanhamento:{selector:'#page-acompanhamento',title:'Acompanhamento',read:'Direção: acompanhe os cards por tipo e gestor, as barras de registro e os selos de efeito. Coordenação: use a Mesa de cobrança por gestor e confira os retornos vencidos, de hoje e dos próximos sete dias. Gestor: escolha a operação e acompanhe A fazer, Recobrar, Conferência, Medição e Concluídas.',scope:'O período seleciona competências mensais; Carteira temporal permite incluir pendências antigas. Responsável, operação e tipo governam cartões, quadros, agenda e exportação da carteira. Busca e situação refinam somente a lista. Prazos usam a data atual; observação e fora da régua ficam separados da fila ativa.',next:'Abra a carteira ou demanda a partir dos indicadores; Voltar à visão anterior preserva a seleção. Registro documenta a ação; a conferência verifica a aplicação e a medição acompanha o efeito. Progresso permanece em acompanhamento; uma nova ação reabre a tratativa. Na cobrança, confira competência, prazo e última ação. Após o gestor registrar um retorno e sua próxima data, atualize a fila para acompanhar o compromisso. Concluídas ficam fora da cobrança e da agenda. Promoções e Ads mostram orientação, leitura disponível e conferência; cenário sugerido e preço atual são campos distintos.'},
 estoque:{selector:'#page-estoque',title:'Estoque',read:'Confira posição, ponto, cadastro e giro por canal antes de decidir compra ou transferência. Os casos para conferência aparecem antes da tabela.',scope:'CD e Full são bolsos distintos. A posição é a da origem, não um estoque histórico do intervalo de vendas. Sem posição permanece indisponível; referência de cobertura é um parâmetro de leitura.',next:'Filtre o ponto/SKU, abra a posição e confira variações. O apoio de vendas entre pontos usa o intervalo compartilhado, separado do giro da origem e da posição.'},
 marketplaces:{selector:'#page-marketplaces',title:'Marketplaces',read:'Compare faturamento, contribuição Pós-Ads e TACOS dos canais. Abra as contas e o ranking de produtos para entender quem explica o resultado.',scope:'Cards, gráficos e ranking seguem o ponto, a empresa, o marketplace e as datas selecionadas. Fonte ausente não recebe margem positiva por falta de Ads.',next:'Ver contas do canal abre a comparação. O Top 10 pode ordenar faturamento, Pós-Ads ou unidades; Raio-X compara o mesmo SKU nas operações.'},
 abc:{selector:'#page-abc',title:'Curva ABC',read:'A curva mede concentração; o Pós-Ads ajuda a priorizar a investigação. Confira os produtos relevantes em prejuízo ou com publicidade pendente.',scope:'SKUs efetivos do período e escopo selecionados. Matriz na ordem Faturamento · Unidades · Pós-Ads; N indica ausência de valor positivo ou fonte pendente.',next:'Filtre a prioridade, abra o detalhe e compare o SKU no Raio-X. Cortes e referência de margem são parâmetros locais de análise; não alteram metas ou tarefas.'},
 projecao:{selector:'#page-projecao',title:'Projeção',read:'Escolha o histórico, o ponto e as premissas. Leia a cobertura da base e o cenário por SKU antes dos gráficos.',scope:'Consulta agregada de vendas finalizadas por ponto/SKU. Dias registrados e dias corridos são hipóteses distintas. Demanda não é compra líquida: estoque, Full, reservas e trânsito não são descontados automaticamente.',next:'Horizonte, segurança e fator são cenários locais. O cálculo arredonda uma vez por SKU/ponto, mantém a referência anterior consultável e não emite pedidos ou altera metas.'},
 forecast:{selector:'#page-metas',title:'Forecast',read:'Escolha Operações para acompanhar o cenário macro e as metas cadastradas; escolha Produtos (SKU) para acompanhar o mesmo produto somado entre operações, com realizado, esperado e projeção.',scope:'Ritmo usa dias corridos até a referência disponível. O cenário estatístico tem histórico próprio; metas são comparadas somente nas operações com objetivo cadastrado.',next:'Troque método, meses, indicador e horizonte. Realizado, estimativa e objetivo permanecem separados; nenhum cenário altera bônus, preço ou orçamento.'},
 dre:{selector:'#page-dre',title:'DRE',read:'Confira as competências completas, o alcance e as pendências. Depois leia o resultado após custos cadastrados e sua composição.',scope:'Margem real disponível, investimentos adicionais e estrutura têm fontes distintas. Saldo disponível não certifica fechamento, liquidação ou lucro contábil. O custo sem venda continua presente; ausência não é zero.',next:'Empresa e ponto recebem os custos cadastrados; canal sem rateio de estrutura termina antes desses custos. Metas acompanha objetivos e Comissão preserva a remuneração publicada. A DRE é exclusiva da Direção.'},
 panorama:{selector:'#ger-sub-panorama',title:'Panorama da operação',read:'Comece pelo resultado e pela Leitura da operação, visível após os indicadores. Veja a composição da margem e confira os gráficos para explorar os sinais. Pedidos e ticket usam somente linhas identificáveis.',scope:'A conta e as datas seguem o cabeçalho. A comparação automática usa o mês anterior completo para meses completos; nos demais casos, o intervalo anterior de mesma duração. A margem percentual usa o faturamento, exceto na Temu, cuja regra usa o líquido.',next:'Margem após Ads apurado não é lucro final. A origem e a distribuição da publicidade ficam na composição da margem. Use Diagnóstico para investigar causas e Acompanhamento para registrar ações; o pré-diagnóstico não cria demandas.'},
 gerVendas:{selector:'#ger-sub-vendas',title:'Vendas da operação',read:'A abertura mostra o que compõe o resultado de cada venda. Localize o pedido ou SKU e consulte tarifas e custos.',scope:'O detalhe é da operação selecionada. Campos ainda não liberados pela fonte continuam distintos de zero.',next:'Busca, vendas com margem negativa, ordenação, páginas e exportação permanecem nesta visão.'},
 diagnostico:{selector:'#ger-sub-diag',title:'Diagnóstico',read:'Escolha uma frente da agenda e abra um grupo. O card mostra quantidade, critério e uma prévia dos itens. A lista mantém o grupo escolhido, com busca, exportação e acesso ao Raio-X.',scope:'Empresa, marketplace, ponto e datas seguem o cabeçalho. Ações de margem usam o Pós-Ads e têm um grupo principal; sinais de evolução e publicidade podem repetir os mesmos anúncios. Altas e quedas dependem da comparação selecionada; publicidade ausente permanece pendente.',next:'Ver este grupo em Anúncios conserva os mesmos IDs. Detalhar reúne a orientação, Pré-Ads, publicidade, Pós-Ads e a consulta às tratativas do produto. A fila abre com o mesmo vínculo e permite voltar à análise; nenhum registro é criado automaticamente.'},
 anuncios:{selector:'#ger-sub-produtos',title:'Anúncios',read:'Escolha Por anúncio ou Por SKU. Identificação e situação vêm primeiro; depois volume, faturamento, custo, Pré-Ads, publicidade, TACOS e Pós-Ads. SKU e ID copiam com um clique; anúncios com variações mostram os SKUs vinculados.',scope:'Ranking por faturamento positivo da operação inteira, antes da busca e dos filtros. A referência escolhida no cabeçalho define movimento e Curva ABC anterior. Empates compartilham posição. Subir no ranking não garante maior faturamento ou rentabilidade; Pós-Ads atual continua visível. Sem vendas no atual mostra somente os itens presentes na referência, com valores atuais ausentes.',next:'Use colunas completas, ordenação, detalhe e CSV do filtro. TACOS faz parte das colunas essenciais. Raio-X abre cada SKU em pop-up, com período e alcance independentes, sem sair da análise.'},
 full:{selector:'#ger-sub-full',title:'Full',read:'Confira a data da posição, a sugestão e os itens que precisam de revisão. Escolha horizonte, tipo e a leitura de reposição, não repor, parado, antigo, desempenho ou pendências.',scope:'Estoque e giro usam a âncora da relação, não um estoque histórico do período do cabeçalho. Risco de ruptura é projeção. Posição ausente não é zero; peças a caminho ficam separadas do disponível.',next:'A relação e o CSV apoiam a preparação do galpão, sem criar envio. Gráficos e critérios detalhados ficam em apoio. Conferir a posição e as restrições precede a decisão de enviar.'},
 publicidade:{selector:'#ger-sub-ads',title:'Publicidade',read:'Comece pelo investimento e pela receita atribuída. Depois confira a margem da operação, cobertura e afiliados antes de explorar campanhas, anúncios e diário.',scope:'Relatório de mídia, Ads alocado na margem, cobranças no líquido e abertura de afiliados têm alcances próprios. ACOS e ROAS não medem lucro final. Receita atribuída vezes margem de referência menos investimento é uma estimativa, não um valor recuperável garantido.',next:'Troque o nível da leitura, filtre e exporte o CSV. No TikTok, mídia e afiliados já no líquido não são descontados novamente. Investigar não pausa nem escala campanhas automaticamente.'},
};
const BCVisual={pending:false,zoom:null,chartState:new WeakMap(),colorState:new WeakMap(),areas:new Set(),version:'2026-11-03-cores-resultados'};
const BCType={seen:new WeakMap(),fontWrappers:new WeakMap(),family:'Inter, "Segoe UI", sans-serif'};
const BCChrome={rangeMode:'quick',periodMounted:false};
function bcChromeText(el,value){if(el&&el.textContent!==value)el.textContent=value;}
function bcChromeHidden(el,value){if(el&&el.hidden!==value)el.hidden=value;}
function bcChromeButton(text,action){const b=document.createElement('button');b.type='button';b.textContent=text;b.onclick=action;return b;}
function bcChromeAccess(){
 const u=bcNavSession(),account=document.querySelector('.bc-account');if(!u)return;account.open=false;
 let d=document.getElementById('bc-access-dialog');if(!d){d=document.createElement('dialog');d.id='bc-access-dialog';d.className='bc-access-dialog';d.setAttribute('aria-labelledby','bc-access-title');const h=document.createElement('h2');h.id='bc-access-title';h.textContent='Meu acesso';const dl=document.createElement('dl');d.append(h,dl,bcChromeButton('Fechar',()=>d.close()));document.body.append(d);d.addEventListener('close',()=>account.querySelector('summary').focus());}
 const list=d.querySelector('dl');list.replaceChildren();for(const [name,value]of [['Nome',u.nome],['Perfil',{direcao:'Direção',coordenacao:'Coordenação',gestor:'Gestor',compradora:'Compradora',estoque:'Estoque',posvenda:'Pós-venda'}[u.perfil]||u.perfil],['Carteira',u.gestor_ref||'Conforme as permissões da sessão']]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;dd.textContent=value||'—';list.append(dt,dd);}d.showModal();
}
function bcChromeAccount(){
 const account=document.querySelector('.bc-account'),host=document.getElementById('bc-account-actions');if(!account||!host)return;
 let menu=document.getElementById('bc-user-menu');if(!menu){menu=document.createElement('div');menu.id='bc-user-menu';const profile=document.createElement('div');profile.className='bc-user-profile';profile.innerHTML='<strong id="bc-user-name"></strong><span id="bc-user-role"></span><p id="bc-user-note"></p>';menu.append(profile);
  const access=bcChromeButton('Meu acesso',bcChromeAccess);access.id='bc-user-access';const slot=document.createElement('div');slot.id='bc-user-admin-slot';
  const password=bcChromeButton('Trocar senha',()=>{account.open=false;bcTrocarSenha(false);});password.id='bc-user-password';
  const logout=bcChromeButton('Sair',()=>{account.open=false;bcLogout();});logout.id='bc-user-logout';
  const login=bcChromeButton('Entrar',()=>{account.open=false;bcShowLogin();});login.id='bc-user-login';menu.append(access,slot,password,logout,login);host.append(menu);account.querySelector('summary').setAttribute('aria-label','Conta de usuário');
 }
 const u=bcNavSession(),role={direcao:'Direção',coordenacao:'Coordenação',gestor:'Gestor',compradora:'Compradora',estoque:'Estoque',posvenda:'Pós-venda'}[u?.perfil]||u?.perfil||'Sem sessão conectada';bcChromeText(document.getElementById('bc-user-name'),u?.nome||'Arquivo local');bcChromeText(document.getElementById('bc-user-role'),role);bcChromeText(document.getElementById('bc-account-role'),role);bcChromeText(document.getElementById('bc-user-note'),window.BC_REVIEW?'Ambiente de revisão · sem gravação oficial.':u?'Acesso conforme o perfil da sua sessão.':'Entre para acessar sua carteira e suas permissões.');
 for(const id of ['access','password','logout'])bcChromeHidden(document.getElementById('bc-user-'+id),!u);bcChromeHidden(document.getElementById('bc-user-login'),!!u);
 const admin=document.getElementById('btn-admin'),slot=document.getElementById('bc-user-admin-slot');if(admin){if(admin.parentElement!==slot)slot.append(admin);bcChromeText(admin,'Usuários e acessos');bcChromeHidden(admin,u?.perfil!=='direcao');const display=u?.perfil==='direcao'?'block':'none';if(admin.style.display!==display)admin.style.display=display;admin.disabled=typeof window.bcAdminAbrir!=='function';admin.title=admin.disabled?'Disponível na sessão online da Direção':'Administrar usuários';if(!admin.dataset.bcAccount){admin.addEventListener('click',()=>{account.open=false;});admin.dataset.bcAccount='1';}}
}
function bcChromeDay(date,offset){const d=_parseD(date);d.setDate(d.getDate()+offset);return _iso(d);}
function bcChromeRangeShort(from,to){if(from===to)return bcHeaderDate(from);const f=_parseD(from),t=_parseD(to),short=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace(/ de /g,' ').replace(/\./g,'');if(from.slice(0,7)===to.slice(0,7))return from.slice(8)+'–'+short(t)+' '+to.slice(0,4);if(from.slice(0,4)===to.slice(0,4))return short(f)+' — '+short(t)+' '+to.slice(0,4);return bcHeaderDate(from)+' — '+bcHeaderDate(to);}
function bcChromeRanges(){
 const end=_hojeData(),d=_parseD(end),month=_iso(new Date(d.getFullYear(),d.getMonth(),1)),week=bcChromeDay(end,-((d.getDay()+6)%7));
 return [{key:'mes',label:'Este mês',from:month,to:end},{key:'mespass',label:'Mês anterior',from:_iso(new Date(d.getFullYear(),d.getMonth()-1,1)),to:_iso(new Date(d.getFullYear(),d.getMonth(),0))},{key:'7d',label:'Últimos 7 dias',from:bcChromeDay(end,-6),to:end},{key:'15d',label:'Últimos 15 dias',from:bcChromeDay(end,-14),to:end},{key:'30d',label:'Últimos 30 dias',from:bcChromeDay(end,-29),to:end},{key:'hoje',label:'Último dia da base',from:end,to:end},{key:'ontem',label:'Dia anterior',from:bcChromeDay(end,-1),to:bcChromeDay(end,-1)},{key:'semana',label:'Esta semana',from:week,to:end},{key:'ano',label:'Este ano',from:_iso(new Date(d.getFullYear(),0,1)),to:end},{key:'all',label:'Todo o histórico',from:SHORTS.all[0],to:SHORTS.all[1]}];
}
function bcChromePeriodName(from,to){const p=bcChromeRanges().find(x=>x.from===from&&x.to===to);if(p)return p.label;const d=_parseD(from);if(from.slice(0,7)===to.slice(0,7)&&from.endsWith('-01')&&to===_iso(new Date(d.getFullYear(),d.getMonth()+1,0)))return d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});return 'Período personalizado';}
function bcChromePeriodMode(mode){const previous=BCChrome.rangeMode;BCChrome.rangeMode=mode;const body=document.querySelector('#bc-range-menu .bc-period-body');if(body)body.scrollTop=0;for(const key of ['quick','month','custom']){bcChromeHidden(document.getElementById('bc-period-'+key),key!==mode);document.getElementById('bc-period-mode-'+key)?.setAttribute('aria-pressed',String(key===mode));}if(mode==='month')bcChromePeriodMonth();if(mode==='custom'){if(previous!=='custom')BCChrome.calendarMonth=(document.getElementById('bc-range-from').value||_hojeData()).slice(0,7);bcChromeCalendarRender();}else if(mode==='quick'&&(!document.getElementById('bc-range-from').value||!document.getElementById('bc-range-to').value))bcChromePeriodDraft(...getR());bcChromePeriodPreview();}
function bcChromePeriodDraft(from,to){bcChromeText(document.getElementById('bc-range-error'),'');document.getElementById('bc-range-from').value=from||'';document.getElementById('bc-range-to').value=to||'';bcChromePeriodPreview();}
function bcChromePeriodMonth(){BCChrome.calendarPending=false;BCChrome.calendarHover='';const month=document.getElementById('bc-range-month').value;bcChromeMonthsRender();if(!/^\d{4}-\d{2}$/.test(month)){bcChromePeriodDraft('','');return;}const [y,m]=month.split('-').map(Number);bcChromePeriodDraft(month+'-01',_iso(new Date(y,m,0)));}
function bcChromePeriodPreview(){
 const from=document.getElementById('bc-range-from')?.value,to=document.getElementById('bc-range-to')?.value;bcChromeCalendarPaint();if(!from||!to){bcChromeText(document.getElementById('bc-period-preview-title'),from?'Escolha o fim do período':'Escolha o início do período');bcChromeText(document.getElementById('bc-period-preview-note'),from?'Clique em uma segunda data para completar o intervalo.':'Clique na data inicial no calendário.');return;}
 const valid=from<=to,days=valid?Math.round((_parseD(to)-_parseD(from))/86400000)+1:0;
 bcChromeText(document.getElementById('bc-period-preview-title'),valid?bcHeaderDate(from)+' — '+bcHeaderDate(to):'Revise as datas do intervalo');
 bcChromeText(document.getElementById('bc-period-preview-note'),valid?days+' dia'+(days===1?'':'s')+' · '+(to>_hojeData()?'inclui datas após a última venda disponível.':'aplicar confirma a consulta.'):'A data final deve ser igual ou posterior à inicial.');
 for(const button of document.querySelectorAll('[data-bc-range-key]')){const p=bcChromeRanges().find(x=>x.key===button.dataset.bcRangeKey);button.setAttribute('aria-pressed',String(!!p&&p.from===from&&p.to===to));const small=button.querySelector('small');if(p)bcChromeText(small,bcChromeRangeShort(p.from,p.to));}
 bcChromeText(document.getElementById('bc-period-reference'),'Dados disponíveis até '+bcHeaderDate(_hojeData())+'. Os atalhos usam essa referência.');
}
function bcChromePeriodSync(force=false){
 if(!BCChrome.periodMounted)return;const [from,to]=getR();bcChromeText(document.getElementById('bc-range-choice'),bcChromePeriodName(from,to));
 if(force){const match=bcChromeRanges().some(x=>x.from===from&&x.to===to);document.getElementById('bc-range-month').value=from.slice(0,7);BCChrome.calendarMonth=from.slice(0,7);BCChrome.monthYear=+from.slice(0,4);BCChrome.calendarPending=false;BCChrome.calendarHover='';bcChromePeriodMode(match?'quick':bcChromePeriodName(from,to)!=='Período personalizado'?'month':'custom');}bcChromePeriodPreview();
 const range=document.getElementById('bc-range-menu');if(range.open){const rect=range.querySelector('summary').getBoundingClientRect(),top=window.innerWidth<=760||rect.top<0||window.innerHeight-rect.bottom<660?16:Math.max(16,rect.bottom+8),panel=range.querySelector('.bc-period-panel'),right=Math.max(16,window.innerWidth-rect.right);for(const [key,value]of Object.entries({top:top+'px',right:right+'px',maxHeight:(window.innerHeight-top-16)+'px'}))if(panel.style[key]!==value)panel.style[key]=value;}
}
function bcChromePeriod(){
 const range=document.getElementById('bc-range-menu');if(!range||BCChrome.periodMounted)return;const panel=range.querySelector('.bc-period-panel');if(!panel)return;
 const dates=panel.querySelector('.bc-period-dates'),apply=panel.querySelector('.bc-period-apply'),comparison=panel.querySelector('.bc-period-comparison'),error=document.getElementById('bc-range-error'),label=document.getElementById('bc-range-label');
 const name=document.createElement('strong');name.id='bc-range-choice';const text=document.createElement('span');text.className='bc-period-trigger-text';label.before(text);text.append(name,label);range.classList.add('bc-range-v2');
 const header=document.createElement('div');header.className='bc-period-heading';header.innerHTML='<div><h2>Qual período você quer consultar?</h2><p>Escolha um atalho, um mês completo ou informe as datas.</p></div>';const close=bcChromeButton('×',()=>{range.open=false;bcHeaderRangeSync(true);});close.setAttribute('aria-label','Fechar seleção de período');header.append(close);
 const modes=document.createElement('div');modes.className='bc-period-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Forma de selecionar o período');for(const [key,title]of [['quick','Atalhos'],['month','Escolher mês'],['custom','Personalizado']]){const b=bcChromeButton(title,()=>bcChromePeriodMode(key));b.id='bc-period-mode-'+key;modes.append(b);}
 const quick=document.createElement('section');quick.id='bc-period-quick';quick.className='bc-period-quick';for(const p of bcChromeRanges()){const b=bcChromeButton('',()=>{const current=bcChromeRanges().find(x=>x.key===p.key);if(current){BCChrome.calendarPending=false;BCChrome.calendarHover='';bcChromePeriodDraft(current.from,current.to);}});b.dataset.bcRangeKey=p.key;const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=p.label;b.append(strong,small);quick.append(b);}
 const month=document.createElement('section');month.id='bc-period-month';const monthInput=document.createElement('input');monthInput.id='bc-range-month';monthInput.type='hidden';month.append(monthInput,bcChromeCalendarNav('year'));
 const monthGrid=document.createElement('div');monthGrid.id='bc-month-grid';monthGrid.className='bc-month-grid';monthGrid.setAttribute('role','group');monthGrid.setAttribute('aria-label','Mês da consulta');month.append(monthGrid);const monthNote=document.createElement('p');monthNote.textContent='Selecione um mês completo, do primeiro ao último dia.';month.append(monthNote);
 const custom=document.createElement('section');custom.id='bc-period-custom';dates.hidden=true;custom.append(dates);for(const id of ['bc-range-from','bc-range-to']){const input=dates.querySelector('#'+id);input.oninput=bcChromePeriodPreview;input.onchange=bcChromePeriodPreview;}
 const endpoints=document.createElement('div');endpoints.className='bc-calendar-endpoints';for(const [key,title]of [['from','Início'],['to','Fim']]){const b=bcChromeButton('',()=>{BCChrome.calendarHover='';if(key==='from'){BCChrome.calendarPending=false;bcChromePeriodDraft('','');}else{BCChrome.calendarPending=!!document.getElementById('bc-range-from').value;document.getElementById('bc-range-to').value='';bcChromePeriodPreview();}bcChromeCalendarRender();document.querySelector('#bc-calendar-grid button[tabindex="0"]')?.focus();});b.id='bc-calendar-'+key;b.innerHTML='<span>'+title+'</span><strong>Selecionar data</strong>';endpoints.append(b);}custom.append(endpoints,bcChromeCalendarNav('month'));
 const calendar=document.createElement('div');calendar.id='bc-calendar-grid';calendar.className='bc-calendar-grid';custom.append(calendar);const instruction=document.createElement('p');instruction.id='bc-calendar-instruction';instruction.className='bc-calendar-instruction';instruction.textContent='Clique na data inicial e depois na final. Use as setas do teclado para navegar.';custom.append(instruction);calendar.addEventListener('pointerleave',()=>{if(BCChrome.calendarHover){BCChrome.calendarHover='';bcChromeCalendarPaint();}});
 const preview=document.createElement('div');preview.className='bc-period-preview';preview.setAttribute('aria-live','polite');preview.innerHTML='<span>Período selecionado</span><strong id="bc-period-preview-title"></strong><small id="bc-period-preview-note"></small>';
 const reference=document.createElement('p');reference.id='bc-period-reference';
 const compare=document.createElement('details');compare.className='bc-period-compare';const summary=document.createElement('summary');summary.textContent='Comparar com outro período';compare.append(summary,comparison);
 const footer=document.createElement('div');footer.className='bc-period-footer';apply.onclick=()=>{const from=document.getElementById('bc-range-from').value,to=document.getElementById('bc-range-to').value;if(!from||!to||from>to){bcChromeText(error,'Selecione a data inicial e a data final antes de aplicar.');document.querySelector('#bc-calendar-grid button[tabindex="0"]')?.focus();return;}bcHeaderApplyRange();};footer.append(bcChromeButton('Cancelar',()=>{range.open=false;bcHeaderRangeSync(true);}),apply);
 const body=document.createElement('div');body.className='bc-period-body';body.append(quick,month,custom,preview,reference,compare,error);panel.replaceChildren(header,modes,body,footer);BCChrome.periodMounted=true;
 const original=bcHeaderRangeSync;bcHeaderRangeSync=function(force=false){const result=original.apply(this,arguments);bcChromePeriodSync(force);return result;};bcHeaderRangeSync(true);
}
// Calendar navigation only changes the draft. The existing apply handler confirms it.
function bcChromeShiftMonth(month,offset){const [y,m]=month.split('-').map(Number);return _iso(new Date(y,m-1+offset,1)).slice(0,7);}
function bcChromeCalendarNav(kind){
 const nav=document.createElement('div');nav.className='bc-calendar-nav';
 const move=offset=>{if(kind==='year'){BCChrome.monthYear+=offset;bcChromeMonthsRender();}else{BCChrome.calendarMonth=bcChromeShiftMonth(BCChrome.calendarMonth,offset);bcChromeCalendarRender();}};
 const previous=bcChromeButton('‹',()=>move(-1)),next=bcChromeButton('›',()=>move(1));previous.setAttribute('aria-label',kind==='year'?'Ano anterior':'Mês anterior no calendário');next.setAttribute('aria-label',kind==='year'?'Ano seguinte':'Mês seguinte no calendário');
 const title=document.createElement('strong');title.id='bc-calendar-'+kind+'-title';title.setAttribute('aria-live','polite');nav.append(previous,title,next);return nav;
}
function bcChromeMonthsRender(){
 const grid=document.getElementById('bc-month-grid');if(!grid)return;const chosen=document.getElementById('bc-range-month').value;BCChrome.monthYear=BCChrome.monthYear||+(chosen||_hojeData()).slice(0,4);bcChromeText(document.getElementById('bc-calendar-year-title'),String(BCChrome.monthYear));
 if(grid.dataset.year!==String(BCChrome.monthYear)){const cells=[];for(let i=0;i<12;i++){const date=new Date(BCChrome.monthYear,i,1),value=_iso(date).slice(0,7),b=bcChromeButton(date.toLocaleDateString('pt-BR',{month:'long'}),()=>{document.getElementById('bc-range-month').value=value;bcChromePeriodMonth();});b.dataset.month=value;b.setAttribute('aria-label',date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}));cells.push(b);}grid.replaceChildren(...cells);grid.dataset.year=String(BCChrome.monthYear);}
 for(const b of grid.children)b.setAttribute('aria-pressed',String(b.dataset.month===chosen));
}
function bcChromeCalendarPick(day){
 const from=document.getElementById('bc-range-from').value;BCChrome.calendarHover='';
 if(!BCChrome.calendarPending||!from){BCChrome.calendarPending=true;bcChromePeriodDraft(day,'');}else{BCChrome.calendarPending=false;bcChromePeriodDraft(day<from?day:from,day<from?from:day);}
 bcChromeText(document.getElementById('bc-range-error'),'');bcChromeCalendarPaint();
}
function bcChromeCalendarRender(){
 const grid=document.getElementById('bc-calendar-grid');if(!grid)return;BCChrome.calendarMonth=BCChrome.calendarMonth||(document.getElementById('bc-range-from').value||_hojeData()).slice(0,7);
 const month=BCChrome.calendarMonth;bcChromeText(document.getElementById('bc-calendar-month-title'),_parseD(month+'-01').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}));
 if(grid.dataset.month!==month){const panels=[];for(let offset=0;offset<2;offset++){
  const value=bcChromeShiftMonth(month,offset),first=_parseD(value+'-01'),count=new Date(first.getFullYear(),first.getMonth()+1,0).getDate(),panel=document.createElement('div');panel.className='bc-calendar-page';const h=document.createElement('h3');h.textContent=first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});panel.append(h);
  const week=document.createElement('div');week.className='bc-calendar-week';for(const label of ['D','S','T','Q','Q','S','S']){const span=document.createElement('span');span.textContent=label;week.append(span);}week.setAttribute('aria-hidden','true');panel.append(week);
  const days=document.createElement('div');days.className='bc-calendar-days';days.setAttribute('role','group');days.setAttribute('aria-label',h.textContent);for(let i=0;i<first.getDay();i++){const blank=document.createElement('span');blank.setAttribute('aria-hidden','true');days.append(blank);}
  for(let n=1;n<=count;n++){const day=value+'-'+String(n).padStart(2,'0'),cell=document.createElement('span'),b=bcChromeButton(String(n),()=>bcChromeCalendarPick(day));cell.className='bc-calendar-cell';b.dataset.day=day;b.setAttribute('aria-label',_parseD(day).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}));b.tabIndex=-1;b.onpointerenter=()=>{if(BCChrome.calendarPending&&BCChrome.calendarHover!==day){BCChrome.calendarHover=day;bcChromeCalendarPaint();}};b.onfocus=b.onpointerenter;b.onkeydown=e=>bcChromeCalendarKey(e,day);cell.append(b);days.append(cell);}panel.append(days);panels.push(panel);
 }grid.replaceChildren(...panels);grid.dataset.month=month;}
 bcChromeCalendarPaint();
}
function bcChromeCalendarKey(event,day){
 let target;const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(event.key in offsets)target=bcChromeDay(day,offsets[event.key]);else if(event.key==='Home')target=bcChromeDay(day,-_parseD(day).getDay());else if(event.key==='End')target=bcChromeDay(day,6-_parseD(day).getDay());else if(event.key==='PageUp'||event.key==='PageDown'){const next=bcChromeShiftMonth(day.slice(0,7),event.key==='PageUp'?-1:1),d=_parseD(next+'-01'),last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();target=next+'-'+String(Math.min(+day.slice(8),last)).padStart(2,'0');}else return;
 event.preventDefault();const visibleMonths=window.innerWidth<=760?1:2;if(target.slice(0,7)<BCChrome.calendarMonth||target.slice(0,7)>=bcChromeShiftMonth(BCChrome.calendarMonth,visibleMonths)){BCChrome.calendarMonth=target.slice(0,7);bcChromeCalendarRender();}const b=document.querySelector('#bc-calendar-grid button[data-day="'+target+'"]');if(b){for(const other of document.querySelectorAll('#bc-calendar-grid button'))other.tabIndex=-1;b.tabIndex=0;b.focus();}
}
function bcChromeCalendarPaint(){
 const grid=document.getElementById('bc-calendar-grid');if(!grid)return;const from=document.getElementById('bc-range-from').value,to=document.getElementById('bc-range-to').value,hover=BCChrome.calendarPending?BCChrome.calendarHover:'',end=to||hover,low=from&&end?(from<end?from:end):from,high=from&&end?(from>end?from:end):from;
 for(const key of ['from','to']){const value=key==='from'?from:to,b=document.getElementById('bc-calendar-'+key);bcChromeText(b?.querySelector('strong'),value?bcHeaderDate(value):'Selecionar data');b?.setAttribute('aria-pressed',String(key==='to'?!!from&&!to:!from));}
 const buttons=[...grid.querySelectorAll('button[data-day]')],focus=buttons.find(b=>b.dataset.day===from)||buttons[0];for(const b of buttons){const day=b.dataset.day,cell=b.parentElement,selected=day===from||day===to;cell.classList.toggle('is-range',!!end&&day>=low&&day<=high);cell.classList.toggle('is-start',day===low);cell.classList.toggle('is-end',day===high);cell.classList.toggle('is-preview',!!hover&&!to);b.classList.toggle('is-endpoint',selected);b.setAttribute('aria-pressed',String(selected));if(day===_iso(new Date()))b.setAttribute('aria-current','date');else b.removeAttribute('aria-current');if(!grid.contains(document.activeElement))b.tabIndex=b===focus?0:-1;}
 bcChromeText(document.getElementById('bc-calendar-instruction'),from&&!to?'Agora escolha a data final. O intervalo será destacado ao passar pelas datas.':'Clique na data inicial e depois na final. Use as setas do teclado para navegar.');
}

// Two navigation levels over the existing pages. No data or permission contract changes.
const BCGroup={mounted:false,identity:null,last:{},busy:false};
const BCGroupMap=[
 {id:'resultados',label:'Resultados',items:[{id:'overview',label:'Visão Geral',page:'overview'},{id:'diario',label:'Diário',page:'diario'},{id:'marketplaces',label:'Marketplaces',page:'marketplaces'},{id:'abc',label:'Curva ABC',page:'abc'},{id:'forecast',label:'Forecast',page:'metas'}]},
 {id:'vendas',label:'Vendas',items:[{id:'vendas',label:'Vendas',page:'vendas'},{id:'raiox',label:'Raio-X',page:'raiox'}]},
 {id:'gerencial',label:'Gerencial',items:[{id:'panorama',label:'Panorama',page:'gerencial',sub:'panorama'},{id:'ger-vendas',label:'Vendas da operação',page:'gerencial',sub:'vendas'},{id:'diag',label:'Diagnóstico',page:'gerencial',sub:'diag'},{id:'produtos',label:'Anúncios',page:'gerencial',sub:'produtos'},{id:'previsao',label:'Forecast',page:'gerencial',sub:'previsao'},{id:'ads',label:'Publicidade',page:'gerencial',sub:'ads'},{id:'metas',label:'Metas',page:'gerencial',sub:'metas'},{id:'full',label:'Full',page:'gerencial',sub:'full'}]},
 {id:'operacao',label:'Operação',items:[{id:'envios',label:'Envios',page:'envios'},{id:'estoque',label:'Estoque',page:'estoque'},{id:'projecao',label:'Projeção',page:'projecao'}]},
 {id:'acompanhamento',label:'Acompanhamento',items:[{id:'tarefas',label:'Tarefas',page:'acompanhamento',work:'tarefas'},{id:'promos',label:'Promoções',page:'acompanhamento',work:'promos'},{id:'alinhamentos',label:'Alinhamentos',page:'acompanhamento',work:'alinhamentos'},{id:'pendencias',label:'Pendências',page:'acompanhamento',work:'pendencias'},{id:'ac-anuncios',label:'Anúncios · em breve',page:'acompanhamento',disabled:true}]},
 {id:'financeiro',label:'Financeiro',items:[{id:'dre',label:'DRE',page:'dre'},{id:'comissao',label:'Comissão',page:'gerencial',sub:'comissao'}]}
];
function bcGroupedAllowed(item,user=bcNavSession()){
 if(item.page==='cadastro-produtos')return window.bcProdutosAllowed?.(item,user)===true;
 if(item.id==='dre')return user?.perfil==='direcao';
 if(item.id==='comissao')return ['direcao','coordenacao','gestor'].includes(user?.perfil)||typeof painelOnline==='function'&&!painelOnline();
 return true;
}
function bcGroupedCatalogue(){return BCGroupMap.map(g=>{const items=[...g.items];if(g.id==='acompanhamento'&&typeof AC2_TIPOS_ADS!=='undefined')items.splice(2,0,{id:'ac-ads',label:'Ads',page:'acompanhamento',work:'ads'});return{...g,items:items.filter(i=>bcGroupedAllowed(i))};}).filter(g=>g.items.length).map(g=>({...g,label:g.id==='financeiro'&&g.items.length===1?'Comissão':g.label}));}
function bcGroupedCurrent(groups=bcGroupedCatalogue()){
 for(const group of groups){const item=group.items.find(i=>!i.disabled&&i.page===activePage&&(!i.productMode||i.productMode===window.bcProdutoSection)&&(i.sub?i.sub===GER_SUB:i.work?i.work===(typeof ac2==='object'?ac2.sub:'tarefas'):true));if(item)return{group,item};}return null;
}
function bcGroupedIdentity(){const key=bcNavKey()+':areas-v1';if(BCGroup.identity!==key){BCGroup.identity=key;BCGroup.last={};try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))BCGroup.last=saved;}catch{}}return key;}
function bcGroupedRemember(group,item){const key=bcGroupedIdentity();if(BCGroup.last[group]===item)return;BCGroup.last[group]=item;try{localStorage.setItem(key,JSON.stringify(BCGroup.last));}catch{}}
function bcGroupedOpen(groupId,itemId){
 bcGroupedIdentity();const group=bcGroupedCatalogue().find(g=>g.id===groupId);if(!group)return;const item=group.items.find(i=>i.id===(itemId||BCGroup.last[groupId])&&!i.disabled)||(!itemId?group.items.find(i=>!i.disabled):null);if(!item||!bcGroupedAllowed(item))return;
 const original=document.getElementById('nav-'+item.page);if(!original)return;
 if(item.productMode)window.bcProdutosOpenMode?.(item.productMode);
 if(item.sub)GER_SUB=item.sub;
 goPage(item.page,original);
 if(item.work&&typeof ac2==='object'&&typeof ac2.setSub==='function')ac2.setSub(item.work);
 const current=bcGroupedCurrent();if(current?.group.id===groupId&&current.item.id===item.id)bcGroupedRemember(groupId,item.id);
 bcGroupedRefresh();bcVisualSchedule();
}
function bcGroupedMount(){
 if(BCGroup.mounted||!BCNav.ready)return;const original=document.getElementById('main-nav'),heading=document.querySelector('.bc-view-heading');if(!original||!heading)return;
 document.body.classList.add('bc-grouped-navigation');const primary=document.createElement('nav');primary.id='bc-group-nav';primary.className='bc-group-nav';primary.setAttribute('aria-label','Áreas do BsanControl');original.before(primary);
 const mobile=document.createElement('label');mobile.className='bc-group-mobile';mobile.htmlFor='bc-group-select';mobile.append(document.createTextNode('Área do painel'));const select=document.createElement('select');select.id='bc-group-select';select.onchange=()=>bcGroupedOpen(select.value);mobile.append(select);primary.after(mobile);
 const secondary=document.createElement('nav');secondary.id='bc-group-sections';secondary.className='bc-secondary bc-group-sections';heading.after(secondary);
 const subMobile=document.createElement('label');subMobile.className='bc-group-mobile bc-group-mobile-section';subMobile.htmlFor='bc-group-section';const caption=document.createElement('span');caption.id='bc-group-section-label';subMobile.append(caption);const subSelect=document.createElement('select');subSelect.id='bc-group-section';subSelect.onchange=()=>{const current=bcGroupedCurrent();if(current)bcGroupedOpen(current.group.id,subSelect.value);};subMobile.append(subSelect);secondary.after(subMobile);
 BCGroup.mounted=true;const refresh=bcNavRefresh;bcNavRefresh=function(){const result=refresh.apply(this,arguments);bcGroupedRefresh();return result;};
}
function bcGroupedRefresh(){
 if(BCGroup.busy)return;bcGroupedMount();if(!BCGroup.mounted)return;BCGroup.busy=true;
 try{
 bcGroupedIdentity();const groups=bcGroupedCatalogue();let current=bcGroupedCurrent(groups);
 if(!current){if(activePage==='dre'&&bcNavSession()?.perfil!=='direcao'){goPage('overview',document.getElementById('nav-overview'));current=bcGroupedCurrent(groups);}if(!current)return;}
 const {group,item}=current;bcGroupedRemember(group.id,item.id);
 const primary=document.getElementById('bc-group-nav'),signature=groups.map(g=>g.id+':'+g.label).join('|');
 if(primary.dataset.signature!==signature){primary.replaceChildren(...groups.map(g=>{const b=bcChromeButton(g.label,()=>bcGroupedOpen(g.id));b.id='bc-area-'+g.id;b.className='bc-group-button';b.dataset.group=g.id;return b;}));primary.dataset.signature=signature;}
 for(const b of primary.children){if(b.dataset.group===group.id){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page');}else b.removeAttribute('aria-current');}
 bcNavOptions(document.getElementById('bc-group-select'),groups.map(g=>[g.id,g.label]),group.id);
 const secondary=document.getElementById('bc-group-sections'),subSignature=group.items.map(i=>i.id+':'+i.label+':'+!!i.disabled).join('|');
 if(secondary.dataset.signature!==subSignature){secondary.replaceChildren(...group.items.map(i=>{const b=bcChromeButton(i.label,()=>bcGroupedOpen(group.id,i.id));b.className='dshort';b.dataset.section=i.id;b.disabled=!!i.disabled;return b;}));secondary.dataset.signature=subSignature;}
 const aria='Seções de '+group.label;if(secondary.getAttribute('aria-label')!==aria)secondary.setAttribute('aria-label',aria);
 for(const b of secondary.children){if(b.dataset.section===item.id){if(b.getAttribute('aria-current')!=='page')b.setAttribute('aria-current','page');}else b.removeAttribute('aria-current');}
 const single=group.items.filter(i=>!i.disabled).length===1;bcChromeHidden(secondary,single);bcChromeHidden(document.querySelector('.bc-group-mobile-section'),single);
 bcChromeText(document.getElementById('bc-group-section-label'),aria);bcNavOptions(document.getElementById('bc-group-section'),group.items.filter(i=>!i.disabled).map(i=>[i.id,i.label]),item.id);
 bcChromeText(document.getElementById('bc-page-title'),item.label);bcChromeText(document.getElementById('bc-breadcrumb'),'Grupo Bsan / '+group.label+(single?'':' / '+item.label));
 // Counts remain those computed by Acompanhamento's existing filters.
 if(group.id==='acompanhamento')for(const key of ['tarefas','promos','ads','alinhamentos','pendencias']){const old=document.querySelector('#a2-sub button[data-work="'+key+'"] .a2-subn')||document.querySelector('#a2-sub button[onclick*="'+key+'"] .a2-subn'),button=secondary.querySelector('[data-section="'+(key==='ads'?'ac-ads':key)+'"]');if(old&&button){let badge=button.querySelector('small');if(!badge){badge=document.createElement('small');button.append(badge);}bcChromeText(badge,old.textContent);}}
 }finally{BCGroup.busy=false;}
}

function bcChromeRefresh(){bcChromeAccount();bcChromePeriod();bcChromePeriodSync();bcGroupedRefresh();if(typeof bcCompareRefresh==='function')bcCompareRefresh();}
const bcVisualVisible=el=>!!el&&el.isConnected&&el.getClientRects().length>0&&!el.closest('[hidden]');
function bcVisualTone(color){const c=String(color||'').replace(/\s/g,'').toLowerCase();if(/#(?:22c55e|34d399|4ade80|059669|10b981)|rgb\((?:34,197,94|52,211,153|74,222,128)\)|var\(--pos\)/.test(c))return'good';if(/#(?:f87171|ef5350|ef4444|dc2626|ff6b6b)|rgb\((?:248,113,113|239,83,80|239,68,68)\)|var\(--neg\)/.test(c))return'bad';if(/#(?:f59e0b|fbbf24|fcd34d|facc15)|rgb\((?:245,158,11|251,191,36)\)|var\(--warn\)/.test(c))return'attention';if(/#(?:4f8ef7|60a5fa|3b82f6)|var\(--a2?\)/.test(c))return'info';return'';}
function bcVisualLabel(text){const original=String(text||'');const clean=original.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').replace(/^\s+/,'');return clean.trim()?clean:original;}
function bcVisualColor(value){
 if(Array.isArray(value))return value.map(bcVisualColor);if(typeof value!=='string')return value;
 const light=document.body.classList.contains('light'),groups=[
  [['4f8ef7','3b82f6','60a5fa','99b7dc','1d65d6'],'60a5fa','1d65d6'],
  [['22c55e','34d399','4ade80','059669','10b981','79c9a6','2dd48a','087c45'],'2dd48a','087c45'],
  [['ef5350','ef4444','f87171','dc2626','ff6b6b','d38c98','ef929a','ff5c66','c91d38'],'ff5c66','c91d38'],
  [['f59e0b','fbbf24','fcd34d','facc15','dec078','9a5700'],'fbbf24','9a5700'],
  [['a78bfa','818cf8','b8a6de','7150bf'],'a78bfa','7150bf'],
  [['f472b6','f43f5e','c48faf','db2777'],'f472b6','db2777'],
  [['fb923c','f97316','c3a484','c4560a'],'fb923c','c4560a'],
  [['38bdf8','00c2a8','90bdb9','8bbab3','22d3ee','087e98'],'22d3ee','087e98']
 ];const palette=Object.fromEntries(groups.flatMap(([keys,dark,day])=>keys.map(key=>[key,light?day:dark])));
 return value.replace(/#([a-f\d]{6})([a-f\d]{2})?\b/gi,(all,hex,alpha)=>palette[hex.toLowerCase()]?'#'+palette[hex.toLowerCase()]+(alpha||''):all);
}
// Só interpreta um valor completo. Datas, códigos, textos e ausência não viram resultados.
function bcVisualAmount(text){
 let s=String(text??'').trim().replace(/[−–]/g,'-').replace(/\s/g,'');const accounting=s.startsWith('(')&&s.endsWith(')');if(accounting)s=s.slice(1,-1);
 const m=s.match(/^([+-]?)(R\$)?([+-]?)(\d+(?:\.\d{3})*)(?:,(\d{1,12}))?([kKmMbB])?(%|p\.p\.)?$/);if(!m||m[1]&&m[3]||accounting&&(m[1]||m[3]))return null;
 const value=Number(m[4].replaceAll('.','')+'.'+(m[5]||'0'))*(accounting||m[1]==='-'||m[3]==='-'?-1:1)*({k:1e3,m:1e6,b:1e9}[m[6]?.toLowerCase()]||1);
 return Number.isFinite(value)?{value,unit:m[2]?'money':m[7]?'percent':'number'}:null;
}
function bcVisualValueTone(text,label='',comparison=false){
 const n=bcVisualAmount(text);if(!n||comparison||n.value===0)return'';if(n.value<0)return'bad';
 const l=String(label).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(/prejuizo|margem negativa|saldo negativo/.test(l))return'bad';
 if(/atras|pendenc|sem custo|faltante/.test(l))return'attention';
 if(/margem|margens|resultado|saldo|lucro|contribui/.test(l))return'good';
 if(!/devolu|cancel/.test(l)&&/faturamento|receita|pedidos identificados|unidades vendidas/.test(l))return'info';return'';
}
function bcVisualResultColors(root){
 /* bc-tacos-inline */
 for(const e of root.querySelectorAll('p')){if(/meta|teto|limite|objetivo/i.test(e.textContent))continue;for(const node of [...e.childNodes]){if(node.nodeType!==3||!/tacos/i.test(node.textContent))continue;const pattern=/(TACOS(?: da parcela apurada)?\s*:?\s*)([+-]?\d[\d.,]*\s*%)/gi,parts=[...node.textContent.matchAll(pattern)];if(!parts.length)continue;const fragment=document.createDocumentFragment();let at=0;for(const m of parts){fragment.append(document.createTextNode(node.textContent.slice(at,m.index)+m[1]));const value=bcVisualAmount(m[2]),span=document.createElement('span');span.textContent=m[2];const tone=value?window.BCGerencialModelo?.tomTacos(value.value)||(value.value<3?'good':value.value<5?'attention':'bad'):'neutral';span.dataset.metricTone=tone;span.dataset.bcResult=tone;fragment.append(span);at=m.index+m[0].length;}fragment.append(document.createTextNode(node.textContent.slice(at)));node.replaceWith(fragment);}}

 const headers=new Map(),primary='.sum-value,.kpi-val,.bc-metric-value';
 for(const e of root.querySelectorAll(primary+',.sum-bridge strong,.ger-values dd,.op-facts dd,dd,td,td span,td strong,dd span,dd strong,.money,.sum-negative,.neg,.pos')){
  if(e.closest('thead,form,code,kbd,a,button,.bc-technical,.sum-delta,.sum-change,[data-direction]')||e.querySelector('input,select,button,a,table'))continue;
  const main=e.matches(primary),card=main?e.closest('.sum-card,.bc-metric,.kpi'):null;let label=card?.querySelector('h3,.bc-metric-label,.kpi-eye')?.textContent||'';
  const table=e.closest('table'),cell=e.closest('td');if(table&&cell){if(!headers.has(table))headers.set(table,[...table.querySelectorAll('thead tr:last-child th')].map(h=>h.textContent));label=headers.get(table)[cell.cellIndex]||'';}
  /* bc-dd-label */ if(!label&&e.matches('dd'))label=e.previousElementSibling?.textContent||'';
  if(e===cell&&/tacos/i.test(label)&&/teto|meta|limite/i.test(label)&&!e.querySelector('[data-metric-tone]')){const pair=e.textContent.trim().match(/^([+-]?[\d.,]+\s*%)(\s*\/.*)$/);if(pair){const actual=document.createElement('span'),amount=bcVisualAmount(pair[1]);actual.textContent=pair[1];actual.dataset.metricTone=actual.dataset.bcResult=window.BCGerencialModelo?.tomTacos(amount?.value)||'neutral';e.replaceChildren(actual,document.createTextNode(pair[2]));}}
  const comparison=/varia[cç][aã]o|diferen[cç]a|crescimento|redu[cç][aã]o|desvio|compara[cç][aã]o/i.test(label);
  const direct=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(),text=main&&bcVisualAmount(direct)?direct:e.textContent,n=bcVisualAmount(text);
  let tone=main?bcVisualValueTone(text,label,comparison):n?.unit!=='number'&&n?.value<0&&!comparison?'bad':'';
  if(!main&&e.classList.contains('sum-negative')&&n?.value<0&&!comparison)tone='bad';
  const explicit=e.closest('[data-margin-tone]')?.dataset.marginTone;if(explicit&&tone!=='bad')tone=explicit==='neutral'?'':explicit;
  /* bc-tacos-regua-3-5 */
  const semantic=e.closest('[data-metric-tone]')?.dataset.metricTone;if(semantic&&tone!=='bad')tone=semantic==='neutral'?'':semantic;
  if(/margem|pré.?ads|pós.?ads|^mc\s*\(/i.test(label)&&!comparison&&n?.unit==='percent')tone=window.BCGerencialModelo?.tomMargem(n.value<0?-1:0,n.value)||tone;
  if(/tacos/i.test(label)&&!/meta|teto|limite|objetivo/i.test(label)&&!comparison&&n?.unit==='percent')tone=window.BCGerencialModelo?.tomTacos(n.value)||(n.value<3?'good':n.value<5?'attention':'bad');
  if(tone)e.dataset.bcResult=tone;else delete e.dataset.bcResult;
  if(card){if(tone)card.dataset.bcResult=tone;else delete card.dataset.bcResult;}
 }
}
function bcVisualChartColors(chart){
 const bad=document.body.classList.contains('light')?'#c91d38':'#ff5c66';
 for(const d of chart.data?.datasets||[]){const type=d.type||chart.config.type,financial=/margem|resultado|saldo|lucro|contribui/i.test(d.label||''),state=BCVisual.colorState.get(d)||{};
  /* bc-financial-series */
  const label=d.label||'',seriesColor=/^(faturamento|receita(?: de vendas)?)$/i.test(label)?'#60a5fa':/(pré.?ads|antes.*ads)/i.test(label)?'#94a3b8':/(pós.?ads|depois.*ads|após.*ads|margem registrada)/i.test(label)?'#22d38a':null;
  if(seriesColor&&type==='line'&&/(pré.?ads|antes.*ads)/i.test(label))d.borderDash=[5,5];
  if(seriesColor&&(chart.data.datasets||[]).some(s=>(s.type||chart.config.type)==='bar'))d.order=type==='bar'?2:/(pré.?ads|antes.*ads)/i.test(label)?1:0;
  for(const key of ['backgroundColor','borderColor','pointBackgroundColor','pointBorderColor']){
   const fallback=financial&&type==='bar'&&key==='backgroundColor'?'#60a5fa':financial&&type==='line'&&key==='pointBackgroundColor'?(state.borderColor?.raw||d.borderColor||'#60a5fa'):null;
   if(!d[key]&&!fallback)continue;let raw=state[key]&&d[key]===state[key].applied?state[key].raw:d[key]||fallback;if(seriesColor&&!Array.isArray(raw)&&typeof raw!=='function'&&(type==='bar'||key!=='backgroundColor'))raw=seriesColor;let color=bcVisualColor(raw);
   if(financial&&typeof color!=='function'&&(type==='bar'||type==='line'&&key.startsWith('point')))color=(d.data||[]).map((v,i)=>{const n=typeof v==='number'?v:v&&typeof v==='object'?v.y:null;return n!==null&&n<0?bad:Array.isArray(color)?color[i%color.length]:color;});
   d[key]=color;state[key]={raw,applied:color};
  }BCVisual.colorState.set(d,state);
 }
}

function bcVisualGuide(root,spec){const existing=root.querySelector(':scope > .bc-reading-guide');if(existing){if(root.firstElementChild!==existing)root.prepend(existing);return;}const d=document.createElement('details');d.className='bc-reading-guide';const s=document.createElement('summary');s.textContent='Como ler '+spec.title;d.append(s);for(const text of [spec.read,spec.scope,spec.next]){const p=document.createElement('p');p.textContent=text;d.append(p);}root.prepend(d);}
function bcVisualTypography(root){
 for(const e of root.querySelectorAll('.cc-title,.kpi-eye,.sl,h2,h3,h4,button,summary,.stab,.pf-lbl,option,.a2-subb,.a2-lvb,.diag-title,.a2-sh,.a2-shh,.a2-ttl,.bc-metric-label,.gf-subb,.a2-pill,.a2-db,.a2-cc .lb,.a2-gm .ml')){
  for(const n of [...e.childNodes])if(n.nodeType===3){const v=bcVisualLabel(n.textContent);if(v!==n.textContent)n.textContent=v;}
 }
 for(const e of root.querySelectorAll('[style]')){
  if(e.closest('canvas,.bc-viz-tools,.bc-reading-guide,.met-root,.bc-com-root'))continue;
  const size=parseFloat(e.style.fontSize),tag=e.tagName;
  if(size>0&&size<12&&tag!=='I'&&tag!=='SVG'&&!e.matches('button,input,select,textarea,td,th'))e.classList.add('bc-small-copy');
  if(size>=14&&!e.closest('table')&&e.textContent.length<130)for(const n of [...e.childNodes])if(n.nodeType===3){const clean=bcVisualLabel(n.textContent);if(clean!==n.textContent)n.textContent=clean;}
  const tone=bcVisualTone(e.style.color);if(tone)e.dataset.bcInk=tone;
 }
 for(const input of root.querySelectorAll('input:not([type=hidden]):not([type=file]),select,textarea'))if(!input.getAttribute('aria-label')&&!input.labels?.length){let text=input.previousElementSibling?.textContent||input.closest('label')?.textContent||input.placeholder||input.title;if(text)input.setAttribute('aria-label',bcVisualLabel(text).trim().slice(0,100));}
}
function bcVisualMetrics(root){
 for(const group of root.querySelectorAll('.kpi-row,[id$="-kpis"],#proj-kpis,#mkt-kpis,#kpi-row>.g3,#kpi-row>.g4,.gf-kpis,[style*="display:grid"],[style*="display: grid"]')){
  if(!group.children.length||!group.querySelector('.kpi,[style*="font-size:22px"],[style*="font-size:20px"],[style*="font-size:26px"]'))continue;
  const candidates=[...group.children].filter(card=>!card.matches('.g3,.g4,button,style')&&!card.querySelector('canvas,table,input,select,img')&&(card.matches('.kpi')||[...card.children].some(e=>parseFloat(e.style.fontSize)>=18&&/[\dR$%]/.test(e.textContent))));if(!candidates.length)continue;group.classList.add('bc-metrics');
  for(const card of candidates){card.classList.add('bc-metric');const direct=[...card.children].filter(e=>!e.matches('.kpi-glow,.kpi-accent,.kpi-help'));
   const label=card.querySelector('.kpi-eye')||direct[0],value=card.querySelector('.kpi-val')||direct.find(e=>parseFloat(e.style.fontSize)>=18);
   if(label)label.classList.add('bc-metric-label');if(value){value.classList.add('bc-metric-value');const tone=bcVisualTone(value.style.color);if(['good','bad','attention'].includes(tone))card.dataset.bcTone=tone;}
   for(const c of direct)if(c!==label&&c!==value&&!c.classList.contains('kpi-pct'))c.classList.add('bc-metric-copy');
  }
 }
 for(const grid of root.querySelectorAll('.cc-grid'))grid.classList.add('bc-layout-grid');
}
// A cor identifica a origem; o nome continua sendo o identificador acessível.
function bcVisualIdentities(root){
 for(const table of root.querySelectorAll('table')){
  if(!bcVisualVisible(table))continue;
  const headers=[...table.querySelectorAll('thead tr:last-child th')].map(e=>e.textContent.replace(/[▾▴⇅]/g,'').trim().toLowerCase());
  if(!headers.includes('empresa')&&!headers.includes('marketplace'))continue;
  for(const row of table.querySelectorAll('tbody tr'))for(const td of row.cells){
   const kind=headers[td.cellIndex];if(kind!=='empresa'&&kind!=='marketplace'||td.querySelector(':scope > .bc-identity-tag'))continue;
   const marker=td.firstElementChild;if(!marker||marker.tagName!=='SPAN'||marker.style.borderRadius!=='50%')continue;
   const tag=document.createElement('span');tag.className='bc-identity-tag';tag.dataset.identityKind=kind;tag.style.setProperty('--identity-color',marker.style.backgroundColor||'#91a0b7');
   marker.classList.add('bc-identity-marker');marker.setAttribute('aria-hidden','true');while(td.firstChild)tag.append(td.firstChild);td.append(tag);
  }
 }
}
function bcVisualTables(root,spec){
 for(const table of root.querySelectorAll('table')){let wrap=table.parentElement;if(!wrap.classList.contains('bc-table-scroll')){if(wrap.matches('.tbl-wrap,[style*="overflow:auto"],[style*="overflow-x:auto"]'))wrap.classList.add('bc-table-scroll');else{const next=document.createElement('div');next.className='bc-table-scroll';table.before(next);next.append(table);wrap=next;}}
  if(!table.getAttribute('aria-label')&&!table.querySelector('caption'))table.setAttribute('aria-label',spec.title+' · demonstrativo');
  wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Tabela de '+spec.title+' · role para consultar todas as colunas');
 }
}
function bcVisualTechnical(root){
 const mark=e=>{if(e&&!e.classList.contains('bc-technical'))e.classList.add('bc-technical');};
 for(const e of root.querySelectorAll('code,kbd,samp,.champ-sku,a[href*="mercadolivre.com.br/vendas/"]'))mark(e);
 for(const table of root.querySelectorAll('table')){if(!bcVisualVisible(table))continue;const heads=[...table.querySelectorAll('thead tr:last-child th')].map(e=>e.textContent.normalize('NFD').replace(/[\u0300-\u036f▾▴⇅]/g,'').trim().toLowerCase());
  const indexes=heads.map((h,i)=>/^(?:sku|seller sku|id anuncio|id do anuncio|id venda|id da venda|n[ºo°.]* (?:da venda|do pedido)|pedido|numero do pedido|numero da venda|ean|ncm|codigo|id)$/.test(h)?i:-1).filter(i=>i>=0);
  for(const tr of table.querySelectorAll('tbody tr'))for(const i of indexes)mark(tr.cells[i]);
 }
}
function bcVisualType(root){
 bcVisualTechnical(root);const pending=[];
 for(const e of root.querySelectorAll('*')){const inline=e.style?.fontSize+'|'+e.style?.fontWeight;if(BCType.seen.get(e)===inline||e.matches('script,style,option,canvas,svg,svg *,path'))continue;const text=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(!/[\p{L}\p{N}]/u.test(text)||!bcVisualVisible(e))continue;BCType.seen.set(e,inline);pending.push(e);}
 // Separar leituras e escritas evita recalcular o layout a cada célula de tabelas grandes.
 for(const e of pending){if(e.classList.contains('bc-type-caption')||e.classList.contains('bc-type-bold'))e.classList.remove('bc-type-caption','bc-type-bold');if(/^(?:·\s*)?ML[A-Z]\d+(?:\s*↗)?$/i.test(e.textContent.trim()))e.classList.add('bc-technical');}
 const changes=pending.map(e=>{const style=getComputedStyle(e);return{e,caption:parseFloat(style.fontSize)<12,bold:Number(style.fontWeight)>700};});
 for(const {e,caption,bold}of changes){if(caption)e.classList.add('bc-type-caption');if(bold)e.classList.add('bc-type-bold');}
}
function bcVisualFont(font,min=12){
 if(typeof font==='function'){let sizes=BCType.fontWrappers.get(font);if(!sizes){sizes=new Map();BCType.fontWrappers.set(font,sizes);}if(!sizes.has(min)){const wrapper=function(...args){return bcVisualFont(font.apply(this,args),min);};sizes.set(min,wrapper);BCType.fontWrappers.set(wrapper,new Map([[min,wrapper]]));}return sizes.get(min);}
 const f=font&&typeof font==='object'?font:{};return{...f,family:BCType.family,size:Math.max(min,Number(f.size)||min),lineHeight:1.5,...(Number(f.weight)>700?{weight:700}:{})};
}
function bcVisualChartTypography(chart){
 const o=chart.config.options;if(!o)return;
 if(o.plugins!==false){const p=o.plugins??={};if(p.legend!==false){const legend=p.legend??={},labels=legend.labels??={};labels.font=bcVisualFont(labels.font,13);}
  if(p.tooltip!==false){const t=p.tooltip??={};for(const key of ['titleFont','bodyFont','footerFont'])t[key]=bcVisualFont(t[key],13);}
  if(p.datalabels&&p.datalabels!==false)p.datalabels.font=bcVisualFont(p.datalabels.font,12);
 }
 for(const scale of Object.values(o.scales||{})){if(scale.ticks)scale.ticks.font=bcVisualFont(scale.ticks.font,12);if(scale.title)scale.title.font=bcVisualFont(scale.title.font,13);}
}
function bcVisualTypeStart(){
 if(typeof Chart==='function'){Object.assign(Chart.defaults.font,{family:BCType.family,size:12,lineHeight:1.5});Chart.register({id:'bcTypography',beforeInit:bcVisualChartTypography,beforeUpdate:bcVisualChartTypography},{id:'bcSemanticColors',beforeUpdate:bcVisualChartColors});
  for(const canvas of document.querySelectorAll('canvas')){const chart=bcVisualChart(canvas);if(chart){bcVisualChartTypography(chart);chart.update('none');}}
  document.fonts?.ready.then(()=>{for(const canvas of document.querySelectorAll('canvas')){const chart=bcVisualChart(canvas);if(chart&&bcVisualVisible(canvas)){chart.resize();chart.update('none');}}});
 }
}
function bcVisualFilterBars(root){for(const bar of root.querySelectorAll('.perf-fbar'))bar.classList.remove('bc-filter-empty');for(const select of root.querySelectorAll('select')){const label=select.previousElementSibling;if(label?.classList.contains('pf-lbl'))label.classList.toggle('bc-context-label-hidden',!bcVisualVisible(select));}for(const bar of root.querySelectorAll('.perf-fbar'))if(![...bar.querySelectorAll('button,select,input:not([type=hidden]):not([type=file]),label[for]')].some(bcVisualVisible))bar.classList.add('bc-filter-empty');}
function bcVisualChart(canvas){if(typeof Chart!=='function')return null;return Chart.getChart(canvas)||null;}
function bcVisualChartTitle(canvas,root,spec){const card=canvas.closest('.cc,.bc-area'),title=card?.querySelector('.cc-title,h3,h4');return bcVisualLabel(canvas.getAttribute('aria-label')||title?.textContent||spec.title);}
function bcVisualCharts(root,spec){
 for(const canvas of root.querySelectorAll('canvas')){let chart=bcVisualChart(canvas);const empty=canvas.closest('.bc-chart-empty-frame');if(chart&&empty&&bcVisualVisible(empty)){empty.classList.remove('bc-chart-empty-frame');empty.querySelector('.bc-chart-empty')?.remove();}if(!bcVisualVisible(canvas)||canvas.closest('#ger-sub-metas,#ger-sub-comissao,.bc-viz-dialog'))continue;if(!chart&&!/^(c-|gf-c-)/.test(canvas.id))continue;
  let frame=canvas.parentElement;if(!frame.classList.contains('bc-viz-frame')){if(frame.matches('.cc,.g2,.g3')||frame===root){const wrapper=document.createElement('div');wrapper.className='bc-viz-frame';canvas.before(wrapper);wrapper.append(canvas);frame=wrapper;}else frame.classList.add('bc-viz-frame');if(chart){chart.unbindEvents();chart.bindEvents();}}
  if(!chart){frame.classList.add('bc-chart-empty-frame');if(!frame.querySelector('.bc-chart-empty')){const p=document.createElement('p');p.className='bc-chart-empty';p.textContent='Gráfico sem série disponível para esta consulta.';frame.append(p);}continue;}frame.classList.remove('bc-chart-empty-frame');frame.querySelector('.bc-chart-empty')?.remove();
  let tools=frame.previousElementSibling;if(!tools?.classList.contains('bc-viz-tools')){tools=document.createElement('div');tools.className='bc-viz-tools';const b=document.createElement('button');b.type='button';b.className='bc-viz-action';b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span>Ampliar gráfico</span>';b.addEventListener('click',()=>bcVisualZoom(canvas,b,spec));tools.append(b);frame.before(tools);}const title=bcVisualChartTitle(canvas,root,spec);tools.querySelector('button').setAttribute('aria-label','Ampliar gráfico: '+title);canvas.setAttribute('role','img');canvas.setAttribute('aria-label',title);
  const light=document.body.classList.contains('light'),state=BCVisual.chartState.get(chart);if(state?.light===light)continue;BCVisual.chartState.set(chart,{light});
  const ink=light?'#526176':'#b8c4d6',grid=light?'rgba(50,65,90,.1)':'rgba(155,174,204,.12)';chart.options.maintainAspectRatio=false;
  if(!['pie','doughnut','polarArea','scatter','bubble'].includes(chart.config.type)){chart.options.interaction={...chart.options.interaction,mode:'index',intersect:false};}
  if(chart.options.plugins?.legend?.labels){chart.options.plugins.legend.labels.color=ink;chart.options.plugins.legend.labels.font={...chart.options.plugins.legend.labels.font,size:13};}
  for(const s of Object.values(chart.options.scales||{})){if(s.ticks){s.ticks.color=ink;s.ticks.font={...s.ticks.font,size:12};}if(s.grid)s.grid.color=grid;}
  bcVisualChartColors(chart);for(const d of chart.data.datasets||[]){if((d.type||chart.config.type)==='line'){d.borderWidth=Math.max(3,Number(d.borderWidth)||0);d.pointHitRadius=Math.max(14,Number(d.pointHitRadius)||0);d.pointHoverRadius=6;}}
  chart.update('none');chart.resize();
 }
}
function bcVisualChartRows(chart){const rows=[];for(let i=0;i<(chart.data.labels||[]).length;i++){for(let j=0;j<chart.data.datasets.length;j++){const d=chart.data.datasets[j],raw=d.data?.[i];if(raw===undefined||raw===null)continue;let value;const cb=chart.options.plugins?.tooltip?.callbacks?.label;
   try{if(typeof cb==='function')value=cb.call(chart.tooltip,{chart,label:chart.data.labels[i],dataIndex:i,datasetIndex:j,dataset:d,raw,parsed:raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{x:i,y:raw},formattedValue:String(raw)});}catch(_){}
   if(value===undefined||value===null||String(value)==='')value=Array.isArray(raw)?raw.map(bcVisualNumber).join(' → '):raw&&typeof raw==='object'?Object.entries(raw).map(([k,v])=>k+': '+bcVisualNumber(v)).join(' · '):bcVisualNumber(raw);
   rows.push({label:String(chart.data.labels[i]),series:String(d.label||'Valor'),value:Array.isArray(value)?value.join(' · '):String(value)});
 }}return rows;}
function bcVisualNumber(v){return typeof v==='number'?v.toLocaleString('pt-BR',{maximumFractionDigits:12}):String(v??'Não informado');}
function bcVisualZoom(canvas,button,spec){const chart=bcVisualChart(canvas);if(!chart)return;bcVisualZoomClose(false);let dialog=document.getElementById('bc-viz-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='bc-viz-dialog';dialog.className='bc-viz-dialog';dialog.setAttribute('aria-labelledby','bc-viz-title');dialog.innerHTML='<header><div><h2 id="bc-viz-title"></h2><p id="bc-viz-context"></p></div><div><button type="button" class="bc-viz-action" id="bc-viz-view">Ver valores</button><button type="button" class="bc-viz-action" id="bc-viz-full">Tela cheia</button><button type="button" class="bc-viz-action" id="bc-viz-close">Fechar</button></div></header><div id="bc-viz-body"></div><div id="bc-viz-values" class="bc-viz-data" hidden></div><p id="bc-viz-note">Passe o cursor ou toque no gráfico para consultar os valores.</p>';document.body.append(dialog);dialog.addEventListener('cancel',e=>{e.preventDefault();bcVisualZoomClose();});document.getElementById('bc-viz-close').onclick=()=>bcVisualZoomClose();document.getElementById('bc-viz-view').onclick=()=>{const data=document.getElementById('bc-viz-values'),body=document.getElementById('bc-viz-body'),show=data.hidden;data.hidden=!show;body.hidden=show;document.getElementById('bc-viz-view').textContent=show?'Ver gráfico':'Ver valores';if(!show)BCVisual.zoom?.chart.resize();};document.getElementById('bc-viz-full').onclick=()=>BCFullscreen.toggle(dialog,document.getElementById('bc-viz-full'),()=>BCVisual.zoom?.chart.resize());}
 const frame=canvas.parentElement,mark=document.createComment('gráfico na área de origem');frame.before(mark);const overflow=document.body.style.overflow;BCVisual.zoom={chart,canvas,frame,mark,button,overflow,spec};document.body.style.overflow='hidden';document.getElementById('bc-viz-title').textContent=canvas.getAttribute('aria-label')||spec.title;document.getElementById('bc-viz-context').textContent=spec.title+' · '+(document.querySelector('#bc-context-summary')?.textContent||document.querySelector('#bc-scope-summary')?.textContent||'Consulta atual')+' · '+(document.querySelector('#bc-period-summary')?.textContent||'');document.getElementById('bc-viz-body').append(frame);document.getElementById('bc-viz-body').hidden=false;document.getElementById('bc-viz-values').hidden=true;document.getElementById('bc-viz-view').textContent='Ver valores';document.getElementById('bc-viz-full').hidden=false;
 const values=document.getElementById('bc-viz-values');values.replaceChildren();const table=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');for(const name of ['Período ou categoria','Indicador','Valor']){const th=document.createElement('th');th.textContent=name;tr.append(th);}head.append(tr);table.append(head);const body=document.createElement('tbody');for(const row of bcVisualChartRows(chart)){const tr=document.createElement('tr');for(const value of [row.label,row.series,row.value]){const td=document.createElement('td');td.textContent=value;tr.append(td);}body.append(tr);}table.append(body);values.append(table);for(const s of Object.values(chart.options.scales||{}))if(s.ticks)s.ticks.font={...s.ticks.font,size:15};dialog.showModal();document.getElementById('bc-viz-close').focus();requestAnimationFrame(()=>{chart.resize();chart.update('none');});}
function bcVisualZoomClose(focus=true){const q=BCVisual.zoom;if(!q)return;BCVisual.zoom=null;const d=document.getElementById('bc-viz-dialog');BCFullscreen.release(d);if(q.mark.isConnected)q.mark.replaceWith(q.frame);else q.frame.remove();document.body.style.overflow=q.overflow;if(d.open)d.close();if(bcVisualChart(q.canvas)===q.chart){for(const s of Object.values(q.chart.options.scales||{}))if(s.ticks)s.ticks.font={...s.ticks.font,size:12};q.chart.resize();q.chart.update('none');}if(focus&&q.button.isConnected)q.button.focus({preventScroll:true});}
function bcVisualUtility(){for(const e of document.querySelectorAll('.modal-box,.bca-card,.bcl-card,.bct-card,.exec-box,.guide-box,#ac2-modal .a2-modal,.a2-dialog'))if(bcVisualVisible(e))e.classList.add('bc-utility-surface');}
function bcVisualRefresh(){BCVisual.pending=false;if(BCVisual.zoom&&!bcVisualVisible(BCVisual.zoom.mark.parentElement))bcVisualZoomClose(false);for(const [key,spec]of Object.entries(BCAreas)){const root=document.querySelector(spec.selector);if(!root)continue;root.classList.add('bc-area');root.dataset.bcArea=key;if(!bcVisualVisible(root))continue;BCVisual.areas.add(key);bcVisualGuide(root,spec);bcVisualMetrics(root);bcVisualTypography(root);bcVisualResultColors(root);bcVisualFilterBars(root);bcVisualTables(root,spec);bcVisualCharts(root,spec);}for(const d of document.querySelectorAll('dialog[open],.modal.on')){bcVisualResultColors(d);if(!d.matches('.bc-viz-dialog,.bc-com-zoom,.met-ampliado'))bcVisualCharts(d,{title:d.querySelector('h2,h3')?.textContent||'Gráfico'});}bcVisualIdentities(document);bcVisualUtility();bcChromeRefresh();for(const root of document.querySelectorAll('.hdr,#main-nav,.bc-view-heading,[id^="page-"],dialog[open],#bc-login.on,#bc-trat.on,#bc-pwd.on,#bc-admin.on'))if(bcVisualVisible(root))bcVisualType(root);}
function bcVisualSchedule(){if(BCVisual.pending)return;BCVisual.pending=true;queueMicrotask(bcVisualRefresh);}
function bcVisualStart(){document.body.classList.add('bc-visual-complete');bcVisualTypeStart();bcVisualRefresh();new MutationObserver(records=>{if(records.some(r=>r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches?.('.bc-viz-tools,.bc-reading-guide'))))bcVisualSchedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});new MutationObserver(bcVisualSchedule).observe(document.body,{attributes:true,attributeFilter:['class']});document.addEventListener('click',()=>{if(BCVisual.zoom&&!BCVisual.zoom.canvas.isConnected)bcVisualZoomClose(false);bcVisualSchedule();},true);document.addEventListener('change',bcVisualSchedule,true);window.addEventListener('resize',bcVisualSchedule);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bcVisualStart);else bcVisualStart();
