'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {game,plain}=require(path.resolve('verification/layout-harness'));
const html=fs.readFileSync(process.env.INDUSTRY_RUNTIME_PATH||'index.html','utf8');
let groups=0;function test(name,run){run();groups++;console.log('PASS '+name);}
function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0);}
function reload(g){g.eval('estado.jogoPausado=true;salvarProgresso()');const h=game(new Map(g.storage),html);h.step(0);h.resetDrawCalls();return h;}
function recovered(){
 const g=game(new Map(),html);g.mature();g.step(0);g.resetDrawCalls();
 g.eval("estado.tesouroColonia=0;observarContasCidada('Synthetic shortage fixture');atualizarOrcamentoMunicipalColonia(60)");
 assert.ok(g.eval('auditoriaCidada().atrasados')>0);assert.ok(g.estado.ciclosSoldosAtrasados>0);
 g.eval("estado.tesouroColonia=20000;observarContasCidada('Synthetic recovery fixture');atualizarOrcamentoMunicipalColonia(60)");
 assert.equal(g.estado.ciclosSoldosAtrasados,0);assert.equal(g.estado.economiaCidada.ultimo.folhaPaga,g.estado.economiaCidada.ultimo.folhaDevida);assert.ok(g.eval('auditoriaCidada().atrasados')>0);zero(g);return g;
}
test('paid current payroll cannot hide old claims from new industry capital and materials',()=>{
 let g=recovered();const claims=g.eval('auditoriaCidada().atrasados');
 const before=plain(g.eval('({town:estado.tesouroColonia,wood:estado.estoqueMadeira,stone:estado.estoquePedra})'));
 g.eval('autorizarIndustria()');
 for(let i=0;i<3;i++){
  assert.equal(g.estado.industriaColonia.negocios.zeladoria.estado,'planejado');assert.equal(g.estado.industriaColonia.totais.capital,0);
  assert.deepEqual(plain(g.eval('({town:estado.tesouroColonia,wood:estado.estoqueMadeira,stone:estado.estoquePedra})')),before);
  assert.equal(g.eval('auditoriaCidada().atrasados'),claims);assert.equal(g.eval('financiarObraIndustria()'),false);
  assert.match(g.eval('situacaoNegocioIndustria(planoIndustria("zeladoria"),estado.industriaColonia.negocios.zeladoria,[])'),/salários essenciais em atraso/);zero(g);g=reload(g);
 }
});
test('the existing arrears repayment action clears eligible claims and permits funded construction',()=>{
 const g=recovered();g.eval('autorizarIndustria()');const claims=g.eval('auditoriaCidada().atrasados'),town=g.estado.tesouroColonia;
 assert.equal(g.eval('quitarAtrasadosCidada()'),true);assert.equal(g.eval('auditoriaCidada().atrasados'),0);
 assert.equal(g.estado.tesouroColonia,town-claims/1000000);assert.equal(g.eval('quitarAtrasadosCidada()'),false);
 assert.equal(g.eval('financiarObraIndustria()'),true);assert.equal(g.estado.industriaColonia.totais.capital,240000000);zero(g);
});
test('recognized unclaimed wage credits remain saved and cannot be ignored for new construction',()=>{
 let g=game(new Map(),html);g.mature();g.step(0);g.resetDrawCalls();g.estado.economiaCidada.creditosCustodia=1000000;
 // This synthetic valid liability models the custody outcome already covered by economy-test.js.
 const town=g.estado.tesouroColonia;g.eval('autorizarIndustria()');
 for(let i=0;i<3;i++){
  assert.equal(g.estado.industriaColonia.negocios.zeladoria.estado,'planejado');assert.equal(g.estado.tesouroColonia,town);
  assert.equal(g.estado.economiaCidada.creditosCustodia,1000000);assert.equal(g.eval('financiarObraIndustria()'),false);zero(g);g=reload(g);
 }
});
test('already reserved construction wages still settle once when essential arrears later exist',()=>{
 const g=game(new Map(),html);g.mature();g.step(0);g.resetDrawCalls();g.eval('autorizarIndustria();alocarTrabalhoIndustria()');
 const a=Object.values(g.estado.industriaColonia.agentes).find(a=>a.funcao==='obra');assert.ok(a);
 const p=g.estado.economiaCidada.pessoas[a.id],before=p.saldo;assert.equal(a.reserva,800000);
 p.atrasados+=1000000;g.estado.ciclosSoldosAtrasados=1;
 g.eval(`{const a=estado.industriaColonia.agentes['${a.id}'];Object.assign(a,a.caminho.at(-1));a.trecho=a.caminho.length;atualizarAgenteIndustria(a,.1);atualizarAgenteIndustria(a,48);}`);
 assert.equal(p.saldo,before+800000);assert.equal(p.atrasados,1000000);assert.equal(g.estado.industriaColonia.negocios.zeladoria.obra,1);zero(g);
 const h=reload(g);assert.equal(h.estado.economiaCidada.pessoas[a.id].saldo,before+800000);assert.equal(h.estado.industriaColonia.negocios.zeladoria.obra,1);zero(h);
});
console.log('INDUSTRY_ARREARS_OK '+groups+' groups');
