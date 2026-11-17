/* Identidade, leitura e controles pessoais da prévia. Sem alteração dos modelos nativos. */
(function(){'use strict';
 const preferences=window.BCReviewPreferenceStore;
 if(!preferences)return;
 const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
 function notifyFrame(){const frame=document.getElementById('cadastro-produtos-frame');frame?.contentWindow?.postMessage({type:'review-appearance',brand:preferences.brand},location.origin);}
 function appearance(){document.documentElement.dataset.reviewBrand=preferences.brand;window.BCReviewCharts?.refresh();notifyFrame();}
 function preferencesPanel(){
  const host=document.querySelector('.review-tools-content');if(!host||host.querySelector('.studio-appearance'))return;
  const group=make('fieldset','studio-appearance studio-ui');group.dataset.studioOwned='true';group.append(make('legend','','Identidade visual'));
  const choices=make('div','studio-brand-choices');
  for(const[key,title,copy]of [['bsan','Bsan Shop','Ciano e lavanda'],['jowcase','Jowcase','Azul e violeta']]){
   const label=make('label','studio-brand-choice'),input=make('input');input.type='radio';input.name='studio-brand';input.value=key;input.checked=preferences.brand===key;input.setAttribute('aria-label','Paleta '+title);
   input.onchange=()=>{preferences.setBrand(key);appearance();};
   const swatch=make('span','studio-brand-swatch');swatch.dataset.brand=key;swatch.setAttribute('aria-hidden','true');const text=make('span');text.append(make('strong','',title),make('small','',copy));label.append(input,swatch,text);choices.append(label);
  }
  group.append(choices);const motion=make('label','studio-motion-label','Animação dos gráficos'),select=make('select');select.setAttribute('aria-label','Animação dos gráficos');
  for(const[value,title]of [['calm','Progressiva · mais lenta'],['off','Sem animação']])select.append(new Option(title,value));select.value=preferences.motion;
  select.onchange=()=>{preferences.setMotion(select.value);window.BCReviewCharts?.refresh();};motion.append(select);group.append(motion);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)group.append(make('small','studio-motion-note','O dispositivo está configurado para reduzir movimentos.'));
  host.prepend(group);
 }
 function curveOf(text){const matches=[...String(text).matchAll(/\bCurva\s+([ABC])\b/g)];return matches.length?matches.at(-1)[1]:null;}
 function curves(page){
  for(const card of page.querySelectorAll('.studio-kpi')){const title=card.getAttribute('aria-label')||'',key=/^Curva [ABC]$/.test(title)?curveOf(title):null;if(key)card.dataset.studioCurve=key;}
  for(const badge of page.querySelectorAll('[class*="badge"],[class*="tag"],.ger-product-curve>span,.res-pill')){
   const text=badge.textContent.trim(),key=curveOf(text)||(/^[ABC]$/.test(text)&&/abc|curve|badge/.test(badge.className)?text:null);
   if(key&&text.length<65)badge.dataset.studioCurve=key;
  }
 }
 function imageButtons(page,route){if(!route.startsWith('acompanhamento/'))return;
  const native=page.querySelector('#ac6-share');
  let flow=page.querySelector('.studio-flow-snapshot');
  if(native)flow?.remove();
  else if(!flow&&/\/(alinhamentos|pendencias)$/.test(route)){
   const tools=page.querySelector('.studio-page-tools');if(tools){flow=make('button','studio-button studio-flow-snapshot studio-ui','Imagem para o grupo');flow.type='button';flow.dataset.studioOwned='true';tools.append(flow);}
  }
  for(const button of page.querySelectorAll('button')){
   const title=button.textContent.trim();if(!['Imagem para o grupo','Imagem detalhada'].includes(title))continue;
   button.title=title==='Imagem para o grupo'?'Criar PNG com os indicadores e os quadros dos gestores':'Criar PNG dos recursos visíveis nesta leitura';
   if(button.id==='ac6-share'||button.id==='ac6-share-details'){if(!button.dataset.studioNativeCapture){button.dataset.studioNativeCapture='true';button.addEventListener('click',event=>{event.stopImmediatePropagation();window.BCReviewSnapshot.captureNative(button,()=>window.ac2Fotos(title==='Imagem detalhada'?'detalhes':'grupo'),event);},true);}continue;}
   button.onclick=event=>{event.preventDefault();window.BCReviewSnapshot.open(page,document.getElementById('bc-page-title')?.textContent||'Acompanhamento',title==='Imagem detalhada'?'full':'summary');};
  }
 }
 function positionPeriod(){const menu=document.getElementById('bc-range-menu');if(!menu?.open)return;const panel=menu.querySelector('.bc-period-panel'),trigger=menu.querySelector('summary');if(!panel||!trigger)return;const scale=+getComputedStyle(document.body).zoom||1,r=trigger.getBoundingClientRect(),box=panel.getBoundingClientRect();panel.style.top=Math.max(12,Math.min(r.bottom+8,innerHeight-box.height-12))/scale+'px';panel.style.right=Math.max(12,innerWidth-r.right)/scale+'px';}
 document.addEventListener('toggle',event=>{if(event.target.id==='bc-range-menu')requestAnimationFrame(positionPeriod);},true);
 document.addEventListener('click',event=>{if(event.target.closest('#bc-range-menu'))requestAnimationFrame(positionPeriod);},true);
 window.addEventListener('resize',()=>requestAnimationFrame(positionPeriod));
 document.addEventListener('bc-review-composed',event=>{const {page,route}=event.detail;curves(page);imageButtons(page,route);preferencesPanel();const frame=page.querySelector('iframe');if(frame&&!frame.dataset.reviewAppearanceBound){frame.dataset.reviewAppearanceBound='true';frame.addEventListener('load',notifyFrame);notifyFrame();}});
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>window.BCReviewCharts?.refresh());
 document.documentElement.dataset.reviewBrand=preferences.brand;preferencesPanel();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>window.BCReviewCharts?.installLast(),{once:true});else window.BCReviewCharts?.installLast();
})();
