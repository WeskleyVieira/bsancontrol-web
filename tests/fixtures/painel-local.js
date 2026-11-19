'use strict';
const { DatabaseSync } = require('node:sqlite');

function criarBaseLocal(file) {
 const raw = new DatabaseSync(file);
 try {
 raw.exec(`CREATE TABLE usuarios(id INTEGER PRIMARY KEY,nome TEXT,email TEXT UNIQUE,senha TEXT,perfil TEXT,gestor_ref TEXT,ativo INTEGER);
 CREATE TABLE operacoes(empresa TEXT,marketplace TEXT,gestor TEXT,meta_margem REAL);
 CREATE TABLE datasets(nome TEXT PRIMARY KEY,json TEXT,atualizado TEXT);
 CREATE TABLE vendas(id TEXT PRIMARY KEY,data TEXT,competencia TEXT,empresa TEXT,canal TEXT,ponto TEXT,sku TEXT,anuncio_id TEXT,titulo TEXT,pedido TEXT,qtd REAL,receita REAL,liquido REAL,ctp REAL,imposto REAL,mc_real REAL,mc_comissao REAL,status TEXT,fonte_liquido TEXT,preco_cheio REAL,desconto REAL,comissao REAL,tarifas REAL,frete REAL,reembolso REAL,afiliados REAL,publicidade REAL,bonus_flex REAL,custo_motoboy REAL,custo_fatura REAL,subsidios REAL,copart_frete REAL,acerto_vapt REAL,forma_entrega TEXT,veio_de_ads TEXT);
 CREATE TABLE demandas(id TEXT PRIMARY KEY,competencia TEXT,empresa TEXT,canal TEXT,ponto TEXT,gestor TEXT,sku TEXT,anuncio_id TEXT,titulo TEXT,tipo TEXT,causa TEXT,mc_pct REAL,meta REAL,fat REAL,risco REAL,qtd REAL,pedidos INTEGER,estado TEXT,criado_em TEXT,prazo_dias REAL);
 CREATE TABLE tratativas(id INTEGER PRIMARY KEY,demanda_id TEXT,gestor TEXT,acao TEXT,causa TEXT,obs TEXT,estado TEXT,registrado_em TEXT,reacao_h REAL);
 CREATE TABLE resultados(id INTEGER PRIMARY KEY,demanda_id TEXT,verificado_em TEXT,mc_antes REAL,mc_depois REAL,desfecho TEXT,recuperado REAL);`);
 for(const c of raw.prepare('PRAGMA table_info(vendas)').all().filter(c=>c.type==='REAL'))raw.exec('ALTER TABLE vendas ADD COLUMN '+c.name+'_n NUMERIC');
 const {hashSenha}=require('../../auth'),password='Homologacao-local-2026',hash=hashSenha(password),profiles=['direcao','coordenacao','gestor','estoque','compradora','posvenda'];
 profiles.forEach((p,i)=>raw.prepare('INSERT INTO usuarios VALUES(?,?,?,?,?,?,1)').run(i+1,'QA '+p,p+'@qa.local',hash,p,p==='gestor'?'Carteira A':null));
 for(const [i,emp,ponto,gestor]of [[1,'Loja QA A','Bsan','Carteira A'],[2,'Loja QA B','Powerfull','Carteira B']]){
  raw.prepare('INSERT INTO operacoes VALUES(?,?,?,?)').run(emp,'Mercado Livre',gestor,15);
  raw.prepare('INSERT INTO vendas(id,data,competencia,empresa,canal,ponto,sku,anuncio_id,titulo,pedido,qtd,receita,liquido,ctp,imposto,mc_real,mc_comissao,status,fonte_liquido,forma_entrega) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('v'+i,'2026-11-06','2026-11',emp,'Mercado Livre',ponto,'SKU-QA','MLB100000'+i,'Produto fictício','P-QA-'+i,1,100*i,80*i,50*i,10*i,20*i,20*i,'venda','QA','Full');
  raw.prepare('INSERT INTO demandas VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run('d'+i,'2026-11',emp,'Mercado Livre',ponto,gestor,'SKU-QA','MLB100000'+i,'Demanda fictícia','Prejuízo','QA',-5,15,100,5,1,1,'diag','2026-11-05T12:00:00Z',2);
 }
 for(const [name,value]of Object.entries({ads:[{emp:'Loja QA A',mkt:'Mercado Livre',comp:'2026-11',anuncio:'MLB1000001',inv:10,recAds:50},{emp:'Loja QA B',mkt:'Mercado Livre',comp:'2026-11',anuncio:'MLB1000002',inv:20,recAds:100}],adsCamp:[],adsDia:[],comissao:[],comissaoDet:[],custos:{},envios:[{data:'2026-11-01',plataforma:'Mercado Livre',empresa:'Loja QA A',coleta:1,flex:0,full:0},{data:'2026-11-01',plataforma:'Mercado Livre',empresa:'Loja QA B',coleta:1,flex:0,full:0}],estoque:[{ponto:'Bsan',conta:'A',sku:'SKU-EST-A',produto:'Estoque Loja QA A'},{ponto:'Powerfull',conta:'B',sku:'SKU-EST-B',produto:'Estoque Loja QA B'}],produtos:[{ponto:'Bsan',conta:'A',sku:'P-A',descricao:'Produto Loja QA A'},{ponto:'Powerfull',conta:'B',sku:'P-B',descricao:'Produto Loja QA B'}],fullRel:{dia:'2026-11-01',gerado:'2026-11-01',contas:{a:{emp:'Loja QA A',mkt:'Mercado Livre',ponto:'Bsan',linhas:[]},b:{emp:'Loja QA B',mkt:'Mercado Livre',ponto:'Powerfull',linhas:[]}}},linksAnuncio:{'Loja QA A|Mercado Livre|X1':'u','Loja QA B|Mercado Livre|X2':'u'},skuCad:{}}))raw.prepare('INSERT INTO datasets VALUES(?,?,?)').run(name,JSON.stringify(value),'2026-11-06T15:00:00Z');

 return { profiles, password };
 } finally { raw.close(); }
}

module.exports = { criarBaseLocal };
