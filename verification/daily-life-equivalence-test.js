'use strict';
// Active financial equivalence. Map relocation changes camera/player and garrison geometry.
// Independent map-layout tests validate those fields; no money, identity, job or stock is excluded.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const activeRef=process.env.PREVIOUS_ACTIVE_REF||'df0c05bae2b9a748b36b9801738c28c446f609b6';
const baseline=execFileSync('git',['show',activeRef+':index.html'],{encoding:'utf8'});
const current=fs.readFileSync('index.html','utf8');
const prefix=fs.readFileSync('verification/smoke-test.js','utf8').split('const storage = new Map();')[0].replace('return {\n    elements,','return {\n    context,\n    elements,').replace('crypto: { randomUUID: () => `id-${Math.random()}` },','crypto: { randomUUID: (()=>{let n=0;return ()=>`stable-${++n}`})() },');
const tests=fs.readFileSync('verification/clarity-test.js','utf8'),fixture=tests.slice(tests.indexOf('function mature('),tests.indexOf('let groups ='));
class FixedDate extends Date {constructor(...a){super(...(a.length?a:[1788800000000]));} static now(){return 1788800000000;}}
function game(html,storage=new Map()){
 const o={require:n=>n==='fs'||n==='node:fs'?{...fs,readFileSync:(p,...a)=>p==='index.html'?html:fs.readFileSync(p,...a)}:require(n),Buffer,console,TextEncoder,TextDecoder,URL,Blob,Date:FixedDate};
 vm.runInNewContext(prefix+'\nglobalThis.make=createHarness;\n'+fixture+'\nglobalThis.fixture=mature;',o);
 const g=o.make(storage);g.eval=s=>vm.runInNewContext(s,g.context);g.storage=storage;g.fixture=()=>o.fixture(g);return g;
}
function state(g){const s=JSON.parse(JSON.stringify(g.estado));if(!baseline.includes("function novaIndustriaColonia")&&s.industriaColonia){assert.equal(s.industriaColonia.ativa,false,"old-runtime equivalence only covers enterprises not yet authorized");delete s.industriaColonia;}if(!baseline.includes("function novaVidaCotidiana"))delete s.vidaCotidiana;delete s.cameraExpansao;delete s.jogador.x;delete s.jogador.y;
 for(const u of s.defesaPosicional?.unidades||[])for(const k of ['x','y','altura','rota','trecho','fase'])delete u[k];return s;}
for(const scenario of ['mature','poverty','hunt','garrison','children']){
 const seed=game(baseline);seed.fixture();
 if(scenario==='poverty')Object.assign(seed.estado,{tesouroColonia:50,estoqueAlimentos:0,estoqueMedicamentos:0,saudeColonia:45});
 if(scenario==='hunt')seed.eval('iniciarExpedicaoMilicia(5,120);atualizarExpedicaoMilicia(70)');
 if(scenario==='garrison')seed.eval('estado.trechosAdarveExterno=4;estado.quantidadeTorresMuralha=8;atualizarGuarnicaoColonia(20)');
 if(scenario==='children')seed.eval('estado.populacaoColonia=440;estado.idadesAdultosColonia.length=440;estado.criancasColonia=Array.from({length:10},(_,i)=>({id:"child-"+i,familiaId:"nucleo-1",idade:i+2}));');
 seed.eval('redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);salvarProgresso()');
 const a=game(baseline,new Map(seed.storage)),b=game(current,new Map(seed.storage));assert.deepEqual(state(b),state(a),scenario+' load');
 for(let i=1;i<=480;i++){
  for(const g of [a,b]){g.estado.velocidadeTempo=[1,2,5,10][Math.floor(i/60)%4];g.estado.jogoPausado=i%70<7;g.step(i*50);g.resetDrawCalls();}
  if(i%20===0)assert.deepEqual(state(b),state(a),scenario+' frame '+i);
 }
 console.log('PASS active nonspatial state equivalent to '+activeRef+': '+scenario+' (480 frames)');
}
console.log('DAILY_LIFE_ACTIVE_EQUIVALENCE_OK 5 scenarios, 2400 frames');
