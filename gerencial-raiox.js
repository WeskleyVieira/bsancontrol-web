// Leitura macro de SKU exige os recursos de Gestão e Vendas, sem conceder ações fora da carteira.
const margens=require('./margens-consultas');
function consulta(q,user){if(!String(q.sku||'').trim())throw Object.assign(Error('Informe o SKU exato do produto.'),{status:400});return margens.consulta(q,user);}
async function carregar(db,q,user){consulta(q,user);return {...await margens.carregar(db,q,user),sku:q.sku};}
module.exports={consulta,carregar};
