'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const prefix=fs.readFileSync('verification/smoke-test.js','utf8').split('const storage = new Map();')[0].replace('return {\n    elements,','return {\n    context,\n    elements,');
const tests=fs.readFileSync('verification/clarity-test.js','utf8');
const fixtureCode=tests.slice(tests.indexOf('function mature('),tests.indexOf('let groups ='));
function game(storage=new Map(), html=null) {const customRequire=(name)=>["fs","node:fs"].includes(name)&&html?{...fs,readFileSync:(path,...args)=>path==="index.html"?html:fs.readFileSync(path,...args)}:require(name);const o={require:customRequire,Buffer,console,TextEncoder,TextDecoder,URL,Blob};vm.runInNewContext(prefix+'\nglobalThis.create=createHarness;\n'+fixtureCode+'\nglobalThis.mature=mature;',o);const g=o.create(storage);g.eval=s=>vm.runInNewContext(s,g.context);g.storage=storage;g.mature=()=>{o.mature(g);g.eval('redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);prepararVidaCotidiana()');};return g;}
module.exports={game,plain:x=>JSON.parse(JSON.stringify(x))};
