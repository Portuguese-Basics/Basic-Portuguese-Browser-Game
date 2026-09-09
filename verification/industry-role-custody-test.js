'use strict';
// Synthetic role/phase and escrow admission tests. No player data or timing claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {game,plain}=require(path.join(process.cwd(),'verification/layout-harness'));
const html=process.env.INDUSTRY_RUNTIME_PATH?fs.readFileSync(process.env.INDUSTRY_RUNTIME_PATH,'utf8'):null;
let groups=0,cases=0;
function test(name,fn){fn();groups++;console.log('PASS '+name);}
function ready(){const g=game(new Map(),html);g.mature();g.eval(`autorizarIndustria();for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=0;}estado.industriaColonia.expansao=false;`);return g;}
function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0,'money must be conserved');}
function normalize(g,raw){g.context.__roleRaw=plain(raw);g.eval('estado.industriaColonia=normalizarIndustriaColonia(__roleRaw)');}
const roles=['trabalho','obra','manutencao','frete','visita','passeio'],phases=['indo','atividade','voltando','livre','entregando'];
const wages={trabalho:800000,obra:800000,manutencao:600000,frete:3240000,visita:0,passeio:0};
const cargo={origem:'municipio',destino:'artes',item:'graos',quantidade:24,base:2400000,exportacao:false,pagador:'artes'};
function fixture(g,role,phase,reserva){const s=plain(g.estado.industriaColonia),id=g.eval('candidatosIndustria()[0].id'),empresa=role==='passeio'?'':role==='manutencao'?'zeladoria':'artes';
 const a={id,empresa,funcao:role,x:6500,y:3816,caminho:[{x:6500,y:3816},{x:6501,y:3816}],trecho:1,fase:phase,trabalho:0,emCasa:false,consumado:false,reserva,carga:role==='frete'?cargo:null,criado:s.tempo,turnos:0,atividade:''};
 s.negocios[empresa||'artes'].caixa-=reserva;s.agentes[id]=a;return {s,id};}
function matrix(fn){const g=ready(),bs=plain(g.estado.industriaColonia),be=plain(g.estado.economiaCidada);const reset=()=>{g.estado.industriaColonia=plain(bs);g.estado.economiaCidada=plain(be);};fn(g,reset);}
test('role phase reserve matrix admits reachable contracts and recovers rejected money exactly once',()=>matrix((g,reset)=>{
 for(const role of roles)for(const phase of phases)for(const reserve of [...new Set([0,600000,800000,wages[role],wages[role]+100000])]){
  reset();const {s,id}=fixture(g,role,phase,reserve);normalize(g,s);zero(g);
  const phaseOK=role==='frete'?['indo','entregando'].includes(phase):role==='passeio'?['indo','livre','atividade','voltando'].includes(phase):['indo','atividade'].includes(phase);
  assert.equal(Boolean(g.estado.industriaColonia.agentes[id]),phaseOK&&reserve===wages[role],`${role}/${phase}/${reserve}`);
  const before=plain(g.estado.industriaColonia);normalize(g,before);zero(g);assert.deepEqual(plain(g.estado.industriaColonia),before,'idempotent reload');assert.equal(g.estado.industriaColonia.totais.salarios,0);assert.equal(g.estado.industriaColonia.totais.visitas,0);cases++;
 }
}));
test('recognized cargo on every non freight role is returned once without permitting activity',()=>matrix((g,reset)=>{
 for(const role of roles.filter(x=>x!=='frete')){reset();const {s,id}=fixture(g,role,'indo',800000);s.agentes[id].carga=plain(cargo);normalize(g,s);zero(g);assert.equal(g.estado.industriaColonia.agentes[id],undefined);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);normalize(g,g.estado.industriaColonia);zero(g);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);assert.equal(g.estado.industriaColonia.totais.salarios,0);cases++;}
}));
test('unrecognized cargo cancels with an unresolved cargo warning and preserves recognized money',()=>{
 const g=ready(),{s,id}=fixture(g,'trabalho','atividade',800000);s.agentes[id].carga={item:'unknown-item',quantidade:24};normalize(g,s);zero(g);assert.equal(g.estado.industriaColonia.agentes[id],undefined);assert.ok(g.estado.industriaColonia.avisos.some(x=>x.includes('Carga inválida requer revisão')));assert.equal(g.estado.industriaColonia.totais.salarios,0);
});
test('contradictory companies or paid flags recover custody while valid consumed free states survive',()=>matrix((g,reset)=>{
 for(const mutation of ['free-company','visit-no-company','paid-consumed','paid-home']){reset();const role=mutation==='free-company'?'passeio':mutation==='visit-no-company'?'visita':'trabalho';const {s,id}=fixture(g,role,'atividade',wages[role]);if(mutation==='free-company')s.agentes[id].empresa='artes';if(mutation==='visit-no-company')s.agentes[id].empresa='';if(mutation==='paid-consumed')s.agentes[id].consumado=true;if(mutation==='paid-home')s.agentes[id].emCasa=true;normalize(g,s);zero(g);assert.equal(g.estado.industriaColonia.agentes[id],undefined);cases++;}
 for(const role of ['visita','passeio']){reset();const {s,id}=fixture(g,role,'atividade',0);s.agentes[id].consumado=true;s.agentes[id].emCasa=role==='passeio';normalize(g,s);zero(g);assert.ok(g.estado.industriaColonia.agentes[id]);assert.equal(g.estado.industriaColonia.agentes[id].consumado,true);}
}));
for(const next of ['trabalho','frete','visita'])test('replacing a free actor with '+next+' refunds existing escrow',()=>{
 const g=ready(),{s,id}=fixture(g,'trabalho','indo',800000);s.agentes[id].funcao='passeio';g.estado.industriaColonia=s;zero(g);
 if(next==='trabalho'){g.estado.industriaColonia.negocios.artes.meta=1;assert.equal(g.eval('alocarTrabalhoIndustria()'),true);}
 if(next==='frete'){g.estado.estoqueGraos=150;assert.equal(g.eval('agendarFreteIndustria("municipio","artes","graos",24,.1)'),true);}
 if(next==='visita'){g.eval(`{const s=estado.industriaColonia,e=estado.economiaCidada;for(const p of Object.values(e.pessoas))p.ultimaCompra=e.ciclo;const target=e.pessoas['${id}'];target.ultimaCompra=-5;observarContasCidada();estado.tesouroColonia-=10;target.saldo+=10000000;marcarContasCidada();const worker=e.adultos.map(k=>e.pessoas[k]).find(p=>p.emprego==='geral'&&p.id!==target.id);s.negocios.artes.caixa-=800000;const a=novoAgenteIndustria(worker,'trabalho','artes',entradaIndustria('artes'),800000);Object.assign(a,entradaIndustria('artes'),{fase:'atividade'});s.agentes[worker.id]=a;s.negocios.artes.estoque.artigos=10;}`);assert.equal(g.eval('agendarVisitaIndustria()'),true);}
 assert.equal(g.estado.industriaColonia.agentes[id].funcao,next);zero(g);
});
test('replacement returns stale municipal freight escrow to its actual payer and returns cargo',()=>{
 const g=ready();g.estado.estoquePedra=0;g.estado.industriaColonia.negocios.pedreira.estoque.pedra=48;assert.equal(g.eval('agendarFreteIndustria("pedreira","municipio","pedra",24,.45)'),true);const a=g.eval('Object.values(estado.industriaColonia.agentes)[0]'),reserved=a.reserva,before=g.estado.economiaCidada.compensacaoCidade;a.funcao='passeio';g.estado.industriaColonia.negocios.artes.meta=1;assert.equal(g.eval('alocarTrabalhoIndustria()'),true);zero(g);assert.equal(g.estado.economiaCidada.compensacaoCidade-before,reserved);assert.equal(g.estado.industriaColonia.negocios.pedreira.estoque.pedra,48);
});
console.log(`INDUSTRY_ROLE_CUSTODY_OK ${groups} groups ${cases} matrix cases`);
