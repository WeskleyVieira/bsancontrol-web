'use strict';
// One local watcher. It only imports completed captures and downloads approved publications.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
const dir=path.join(os.homedir(),'.bsancontrol','produtos');fs.mkdirSync(dir,{recursive:true});
const lock=path.join(dir,'watch.pid');if(fs.existsSync(lock)){const pid=Number(fs.readFileSync(lock,'utf8'));try{process.kill(pid,0);process.exit(0);}catch{fs.unlinkSync(lock);}}
fs.writeFileSync(lock,String(process.pid),{flag:'wx'});let child=null,stopping=false;
function state(value){fs.writeFileSync(path.join(dir,'worker-status.json'),JSON.stringify({pid:process.pid,momento:new Date().toISOString(),...value}));}
function run(){if(child||stopping)return;state({estado:'sincronizando'});const log=fs.openSync(path.join(dir,'worker.log'),'a');child=spawn(process.execPath,[path.join(__dirname,'operations.js'),'sync'],{windowsHide:true,stdio:['ignore',log,log]});child.once('error',()=>state({estado:'falha_inicio'}));child.once('close',code=>{fs.closeSync(log);child=null;state({estado:code===0?'aguardando':'conferir_fontes',exitCode:code});});}
const timer=setInterval(run,300000);run();
function stop(){if(stopping)return;stopping=true;clearInterval(timer);child?.kill();if(fs.existsSync(lock)&&fs.readFileSync(lock,'utf8')===String(process.pid))fs.unlinkSync(lock);}
process.on('exit',stop);process.on('SIGINT',()=>{stop();process.exit(0);});process.on('SIGTERM',()=>{stop();process.exit(0);});
