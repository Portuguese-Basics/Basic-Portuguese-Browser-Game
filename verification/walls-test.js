'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('verification/clarity-test.js','utf8').split('let groups =')[0];
const outer={require,Buffer,console,TextEncoder,TextDecoder,URL,Blob};
vm.runInNewContext(prefix+'\nglobalThis.make=game;globalThis.fixture=mature;',outer);
const plain=x=>JSON.parse(JSON.stringify(x));
function game(){const g=outer.make();outer.fixture(g);Object.assign(g.estado,{trechosPalicadaInterna:4,trechosPalicadaExterna:4,trechosMuralhaPedraInterna:4,trechosMuralhaPedraExterna:4,quantidadeTorresMuralha:8,quantidadePortoesFortificados:7,trechosAdarveInterno:4,trechosAdarveExterno:4,arqueirosMilicia:4,arqueirosGuarda:4,arqueirosSoldados:4,estoqueFlechas:120,estoqueArcos:15,estoqueLancasMadeira:0,estoqueArmas:0});g.eval('estado.defesaPosicional=normalizarDefesaPosicional(null)');return g;}
function advance(g,seconds){g.eval(`atualizarGuarnicaoColonia(${seconds})`);}
function stationed(g){advance(g,500);assert.equal(g.estado.defesaPosicional.unidades.filter(u=>u.fase==='posto').length,30);}
let groups=0;function test(n,f){f();groups++;console.log('PASS '+n);}
test('48 unique stations, real wall thickness and seven open road gates',()=>{
 const g=game(),p=plain(g.eval('postosElevadosColonia()'));assert.equal(p.length,48);assert.equal(new Set(p.map(p=>p.id)).size,48);
 assert.equal(p.filter(p=>p.tipo==='torre').length,16);assert.equal(p.filter(p=>p.tipo==='muro').length,32);
 for(const a of p.filter(p=>p.tipo==='muro'))assert.ok(Math.abs(Math.hypot(a.x-a.pe.x,a.y-a.pe.y)-136)<1e-6);
 assert.equal(g.eval('portoesMuralhaColonia.length'),7);
 for(const gate of plain(g.eval('portoesMuralhaColonia')))for(const a of p.filter(p=>p.tipo==='muro'))assert.ok(Math.hypot(a.x-gate.x,a.y-gate.y)>105);
 g.estado.trechosAdarveInterno=0;g.estado.trechosAdarveExterno=0;g.estado.quantidadeTorresMuralha=3;
 assert.equal(g.eval('postosElevadosColonia().length'),6);
});
test('new tier requires authorization, stone walls, materials and sustainable funding',()=>{
 const g=game(),s=g.estado;s.trechosAdarveInterno=0;s.trechosAdarveExterno=0;
 assert.equal(g.eval('iniciarObraAutomaticaColonia("adarveExterno")'),false);
 s.trechosMuralhaPedraInterna=3;assert.equal(g.eval('autorizarAdarvesColonia()'),false);
 s.trechosMuralhaPedraInterna=4;assert.equal(g.eval('autorizarAdarvesColonia()'),true);
 s.estoquePedra=0;assert.equal(g.eval('iniciarObraAutomaticaColonia("adarveExterno")'),false);
 s.estoquePedra=120;s.quantidadeSoldados=9;const money=s.tesouroColonia;
 assert.equal(g.eval('iniciarObraAutomaticaColonia("adarveExterno")'),true);
 assert.equal(s.tesouroColonia,money-2000);assert.equal(s.estoquePedra,60);
 assert.equal(g.eval('iniciarObraAutomaticaColonia("adarveExterno")'),false);
 g.eval('estado.tempoObraAutomaticaColonia=duracaoObraAutomaticaColonia;atualizarPrioridadesColonia(0)');
 assert.equal(s.trechosAdarveExterno,1);
 const upkeep=g.eval('manutencaoMunicipalColonia()');s.trechosAdarveExterno=2;assert.equal(g.eval('manutencaoMunicipalColonia()'),upkeep+.25);
});
test('all three troop categories physically approach and climb; no duplicated personnel',()=>{
 const g=game();advance(g,.1);const first=g.estado.defesaPosicional.unidades[0];assert.equal(first.fase,'indo');
 const origin={x:first.x,y:first.y};advance(g,1);assert.ok(Math.hypot(first.x-origin.x,first.y-origin.y)>1);
 first.x=first.rota.at(-1).x;first.y=first.rota.at(-1).y;first.trecho=first.rota.length;advance(g,.1);assert.equal(first.fase,'subindo');advance(g,1);assert.ok(first.altura>0&&first.altura<1);advance(g,2);assert.equal(first.fase,'posto');
 stationed(g);const units=g.estado.defesaPosicional.unidades;assert.equal(new Set(units.map(u=>u.id)).size,30);assert.equal(new Set(units.map(u=>u.posto)).size,30);
 for(const cat of ['milicia','guarda','soldado'])assert.equal(units.filter(u=>u.categoria===cat).length,10);
});
test('rendering a manned fortress remains state-read-only',()=>{
 const g=game();stationed(g);const state=plain(g.estado);for(let i=0;i<10;i++){g.eval('desenhar()');g.resetDrawCalls();}assert.deepEqual(plain(g.estado),state);
});
test('recall descends and returns rather than teleporting',()=>{
 const g=game();stationed(g);const payroll=g.eval('folhaSoldosColonia()');g.eval('alternarGuarnicaoColonia()');advance(g,.1);
 assert.ok(g.estado.defesaPosicional.unidades.every(u=>u.fase==='descendo'));advance(g,3);assert.ok(g.estado.defesaPosicional.unidades.every(u=>u.fase==='voltando'));
 advance(g,500);assert.equal(g.estado.defesaPosicional.unidades.length,0);assert.equal(g.eval('folhaSoldosColonia()'),payroll);
});
test('hunters leave their wall posts first, with no double assignment',()=>{
 const g=game();stationed(g);assert.equal(g.eval('iniciarExpedicaoMilicia(5,60)'),true);advance(g,.1);
 g.eval('atualizarExpedicaoMilicia(10)');assert.equal(g.estado.cacaMilicia.expedicao.tempo,0);
 assert.ok(g.estado.defesaPosicional.unidades.filter(u=>u.categoria==='milicia'&&u.indice<5).every(u=>u.retirar));
 advance(g,500);assert.equal(g.estado.defesaPosicional.unidades.filter(u=>u.categoria==='milicia'&&u.indice<5).length,0);
 g.eval('atualizarExpedicaoMilicia(194)');assert.equal(g.estado.cacaMilicia.expedicao,null);advance(g,500);
 assert.equal(g.estado.defesaPosicional.unidades.length,30);assert.equal(g.estado.cacaMilicia.concluidas,1);
});
test('only ready archers fire; real arrows, range and obstruction checks apply',()=>{
 const g=game();assert.equal(g.eval('iniciarExercicioMuralhas()'),false);stationed(g);
 const before=g.eval('estado.estoqueFlechas+Object.values(estado.defesaPosicional.aljavas).reduce((a,b)=>a+b,0)');
 assert.equal(g.eval('iniciarExercicioMuralhas()'),true);assert.equal(g.eval('iniciarExercicioMuralhas()'),false);advance(g,90);
 const d=g.estado.defesaPosicional;assert.equal(d.exercicio,null);assert.ok(d.ultimo.abatidos>0);assert.ok(d.ultimo.disparos>0);
 const after=g.eval('estado.estoqueFlechas+Object.values(estado.defesaPosicional.aljavas).reduce((a,b)=>a+b,0)');assert.equal(before-after,d.ultimo.disparos);
 assert.equal(g.eval('linhaTiroMuralhaLivre(postosElevadosColonia()[0],{x:8500,y:4500})'),false);
});
test('empty quivers cannot fire or become free ammunition on reload',()=>{
 const g=game();stationed(g);g.estado.estoqueFlechas=0;for(const k of Object.keys(g.estado.defesaPosicional.aljavas))g.estado.defesaPosicional.aljavas[k]=0;
 assert.equal(g.eval('iniciarExercicioMuralhas()'),false);const n=plain(g.eval('normalizarDefesaPosicional(estado.defesaPosicional)'));
 assert.ok(Object.values(n.aljavas).every(x=>x===0));g.estado.defesaPosicional=n;g.estado.estoqueFlechas=3;
 assert.equal(g.eval('iniciarExercicioMuralhas()'),true);advance(g,8);assert.ok(g.estado.defesaPosicional.exercicio.disparos<=3);assert.equal(g.estado.estoqueFlechas,0);
});
test('legacy quivers migrate once; reequipment returns the old weapon and debits the new kit',()=>{
 const g=game(),s=g.estado;assert.equal(Object.values(s.defesaPosicional.aljavas).reduce((a,b)=>a+b,0),240);
 const n=s.arqueirosGuarda,arrows=s.estoqueFlechas,bows=s.estoqueArcos;s.armasMetalGuarda=2;
 assert.equal(g.eval('equiparArqueiroMuralhas("guarda")'),true);assert.equal(s.arqueirosGuarda,n+1);assert.equal(s.armasMetalGuarda,1);assert.equal(s.estoqueArmas,1);
 assert.equal(s.estoqueFlechas,arrows-20);assert.equal(s.estoqueArcos,bows-1);assert.equal(s.defesaPosicional.aljavas[`guarda:${n}`],20);
 s.estoqueArmas=60;const before=plain(s);assert.equal(g.eval('equiparArqueiroMuralhas("guarda")'),false);assert.deepEqual(plain(s),before);
});
test('pause and split timesteps preserve garrison movement and projectile results',()=>{
 const a=game(),b=game();stationed(a);stationed(b);a.eval('iniciarExercicioMuralhas()');b.eval('iniciarExercicioMuralhas()');
 a.estado.jogoPausado=true;const state=plain(a.estado.defesaPosicional);advance(a,10);assert.deepEqual(plain(a.estado.defesaPosicional),state);a.estado.jogoPausado=false;
 advance(a,20);for(let i=0;i<200;i++)advance(b,.1);assert.deepEqual(plain(a.estado.defesaPosicional),plain(b.estado.defesaPosicional));
});
test('mid-climb and mid-flight saved snapshots resume without duplicate hits',()=>{
 for(const time of [.1,1,200,505]){
  const a=game();advance(a,time);if(time>500)a.eval('iniciarExercicioMuralhas();atualizarGuarnicaoColonia(.5)');
  const saved=plain(a.estado.defesaPosicional);const b=game();b.estado.defesaPosicional=saved;b.eval('estado.defesaPosicional=normalizarDefesaPosicional(estado.defesaPosicional)');
  advance(a,20);advance(b,20);assert.deepEqual(plain(a.estado.defesaPosicional),plain(b.estado.defesaPosicional));
 }
});
test('exercise is optional, bounded and has no civilian damage or rewards',()=>{
 const g=game();stationed(g);advance(g,100);assert.equal(g.estado.defesaPosicional.exercicio,null);
 const before={gold:g.estado.tesouroColonia,pop:g.estado.populacaoColonia,health:g.estado.saudeColonia,food:g.estado.estoqueAlimentos};
 g.eval('iniciarExercicioMuralhas()');for(let i=0;i<90;i++){advance(g,1);assert.ok((g.estado.defesaPosicional.exercicio?.alvos.length||0)<=6);assert.ok((g.estado.defesaPosicional.exercicio?.flechas.length||0)<=64);}
 assert.deepEqual({gold:g.estado.tesouroColonia,pop:g.estado.populacaoColonia,health:g.estado.saudeColonia,food:g.estado.estoqueAlimentos},before);
 const times=g.estado.defesaPosicional.exercicios;g.eval('terminarExercicioMuralhas()');assert.equal(g.estado.defesaPosicional.exercicios,times);
});
test('every ground route crosses enclosure boundaries only at existing gates',()=>{
 const g=game();advance(g,.1);const units=plain(g.estado.defesaPosicional.unidades);
 const walls=plain(g.eval('[recintoInterno,recintoExterno].flatMap(r=>[0,1,2,3].flatMap(i=>segmentosTrechoPalicadaColonia(r,i)))'));
 for(const u of units)for(let i=1;i<u.rota.length;i++){
  const a=u.rota[i-1],b=u.rota[i];
  for(const w of walls){const vert=w.x1===w.x2,den=vert?b.x-a.x:b.y-a.y;if(Math.abs(den)<1e-8)continue;
   const t=((vert?w.x1:w.y1)-(vert?a.x:a.y))/den;
   const cross=vert?a.y+t*(b.y-a.y):a.x+t*(b.x-a.x);
   assert.ok(!(t>1e-7&&t<1-1e-7&&cross>(vert?w.y1:w.x1)+1e-7&&cross<(vert?w.y2:w.x2)-1e-7),`Solid wall crossed by ${u.id} on ground leg ${i}`);
  }
 }
});
test('malformed saves cannot duplicate troops, stations or unbounded projectiles',()=>{
 const g=game();advance(g,.1);const sample=plain(g.estado.defesaPosicional.unidades[0]);
 const raw={ativa:true,passo:Infinity,unidades:[sample,sample,{...sample,categoria:'other'}, {...sample,indice:999}, {...sample,id:'guarda:1',categoria:'guarda',indice:1}],aljavas:{'milicia:0':999},exercicio:{posto:sample.posto,alvos:Array.from({length:100},(_,i)=>({id:i,vida:99,x:-99,y:999999})),flechas:Array.from({length:1000},()=>({alvo:0,dano:999,tempo:0,duracao:1,origem:{x:1,y:1},destino:{x:1,y:1}}))}};
 g.estado.defesaPosicional=plain(g.eval('normalizarDefesaPosicional('+JSON.stringify(raw)+')'));
 const d=g.estado.defesaPosicional;assert.equal(d.unidades.length,1);assert.equal(d.aljavas['milicia:0'],20);assert.equal(d.exercicio.alvos.length,6);assert.equal(d.exercicio.flechas.length,64);assert.ok(d.exercicio.flechas.every(f=>f.dano===8));assert.equal(d.passo,0);
});
test('bows fire from upgraded walls without any guard tower',()=>{
 const g=game();g.estado.quantidadeTorresMuralha=0;stationed(g);assert.ok(g.estado.defesaPosicional.unidades.every(u=>u.posto.startsWith('adarve-')));
 assert.equal(g.eval('iniciarExercicioMuralhas()'),true);advance(g,90);assert.ok(g.estado.defesaPosicional.ultimo.abatidos>0);assert.ok(g.estado.defesaPosicional.ultimo.disparos>0);
});
console.log('MANNED_WALLS_OK '+groups+' test groups');
