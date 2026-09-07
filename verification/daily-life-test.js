'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('verification/smoke-test.js','utf8').split('const storage = new Map();')[0].replace('return {\n    elements,','return {\n    context,\n    elements,');
const oldTests=fs.readFileSync('verification/clarity-test.js','utf8');
const fixtureCode=oldTests.slice(oldTests.indexOf('function mature('),oldTests.indexOf('let groups ='));
function game(storage=new Map()) {
  const o={require,Buffer,console,TextEncoder,TextDecoder,URL,Blob};
  vm.runInNewContext(prefix+'\nglobalThis.create=createHarness;\n'+fixtureCode+'\nglobalThis.mature=mature;',o);
  const g=o.create(storage);g.eval=s=>vm.runInNewContext(s,g.context);g.storage=storage;g.mature=()=>{o.mature(g);g.eval('redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);prepararVidaCotidiana()');};return g;
}
const plain=x=>JSON.parse(JSON.stringify(x));
let groups=0;function test(name,f){f();groups++;console.log('PASS '+name);}
test('450 identities each have exactly one map representation; reserve is not a stack at one door',()=>{
  const g=game();g.mature();const people=g.eval('cacheVidaCotidiana.pessoas');assert.equal(people.length,450);assert.equal(new Set(people.map(p=>p.id)).size,450);
  assert.equal(people.filter(p=>['milicia','guarda','soldado'].includes(p.tipo)).length,30);
  const samples=g.eval('cacheVidaCotidiana.pessoas.map(p=>amostraVidaCotidiana(p.id))');
  const reserve=samples.filter(a=>a.tipo==='geral'&&a.visivel);assert.ok(reserve.length>150);
  assert.ok(new Set(reserve.map(a=>`${a.x.toFixed(1)},${a.y.toFixed(1)}`)).size>=reserve.length*.95);
  assert.ok(samples.every(a=>Number.isFinite(a.x)&&Number.isFinite(a.y)));
});
test('every civilian has >=40 exterior seconds in every 60-second window; maximum hidden gap 14s',()=>{
  const g=game();g.mature();let checked=0,worst=0,minVisible=60;
  for(const offset of [0,17.25,53.9,20000.1])for(const p of g.eval('cacheVidaCotidiana.pessoas').filter(p=>!['milicia','guarda','soldado'].includes(p.tipo))){
    let visible=0,gap=0,maxGap=0;
    for(let i=0;i<240;i++){g.context.sampleId=p.id;g.context.sampleTime=offset+i*.25;const a=g.eval('amostraVidaCotidiana(sampleId,sampleTime)');if(a.visivel){visible+=.25;gap=0;}else{gap+=.25;maxGap=Math.max(maxGap,gap);}}
    assert.ok(visible>=40,`${p.id} ${p.tipo}: ${visible}`);assert.ok(maxGap<=14,`${p.id}: gap ${maxGap}`);checked++;worst=Math.max(worst,maxGap);minVisible=Math.min(minVisible,visible);
  }
  console.log('VISIBILITY_COVERAGE '+JSON.stringify({windows:checked,windowSeconds:60,minimumExteriorSeconds:minVisible,maximumInteriorSeconds:worst}));
});
test('all job types have exterior activity, including unstaffed-in-fixture roles',()=>{
  const g=game();g.mature();const roles=g.eval('Object.keys(coresVidaCotidiana).filter(k=>k!=="crianca")');
  g.context.roles=roles;g.eval('roles.forEach((k,i)=>{const p=estado.economiaCidada.pessoas[estado.economiaCidada.adultos[i]];p.emprego=k;p.vaga=0;});cacheVidaCotidiana.assinatura="";prepararVidaCotidiana()');
  for(let i=0;i<roles.length;i++){g.context.sampleId=g.estado.economiaCidada.adultos[i];const pos=g.eval('Array.from({length:60},(_,i)=>amostraVidaCotidiana(sampleId,i)).filter(a=>a.visivel)');assert.ok(pos.length>=40,roles[i]);assert.ok(pos.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));}
});
test('local civilian paths avoid all reserved building and wall footprints; no water crossing',()=>{
  const g=game();g.mature();const failed=g.eval('cacheVidaCotidiana.pessoas.filter(p=>p.caminho&&!p.caminho.pontos.slice(1).every((b,i)=>segmentoLivreCotidiano(p.caminho.pontos[i],b,cacheVidaCotidiana.obstaculos))).map(p=>p.id)');assert.deepEqual(plain(failed),[]);
  for(const p of g.eval('cacheVidaCotidiana.pessoas').filter(p=>p.caminho)){assert.ok(p.caminho.total>=0&&p.caminho.total<2000);}
});
test('personal routes neither haul stock nor alter salaries, taxes, food or staffing',()=>{
  const g=game();g.mature();g.eval('estado.jogoPausado=false');const before=plain(g.estado);g.eval('for(let i=0;i<1200;i++)atualizarVidaCotidiana(.05)');
  const after=plain(g.estado);delete before.vidaCotidiana;delete after.vidaCotidiana;assert.deepEqual(after,before);
});
test('drawing and presence queries are read-only; repeated requests reuse measured paths',()=>{
  const g=game();g.mature();g.eval('limitarCameraExpansao()');const before=plain(g.estado);
  g.eval('globalThis.savedPath=cacheVidaCotidiana.pessoas.find(p=>p.caminho).caminho;prepararVidaCotidiana();');assert.equal(g.eval('savedPath===cacheVidaCotidiana.pessoas.find(p=>p.caminho).caminho'),true);
  for(let i=0;i<30;i++){g.eval('desenhar();cacheVidaCotidiana.pessoas.forEach(p=>amostraVidaCotidiana(p.id))');g.resetDrawCalls();}
  assert.deepEqual(plain(g.estado),before);
});
test('pause freezes presence; x1/2/5/10 uses simulation time, not wall clock',()=>{
  const g=game();g.mature();g.eval('estado.jogoPausado=true;atualizarVidaCotidiana(999)');assert.equal(g.estado.vidaCotidiana.tempo,0);
  for(const n of [1,2,5,10]){const a=game();a.mature();a.estado.velocidadeTempo=n;for(let i=1;i<=20;i++){a.step(i*50);a.resetDrawCalls();}assert.ok(Math.abs(a.estado.vidaCotidiana.tempo-n)<1e-8);}
});
test('save/reload preserves each routine phase and does not create extra financial transactions',()=>{
  const g=game();g.mature();g.eval('estado.jogoPausado=false;atualizarVidaCotidiana(39.25);estado.jogoPausado=true;salvarProgresso()');
  const before=g.eval('cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id))'),funds=g.eval('auditoriaCidada().carteiras');
  const b=game(new Map(g.storage));b.eval('prepararVidaCotidiana()');assert.equal(b.estado.vidaCotidiana.tempo,39.25);assert.deepEqual(plain(b.eval('cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id))')),plain(before));assert.equal(b.eval('auditoriaCidada().carteiras'),funds);
});
test('babies and children have individual non-worker appearances and transition with age',()=>{
  const g=game();g.mature();g.eval(`estado.populacaoColonia=448;estado.idadesAdultosColonia.length=448;estado.criancasColonia=[{id:'baby-a',idade:1,familiaId:'nucleo-1'},{id:'child-a',idade:duracaoBebeColonia+1,familiaId:'nucleo-1'}];atualizarCadastroCidada(true);prepararVidaCotidiana();`);
  assert.equal(g.eval('cacheVidaCotidiana.pessoas.length'),450);const baby=g.estado.economiaCidada.jovens['baby-a'];g.context.baby=baby;assert.equal(g.eval('cacheVidaCotidiana.porId.get(baby).bebe'),true);
  assert.equal(g.eval('amostraVidaCotidiana(baby,30).tipo'),'crianca');assert.equal(g.estado.economiaCidada.pessoas[baby].salario,0);
  g.eval('estado.criancasColonia[0].idade=duracaoBebeColonia+1;prepararVidaCotidiana()');assert.equal(g.eval('cacheVidaCotidiana.porId.get(baby).bebe'),false);
});
test('real garrison and expedition positions are reused; off-map hunters are explicitly absent',()=>{
  const g=game();g.mature();g.eval('estado.trechosAdarveExterno=4;estado.trechosAdarveInterno=4;estado.quantidadeTorresMuralha=8;atualizarGuarnicaoColonia(.1);prepararVidaCotidiana()');
  const u=g.estado.defesaPosicional.unidades[0];assert.ok(u);g.context.u=u;
  const stationed=g.eval('cacheVidaCotidiana.pessoas.find(p=>p.tipo===u.categoria&&p.vaga===u.indice).id');g.context.who=stationed;const a=g.eval('amostraVidaCotidiana(who)');assert.equal(a.x,u.x);assert.equal(a.y,u.y-u.altura*28);
  g.eval('estado.defesaPosicional.unidades=[];estado.cacaMilicia.expedicao={fase:"cacando",quantidade:5,duracao:120,tempo:12,esforco:60,semente:5}');
  const hunters=g.eval('cacheVidaCotidiana.pessoas.filter(p=>p.tipo==="milicia"&&p.vaga<5).map(p=>amostraVidaCotidiana(p.id))');assert.equal(hunters.length,5);assert.ok(hunters.every(p=>p.fora&&!p.visivel));
});
test('wagon itinerary is unchanged and each driver has one representation, not a second civilian',()=>{
  const g=game();g.mature();const drivers=g.eval('cacheVidaCotidiana.pessoas.filter(p=>p.tipo==="transportador")');assert.ok(drivers.length>0);
  for(const p of drivers)for(const t of [0,12,39.5,96]){g.context.p=p;g.context.t=t;const a=g.eval('amostraVidaCotidiana(p.id,t)'),b=g.eval('posicaoRotinaUrbanaColonia(p.indice,p.tipo,p.vaga,t)');assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<1e-6);assert.ok(a.carroca&&a.visivel);}
});
test('older/malformed saves, removal and resets cannot leave phantom residents',()=>{
  const g=game();g.mature();for(const raw of [null,{}, {tempo:NaN},{tempo:-50},{tempo:Infinity}]){g.context.raw=raw;assert.equal(g.eval('normalizarVidaCotidiana(raw).tempo'),0);}
  g.eval('estado.populacaoColonia=440;estado.idadesAdultosColonia.length=440;atualizarCadastroCidada(true);prepararVidaCotidiana()');assert.equal(g.eval('cacheVidaCotidiana.pessoas.length'),440);
  g.eval('redefinirEstado();prepararVidaCotidiana()');assert.equal(g.estado.vidaCotidiana.tempo,0);assert.equal(g.eval('cacheVidaCotidiana.pessoas.length'),0);
});
test('locator selects the named resident without paying or changing jobs',()=>{
  const g=game();g.mature();g.context.id=g.estado.economiaCidada.adultos[60];const before=plain(g.estado.economiaCidada);assert.equal(g.eval('localizarCidadaoNoMapa(id)'),true);assert.equal(g.eval('destaqueVidaCotidiana'),g.context.id);assert.deepEqual(plain(g.estado.economiaCidada),before);assert.equal(g.eval('localizarCidadaoNoMapa("absent")'),false);
});
console.log('DAILY_LIFE_OK '+groups+' groups');
