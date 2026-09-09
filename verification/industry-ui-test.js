'use strict';
// Synthetic register and business-panel regressions; no real player saves.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {game,plain}=require('./layout-harness');
const html=fs.readFileSync(process.argv[2]||'index.html','utf8');
let groups=0;function test(name,f){f();groups++;console.log('PASS '+name);}
function ready(){const g=game(new Map(),html);g.mature();g.eval(`autorizarIndustria();for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];if(b.estado==='planejado'){observarContasCidada();estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;marcarContasCidada();}b.estado='ativo';b.obra=p.obra;b.meta=p.vagas;}estado.industriaColonia.expansao=false;`);return g;}
test('register search finds displayed contract occupation and destination',()=>{
 const g=ready();g.eval('alocarTrabalhoIndustria()');const a=g.eval('Object.values(estado.industriaColonia.agentes)[0]');
 for(const text of [g.eval(`planoIndustria('${a.empresa}').papel`),g.eval(`planoIndustria('${a.empresa}').nome`)]){
  g.eval(`document.querySelector('#buscar-cidadao').value=${JSON.stringify(text)};atualizarPainelEconomiaCidada(true)`);
  assert.match(g.eval("document.querySelector('#corpo-cidadaos').innerHTML"),new RegExp(a.id));
 }
});
test('register distinguishes trip, work, customer and free break for the same identity',()=>{
 const g=ready();g.eval('alocarTrabalhoIndustria()');const id=g.eval('Object.keys(estado.industriaColonia.agentes)[0]');
 for(const [funcao,fase,expected] of [['trabalho','indo','a caminho'],['trabalho','atividade','em atividade'],['passeio','livre','descanso'],['visita','indo','Cliente a caminho'],['visita','atividade','Cliente em atendimento']]){
  g.eval(`Object.assign(estado.industriaColonia.agentes['${id}'],{funcao:'${funcao}',fase:'${fase}'})`);
  assert.ok(g.eval(`nomeOcupacaoIndustria(estado.economiaCidada.pessoas['${id}'])`).includes(expected));
 }
});
test('new panel exposes real reserved salaries and in-transit cargo without mutating game state',()=>{
 const g=ready();g.estado.estoqueGraos=150;g.eval('alocarTrabalhoIndustria()');assert.equal(g.eval('agendarFreteIndustria("municipio","cervejaria","graos",24,.1)'),true);
 const before=plain(g.estado);g.eval('atualizarPainelIndustria(true);atualizarPainelEconomiaCidada(true)');
 const rows=g.eval('linhasNegociosIndustria(Object.values(estado.industriaColonia.agentes))');
 assert.equal(rows.length,10);assert.ok(rows.every(r=>r.celulas[1].includes('salários contratados a liquidar')));
 assert.match(rows.find(r=>r.id==='cervejaria').celulas[2],/24 grãos a receber/i);
 assert.ok(rows.every(r=>r.celulas[1].includes('não é lucro')));assert.deepEqual(plain(g.estado),before);
});
test('inactivity reasons identify water, resource, stock and authorization constraints',()=>{
 const g=ready();g.estado.cisternaConstruida=false;
 assert.match(g.eval('situacaoNegocioIndustria(planoIndustria("cervejaria"),estado.industriaColonia.negocios.cervejaria,[])'),/cisterna/);
 g.estado.industriaColonia.negocios.pedreira.rocha=0;
 assert.match(g.eval('situacaoNegocioIndustria(planoIndustria("pedreira"),estado.industriaColonia.negocios.pedreira,[])'),/esgotada/);
 assert.match(g.eval('situacaoNegocioIndustria(planoIndustria("taverna"),estado.industriaColonia.negocios.taverna,[])'),/cerveja entregue/);
 g.estado.industriaColonia.negocios.teatro.estado='planejado';g.estado.industriaColonia.expansao=false;
 assert.match(g.eval('situacaoNegocioIndustria(planoIndustria("teatro"),estado.industriaColonia.negocios.teatro,[])'),/pausadas/);
});
function node(){return {textContent:'',attrs:{},getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;}};}
function table(){const body={rows:[],insertRow(){const row={dataset:{},cells:[],insertCell(){const cell={textContent:'',querySelector(q){return this.nodes[q];},set innerHTML(v){this.nodes={button:node(),small:node()};}};this.cells.push(cell);return cell;},remove(){body.rows.splice(body.rows.indexOf(this),1);}};this.rows.push(row);return row;},insertBefore(row,next){const i=this.rows.indexOf(row);if(i>=0)this.rows.splice(i,1);const at=next?this.rows.indexOf(next):this.rows.length;this.rows.splice(at,0,row);}};return body;}
test('stable DOM update retains the same interactive button when money changes',()=>{
 const g=ready(),body=table();g.context.__table=body;
 g.eval('atualizarLinhasContabeis(__table,linhasNegociosIndustria([]),"data-empresa")');
 const first=body.rows[0],button=first.cells[0].querySelector('button');const old=first.cells[2].textContent;
 g.estado.industriaColonia.negocios.zeladoria.caixa+=1000000;
 g.eval('atualizarLinhasContabeis(__table,linhasNegociosIndustria([]),"data-empresa")');
 assert.equal(body.rows.length,10);assert.equal(body.rows[0],first);assert.equal(first.cells[0].querySelector('button'),button);assert.notEqual(first.cells[2].textContent,old);
 assert.equal(button.getAttribute('data-empresa'),'zeladoria');
});
test('imported display text remains inert in fallback and stable DOM paths',()=>{
 const g=ready();g.context.__lines=[{id:'cid-1',nome:'<img src=x onerror=alert(1)>',nota:'<script>bad()</script>',celulas:['A&B','<b>fake</b>','"quote"']}];
 g.eval('atualizarLinhasContabeis(document.querySelector("#corpo-cidadaos"),__lines,"data-cidadao")');
 const escaped=g.eval('document.querySelector("#corpo-cidadaos").innerHTML');assert.ok(!escaped.includes('<img'));assert.ok(escaped.includes('&lt;img'));
 const body=table();g.context.__table=body;g.eval('atualizarLinhasContabeis(__table,__lines,"data-cidadao")');assert.equal(body.rows[0].cells[0].querySelector('button').textContent,'<img src=x onerror=alert(1)>');
});
console.log('INDUSTRY_UI_OK '+groups+' groups');
