'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');const {game,plain}=require('./layout-harness');
const current=fs.readFileSync('index.html','utf8');
const baseline=process.env.INDUSTRY_REFERENCE_HTML?fs.readFileSync(process.env.INDUSTRY_REFERENCE_HTML,'utf8'):current.replace('</script>',fs.readFileSync('verification/industry-scheduler-reference.js','utf8')+'\n</script>');
const save=JSON.parse(fs.readFileSync(process.env.INDUSTRY_REFERENCE_SAVE||'verification-output/industry-soak-save.json','utf8'));
const a=game(new Map(Object.entries(save)),baseline),b=game(new Map(Object.entries(save)));a.step(0);b.step(0);a.resetDrawCalls();b.resetDrawCalls();
assert.deepEqual(plain(b.estado),plain(a.estado),'initial full state');
for(let i=1;i<=Number(process.env.INDUSTRY_EQUIVALENCE_FRAMES||720);i++){
 for(const g of [a,b]){g.estado.velocidadeTempo=[1,2,5,10][Math.floor(i/90)%4];g.estado.jogoPausado=i%100<7;g.step(i*50);g.resetDrawCalls();}
 if(i%10===0){assert.deepEqual(plain(b.estado),plain(a.estado),'all money, routes, stocks, assignments and clocks at '+i);assert.equal(b.eval('auditoriaCidada().diferenca'),0);}
}
console.log('INDUSTRY_PERFORMANCE_EQUIVALENCE_OK '+(process.env.INDUSTRY_EQUIVALENCE_FRAMES||720)+' frames; full state; no excluded fields');
