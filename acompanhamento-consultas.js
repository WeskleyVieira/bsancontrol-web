'use strict';
const E=require('./acompanhamento-economia');
// Complemento somente de leitura. O vínculo é obtido do banco com o mesmo escopo da fila.
async function economia(db,user,q={}){const where=[],args=[];if(user?.perfil==='gestor'){if(!user.gestor_ref)where.push('1=0');else{where.push('gestor=?');args.push(user.gestor_ref);}}if(q.mes){where.push('competencia=?');args.push(String(q.mes));}if(q.id){where.push('id=?');args.push(String(q.id));}const items=await db.all('SELECT id,empresa,canal AS mkt,ponto,anuncio_id AS anuncio,competencia FROM demandas'+(where.length?' WHERE '+where.join(' AND '):''),args);return(await E.enriquecer(db,items)).map(i=>({id:i.id,financeiro:i.financeiro}));}
module.exports={economia};
