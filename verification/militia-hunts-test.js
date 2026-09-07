"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
// Reuse the existing game harness without running or altering its regression cases.
const api = ["iniciarExpedicaoMilicia", "atualizarExpedicaoMilicia", "resultadoExpedicaoMilicia", "normalizarCacaMilicia", "milicianosEmCacaColonia", "escoarCargaCacaMilicia", "processarAnimaisCacaMilicia", "posicaoMilicianoExpedicao", "pontoReuniaoMiliciano", "motivoBloqueioCacaMilicia", "salvarProgresso", "redefinirEstado", "versaoColonia", "segurancaCivilColonia", "folhaSoldosColonia", "areaPontoCacaMilicia", "areaCabanaCacadores", "capacidadeCouroColonia", "capacidadeArmazemInternoColonia", "abrirPainelCacaMilicia", "inspecionarEdificioNoPontoColonia"];
let setup = fs.readFileSync("verification/smoke-test.js", "utf8").split("const storage = new Map();")[0];
setup = setup.replace("return {\n    elements,", `return {\n    hunts: vm.runInNewContext("({ ${api.join(", ")} })", context),\n    elements,`);
const outer = { require, Buffer, console, TextEncoder, TextDecoder, URL, Blob };
vm.runInNewContext(`${setup}\nglobalThis.makeGame = createHarness;`, outer);
const plain = (x) => JSON.parse(JSON.stringify(x));
function game() {
  const storage = new Map();
  const g = outer.makeGame(storage);
  Object.assign(g.estado, { coloniaIniciada: true, mapaExpansaoComprado: true, mapaAtual: "expansao", revisaoColonia: g.hunts.versaoColonia, etapaConstrucaoColonia: 4, cabanaCacadoresConstruida: true, patioTreinoConstruido: true, quantidadeMilicianos: 10, ciclosSoldosAtrasados: 0, jogoPausado: false });
  g.storage = storage;
  return g;
}
let tests = 0;
function test(name, fn) { fn(); tests++; console.log(`PASS ${name}`); }

test("preconditions, inputs, and one active expedition", () => {
  const g = game(), h = g.hunts, s = g.estado;
  s.cabanaCacadoresConstruida = false;
  assert.equal(h.iniciarExpedicaoMilicia(5, 120), false);
  s.cabanaCacadoresConstruida = true; s.quantidadeMilicianos = 0;
  assert.equal(h.iniciarExpedicaoMilicia(1, 60), false);
  s.quantidadeMilicianos = 10;
  for (const [n, t] of [[0, 60], [11, 60], [2.5, 60], [NaN, 60], [1, 90], [1, Infinity]]) assert.equal(h.iniciarExpedicaoMilicia(n, t), false);
  s.ciclosSoldosAtrasados = 1;
  assert.equal(h.iniciarExpedicaoMilicia(5, 120), false);
  s.ciclosSoldosAtrasados = 0;
  assert.equal(h.iniciarExpedicaoMilicia(8, 120), true);
  const before = plain(s.cacaMilicia.expedicao);
  assert.equal(h.iniciarExpedicaoMilicia(1, 60), false);
  assert.deepEqual(plain(s.cacaMilicia.expedicao), before);
});

test("militia is reserved, security falls, payroll stays unchanged", () => {
  const g = game(), h = g.hunts;
  const payroll = h.folhaSoldosColonia(), security = h.segurancaCivilColonia();
  h.iniciarExpedicaoMilicia(8, 120);
  assert.equal(h.milicianosEmCacaColonia(), 8);
  assert.equal(h.folhaSoldosColonia(), payroll);
  assert.equal(h.segurancaCivilColonia(), security - 24);
  assert.equal(g.estado.quantidadeMilicianos, 10);
  h.atualizarExpedicaoMilicia(254);
  assert.equal(h.milicianosEmCacaColonia(), 0);
  assert.equal(h.segurancaCivilColonia(), security);
});

test("gather, depart off-map, hunt, return with cargo, unload, go home", () => {
  const g = game(), h = g.hunts, s = g.estado;
  h.iniciarExpedicaoMilicia(5, 120);
  const initial = h.posicaoMilicianoExpedicao(0);
  h.atualizarExpedicaoMilicia(22.5);
  assert.notDeepEqual(plain(h.posicaoMilicianoExpedicao(0)), plain(initial));
  h.atualizarExpedicaoMilicia(22.5);
  assert.equal(s.cacaMilicia.expedicao.fase, "saindo");
  h.atualizarExpedicaoMilicia(17.9);
  assert.ok(h.posicaoMilicianoExpedicao(0).y < 0);
  h.atualizarExpedicaoMilicia(0.1);
  assert.equal(s.cacaMilicia.expedicao.fase, "cacando");
  assert.equal(h.posicaoMilicianoExpedicao(0), null);
  assert.ok(h.posicaoMilicianoExpedicao(8));
  h.atualizarExpedicaoMilicia(120);
  assert.equal(s.cacaMilicia.expedicao.fase, "voltando");
  assert.equal(s.cacaMilicia.concluidas, 0);
  h.atualizarExpedicaoMilicia(18);
  assert.equal(s.cacaMilicia.expedicao.fase, "entregando");
  assert.deepEqual(plain(h.posicaoMilicianoExpedicao(0)), plain(h.pontoReuniaoMiliciano(0)));
  h.atualizarExpedicaoMilicia(8);
  assert.equal(s.cacaMilicia.concluidas, 1);
  assert.equal(s.cacaMilicia.ultima.quantidade, 5);
  assert.equal(s.cacaMilicia.ultima.segundos, 120);
  assert.equal(s.cacaMilicia.expedicao.fase, "retornando");
  h.atualizarExpedicaoMilicia(45);
  assert.equal(s.cacaMilicia.expedicao, null);
  const last = plain(s.cacaMilicia.ultima);
  h.atualizarExpedicaoMilicia(100000);
  assert.equal(s.cacaMilicia.concluidas, 1);
  assert.deepEqual(plain(s.cacaMilicia.ultima), last);
});

test("pause, invalid deltas, and speed multiplier", () => {
  const g = game();
  g.hunts.iniciarExpedicaoMilicia(4, 60);
  g.estado.jogoPausado = true;
  g.hunts.atualizarExpedicaoMilicia(999);
  assert.equal(g.estado.cacaMilicia.expedicao.tempo, 0);
  g.estado.jogoPausado = false;
  for (const delta of [-1, NaN, Infinity, 0]) g.hunts.atualizarExpedicaoMilicia(delta);
  assert.equal(g.estado.cacaMilicia.expedicao.tempo, 0);
  const one = game(), ten = game();
  one.hunts.iniciarExpedicaoMilicia(4, 60); ten.hunts.iniciarExpedicaoMilicia(4, 60);
  one.estado.velocidadeTempo = 1; ten.estado.velocidadeTempo = 10;
  for (let i = 1; i <= 10; i++) { one.step(i * 50); ten.step(i * 50); }
  assert.ok(Math.abs(ten.estado.cacaMilicia.expedicao.tempo / one.estado.cacaMilicia.expedicao.tempo - 10) < 1e-8);
});

test("seeded yields scale with effort and vary substantially", () => {
  const h = game().hunts, values = [];
  for (let i = 1; i <= 1000; i++) {
    const seed = i * 3581;
    const small = h.resultadoExpedicaoMilicia(300, seed), large = h.resultadoExpedicaoMilicia(1200, seed);
    assert.deepEqual(plain(small), plain(h.resultadoExpedicaoMilicia(300, seed)));
    for (const key of ["animais", "carne", "peles"]) assert.ok(large[key] >= small[key]);
    values.push(large.carne);
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  assert.ok(std / mean > 0.4);
  assert.ok(Math.max(...values) > Math.min(...values) * 8);
  assert.deepEqual(plain(h.resultadoExpedicaoMilicia(0, 1)), { animais: 0, carne: 0, peles: 0 });
  console.log(`YIELD_AUDIT ${JSON.stringify({ samples: values.length, minMeat: Math.min(...values), maxMeat: Math.max(...values), meanMeat: +mean.toFixed(2), coefficientOfVariation: +(std / mean).toFixed(3) })}`);
});

test("save/resume in all six stages does not reroll or duplicate rewards", () => {
  for (const time of [12, 50, 90, 190, 204, 220]) {
    const g = game(), h = g.hunts;
    h.iniciarExpedicaoMilicia(7, 120);
    h.atualizarExpedicaoMilicia(time);
    h.salvarProgresso();
    const checkpoint = plain(g.estado.cacaMilicia);
    const restored = outer.makeGame(g.storage);
    assert.deepEqual(plain(restored.estado.cacaMilicia), checkpoint);
    h.atualizarExpedicaoMilicia(1000);
    restored.hunts.atualizarExpedicaoMilicia(1000);
    assert.equal(restored.estado.cacaMilicia.concluidas, 1);
    assert.deepEqual(plain(restored.estado.cacaMilicia), plain(g.estado.cacaMilicia));
  }
});

test("large and split timesteps agree", () => {
  const a = game(), b = game();
  a.hunts.iniciarExpedicaoMilicia(10, 240); b.hunts.iniciarExpedicaoMilicia(10, 240);
  a.hunts.atualizarExpedicaoMilicia(374);
  for (let i = 0; i < 374; i++) b.hunts.atualizarExpedicaoMilicia(1);
  assert.deepEqual(plain(a.estado.cacaMilicia), plain(b.estado.cacaMilicia));
});

test("full stores preserve cargo; butchers and wagons are still required", () => {
  const g = game(), h = g.hunts, s = g.estado;
  s.estoqueLocalCarneSelvagem = 48;
  s.estoqueCouro = h.capacidadeArmazemInternoColonia(h.capacidadeCouroColonia);
  h.iniciarExpedicaoMilicia(10, 240);
  h.atualizarExpedicaoMilicia(374);
  assert.equal(s.estoqueLocalCarneSelvagem, 48);
  assert.equal(s.cacaMilicia.carga.carne, s.cacaMilicia.ultima.carne);
  assert.equal(s.cacaMilicia.carga.peles, s.cacaMilicia.ultima.peles);
  assert.equal(h.iniciarExpedicaoMilicia(5, 60), false);
  const cargo = s.cacaMilicia.carga.carne;
  s.estoqueLocalCarneSelvagem -= 12; h.escoarCargaCacaMilicia();
  assert.equal(s.cacaMilicia.carga.carne, cargo - 12);
  assert.equal(s.estoqueLocalCarneSelvagem, 48);
  s.cacaMilicia.carga.animais = 5;
  s.acougueConstruido = false;
  assert.equal(h.processarAnimaisCacaMilicia({ acougue: 4 }), 0);
  s.acougueConstruido = true;
  assert.equal(h.processarAnimaisCacaMilicia({ acougue: 0 }), 0);
  assert.equal(h.processarAnimaisCacaMilicia({ acougue: 4 }), 2);
  assert.equal(s.cacaMilicia.carga.animais, 3);
});

test("older/partial/malformed saves and reset", () => {
  const g = game(), h = g.hunts;
  assert.equal(h.normalizarCacaMilicia(null).expedicao, null);
  const bad = h.normalizarCacaMilicia({ carga: { animais: -4, carne: Infinity, peles: 9999 }, expedicao: { fase: "bogus", quantidade: 9000 } });
  assert.equal(bad.carga.animais, 0); assert.equal(bad.carga.carne, 0); assert.equal(bad.carga.peles, 160); assert.equal(bad.expedicao, null);
  const partial = h.normalizarCacaMilicia({ expedicao: { fase: "cacando", quantidade: 999, duracao: 999, tempo: -10, semente: NaN } });
  assert.equal(partial.expedicao.quantidade, 10); assert.equal(partial.expedicao.duracao, 120); assert.equal(partial.expedicao.tempo, 0);
  h.iniciarExpedicaoMilicia(4, 120); h.redefinirEstado();
  assert.equal(g.estado.cacaMilicia.expedicao, null);
  assert.equal(g.estado.cacaMilicia.concluidas, 0);
});

test("rally point is above lodge, inspectable, and has keyboard-accessible controls", () => {
  const g = game(), h = g.hunts;
  assert.ok(h.areaPontoCacaMilicia.y + h.areaPontoCacaMilicia.altura < h.areaCabanaCacadores.y);
  assert.equal(g.edificiosInspecionaveis().filter((e) => e.id === "expedicao-milicia").length, 1);
  h.abrirPainelCacaMilicia();
  assert.equal(g.elements.get("painel-caca-milicia").open, true);
  assert.equal(g.elements.get("equipe-caca-milicia").value, "10");
  assert.equal(g.elements.get("iniciar-caca-milicia").disabled, false);
});
console.log(`MILITIA_HUNTS_OK ${tests} test groups`);
