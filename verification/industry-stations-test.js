'use strict';
// Public-safe synthetic regression proposal. Copy to verification/ with the
// harness import adjusted after the integrator adopts the visual migration.
const fs=require('node:fs'),assert=require('node:assert/strict');
const {game,plain}=require('./layout-harness');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
let groups=0;function test(n,f){f();groups++;console.log('PASS '+n);}
function ready(){const g=game(new Map(),html);g.mature();g.eval(`autorizarIndustria();for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=0;}estado.industriaColonia.expansao=false;`);return g;}
function pair(g){g.eval(`{const people=['cid-118','cid-119'].map(id=>estado.economiaCidada.pessoas[id]),s=estado.industriaColonia,b=s.negocios.artes;for(let i=0;i<people.length;i++){const p=people[i],a=novoAgenteIndustria(p,'trabalho','artes',entradaIndustria('artes'),salarioTurnoIndustria);b.caixa-=salarioTurnoIndustria;s.agentes[p.id]=a;Object.assign(a,entradaIndustria('artes'));a.trecho=a.caminho.length;a.fase='atividade';a.trabalho=20+i;}}`);}
test('hash-colliding funded workers retain distinct stations throughout shared work dwell',()=>{
 const g=ready();pair(g);assert.equal(g.eval('hashVidaCotidiana("cid-118")%12'),g.eval('hashVidaCotidiana("cid-119")%12'));
 assert.notEqual(g.estado.industriaColonia.agentes['cid-118'].posto,g.estado.industriaColonia.agentes['cid-119'].posto);
 for(let sec=0;sec<=10;sec++){const poses=['cid-118','cid-119'].map(id=>g.eval(`amostraIndustria('${id}')`));assert.ok(Math.hypot(poses[0].x-poses[1].x,poses[0].y-poses[1].y)>=24);for(const id of ['cid-118','cid-119'])g.estado.industriaColonia.agentes[id].trabalho++;}
 assert.equal(g.eval('auditoriaCidada().diferenca'),0);
});
test('work and service reserve from the same finite station pool without affecting money',()=>{
 const g=ready();pair(g);g.eval(`{const p=candidatosIndustria()[0],a=novoAgenteIndustria(p,'visita','artes',entradaIndustria('artes'));estado.industriaColonia.agentes[p.id]=a;}`);
 const agents=Object.values(g.estado.industriaColonia.agentes);assert.equal(new Set(agents.map(a=>a.posto)).size,agents.length);assert.equal(g.eval('auditoriaCidada().diferenca'),0);
 const before=plain(g.estado);for(const a of agents)g.eval(`amostraIndustria('${a.id}')`);assert.deepEqual(plain(g.estado),before);
});
test('all 24 work and customer circuits begin/end at door, stay finite, and separate on site',()=>{
 const g=ready();for(const p of g.eval('planosIndustria')){
  const door=g.eval(`entradaIndustria('${p.id}')`);
  for(const client of [false,true]){
   const mid=[];for(let slot=0;slot<24;slot++){
    for(const time of [0,client?10:48]){const pose=g.eval(`poseTrabalhoIndustria(planoIndustria('${p.id}'),${slot},${time},'cid-1',true,${client})`);assert.ok(Math.hypot(pose.x-door.x,pose.y-door.y)<1e-6);}
    const pose=g.eval(`poseTrabalhoIndustria(planoIndustria('${p.id}'),${slot},${client?5:24},'cid-1',true,${client})`);
    assert.ok(Number.isFinite(pose.x)&&Number.isFinite(pose.y));assert.ok(pose.x>=p.x&&pose.x<=p.x+p.largura&&pose.y>=p.y&&pose.y<=p.y+p.altura);mid.push(pose);
   }
   for(let a=0;a<24;a++)for(let b=a+1;b<24;b++)assert.ok(Math.hypot(mid[a].x-mid[b].x,mid[a].y-mid[b].y)>=24,`${p.id}: ${a}/${b}`);
  }
 }
});
test('station survives save/reload and old-save migration is deterministic and money-neutral',()=>{
 const g=ready();pair(g);const before=plain(g.estado.industriaColonia);g.eval('salvarProgresso()');const h=game(new Map(g.storage),html);
 assert.deepEqual(plain(h.estado.industriaColonia),before);assert.equal(h.eval('auditoriaCidada().diferenca'),0);
 const old=plain(before);for(const a of Object.values(old.agentes))delete a.posto;
 g.context.__old=old;const money=g.eval('patrimonioContabilCidada()');g.eval('estado.industriaColonia=normalizarIndustriaColonia(__old)');
 assert.equal(g.eval('patrimonioContabilCidada()'),money);assert.equal(g.eval('auditoriaCidada().diferenca'),0);
 const first=plain(g.estado.industriaColonia);g.context.__old=old;g.eval('estado.industriaColonia=normalizarIndustriaColonia(__old)');assert.deepEqual(plain(g.estado.industriaColonia),first);
 for(const [id,a]of Object.entries(old.agentes)){const actual={...plain(g.estado.industriaColonia.agentes[id])};delete actual.posto;assert.deepEqual(actual,a);}
});
test('departing worker frees its station while coworkers keep theirs',()=>{
 const g=ready();pair(g);const keep=g.estado.industriaColonia.agentes['cid-119'].posto,released=g.estado.industriaColonia.agentes['cid-118'].posto;
 g.eval('terminarAtividadeIndustria(estado.industriaColonia.agentes["cid-118"])');assert.equal(g.estado.industriaColonia.agentes['cid-118'].posto,undefined);assert.equal(g.estado.industriaColonia.agentes['cid-119'].posto,keep);
 assert.equal(g.eval('postoLivreIndustria("artes","new-id")'),released);assert.equal(g.eval('auditoriaCidada().diferenca'),0);
});
console.log('INDUSTRY_STATIONS_OK '+groups+' groups');
