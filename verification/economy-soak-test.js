'use strict';
// Accelerated API-level stress replay, not a frame-rate or physical-device benchmark.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const prefix=fs.readFileSync('verification/smoke-test.js','utf8').split('const storage = new Map();')[0].replace('return {\n    elements,','return {\n    context,\n    elements,');
const setup=fs.readFileSync('verification/browser-clarity.py','utf8').match(/SETUP='''([\s\S]*?)'''/)[1];
const plain=x=>JSON.parse(JSON.stringify(x));
function load(storage=new Map()){const o={require,Buffer,console,TextEncoder,TextDecoder,URL,Blob};vm.runInNewContext(prefix+'\nglobalThis.make=createHarness;',o);const g=o.make(storage);g.eval=s=>vm.runInNewContext(s,g.context);g.storage=storage;return g;}
let g=load();g.eval(`(${setup})();estado.economiaCidada=novaEconomiaCidada();estado.jogoPausado=false;estado.salvamentoAtivo=true;sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);`);
const checkpoints=[];let reloads=0,births=0,deaths=0,lastCount=450;
for(let cycle=1;cycle<=180;cycle++){
  g.eval(`atualizarTransferenciaPosto(60);atualizarOrcamentoMunicipalColonia(60);atualizarMigracaoColonia(60);atualizarPrioridadesColonia(60);atualizarNecessidadesColonia(60);atualizarDefesaColonia(60);atualizarGuarnicaoColonia(60);atualizarExpedicaoMilicia(60);atualizarConstrucaoColonia(60);redistribuirTrabalhadoresColonia();atualizarCadastroCidada();observarContasCidada();`);
  const e=g.estado.economiaCidada,a=g.eval('auditoriaCidada()');
  assert.equal(a.diferenca,0,`Cycle ${cycle}: money discrepancy`);
  assert.equal(e.adultos.length,g.estado.populacaoColonia);
  assert.equal(Object.keys(e.jovens).length,g.estado.criancasColonia.length);
  assert.equal(Object.keys(e.pessoas).length,e.adultos.length+Object.keys(e.jovens).length);
  assert.ok(Object.values(e.pessoas).every(p=>Number.isSafeInteger(p.saldo)&&p.saldo>=0&&Number.isSafeInteger(p.atrasados)&&p.atrasados>=0));
  assert.ok(e.casas.every(h=>h.membros.length<=5));
  assert.ok(e.livro.length<=512);
  const count=Object.keys(e.pessoas).length;births+=Math.max(0,count-lastCount);deaths+=Math.max(0,lastCount-count);lastCount=count;
  if(cycle%30===0){
    g.eval('estado.jogoPausado=true;salvarProgresso()');const money=Object.fromEntries(Object.entries(e.pessoas).map(([id,p])=>[id,[p.nome,p.saldo,p.atrasados,p.impostos]])),before=a.saldo;
    const savedCycles=e.ciclo,savedTotals=plain(e.totais);g=load(new Map(g.storage));g.eval('atualizarCadastroCidada(true);observarContasCidada()');
    assert.deepEqual(Object.fromEntries(Object.entries(g.estado.economiaCidada.pessoas).map(([id,p])=>[id,[p.nome,p.saldo,p.atrasados,p.impostos]])),money);
    assert.equal(g.estado.economiaCidada.ciclo,savedCycles);assert.deepEqual(plain(g.estado.economiaCidada.totais),savedTotals);assert.equal(g.eval('auditoriaCidada().saldo'),before);
    g.eval('estado.jogoPausado=false');reloads++;
    checkpoints.push({cycle,population:g.estado.populacaoColonia,children:g.estado.criancasColonia.length,town:g.estado.tesouroColonia,health:g.estado.saudeColonia,moneyDifference:g.eval('auditoriaCidada().diferenca'),wallets:g.eval('auditoriaCidada().carteiras'),socialFood:g.estado.economiaCidada.ultimo.alimentoSocial,physicalShortage:g.estado.economiaCidada.ultimo.faltaFisica});
  }
  g.resetDrawCalls();
}
console.log('ECONOMY_SOAK_OK '+JSON.stringify({cycles:180,simulatedSeconds:10800,reloads,birthsNetIncrements:births,deathsNetDecrements:deaths,checkpoints,totals:g.estado.economiaCidada.totais,saveBytes:Buffer.byteLength([...g.storage.values()][0])}));
