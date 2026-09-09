'use strict';
// Full active simulation: staged paid construction, supply, visitors, and reloads.
const fs=require('node:fs'),assert=require('node:assert/strict');const {game,plain}=require('./layout-harness');
let g=game();g.mature();g.estado.velocidadeTempo=10;g.eval('autorizarIndustria()');g.step(0);g.resetDrawCalls();let tick=0,reloads=0,rows=[];
const cycles=Number(process.env.INDUSTRY_SOAK_CYCLES||180);
for(let i=1;i<=cycles*120;i++){
 g.step(tick+=50);g.resetDrawCalls();
 if(i%120===0){const r=g.eval(`(()=>{const s=estado.industriaColonia,e=estado.economiaCidada;return{cycle:Math.floor(s.tempo/60),town:estado.tesouroColonia,wood:estado.estoqueMadeira,stone:estado.estoquePedra,health:estado.saudeColonia,hunger:estado.colonosComFome,arrears:estado.ciclosSoldosAtrasados,moneyDifference:auditoriaCidada().diferenca,coreRoles:e.adultos.filter(id=>e.pessoas[id].salario>0).length,localPaidEver:Object.keys(s.pagos).length,localPaidLast10Minutes:e.adultos.filter(id=>s.tempo-(s.pagos[id]?.tempo??-100000)<600).length,withoutAnyIncomeLast10Minutes:e.adultos.filter(id=>e.pessoas[id].salario===0&&s.tempo-(s.pagos[id]?.tempo??-100000)>=600).length,companies:Object.values(s.negocios).map(b=>({id:b.id,state:b.estado,cash:b.caixa,work:b.obra,stock:{...b.estoque}})),totals:{...s.totais},food:{paid:e.totais.alimentoPago,assistance:e.totais.alimentoSocial},paths:[...avisosRotasPlanta],activeTasks:Object.values(s.agentes).reduce((v,a)=>(v[a.funcao]=(v[a.funcao]||0)+1,v),{}),wallets:auditoriaCidada().carteiras}})()`);
  assert.equal(r.moneyDifference,0,'accounting at cycle '+r.cycle);assert.ok(r.town>=0);assert.equal(r.hunger,0);assert.equal(r.arrears,0);assert.equal(r.health,100);assert.deepEqual(plain(r.paths),[]);rows.push(plain(r));
  console.log('INDUSTRY_CYCLE',r.cycle,'town',r.town,'no-income-last10',r.withoutAnyIncomeLast10Minutes,'visits',r.totals.visitas,'built',r.companies.filter(b=>b.state==='ativo').length);
  if(i%2400===0){g.eval('salvarProgresso()');const h=game(new Map(g.storage));h.step(0);h.resetDrawCalls();assert.deepEqual(plain(h.estado.industriaColonia),plain(g.estado.industriaColonia),'active tasks/cargo after reload');assert.deepEqual(plain(h.estado.economiaCidada),plain(g.estado.economiaCidada),'accounts and households after reload');g=h;tick=0;reloads++;}
 }
}
g.eval('salvarProgresso()');fs.mkdirSync('verification-output',{recursive:true});fs.writeFileSync('verification-output/industry-soak-checkpoints.json',JSON.stringify({cycles,reloads,rows},null,2));fs.writeFileSync('verification-output/industry-soak-save.json',JSON.stringify(Object.fromEntries(g.storage)));
const last=rows.at(-1);if(cycles>=120){assert.equal(last.companies.filter(b=>b.state==='ativo').length,10,'all ten projects must complete through funded work');assert.ok(last.totals.festivais>0);assert.ok(last.totals.visitas>50);assert.ok(last.totals.exportacoes>0);assert.ok(last.town>rows[cycles-21].town,'last twenty cycles have positive net town cash');}
console.log('INDUSTRY_SOAK_OK '+JSON.stringify({cycles,reloads,last,saveBytes:Buffer.byteLength([...g.storage.values()][0])}));
