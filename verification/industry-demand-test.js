'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {game}=require(path.join(process.cwd(),'verification/layout-harness'));
const html=process.env.INDUSTRY_RUNTIME_PATH?fs.readFileSync(process.env.INDUSTRY_RUNTIME_PATH,'utf8'):null;
function ready(){const g=game(new Map(),html);g.mature();g.eval('autorizarIndustria()');g.eval(`for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=0;}estado.industriaColonia.expansao=false;`);return g;}
let groups=0;function test(name,fn){fn();groups++;console.log('PASS '+name);}function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0);}
test('optional pause immediately blocks new funded service contracts despite stale targets',()=>{
 for(const id of ['teatro','festival','taverna','taverna-sul']){
  const g=ready();g.estado.industriaColonia.negocios[id].meta=1;g.estado.economiaCidada.opcionais=false;
  const before=g.estado.industriaColonia.negocios[id].caixa;
  assert.equal(g.eval('alocarTrabalhoIndustria()'),false);assert.equal(g.estado.industriaColonia.negocios[id].caixa,before);assert.equal(Object.keys(g.estado.industriaColonia.agentes).length,0);zero(g);
 }
});
test('paused optional demand still honors issued service wage without renewing',()=>{
 const g=ready();g.estado.industriaColonia.negocios.teatro.meta=1;assert.equal(g.eval('alocarTrabalhoIndustria()'),true);
 const a=Object.values(g.estado.industriaColonia.agentes)[0],cash=g.estado.industriaColonia.negocios.teatro.caixa;
 g.eval(`{const a=estado.industriaColonia.agentes['${a.id}'];a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;a.trecho=a.caminho.length;atualizarAgenteIndustria(a,.1);}`);
 g.estado.economiaCidada.opcionais=false;g.eval(`atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],47)`);assert.equal(g.estado.economiaCidada.pessoas[a.id].saldo,0);
 g.eval(`atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],1)`);
 assert.equal(g.estado.economiaCidada.pessoas[a.id].saldo,800000);assert.equal(g.estado.industriaColonia.negocios.teatro.caixa,cash);assert.equal(g.estado.industriaColonia.agentes[a.id].funcao,'passeio');zero(g);
});
test('turning optional demand back on permits honest starter service staff',()=>{
 const g=ready();g.estado.economiaCidada.opcionais=false;g.eval('operarIndustria()');assert.equal(g.estado.industriaColonia.negocios.teatro.meta,0);
 g.estado.economiaCidada.opcionais=true;g.eval('operarIndustria();for(const b of Object.values(estado.industriaColonia.negocios))if(b.id!=="teatro")b.meta=0');
 assert.equal(g.estado.industriaColonia.negocios.teatro.meta,1);assert.equal(g.eval('alocarTrabalhoIndustria()'),true);const a=Object.values(g.estado.industriaColonia.agentes)[0];assert.equal(a.empresa,'teatro');assert.equal(a.reserva,800000);zero(g);
});
test('pause does not block real manufacturing/export demand or paid construction',()=>{
 for(const mode of ['trabalho','obra']){const g=ready();g.estado.economiaCidada.opcionais=false;const b=g.estado.industriaColonia.negocios.artes;b.meta=1;if(mode==='obra'){b.estado='obra';b.obra=0;}
  assert.equal(g.eval('alocarTrabalhoIndustria()'),true);assert.equal(Object.values(g.estado.industriaColonia.agentes)[0].funcao,mode);zero(g);
 }
});
console.log('INDUSTRY_DEMAND_OK '+groups+' groups');
