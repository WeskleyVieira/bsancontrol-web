/* Atalhos de anúncio e código (02/11/2026): o título do anúncio abre o anúncio no marketplace e SKU, ID do anúncio e
   número do pedido copiam com um clique. Vale para todas as telas sem mexer em cada uma: lê o que já está na tabela
   (ID do anúncio na linha, coluna de título) e liga. Link só onde o ID diz o marketplace sozinho (MLB… e ASIN). */
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
 function copiavel(txt){const s=span(txt,'bc-copy');s.tabIndex=0;s.setAttribute('role','button');s.title='Clique para copiar';s.dataset.copiar=limpa(txt);return s;}
 function tecnica(no){const e=no.parentElement;return !!(e&&e.closest('.bc-technical,code,kbd,samp,.champ-sku'));}
 // um texto pode ser o código sozinho ("MLB123…") ou trechos separados por "·" ("SKU · título · conta · canal")
 const forte=v=>ML.test(v)||ASIN.test(v)||SKU.test(v);
 const SEP=/(\s+[·|]\s+)/;
 // "SKU X", "Anúncio MLB…", "Pedido 2000…": só o código copia, o rótulo fica como texto
 const ROTULO=/^((?:SKU|An[uú]ncio|ID(?: do an[uú]ncio)?|Pedido|Venda|N[ºo°.]*(?: do pedido| da venda)?)\s*:?\s+)(\S+)$/i;
 const rotulado=v=>{const m=v.match(ROTULO);return m&&(forte(limpa(m[2]))||/^\d{6,}$/.test(m[2]))?m:null;};
 function marcarTextos(raiz){
  const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=limpa(n.nodeValue);if(!v||v.length>400)return NodeFilter.FILTER_REJECT;
   const e=n.parentElement;if(!e||e.closest(PULA))return NodeFilter.FILTER_REJECT;
   if(!/\s/.test(v))return forte(v)||(tecnica(n)&&CODIGO.test(v))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
   return n.nodeValue.split(SEP).some(p=>forte(limpa(p))||rotulado(p.trim()))?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
  const nos=[];while(w.nextNode())nos.push(w.currentNode);
  for(const n of nos){const frag=document.createDocumentFragment();
   for(const p of n.nodeValue.split(SEP)){const v=p.trim(),i=p.indexOf(v),m=v&&!SEP.test(p)?rotulado(v):null;
    if(v&&!SEP.test(p)&&(forte(limpa(v))||(!/\s/.test(v)&&tecnica(n)&&CODIGO.test(v)))){if(i>0)frag.append(p.slice(0,i));frag.append(copiavel(v));if(p.slice(i+v.length))frag.append(p.slice(i+v.length));}
    else if(m){frag.append(p.slice(0,i)+m[1]);frag.append(copiavel(m[2]));if(p.slice(i+v.length))frag.append(p.slice(i+v.length));}
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
 function idDaLinha(tr){
  for(const a of tr.querySelectorAll('a[href]')){const m=(a.href||'').match(/produto\.mercadolivre\.com\.br\/MLB-?(\d{6,})/i);if(m)return 'MLB'+m[1];const z=(a.href||'').match(/amazon\.com\.br\/dp\/(B0[A-Z0-9]{8})/);if(z)return z[1];}
  for(const s of tr.querySelectorAll('.bc-copy')){const v=s.dataset.copiar;if(ML.test(v)||ASIN.test(v))return v.toUpperCase();}
  const m=tr.textContent.match(/\bMLB\d{6,}\b/i);return m?m[0].toUpperCase():'';
 }
 function ligarTitulos(raiz){
  const tabelas=raiz.tagName==='TABLE'?[raiz]:raiz.querySelectorAll?[...raiz.querySelectorAll('table')]:[];const t0=raiz.closest&&raiz.closest('table');if(t0&&!tabelas.includes(t0))tabelas.push(t0);
  for(const tb of tabelas){const cab=[...tb.querySelectorAll('thead tr:last-child th')].map(th=>norm(th.textContent));const cols=cab.map((h,i)=>TITULO.test(h)?i:-1).filter(i=>i>=0);if(!cols.length)continue;
   for(const tr of tb.querySelectorAll('tbody tr')){if(tr.dataset.atalhoTitulo)continue;const id=idDaLinha(tr),url=urlAnuncio(id);if(!url)continue;
    for(const i of cols){const td=tr.cells[i];if(!td)continue;
     const w=document.createTreeWalker(td,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=n.nodeValue.trim();const e=n.parentElement;return v.length>=6&&/\s/.test(v)&&e&&!e.closest(PULA)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}});
     const n=w.nextNode();if(!n)continue;
     // só o trecho do título vira link ("Título · MLB…" → o "· MLB…" fica de fora)
     const partes=n.nodeValue.split(SEP),k=partes.findIndex(p=>!SEP.test(p)&&p.trim().length>=6&&/\s/.test(p.trim())&&!forte(p.trim()));if(k<0)continue;
     const p=partes[k],v=p.trim(),ini=p.indexOf(v),frag=document.createDocumentFragment();
     const a=linkAnuncio(url,id,v);
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
   if(ids.size!==1)continue;const id=[...ids][0],url=urlAnuncio(id);const n=[...h.childNodes].find(x=>x.nodeType===3&&x.nodeValue.trim().length>=6&&/\s/.test(x.nodeValue.trim()));if(!url||!n)continue;
   const a=linkAnuncio(url,id,n.nodeValue);n.replaceWith(a);h.dataset.atalhoTitulo='1';}
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
