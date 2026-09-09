'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {game,plain}=require(path.join(process.cwd(),'verification/layout-harness'));
const html=process.env.INDUSTRY_RUNTIME_PATH?fs.readFileSync(process.env.INDUSTRY_RUNTIME_PATH,'utf8'):null;
function ready(){const g=game(new Map(),html);g.mature();g.eval('autorizarIndustria()');g.eval(`for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=0;}estado.industriaColonia.expansao=false;`);return g;}
function saleFixture(){const g=ready();g.eval(`{const s=estado.industriaColonia,e=estado.economiaCidada,people=e.adultos.map(id=>e.pessoas[id]).filter(p=>p.emprego==='geral'),p=people[0];globalThis.customer=p.id;for(const [n,id]of ['taverna','teatro'].entries()){const w=people[n+1],b=s.negocios[id];b.estoque[planoIndustria(id).item]=10;b.caixa-=800000;s.agentes[w.id]=novoAgenteIndustria(w,'trabalho',id,entradaIndustria(id),800000);Object.assign(s.agentes[w.id],entradaIndustria(id),{fase:'atividade',trabalho:20});}const casa=p.casa?posicaoCasaColonia(p.casa-1):areaAdministracao,opcoes=[planoIndustria('taverna'),planoIndustria('teatro')].sort((a,b)=>Math.hypot(a.x-casa.x,a.y-casa.y)-Math.hypot(b.x-casa.x,b.y-casa.y));p.lazer=opcoes.findIndex(b=>b.id==='taverna');const money=reservaAlimentarIndustria(p)+1000000;estado.tesouroColonia-=money/1000000;p.saldo+=money;marcarContasCidada();}`);return g;}
let groups=0;function test(name,fn){fn();groups++;console.log('PASS '+name);}function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0);}
test('resident can select an affordable available service despite unaffordable prior choice',()=>{
 const g=saleFixture(),p=g.estado.economiaCidada.pessoas[g.eval('customer')],cash=p.saldo,stock=g.estado.industriaColonia.negocios.teatro.estoque.ingressos;
 assert.equal(g.eval('agendarVisitaIndustria()'),true);assert.equal(g.estado.industriaColonia.agentes[p.id].empresa,'teatro');assert.equal(p.saldo,cash);assert.equal(g.estado.industriaColonia.negocios.teatro.estoque.ingressos,stock);assert.equal(g.estado.industriaColonia.totais.visitas,0);zero(g);
 g.estado.economiaCidada.opcionais=false;g.eval(`{const a=estado.industriaColonia.agentes['${p.id}'];Object.assign(a,entradaIndustria('teatro'),{fase:'atividade',trabalho:10});atualizarAgenteIndustria(a,.5);}`);assert.equal(p.saldo,cash);assert.equal(g.estado.industriaColonia.totais.visitas,0);zero(g);
});
test('choice filtering still preserves dependent-food reserve and real stock',()=>{
 for(const reason of ['reserve','stock']){const g=saleFixture(),p=g.estado.economiaCidada.pessoas[g.eval('customer')];
  if(reason==='reserve'){const keep=g.eval('reservaAlimentarIndustria(estado.economiaCidada.pessoas[customer])')+659999;g.estado.tesouroColonia+=(p.saldo-keep)/1000000;p.saldo=keep;g.eval('marcarContasCidada()');}else g.estado.industriaColonia.negocios.teatro.estoque.ingressos=0;
  const before=plain(g.estado.industriaColonia);assert.equal(g.eval('agendarVisitaIndustria()'),false);assert.deepEqual(plain(g.estado.industriaColonia),before);zero(g);
 }
});
test('full affordable queue does not force an unavailable or unaffordable sale',()=>{
 const g=saleFixture();g.eval(`{const s=estado.industriaColonia,e=estado.economiaCidada,waiting=e.adultos.map(id=>e.pessoas[id]).filter(p=>p.emprego==='geral'&&!s.agentes[p.id]&&p.id!==customer).slice(0,10);for(const p of waiting)s.agentes[p.id]=novoAgenteIndustria(p,'visita','teatro',entradaIndustria('teatro'));}`);
 assert.equal(g.eval('agendarVisitaIndustria()'),false);assert.equal(g.estado.industriaColonia.agentes[g.eval('customer')],undefined);zero(g);
});
test('festival closure rejects stale target booking and honors only issued work',()=>{
 const g=ready(),s=g.estado.industriaColonia,b=s.negocios.festival;b.meta=2;s.tempo=100;s.festivalAte=100;s.festivalPreparando=false;
 assert.equal(g.eval('alocarTrabalhoIndustria()'),false);s.festivalPreparando=true;assert.equal(g.eval('alocarTrabalhoIndustria()'),true);const a=Object.values(s.agentes)[0],cash=b.caixa;
 s.festivalPreparando=false;g.eval(`{const a=estado.industriaColonia.agentes['${a.id}'];Object.assign(a,entradaIndustria('festival'),{fase:'atividade',trabalho:47});atualizarAgenteIndustria(a,1);}`);
 assert.equal(g.estado.economiaCidada.pessoas[a.id].saldo,800000);assert.equal(b.caixa,cash);assert.equal(s.agentes[a.id].funcao,'passeio');zero(g);
});
console.log('INDUSTRY_DEMAND_CHOICE_OK '+groups+' groups');
