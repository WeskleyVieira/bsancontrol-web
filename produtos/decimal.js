"use strict";
const D=require('./domain');
const UNITS={UN:['contagem',1],KG:['massa',1000],G:['massa',1],M:['comprimento',1000],CM:['comprimento',10],MM:['comprimento',1],L:['volume',1000],ML:['volume',1],M2:['area',10000],CM2:['area',1]};
function fixed(v,{zero=false}={}){const s=String(v??'').trim().replace(',','.');if(!/^\d{1,10}(?:\.\d{1,6})?$/.test(s))D.fail('Use um número positivo com até seis casas decimais.');const [a,b='']=s.split('.'),n=BigInt(a)*1000000n+BigInt(b.padEnd(6,'0'));if(n>1000000000000000n||(!zero&&!n))D.fail('Quantidade ou valor fora do intervalo permitido.');return n;}
function display(n){const x=BigInt(n);return String(x/1000000n)+(x%1000000n?'.'+String(x%1000000n).padStart(6,'0').replace(/0+$/,''):'');}
function unit(v){const u=D.text(v,10).toUpperCase();if(!UNITS[u])D.fail('Unidade não suportada.');return u;}
const gcd=(a,b)=>{while(b){const r=a%b;a=b;b=r;}return a;};
function fraction(n,d=1n){const f=gcd(n,d);return {n:n/f,d:d/f};}
const add=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d);
const round=(n,d)=> (2n*n+d)/(2n*d);
function line(cost,basis,basisUnit,quantity,quantityUnit){const a=UNITS[unit(basisUnit)],b=UNITS[unit(quantityUnit)];if(a[0]!==b[0])D.fail('As unidades de compra e consumo não são compatíveis.');const f=fraction(BigInt(cost)*fixed(quantity)*BigInt(b[1]),fixed(basis)*BigInt(a[1]));if(f.n>f.d*1000000000000000n)D.fail('Custo da linha fora do intervalo permitido.');return f;}
function cents(f){const n=round(f.n,f.d*10000n);if(n>100000000000n)D.fail('Custo calculado fora do intervalo permitido.');return Number(n);}
module.exports={UNITS,fixed,display,unit,fraction,add,round,line,cents};
