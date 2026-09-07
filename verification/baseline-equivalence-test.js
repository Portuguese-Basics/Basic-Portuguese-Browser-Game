'use strict';
// Compare the complete previous runtime, including initial save loading, not just its allocator.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const baselineRef = process.env.PREVIOUS_RUNTIME_REF || 'd6c8ff05368d4ee5f030268bb376133ecd3c1522';
const base = execFileSync('git', ['show', `${baselineRef}:index.html`], {encoding:'utf8'});
// The active economy intentionally changes transfers and reserves actual troop jobs.
// This comparison isolates legacy-mode behavior; economy-test.js covers active behavior.
const current = fs.readFileSync('index.html','utf8').replace('versao:1,ativa:true,opcionais:true', 'versao:1,ativa:false,opcionais:true');
const testSource = fs.readFileSync('verification/clarity-test.js','utf8');
const fixture = testSource.slice(testSource.indexOf('function mature('),testSource.indexOf('let groups ='));
const prefix = fs.readFileSync('verification/smoke-test.js','utf8').split('const storage = new Map();')[0]
 .replace('return {\n    elements,','return {\n    context,\n    elements,')
 .replace('crypto: { randomUUID: () => `id-${Math.random()}` },','crypto: { randomUUID: (()=>{let n=0;return ()=>`stable-${++n}`})() },');
class FixedDate extends Date {
 constructor(...args){super(...(args.length ? args : [1788780000000]));}
 static now(){return 1788780000000;}
}
function game(html,storage=new Map()){
 const outer={require:n=>n==='node:fs'?{...fs,readFileSync:(p,...args)=>p==='index.html'?html:fs.readFileSync(p,...args)}:require(n),Buffer,console,TextEncoder,TextDecoder,URL,Blob,Date:FixedDate};
 vm.runInNewContext(prefix+'\nglobalThis.makeGame=createHarness;\n'+fixture+'\nglobalThis.fixture=mature;',outer);
 const g=outer.makeGame(storage);g.eval=s=>vm.runInNewContext(s,g.context);g.storage=storage;g.fixture=()=>outer.fixture(g);return g;
}
// Only new feature fields are excluded; all pre-existing economy/save fields still compare exactly.
const plain=x=>{const value=JSON.parse(JSON.stringify(x));for(const key of ['trechosAdarveInterno','trechosAdarveExterno','ampliacaoMuralhasAutorizada','defesaPosicional','economiaCidada','vidaCotidiana'])delete value[key];return value;};
for(const scenario of ['mature','shortage','hunt']){
 const seed=game(base);seed.fixture();
 if(scenario==='shortage')Object.assign(seed.estado,{estoqueAlimentos:0,estoqueMedicamentos:0,saudeColonia:42,estoqueFerramentas:5,tesouroColonia:1200});
 if(scenario==='hunt')seed.eval('iniciarExpedicaoMilicia(5,60);atualizarExpedicaoMilicia(80)');
 seed.eval('salvarProgresso()');
 const a=game(base,new Map(seed.storage)),b=game(current,new Map(seed.storage));
 assert.deepEqual(plain(b.estado),plain(a.estado),scenario+' immediately after load');
 for(let frame=1;frame<=200;frame++){
  for(const g of [a,b]){g.estado.velocidadeTempo=[1,2,5,10][Math.floor(frame/50)%4];g.estado.jogoPausado=frame%80<5;g.step(frame*50);g.resetDrawCalls();}
  if(frame%10===0)assert.deepEqual(plain(b.estado),plain(a.estado),scenario+' frame '+frame);
 }
 console.log('PASS legacy-mode previous-runtime equivalence: '+scenario+' load and 200 frames');
}
console.log('BASELINE_EQUIVALENCE_OK 3 scenarios, initial load and 600 frames');
