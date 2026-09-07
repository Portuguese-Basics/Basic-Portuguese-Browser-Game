"use strict";
// Exact memoization checks, replay against the uncached allocator, and read-only drawing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const html = fs.readFileSync('index.html', 'utf8');
const prefix = fs.readFileSync('verification/smoke-test.js', 'utf8').split('const storage = new Map();')[0]
  .replace('return {\n    elements,', 'return {\n    context,\n    elements,');
const plain = v => JSON.parse(JSON.stringify(v));
function game(reference = false) {
  const outer = { require, Buffer, console, TextEncoder, TextDecoder, URL, Blob };
  vm.runInNewContext(prefix + '\nglobalThis.makeGame = createHarness;', outer);
  const g = outer.makeGame(new Map());
  g.eval = text => vm.runInNewContext(text, g.context);
  g.eval('crypto.randomUUID = (()=>{let n=0;return ()=>"replay-"+(++n)})()');
  g.eval('globalThis.rawCount = 0; globalThis.originalAllocator = recalcularTrabalhadoresColonia; recalcularTrabalhadoresColonia = function(){rawCount++;return originalAllocator();}');
  if (reference) g.eval('redistribuirTrabalhadoresColonia = recalcularTrabalhadoresColonia');
  return g;
}
function mature(g, population = 450) {
  for (const k of Object.keys(g.estado)) if (/Construid[oa]s?$/.test(k) && typeof g.estado[k] === 'boolean') g.estado[k] = true;
  Object.assign(g.estado, {coloniaIniciada:true, mapaExpansaoComprado:true, mapaAtual:'expansao',
    etapaConstrucaoColonia:4, populacaoColonia:population, quantidadeCasasColonia:90,
    idadesAdultosColonia:Array(population).fill(32), criancasColonia:[], familiasColonia:[],
    tesouroColonia:20000, saudeColonia:100, colonosComFome:0, ciclosSoldosAtrasados:0,
    quantidadeCabanasLenhadores:2, quantidadeCabanasColeta:2, quantidadePocosPublicos:4,
    quantidadeMilicianos:10, quantidadeGuardas:10, quantidadeSoldados:10,
    quantidadePostosGuarda:4, nivelOficinaFerramentas:3, barcosPesca:5, naviosMercantes:5,
    obraAutomaticaColonia:null, estoqueAlimentos:200, estoquePaes:100,
    estoqueHortalicas:100, estoqueFeijao:100, estoqueCarneSelvagem:60,
    estoqueCarneCriacao:70, estoqueCarneDefumada:150, estoquePeixeSeco:150,
    estoqueMadeira:180, estoqueErvas:100, estoqueMedicamentos:80, estoqueMinerio:100,
    estoquePedra:120, estoqueFerramentas:60, estoqueFerramentasPedra:40, estoqueFerramentasMadeira:40,
    velocidadeTempo:10, jogoPausado:false, cameraExpansao:{x:0,y:0,zoom:0.1}});
  g.estado.niveisEstradasColonia.fill(3);
  g.eval('estado.revisaoColonia=versaoColonia; estado.cacaMilicia=novoEstadoCacaMilicia(); atualizarInterface();');
}
let groups = 0;
function test(name, fn) { fn(); groups++; console.log('PASS ' + name); }

test('allocator only adds real-person military reservation to the prior algorithm', () => {
  const start=html.indexOf('      function recalcularTrabalhadoresColonia() {');
  const end=html.indexOf('\n      function ',start+15);
  const body=html.slice(start,end).replace('recalcularTrabalhadoresColonia','ALLOCATOR').replace('Math.max(0, estado.populacaoColonia - efetivosEconomiaColonia())', 'estado.populacaoColonia');
  assert.equal(crypto.createHash('sha256').update(body).digest('hex'),'93c18b5372aa86cba4daac5979b224219b0388e43b0bc504a10352c23fa7156b');
});

test('allocator dependency closure is covered, including indirect decisions', () => {
  const matches = [...html.matchAll(/^      function (\w+)\(/gm)], functions = new Map();
  for (let i=0;i<matches.length;i++) functions.set(matches[i][1], html.slice(matches[i].index, matches[i+1]?.index ?? html.length));
  const todo=['recalcularTrabalhadoresColonia'], visited=new Set();
  while(todo.length){const name=todo.pop();if(visited.has(name))continue;visited.add(name);
    for(const m of functions.get(name).matchAll(/(?<![.\w])(\w+)\s*\(/g))if(functions.has(m[1])&&!visited.has(m[1]))todo.push(m[1]);}
  const closure=[...visited].map(n=>functions.get(n)).join('\n');
  const g=game();
  const covered = new Set([...g.eval('chavesDecisaoEmpregosColonia'),
    'armadurasEquipadasColonia','cacaMilicia','criancasColonia','empregosColonia',
    'estoqueArmaduras','ferramentasLocaisColonia','migracoesPendentes','niveisEstradasColonia','economiaCidada']);
  assert.ok(html.includes('estado.economiaCidada.ativa,\n        ]);'), 'Economy switch is an explicit staffing dependency');
  for(const m of closure.matchAll(/estado\.(\w+)/g))assert.ok(covered.has(m[1]), 'Missing staffing dependency: '+m[1]);
  // Only these two dynamically indexed top-level state accesses exist in closure.
  assert.deepEqual([...new Set([...closure.matchAll(/estado\[([^\]]+)\]/g)].map(m=>m[1]))].sort(), ['destino','origem']);
  for(const k of ['estoqueLocalMadeira','estoqueMadeira','estoqueLocalErvas','estoqueErvas','estoqueLocalCarneSelvagem','estoqueCarneSelvagem','estoqueLocalCarneCriacao','estoqueCarneCriacao'])assert.ok(covered.has(k));
  assert.ok(!/Math\.random|Date\.|performance\.|tempoRio/.test(closure));
  console.log('DEPENDENCY_AUDIT '+JSON.stringify({functions:visited.size,stateKeys:covered.size}));
});

test('identical inputs skip allocation, input feedback is not prematurely cached', () => {
  const g=game(); mature(g);
  for(let i=0;i<8;i++)g.eval('redistribuirTrabalhadoresColonia()');
  const before=g.eval('rawCount');
  for(let i=0;i<240;i++)g.eval('redistribuirTrabalhadoresColonia()');
  assert.equal(g.eval('rawCount'),before);
  g.estado.estoqueFerramentas=0;
  g.eval('redistribuirTrabalhadoresColonia()');assert.ok(g.eval('rawCount')>before);
});

test('drawing and repeated paused inspection do not change jobs, tools or economic state',()=>{
  const g=game();mature(g);g.estado.jogoPausado=true;g.eval('limitarCameraExpansao()');
  const before=plain(g.estado),count=g.eval('rawCount');
  for(let i=0;i<80;i++){g.eval('desenhar()');g.resetDrawCalls();}
  assert.deepEqual(plain(g.estado),before);assert.equal(g.eval('rawCount'),count);
});

test('visual-only clocks and camera changes never invalidate staffing',()=>{
  const g=game();mature(g);for(let i=0;i<8;i++)g.eval('redistribuirTrabalhadoresColonia()');
  const n=g.eval('rawCount');g.estado.cameraExpansao.x=400;g.estado.velocidadeTempo=5;
  g.estado.jogoPausado=true;g.estado.tempoNecessidadesColonia+=0.25;
  g.eval('estado.cacaMilicia.expedicao={fase:"cacando",tempo:12,quantidade:4,duracao:120,semente:1,esforco:48}; redistribuirTrabalhadoresColonia()');
  assert.equal(g.eval('rawCount'),n);
});

test('exact allocation and tool equivalence across 160 seeded state changes',()=>{
  const a=game(), b=game(true);mature(a);mature(b);
  let seed=91725;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const changes=[
    (s,r)=>{s.estoqueAlimentos=Math.floor(r*210);s.colonosComFome=r<.2?30:0},
    (s,r)=>{s.saudeColonia=Math.floor(r*100);s.estoqueMedicamentos=Math.floor(r*120)},
    (s,r)=>{s.populacaoColonia=20+Math.floor(r*430);s.idadesAdultosColonia=Array(s.populacaoColonia).fill(32)},
    (s,r)=>{s.estoqueFerramentas=Math.floor(r*90);s.estoqueFerramentasPedra=Math.floor(r*60)},
    (s,r)=>{s.niveisEstradasColonia[Math.floor(r*8)]=Math.floor(r*4)},
    (s,r)=>{s.tesouroColonia=Math.floor(r*15000);s.estoquePedra=Math.floor(r*120)},
    (s,r)=>{s.obraAutomaticaColonia=r<.5?'moradia':null},
    (s,r)=>{s.cacaMilicia.carga.animais=Math.floor(r*15);s.cacaMilicia.carga.carne=Math.floor(r*300)},
    (s,r)=>{s.criancasColonia=[{idade:r<.5?0:90}];s.migracoesPendentes=r<.5?[1,4]:[]},
    (s,r)=>{s.quantidadeMilicianos=Math.floor(r*10);s.quantidadeGuardas=Math.floor(r*10)},
    (s,r)=>{s.estoqueLocalCarneSelvagem=r*48;s.estoqueCarneSelvagem=r*80;s.estoqueLocalErvas=r*60},
    (s,r)=>{s.armazensInternosPedraConstruidos=r>.5;s.estoqueArmaduras.couro=Math.floor(r*30)},
    (s,r)=>{s.moinhoConstruido=r>.5;s.cozinhaCarneConstruida=r>.2;s.companhiaTransportadoresConstruida=r>.1},
  ];
  for(let i=0;i<160;i++){
    const r=random(),f=changes[i%changes.length];f(a.estado,r);f(b.estado,r);
    for(let settle=0;settle<3;settle++){
      a.eval('redistribuirTrabalhadoresColonia()');b.eval('redistribuirTrabalhadoresColonia()');
      assert.deepEqual(plain(a.estado),plain(b.estado),'mutation '+i+' / settling step '+settle);
    }
  }
});

test('saved-state replacement and reset invalidate cached allocation',()=>{
  const a=game(), b=game(true);mature(a);mature(b);
  a.eval('salvarProgresso(); redefinirEstado(); carregarProgresso(); atualizarInterface()');
  b.eval('salvarProgresso(); redefinirEstado(); carregarProgresso(); atualizarInterface()');
  assert.deepEqual(plain(a.estado),plain(b.estado));
  a.eval('redefinirEstado(); redistribuirTrabalhadoresColonia()');
  b.eval('redefinirEstado(); redistribuirTrabalhadoresColonia()');
  assert.deepEqual(plain(a.estado),plain(b.estado));
});

test('2400 deterministic frames with 1x/2x/5x/10x and pause match uncached simulation',()=>{
  const a=game(), b=game(true);mature(a);mature(b);
  // Same reference math, event ordering and random rolls. No synthetic speedup.
  for(let frame=1;frame<=2400;frame++){
    const speed=[1,2,5,10][Math.floor(frame/600)%4];
    for(const g of [a,b]){g.estado.velocidadeTempo=speed;g.estado.jogoPausado=frame%300<12;}
    if(frame===10){a.eval('iniciarExpedicaoMilicia(5,60)');b.eval('iniciarExpedicaoMilicia(5,60)');}
    if(frame===700){a.estado.saudeColonia=40;b.estado.saudeColonia=40;}
    if(frame===1500){a.estado.estoqueAlimentos=0;b.estado.estoqueAlimentos=0;}
    for(const g of [a,b]){g.step(frame*50);g.resetDrawCalls();}
    if(frame%20===0)assert.deepEqual(plain(a.estado),plain(b.estado),'frame '+frame);
  }
  const calls={cached:a.eval('rawCount'),reference:b.eval('rawCount')};
  assert.ok(calls.cached<calls.reference*.4,JSON.stringify(calls));
  console.log('EQUIVALENCE_REPLAY '+JSON.stringify({frames:2400,calls}));
});

test('field capacity is staffing, not crop count; storage has separate upgraded limits',()=>{
  const g=game();mature(g);
  assert.equal(g.eval('dadosUsoCampoColonia("pastagem").capacidade'),14);
  assert.equal(g.eval('dadosUsoCampoColonia("lavoura").ocupados'),g.estado.empregosColonia.lavoura);
  g.estado.armazemGraosConstruido=false;
  assert.equal(g.eval('dadosUsoCampoColonia("lavoura").destinoPronto'),false);
  const reads='linhasEstoqueVisualColonia(areaArsenalMadeira,"x",0,0,"arcos")';
  assert.deepEqual(g.eval(reads).map(l=>l[2]).join(','),'90,60');
  assert.equal(g.eval('linhasEstoqueVisualColonia(areaErvario,"ERVAS",0,100,"ervas")[0][2]'),150);
  assert.equal(g.eval('linhasEstoqueVisualColonia(areaArmazemGraos,"GRÃOS",0,150,"graos")[0][2]'),150);
  assert.equal(g.eval('linhasEstoqueVisualColonia(areaFarmaciaColonia,"MEDICAMENTOS",0,120,"medicamentos")[0][2]'),120);
  g.estado.armazensInternosPedraConstruidos=false;
  assert.equal(g.eval('linhasEstoqueVisualColonia(areaFarmaciaColonia,"MEDICAMENTOS",0,80,"medicamentos")[0][2]'),80);
  for(const [n,c,v] of [[0,100,0],[50,100,.5],[100,100,1],[150,100,1],[-5,100,0],[1,0,0]])
    assert.equal(g.eval(`fracaoUsoVisualColonia(${n},${c})`),v);
  g.resetDrawCalls();g.eval('desenharLinhasEstoqueColonia(areaArmazemGraos, [["GRÃOS",0,150,"graos"]])');
  assert.ok(g.fillTexts.some(t=>t[0]==='VAZIO'));
  g.resetDrawCalls();g.eval('desenharLinhasEstoqueColonia(areaArmazemGraos, [["GRÃOS",150,150,"graos"]])');
  assert.ok(g.fillTexts.some(t=>t[0]==='CHEIO'));
});
console.log('CLARITY_OPTIMIZATION_OK '+groups+' test groups');
