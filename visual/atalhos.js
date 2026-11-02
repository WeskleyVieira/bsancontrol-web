/* Atalhos de anúncio e código (02/11/2026): o título do anúncio abre o anúncio no marketplace e SKU, ID do anúncio e
   número do pedido copiam com um clique. Vale para todas as telas sem mexer em cada uma: lê o que já está na tabela
   (ID do anúncio na linha, coluna de título) e liga. Mercado Livre e Amazon pelo próprio ID; Shopee, TikTok e Shein pelo ID
   com o marketplace/conta da linha; Magalu pela busca do título (a API não dá o código público do produto). */
(function(){'use strict';
 const ML=/^MLB\d{6,}$/i,ASIN=/^B0[A-Z0-9]{8}$/,SKU=/^(?=[^a-z]*[A-Z])(?=.*[\d-])[A-Z0-9][A-Z0-9._\/+-]{3,}$/,CODIGO=/^[A-Za-z0-9][A-Za-z0-9._\/+-]{2,}$/;
 const PULA='a,button,select,option,label,th,input,textarea,script,style,svg,nav,dialog form,.bc-copy,.bc-anuncio-link,[data-sem-atalho],[contenteditable=""],[contenteditable=true]';
 const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ▾▴⇅]/g,'').trim().toLowerCase();
 const limpa=s=>String(s||'').replace(/^\s*·\s*/,'').replace(/\s*↗\s*$/,'').trim();
 const urlAnuncio=id=>ML.test(id)?'https://produto.mercadolivre.com.br/MLB-'+id.slice(3):ASIN.test(id)?'https://www.amazon.com.br/dp/'+id:'';
 const ehAnuncio=a=>/produto\.mercadolivre\.com\.br\/MLB-?\d|amazon\.com\.br\/dp\//i.test(a.href||'');
 const ehVenda=a=>/mercadolivre\.com\.br\/vendas\/\d/i.test(a.href||'');
 // ── copiar ──
 let aviso=null,tAviso=0;
 function avisar(txt){if(!aviso){aviso=document.createElement('div');aviso.className='bc-copy-aviso';aviso.setAttribute('role','status');aviso.setAttribute('aria-live','polite');document.body.append(aviso);}
  aviso.textContent=txt;aviso.classList.add('on');clearTimeout(tAviso);tAviso=setTimeout(()=>aviso.classList.remove('on'),1600);}
 async function copiar(txt){try{await navigator.clipboard.writeText(txt);return true;}catch(e){const t=document.createElement('textarea');t.value=txt;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.append(t);t.select();let ok=false;try{ok=document.execCommand('copy');}catch(e2){}t.remove();return ok;}}
 const span=(txt,cls)=>{const s=document.createElement('span');s.className=cls;s.textContent=txt;return s;};
 function copiavel(txt,papel){const s=span(txt,'bc-copy');s.tabIndex=0;s.setAttribute('role','button');s.title='Clique para copiar';s.dataset.copiar=limpa(txt);if(papel)s.dataset.papel=papel;return s;}
 function tecnica(no){const e=no.parentElement;return !!(e&&e.closest('.bc-technical,code,kbd,samp,.champ-sku'));}
 // um texto pode ser o código sozinho ("MLB123…") ou trechos separados por "·" ("SKU · título · conta · canal")
 const forte=v=>ML.test(v)||ASIN.test(v)||SKU.test(v);
 const SEP=/(\s+[·|]\s+)/;
 // "SKU X", "Anúncio MLB…", "Pedido 2000…": só o código copia, o rótulo fica como texto
 const ROTULO=/^((?:SKU|An[uú]ncio|ID(?: do an[uú]ncio)?|Pedido|Venda|N[ºo°.]*(?: do pedido| da venda)?)\s*:?\s+)(\S+)$/i;
 const NUM=/^\d{9,20}$/,SKC=/^s[a-z]\d{12,}$/i;   // nº do item (Shopee/TikTok) e SKC da Shein
 const rotulado=v=>{const m=v.match(ROTULO);return m&&(forte(limpa(m[2]))||/^\d{6,}$/.test(m[2])||SKC.test(m[2]))?m:null;};
 const papelRotulo=r=>/^an|^id/i.test(r)?'anuncio':/^sku/i.test(r)?'sku':'pedido';
 // "Título · 18299600266": número/SKC ao lado de um título é o ID do anúncio
 const tituloSeg=p=>p.trim().length>=6&&/\s/.test(p.trim())&&!forte(p.trim());
 function marcarTextos(raiz){
  const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=limpa(n.nodeValue);if(!v||v.length>400)return NodeFilter.FILTER_REJECT;
   const e=n.parentElement;if(!e||e.closest(PULA))return NodeFilter.FILTER_REJECT;
   if(!/\s/.test(v))return forte(v)||(tecnica(n)&&CODIGO.test(v))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
   const ps=n.nodeValue.split(SEP);return ps.some(p=>forte(limpa(p))||rotulado(p.trim()))||(ps.some(tituloSeg)&&ps.some(p=>NUM.test(p.trim())||SKC.test(p.trim())))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const nos=[];while(w.nextNode())nos.push(w.currentNode);
  for(const n of nos){const frag=document.createDocumentFragment(),ps=n.nodeValue.split(SEP),comTitulo=ps.some(tituloSeg);
   for(const p of ps){const v=p.trim(),i=p.indexOf(v),m=v&&!SEP.test(p)?rotulado(v):null;
    if(v&&!SEP.test(p)&&(forte(limpa(v))||(!/\s/.test(v)&&tecnica(n)&&CODIGO.test(v)))){if(i>0)frag.append(p.slice(0,i));frag.append(copiavel(v));if(p.slice(i+v.length))frag.append(p.slice(i+v.length));}
    else if(m){frag.append(p.slice(0,i)+m[1]);frag.append(copiavel(m[2],papelRotulo(m[1])));if(p.slice(i+v.length))frag.append(p.slice(i+v.length));}
    else if(comTitulo&&!SEP.test(p)&&(NUM.test(v)||SKC.test(v))){if(i>0)frag.append(p.slice(0,i));frag.append(copiavel(v,'anuncio'));if(p.slice(i+v.length))frag.append(p.slice(i+v.length));}
    else if(p)frag.append(p);}
   n.replaceWith(frag);}
 }
 // link cujo texto é o próprio ID ("MLB123…" levando ao anúncio, nº do pedido levando à venda): o ID passa a copiar e o
 // link fica no ↗ ao lado
 function separarLinks(raiz){
  for(const a of raiz.querySelectorAll('a[href]')){if(a.dataset.atalho)continue;const v=limpa(a.textContent);
   const oque=ehAnuncio(a)&&(ML.test(v)||ASIN.test(v))?'o anúncio':ehVenda(a)&&/^\d{6,}$/.test(v)?'a venda':'';if(!oque)continue;
   const abre=document.createElement('a');abre.href=a.href;abre.target='_blank';abre.rel='noopener noreferrer';abre.className='bc-copy-abrir';abre.textContent='↗';abre.title='Abrir '+oque;abre.setAttribute('aria-label','Abrir '+oque+' '+v);abre.dataset.atalho='1';abre.addEventListener('click',e=>e.stopPropagation());
   a.replaceWith(copiavel(v),abre);}
 }
 // ── título vira link ──
 // o clique no link não chega à linha (que abre o diálogo do item): abre só o anúncio
 const linkAnuncio=(url,id,txt)=>{const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.className='bc-anuncio-link';a.title='Abrir o anúncio '+id;a.textContent=txt;a.addEventListener('click',e=>e.stopPropagation());return a;};
 const TITULO=/^(?:titulo|anuncio|produto|descricao|item|nome)(?:$|[\s/])|^campanha \/ anuncio/;   // "Anúncio / SKU", "Título do anúncio"…
 const COL_ID=/^(?:id (?:do )?anuncio|anuncio id|id)$/;
 // loja da Shopee por conta: o link do produto precisa dela (é pública, aparece na URL de qualquer anúncio)
 const LOJA_SHOPEE={'Bsan Shop':'330101798','Powerfull Imports':'932820912'};
 const MKTS=['Mercado Livre','Shopee','Amazon','Shein','Magazine Luiza','TikTok Shop','Temu','Kwai Shop'],EMPS=['Bsan Shop','Jowcase','Mary Kase','Pesseguinho Store','Powerfull Imports','Powerfull Filial'];
 // marketplace e conta da linha/cartão: a etiqueta da linha; senão o filtro do cabeçalho; senão o nome no texto
 function contexto(box){
  const tag=k=>{const e=box.querySelector('[data-identity-kind="'+k+'"]');return e?e.textContent.trim():'';};
  const sel=(id,lista)=>{const s=document.getElementById(id),t=s&&s.selectedIndex>=0?s.options[s.selectedIndex].text.trim():'';return lista.includes(t)?t:'';};
  const txt=box.textContent,acha=lista=>lista.find(x=>txt.includes(x))||'';
  return {mkt:tag('marketplace')||sel('bc-marketplace',MKTS)||acha(MKTS),emp:tag('empresa')||sel('bc-company',EMPS)||acha(EMPS)};
 }
 // SKU → ID do anúncio pelas vendas já carregadas no painel (DETALHE): a linha mostra o SKU, o link precisa do ID.
 // Vale o ID que mais vendeu daquele SKU na conta/marketplace.
 let mapa=null,mapaDe=null;
 function anuncioDoSku(sku,c){
  let D=null;try{D=typeof DETALHE!=='undefined'?DETALHE:window.DETALHE;}catch(e){}if(!Array.isArray(D)||!D.length||!sku||!c.mkt)return '';
  if(mapaDe!==D){mapa={};for(const r of D){if(!r||!r.anuncio||!r.sku)continue;const k=r.mkt+'|'+r.sku,o=mapa[k]||(mapa[k]={});const e=r.emp+'|'+r.anuncio;o[e]=(o[e]||0)+1;}mapaDe=D;}
  const o=mapa[c.mkt+'|'+sku];if(!o)return '';
  const op=Object.entries(o).filter(([e])=>!c.emp||e.startsWith(c.emp+'|')).sort((a,b)=>b[1]-a[1]);
  if(!op.length||(!c.emp&&new Set(op.map(([e])=>e.split('|')[0])).size>1))return '';
  if(!c.emp)c.emp=op[0][0].split('|')[0];return op[0][0].slice(op[0][0].indexOf('|')+1);
 }
 const skuDe=box=>{for(const s of box.querySelectorAll('.bc-copy')){const v=s.dataset.copiar;if(s.dataset.papel!=='anuncio'&&s.dataset.papel!=='pedido'&&SKU.test(v)&&!ML.test(v)&&!ASIN.test(v))return v;}return '';};
 function urlPara(id,c,titulo){
  const link=c.sku&&window.BC_LINKS&&window.BC_LINKS[c.emp+'|'+c.mkt+'|'+c.sku];if(link)return link;   // endereço real vindo da API (Magalu)
  if(ML.test(id)||ASIN.test(id))return urlAnuncio(id);
  if(/shopee/i.test(c.mkt)&&NUM.test(id)&&LOJA_SHOPEE[c.emp])return 'https://shopee.com.br/product/'+LOJA_SHOPEE[c.emp]+'/'+id;
  if(/tiktok/i.test(c.mkt)&&/^\d{15,20}$/.test(id))return 'https://shop.tiktok.com/view/product/'+id+'?region=BR&locale=pt-BR';
  if(/shein/i.test(c.mkt)&&SKC.test(id))return 'https://br.shein.com/pdsearch/'+id+'/';
  // Magalu sem o endereço: busca pelas primeiras palavras do título (a busca com o título inteiro dá 403 no site)
  if(/magazine luiza/i.test(c.mkt)&&titulo)return 'https://www.magazineluiza.com.br/busca/'+titulo.split(/\s+/).slice(0,5).map(encodeURIComponent).join('+')+'/';
  // sem o ID: a busca dentro da própria loja (Shopee) ou pelo título (Shein)
  if(/shopee/i.test(c.mkt)&&LOJA_SHOPEE[c.emp]&&titulo)return 'https://shopee.com.br/shop/'+LOJA_SHOPEE[c.emp]+'/search?keyword='+encodeURIComponent(titulo);
  if(/shein/i.test(c.mkt)&&titulo)return 'https://br.shein.com/pdsearch/'+encodeURIComponent(titulo)+'/';
  return '';
 }
 // ID do anúncio da linha: MLB/ASIN em link ou texto; senão a coluna "ID anúncio"; senão o código marcado como anúncio
 function idDaLinha(tr,colId,c){
  for(const a of tr.querySelectorAll('a[href]')){const m=(a.href||'').match(/produto\.mercadolivre\.com\.br\/MLB-?(\d{6,})/i);if(m)return 'MLB'+m[1];const z=(a.href||'').match(/amazon\.com\.br\/dp\/(B0[A-Z0-9]{8})/);if(z)return z[1];}
  for(const s of tr.querySelectorAll('.bc-copy')){const v=s.dataset.copiar;if(ML.test(v)||ASIN.test(v))return v.toUpperCase();}
  const m=tr.textContent.match(/\bMLB\d{6,}\b/i);if(m)return m[0].toUpperCase();
  if(colId>=0&&tr.cells[colId]){const v=limpa(tr.cells[colId].textContent);if(v&&!/\s/.test(v))return v;}
  const s=tr.querySelector('.bc-copy[data-papel="anuncio"]');if(s)return s.dataset.copiar;
  return c?anuncioDoSku(skuDe(tr),c):'';
 }
 const ehNome=v=>MKTS.includes(v)||EMPS.includes(v);
 function ligarTitulos(raiz){
  const tabelas=raiz.tagName==='TABLE'?[raiz]:raiz.querySelectorAll?[...raiz.querySelectorAll('table')]:[];const t0=raiz.closest&&raiz.closest('table');if(t0&&!tabelas.includes(t0))tabelas.push(t0);
  for(const tb of tabelas){const cab=[...tb.querySelectorAll('thead tr:last-child th')].map(th=>norm(th.textContent));const cols=cab.map((h,i)=>TITULO.test(h)?i:-1).filter(i=>i>=0);if(!cols.length)continue;const colId=cab.findIndex(h=>COL_ID.test(h));
   for(const tr of tb.querySelectorAll('tbody tr')){if(tr.dataset.atalhoTitulo)continue;const c=contexto(tr),id=idDaLinha(tr,colId,c);c.sku=skuDe(tr);
    for(const i of cols){const td=tr.cells[i];if(!td)continue;
     const w=document.createTreeWalker(td,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=n.nodeValue.trim();const e=n.parentElement;return v.length>=6&&/\s/.test(v)&&e&&!e.closest(PULA)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}});
     const n=w.nextNode();if(!n)continue;
     // só o trecho do título vira link ("Título · MLB…" → o "· MLB…" fica de fora)
     const partes=n.nodeValue.split(SEP),k=partes.findIndex(p=>!SEP.test(p)&&tituloSeg(p)&&!ehNome(p.trim()));if(k<0)continue;
     const p=partes[k],v=p.trim(),ini=p.indexOf(v),url=urlPara(id,c,v);if(!url)continue;
     const a=linkAnuncio(url,id||v,v),frag=document.createDocumentFragment();
     frag.append(partes.slice(0,k).join('')+p.slice(0,ini),a,p.slice(ini+v.length)+partes.slice(k+1).join(''));n.replaceWith(frag);}
    tr.dataset.atalhoTitulo='1';}
  }
 }
 // cartões e diálogos (tarefa, evidência do item): o título (h3/h4) abre o anúncio quando o cartão é de um anúncio só
 function ligarCartoes(raiz){
  const hs=[...(raiz.querySelectorAll?raiz.querySelectorAll('h3,h4'):[])];if(/^H[34]$/.test(raiz.tagName))hs.push(raiz);
  for(const h of hs){if(h.dataset.atalhoTitulo||h.closest('table,a,button'))continue;const card=h.parentElement;if(!card||card===document.body||card.querySelectorAll('h3,h4').length!==1)continue;
   const ids=new Set();for(const a of card.querySelectorAll('a[href]')){const m=(a.href||'').match(/produto\.mercadolivre\.com\.br\/MLB-?(\d{6,})/i);if(m)ids.add('MLB'+m[1]);}
   for(const m of card.textContent.matchAll(/\bMLB\d{6,}\b/gi))ids.add(m[0].toUpperCase());
   for(const s of card.querySelectorAll('.bc-copy[data-papel="anuncio"]'))ids.add(s.dataset.copiar);
   const n=[...h.childNodes].find(x=>x.nodeType===3&&tituloSeg(x.nodeValue));if(!n||ids.size>1||(!ids.size&&!card.querySelector(".bc-copy")))continue;   // sem ID e sem código no cartão não é cartão de anúncio
   const c=contexto(card);c.sku=skuDe(card);const id=[...ids][0]||anuncioDoSku(c.sku,c),url=urlPara(id,c,n.nodeValue.trim());if(!url)continue;
   const a=linkAnuncio(url,id||n.nodeValue.trim(),n.nodeValue);n.replaceWith(a);h.dataset.atalhoTitulo='1';}
 }
 function processar(raiz){if(!raiz||!raiz.isConnected||raiz.nodeType!==1||raiz.closest('.bc-copy,.bc-copy-aviso'))return;separarLinks(raiz);marcarTextos(raiz);ligarTitulos(raiz);ligarCartoes(raiz);}
 // clique e teclado: copia sem disparar o clique da linha (que abre o Raio-X/diálogo); o resto da linha segue igual
 const acionar=async e=>{const s=e.target.closest&&e.target.closest('.bc-copy');if(!s)return;if(e.type==='keydown'&&e.key!=='Enter'&&e.key!==' ')return;
  e.preventDefault();e.stopPropagation();const ok=await copiar(s.dataset.copiar);avisar(ok?'Copiado: '+s.dataset.copiar:'Não foi possível copiar');if(ok){s.classList.add('ok');setTimeout(()=>s.classList.remove('ok'),900);}};
 document.addEventListener('click',acionar,true);document.addEventListener('keydown',acionar,true);
 let fila=new Set(),agendado=false;
 const rodar=()=>{agendado=false;const itens=fila;fila=new Set();
  for(const e of itens){let p=e.parentElement,dentro=false;while(p&&!dentro){dentro=itens.has(p);p=p.parentElement;}if(!dentro)processar(e);}};   // só a raiz de cada lote
 const agendar=e=>{fila.add(e);if(!agendado){agendado=true;setTimeout(rodar,120);}};
 function iniciar(){agendar(document.body);new MutationObserver(rs=>{for(const r of rs)for(const n of r.addedNodes){if(n.nodeType===1)agendar(n);else if(n.nodeType===3&&n.parentElement)agendar(n.parentElement);}}).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
 window.BCAtalhos={processar,urlAnuncio};
})();
