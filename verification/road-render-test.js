'use strict';
// The direct fallback must issue the same road commands, styles and geometry
// as the previously released renderer. Browser tests cover the cached path.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {game,plain}=require('./layout-harness');
const old=execFileSync('git',['show','c158b99822563e0f94c5f47ac00391e05de0b1c0:index.html'],{encoding:'utf8'});
const start=old.indexOf('      function desenharCaminhoTrechoEstradaColonia(');
const end=old.indexOf('      function desenharCaminhoParcialRedeHidricaColonia(',start);
const a=game(),b=game();a.mature();b.mature();b.eval(old.slice(start,end));
const spy=`globalThis.roadPaint=[];for(const fn of ['beginPath','moveTo','lineTo','stroke','fillRect','fillText'])contexto[fn]=(...args)=>roadPaint.push([fn,args,...['fillStyle','strokeStyle','lineWidth','lineCap','lineJoin','font','textAlign','textBaseline','globalAlpha'].map(k=>contexto[k])]);`;
a.eval(spy);b.eval(spy);let cases=0;
for(const level of [0,1,2,3])for(const progress of [-1,0,.35,.9]){
 const setup=`estado.niveisEstradasColonia.fill(${level});estado.obraAutomaticaColonia=${progress<0?'null':'"estradaSegmento"'};estado.trechoEstradaEmObra=0;estado.tempoObraAutomaticaColonia=${Math.max(0,progress)}*duracaoObraAutomaticaColonia;roadPaint=[];Object.assign(contexto,{fillStyle:'#000000',strokeStyle:'#000000',lineWidth:1,lineCap:'butt',lineJoin:'miter',font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',globalAlpha:1});`;
 for(const g of [a,b])g.eval(setup);
 const before=plain(a.estado);a.eval('desenharRedeViariaColonia()');b.eval('desenharRedeViariaColonia()');
 assert.deepEqual(plain(a.eval('roadPaint')),plain(b.eval('roadPaint')));
 assert.deepEqual(plain(a.estado),before);cases++;
}
console.log('ROAD_RENDER_OK '+JSON.stringify({cases,commandsStylesAndGeometryEqual:true,readOnly:true}));
