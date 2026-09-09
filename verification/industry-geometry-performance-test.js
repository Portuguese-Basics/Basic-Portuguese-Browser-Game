'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const {game,plain}=require('./layout-harness');
const proposed=fs.readFileSync('index.html','utf8');
const reference=require('node:child_process').execFileSync('git',['show','54bfe6d5daac17df40984df7243dc579568768cb:index.html'],{encoding:'utf8',maxBuffer:4000000});
function collisionSource(source){const start=source.indexOf('      function segmentoCruzaRetanguloPlanta('),end=source.indexOf('      function caminhosOrtogonalPlanta(',start);return source.slice(start,end);}
const original=proposed.replace(collisionSource(proposed),collisionSource(reference));
function harness(source){const context={rects:[],limiteCosta:17000,alturaMundoExpansao:9000};context.retangulosSolidosPlanta=()=>context.rects;const start=source.indexOf('      function segmentoCruzaRetanguloPlanta('),end=source.indexOf('      function caminhosOrtogonalPlanta(',start);vm.runInNewContext(source.slice(start,end)+'\nglobalThis.test=segmentoNavegavelPlanta;',context);return context;}
const a=harness(original),b=harness(proposed);let count=0;
function compare(start,end,rects,margin=12,ignore=null){a.rects=rects;b.rects=rects;assert.equal(b.test(start,end,ignore,margin),a.test(start,end,ignore,margin),JSON.stringify({start,end,rects,margin,ignore}));count++;}
const values=[99,100,100+1e-10,125,150-1e-10,150,151];
for(const dimensions of [[50,50],[0,50],[50,0]])for(const margin of [0,12,-100]){
 const rects=[{id:'r',x:100,y:100,largura:dimensions[0],altura:dimensions[1]}];
 for(const ax of values)for(const ay of values)for(const bx of values)for(const by of values)compare({x:ax,y:ay},{x:bx,y:by},rects,margin);
}
const boundaryCases=count;let seed=21080731;
const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let i=0;i<100000;i++){
 const rects=Array.from({length:i%5+1},(_,n)=>({id:'r'+n,x:rand()*16000,y:rand()*8500,largura:rand()*1500,altura:rand()*1000}));
 const margin=[0,12,0.05,-100][i%4],start={x:rand()*17010-5,y:rand()*9010-5},end={x:rand()*17010-5,y:rand()*9010-5};
 if(i%3===0)end.x=start.x;if(i%7===0)end.y=start.y;
 if(i%11===0)start.x=rects[0].x-margin;if(i%13===0)start.y=rects[0].y+rects[0].altura+margin;
 if(i%17===0)end.x=start.x+1e-10;if(i%19===0)end.y=start.y+1e-10;
 compare(start,end,rects,margin,i%23===0?'r0':null);
}
for(const n of [NaN,Infinity,-Infinity,-0,0,17000,17000.00001])compare({x:n,y:100},{x:200,y:200},[{id:'r',x:100,y:100,largura:50,altura:50}]);
const save=JSON.parse(fs.readFileSync(process.env.INDUSTRY_REFERENCE_SAVE||'verification-output/industry-soak-save.json','utf8'));
const first=game(new Map(Object.entries(save)),original),second=game(new Map(Object.entries(save)),proposed);
for(const g of [first,second]){g.step(0);g.resetDrawCalls();g.eval('globalThis.__slabs=0;segmentoCruzaRetanguloPlanta=((original)=>function(...args){__slabs++;return original.apply(this,args)})(segmentoCruzaRetanguloPlanta)');}
assert.deepEqual(plain(first.estado),plain(second.estado),'loaded full state');
const frames=Number(process.env.AABB_EQUIVALENCE_FRAMES||720);
for(let i=1;i<=frames;i++){
 for(const g of [first,second]){g.estado.velocidadeTempo=[1,2,5,10][Math.floor(i/90)%4];g.estado.jogoPausado=i%100<7;g.step(i*50);g.resetDrawCalls();}
 if(i%10===0)assert.deepEqual(plain(first.estado),plain(second.estado),'complete state frame '+i);
}
assert.deepEqual(plain(first.estado),plain(second.estado),'complete final state');
assert.equal(second.eval('auditoriaCidada().diferenca'),0);
const report={status:'PASS',boundaryCases,randomizedCases:100000,totalSegmentCases:count,fullStateFrames:frames,fullStateExcludedFields:[],untouchedSlabCalls:first.eval('__slabs'),proposedSlabCalls:second.eval('__slabs'),scope:'Pure strict broad-phase rejection; no caches; exhaustive finite boundary grid and seeded random geometry; non-timing deterministic complete-state replay'};
fs.mkdirSync('verification-output',{recursive:true});fs.writeFileSync('verification-output/industry-geometry-performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
