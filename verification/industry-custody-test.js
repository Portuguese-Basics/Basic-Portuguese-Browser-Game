'use strict';
// Synthetic conservation and illegal-state regressions; no real player saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {game,plain}=require(path.join(process.cwd(),'verification/layout-harness'));
const html=process.env.INDUSTRY_RUNTIME_PATH?fs.readFileSync(process.env.INDUSTRY_RUNTIME_PATH,'utf8'):null;
let groups=0;
function test(name,fn){fn();groups++;console.log('PASS '+name);}
function ready(){const g=game(new Map(),html);g.mature();g.eval('autorizarIndustria()');g.estado.estoqueGraos=150;g.eval(`for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=p.vagas;}estado.industriaColonia.expansao=false;`);return g;}
function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0,'money must be conserved');}
function actor(g){return g.eval('Object.values(estado.industriaColonia.agentes).find(a=>a.funcao==="frete")');}
function mutateSaved(g,fn){g.eval('salvarProgresso()');const storage=new Map(g.storage);for(const [key,value]of storage){let raw;try{raw=JSON.parse(value);}catch{continue;}if(raw?.expansao?.economia?.industriaColonia){fn(raw.expansao.economia.industriaColonia);storage.set(key,JSON.stringify(raw));return game(storage,html);}}throw new Error('industry save not found');}
function reload(g){return mutateSaved(g,()=>{});}
function arrive(g,a){g.eval(`{const a=estado.industriaColonia.agentes['${a.id}'];a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;a.trecho=a.caminho.length;atualizarAgenteIndustria(a,.1);if(a.funcao==='frete'){a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;a.trecho=a.caminho.length;}}`);}
test('cancelling after seller production retains overflow in saved return custody',()=>{
 let g=ready();g.estado.industriaColonia.negocios.floresta.estoque.madeira=96;
 assert.equal(g.eval('agendarFreteIndustria("floresta","artes","madeira",24,.65)'),true);const a=actor(g);
 g.eval('estado.industriaColonia.negocios.floresta.creditos=12;operarIndustria()');
 assert.equal(g.estado.industriaColonia.negocios.floresta.estoque.madeira,96);
 g.eval(`cancelarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'])`);zero(g);
 assert.equal(g.estado.industriaColonia.negocios.floresta.estoque.madeira,96);
 assert.equal(g.estado.industriaColonia.devolucoesNegocios.floresta.madeira,24);
 g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.devolucoesNegocios.floresta.madeira,24);
 g.estado.industriaColonia.negocios.floresta.estoque.madeira-=10;g.eval('operarIndustria()');
 assert.equal(g.estado.industriaColonia.negocios.floresta.estoque.madeira,96);assert.equal(g.estado.industriaColonia.devolucoesNegocios.floresta.madeira,14);
});
test('full destinations reject booking and delivery waits without charging or losing cargo',()=>{
 const g=ready(),b=g.estado.industriaColonia.negocios.cervejaria;b.estoque.graos=240;
 assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),false);
 b.estoque.graos=216;assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),true);const a=actor(g);arrive(g,a);b.estoque.graos=240;
 const before=plain(g.estado.industriaColonia);assert.equal(g.eval(`executarEntregaIndustria(estado.industriaColonia.agentes['${a.id}'])`),false);
 assert.deepEqual(plain(g.estado.industriaColonia),before);zero(g);
 b.estoque.graos=216;assert.equal(g.eval(`executarEntregaIndustria(estado.industriaColonia.agentes['${a.id}'])`),true);assert.equal(b.estoque.graos,240);zero(g);
 assert.equal(g.eval(`executarEntregaIndustria(estado.industriaColonia.agentes['${a.id}'])`),false);assert.equal(g.estado.industriaColonia.totais.entregas,1);zero(g);
});
for(const kind of ['unknown-function','freight-in-activity'])test('malformed '+kind+' recovers recognized escrow and cargo without wages',()=>{
 let g=ready();assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),true);const a=actor(g);
 g=mutateSaved(g,s=>{if(kind==='unknown-function')s.agentes[a.id].funcao='broken';else{s.agentes[a.id].fase='atividade';s.agentes[a.id].trabalho=48;}});
 zero(g);assert.equal(g.estado.industriaColonia.agentes[a.id],undefined);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);
 assert.equal(g.estado.industriaColonia.devolucoes.graos,24);assert.equal(g.estado.industriaColonia.totais.salarios,0);
 for(let i=0;i<3;i++){g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);assert.equal(g.estado.industriaColonia.totais.salarios,0);}
});
test('closed supplier or destination cannot settle a loaded delivery',()=>{
 const g=ready();g.estado.industriaColonia.negocios.cervejaria.estoque.cerveja=24;
 assert.equal(g.eval('agendarFreteIndustria("cervejaria","taverna","cerveja",16,.65)'),true);const a=actor(g);arrive(g,a);
 for(const id of ['cervejaria','taverna']){g.estado.industriaColonia.negocios[id].estado='planejado';const before=plain(g.estado.industriaColonia);assert.equal(g.eval(`executarEntregaIndustria(estado.industriaColonia.agentes['${a.id}'])`),false);assert.deepEqual(plain(g.estado.industriaColonia),before);g.estado.industriaColonia.negocios[id].estado='ativo';}
 assert.equal(g.eval(`executarEntregaIndustria(estado.industriaColonia.agentes['${a.id}'])`),true);zero(g);
});
test('malformed cargo cannot confiscate recognized escrow or authorize wages',()=>{
 let g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)');const a=actor(g);
 g=mutateSaved(g,s=>{s.agentes[a.id].carga.item='unknown-item';});zero(g);
 assert.equal(g.estado.industriaColonia.agentes[a.id],undefined);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);assert.equal(g.estado.industriaColonia.totais.salarios,0);
 g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);
});
test('repeated cancellation cannot expand return custody by bypassing pending returns',()=>{
 let g=ready();g.estado.industriaColonia.negocios.floresta.estoque.madeira=96;
 g.eval('agendarFreteIndustria("floresta","artes","madeira",24,.65)');const a=actor(g);
 g.eval(`estado.industriaColonia.negocios.floresta.creditos=12;operarIndustria();cancelarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'])`);
 for(let i=0;i<8;i++){
   assert.equal(g.eval('agendarFreteIndustria("floresta","artes","madeira",24,.65)'),false);
   g.eval('estado.industriaColonia.negocios.floresta.creditos=12;operarIndustria()');
   assert.equal(g.estado.industriaColonia.negocios.floresta.estoque.madeira,96);assert.equal(g.estado.industriaColonia.devolucoesNegocios.floresta.madeira,24);
   g=reload(g);zero(g);
 }
});
test('death mid-freight recovers cargo and escrow exactly once across reload',()=>{
 let g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)');const a=actor(g);
 g.eval(`{const n=estado.economiaCidada.adultos.indexOf('${a.id}');falecerPessoaCidada(n,'synthetic audit');estado.populacaoColonia--;estado.idadesAdultosColonia.splice(n,1);atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],.1);}`);
 zero(g);assert.equal(g.estado.industriaColonia.agentes[a.id],undefined);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);
 for(let i=0;i<3;i++){g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);}
});
test('removed or newly reassigned provider cannot complete a customer service',()=>{
 for(const mutation of ['missing','reassigned']){
  const g=ready();g.eval(`{const s=estado.industriaColonia,e=estado.economiaCidada,people=e.adultos.map(id=>e.pessoas[id]).filter(p=>p.emprego==='geral');const p=people[0],w=people[1];estado.tesouroColonia-=10;p.saldo+=10000000;marcarContasCidada();s.negocios.taverna.estoque.cerveja=10;s.negocios.taverna.caixa-=800000;s.agentes[p.id]=novoAgenteIndustria(p,'visita','taverna',entradaIndustria('taverna'));s.agentes[w.id]=novoAgenteIndustria(w,'trabalho','taverna',entradaIndustria('taverna'),800000);Object.assign(s.agentes[p.id],entradaIndustria('taverna'),{fase:'atividade',trabalho:10});Object.assign(s.agentes[w.id],entradaIndustria('taverna'),{fase:'atividade',trabalho:20});globalThis.customer=p.id;globalThis.server=w.id;}`);
  if(mutation==='missing')g.eval('delete estado.economiaCidada.pessoas[server]');else g.eval('estado.economiaCidada.pessoas[server].emprego="lavoura"');
  const before=plain(g.estado.industriaColonia);
  assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),false);assert.deepEqual(plain(g.estado.industriaColonia),before);zero(g);
 }
});
test('underfunded saved freight recovers recognized remaining escrow instead of stalling',()=>{
 let g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)');const a=actor(g);
 // Simulate partial reservation loss while retaining the displaced money in its payer.
 g.estado.industriaColonia.agentes[a.id].reserva-=100000;g.estado.industriaColonia.negocios.cervejaria.caixa+=100000;zero(g);
 g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.agentes[a.id],undefined);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);assert.equal(g.estado.industriaColonia.totais.salarios,0);
 g=reload(g);zero(g);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,320000000);
});
console.log('INDUSTRY_CUSTODY_OK '+groups+' groups');
