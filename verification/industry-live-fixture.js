'use strict';
// Synthetic completed-business fixture for foreground browser observation only.
// Construction solvency is proved separately by industry-soak-test.js, not here.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { game } = require('./layout-harness');
const g = game();
g.mature();
g.eval(`autorizarIndustria();
  for (const p of planosIndustria) {
    const b = estado.industriaColonia.negocios[p.id];
    if (b.estado === 'planejado') {
      observarContasCidada(); estado.tesouroColonia -= p.capital;
      b.caixa = p.capital * 1000000; b.capital = b.caixa;
      estado.industriaColonia.totais.capital += b.capital; marcarContasCidada();
    }
    b.estado = 'ativo'; b.obra = p.obra; b.meta = p.vagas;
  }
  estado.industriaColonia.expansao = false;
  for (const id of estado.economiaCidada.adultos) {
    estado.tesouroColonia -= 5; estado.economiaCidada.pessoas[id].saldo += 5000000;
  }
  marcarContasCidada();
  Object.assign(estado.industriaColonia.negocios.cervejaria.estoque,
    {lupulo:24, graos:48, madeira:12, cerveja:64});
  estado.industriaColonia.negocios.floresta.estoque.madeira = 48;
  estado.industriaColonia.negocios.artes.estoque.artigos = 32;
  estado.industriaColonia.negocios.taverna.estoque.cerveja = 32;
  estado.industriaColonia.negocios['taverna-sul'].estoque.cerveja = 32;
`);
g.estado.velocidadeTempo = 10;
g.step(0); g.resetDrawCalls();
for (let i = 1; i <= 480; i++) { g.step(i * 50); g.resetDrawCalls(); }
assert.equal(g.eval('auditoriaCidada().diferenca'), 0);
g.estado.jogoPausado = true;
g.estado.velocidadeTempo = 1;
g.eval('salvarProgresso()');
fs.mkdirSync('verification-output', { recursive: true });
fs.writeFileSync('verification-output/industry-live-fixture.json', JSON.stringify(Object.fromEntries(g.storage)));
console.log('INDUSTRY_LIVE_FIXTURE_READY synthetic funded balances, seeded goods and completed buildings; not construction evidence');
