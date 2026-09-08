'use strict';
// Rendering-only batching: every wall-post center/radius and final paint style
// must match the previous renderer, including overlapping short-segment fallback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const {game, plain} = require('./layout-harness');
const previous = execFileSync('git', ['show', 'c158b99822563e0f94c5f47ac00391e05de0b1c0:index.html'], {encoding:'utf8'});
const start = previous.indexOf('      function desenharLinhaPalicada(');
const end = previous.indexOf('\n      function ', start+20);
const oldFunction = previous.slice(start,end).trim();
const a = game(), b = game();
b.eval('desenharLinhaPalicada = ('+oldFunction+')');
const initialize = `globalThis.paint={arcs:[],fills:0,strokes:0};
 contexto.arc=(...args)=>paint.arcs.push(args);contexto.fill=()=>paint.fills++;
 contexto.stroke=()=>paint.strokes++;`;
a.eval(initialize); b.eval(initialize);
let cases = 0;
for(const coords of [[10,10,2010,10],[10,10,10,2510],[500,10,200,10],[10,10,15,10],[10,10,10,10],[100,100,470,230]]) {
 for(const progress of [-1,0,.01,.25,.5,.999,1,2]) {
  const call=`desenharLinhaPalicada(${coords.join(',')},${progress},"#747a76")`;
  for(const g of [a,b])g.eval('paint={arcs:[],fills:0,strokes:0};contexto.fillStyle="#000000";contexto.strokeStyle="#000000";contexto.lineWidth=1;');
  const before=plain(a.estado);a.eval(call);b.eval(call);
  assert.deepEqual(plain(a.eval('paint.arcs')),plain(b.eval('paint.arcs')),'all posts unchanged');
  assert.deepEqual(plain(a.eval('[contexto.fillStyle,contexto.strokeStyle,contexto.lineWidth]')),plain(b.eval('[contexto.fillStyle,contexto.strokeStyle,contexto.lineWidth]')));
  assert.deepEqual(plain(a.estado),before,'painting is read-only');
  assert.ok(a.eval('paint.fills')<=b.eval('paint.fills'));
  assert.ok(a.eval('paint.strokes')<=b.eval('paint.strokes'));
  cases++;
 }
}
a.eval('paint={arcs:[],fills:0,strokes:0};desenharLinhaPalicada(0,0,10000,0,1,"#747a76")');
assert.equal(a.eval('paint.arcs.length'),173);assert.equal(a.eval('paint.fills'),1);assert.equal(a.eval('paint.strokes'),2);
console.log('MAP_RENDER_OK '+JSON.stringify({cases,postsPreserved:true,longSegment:{posts:173,fills:1,strokes:2},readOnly:true}));
