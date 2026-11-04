/* Contrato de recursos compartilhado pelo servidor e pela interface. Só restringe o perfil. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BCAcessos=api;})(typeof window==='object'?window:this,function(){
 'use strict';
 const todos=['direcao','coordenacao','gestor'];
 const posvenda=[...todos,'posvenda'];
 const produtos=['direcao','coordenacao','gestor','compradora','estoque'];
 const financeiro=['direcao','coordenacao','gestor','compradora'];
 const catalogo=[
  {id:'produtos.ver',nome:'Consultar Produtos',grupo:'Produtos',perfis:produtos,descricao:'Cadastro operacional. O acesso aos pontos é atribuído separadamente nesta administração.'},
  {id:'produtos.custos.ver',nome:'Consultar custos de Produtos',grupo:'Produtos',perfis:financeiro,requer:'produtos.ver',descricao:'Valores privados somente nos pontos autorizados. Estoque não recebe custos.'},
  {id:'produtos.custos.editar',nome:'Cadastrar custos de Produtos',grupo:'Produtos',perfis:financeiro,requer:'produtos.custos.ver',descricao:'Preparar versões e composições nos pontos autorizados.'},
  {id:'produtos.custos.aprovar',nome:'Aprovar custos de Produtos',grupo:'Produtos',perfis:['direcao','compradora'],requer:'produtos.custos.editar',descricao:'Uma pessoa autorizada aprova cada versão. Também exige concessão de aprovação por ponto.'},
  {id:'vendas.ver',nome:'Dados de vendas e resultados',grupo:'Visualização',perfis:todos,descricao:'Resultados, Vendas, Raio-X, Forecast e os indicadores usados na gestão. Essas telas compartilham a mesma base.'},
  {id:'gestao.ver',nome:'Gestão das operações',grupo:'Visualização',perfis:todos,requer:'vendas.ver',descricao:'Panorama, Vendas da operação, Diagnóstico, Anúncios, Publicidade e Metas. O gestor continua limitado à própria carteira.'},
  {id:'estoque.ver',nome:'Estoque e planejamento',grupo:'Visualização',perfis:todos,descricao:'Estoque, Projeção e dados de Full. Full também exige Gestão e Dados de vendas.'},
  {id:'envios.ver',nome:'Consultar Envios',grupo:'Visualização',perfis:todos,descricao:'Contagens de coleta, Flex e Full registradas por operação.'},
  {id:'acompanhamento.ver',nome:'Consultar Acompanhamento',grupo:'Visualização',perfis:todos,descricao:'Tarefas, Promoções e Ads dentro da carteira autorizada.'},
  {id:'posvenda.ver',nome:'Consultar Pós-venda',grupo:'Pós-venda',perfis:posvenda,requer:'vendas.ver',requerExceto:['posvenda'],descricao:'Atendimentos de clientes. Gestor limitado à própria carteira.'},
  {id:'posvenda.tratar',nome:'Registrar atendimentos e ações',grupo:'Pós-venda',perfis:posvenda,requer:'posvenda.ver',descricao:'Abrir atendimentos, registrar ações, definir responsável e prazo e atualizar a situação.'},
  {id:'comissao.ver',nome:'Consultar Comissão',grupo:'Visualização',perfis:todos,descricao:'Gestor: registros da própria carteira. Coordenação e Direção: escopo atual do perfil.'},
  {id:'dre.ver',nome:'Consultar DRE',grupo:'Visualização',perfis:['direcao'],descricao:'Custos e resultado financeiro. Exclusivo da Direção.'},
  {id:'acompanhamento.tratar',nome:'Registrar tratativas',grupo:'Ações',perfis:todos,requer:'acompanhamento.ver',descricao:'Registrar ações nas demandas autorizadas.'},
  {id:'envios.lancar',nome:'Lançar e importar Envios',grupo:'Ações',perfis:['direcao','coordenacao'],requer:'envios.ver',descricao:'Preenchimento e importação das contagens de envios.'},
  {id:'comissao.lancar',nome:'Lançar Comissão',grupo:'Ações',perfis:['direcao'],requer:'comissao.ver',descricao:'Alterar registros de comissão pelos fluxos existentes.'},
  {id:'dre.lancar',nome:'Lançar custos da DRE',grupo:'Ações',perfis:['direcao'],requer:'dre.ver',descricao:'Preencher e importar custos. Exclusivo da Direção.'}
 ];
 function base(perfil){return Object.fromEntries(catalogo.map(r=>[r.id,r.perfis.includes(perfil)]));}
 function dependencia(item,perfil){return item.requer&&!item.requerExceto?.includes(perfil)?item.requer:null;}
 function efetivas(perfil,restricoes={}){const out=base(perfil);for(const r of catalogo)if(restricoes[r.id]===false)out[r.id]=false;for(const r of catalogo){const required=dependencia(r,perfil);if(required&&!out[required])out[r.id]=false;}return out;}
 function normalizar(perfil,value){if(!value||typeof value!=='object'||Array.isArray(value))throw Error('As restrições de acesso são inválidas.');const out={},limites=base(perfil);for(const [key,v]of Object.entries(value)){if(!Object.hasOwn(limites,key)||typeof v!=='boolean')throw Error('Permissão inválida: '+key);if(v&&!limites[key])throw Error('Esta permissão é exclusiva de outro perfil.');if(v===false&&limites[key])out[key]=false;}return out;}
 function aprovador(user){return !!user&&(user.perfil==='compradora'||user.perfil==='direcao'&&String(user.email||'').toLowerCase()==='weskley@grupobsan');}
 function efetivasUsuario(user){const out=efetivas(user.perfil,user.restricoes||{});if(!aprovador(user))out['produtos.custos.aprovar']=false;return out;}
 function pode(user,key){return !!user&&efetivasUsuario(user)[key]===true;}
 function pagina(user,page,sub){const can=k=>pode(user,k);if(page==='pos-venda')return can('posvenda.ver');if(page==='cadastro-produtos')return can('produtos.ver');if(page==='gerencial'){if(sub==='comissao')return can('comissao.ver');return can('gestao.ver')&&(sub!=='full'||can('estoque.ver'));}if(page==='dre')return can('dre.ver');if(page==='acompanhamento')return can('acompanhamento.ver');if(page==='envios')return can('envios.ver');if(page==='estoque')return can('estoque.ver');if(page==='projecao')return can('estoque.ver')&&can('vendas.ver');return can('vendas.ver');}
 function rota(user,method,path){
  if(path==='/api/health'||path==='/api/sessao'||path==='/api/trocar-senha')return true;
  if(path==='/api/produtos'||path.startsWith('/api/produtos/'))return pode(user,'produtos.ver');
  if(path==='/api/pos-venda/acessos')return user?.perfil==='direcao';
  if(path.startsWith('/api/pos-venda/'))return pode(user,method==='POST'?'posvenda.tratar':'posvenda.ver');
  if(['estoque','compradora','posvenda'].includes(user?.perfil))return false;
  if(path.startsWith('/api/admin/'))return user?.perfil==='direcao';
  if(['/api/dataset','/api/detalhe','/api/vendas','/api/vendas-agregado'].includes(path))return pode(user,'vendas.ver');
  if(['/api/abertura','/api/historico','/api/equipe'].includes(path))return pode(user,'gestao.ver')||pode(user,'acompanhamento.ver');
  if(path==='/api/gerencial/raiox')return method==='GET'&&pode(user,'gestao.ver');
  if(path==='/api/demandas')return pode(user,'acompanhamento.ver');
  if(['/api/resultados/resumo','/api/resultados/skus'].includes(path))return method==='GET'&&pode(user,'vendas.ver');
  if(path==='/api/financeiro/dre')return method==='GET'&&pode(user,'dre.ver');
  if(path==='/api/operacao/estoque')return pode(user,'estoque.ver');
  if(path==='/api/operacao/projecao')return pode(user,'estoque.ver')&&pode(user,'vendas.ver');
  if(path==='/api/tratativas'||path==='/api/comandos')return pode(user,method==='GET'?'acompanhamento.ver':'acompanhamento.tratar');
  const entrada=path.match(/^\/api\/(?:lancamentos\/)?(envios|custos|comissao)$/);if(entrada){const key={envios:'envios',custos:'dre',comissao:'comissao'}[entrada[1]];return pode(user,key+(method==='GET'?'.ver':'.lancar'));}
  return path==='/api/extras';
 }
 function filtrarExtras(data,user){const d={...data,_versions:{...data._versions}},can=k=>pode(user,k),remove=keys=>keys.forEach(k=>delete d[k]);
  if(!can('dre.ver'))remove(['custos']);if(!can('dre.lancar'))delete d._versions.custos;
  if(!can('envios.ver'))remove(['envios']);if(!can('envios.lancar'))delete d._versions.envios;
  if(!can('estoque.ver'))remove(['estoque','fullRel']);
  if(!can('gestao.ver'))remove(['ads','adsCamp','adsDia','afiliadosDia','afiliadosFonte','fullRel','produtos','skuCad']);
  if(!can('acompanhamento.ver'))remove(['acomp','acompItens']);
  if(!can('comissao.ver')){delete d._versions.comissao;if(can('gestao.ver')){const clean=r=>Object.fromEntries(Object.entries(r).filter(([k])=>!/bonus|b[oô]nus|teto|comissao|comiss[aã]o/i.test(k)));d.comissao=(d.comissao||[]).map(clean);d.comissaoDet=(d.comissaoDet||[]).map(clean);}else remove(['comissao','comissaoDet']);}
  if(!can('comissao.lancar'))delete d._versions.comissao;
  return d;
 }
 return{catalogo,base,dependencia,efetivas,efetivasUsuario,aprovador,normalizar,pode,pagina,rota,filtrarExtras};
});
