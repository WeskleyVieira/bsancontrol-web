'use strict';
// Explicit release configuration; credentials remain exclusively in the host environment.
function configure(env=process.env,config=require('./deployment.json')){
 if(env.PRODUTOS_ENABLED===undefined)env.PRODUTOS_ENABLED=config.enabled?'1':'0';
 if(env.PRODUTOS_ENABLED==='1'&&!env.PRODUTOS_DB_FILE&&!env.PRODUTOS_DATABASE_URL&&config.database==='host-private-schema'&&env.DATABASE_URL)env.PRODUTOS_DATABASE_URL=env.DATABASE_URL;
 return {enabled:env.PRODUTOS_ENABLED==='1'};
}
module.exports={configure};
