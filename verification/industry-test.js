'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {game,plain}=require('./layout-harness');
const U=1000000;let groups=0;
function test(name,f){f();groups++;console.log('PASS '+name);}
function fixture(){const g=game();g.mature();g.eval('autorizarIndustria()');return g;}
function ready(){const g=fixture();g.estado.estoqueGraos=150;g.eval(`for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=p.vagas;}estado.industriaColonia.expansao=false;`);return g;}
function zero(g){assert.equal(g.eval('auditoriaCidada().diferenca'),0,'money must be conserved');}
function advance(g,n){g.eval(`for(let n=0;n<${n*2};n++)atualizarIndustriaColonia(.5);`);g.resetDrawCalls();}
function last(g){return g.eval('Object.values(estado.industriaColonia.agentes).find(a=>a.funcao==="frete")');}
function deliver(g){g.eval(`{const a=Object.values(estado.industriaColonia.agentes).find(a=>a.funcao==='frete');a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;a.trecho=a.caminho.length;atualizarAgenteIndustria(a,.1);a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;a.trecho=a.caminho.length;atualizarAgenteIndustria(a,.1);}`);}
test('authorization never grants buildings, money or free inventory; capital is transferred',()=>{
 const g=game();g.mature();const before=g.eval('patrimonioContabilCidada()'),town=g.estado.tesouroColonia,wood=g.estado.estoqueMadeira;
 assert.equal(g.eval('autorizarIndustria()'),true);zero(g);assert.equal(g.eval('patrimonioContabilCidada()'),before);assert.equal(g.estado.tesouroColonia,town-240);assert.equal(g.estado.estoqueMadeira,wood-10);assert.equal(g.eval('estado.industriaColonia.negocios.zeladoria.estado'),'obra');
});
test('construction respects reserve, food emergencies and outstanding wages',()=>{
 const g=game();g.mature();g.estado.tesouroColonia=1000;g.eval('observarContasCidada();autorizarIndustria()');assert.equal(g.eval('estado.industriaColonia.negocios.zeladoria.estado'),'planejado');zero(g);
 for(const k of ['colonosComFome','ciclosSoldosAtrasados']){g.estado.tesouroColonia=20000;g.estado[k]=1;g.eval('observarContasCidada()');assert.equal(g.eval('financiarObraIndustria()'),false);g.estado[k]=0;}
});
test('new maintenance funding is reclassification, not an extra treasury charge',()=>{
 const g=ready();g.eval('observarContasCidada();estado.tesouroColonia-=100;repassarManutencaoIndustria(100);observarContasCidada()');zero(g);
 assert.equal(g.eval('estado.industriaColonia.totais.contratos'),75*U);
 assert.equal(g.eval('estado.economiaCidada.saidasExternas'),25*U);
});
test('funded shifts pay a unique reserve resident only after work is performed',()=>{
 const g=ready();g.eval(`for(const b of Object.values(estado.industriaColonia.negocios))b.meta=0;estado.industriaColonia.negocios.artes.meta=1;alocarTrabalhoIndustria();`);
 let a=g.eval('Object.values(estado.industriaColonia.agentes)[0]');assert.equal(a.funcao,'trabalho');const p=g.estado.economiaCidada.pessoas[a.id];assert.equal(p.emprego,'geral');assert.equal(p.saldo,0);assert.equal(a.reserva,800000);zero(g);
 g.eval(`{const a=estado.industriaColonia.agentes['${a.id}'];a.trecho=a.caminho.length;a.x=a.caminho.at(-1).x;a.y=a.caminho.at(-1).y;atualizarAgenteIndustria(a,.1);atualizarAgenteIndustria(a,47);}`);assert.equal(p.saldo,0);
 g.eval(`atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],1)`);assert.equal(p.saldo,800000);assert.equal(g.eval('estado.industriaColonia.negocios.artes.creditos'),1);zero(g);
});
test('reassignment to an essential occupation cancels the second job and refunds its escrow',()=>{
 const g=ready();g.eval('alocarTrabalhoIndustria()');const a=g.eval('Object.values(estado.industriaColonia.agentes)[0]');const c=g.estado.industriaColonia.negocios[a.empresa].caixa,held=a.reserva;
 g.estado.economiaCidada.pessoas[a.id].emprego='lavoura';g.eval(`atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],.1)`);assert.equal(g.estado.industriaColonia.agentes[a.id],undefined);assert.equal(g.estado.industriaColonia.negocios[a.empresa].caixa,c+held);zero(g);
});
test('wholesale money and cargo remain in transit until the real carrier arrives',()=>{
 const g=ready(),grain=g.estado.estoqueGraos,town=g.estado.tesouroColonia,before=g.estado.industriaColonia.negocios.cervejaria.caixa;
 assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),true);const a=last(g);assert.equal(g.estado.estoqueGraos,grain-24);assert.equal(g.estado.tesouroColonia,town);assert.equal(g.estado.industriaColonia.negocios.cervejaria.estoque.graos,0);assert.equal(a.reserva,3240000);zero(g);
 deliver(g);assert.equal(g.estado.industriaColonia.negocios.cervejaria.estoque.graos,24);assert.equal(g.estado.economiaCidada.pessoas[a.id].saldo,600000);assert.equal(g.estado.industriaColonia.negocios.cervejaria.caixa,before-3240000);assert.equal(g.estado.industriaColonia.totais.tributoCidade,216000);assert.equal(g.estado.industriaColonia.totais.tributoPessoal,24000);zero(g);
});
test('one supplier order cannot be booked twice; municipal food and construction reserves protected',()=>{
 const g=ready();assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),true);assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),false);
 const h=ready();h.estado.estoqueGraos=63;assert.equal(h.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),false);h.estado.estoqueMadeira=90;assert.equal(h.eval('agendarFreteIndustria("municipio","artes","madeira",24,.1)'),false);zero(h);
});
test('cancelled cargo preserves money and stock, including full municipal warehouses',()=>{
 const g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)');const id=last(g).id;g.estado.estoqueGraos=150;
 g.eval(`cancelarAgenteIndustria(estado.industriaColonia.agentes['${id}']);operarIndustria()`);assert.equal(g.estado.estoqueGraos,150);assert.equal(g.estado.industriaColonia.devolucoes.graos,24);zero(g);
 g.estado.estoqueGraos=140;g.eval('operarIndustria()');assert.equal(g.estado.estoqueGraos,150);assert.equal(g.estado.industriaColonia.devolucoes.graos,14);
});
test('hops, beer and artisan recipes consume paid labor and actual inputs',()=>{
 const g=ready();g.eval(`{const s=estado.industriaColonia;s.negocios.lupulo.creditos=2;s.negocios.cervejaria.creditos=2;Object.assign(s.negocios.cervejaria.estoque,{lupulo:2,graos:4,madeira:1});s.negocios.artes.creditos=1;s.negocios.artes.estoque.madeira=1;operarIndustria();}`);
 const b=g.estado.industriaColonia.negocios;assert.equal(b.lupulo.estoque.lupulo,4);assert.equal(b.lupulo.estoque.graos,8);assert.equal(b.cervejaria.estoque.cerveja,8);assert.equal(b.cervejaria.estoque.lupulo,0);assert.equal(b.cervejaria.estoque.graos,0);assert.equal(b.cervejaria.estoque.madeira,0);assert.equal(b.cervejaria.creditos,0);assert.equal(b.artes.estoque.artigos,2);assert.equal(b.artes.estoque.madeira,0);
 g.eval('operarIndustria()');assert.equal(b.cervejaria.estoque.cerveja,8);zero(g);
});
function saleFixture(id='taverna'){
 const g=ready();g.eval(`{const s=estado.industriaColonia,e=estado.economiaCidada,people=e.adultos.map(id=>e.pessoas[id]).filter(p=>p.emprego==='geral');const p=people[0],w=people[1];estado.tesouroColonia-=10;p.saldo+=10000000;marcarContasCidada();s.negocios['${id}'].estoque[planoIndustria('${id}').item||'artigos']=10;s.agentes[p.id]=novoAgenteIndustria(p,'visita','${id}',entradaIndustria('${id}'));s.agentes[w.id]=novoAgenteIndustria(w,'trabalho','${id}',entradaIndustria('${id}'));s.agentes[w.id].fase='atividade';globalThis.customer=p.id;globalThis.server=w.id;}`);return g;
}
test('retail settlement has a real customer, onsite worker, stock, and exact 9/1 taxes',()=>{
 const g=saleFixture();g.eval('{const a=estado.industriaColonia.agentes[customer];a.fase="atividade";a.trabalho=10;Object.assign(a,entradaIndustria(a.empresa));a.trecho=a.caminho.length;}');assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),true);const p=g.estado.economiaCidada.pessoas[g.eval('customer')];assert.equal(p.saldo,8460000);assert.equal(p.impostos,140000);assert.equal(g.estado.industriaColonia.negocios.taverna.estoque.cerveja,9);assert.equal(g.estado.industriaColonia.totais.tributoCidade,126000);assert.equal(g.estado.industriaColonia.totais.tributoPessoal,14000);zero(g);
});
test('visits cannot charge before arrival, without funds or service, or while paused',()=>{
 const g=saleFixture(),id=g.eval('customer');advance(g,1);assert.equal(g.estado.industriaColonia.totais.visitas,0);g.estado.economiaCidada.opcionais=false;assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),false);g.estado.economiaCidada.opcionais=true;g.eval('estado.industriaColonia.agentes[server].fase="indo"');assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),false);
 g.estado.jogoPausado=true;const before=plain(g.estado);advance(g,10);assert.deepEqual(plain(g.estado),before);zero(g);
});
test('theater and festival are funded staffed services; free plazas never transfer money',()=>{
 for(const id of ['teatro','festival']){const g=saleFixture(id);g.eval('{const a=estado.industriaColonia.agentes[customer];a.fase="atividade";a.trabalho=10;Object.assign(a,entradaIndustria(a.empresa));a.trecho=a.caminho.length;}');if(id==='festival')g.eval('estado.industriaColonia.festivalAte=200');const before=g.estado.economiaCidada.pessoas[g.eval('customer')].saldo;assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),true);assert.equal(before-g.estado.economiaCidada.pessoas[g.eval('customer')].saldo,id==='teatro'?660000:880000);zero(g);}
 const g=ready();g.eval('agendarPasseioIndustria()');const before=plain(g.estado.economiaCidada);g.eval('for(const a of Object.values(estado.industriaColonia.agentes))atualizarAgenteIndustria(a,.5)');assert.deepEqual(plain(g.estado.economiaCidada),before);
});
test('new exports are bounded actual shipments and an explicit external money source',()=>{
 const g=ready();g.eval('estado.industriaColonia.negocios.artes.estoque.artigos=60');assert.equal(g.eval('agendarFreteIndustria("artes","exterior","artigos",12,1.2,true)'),true);const a=last(g);assert.equal(g.estado.industriaColonia.totais.exportacoes,0);zero(g);deliver(g);assert.equal(g.estado.industriaColonia.totais.exportacoes,14400000);assert.equal(g.estado.economiaCidada.entradasExternas,15840000);assert.equal(g.estado.economiaCidada.pessoas[a.id].saldo,600000);zero(g);
 g.eval('estado.industriaColonia.exportadosNoCiclo=24');assert.equal(g.eval('agendarFreteIndustria("artes","exterior","artigos",12,1.2,true)'),false);
});
test('no automatic extra 600-gold festival drain after authorizing the new system',()=>{
 const g=ready();g.estado.tempoFestivalColonia=600;const before=g.estado.tesouroColonia;g.eval('atualizarFestivalCicloColonia()');assert.equal(g.estado.tesouroColonia,before);zero(g);
});
test('save/reload preserves active cargo, work, cash, identities and full next-frame state',()=>{
 const g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1);alocarTrabalhoIndustria()');advance(g,3);g.eval('salvarProgresso()');const h=game(new Map(g.storage));
 // Both execute the normal zero-time first-frame registry rebuild; household members are compared, not excluded.
 g.step(0);h.step(0);g.resetDrawCalls();h.resetDrawCalls();
 assert.deepEqual(plain(h.estado.industriaColonia),plain(g.estado.industriaColonia));assert.deepEqual(plain(h.estado.economiaCidada),plain(g.estado.economiaCidada));zero(h);
 for(let i=1;i<=240;i++){for(const z of [g,h]){z.estado.velocidadeTempo=10;z.step(i*50);z.resetDrawCalls();}}
 assert.deepEqual(plain(h.estado.industriaColonia),plain(g.estado.industriaColonia));assert.deepEqual(plain(h.estado.economiaCidada),plain(g.estado.economiaCidada));zero(g);zero(h);
});
test('normal reload after delivery cannot repeat supplier, carrier or tax payments',()=>{
 const g=ready();g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)');deliver(g);g.eval('salvarProgresso()');const h=game(new Map(g.storage));assert.equal(h.estado.industriaColonia.totais.entregas,1);assert.deepEqual(plain(h.estado.industriaColonia.totais),plain(g.estado.industriaColonia.totais));zero(h);
});
test('drawing new businesses and people is state-read-only',()=>{
 const g=ready();advance(g,2);g.estado.jogoPausado=true;const before=plain(g.estado);for(let i=0;i<3;i++){g.eval('desenhar();atualizarPainelIndustria(true)');g.resetDrawCalls();}assert.deepEqual(plain(g.estado),before);zero(g);
});
test('every new building has a unique inspection and an accessible entrance',()=>{
 const g=ready();const r=g.eval(`planosIndustria.map(p=>({id:p.id,n:edificiosInspecionaveisColonia().filter(e=>e.id==='empresa-'+p.id).length,blocked:rotaMaisRapidaColonia(acessosPlantaColonia.areaAdministracao,entradaIndustria(p.id)).bloqueada===true}))`);
 assert.equal(r.length,10);for(const p of r){assert.equal(p.n,1);assert.equal(p.blocked,false,p.id);}zero(g);
});
test('invalid orders cannot invent inventory or unbounded reservations',()=>{
 const g=ready();for(const args of ['"municipio","cervejaria","nope",2,1','"municipio","cervejaria","graos",-2,1','"municipio","cervejaria","graos",2,Infinity','"municipio","cervejaria","graos",2.5,1'])assert.equal(g.eval('agendarFreteIndustria('+args+')'),false);zero(g);
});
test('workstation and customer circuits begin and finish at the actual door',()=>{
 const g=ready();for(const p of g.eval('planosIndustria'))for(let i=0;i<12;i++)for(const client of [false,true])for(const time of [0,client?10:48]){
 const pt=g.eval(`poseTrabalhoIndustria(planoIndustria('${p.id}'),${i},${time},'cid-150',true,${client})`);const door=g.eval(`entradaIndustria('${p.id}')`);assert.ok(Math.hypot(pt.x-door.x,pt.y-door.y)<1e-6);}
});
test('forestry is replanted and rate bounded; quarry rock is finite; brewery requires water',()=>{
 const g=ready();g.eval('estado.industriaColonia.negocios.floresta.creditos=2;estado.industriaColonia.negocios.pedreira.creditos=1;operarIndustria()');const b=g.estado.industriaColonia.negocios;assert.equal(b.floresta.estoque.madeira,4);assert.equal(b.floresta.arvores,23);assert.equal(b.floresta.replantios.length,1);assert.equal(b.pedreira.estoque.pedra,3);assert.equal(b.pedreira.rocha,897);
 g.eval('estado.industriaColonia.tempo=600;operarIndustria()');assert.equal(b.floresta.arvores,24);assert.equal(b.floresta.estoque.madeira,4);
 g.eval('Object.assign(estado.industriaColonia.negocios.cervejaria.estoque,{lupulo:2,graos:4,madeira:1});estado.industriaColonia.negocios.cervejaria.creditos=2;estado.cisternaConstruida=false;operarIndustria()');assert.equal(b.cervejaria.estoque.cerveja,0);zero(g);
});
test('fractional municipal purchases and cancellation preserve every micro-gold',()=>{
 const g=ready();g.estado.industriaColonia.negocios.floresta.estoque.madeira=10;const before=g.eval('patrimonioContabilCidada()');assert.equal(g.eval('agendarFreteIndustria("floresta","municipio","madeira",1,.123)'),true);zero(g);const a=last(g);g.eval(`cancelarAgenteIndustria(estado.industriaColonia.agentes['${a.id}']);liquidarCompensacaoCidada()`);assert.equal(g.eval('patrimonioContabilCidada()'),before);zero(g);
});
test('paid services are exactly once, and new military duty cannot retain civilian contracts',()=>{
 const g=saleFixture();g.eval('{const a=estado.industriaColonia.agentes[customer];Object.assign(a,entradaIndustria(a.empresa));a.fase="atividade";a.trabalho=10;}');assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),true);const money=g.estado.economiaCidada.pessoas[g.eval('customer')].saldo;assert.equal(g.eval('executarCompraIndustria(estado.industriaColonia.agentes[customer])'),false);assert.equal(g.estado.economiaCidada.pessoas[g.eval('customer')].saldo,money);zero(g);
 const h=ready();h.eval('alocarTrabalhoIndustria()');const a=h.eval('Object.values(estado.industriaColonia.agentes)[0]');h.estado.economiaCidada.pessoas[a.id].emprego='milicia';h.eval(`atualizarAgenteIndustria(estado.industriaColonia.agentes['${a.id}'],.5)`);assert.equal(h.estado.industriaColonia.agentes[a.id],undefined);zero(h);
});
console.log('INDUSTRY_OK '+groups+' groups');
