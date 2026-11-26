/* Apresentação dos gráficos: dados, escalas e callbacks nativos permanecem intactos. */
(function(root,factory){
 const plugin=factory(root);
 if(typeof module==='object')module.exports=plugin;
 else{root.Chart?.register(plugin);root.BCReviewCharts=plugin.runtime;}
})(typeof window==='object'?window:null,function(root){'use strict';
 const states=new WeakMap(),canvases=new WeakMap();
 const brands={
  bsan:{primary:'#00B1EB',secondary:'#B186FF',action:'#6440A8',tint:'#F3EEFF',series:['#00B1EB','#B186FF','#437B9A','#D4BFFF','#87D7F2','#6D5792','#B5CFDC']},
  jowcase:{primary:'#2871FA',secondary:'#6717CD',action:'#6717CD',tint:'#F2EAFC',series:['#2871FA','#6717CD','#7EA6F4','#AF86DF','#335794','#B7C9EB','#584471']}
 };
 const curves={A:'#13976B',B:'#D58B09',C:'#D94457'};
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=v=>1-Math.pow(1-clamp(v),3);
 function step(progress,index,count){return ease(clamp(progress*Math.max(1,count)-index));}
 function signature(chart){return JSON.stringify([chart.config.type,chart.data.labels,chart.data.datasets.map(d=>[d.label,d.type,d.data.map(v=>v&&typeof v==='object'?[v.x,v.y,v.r]:v)])]);}
 function state(chart){let s=states.get(chart);if(!s){s={signature:'',progress:1,frame:0,start:0,pending:false,restores:new Map()};states.set(chart,s);}return s;}
 function palette(){return brands[root?.BCReviewPreferenceStore?.brand||'bsan']||brands.bsan;}
 const durations = {calm:4200, medium:2400, fast:1100, off:0};
 function duration(){return !root||root.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (durations[root.BCReviewPreferenceStore?.motion] ?? durations.calm);}
 function motion(){return duration()>0;}
 function visible(chart){const r=chart.canvas?.getBoundingClientRect?.();return !!r&&r.width>0&&r.height>0&&r.bottom>0&&r.top<root.innerHeight&&r.right>0&&r.left<root.innerWidth;}
 function cancel(s){if(s.frame)root?.cancelAnimationFrame(s.frame);s.frame=0;}
 function finish(chart){const s=state(chart);cancel(s);s.progress=1;s.pending=false;s.start=0;for(const fn of s.restores.values())fn();s.restores.clear();}
 function schedule(chart){
  const s=state(chart);
  if(!s.pending||s.frame||!motion()||!visible(chart))return;
  s.frame=root.requestAnimationFrame(now=>{
   s.frame=0;
   const time=duration();
   if(!time||!chart.ctx||!chart.canvas?.isConnected){finish(chart);return;}
   // Preserve progress when the user changes speed while the chart is forming.
   if(s.start) s.progress=clamp(s.progress+(now-s.start)/time);
   s.start=now;
   if(s.progress===1)s.pending=false;
   chart.draw();
  });
 }
 const observer=root&&typeof root.IntersectionObserver==='function'?new root.IntersectionObserver(entries=>{for(const entry of entries){const c=canvases.get(entry.target);if(entry.isIntersecting&&c)schedule(c);}},{threshold:.06}):null;
 function replay(chart){if(!chart?.ctx)return;const s=state(chart);cancel(s);s.progress=motion()?0:1;s.start=0;s.pending=motion();chart.draw();}
 function curveLabel(label){const m=String(label||'').trim().match(/^(?:Curva\s+|Classe\s+)?([ABC])(?:$|\s*[·–—-])/i);return m?m[1].toUpperCase():null;}
 function presentation(chart){chart.options.animation=false;const p=palette(),id=chart.canvas?.id||'',abc=/abc/i.test(id),labels=chart.data.labels||[];
  chart.data.datasets.forEach((dataset,index)=>{
   const type=dataset.type||chart.config.type;
   if(type==='bar'){dataset.borderWidth=0;dataset.hoverBorderWidth=0;dataset.borderRadius=3;}
   if(type==='doughnut'||type==='pie'){dataset.borderWidth=0;dataset.hoverBorderWidth=0;dataset.hoverOffset=3;
    dataset.backgroundColor=labels.map((label,i)=>abc&&curveLabel(label)?curves[curveLabel(label)]:p.series[i%p.series.length]);
   }
   if(abc&&type==='bar'&&Array.isArray(dataset.backgroundColor)){
    const old=dataset.backgroundColor,unique=[...new Set(old)];
    dataset.backgroundColor=old.map(c=>Object.values(curves).includes(c)?c:curves[['A','B','C'][Math.min(2,unique.indexOf(c))]]);
   }
   // Situações e identidades dos canais conservam as cores da origem.
   const categorical=/(amazon|mercado livre|shopee|shein|temu|tiktok|kwai|magazine|magalu|estrela|nicho|revisar|melhorar|negativ|preju[ií]zo|inferior|superior|projeção central|esperado|meta|limite|teto)/i.test(dataset.label||'');
   const uniform=!Array.isArray(dataset.backgroundColor)||dataset.backgroundColor.every(c=>c===dataset.backgroundColor[0]);
   if(['bar','line'].includes(type)&&!categorical&&uniform&&typeof dataset.backgroundColor!=='function'&&!abc){
    const secondary=/(margem|\bMC\b|lucro|contribui|p[oó]s.ads|pr[eé].ads)/i.test(dataset.label||'');const color=secondary?p.secondary:/(faturamento|receita|unidades|pedidos)/i.test(dataset.label||'')?p.primary:p.series[index%2];
    dataset.borderColor=color;if(typeof dataset.pointBackgroundColor!=='function'&&(!Array.isArray(dataset.pointBackgroundColor)||dataset.pointBackgroundColor.every(c=>c===dataset.pointBackgroundColor[0])))dataset.pointBackgroundColor=color;if(type==='bar')dataset.backgroundColor=color;
   }
   if(abc&&type==='line'&&/acumulad/i.test(dataset.label||'')){dataset.borderColor=p.secondary;dataset.pointBackgroundColor=p.secondary;}
   if(type==='line'){dataset.borderWidth=2.2;if(typeof dataset.pointRadius!=='function')dataset.pointRadius=2.5;dataset.pointHoverRadius=5;}
  });
  const enlarged=!!chart.canvas?.closest?.('dialog[open]');const legend=chart.options.plugins?.legend;if(legend?.labels){legend.labels.usePointStyle=true;legend.labels.boxWidth=8;legend.labels.boxHeight=8;legend.labels.padding=14;legend.labels.font={...legend.labels.font,family:'Inter, Segoe UI, sans-serif',size:enlarged?14:12,weight:500};}
  for(const scale of Object.values(chart.options.scales||{}))if(scale.ticks)scale.ticks.font={...scale.ticks.font,family:'Inter, Segoe UI, sans-serif',size:enlarged?14:12,weight:400};
 }
 function geometry(chart,index,progress){const meta=chart.getDatasetMeta(index),type=meta.type,restore=[];
  if(type==='line'){
   const ctx=chart.ctx,a=chart.chartArea;if(!a)return()=>{};ctx.save();ctx.beginPath();ctx.rect(a.left-5,a.top-8,(a.right-a.left+10)*progress,a.bottom-a.top+16);ctx.clip();restore.push(()=>ctx.restore());
  }else for(const [i,element]of meta.data.entries()){
   const amount=step(progress,i,meta.data.length);
   if(type==='bar'){const prop=element.horizontal?'x':'y',value=element[prop];element[prop]=element.base+(value-element.base)*amount;restore.push(()=>element[prop]=value);}
   else if(type==='bubble'||type==='scatter'){const options=element.options;element.options={...options,radius:options.radius*Math.sqrt(amount)};restore.push(()=>element.options=options);}
   else if(type==='doughnut'||type==='pie'){const end=element.endAngle,circumference=element.circumference;element.endAngle=element.startAngle+(end-element.startAngle)*amount;element.circumference=circumference*amount;restore.push(()=>{element.endAngle=end;element.circumference=circumference;});}
  }
  return()=>{for(const fn of restore.reverse())fn();};
 }
 const plugin={
  id:'bsan-review-presentation',beforeUpdate:presentation,
  afterInit(chart){state(chart);canvases.set(chart.canvas,chart);observer?.observe(chart.canvas);},
  afterUpdate(chart){if(!root)return;const s=state(chart),key=signature(chart);if(key!==s.signature){finish(chart);s.signature=key;s.progress=motion()?0:1;s.pending=motion();}},
  beforeDatasetsDraw(chart){
   const s=state(chart),a=chart.chartArea;
   if(s.progress>=1||!motion()||!a||!chart.data.datasets.some(d=>d.fill==='-1'))return;
   // O preenchimento entre séries é desenhado antes dos traçados individuais.
   chart.ctx.save();chart.ctx.beginPath();chart.ctx.rect(a.left-5,a.top-8,(a.right-a.left+10)*s.progress,a.bottom-a.top+16);chart.ctx.clip();s.bandClip=true;
  },
  afterDatasetsDraw(chart){const s=state(chart);if(s.bandClip){chart.ctx.restore();s.bandClip=false;}},
  beforeDatasetDraw(chart,args){const s=state(chart);if(s.progress<1&&motion())s.restores.set(args.index,geometry(chart,args.index,s.progress));},
  afterDatasetDraw(chart,args){const s=state(chart);s.restores.get(args.index)?.();s.restores.delete(args.index);},
  afterDraw(chart){const s=state(chart);for(const fn of s.restores.values())fn();s.restores.clear();if(!motion()){finish(chart);return;}schedule(chart);},
  beforeDestroy(chart){finish(chart);if(chart.canvas){observer?.unobserve(chart.canvas);canvases.delete(chart.canvas);}},
  afterDestroy(chart){states.delete(chart);},
  runtime:{installLast(){root.Chart?.unregister(plugin);root.Chart?.register(plugin);plugin.runtime.refresh();},replay,finish,activate(node){for(const canvas of node.querySelectorAll('canvas'))replay(root.Chart?.getChart(canvas));},refresh(){for(const chart of Object.values(root.Chart?.instances||{})){if(!chart.ctx||!chart.canvas)continue;if(!motion())finish(chart);chart.update('none');}},brands,curves},
  model:{step,signature,geometry,curveLabel,brands,curves,durations}
 };
 return plugin;
});
