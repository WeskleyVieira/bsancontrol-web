/* Só apresentação. Não altera séries, escalas numéricas, callbacks ou regras dos indicadores. */
(function(root,factory){const plugin=factory();if(typeof module==='object')module.exports=plugin;else root.Chart?.register(plugin);})(typeof window==='object'?window:this,function(){return{
 id:'bsan-review-presentation',
 beforeUpdate(chart){
  for(const dataset of chart.data.datasets){const type=dataset.type||chart.config.type;
   if(type==='bar'){dataset.borderWidth=0;dataset.hoverBorderWidth=0;dataset.borderRadius=3;}
   if(type==='doughnut'||type==='pie'){dataset.borderWidth=0;dataset.hoverBorderWidth=0;dataset.hoverOffset=3;}
   if(type==='line'){dataset.borderWidth=2.2;if(typeof dataset.pointRadius!=='function')dataset.pointRadius=2.5;dataset.pointHoverRadius=5;}
  }
  const legend=chart.options.plugins?.legend;if(legend?.labels){legend.labels.usePointStyle=true;legend.labels.boxWidth=8;legend.labels.boxHeight=8;legend.labels.padding=15;legend.labels.font={...legend.labels.font,family:'Inter, Segoe UI, sans-serif',size:11};}
 }
};});
