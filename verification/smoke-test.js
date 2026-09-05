const fs = require("fs");
const vm = require("vm");

const html = fs.readFileSync("index.html", "utf8");
const start = html.indexOf("<script>") + 8;
const end = html.lastIndexOf("</script>");
const source = html.slice(start, end);
const auditedResources = [
  "Provisões — celeiro central 200; venda 1; alimentação imediata.",
  "Grãos — silo 150; venda 1; insumo do moinho.",
  "Frutas e verduras — armazém 100; venda 2; valem 2 alimentos.",
  "Feijão — armazém 100; venda 3; vale 3 alimentos.",
  "Farinha — depósito 120; venda 2; insumo da padaria.",
  "Pães — despensa 100; venda 5; valem 4 alimentos.",
  "Peixes — mercado costeiro 160; venda 3; valem 2 alimentos.",
  "Carne selvagem — cabana dos caçadores 80; venda 2; insumo do açougue.",
  "Carne de criação — açougue 120; venda 2; vem da pastagem.",
  "Cortes de carne — cofre interno 80; venda 6; insumo da cozinha.",
  "Refeições de carne — despensa interna 100; venda 10; valem 4 alimentos.",
  "Refeições de hortaliças — adega fria interna 90; venda 7; valem 3 alimentos.",
  "Refeições de feijão — adega fria interna 90; venda 9; valem 4 alimentos.",
  "Carne defumada — despensa seca interna 120; venda 12; vale 5 alimentos; reserva final.",
  "Peixe seco — despensa seca interna 120; venda 8; vale 4 alimentos; reserva final.",
  "Árvores — reserva florestal 200; não são vendidas em pé; renovam a madeira.",
  "Madeira — depósito 180; venda 1; produz lanças, arcos, flechas e navios.",
  "Ervas — ervário interno 100; venda 3; produzem medicamentos.",
  "Medicamentos — farmácia interna 80; venda 8; recuperam 2 de saúde cada.",
  "Minério — depósito 100; venda 2; produz ferramentas e armas.",
  "Pedra — depósito 120; venda 2; reserva para construções e muralhas de pedra.",
  "Ferramentas de metal — cofre interno 60; venda 8; equipam uma vaga cada com 130% de produtividade.",
  "Ferramentas de madeira — oficina interna 40; equipam uma vaga cada com 100% de produtividade.",
  "Ferramentas de pedra — oficina interna 40; equipam uma vaga cada com 115% de produtividade.",
  "Armas de metal — arsenal interno 40; venda 12; reserva de defesa.",
  "Lanças — arsenal interno 60; venda 8; armamento da milícia.",
  "Arcos — arsenal interno 40; venda 12; armamento de arqueiros.",
  "Flechas — depósito interno 600; venda 1; 20 formam uma aljava.",
  "Mercadorias — armazém do cais 50, ou 100 com feitoria; venda 5; receita comercial.",
  "Peles curtidas — cofre interno 100; venda 4; insumo de armaduras de couro e reforçadas.",
  "Armaduras — arsenal interno 20 por qualidade; vendas 10/18/28/45; equipam milícia, guarda e soldados.",
];
if (!auditedResources.every((item) => html.includes(item))) {
  throw new Error("O catálogo não cobre valor, armazenamento e finalidade de todos os recursos.");
}

function createHarness(storage) {
  const listeners = new Map();
  const elements = new Map();
  const fillRects = [];
  const strokeRects = [];
  const fillTexts = [];
  const arcs = [];
  const lineSegments = [];
  let currentPoint = null;
  let frameCallback = null;
  let randomValue = 0.99;
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => randomValue;
  const canvasContext = {
    beginPath() {},
    arc(...args) {
      arcs.push(args);
    },
    fill() {},
    stroke() {},
    strokeRect(...args) {
      strokeRects.push(args);
    },
    fillRect(...args) {
      fillRects.push(args);
    },
    fillText(...args) {
      fillTexts.push(args);
    },
    moveTo(x, y) {
      currentPoint = [x, y];
    },
    lineTo(x, y) {
      if (currentPoint) {
        lineSegments.push([
          currentPoint[0],
          currentPoint[1],
          x,
          y,
          canvasContext.strokeStyle,
          canvasContext.lineWidth,
        ]);
      }
      currentPoint = [x, y];
    },
    closePath() {},
    bezierCurveTo() {},
    setLineDash() {},
    clearRect() {},
    setTransform() {},
    save() {},
    restore() {},
    translate() {},
  };

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        textContent: "",
        value: "",
        files: [],
        hidden: false,
        disabled: false,
        width: 0,
        height: 0,
        open: false,
        addEventListener(type, handler) {
          listeners.set(`${id}:${type}`, handler);
        },
        attributes: {},
        setAttribute(name, value) {
          this.attributes[name] = String(value);
        },
        removeAttribute(name) {
          if (name === "open") this.open = false;
        },
        showModal() {
          this.open = true;
        },
        close() {
          this.open = false;
        },
        focus() {},
        select() {},
        click() {},
        remove() {},
        setPointerCapture() {},
        getBoundingClientRect() {
          return { width: 1000, height: 700, left: 0, top: 0 };
        },
        getContext() {
          return canvasContext;
        },
      });
    }
    return elements.get(id);
  }

  const context = {
    console,
    Date,
    JSON,
    Math: deterministicMath,
    Number,
    String,
    Array,
    TextEncoder,
    TextDecoder,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    performance: { now: () => 0 },
    crypto: { randomUUID: () => `id-${Math.random()}` },
    requestAnimationFrame(callback) {
      frameCallback = callback;
    },
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    window: {
      devicePixelRatio: 1,
      confirm: () => true,
      addEventListener() {},
    },
    document: {
      visibilityState: "visible",
      body: element("body"),
      querySelector: (selector) => element(selector.slice(1)),
      addEventListener() {},
    },
  };

  vm.runInNewContext(
    `${source}\nglobalThis.__testeJogo = { estado, atualizarInterface, atualizarFazendeiro, atualizarFruticultor, atualizarPescador, atualizarComerciante, atualizarFerreiro, atualizarMineiro, atualizarBanqueiro, atualizarEscriturario, atualizarTransferenciaPosto, atualizarOrcamentoMunicipalColonia, atualizarPrioridadesColonia, atualizarNecessidadesColonia, atualizarDefesaColonia, atualizarConstrucaoColonia, atualizarMigracaoColonia, atualizarEnvelhecimentoEObitosColonia, redistribuirTrabalhadoresColonia, migracaoNecessariaColonia, migracaoIncentivadaPermitidaColonia, motivoBloqueioIncentivoMigracaoColonia, folhaCivilColonia, limiteFolhaCivilColonia, manutencaoMunicipalColonia, despesasEssenciaisMunicipaisColonia, saldoOperacionalMunicipalColonia, reservaMunicipalDinamicaColonia, folhaSoldosColonia, limiteSoldosColonia, segurancaCivilColonia, forcaMilitarColonia, posicaoColonoNovaColonia, posicaoCasaColonia, quantidadeColonosExpansao, totalMoradoresColonia, quantidadeBebesColonia, quantidadeCriancasColonia, chanceNascimentoColonia, idadeMediaAdultosColonia, duracaoBebeColonia, duracaoInfanciaColonia, barcoComercialAtracado, proximaObraAutomaticaColonia, prioridadeAtualColonia, custoObraAutomaticaColonia, alvoConstrutoresObraColonia, casasNecessariasColonia, reservaPlanejadaMoradiaColonia, maximoCasasDisponiveisColonia, capacidadeMoradiasColonia, vagasMigracaoColonia, vagasFisicasMigracaoColonia, necessidadeAlimentosColonia, producaoAlimentarPorCiclo, valorAlimentarTotalColonia, consumirAlimentosColonia, pressaoSaudePrevistaColonia, reservaMedicamentosAlvoColonia, alvoProfissionaisClinicaColonia, alvoColetoresSaudeColonia, capacidadesEmpregoColonia, totalCapacidadeEmpregosColonia, totalEmpregosOcupadosColonia, tipoArmaduraPrioritariaColonia, tipoArmaduraProduzivelColonia, escolherArmaduraDefesaColonia, totalArmadurasEstoqueColonia, proximoTrechoEstradaColonia, quantidadeTrechosEstradaNoNivelColonia, multiplicadorProducaoEstradasColonia, multiplicadorMovimentoEstradasColonia, multiplicadorConstrucaoEstradasColonia, multiplicadorConstrucaoColonia, catalogoArmazenamentoAlimentosColonia, capacidadeArmazemInternoColonia, sincronizarFerramentasLocaisColonia, multiplicadorFerramentasLocalColonia, trabalhadoresComFerramentasColonia, bonusFerramentasColonia, bonusLogisticaColonia, capacidadeCargaTransportadoresColonia, cargaLocalPendenteColonia, transportarCargasColonia, bonusEducacaoColonia, nivelFerramentasAtivoColonia, protecaoIncendioColonia, satisfacaoFeColonia, festivalAtivoColonia, materiaisObraColonia, trechosEstradaColonia, caminhosTrechoEstradaColonia, arestasRedeViariaColonia, rotaMaisRapidaColonia, destinoEmpregoColonia, acessoCasaColonia, areasMoradia: { recintoExterno, recintoInterno, areaMoradias, areaSegundoBlocoMoradias, areaTerceiroBlocoMoradias }, areasHotfixCozinhas: { recintoExterno, recintoInterno, areaCozinhaCarneColonia, areaCozinhaHortalicasColonia, areaCozinhaFeijaoColonia, areaCofreCortesColonia, areaDespensaRefeicoesColonia, areaAdegaFriaColonia, areaDefumadorioColonia, areaCemiterioColonia, areaPatioTreinoColonia }, defesasAuditadas: { recintoExterno, recintoInterno, portoesMuralhaColonia, cantosTorresMuralhaColonia, areasPostosGuardaColonia, totalTorresMuralhaColonia, totalPortoesFortificadosColonia, meiaAberturaPortaoColonia }, infraestruturaHidricaAuditada: { recintoExterno, recintoInterno, areaCisternaColonia, posicoesPocosPublicosColonia, raioPocoPublicoColonia, redeHidricaBasicaColonia, redeHidricaAvancadaColonia, portoesMuralhaColonia, areasPostosGuardaColonia, areasEdificadas: [areaAdministracao, areaCeleiro, areaAcougueColonia, areaCofreCortesColonia, areaCozinhaCarneColonia, areaDespensaRefeicoesColonia, areaDepositoMadeira, areaErvario, areaOficinaArmasMadeira, areaArsenalMadeira, areaFlecharia, areaDepositoFlechas, areaClinicaColonia, areaFarmaciaColonia, areaBancoColonia, areaEscolaColonia, areaArmazemGraos, areaArmazemHortalicas, areaArmazemFeijao, areaMoinhoColonia, areaArmazemFarinha, areaPadariaColonia, areaArmazemPaes, areaMinaColonia, areaDepositoMinerio, areaPedreiraColonia, areaDepositoPedra, areaCaisPescaColonia, areaSegundoCaisPescaColonia, areaMercadoPeixesColonia, areaCaisComercialColonia, areaArmazemComercial, areaFeitoriaColonia, areaEstaleiroColonia, areaFerrariaColonia, areaArmazemFerramentas, areaForjaColonia, areaArsenalColonia, areaPatioTreinoColonia, areaQuartelMilitarColonia, areaCozinhaHortalicasColonia, areaCozinhaFeijaoColonia, areaBibliotecaColonia, areaIgrejaColonia, areaDefumadorioColonia, areaAdegaFriaColonia, areaTransportadoresColonia, areaConstrutoresColonia, areaOficinaFerramentasColonia, areaBombeirosColonia, areaMercadoPublicoColonia, areaArmeiroColonia, areaCemiterioColonia, ...areasCabanasLenhadores, areaCabanaReflorestamento, ...areasCabanasColeta, areaCabanaCacadores, ...areasPostosGuardaColonia, ...casasAgricultores.map(({ x, y }) => ({ x, y, largura: 150, altura: 105 })), { x: 9600, y: 3400, largura: 180, altura: 125 }, { x: 9600, y: 5250, largura: 180, altura: 125 }] }, definirTempoRio(valor) { tempoRio = valor; } };`,
    context,
  );
  vm.runInNewContext(
    "globalThis.__testeJogo.empregoDoColono = empregoDoColono;",
    context,
  );
  vm.runInNewContext(
    "Object.assign(globalThis.__testeJogo, { alvoTransportadoresProducaoColonia, cargaLocalEntregavelColonia, valorReservaDuravelColonia, reservaDuravelAlvoColonia, alvoPedreiraObraPrioritariaColonia, multiplicadorReservaAlimentarColonia, metaProducaoAlimentarColonia, totalEmpregosAlimentaresColonia, totalVagasAlimentaresColonia, diagnosticoPrioridadeAlimentarColonia });",
    context,
  );
  return {
    elements,
    listeners,
    fillRects,
    strokeRects,
    fillTexts,
    arcs,
    lineSegments,
    areasMoradia: context.__testeJogo.areasMoradia,
    areasHotfixCozinhas: context.__testeJogo.areasHotfixCozinhas,
    defesasAuditadas: context.__testeJogo.defesasAuditadas,
    infraestruturaHidricaAuditada:
      context.__testeJogo.infraestruturaHidricaAuditada,
    estado: context.__testeJogo.estado,
    quantidadeColonosExpansao: context.__testeJogo.quantidadeColonosExpansao,
    resetDrawCalls() {
      fillRects.length = 0;
      strokeRects.length = 0;
      fillTexts.length = 0;
      arcs.length = 0;
      lineSegments.length = 0;
      currentPoint = null;
    },
    step(timestamp) {
      const callback = frameCallback;
      if (!callback) throw new Error("Quadro de animação ausente.");
      callback(timestamp);
    },
    atualizarInterface() {
      context.__testeJogo.atualizarInterface();
    },
    produzirDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarFazendeiro(segundos);
    },
    produzirPomarDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarFruticultor(segundos);
    },
    produzirPescaDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarPescador(segundos);
    },
    produzirComercioDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarComerciante(segundos);
    },
    produzirFerrariaDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarFerreiro(segundos);
    },
    produzirMineracaoDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarMineiro(segundos);
    },
    produzirJurosDuranteCaca(segundos) {
      context.__testeJogo.estado.local = "floresta";
      context.__testeJogo.atualizarBanqueiro(segundos);
    },
    coletarParaExpansao(segundos) {
      context.__testeJogo.atualizarEscriturario(segundos);
    },
    construirColoniaPor(segundos) {
      context.__testeJogo.atualizarConstrucaoColonia(segundos);
    },
    receberParcelaPosto(segundos) {
      context.__testeJogo.atualizarTransferenciaPosto(segundos);
    },
    atualizarPrioridades(segundos) {
      context.__testeJogo.atualizarPrioridadesColonia(segundos);
    },
    atualizarNecessidades(segundos) {
      context.__testeJogo.atualizarNecessidadesColonia(segundos);
    },
    atualizarDefesa(segundos) {
      context.__testeJogo.atualizarDefesaColonia(segundos);
    },
    atualizarObitos() {
      return context.__testeJogo.atualizarEnvelhecimentoEObitosColonia();
    },
    definirAleatorio(valor) {
      randomValue = valor;
    },
    idadeMedia() {
      return context.__testeJogo.idadeMediaAdultosColonia();
    },
    tipoArmaduraPrioritaria() {
      return context.__testeJogo.tipoArmaduraPrioritariaColonia();
    },
    tipoArmaduraProduzivel() {
      return context.__testeJogo.tipoArmaduraProduzivelColonia();
    },
    escolherArmadura(categoria) {
      return context.__testeJogo.escolherArmaduraDefesaColonia(categoria);
    },
    totalArmadurasEstoque() {
      return context.__testeJogo.totalArmadurasEstoqueColonia();
    },
    atualizarOrcamento(segundos) {
      context.__testeJogo.atualizarOrcamentoMunicipalColonia(segundos);
    },
    folhaCivil(empregos) {
      return context.__testeJogo.folhaCivilColonia(empregos);
    },
    limiteFolhaCivil() {
      return context.__testeJogo.limiteFolhaCivilColonia();
    },
    manutencaoMunicipal() {
      return context.__testeJogo.manutencaoMunicipalColonia();
    },
    despesasEssenciais() {
      return context.__testeJogo.despesasEssenciaisMunicipaisColonia();
    },
    saldoOperacional(empregos) {
      return context.__testeJogo.saldoOperacionalMunicipalColonia(empregos);
    },
    reservaMunicipal() {
      return context.__testeJogo.reservaMunicipalDinamicaColonia();
    },
    folhaSoldos() {
      return context.__testeJogo.folhaSoldosColonia();
    },
    limiteSoldos() {
      return context.__testeJogo.limiteSoldosColonia();
    },
    segurancaCivil() {
      return context.__testeJogo.segurancaCivilColonia();
    },
    forcaMilitar() {
      return context.__testeJogo.forcaMilitarColonia();
    },
    atualizarMigracao(segundos) {
      context.__testeJogo.atualizarMigracaoColonia(segundos);
    },
    redistribuirTrabalhadores() {
      return context.__testeJogo.redistribuirTrabalhadoresColonia();
    },
    empregoDoColono(indice) {
      return context.__testeJogo.empregoDoColono(indice);
    },
    migracaoNecessaria() {
      return context.__testeJogo.migracaoNecessariaColonia();
    },
    proximaObra() {
      return context.__testeJogo.proximaObraAutomaticaColonia();
    },
    prioridadeAtual() {
      return context.__testeJogo.prioridadeAtualColonia();
    },
    pressaoSaude() {
      return context.__testeJogo.pressaoSaudePrevistaColonia();
    },
    reservaMedicamentos() {
      return context.__testeJogo.reservaMedicamentosAlvoColonia();
    },
    alvoClinica() {
      return context.__testeJogo.alvoProfissionaisClinicaColonia();
    },
    alvoColetores() {
      return context.__testeJogo.alvoColetoresSaudeColonia();
    },
    custoObra(tipo) {
      return context.__testeJogo.custoObraAutomaticaColonia(tipo);
    },
    alvoConstrutores(tipo) {
      return context.__testeJogo.alvoConstrutoresObraColonia(tipo);
    },
    casasNecessarias() {
      return context.__testeJogo.casasNecessariasColonia();
    },
    reservaMoradia() {
      return context.__testeJogo.reservaPlanejadaMoradiaColonia();
    },
    maximoCasasDisponiveis() {
      return context.__testeJogo.maximoCasasDisponiveisColonia();
    },
    capacidadeMoradias() {
      return context.__testeJogo.capacidadeMoradiasColonia();
    },
    arestasRedeViaria() {
      return context.__testeJogo.arestasRedeViariaColonia();
    },
    vagasMigracao() {
      return context.__testeJogo.vagasMigracaoColonia();
    },
    vagasFisicasMigracao() {
      return context.__testeJogo.vagasFisicasMigracaoColonia();
    },
    migracaoIncentivadaPermitida() {
      return context.__testeJogo.migracaoIncentivadaPermitidaColonia();
    },
    motivoBloqueioIncentivoMigracao() {
      return context.__testeJogo.motivoBloqueioIncentivoMigracaoColonia();
    },
    necessidadeAlimentos() {
      return context.__testeJogo.necessidadeAlimentosColonia();
    },
    metaProducaoAlimentar() {
      return context.__testeJogo.metaProducaoAlimentarColonia();
    },
    multiplicadorReservaAlimentar() {
      return context.__testeJogo.multiplicadorReservaAlimentarColonia();
    },
    diagnosticoPrioridadeAlimentar(empregos) {
      return context.__testeJogo.diagnosticoPrioridadeAlimentarColonia(
        empregos,
      );
    },
    producaoAlimentar(empregos) {
      return context.__testeJogo.producaoAlimentarPorCiclo(empregos);
    },
    valorAlimentarTotal() {
      return context.__testeJogo.valorAlimentarTotalColonia();
    },
    consumirAlimentos(quantidade) {
      return context.__testeJogo.consumirAlimentosColonia(quantidade);
    },
    catalogoArmazenamento() {
      return context.__testeJogo.catalogoArmazenamentoAlimentosColonia();
    },
    capacidadeArmazemInterno(base) {
      return context.__testeJogo.capacidadeArmazemInternoColonia(base);
    },
    trabalhadoresComFerramentas(empregos) {
      return context.__testeJogo.trabalhadoresComFerramentasColonia(empregos);
    },
    sincronizarFerramentas(empregos) {
      return context.__testeJogo.sincronizarFerramentasLocaisColonia(empregos);
    },
    multiplicadorFerramentasLocal(chave, empregos) {
      return context.__testeJogo.multiplicadorFerramentasLocalColonia(
        chave,
        empregos,
      );
    },
    bonusFerramentas(empregos) {
      return context.__testeJogo.bonusFerramentasColonia(empregos);
    },
    bonusLogistica(empregos) {
      return context.__testeJogo.bonusLogisticaColonia(empregos);
    },
    capacidadeCargaTransportadores(empregos) {
      return context.__testeJogo.capacidadeCargaTransportadoresColonia(
        empregos,
      );
    },
    cargaLocalPendente() {
      return context.__testeJogo.cargaLocalPendenteColonia();
    },
    cargaLocalEntregavel() {
      return context.__testeJogo.cargaLocalEntregavelColonia();
    },
    alvoTransportadores(empregos) {
      return context.__testeJogo.alvoTransportadoresProducaoColonia(
        empregos,
      );
    },
    transportarCargas(empregos) {
      return context.__testeJogo.transportarCargasColonia(empregos);
    },
    valorReservaDuravel() {
      return context.__testeJogo.valorReservaDuravelColonia();
    },
    reservaDuravelAlvo() {
      return context.__testeJogo.reservaDuravelAlvoColonia();
    },
    alvoPedreiraPrioritaria(empregos) {
      return context.__testeJogo.alvoPedreiraObraPrioritariaColonia(empregos);
    },
    bonusEducacao(empregos) {
      return context.__testeJogo.bonusEducacaoColonia(empregos);
    },
    nivelFerramentasAtivo() {
      return context.__testeJogo.nivelFerramentasAtivoColonia();
    },
    multiplicadorConstrucao(empregos) {
      return context.__testeJogo.multiplicadorConstrucaoColonia(empregos);
    },
    protecaoIncendio(empregos) {
      return context.__testeJogo.protecaoIncendioColonia(empregos);
    },
    satisfacaoFe(empregos) {
      return context.__testeJogo.satisfacaoFeColonia(empregos);
    },
    festivalAtivo() {
      return context.__testeJogo.festivalAtivoColonia();
    },
    materiaisObra(tipo) {
      return context.__testeJogo.materiaisObraColonia(tipo);
    },
    capacidadesEmprego() {
      return context.__testeJogo.capacidadesEmpregoColonia();
    },
    totalCapacidadeEmpregos() {
      return context.__testeJogo.totalCapacidadeEmpregosColonia();
    },
    totalEmpregosOcupados(empregos) {
      return context.__testeJogo.totalEmpregosOcupadosColonia(empregos);
    },
    proximoTrechoEstrada(nivelMaximo, limiteTrechosTerra) {
      return context.__testeJogo.proximoTrechoEstradaColonia(
        nivelMaximo,
        limiteTrechosTerra,
      );
    },
    quantidadeTrechosEstrada(nivelMinimo) {
      return context.__testeJogo.quantidadeTrechosEstradaNoNivelColonia(
        nivelMinimo,
      );
    },
    multiplicadorProducaoEstradas() {
      return context.__testeJogo.multiplicadorProducaoEstradasColonia();
    },
    multiplicadorMovimentoEstradas() {
      return context.__testeJogo.multiplicadorMovimentoEstradasColonia();
    },
    multiplicadorConstrucaoEstradas() {
      return context.__testeJogo.multiplicadorConstrucaoEstradasColonia();
    },
    trechosEstradaColonia: context.__testeJogo.trechosEstradaColonia,
    caminhosTrechoEstrada(trecho) {
      return context.__testeJogo.caminhosTrechoEstradaColonia(trecho);
    },
    rotaMaisRapida(origem, destino) {
      return context.__testeJogo.rotaMaisRapidaColonia(origem, destino);
    },
    destinoEmprego(tipo, vaga = 0) {
      return context.__testeJogo.destinoEmpregoColonia(tipo, vaga);
    },
    acessoCasa(indiceMorador) {
      return context.__testeJogo.acessoCasaColonia(indiceMorador);
    },
    posicaoCasa(indiceCasa) {
      return context.__testeJogo.posicaoCasaColonia(indiceCasa);
    },
    totalMoradores() {
      return context.__testeJogo.totalMoradoresColonia();
    },
    quantidadeBebes() {
      return context.__testeJogo.quantidadeBebesColonia();
    },
    quantidadeCriancas() {
      return context.__testeJogo.quantidadeCriancasColonia();
    },
    chanceNascimento() {
      return context.__testeJogo.chanceNascimentoColonia();
    },
    duracaoBebeColonia: context.__testeJogo.duracaoBebeColonia,
    duracaoInfanciaColonia: context.__testeJogo.duracaoInfanciaColonia,
    posicaoColono(indice) {
      return context.__testeJogo.posicaoColonoNovaColonia(indice);
    },
    barcoComercialAtracadoNoTempo(segundos) {
      context.__testeJogo.definirTempoRio(segundos);
      return context.__testeJogo.barcoComercialAtracado();
    },
    setRandom(value) {
      randomValue = value;
    },
  };
}

function concluirObraAtiva(game, primeiroPasso = 20) {
  game.atualizarPrioridades(primeiroPasso);
  let passos = 1;
  while (game.estado.obraAutomaticaColonia !== null && passos < 20) {
    game.atualizarPrioridades(20);
    passos += 1;
  }
  if (game.estado.obraAutomaticaColonia !== null) {
    throw new Error(
      `A equipe exclusiva não concluiu ${game.estado.obraAutomaticaColonia}.`,
    );
  }
}

const storage = new Map();
const first = createHarness(storage);
if (first.elements.get("patrimonio-pessoal").textContent !== "5 ouro") {
  throw new Error("O placar de patrimônio pessoal não apareceu no início.");
}
if (
  first.elements.get("velocidade-tempo-1").attributes["aria-pressed"] !==
    "true" ||
  [2, 5, 10].some(
    (velocidade) =>
      first.elements.get(`velocidade-tempo-${velocidade}`).attributes[
        "aria-pressed"
      ] !== "false",
  )
) {
  throw new Error("O controle de tempo não iniciou em 1×.");
}
const hasNorthernRiver = first.fillRects.some(
  ([x, y, width, height]) => x === 0 && y === 40 && width === 1400 && height === 120,
);
const firstBoatCabin = [...first.fillRects]
  .reverse()
  .find(([, , width, height]) => width === 22 && height === 12);
first.step(50);
const movedBoatCabin = [...first.fillRects]
  .reverse()
  .find(([, , width, height]) => width === 22 && height === 12);
if (
  !hasNorthernRiver ||
  !firstBoatCabin ||
  !movedBoatCabin ||
  firstBoatCabin[0] === movedBoatCabin[0]
) {
  throw new Error("O rio do norte ou a animação dos barcos não foi desenhada.");
}
first.listeners.get("cacar:click")();

const saved = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  saved.local !== "floresta" ||
  saved.inimigos.length !== 6 ||
  saved.mapaVersao !== 2 ||
  saved.jogador.x !== 700 ||
  saved.jogador.y !== 790
) {
  throw new Error("A caçada não foi salva corretamente.");
}

const restored = createHarness(storage);
if (restored.elements.get("local").textContent !== "Floresta") {
  throw new Error("A localização salva não foi restaurada.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "floresta",
    vida: 100,
    ouro: 5,
    jogador: { x: 100, y: 210 },
    inimigos: [
      { id: "mapa-antigo", x: 150, y: 280, vida: 2, velocidade: 24 },
    ],
    fazendeiro: { contratado: false, tempo: 0 },
  }),
);
createHarness(storage);
const migratedMap = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  migratedMap.mapaVersao !== 2 ||
  migratedMap.jogador.x !== 140 ||
  migratedMap.jogador.y !== 270
) {
  throw new Error("O salvamento antigo não foi adaptado ao mapa ampliado.");
}

restored.listeners.get("novo-jogo:click")();
const newGame = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (newGame.local !== "assentamento" || newGame.vida !== 100 || newGame.ouro !== 5) {
  throw new Error("Novo jogo não redefiniu o progresso.");
}

restored.listeners.get("apagar:click")();
if (storage.has("arqueiro-do-assentamento-v1")) {
  throw new Error("Apagar progresso não removeu o salvamento.");
}

const speedStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      local: "assentamento",
      vida: 100,
      ouro: 0,
      jogador: { x: 500, y: 390 },
      inimigos: [],
      fazendeiro: { quantidade: 1, tempo: 0 },
    }),
  ],
]);
const speedGame = createHarness(speedStorage);
speedGame.listeners.get("velocidade-tempo-10:click")();
let speedSave = JSON.parse(
  speedStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  speedSave.velocidadeTempo !== 10 ||
  speedGame.elements.get("velocidade-tempo-10").attributes["aria-pressed"] !==
    "true" ||
  speedGame.elements.get("velocidade-tempo-1").attributes["aria-pressed"] !==
    "false" ||
  !speedGame.elements.get("mensagem").textContent.includes("10×")
) {
  throw new Error("A seleção de 10× não foi aplicada, indicada e salva.");
}
for (let frame = 1; frame <= 21; frame += 1) {
  speedGame.step(frame * 50);
}
speedSave = JSON.parse(speedStorage.get("arqueiro-do-assentamento-v1"));
if (speedSave.ouro !== 1) {
  throw new Error("A velocidade 10× não acelerou dez segundos de produção em um segundo real.");
}
const speedRestored = createHarness(speedStorage);
if (
  speedRestored.estado.velocidadeTempo !== 10 ||
  speedRestored.elements.get("velocidade-tempo-10").attributes[
    "aria-pressed"
  ] !== "true"
) {
  throw new Error("A velocidade selecionada não foi restaurada do save.");
}

const invalidSpeedStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      velocidadeTempo: 3,
      local: "assentamento",
      vida: 100,
      ouro: 0,
      jogador: { x: 500, y: 390 },
      inimigos: [],
    }),
  ],
]);
const invalidSpeedGame = createHarness(invalidSpeedStorage);
if (
  invalidSpeedGame.estado.velocidadeTempo !== 1 ||
  invalidSpeedGame.elements.get("velocidade-tempo-1").attributes[
    "aria-pressed"
  ] !== "true"
) {
  throw new Error("Um save antigo ou com velocidade inválida não voltou com segurança para 1×.");
}

function huntingClockStorage(velocidadeTempo) {
  return new Map([
    [
      "arqueiro-do-assentamento-v1",
      JSON.stringify({
        versao: 1,
        velocidadeTempo,
        local: "floresta",
        vida: 100,
        ouro: 0,
        jogador: { x: 700, y: 790 },
        inimigos: [
          {
            id: "teste-relogio",
            x: 1100,
            y: 790,
            nivel: 1,
            vida: 3,
            velocidade: 24,
          },
        ],
      }),
    ],
  ]);
}
const huntAt1x = createHarness(huntingClockStorage(1));
const huntAt10x = createHarness(huntingClockStorage(10));
huntAt1x.step(50);
huntAt10x.step(50);
if (
  huntAt1x.estado.jogador.x !== huntAt10x.estado.jogador.x ||
  huntAt1x.estado.jogador.y !== huntAt10x.estado.jogador.y ||
  huntAt1x.estado.inimigos[0].x !== huntAt10x.estado.inimigos[0].x ||
  huntAt1x.estado.inimigos[0].y !== huntAt10x.estado.inimigos[0].y
) {
  throw new Error("A aceleração do tempo alterou indevidamente a velocidade da caçada.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 100,
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { contratado: false, tempo: 0 },
  }),
);

const farmerGame = createHarness(storage);
if (farmerGame.elements.get("contratar-fazendeiro").disabled) {
  throw new Error("O fazendeiro não ficou disponível com 100 de ouro.");
}
farmerGame.listeners.get("contratar-fazendeiro:click")();

let farmerSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (farmerSave.fazendeiro.quantidade !== 1 || farmerSave.ouro !== 0) {
  throw new Error("A contratação do fazendeiro não foi salva corretamente.");
}

for (let frame = 1; frame <= 205; frame += 1) {
  farmerGame.step(frame * 50);
}

farmerSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (farmerSave.ouro !== 1) {
  throw new Error("O fazendeiro não produziu 1 de ouro em 10 segundos.");
}

const farmerRestored = createHarness(storage);
if (!farmerRestored.elements.get("fazendeiro-status").textContent.includes("1 ouro")) {
  throw new Error("O fazendeiro contratado não foi restaurado.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { contratado: true, tempo: 4 },
  }),
);
const legacyFarmerGame = createHarness(storage);
if (!legacyFarmerGame.elements.get("fazendeiro-status").textContent.startsWith("1 / 10")) {
  throw new Error("O fazendeiro do salvamento antigo não foi migrado.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
  }),
);

const farmTeamGame = createHarness(storage);
for (let indice = 0; indice < 10; indice += 1) {
  farmTeamGame.listeners.get("contratar-fazendeiro:click")();
}
farmTeamGame.step(50);
let farmTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  farmTeamSave.fazendeiro.quantidade !== 10 ||
  farmTeamSave.ouro !== 0 ||
  !farmTeamGame.elements.get("contratar-fazendeiro").disabled
) {
  throw new Error("O limite de 10 fazendeiros não foi aplicado corretamente.");
}
const hasFirstPlot = farmTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 270 && y === 740 && width === 220 && height === 106,
);
const hasSecondPlot = farmTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 910 && y === 740 && width === 220 && height === 106,
);
if (!hasFirstPlot || !hasSecondPlot) {
  throw new Error("As duas plantações não foram desenhadas para 10 fazendeiros.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { quantidade: 2, tempo: 0 },
  }),
);

const twoFarmersGame = createHarness(storage);
for (let frame = 1; frame <= 205; frame += 1) {
  twoFarmersGame.step(frame * 50);
}
farmTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (farmTeamSave.ouro !== 2) {
  throw new Error("Dois fazendeiros não produziram 2 de ouro em 10 segundos.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { quantidade: 3, tempo: 0 },
  }),
);
const huntingIncomeGame = createHarness(storage);
huntingIncomeGame.produzirDuranteCaca(10);
const huntingIncomeSave = JSON.parse(
  storage.get("arqueiro-do-assentamento-v1"),
);
if (huntingIncomeSave.local !== "floresta" || huntingIncomeSave.ouro !== 3) {
  throw new Error("Os fazendeiros não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
  }),
);

const orchardTeamGame = createHarness(storage);
for (let indice = 0; indice < 10; indice += 1) {
  orchardTeamGame.listeners.get("contratar-fruticultor:click")();
}
orchardTeamGame.step(50);
let orchardTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  orchardTeamSave.fruticultor.quantidade !== 10 ||
  orchardTeamSave.ouro !== 0 ||
  !orchardTeamGame.elements.get("contratar-fruticultor").disabled
) {
  throw new Error("O limite de 10 fruticultores não foi aplicado corretamente.");
}
const hasLeftOrchard = orchardTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 120 && y === 315 && width === 220 && height === 260,
);
const hasRightOrchard = orchardTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 1060 && y === 315 && width === 220 && height === 260,
);
if (!hasLeftOrchard || !hasRightOrchard) {
  throw new Error("Os dois pomares não foram desenhados para 10 fruticultores.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 3, tempo: 0 },
  }),
);
const orchardIncomeGame = createHarness(storage);
if (
  orchardIncomeGame.elements.get("fruticultor-status").textContent !==
  "3 / 10 · +6 ouro / 20 s"
) {
  throw new Error("Os fruticultores salvos não foram restaurados.");
}
orchardIncomeGame.produzirPomarDuranteCaca(20);
orchardTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (orchardTeamSave.local !== "floresta" || orchardTeamSave.ouro !== 6) {
  throw new Error("Os fruticultores não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
  }),
);

const fishingTeamGame = createHarness(storage);
for (let indice = 0; indice < 10; indice += 1) {
  fishingTeamGame.listeners.get("contratar-pescador:click")();
}
fishingTeamGame.step(50);
let fishingTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  fishingTeamSave.pescador.quantidade !== 10 ||
  fishingTeamSave.ouro !== 0 ||
  !fishingTeamGame.elements.get("contratar-pescador").disabled
) {
  throw new Error("O limite de 10 pescadores não foi aplicado corretamente.");
}
const hasFirstDock = fishingTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 302 && y === 120 && width === 36 && height === 72,
);
const hasSecondDock = fishingTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 1062 && y === 120 && width === 36 && height === 72,
);
if (!hasFirstDock || !hasSecondDock) {
  throw new Error("Os dois cais não foram desenhados para 10 pescadores.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 3, tempo: 0 },
  }),
);
const fishingIncomeGame = createHarness(storage);
if (
  fishingIncomeGame.elements.get("pescador-status").textContent !==
  "3 / 10 · +9 ouro / 30 s"
) {
  throw new Error("Os pescadores salvos não foram restaurados.");
}
fishingIncomeGame.produzirPescaDuranteCaca(30);
fishingTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (fishingTeamSave.local !== "floresta" || fishingTeamSave.ouro !== 9) {
  throw new Error("Os pescadores não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
  }),
);

const tradingTeamGame = createHarness(storage);
for (let indice = 0; indice < 10; indice += 1) {
  tradingTeamGame.listeners.get("contratar-comerciante:click")();
}
tradingTeamGame.step(50);
let tradingTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  tradingTeamSave.comerciante.quantidade !== 10 ||
  tradingTeamSave.ouro !== 0 ||
  !tradingTeamGame.elements.get("contratar-comerciante").disabled
) {
  throw new Error("O limite de 10 comerciantes não foi aplicado corretamente.");
}
const hasTradingDock = tradingTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 585 && y === 108 && width === 230 && height === 30,
);
const hasDockStorage = tradingTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 615 && y === 84 && width === 48 && height === 24,
);
const hasLandStorage = tradingTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 625 && y === 158 && width === 58 && height === 30,
);
if (!hasTradingDock || !hasDockStorage || !hasLandStorage) {
  throw new Error("O cais comercial e seus armazéns não foram desenhados.");
}
if (!tradingTeamGame.barcoComercialAtracadoNoTempo(5)) {
  throw new Error("O barco comercial não atracou no cais construído.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 3, tempo: 0 },
  }),
);
const tradingIncomeGame = createHarness(storage);
if (
  tradingIncomeGame.elements.get("comerciante-status").textContent !==
  "3 / 10 · +3 ouro / 10 s"
) {
  throw new Error("Os comerciantes salvos não foram restaurados.");
}
tradingIncomeGame.produzirComercioDuranteCaca(10);
tradingTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (tradingTeamSave.local !== "floresta" || tradingTeamSave.ouro !== 3) {
  throw new Error("Os comerciantes não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
    ferreiro: { quantidade: 0, tempo: 0 },
  }),
);

const smithyTeamGame = createHarness(storage);
for (let indice = 0; indice < 10; indice += 1) {
  smithyTeamGame.listeners.get("contratar-ferreiro:click")();
}
smithyTeamGame.step(50);
let smithyTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  smithyTeamSave.ferreiro.quantidade !== 10 ||
  smithyTeamSave.ouro !== 0 ||
  !smithyTeamGame.elements.get("contratar-ferreiro").disabled
) {
  throw new Error("O limite de 10 ferreiros não foi aplicado corretamente.");
}
const hasSmithyChimney = smithyTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 566 && y === 255 && width === 14 && height === 40,
);
const hasSmithyAnvil = smithyTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 598 && y === 339 && width === 46 && height === 8,
);
if (!hasSmithyChimney || !hasSmithyAnvil) {
  throw new Error("A ferraria não foi desenhada no assentamento.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
    ferreiro: { quantidade: 3, tempo: 0 },
  }),
);
const smithyIncomeGame = createHarness(storage);
if (
  smithyIncomeGame.elements.get("ferreiro-status").textContent !==
  "3 / 10 · +3 ouro / 10 s"
) {
  throw new Error("Os ferreiros salvos não foram restaurados.");
}
smithyIncomeGame.produzirFerrariaDuranteCaca(10);
smithyTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (smithyTeamSave.local !== "floresta" || smithyTeamSave.ouro !== 3) {
  throw new Error("Os ferreiros não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
    ferreiro: { quantidade: 0, tempo: 0 },
    mineiro: { quantidade: 0, tempo: 0 },
  }),
);

const miningTeamGame = createHarness(storage);
for (let indice = 0; indice < 5; indice += 1) {
  miningTeamGame.listeners.get("contratar-mineiro:click")();
}
miningTeamGame.step(50);
const hasFirstMineWithFive = miningTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 135 && y === 760 && width === 50 && height === 70,
);
const hasSecondMineWithFive = miningTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 1215 && y === 760 && width === 50 && height === 70,
);
if (!hasFirstMineWithFive || hasSecondMineWithFive) {
  throw new Error("A primeira mina não foi aberta sozinha para os cinco primeiros mineiros.");
}

miningTeamGame.fillRects.length = 0;
miningTeamGame.listeners.get("contratar-mineiro:click")();
miningTeamGame.step(100);
const hasFirstMineWithSix = miningTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 135 && y === 760 && width === 50 && height === 70,
);
const hasSecondMineWithSix = miningTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 1215 && y === 760 && width === 50 && height === 70,
);
if (!hasFirstMineWithSix || !hasSecondMineWithSix) {
  throw new Error("A segunda mina não foi aberta com o sexto mineiro.");
}

for (let indice = 6; indice < 10; indice += 1) {
  miningTeamGame.listeners.get("contratar-mineiro:click")();
}
let miningTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  miningTeamSave.mineiro.quantidade !== 10 ||
  miningTeamSave.ouro !== 0 ||
  !miningTeamGame.elements.get("contratar-mineiro").disabled
) {
  throw new Error("O limite de 10 mineiros não foi aplicado corretamente.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 0,
    jogador: { x: 700, y: 450 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
    ferreiro: { quantidade: 0, tempo: 0 },
    mineiro: { quantidade: 3, tempo: 0 },
  }),
);
const miningIncomeGame = createHarness(storage);
if (
  miningIncomeGame.elements.get("mineiro-status").textContent !==
  "3 / 10 · +3 ouro / 10 s"
) {
  throw new Error("Os mineiros salvos não foram restaurados.");
}
miningIncomeGame.produzirMineracaoDuranteCaca(10);
miningTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (miningTeamSave.local !== "floresta" || miningTeamSave.ouro !== 3) {
  throw new Error("Os mineiros não produziram renda durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: 2000,
    jogador: { x: 700, y: 510 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    fruticultor: { quantidade: 0, tempo: 0 },
    pescador: { quantidade: 0, tempo: 0 },
    comerciante: { quantidade: 0, tempo: 0 },
    ferreiro: { quantidade: 0, tempo: 0 },
    mineiro: { quantidade: 0, tempo: 0 },
    banqueiro: { quantidade: 0, tempo: 0 },
  }),
);

const bankTeamGame = createHarness(storage);
const hasBankSign = bankTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 833 && y === 522 && width === 74 && height === 24,
);
const hasBankVault = bankTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 850 && y === 542 && width === 40 && height === 24,
);
if (!hasBankSign || !hasBankVault) {
  throw new Error("O banco não foi desenhado em um prédio do assentamento.");
}
for (let indice = 0; indice < 10; indice += 1) {
  bankTeamGame.listeners.get("contratar-banqueiro:click")();
}
let bankTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  bankTeamSave.banqueiro.quantidade !== 10 ||
  bankTeamSave.ouro !== 1000 ||
  !bankTeamGame.elements.get("contratar-banqueiro").disabled
) {
  throw new Error("A contratação ou o limite de 10 banqueiros falhou.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: 100,
    jogador: { x: 700, y: 510 },
    inimigos: [],
    banqueiro: { quantidade: 2, tempo: 0 },
  }),
);
const bankIncomeGame = createHarness(storage);
if (
  bankIncomeGame.elements.get("banqueiro-status").textContent !==
  "2 / 10 · 2% / 60 s"
) {
  throw new Error("Os banqueiros salvos não foram restaurados.");
}
bankIncomeGame.produzirJurosDuranteCaca(120);
bankTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (bankTeamSave.local !== "floresta" || bankTeamSave.ouro !== 104.04) {
  throw new Error("Os juros compostos dos banqueiros falharam durante a caça.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: -15,
    jogador: { x: 700, y: 510 },
    inimigos: [],
    banqueiro: { quantidade: 1, tempo: 0 },
  }),
);
const negativeBankGame = createHarness(storage);
negativeBankGame.produzirJurosDuranteCaca(60);
bankTeamSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (bankTeamSave.ouro !== -15) {
  throw new Error("O banco cobrou juros indevidos sobre ouro negativo.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: 2000,
    jogador: { x: 700, y: 510 },
    inimigos: [],
    escritorio: { quantidade: 0, tempo: 0, fundo: 0 },
    expansao: { mapaComprado: false, mapaAtual: "posto" },
  }),
);

const officeTeamGame = createHarness(storage);
const hasExpansionOfficeSign = officeTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 523 && y === 522 && width === 74 && height === 24,
);
const hasExpansionOfficeMap = officeTeamGame.fillRects.some(
  ([x, y, width, height]) => x === 604 && y === 548 && width === 44 && height === 28,
);
if (!hasExpansionOfficeSign || !hasExpansionOfficeMap) {
  throw new Error("O escritório de expansão não ocupou o último prédio livre.");
}
for (let indice = 0; indice < 10; indice += 1) {
  officeTeamGame.listeners.get("contratar-escriturario:click")();
}
let officeSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  officeSave.escritorio.quantidade !== 10 ||
  officeSave.ouro !== 1000 ||
  !officeTeamGame.elements.get("contratar-escriturario").disabled ||
  officeTeamGame.elements.get("escriturario-status").textContent !==
    "10 / 10 · 5% / 60 s"
) {
  throw new Error("A contratação ou o limite de 10 escriturários falhou.");
}
officeTeamGame.coletarParaExpansao(60);
officeSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (officeSave.ouro !== 950 || officeSave.escritorio.fundo !== 50) {
  throw new Error("Os escriturários não transferiram 5% para o fundo.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: 100,
    jogador: { x: 700, y: 510 },
    inimigos: [],
    fazendeiro: { quantidade: 0, tempo: 0 },
    escritorio: { quantidade: 10, tempo: 0, fundo: 10000 },
    expansao: { mapaComprado: false, mapaAtual: "posto" },
  }),
);

const expansionPurchaseGame = createHarness(storage);
if (expansionPurchaseGame.elements.get("mapa-expansao").disabled) {
  throw new Error("O novo mapa não ficou disponível com o fundo completo.");
}
expansionPurchaseGame.listeners.get("mapa-expansao:click")();
let expansionSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  !expansionSave.expansao.mapaComprado ||
  expansionSave.expansao.mapaAtual !== "expansao" ||
  expansionSave.expansao.revisaoColonia !== 5 ||
  !expansionSave.expansao.economia.coloniaIniciada ||
  expansionSave.expansao.economia.tesouro !== 3000 ||
  expansionSave.expansao.economia.estoqueAlimentos !== 120 ||
  expansionSave.expansao.economia.celeiroConstruido ||
  expansionSave.expansao.economia.defesas.trechosPalicadaInterna !== 0 ||
  expansionSave.expansao.economia.defesas.trechosPalicadaExterna !== 0 ||
  expansionSave.expansao.construcao.etapa !== 0 ||
  expansionSave.escritorio.fundo !== 0 ||
  expansionSave.ouro !== 2500 ||
  expansionSave.jogador.x !== 12740 ||
  expansionSave.jogador.y !== 4500
) {
  throw new Error("A nova economia colonial não foi inicializada corretamente.");
}

expansionPurchaseGame.resetDrawCalls();
expansionPurchaseGame.step(50);
expansionSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
const hasTenTimesWorld = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 0 && y === 0 && width === 14000 && height === 9000,
);
const hasOceanEdge = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 13100 && y === 0 && width === 900 && height === 9000,
);
const hasExpansionRiver = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 0 && y === 520 && width === 14000 && height === 150,
);
const hasAdministration = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    x === 8370 && y === 4300 && width === 260 && height === 170,
);
if (
  expansionSave.expansao.construcao.etapa !== 1 ||
  expansionSave.expansao.economia.tesouro !== 2500 ||
  expansionPurchaseGame.elements.get("local").textContent !== "Nova colônia" ||
  expansionPurchaseGame.elements.get("rotulo-ouro").textContent !==
    "Ouro pessoal" ||
  expansionPurchaseGame.elements.get("body").attributes["data-mapa"] !==
    "expansao" ||
  expansionPurchaseGame.elements.get("controles-mapa").hidden ||
  !expansionPurchaseGame.elements.get("construir-colonia").hidden ||
  expansionPurchaseGame.quantidadeColonosExpansao !== 20 ||
  expansionPurchaseGame.arcs.filter(([, , raio]) => raio === 7).length !== 20 ||
  !hasAdministration ||
  hasExpansionRiver ||
  !hasTenTimesWorld ||
  !hasOceanEdge
) {
  throw new Error("A fundação automática não começou com a administração e 20 colonos.");
}

expansionPurchaseGame.receberParcelaPosto(60);
expansionSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  expansionSave.ouro !== 2530 ||
  expansionSave.expansao.economia.tesouro !== 2770
) {
  throw new Error("O financiamento do posto original não foi dividido em 90%/10%.");
}

expansionPurchaseGame.construirColoniaPor(19.95);
if (
  expansionPurchaseGame.estado.etapaConstrucaoColonia !== 2 ||
  expansionPurchaseGame.estado.tesouroColonia !== 2770
) {
  throw new Error("Os colonos não concluíram a administração automaticamente.");
}
expansionPurchaseGame.construirColoniaPor(0);
if (
  expansionPurchaseGame.estado.etapaConstrucaoColonia !== 3 ||
  expansionPurchaseGame.estado.tesouroColonia !== 2020
) {
  throw new Error("Os colonos não iniciaram as moradias automaticamente.");
}
expansionPurchaseGame.construirColoniaPor(20);
if (expansionPurchaseGame.estado.etapaConstrucaoColonia !== 4) {
  throw new Error("Os colonos não concluíram as moradias automaticamente.");
}

expansionPurchaseGame.atualizarPrioridades(0);
if (
  expansionPurchaseGame.estado.obraAutomaticaColonia !==
    "guildaConstrutores" ||
  expansionPurchaseGame.estado.tesouroColonia !== 1020
) {
  throw new Error("A guilda dos construtores não foi a primeira obra madura.");
}
expansionPurchaseGame.atualizarPrioridades(27);
if (
  !expansionPurchaseGame.estado.guildaConstrutoresConstruida ||
  expansionPurchaseGame.estado.estoqueFerramentasMadeira !== 40
) {
  throw new Error("A guilda não concluiu nem entregou o kit inicial de ferramentas.");
}

const immediateFoodConstruction = [
  ["pastagem", "pastagemConstruida"],
  ["celeiro", "celeiroConstruido"],
  ["horta", "hortaConstruida"],
  ["armazemHortalicas", "armazemHortalicasConstruido"],
  ["feijao", "feijaoConstruido"],
  ["armazemFeijao", "armazemFeijaoConstruido"],
];
for (const [obra, propriedade] of immediateFoodConstruction) {
  const custo = expansionPurchaseGame.custoObra(obra);
  while (expansionPurchaseGame.estado.tesouroColonia < custo) {
    expansionPurchaseGame.receberParcelaPosto(60);
  }
  const saldo = expansionPurchaseGame.estado.tesouroColonia - custo;
  expansionPurchaseGame.atualizarPrioridades(0);
  if (
    expansionPurchaseGame.estado.obraAutomaticaColonia !== obra ||
    expansionPurchaseGame.estado.tesouroColonia !== saldo ||
    expansionPurchaseGame.estado[propriedade]
  ) {
    throw new Error(`A prioridade alimentar ${obra} foi instantânea ou não reservou o custo correto.`);
  }
  concluirObraAtiva(expansionPurchaseGame);
  if (!expansionPurchaseGame.estado[propriedade]) {
    throw new Error(`A prioridade alimentar ${obra} não foi concluída.`);
  }
}

expansionPurchaseGame.atualizarNecessidades(60);
const alimentoDepoisPrimeiroCiclo =
  expansionPurchaseGame.valorAlimentarTotal();
const necessidadePrimeiroCiclo = expansionPurchaseGame.necessidadeAlimentos();
const empregosPrimeiroCiclo = expansionPurchaseGame.redistribuirTrabalhadores();
if (
  expansionPurchaseGame.estado.colonosComFome !== 0 ||
  alimentoDepoisPrimeiroCiclo < necessidadePrimeiroCiclo * 2 ||
  expansionPurchaseGame.producaoAlimentar(empregosPrimeiroCiclo) <
    necessidadePrimeiroCiclo * 1.2 ||
  expansionPurchaseGame.saldoOperacional() < 0
) {
  throw new Error("O primeiro ciclo não cobriu consumo, reserva e orçamento alimentar.");
}
expansionPurchaseGame.atualizarNecessidades(60);
if (
  expansionPurchaseGame.estado.colonosComFome !== 0 ||
  expansionPurchaseGame.valorAlimentarTotal() < alimentoDepoisPrimeiroCiclo ||
  !expansionPurchaseGame.elements
    .get("patrimonio-pessoal")
    .textContent.endsWith("ouro")
) {
  throw new Error("A produção alimentar sustentável não manteve a reserva no segundo ciclo.");
}

expansionPurchaseGame.resetDrawCalls();
expansionPurchaseGame.step(100);
const hasColonialGrainPlan = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    x === 400 && y === 2800 && width === 1100 && height === 1300,
);
const hasColonialProduce = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 1608 && y === 2808 && width === 1084 && height === 1284,
);
const hasColonialBeans = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 2808 && y === 2808 && width === 1084 && height === 1284,
);
const hasColonialPasture = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 408 && y === 4198 && width === 3484 && height === 1294,
);
const pastureMeetsAgriculturalRoad = 4190 === 4150 + 80 / 2;
const hasFieldRoad = expansionPurchaseGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 3900 && y === 4090 && width === 3030 && height === 120,
);
const hasRoadBetweenFieldsAndPasture =
  expansionPurchaseGame.lineSegments.some(
    ([x1, y1, x2, y2]) =>
      x1 === 400 && y1 === 4150 && x2 === 1600 && y2 === 4150,
  ) &&
  expansionPurchaseGame.lineSegments.some(
    ([x1, y1, x2, y2]) =>
      x1 === 2800 && y1 === 4150 && x2 === 4000 && y2 === 4150,
  );
const hasProduceStore = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    x === 5600 && y === 2050 && width === 380 && height === 270,
);
const hasBeanStore = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    x === 6050 && y === 2050 && width === 380 && height === 270,
);
const hasOuterWardPlan = expansionPurchaseGame.lineSegments.some(
  ([x1, y1, x2, y2]) =>
    x1 === 5000 && y1 === 1500 && x2 === 11200 && y2 === 1500,
);
const hasInnerWardPlan = expansionPurchaseGame.lineSegments.some(
  ([x1, y1, x2, y2]) =>
    x1 === 6800 && y1 === 2700 && x2 === 10300 && y2 === 2700,
);
const hasPrematureWallRectangle = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    (x === 5000 && y === 1500 && width === 6200 && height === 6000) ||
    (x === 6800 && y === 2700 && width === 3500 && height === 3600),
);
const productionLots = [
  [5200, 3100, 500, 340],
  [5900, 3120, 450, 300],
  [5200, 4550, 500, 340],
  [5900, 4570, 450, 300],
];
const roadRect = [3900, 4090, 3030, 120];
const roadCrossesProductionLot = productionLots.some(
  ([x, y, width, height]) =>
    x < roadRect[0] + roadRect[2] &&
    x + width > roadRect[0] &&
    y < roadRect[1] + roadRect[3] &&
    y + height > roadRect[1],
);
const hasGranary = expansionPurchaseGame.strokeRects.some(
  ([x, y, width, height]) =>
    x === 7000 && y === 4550 && width === 420 && height === 260,
);
const completedHouses = expansionPurchaseGame.strokeRects.filter(
  ([, , width, height]) => width === 130 && height === 105,
).length;
const farmerHomes = expansionPurchaseGame.strokeRects.filter(
  ([, , width, height]) => width === 150 && height === 105,
).length;
const prestigeHomes = expansionPurchaseGame.strokeRects.filter(
  ([, , width, height]) => width === 180 && height === 125,
).length;
if (
  !hasColonialGrainPlan ||
  !hasColonialProduce ||
  !hasColonialBeans ||
  !hasColonialPasture ||
  !pastureMeetsAgriculturalRoad ||
  !hasFieldRoad ||
  !hasRoadBetweenFieldsAndPasture ||
  !hasProduceStore ||
  !hasBeanStore ||
  !hasOuterWardPlan ||
  !hasInnerWardPlan ||
  hasPrematureWallRectangle ||
  roadCrossesProductionLot ||
  !hasGranary ||
  completedHouses !== 4 ||
  farmerHomes !== 0 ||
  prestigeHomes !== 2
) {
  throw new Error("O mapa colonial não separou os campos, estoques ilustrados e recintos corretamente.");
}

const zoomAntesDeAmpliar = expansionPurchaseGame.estado.cameraExpansao.zoom;
expansionPurchaseGame.listeners.get("aumentar-zoom:click")();
if (
  expansionPurchaseGame.estado.cameraExpansao.zoom !==
    zoomAntesDeAmpliar * 1.25 ||
  !expansionPurchaseGame.elements
    .get("nivel-zoom")
    .textContent.includes("75%")
) {
  throw new Error("O botão de ampliar o mapa não alterou o zoom.");
}
const zoomDepoisDoBotao = expansionPurchaseGame.estado.cameraExpansao.zoom;

const preventDefault = () => {};
const cameraAntesArrastar = {
  x: expansionPurchaseGame.estado.cameraExpansao.x,
  y: expansionPurchaseGame.estado.cameraExpansao.y,
};
expansionPurchaseGame.listeners.get("jogo:pointerdown")({
  pointerId: 1,
  clientX: 500,
  clientY: 350,
  preventDefault,
});
expansionPurchaseGame.listeners.get("jogo:pointermove")({
  pointerId: 1,
  clientX: 400,
  clientY: 250,
  preventDefault,
});
expansionPurchaseGame.listeners.get("jogo:pointerup")({ pointerId: 1 });
expansionSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  expansionSave.expansao.camera.x <= cameraAntesArrastar.x ||
  expansionSave.expansao.camera.y <= cameraAntesArrastar.y
) {
  throw new Error("Arrastar não moveu ou salvou a câmera da nova colônia.");
}

expansionPurchaseGame.listeners.get("jogo:pointerdown")({
  pointerId: 2,
  clientX: 300,
  clientY: 300,
  preventDefault,
});
expansionPurchaseGame.listeners.get("jogo:pointerdown")({
  pointerId: 3,
  clientX: 500,
  clientY: 300,
  preventDefault,
});
expansionPurchaseGame.listeners.get("jogo:pointermove")({
  pointerId: 3,
  clientX: 600,
  clientY: 300,
  preventDefault,
});
expansionPurchaseGame.listeners.get("jogo:pointerup")({ pointerId: 3 });
expansionPurchaseGame.listeners.get("jogo:pointerup")({ pointerId: 2 });
if (expansionPurchaseGame.estado.cameraExpansao.zoom <= zoomDepoisDoBotao) {
  throw new Error("O gesto de pinça não ampliou a nova colônia.");
}

const cameraRestoredGame = createHarness(storage);
const restoredZoom = cameraRestoredGame.estado.cameraExpansao.zoom;
const restoredY = cameraRestoredGame.estado.cameraExpansao.y;
if (restoredZoom <= zoomDepoisDoBotao) {
  throw new Error("O zoom da nova colônia não foi restaurado do save.");
}
cameraRestoredGame.listeners.get("jogo:wheel")({
  deltaX: 0,
  deltaY: 100,
  deltaMode: 0,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  clientX: 500,
  clientY: 350,
  preventDefault,
});
if (cameraRestoredGame.estado.cameraExpansao.y <= restoredY) {
  throw new Error("A rolagem não percorreu o mapa ampliado.");
}
cameraRestoredGame.listeners.get("centralizar-mapa:click")();
if (
  cameraRestoredGame.estado.cameraExpansao.zoom !== 1 ||
  cameraRestoredGame.estado.cameraExpansao.x !== 7800 ||
  cameraRestoredGame.estado.cameraExpansao.y !== 4050
) {
  throw new Error("Centralizar não restaurou a vista inicial da nova colônia.");
}

expansionSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  expansionSave.expansao.construcao.etapa !== 4 ||
  expansionSave.expansao.economia.estoqueAlimentos !==
    cameraRestoredGame.estado.estoqueAlimentos ||
  expansionSave.expansao.economia.estoques.hortalicas !==
    cameraRestoredGame.estado.estoqueHortalicas ||
  expansionSave.expansao.economia.estoques.feijao !==
    cameraRestoredGame.estado.estoqueFeijao ||
  expansionSave.expansao.economia.estoques.ferramentasMadeira !== 40 ||
  !expansionSave.expansao.economia.logistica
    .kitFerramentasInicialRecebido ||
  !expansionSave.expansao.economia.logistica.ferramentasPorLocal ||
  cameraRestoredGame.elements.get("moradia-status").textContent !==
    "20 / 20 · 4 casas" ||
  !cameraRestoredGame.elements
    .get("prioridade-colonia-status")
    .textContent
) {
  throw new Error("As necessidades coloniais não foram preservadas no save.");
}
const tesouroAntesDeEsperarGraos = cameraRestoredGame.estado.tesouroColonia;
cameraRestoredGame.atualizarPrioridades(0);
if (
  cameraRestoredGame.estado.obraAutomaticaColonia !== null ||
  cameraRestoredGame.estado.tesouroColonia !== tesouroAntesDeEsperarGraos
) {
  throw new Error("Uma obra começou sem ouro municipal suficiente.");
}

const ouroAntesEscriturario = cameraRestoredGame.estado.ouro;
cameraRestoredGame.listeners.get("contratar-administrador-migracao:click")();
if (
  cameraRestoredGame.estado.ouro !== ouroAntesEscriturario - 100 ||
  cameraRestoredGame.estado.populacaoColonia !== 21 ||
  cameraRestoredGame.estado.quantidadeAdministradoresMigracao !== 1 ||
  cameraRestoredGame.estado.cargasMigracaoDisponiveis !== 1 ||
  cameraRestoredGame.elements.get("moradia-status").textContent !==
    "20 / 21 · 4 casas"
) {
  throw new Error("O administrador de migração não consumiu ouro, alimento e moradia corretamente.");
}

const tesouroAntesCasaMigrante = cameraRestoredGame.estado.tesouroColonia;
cameraRestoredGame.receberParcelaPosto(60);
cameraRestoredGame.atualizarPrioridades(0);
if (
  cameraRestoredGame.estado.obraAutomaticaColonia !== "moradia" ||
  cameraRestoredGame.estado.tesouroColonia <= tesouroAntesCasaMigrante
) {
  throw new Error("A cidade não priorizou uma única casa para o novo morador.");
}
concluirObraAtiva(cameraRestoredGame);
if (
  cameraRestoredGame.estado.quantidadeCasasColonia !== 5 ||
  cameraRestoredGame.elements.get("moradia-status").textContent !==
    "21 / 21 · 5 casas"
) {
  throw new Error("A casa adicional não criou cinco vagas habitacionais.");
}

for (let casaReserva = 0; casaReserva < 2; casaReserva += 1) {
  cameraRestoredGame.receberParcelaPosto(60);
  cameraRestoredGame.atualizarPrioridades(0);
  if (cameraRestoredGame.estado.obraAutomaticaColonia !== "moradia") {
    throw new Error("A reserva habitacional não foi construída antes da migração.");
  }
  concluirObraAtiva(cameraRestoredGame);
}
if (
  cameraRestoredGame.estado.quantidadeCasasColonia !== 7 ||
  cameraRestoredGame.estado.tesouroColonia < 0
) {
  throw new Error("A cidade não manteve dez vagas habitacionais planejadas.");
}

const ouroAntesIncentivo = cameraRestoredGame.estado.ouro;
cameraRestoredGame.listeners.get("incentivar-migracao:click")();
if (
  cameraRestoredGame.estado.ouro !== ouroAntesIncentivo - 100 ||
  cameraRestoredGame.estado.cargasMigracaoDisponiveis !== 0 ||
  cameraRestoredGame.estado.migracoesPendentes.length !== 1
) {
  throw new Error("O incentivo migratório ou o adicional fiscal do escriturário falhou.");
}
cameraRestoredGame.atualizarMigracao(12);
if (
  cameraRestoredGame.estado.populacaoColonia !== 22 ||
  cameraRestoredGame.estado.migracoesPendentes.length !== 0 ||
  cameraRestoredGame.estado.empregosColonia.geral < 1
) {
  throw new Error("O migrante não desembarcou nem recebeu um trabalho automático.");
}
cameraRestoredGame.atualizarMigracao(48);
if (cameraRestoredGame.estado.cargasMigracaoDisponiveis !== 1) {
  throw new Error("O administrador de migração não recuperou seu incentivo após 60 segundos.");
}

const ouroAntesDoFinanciamento = cameraRestoredGame.estado.ouro;
cameraRestoredGame.estado.quantidadeFazendeiros = 10;
cameraRestoredGame.produzirDuranteCaca(10);
if (cameraRestoredGame.estado.ouro !== ouroAntesDoFinanciamento) {
  throw new Error("A produção antiga foi somada além do repasse consolidado.");
}
cameraRestoredGame.listeners.get("mapa-expansao:click")();
if (
  cameraRestoredGame.estado.mapaAtual !== "expansao" ||
  cameraRestoredGame.elements.get("local").textContent !== "Nova colônia"
) {
  throw new Error("O administrador deixou a colônia ativa indevidamente.");
}

function migrationChanceSave(clerks, houses) {
  return JSON.stringify({
    versao: 1,
    mapaVersao: 2,
    local: "assentamento",
    vida: 100,
    ouro: 1000,
    jogador: { x: 8500, y: 4500 },
    inimigos: [],
    expansao: {
      mapaComprado: true,
      mapaAtual: "expansao",
      revisaoColonia: 5,
      economia: {
        coloniaIniciada: true,
        tesouro: 0,
        estoqueAlimentos: 100,
        populacao: 20,
        casas: houses,
        administradoresMigracao: clerks,
        cargasMigracao: clerks,
        tempoRecargaMigracao: 0,
        tempoTentativaMigracao: 0,
        migracoesPendentes: [],
      },
      construcao: { etapa: 4, tempo: 0 },
      camera: { x: 7800, y: 4050, zoom: 1 },
    },
  });
}

const fullMigrationStorage = new Map([
  ["arqueiro-do-assentamento-v1", migrationChanceSave(5, 4)],
]);
const fullMigrationGame = createHarness(fullMigrationStorage);
fullMigrationGame.setRandom(0);
fullMigrationGame.atualizarMigracao(60);
if (
  fullMigrationGame.estado.migracoesPendentes.length !== 0 ||
  !fullMigrationGame.elements
    .get("migracao-status")
    .textContent.includes("Sem leitos físicos") ||
  !fullMigrationGame.elements
    .get("contratar-administrador-migracao")
    .textContent.includes("sem espaço para migrantes") ||
  fullMigrationGame.elements.get("registro-fiscalizacao").textContent !==
    "5 · +15 ouro / 60 s"
) {
  throw new Error("A colônia cheia não bloqueou a migração nem ativou a fiscalização.");
}
fullMigrationGame.receberParcelaPosto(60);
if (
  fullMigrationGame.estado.ouro !== 1045 ||
  fullMigrationGame.estado.tesouroColonia !== 270
) {
  throw new Error("Cinco escriturários ociosos não acrescentaram 15 de ouro ao repasse pessoal.");
}

const baseMigrationStorage = new Map([
  ["arqueiro-do-assentamento-v1", migrationChanceSave(0, 7)],
]);
const baseMigrationGame = createHarness(baseMigrationStorage);
baseMigrationGame.setRandom(0.049);
baseMigrationGame.atualizarMigracao(60);
if (
  baseMigrationGame.estado.migracoesPendentes.length !== 1 ||
  baseMigrationGame.elements.get("registro-chance-migracao").textContent !==
    "5% / 60 s"
) {
  throw new Error("A chance migratória base de 5% não foi aplicada.");
}

const fullClerkMigrationStorage = new Map([
  ["arqueiro-do-assentamento-v1", migrationChanceSave(10, 7)],
]);
const fullClerkMigrationGame = createHarness(fullClerkMigrationStorage);
fullClerkMigrationGame.setRandom(0.149);
fullClerkMigrationGame.atualizarMigracao(60);
if (
  fullClerkMigrationGame.estado.migracoesPendentes.length !== 1 ||
  fullClerkMigrationGame.elements.get("registro-chance-migracao").textContent !==
    "15% / 60 s"
) {
  throw new Error("Os 10 escriturários não elevaram a chance migratória para 15%.");
}

const paidMigrationSave = JSON.parse(migrationChanceSave(3, 5));
paidMigrationSave.ouro = 2000;
paidMigrationSave.pescador = { quantidade: 5, tempo: 0 };
const paidMigrationGame = createHarness(
  new Map([
    ["arqueiro-do-assentamento-v1", JSON.stringify(paidMigrationSave)],
  ]),
);
if (
  paidMigrationGame.vagasFisicasMigracao() !== 5 ||
  paidMigrationGame.vagasMigracao() !== 0 ||
  !paidMigrationGame.migracaoIncentivadaPermitida() ||
  paidMigrationGame.elements.get("incentivar-migracao").disabled ||
  !paidMigrationGame.elements
    .get("incentivar-migracao")
    .textContent.includes("5 leitos")
) {
  throw new Error("A reserva planejada ainda bloqueou um incentivo com leitos físicos livres.");
}
for (let incentivo = 0; incentivo < 3; incentivo += 1) {
  paidMigrationGame.listeners.get("incentivar-migracao:click")();
}
if (
  paidMigrationGame.estado.ouro !== 1700 ||
  paidMigrationGame.estado.cargasMigracaoDisponiveis !== 0 ||
  paidMigrationGame.estado.migracoesPendentes.length !== 3 ||
  paidMigrationGame.vagasFisicasMigracao() !== 2 ||
  !paidMigrationGame.elements
    .get("registro-desembarque-migracao")
    .textContent.includes("independente dos pescadores")
) {
  throw new Error("Os incentivos pagos não reservaram leitos nem registraram o desembarque corretamente.");
}
paidMigrationGame.atualizarMigracao(12);
if (
  paidMigrationGame.estado.populacaoColonia !== 23 ||
  paidMigrationGame.estado.migracoesPendentes.length !== 0 ||
  paidMigrationGame.estado.quantidadePescadores !== 5
) {
  throw new Error("Cinco pescadores bloquearam ou alteraram a chegada simultânea dos migrantes.");
}

const infrastructureStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 1000,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 200000,
          lavouraConstruida: false,
          pastagemConstruida: true,
          celeiroConstruido: true,
          estoqueAlimentos: 80,
          populacao: 20,
          casas: 4,
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 7800, y: 4050, zoom: 1 },
      },
    }),
  ],
]);
const infrastructureGame = createHarness(infrastructureStorage);
Object.assign(infrastructureGame.estado, {
  estoqueMadeira: 2000,
  estoquePedra: 3000,
  estoqueFerramentas: 1000,
});
const propriedadesInfraestrutura = {
  horta: "hortaConstruida",
  armazemHortalicas: "armazemHortalicasConstruido",
  feijao: "feijaoConstruido",
  armazemFeijao: "armazemFeijaoConstruido",
  lavoura: "lavouraConstruida",
  armazemGraos: "armazemGraosConstruido",
  cisterna: "cisternaConstruida",
  moinho: "moinhoConstruido",
  armazemFarinha: "armazemFarinhaConstruido",
  padaria: "padariaConstruida",
  armazemPaes: "armazemPaesConstruido",
  banco: "bancoColoniaConstruido",
  caisPesca: "caisPescaConstruido",
  mercadoPeixes: "mercadoPeixesConstruido",
  caisPesca2: "segundoCaisPescaConstruido",
  cabanaLenhadores: "quantidadeCabanasLenhadores",
  depositoMadeira: "depositoMadeiraConstruido",
  cabanaReflorestamento: "cabanaReflorestamentoConstruida",
  mina: "minaConstruida",
  pedreira: "pedreiraConstruida",
  caisComercial: "caisComercialConstruido",
  feitoria: "feitoriaConstruida",
  ferraria: "ferrariaColoniaConstruida",
  companhiaTransportadores: "companhiaTransportadoresConstruida",
  guildaConstrutores: "guildaConstrutoresConstruida",
  oficinaFerramentasMadeira: "nivelOficinaFerramentas",
  oficinaFerramentasPedra: "nivelOficinaFerramentas",
  oficinaFerramentasMetal: "nivelOficinaFerramentas",
  adegaFria: "adegaFriaConstruida",
  cozinhaHortalicas: "cozinhaHortalicasConstruida",
  cozinhaFeijao: "cozinhaFeijaoConstruida",
  defumadorio: "defumadorioConstruido",
  armazensInternosPedra: "armazensInternosPedraConstruidos",
  estaleiro: "estaleiroConstruido",
  forja: "forjaColoniaConstruida",
  cabanaColeta: "quantidadeCabanasColeta",
  ervario: "ervarioConstruido",
  clinica: "clinicaConstruida",
  saneamento: "saneamentoConstruido",
  pocoPublico: "quantidadePocosPublicos",
  saneamentoAvancado: "saneamentoAvancadoConstruido",
  quartelBombeiros: "quartelBombeirosConstruido",
  biblioteca: "bibliotecaConstruida",
  igreja: "igrejaConstruida",
  mercadoPublico: "mercadoPublicoConstruido",
  oficinaArmasMadeira: "oficinaArmasMadeiraConstruida",
  arsenalMadeira: "arsenalMadeiraConstruido",
  flecharia: "flechariaConstruida",
  depositoFlechas: "depositoFlechasConstruido",
};
const sequenciaInfraestrutura = [];
const primeirosTrechosViarios = [];
let segurancaIteracoesInfraestrutura = 0;
while (!infrastructureGame.estado.depositoFlechasConstruido) {
  segurancaIteracoesInfraestrutura += 1;
  if (segurancaIteracoesInfraestrutura > 70) {
    throw new Error("A fila automática de infraestrutura entrou em ciclo.");
  }
  const obraEsperada = infrastructureGame.proximaObra();
  if (!obraEsperada) {
    throw new Error("A fila automática parou antes de concluir a infraestrutura.");
  }
  const ouroAntes = infrastructureGame.estado.tesouroColonia;
  const custoEsperado = infrastructureGame.custoObra(obraEsperada);
  const propriedade = propriedadesInfraestrutura[obraEsperada];
  const valorAntes = propriedade
    ? infrastructureGame.estado[propriedade]
    : null;
  const somaNiveisAntes = infrastructureGame.estado.niveisEstradasColonia.reduce(
    (total, nivel) => total + nivel,
    0,
  );
  infrastructureGame.atualizarPrioridades(0);
  if (
    infrastructureGame.estado.obraAutomaticaColonia !== obraEsperada ||
    infrastructureGame.estado.tesouroColonia !== ouroAntes - custoEsperado ||
    (propriedade && infrastructureGame.estado[propriedade] !== valorAntes)
  ) {
    throw new Error(`A obra automática ${obraEsperada} foi instantânea ou não reservou o custo correto.`);
  }
  if (obraEsperada === "estradaSegmento") {
    const indiceTrecho = infrastructureGame.estado.trechoEstradaEmObra;
    primeirosTrechosViarios.push(
      infrastructureGame.trechosEstradaColonia[indiceTrecho].nome,
    );
  }
  infrastructureGame.atualizarPrioridades(
    obraEsperada === "guildaConstrutores" ? 27 : 20,
  );
  let ciclosConclusaoObra = 1;
  while (
    infrastructureGame.estado.obraAutomaticaColonia !== null &&
    ciclosConclusaoObra < 10
  ) {
    infrastructureGame.atualizarPrioridades(20);
    ciclosConclusaoObra += 1;
  }
  if (infrastructureGame.estado.obraAutomaticaColonia !== null) {
    throw new Error(`A obra automática ${obraEsperada} não foi concluída.`);
  }
  if (
    obraEsperada === "estradaSegmento" &&
    infrastructureGame.estado.niveisEstradasColonia.reduce(
      (total, nivel) => total + nivel,
      0,
    ) !== somaNiveisAntes + 1
  ) {
    throw new Error("Um trecho viário não avançou exatamente um nível.");
  }
  if (
    propriedade &&
    (typeof valorAntes === "boolean"
      ? infrastructureGame.estado[propriedade] !== true
      : infrastructureGame.estado[propriedade] !== valorAntes + 1)
  ) {
    throw new Error(`A obra automática ${obraEsperada} não atualizou seu estado.`);
  }
  sequenciaInfraestrutura.push(obraEsperada);
}
if (
  primeirosTrechosViarios[0] !== "eixo central e ronda interna" ||
  primeirosTrechosViarios[1] !== "rua das moradias" ||
  infrastructureGame.quantidadeTrechosEstrada(1) !== 8 ||
  infrastructureGame.quantidadeTrechosEstrada(2) !== 0 ||
  !sequenciaInfraestrutura.includes("saneamento")
) {
  throw new Error(
    `As estradas básicas não seguiram o tráfego e os marcos sustentáveis da fila: ${JSON.stringify({ primeirosTrechosViarios, niveis: infrastructureGame.estado.niveisEstradasColonia, sequenciaInfraestrutura })}.`,
  );
}

infrastructureGame.estado.tesouroColonia = 2700;
infrastructureGame.atualizarPrioridades(0);
if (
  infrastructureGame.estado.obraAutomaticaColonia !== null
) {
  throw new Error("Uma obra não essencial ignorou a reserva municipal dinâmica.");
}

infrastructureGame.estado.tesouroColonia = 50000;
const gruposEstradaMadeira = [];
const gruposEstradaPedra = [];
for (let indice = 0; indice < 16; indice += 1) {
  const nivelAlvo = indice < 8 ? 2 : 3;
  const saldoAntes = infrastructureGame.estado.tesouroColonia;
  const custo = infrastructureGame.custoObra("estradaSegmento");
  infrastructureGame.atualizarPrioridades(0);
  if (infrastructureGame.estado.obraAutomaticaColonia !== "estradaSegmento") {
    throw new Error(`A rede viária não iniciou o reforço de nível ${nivelAlvo}.`);
  }
  const trecho = infrastructureGame.estado.trechoEstradaEmObra;
  const grupos = nivelAlvo === 2 ? gruposEstradaMadeira : gruposEstradaPedra;
  grupos.push(infrastructureGame.trechosEstradaColonia[trecho].id);
  if (
    infrastructureGame.estado.tesouroColonia !== saldoAntes - custo ||
    infrastructureGame.estado.niveisEstradasColonia[trecho] !== nivelAlvo - 1
  ) {
    throw new Error("Um reforço viário não reservou ouro e materiais separadamente.");
  }
  concluirObraAtiva(infrastructureGame);
  if (infrastructureGame.estado.niveisEstradasColonia[trecho] !== nivelAlvo) {
    throw new Error("Um reforço viário não avançou exatamente um nível.");
  }
}
const idsEstrada = infrastructureGame.trechosEstradaColonia.map(({ id }) => id).sort();
if (
  JSON.stringify([...gruposEstradaMadeira].sort()) !== JSON.stringify(idsEstrada) ||
  JSON.stringify([...gruposEstradaPedra].sort()) !== JSON.stringify(idsEstrada) ||
  infrastructureGame.quantidadeTrechosEstrada(3) !== 8
) {
  throw new Error("Os oito grupos viários não foram preservados em ambos os reforços.");
}
const expectedPalisades = [
  ["palicadaInterna", "trechosPalicadaInterna", 1],
  ["palicadaInterna", "trechosPalicadaInterna", 2],
  ["palicadaInterna", "trechosPalicadaInterna", 3],
  ["palicadaInterna", "trechosPalicadaInterna", 4],
  ["postoGuarda", "quantidadePostosGuarda", 1],
  ["postoGuarda", "quantidadePostosGuarda", 2],
  ["postoGuarda", "quantidadePostosGuarda", 3],
  ["postoGuarda", "quantidadePostosGuarda", 4],
  ["palicadaExterna", "trechosPalicadaExterna", 1],
  ["palicadaExterna", "trechosPalicadaExterna", 2],
  ["palicadaExterna", "trechosPalicadaExterna", 3],
  ["palicadaExterna", "trechosPalicadaExterna", 4],
];
for (const [obra, propriedade, quantidade] of expectedPalisades) {
  const saldoAntes = infrastructureGame.estado.tesouroColonia;
  infrastructureGame.atualizarPrioridades(0);
  if (
    infrastructureGame.estado.obraAutomaticaColonia !== obra ||
    infrastructureGame.estado.tesouroColonia !==
      saldoAntes - infrastructureGame.custoObra(obra) ||
    infrastructureGame.estado[propriedade] !== quantidade - 1
  ) {
    throw new Error(`O trecho de defesa ${obra} não reservou o custo separadamente.`);
  }
  concluirObraAtiva(infrastructureGame);
  if (infrastructureGame.estado[propriedade] !== quantidade) {
    throw new Error(`O trecho de defesa ${obra} não foi concluído isoladamente.`);
  }
}
const completedDefenseSave = JSON.parse(
  infrastructureStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  completedDefenseSave.expansao.economia.defesas.trechosPalicadaInterna !== 4 ||
  completedDefenseSave.expansao.economia.defesas.trechosPalicadaExterna !== 4 ||
  completedDefenseSave.expansao.economia.defesas.estagioInterno !== 1 ||
  completedDefenseSave.expansao.economia.defesas.estagioExterno !== 1 ||
  infrastructureGame.elements.get("edificio-palicada-interna").textContent !==
    "Estágio 1 concluído" ||
  infrastructureGame.elements.get("edificio-palicada-externa").textContent !==
    "Estágio 1 concluído"
) {
  throw new Error("O estágio 1 das paliçadas não foi salvo ou exibido corretamente.");
}

Object.assign(infrastructureGame.estado, {
  populacaoColonia: 200,
  idadesAdultosColonia: Array(200).fill(32),
  quantidadeCasasColonia: 50,
  segundoBlocoMoradiasConstruido: true,
  terceiroBlocoMoradiasConstruido: true,
  tesouroColonia: 50000,
  estoquePedra: 0.97,
  trechosMuralhaPedraInterna: 2,
  estoqueCarneDefumada: 0,
  estoquePeixeSeco: 0,
  saudeColonia: 100,
  colonosComFome: 0,
});
const priorityStaffingJobs = infrastructureGame.redistribuirTrabalhadores();
if (
  priorityStaffingJobs.pedreira <= 0 ||
  priorityStaffingJobs.bombeiro < 1 ||
  priorityStaffingJobs.conserveiro < 2 ||
  priorityStaffingJobs.construtor !== 0 ||
  infrastructureGame.protecaoIncendio(priorityStaffingJobs) < 60 ||
  infrastructureGame.saldoOperacional(priorityStaffingJobs) < 0 ||
  !infrastructureGame.prioridadeAtual().startsWith("Produzir ") ||
  !infrastructureGame.prioridadeAtual().includes("pedras para trecho 3/4 da muralha interna de pedra")
) {
  throw new Error(
    `Pedreira, brigada e conservação não receberam os mínimos sustentáveis antes da obra de pedra: ${JSON.stringify({ empregos: priorityStaffingJobs, prioridade: infrastructureGame.prioridadeAtual(), protecao: infrastructureGame.protecaoIncendio(priorityStaffingJobs), saldo: infrastructureGame.saldoOperacional(priorityStaffingJobs) })}.`,
  );
}

const resourceStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 1000,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 1000,
          lavouraConstruida: true,
          armazemGraosConstruido: true,
          hortaConstruida: true,
          armazemHortalicasConstruido: true,
          feijaoConstruido: true,
          armazemFeijaoConstruido: true,
          pastagemConstruida: true,
          celeiroConstruido: true,
          moinhoConstruido: true,
          armazemFarinhaConstruido: true,
          padariaConstruida: true,
          armazemPaesConstruido: true,
          estoqueAlimentos: 80,
          tempoNecessidades: 0,
          populacao: 50,
          casas: 10,
          administradoresMigracao: 0,
          cargasMigracao: 0,
          tempoRecargaMigracao: 0,
          migracoesPendentes: [],
          edificios: {
            mina: true,
            pedreira: true,
            caisPesca: true,
            segundoCaisPesca: true,
            mercadoPeixes: true,
            caisComercial: true,
            feitoria: true,
            estaleiro: true,
            ferraria: true,
            forja: true,
          },
          estoques: {
            graos: 150,
            hortalicas: 100,
            feijao: 100,
            farinha: 120,
            paes: 100,
            peixes: 160,
            minerio: 100,
            pedra: 120,
            ferramentas: 60,
            armas: 40,
            mercadorias: 100,
          },
          frota: {
            barcosPesca: 5,
            naviosMercantes: 5,
            progressoNavio: 0,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 7800, y: 4050, zoom: 1 },
      },
    }),
  ],
]);
const resourceGame = createHarness(resourceStorage);
const resourceJobs = resourceGame.redistribuirTrabalhadores();
if (
  resourceGame.producaoAlimentar(resourceJobs) <
    resourceGame.necessidadeAlimentos() * 1.2 ||
  resourceJobs.mina !== 5 ||
  resourceJobs.pedreira !== 5 ||
  resourceJobs.comercio !== 10 ||
  resourceJobs.ferraria !== 5 ||
  resourceJobs.forja !== 5 ||
  resourceJobs.geral < 0 ||
  resourceGame.saldoOperacional() < 0
) {
  throw new Error("A distribuição automática de empregos não respeitou produção, prioridades e sustentabilidade.");
}
const ouroAntesVendaRecursos = resourceGame.estado.ouro;
const tesouroAntesVendaRecursos = resourceGame.estado.tesouroColonia;
resourceGame.atualizarNecessidades(60);
const receitaPessoalRecursos =
  resourceGame.estado.ouro - ouroAntesVendaRecursos;
const receitaMunicipalRecursos =
  resourceGame.estado.tesouroColonia - tesouroAntesVendaRecursos;
if (
  resourceGame.estado.estoqueAlimentos !== 80 ||
  resourceGame.estado.estoquePeixes > 160 ||
  resourceGame.estado.estoqueGraos > 150 ||
  resourceGame.estado.estoqueHortalicas > 100 ||
  resourceGame.estado.estoqueFeijao > 100 ||
  resourceGame.estado.estoqueFarinha > 120 ||
  resourceGame.estado.estoquePaes > 100 ||
  resourceGame.estado.estoqueMinerio > 100 ||
  resourceGame.estado.estoquePedra > 120 ||
  resourceGame.estado.estoqueFerramentas > 60 ||
  resourceGame.estado.estoqueArmas > 40 ||
  resourceGame.estado.estoqueMercadorias > 100 ||
  receitaPessoalRecursos <= 0 ||
  Math.abs(receitaMunicipalRecursos - receitaPessoalRecursos * 9) > 0.02
) {
  throw new Error("Os limites de armazenamento ou a venda 90%/10% do excedente falharam.");
}
if (
  !resourceGame.elements.get("trabalho-lavoura").textContent.startsWith(
    `${resourceJobs.lavoura} / 6`,
  ) ||
  !resourceGame.elements.get("trabalho-horta").textContent.startsWith(
    `${resourceJobs.horta} / 6`,
  ) ||
  !resourceGame.elements.get("trabalho-feijao").textContent.startsWith(
    `${resourceJobs.feijao} / 6`,
  ) ||
  !resourceGame.elements.get("trabalho-pastagem").textContent.startsWith(
    `${resourceJobs.pastagem} / 14`,
  ) ||
  !resourceGame.elements.get("trabalho-moinho").textContent.startsWith(
    `${resourceJobs.moinho} / 5`,
  ) ||
  !resourceGame.elements.get("trabalho-padaria").textContent.startsWith(
    `${resourceJobs.padaria} / 5`,
  ) ||
  !resourceGame.elements.get("trabalho-pesca").textContent.startsWith(
    `${resourceJobs.pesca} / 10`,
  ) ||
  resourceGame.elements.get("trabalho-comercio").textContent !==
    "10 / 10 · +20 mercadorias / 60 s" ||
  !resourceGame.elements.get("estoque-graos").textContent.endsWith("/ 150") ||
  !resourceGame.elements.get("estoque-hortalicas").textContent.endsWith("/ 100") ||
  !resourceGame.elements.get("estoque-feijao").textContent.endsWith("/ 100") ||
  !resourceGame.elements.get("estoque-farinha").textContent.endsWith("/ 120") ||
  !resourceGame.elements.get("estoque-paes").textContent.endsWith("/ 100") ||
  !resourceGame.elements.get("estoque-peixes").textContent.endsWith("/ 160") ||
  resourceGame.elements.get("estoque-minerio").textContent !== "100 / 100" ||
  resourceGame.elements.get("estoque-pedra").textContent !== "120 / 120" ||
  resourceGame.elements.get("trabalho-pedreira").textContent !==
    "5 / 5 · +5 pedras cada" ||
  resourceGame.elements.get("estoque-ferramentas").textContent !== "60 / 60" ||
  resourceGame.elements.get("estoque-armas").textContent !== "40 / 40" ||
  resourceGame.elements.get("estoque-mercadorias").textContent !== "100 / 100" ||
  !resourceGame.elements.get("registro-auditoria-pao").textContent.startsWith(
    `${resourceJobs.lavoura}/6 → ${resourceJobs.moinho}/5 → ${resourceJobs.padaria}/5`,
  ) ||
  resourceGame.elements.get("registro-auditoria-metal").textContent !==
    "5/5 · +25 minério → demanda 25" ||
  !resourceGame.elements.get("registro-auditoria-costa").textContent.startsWith(
    `${resourceJobs.pesca}/10`,
  ) ||
  !resourceGame.elements.get("registro-meta-alimentos").textContent ||
  !resourceGame.elements.get("registro-prioridade-alimentos").textContent
) {
  throw new Error("O painel colonial não exibiu empregos, produção e capacidades com clareza.");
}
const illustratedStores = [
  [5150, 2050, 380, 270],
  [5600, 2050, 380, 270],
  [6050, 2050, 380, 270],
  [5900, 3120, 450, 300],
  [5900, 4570, 450, 300],
  [11750, 2900, 700, 420],
  [1780, 6720, 470, 300],
  [3780, 6660, 500, 320],
  [11620, 5410, 640, 430],
  [8250, 2920, 500, 280],
  [8850, 2920, 500, 280],
];
if (
  !illustratedStores.every(([sx, sy, sw, sh]) =>
    resourceGame.strokeRects.some(
      ([x, y, width, height]) =>
        x === sx && y === sy && width === sw && height === sh,
    ),
  )
) {
  throw new Error("Os depósitos ilustrados não foram desenhados no mapa.");
}

const fullChainStorage = new Map(resourceStorage);
const fullChainGame = createHarness(fullChainStorage);
Object.assign(fullChainGame.estado, {
  populacaoColonia: 245,
  quantidadeCasasColonia: 49,
  saudeColonia: 90,
  tempoNecessidadesColonia: 0,
  quantidadeCabanasLenhadores: 2,
  depositoMadeiraConstruido: true,
  cabanaReflorestamentoConstruida: true,
  quantidadeCabanasColeta: 2,
  ervarioConstruido: true,
  clinicaConstruida: true,
  companhiaTransportadoresConstruida: true,
  oficinaArmasMadeiraConstruida: true,
  arsenalMadeiraConstruido: true,
  flechariaConstruida: true,
  depositoFlechasConstruido: true,
  estoqueArvores: 200,
  estoqueMadeira: 180,
  estoqueErvas: 100,
  estoqueMedicamentos: 80,
});
fullChainGame.setRandom(0.99);
const fullChainJobs = fullChainGame.redistribuirTrabalhadores();
if (
  fullChainGame.producaoAlimentar(fullChainJobs) <
    fullChainGame.necessidadeAlimentos() * 1.2 ||
  fullChainJobs.horta !== 6 ||
  fullChainJobs.feijao !== 6 ||
  fullChainJobs.pastagem < 10 ||
  fullChainJobs.pastagem > 14 ||
  fullChainJobs.pesca !== 10 ||
  fullChainJobs.lenhador !== 6 ||
  fullChainJobs.reflorestador !== 2 ||
  fullChainJobs.coletor !== 6 ||
  fullChainJobs.clinica !== 8 ||
  fullChainJobs.mina !== 5 ||
  fullChainJobs.ferraria !== 5 ||
  fullChainJobs.forja !== 5 ||
  fullChainJobs.armeiroMadeira !== 5 ||
  fullChainJobs.flecheiro !== 5 ||
  fullChainJobs.transportador !== 2 ||
  fullChainJobs.comercio !== 10 ||
  fullChainGame.saldoOperacional() < 0
) {
  throw new Error(
    `As cadeias completas não preencheram vagas coerentes em capacidade máxima: ${JSON.stringify(fullChainJobs)}.`,
  );
}
fullChainGame.atualizarNecessidades(60);
if (
  !fullChainGame.elements.get("registro-auditoria-pao").textContent.startsWith(
    `${fullChainJobs.lavoura}/6 → ${fullChainJobs.moinho}/5 → ${fullChainJobs.padaria}/5`,
  ) ||
  fullChainGame.elements.get("registro-auditoria-floresta").textContent !==
    "6/6 · −12 árvores/+60 madeira ↔ 2/2 · +12 árvores" ||
  fullChainGame.elements.get("registro-auditoria-metal").textContent !==
    "5/5 · +25 minério → demanda 25" ||
  !fullChainGame.elements.get("registro-auditoria-saude").textContent.startsWith(
    "6/6 · +18 ervas →",
  ) ||
  !fullChainGame.elements.get("registro-auditoria-costa").textContent.startsWith(
    "10/10",
  )
) {
  throw new Error(
    `O livro de auditoria não reconciliou as capacidades máximas das cadeias: ${JSON.stringify({ pao: fullChainGame.elements.get("registro-auditoria-pao").textContent, floresta: fullChainGame.elements.get("registro-auditoria-floresta").textContent, metal: fullChainGame.elements.get("registro-auditoria-metal").textContent, saude: fullChainGame.elements.get("registro-auditoria-saude").textContent, costa: fullChainGame.elements.get("registro-auditoria-costa").textContent })}.`,
  );
}
if (
  5 * 6 < 5 * 4 ||
  5 * 5 !== 5 * 2 + 5 * 3 ||
  6 * 2 !== 2 * 6 ||
  6 * 10 < 5 * 6 + 5 * 2 + 20 ||
  6 * 3 < 5 * 2
) {
  throw new Error("Uma cadeia auditada apresenta déficit estrutural em capacidade máxima.");
}

const coastStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 500,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 1000,
          celeiroConstruido: true,
          estoqueAlimentos: 200,
          populacao: 20,
          casas: 4,
          edificios: {
            caisPesca: true,
            segundoCaisPesca: true,
            mercadoPeixes: true,
            estaleiro: true,
          },
          estoques: {
            madeira: 20,
            ferramentas: 2,
          },
          frota: {
            barcosPesca: 0,
            naviosMercantes: 0,
            progressoNavio: 0,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 12400, y: 4300, zoom: 0.7 },
      },
    }),
  ],
]);
const coastGame = createHarness(coastStorage);
const initialCoastJobs = coastGame.redistribuirTrabalhadores();
if (
  initialCoastJobs.pesca < 4 ||
  initialCoastJobs.pesca > 10 ||
  initialCoastJobs.estaleiro !== 5 ||
  coastGame.producaoAlimentar(initialCoastJobs) <
    coastGame.necessidadeAlimentos() * 1.2
) {
  throw new Error("Pescadores e carpinteiros navais não receberam prioridade costeira sustentável.");
}
coastGame.atualizarNecessidades(60);
if (
  coastGame.estado.barcosPesca !== 0 ||
  coastGame.estado.progressoNavio !== 3
) {
  throw new Error("O estaleiro sem ferramentas próprias não aplicou a produtividade reduzida.");
}
coastGame.atualizarNecessidades(60);
if (
  coastGame.estado.barcosPesca !== 1 ||
  coastGame.estado.naviosMercantes !== 0 ||
  coastGame.estado.progressoNavio !== 0 ||
  coastGame.estado.estoqueMadeira !== 0 ||
  coastGame.estado.estoqueFerramentas !== 0 ||
  coastGame.elements.get("registro-barcos-pesca").textContent !== "1 / 5"
) {
  throw new Error("O estaleiro não construiu o barco de pesca com trabalho, madeira e ferramentas.");
}
coastGame.estado.progressoNavio = 5;
if (coastGame.redistribuirTrabalhadores().estaleiro !== 0) {
  throw new Error("Carpinteiros navais ficaram ociosos num casco pronto sem materiais.");
}
coastGame.step(16);
if (
  !coastGame.fillTexts.some(([texto]) => texto === "PESCA") ||
  !coastGame.fillTexts.some(([texto]) =>
    String(texto).includes("MERCADO DE PEIXES"),
  ) ||
  !coastGame.fillTexts.some(([texto]) =>
    String(texto).includes("ESTALEIRO"),
  )
) {
  throw new Error("A pesca, o mercado e o estaleiro não foram identificados no litoral.");
}

coastGame.estado.populacaoColonia = 40;
coastGame.estado.quantidadeCasasColonia = 8;
coastGame.estado.estoqueAlimentos = 200;
coastGame.estado.barcosPesca = 5;
coastGame.estado.caisComercialConstruido = true;
coastGame.estado.feitoriaConstruida = true;
coastGame.estado.naviosMercantes = 0;
coastGame.estado.progressoNavio = 0;
coastGame.estado.estoqueMadeira = 20;
coastGame.estado.estoqueFerramentas = 2;
const merchantCoastJobs = coastGame.redistribuirTrabalhadores();
if (
  merchantCoastJobs.comercio !== 10 ||
  merchantCoastJobs.estaleiro !== 5
) {
  throw new Error("A feitoria não ampliou os mercadores ou o estaleiro perdeu seus construtores.");
}
coastGame.atualizarNecessidades(60);
if (
  coastGame.estado.naviosMercantes !== 0 ||
  coastGame.estado.progressoNavio !== 3
) {
  throw new Error("O estaleiro mercante não respeitou suas ferramentas locais.");
}
coastGame.estado.estoqueMercadorias = 0;
coastGame.atualizarNecessidades(60);
if (
  coastGame.estado.naviosMercantes !== 1 ||
  coastGame.estado.estoqueMercadorias !== 12 ||
  coastGame.elements.get("registro-navios-mercantes").textContent !== "1 / 5" ||
  coastGame.elements.get("registro-producao-comercio").textContent !==
    "+12 mercadorias / 60 s"
) {
  throw new Error("O navio mercante não ampliou a produção comercial da feitoria.");
}
coastGame.resetDrawCalls();
coastGame.step(32);
if (
  !coastGame.fillTexts.some(([texto]) => texto === "COMÉRCIO") ||
  !coastGame.fillTexts.some(([texto]) => String(texto).includes("FEITORIA"))
) {
  throw new Error("A frota mercante e a feitoria não apareceram no litoral.");
}
const savedCoast = JSON.parse(
  coastStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  savedCoast.expansao.economia.frota.barcosPesca !== 5 ||
  savedCoast.expansao.economia.frota.naviosMercantes !== 1 ||
  !savedCoast.expansao.economia.edificios.mercadoPeixes ||
  !savedCoast.expansao.economia.edificios.feitoria ||
  !savedCoast.expansao.economia.edificios.estaleiro
) {
  throw new Error("A economia costeira não foi preservada no salvamento.");
}

const pastureCapacityStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 100,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 0,
          pastagemConstruida: true,
          celeiroConstruido: true,
          estoqueAlimentos: 200,
          populacao: 60,
          casas: 12,
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 7800, y: 4050, zoom: 1 },
      },
    }),
  ],
]);
const pastureCapacityGame = createHarness(pastureCapacityStorage);
const pastureCapacityJobs = pastureCapacityGame.redistribuirTrabalhadores();
if (
  pastureCapacityGame.capacidadesEmprego().pastagem !== 14 ||
  pastureCapacityJobs.pastagem > 14 ||
  pastureCapacityGame.elements.get("trabalho-pastagem").textContent !==
    `${pastureCapacityJobs.pastagem} / 14 · +4 alimento cada`
) {
  throw new Error("A pastagem ampliada não recebeu sua capacidade de 14 trabalhadores.");
}

const forestryStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 1000,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 1000,
          lavouraConstruida: true,
          armazemGraosConstruido: true,
          hortaConstruida: true,
          armazemHortalicasConstruido: true,
          feijaoConstruido: true,
          armazemFeijaoConstruido: true,
          pastagemConstruida: true,
          celeiroConstruido: true,
          moinhoConstruido: true,
          armazemFarinhaConstruido: true,
          padariaConstruida: true,
          armazemPaesConstruido: true,
          floresta: {
            cabanasLenhadores: 2,
            depositoMadeira: true,
            cabanaReflorestamento: true,
            cabanasColeta: 2,
            ervario: true,
            oficinaArmasMadeira: true,
            arsenalMadeira: true,
            flecharia: true,
            depositoFlechas: true,
          },
          estoqueAlimentos: 200,
          populacao: 100,
          casas: 20,
          estoques: {
            arvores: 120,
            madeira: 0,
            ervas: 0,
            lancasMadeira: 0,
            arcos: 0,
            flechas: 0,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 7800, y: 4050, zoom: 1 },
      },
    }),
  ],
]);
const forestryGame = createHarness(forestryStorage);
const forestryJobs = forestryGame.redistribuirTrabalhadores();
if (
  forestryJobs.lenhador !== 6 ||
  forestryJobs.reflorestador !== 2 ||
  forestryJobs.coletor !== 6 ||
  forestryJobs.armeiroMadeira !== 5 ||
  forestryJobs.flecheiro !== 5
) {
  throw new Error("Os empregos florestais não respeitaram as vagas das cinco cabanas e oficinas.");
}
forestryGame.atualizarNecessidades(60);
if (
  forestryGame.estado.estoqueArvores !== 120 ||
  forestryGame.estado.estoqueMadeira !== 0 ||
  forestryGame.estado.estoqueErvas !== 0 ||
  forestryGame.estado.estoqueLocalMadeira !== 36 ||
  forestryGame.estado.estoqueLocalErvas !== 10.8 ||
  forestryGame.estado.estoqueLancasMadeira !== 0 ||
  forestryGame.estado.estoqueArcos !== 0 ||
  forestryGame.estado.estoqueFlechas !== 0
) {
  throw new Error("Lenhadores e coletores não mantiveram a produção nos estoques locais.");
}
const forestrySaved = JSON.parse(
  forestryStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  forestrySaved.expansao.economia.logistica.estoquesLocais.madeira !== 36 ||
  forestrySaved.expansao.economia.logistica.estoquesLocais.ervas !== 10.8
) {
  throw new Error("Os estoques locais dos produtores não foram preservados no save.");
}
forestryGame.listeners.get("abrir-registros:click")();
if (
  !forestryGame.elements.get("registros-colonia").open ||
  forestryGame.elements.get("registro-madeira").textContent !== "0 / 180" ||
  forestryGame.elements.get("registro-ervas").textContent !== "0 / 100" ||
  forestryGame.elements.get("registro-lancas").textContent !== "0 / 60" ||
  forestryGame.elements.get("registro-arcos").textContent !== "0 / 40" ||
  forestryGame.elements.get("registro-flechas").textContent !== "0 / 600" ||
  forestryGame.elements.get("registro-aljavas").textContent !== "0" ||
  forestryGame.elements.get("registro-arqueiros-prontos").textContent !==
    "0 de 0 arcos"
) {
  throw new Error("O livro de registros misturou estoques locais com depósitos centrais.");
}
forestryGame.listeners.get("fechar-registros:click")();
if (forestryGame.elements.get("registros-colonia").open) {
  throw new Error("O livro de registros não fechou.");
}

const transportGame = createHarness(new Map());
Object.assign(transportGame.estado, {
  coloniaIniciada: true,
  etapaConstrucaoColonia: 4,
  companhiaTransportadoresConstruida: true,
  niveisEstradasColonia: Array(8).fill(3),
  saudeColonia: 70,
  estoqueLocalMadeira: 12,
  estoqueLocalErvas: 12,
  estoqueLocalCarneSelvagem: 12,
  estoqueLocalCarneCriacao: 12,
  estoqueMadeira: 0,
  estoqueErvas: 0,
  estoqueCarneSelvagem: 0,
  estoqueCarneCriacao: 0,
  estoqueFerramentas: 2,
});
transportGame.sincronizarFerramentas({ transportador: 2 });
const mixedCargo = transportGame.transportarCargas({
  transportador: 2,
  clinica: 4,
});
if (
  transportGame.alvoTransportadores({}) !== 6 ||
  transportGame.capacidadeCargaTransportadores({ transportador: 2 }) <= 24 ||
  mixedCargo.total <= 24 ||
  mixedCargo.total > transportGame.capacidadeCargaTransportadores({ transportador: 2 }) ||
  mixedCargo.madeira <= 0 ||
  mixedCargo.ervas < 8 ||
  mixedCargo.carneSelvagem <= 0 ||
  mixedCargo.carneCriacao <= 0 ||
  transportGame.estado.estoqueErvas < 8 ||
  transportGame.cargaLocalPendente() >= 48
) {
  throw new Error("As carroças não priorizaram ervas nem combinaram madeira e carnes na mesma viagem.");
}

const idleTransportGame = createHarness(new Map());
Object.assign(idleTransportGame.estado, {
  coloniaIniciada: true,
  etapaConstrucaoColonia: 4,
  companhiaTransportadoresConstruida: true,
});
if (idleTransportGame.alvoTransportadores({}) !== 0) {
  throw new Error("A companhia manteve carroças ociosas sem produção nem carga na origem.");
}

const heavyTransportGame = createHarness(new Map());
Object.assign(heavyTransportGame.estado, {
  coloniaIniciada: true,
  etapaConstrucaoColonia: 4,
  companhiaTransportadoresConstruida: true,
  depositoMadeiraConstruido: true,
  quantidadeCabanasLenhadores: 2,
  ervarioConstruido: true,
  quantidadeCabanasColeta: 2,
  cabanaCacadoresConstruida: true,
  acougueConstruido: true,
  estoqueLocalMadeira: 60,
  estoqueLocalErvas: 18,
  estoqueLocalCarneSelvagem: 12,
  estoqueLocalCarneCriacao: 10,
});
if (
  heavyTransportGame.alvoTransportadores({
    lenhador: 6,
    coletor: 6,
    cacador: 4,
    pastagem: 10,
  }) !== 12
) {
  throw new Error("A meta logística não escalou até 12 carroças diante do fluxo e atraso máximos.");
}

const blockedTransportGame = createHarness(new Map());
Object.assign(blockedTransportGame.estado, {
  coloniaIniciada: true,
  etapaConstrucaoColonia: 4,
  companhiaTransportadoresConstruida: true,
  acougueConstruido: true,
  estoqueLocalCarneCriacao: 60,
  estoqueCarneCriacao: 120,
});
if (
  blockedTransportGame.alvoTransportadores({ pastagem: 10 }) !== 0 ||
  blockedTransportGame.transportarCargas({ transportador: 6 }).total !== 0
) {
  throw new Error("Carga bloqueada por um depósito cheio ainda criou vagas ou viagens logísticas falsas.");
}

const tieredTransportGame = createHarness(new Map());
Object.assign(tieredTransportGame.estado, {
  coloniaIniciada: true,
  etapaConstrucaoColonia: 4,
  companhiaTransportadoresConstruida: true,
});
const tieredTransportJobs = { transportador: 2 };
const transportCapacityByTool = {};
for (const [tool, rack] of Object.entries({
  sem: { metal: 0, pedra: 0, madeira: 0 },
  madeira: { metal: 0, pedra: 0, madeira: 2 },
  pedra: { metal: 0, pedra: 2, madeira: 0 },
  metal: { metal: 2, pedra: 0, madeira: 0 },
})) {
  tieredTransportGame.estado.ferramentasLocaisColonia = {
    transportador: { capacidade: 12, ...rack },
  };
  transportCapacityByTool[tool] =
    tieredTransportGame.capacidadeCargaTransportadores(
      tieredTransportJobs,
    );
}
if (
  transportCapacityByTool.sem !== 14.4 ||
  transportCapacityByTool.madeira !== 24 ||
  transportCapacityByTool.pedra !== 27.6 ||
  transportCapacityByTool.metal !== 31.2
) {
  throw new Error(
    `As carroças não receberam a progressão 60%/100%/115%/130% das ferramentas: ${JSON.stringify(transportCapacityByTool)}.`,
  );
}

const toolSiteGame = createHarness(new Map());
Object.assign(toolSiteGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  etapaConstrucaoColonia: 4,
  populacaoColonia: 100,
  quantidadeCasasColonia: 25,
  guildaConstrutoresConstruida: true,
  clinicaConstruida: true,
  hortaConstruida: true,
  armazemHortalicasConstruido: true,
  obraAutomaticaColonia: "armazensInternosPedra",
  estoqueFerramentas: 3,
  estoqueFerramentasPedra: 4,
  estoqueFerramentasMadeira: 5,
});
const toolSiteJobs = { clinica: 2, construtor: 6, horta: 4 };
let toolSites = toolSiteGame.sincronizarFerramentas(toolSiteJobs);
if (
  toolSites.clinica.capacidade !== 8 ||
  toolSites.construtor.capacidade !== 12 ||
  toolSites.horta.capacidade !== 6 ||
  toolSites.clinica.metal !== 2 ||
  toolSites.construtor.metal !== 1 ||
  toolSites.construtor.pedra !== 4 ||
  toolSites.construtor.madeira !== 1 ||
  toolSites.horta.madeira !== 4 ||
  toolSiteGame.trabalhadoresComFerramentas(toolSiteJobs) !== 12 ||
  Math.abs(
    toolSiteGame.multiplicadorFerramentasLocal(
      "construtor",
      toolSiteJobs,
    ) - 1.15,
  ) > 0.0001
) {
  throw new Error("Os racks locais não distribuíram uma ferramenta por trabalhador na ordem metal, pedra e madeira.");
}
toolSiteGame.estado.estoqueFerramentas = 8;
toolSites = toolSiteGame.sincronizarFerramentas(toolSiteJobs);
if (
  toolSites.clinica.metal !== 2 ||
  toolSites.construtor.metal !== 6 ||
  toolSites.construtor.pedra !== 0 ||
  toolSites.horta.pedra !== 4 ||
  Math.abs(
    toolSiteGame.multiplicadorFerramentasLocal(
      "construtor",
      toolSiteJobs,
    ) - 1.3,
  ) > 0.0001
) {
  throw new Error("Ferramentas de metal novas não deslocaram as qualidades menores para outros locais.");
}
toolSiteGame.estado.estoqueFerramentas = 0;
toolSiteGame.estado.estoqueFerramentasPedra = 0;
toolSiteGame.estado.estoqueFerramentasMadeira = 0;
toolSiteGame.sincronizarFerramentas(toolSiteJobs);
if (
  toolSiteGame.multiplicadorFerramentasLocal("horta", toolSiteJobs) !== 0.6 ||
  Math.abs(toolSiteGame.multiplicadorConstrucao(toolSiteJobs) - 0.9) >
    0.0001 ||
  toolSiteGame.alvoConstrutores("moradia") !== 4 ||
  toolSiteGame.alvoConstrutores("armazensInternosPedra") !== 12 ||
  toolSiteGame.destinoEmprego("geral") !== null
) {
  throw new Error("A penalidade sem ferramentas, o limite da equipe ou a exclusividade das obras falhou.");
}
toolSiteGame.estado.obraAutomaticaColonia = null;
if (toolSiteGame.redistribuirTrabalhadores().construtor !== 0) {
  throw new Error("A equipe da guilda não retornou à reserva geral sem uma obra ativa.");
}
const retentionGame = createHarness(new Map());
const retainedJobs = {
  ...retentionGame.estado.empregosColonia,
  administracao: 2,
  horta: 4,
  transportador: 2,
  ferramenteiro: 3,
  bombeiro: 2,
  bibliotecario: 2,
  religioso: 2,
  feirante: 3,
  construtor: 0,
  geral: 80,
};
retentionGame.estado.empregosColonia = retainedJobs;
const assignmentsBeforeConstruction = Array.from(
  { length: 100 },
  (_, index) => retentionGame.empregoDoColono(index).tipo,
);
retentionGame.estado.empregosColonia = {
  ...retainedJobs,
  construtor: 6,
  geral: 74,
};
const assignmentsDuringConstruction = Array.from(
  { length: 100 },
  (_, index) => retentionGame.empregoDoColono(index).tipo,
);
if (
  assignmentsBeforeConstruction.some(
    (job, index) =>
      job !== "geral" && assignmentsDuringConstruction[index] !== job,
  ) ||
  assignmentsDuringConstruction.some(
    (job, index) =>
      job === "construtor" && assignmentsBeforeConstruction[index] !== "geral",
  )
) {
  throw new Error("Uma obra ativa deslocou um especialista estabelecido em vez de usar a reserva geral.");
}
const forestrySave = JSON.parse(
  forestryStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  forestrySave.expansao.economia.floresta.cabanasLenhadores !== 2 ||
  !forestrySave.expansao.economia.floresta.flecharia ||
  forestrySave.expansao.economia.estoques.madeira !== 0 ||
  forestrySave.expansao.economia.estoques.flechas !== 0 ||
  forestrySave.expansao.economia.logistica.estoquesLocais.madeira !== 36
) {
  throw new Error("Os edifícios e estoques florestais não foram salvos.");
}
const hasNorthwestForest = forestryGame.fillRects.some(
  ([x, y, width, height]) =>
    x === 350 && y === 450 && width === 3600 && height === 1700,
);
const forestryStructures = [
  [600, 1650, 600, 300],
  [1450, 1650, 600, 300],
  [2400, 1650, 600, 300],
  [750, 760, 540, 280],
  [2650, 760, 540, 280],
  [5100, 1700, 440, 260],
  [7000, 5480, 440, 280],
  [6500, 1650, 500, 300],
  [7050, 2920, 500, 280],
  [5700, 1650, 500, 300],
  [7650, 2920, 500, 280],
];
if (
  !hasNorthwestForest ||
  !forestryStructures.every(([sx, sy, sw, sh]) =>
    forestryGame.strokeRects.some(
      ([x, y, width, height]) =>
        x === sx && y === sy && width === sw && height === sh,
    ),
  )
) {
  throw new Error("A floresta, suas cinco cabanas e seus depósitos não foram desenhados.");
}

const healthStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 750,
      jogador: { x: 8500, y: 4500 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 2400,
          estoqueAlimentos: 200,
          saude: 100,
          populacao: 40,
          casas: 8,
          celeiroConstruido: true,
          floresta: {
            cabanasColeta: 2,
            ervario: true,
          },
          logistica: {
            companhiaTransportadores: true,
            guildaConstrutores: true,
          },
          edificios: {
            clinica: true,
            banco: true,
          },
          estoques: {
            ervas: 10,
            medicamentos: 0,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 7800, y: 4050, zoom: 1 },
      },
    }),
  ],
]);
const healthGame = createHarness(healthStorage);
const healthJobs = healthGame.redistribuirTrabalhadores();
if (healthJobs.clinica !== 2 || healthJobs.coletor !== 6) {
  throw new Error(
    `A clínica e as cabanas de coleta não receberam profissionais automaticamente: ${JSON.stringify(healthJobs)}.`,
  );
}
healthGame.atualizarNecessidades(60);
if (
  healthGame.estado.saudeColonia !== 100 ||
  healthGame.estado.estoqueMedicamentos !== 1 ||
  healthGame.estado.estoqueErvas !== 24 ||
  healthGame.elements.get("registro-saude").textContent !==
    "100 / 100 · estável" ||
  healthGame.elements.get("registro-medicamentos").textContent !== "1 / 80" ||
  healthGame.elements.get("registro-banco").textContent !==
    "2472 municipal · 758 pessoal"
) {
  throw new Error(
    `Ervas, medicamentos, tratamentos, saúde ou cofres não foram reconciliados: ${JSON.stringify({ saude: healthGame.estado.saudeColonia, medicamentos: healthGame.estado.estoqueMedicamentos, ervas: healthGame.estado.estoqueErvas, registroSaude: healthGame.elements.get("registro-saude").textContent, registroMedicamentos: healthGame.elements.get("registro-medicamentos").textContent, registroBanco: healthGame.elements.get("registro-banco").textContent })}`,
  );
}
const healthSave = JSON.parse(
  healthStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  healthSave.expansao.economia.saude !== 100 ||
  healthSave.expansao.economia.estoques.medicamentos !== 1 ||
  !healthSave.expansao.economia.edificios.clinica ||
  !healthSave.expansao.economia.edificios.banco
) {
  throw new Error("A clínica, o banco, a saúde ou os medicamentos não foram salvos.");
}
healthGame.estado.quantidadeCasasColonia = 11;
healthGame.estado.saudeColonia = 59;
if (healthGame.migracaoNecessaria()) {
  throw new Error("A migração não foi suspensa durante a crise sanitária.");
}
healthGame.estado.saudeColonia = 60;
if (!healthGame.migracaoNecessaria()) {
  throw new Error("A migração não foi retomada no limite sanitário seguro.");
}

const emergencyHealthStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 12000,
          estoqueAlimentos: 200,
          saude: 35,
          populacao: 259,
          casas: 60,
          segundoBlocoMoradiasConstruido: true,
          terceiroBlocoMoradiasConstruido: true,
          lavouraConstruida: true,
          armazemGraosConstruido: true,
          hortaConstruida: true,
          armazemHortalicasConstruido: true,
          feijaoConstruido: true,
          armazemFeijaoConstruido: true,
          pastagemConstruida: true,
          celeiroConstruido: true,
          moinhoConstruido: true,
          armazemFarinhaConstruido: true,
          padariaConstruida: true,
          armazemPaesConstruido: true,
          cadeiaCarne: {
            cabanaCacadores: true,
            acougue: true,
            cozinha: true,
          },
          alimentacaoAvancada: {
            cozinhaHortalicas: true,
            cozinhaFeijao: true,
            defumadorio: true,
            adegaFria: true,
          },
          floresta: {
            cabanasColeta: 2,
            ervario: true,
          },
          vidaCivica: {
            pocosPublicos: 4,
            saneamentoAvancado: true,
            quartelBombeiros: true,
            cemiterio: true,
          },
          logistica: {
            companhiaTransportadores: true,
            guildaConstrutores: true,
          },
          edificios: {
            clinica: true,
            cisterna: true,
            saneamento: true,
            caisPesca: true,
            segundoCaisPesca: true,
            mercadoPeixes: true,
          },
          estoques: {
            graos: 150,
            hortalicas: 100,
            feijao: 100,
            farinha: 120,
            paes: 100,
            peixes: 160,
            refeicoesCarne: 100,
            refeicoesHortalicas: 90,
            refeicoesFeijao: 90,
            ervas: 0,
            medicamentos: 0,
          },
          frota: { barcosPesca: 5 },
          demografia: {
            idadesAdultos: [95, ...Array(258).fill(32)],
            migrantesChegados: 239,
            creditosObitos: 10,
            mortes: 0,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
      },
    }),
  ],
]);
const emergencyHealthGame = createHarness(emergencyHealthStorage);
const emergencySaved = JSON.parse(
  emergencyHealthStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  emergencyHealthGame.estado.saudeColonia !== 70 ||
  emergencyHealthGame.estado.estoqueErvas !== 36 ||
  emergencyHealthGame.estado.estoqueMedicamentos !== 20 ||
  emergencyHealthGame.estado.ciclosProtecaoSanitaria !== 3 ||
  !emergencyHealthGame.estado.resgateSanitarioAplicado ||
  !emergencySaved.expansao.economia.saudeEmergencial.resgateAplicado ||
  emergencySaved.expansao.economia.saudeEmergencial.ciclosProtecao !== 3
) {
  throw new Error("O save em crise não recebeu e não persistiu o resgate sanitário único.");
}
const emergencyJobs = emergencyHealthGame.redistribuirTrabalhadores();
if (
  emergencyJobs.clinica !== 8 ||
  emergencyJobs.coletor !== 6 ||
  emergencyJobs.transportador < 6 ||
  emergencyHealthGame.capacidadeCargaTransportadores(emergencyJobs) < 43 ||
  emergencyHealthGame.alvoClinica() !== 8 ||
  emergencyHealthGame.alvoColetores() !== 6 ||
  !emergencyHealthGame.prioridadeAtual().startsWith("Emergência sanitária") ||
  emergencyHealthGame.prioridadeAtual().includes("muralha") ||
  emergencyHealthGame.saldoOperacional(emergencyJobs) < 0
) {
  throw new Error(
    `A crise não tomou a prioridade sustentável de trabalho e planejamento: ${JSON.stringify({ empregos: emergencyJobs, prioridade: emergencyHealthGame.prioridadeAtual(), saldo: emergencyHealthGame.saldoOperacional(emergencyJobs) })}.`,
  );
}
emergencyHealthGame.atualizarInterface();
if (
  !emergencyHealthGame.elements
    .get("trabalho-transportador")
    .textContent.includes("meta 6") ||
  !emergencyHealthGame.elements
    .get("registro-auditoria-logistica")
    .textContent.includes("meta 6")
) {
  throw new Error("A interface não explicou a meta reforçada da companhia de transportadores.");
}
emergencyHealthGame.definirAleatorio(0);
if (
  emergencyHealthGame.atualizarObitos() !== null ||
  emergencyHealthGame.estado.ciclosProtecaoSanitaria !== 2
) {
  throw new Error("A proteção temporária do hotfix não suspendeu o óbito durante a estabilização.");
}
emergencyHealthGame.definirAleatorio(0.99);
emergencyHealthGame.atualizarNecessidades(9 * 60);
const recoveredJobs = emergencyHealthGame.redistribuirTrabalhadores();
if (
  emergencyHealthGame.estado.saudeColonia !== 100 ||
  emergencyHealthGame.estado.estoqueMedicamentos <
    emergencyHealthGame.reservaMedicamentos() ||
  emergencyHealthGame.estado.ciclosProtecaoSanitaria !== 0 ||
  emergencyHealthGame.estado.populacaoColonia !== 259 ||
  emergencyHealthGame.estado.colonosComFome !== 0 ||
  recoveredJobs.transportador < 6 ||
  emergencyHealthGame.producaoAlimentar(recoveredJobs) <
    emergencyHealthGame.necessidadeAlimentos() ||
  emergencyHealthGame.saldoOperacional(recoveredJobs) < 0
) {
  throw new Error(
    `A recuperação sanitária madura não se sustentou por nove ciclos: ${JSON.stringify({ saude: emergencyHealthGame.estado.saudeColonia, medicamentos: emergencyHealthGame.estado.estoqueMedicamentos, reserva: emergencyHealthGame.reservaMedicamentos(), protecao: emergencyHealthGame.estado.ciclosProtecaoSanitaria, populacao: emergencyHealthGame.estado.populacaoColonia, fome: emergencyHealthGame.estado.colonosComFome, producao: emergencyHealthGame.producaoAlimentar(recoveredJobs), consumo: emergencyHealthGame.necessidadeAlimentos(), saldo: emergencyHealthGame.saldoOperacional(recoveredJobs), empregos: recoveredJobs })}.`,
  );
}

infrastructureGame.step(50);
const namedPrestigeHouses = infrastructureGame.fillTexts.filter(
  ([label]) =>
    label === "CASA DE PRESTÍGIO 1" ||
    label === "CASA DE PRESTÍGIO 2",
);
if (namedPrestigeHouses.length < 2) {
  throw new Error("As duas moradias de prestígio continuaram sem identificação individual.");
}
const secureInnerKeepStructures = [
  [7050, 2920, 500, 280],
  [7650, 2920, 500, 280],
  [8250, 2920, 500, 280],
  [8850, 2920, 500, 280],
  [7000, 5480, 440, 280],
  [7550, 5400, 650, 440],
  [8300, 5480, 440, 280],
  [8850, 5400, 560, 440],
];
if (
  !secureInnerKeepStructures.every(([sx, sy, sw, sh]) =>
    sx >= 6800 &&
    sy >= 2700 &&
    sx + sw <= 10300 &&
    sy + sh <= 6300 &&
    infrastructureGame.strokeRects.some(
      ([x, y, width, height]) =>
        x === sx && y === sy && width === sw && height === sh,
    ),
  )
) {
  throw new Error("Banco, clínica ou estoques valiosos ficaram fora do recinto interno.");
}

const legacyColonyStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 100,
      ouro: 100,
      jogador: { x: 5740, y: 2250 },
      inimigos: [],
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 4,
        economia: {
          coloniaIniciada: true,
          tesouro: 999,
          lavouraConstruida: true,
          pastagemConstruida: true,
          estoqueAlimentos: 80,
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 2800, y: 1800, zoom: 1 },
      },
    }),
  ],
]);
createHarness(legacyColonyStorage);
let legacyColonySave = JSON.parse(
  legacyColonyStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  legacyColonySave.ouro !== 2500 ||
  legacyColonySave.expansao.revisaoColonia !== 5 ||
  legacyColonySave.expansao.economia.tesouro !== 3000 ||
  legacyColonySave.expansao.economia.estoqueAlimentos !== 120 ||
  legacyColonySave.expansao.economia.celeiroConstruido ||
  legacyColonySave.expansao.construcao.etapa !== 0 ||
  !legacyColonySave.expansao.economia.coloniaIniciada ||
  legacyColonySave.jogador.x !== 12740 ||
  legacyColonySave.jogador.y !== 4500 ||
  legacyColonySave.expansao.camera.x !== 7800 ||
  legacyColonySave.expansao.camera.y !== 4050
) {
  throw new Error("Um save da colônia 5× não foi reiniciado uma vez no mapa 10×.");
}
legacyColonySave.ouro = 2600;
legacyColonySave.expansao.economia.tesouro = 1800;
legacyColonyStorage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify(legacyColonySave),
);
createHarness(legacyColonyStorage);
legacyColonySave = JSON.parse(
  legacyColonyStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  legacyColonySave.ouro !== 2600 ||
  legacyColonySave.expansao.economia.tesouro !== 1800
) {
  throw new Error("A reinicialização colonial foi aplicada mais de uma vez.");
}

const transferSourceStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      local: "assentamento",
      vida: 77,
      ouro: 1234.56,
      combate: { ataque: 3, armadura: 2 },
      jogador: { x: 700, y: 510 },
      inimigos: [],
      fazendeiro: { quantidade: 4, tempo: 3 },
      fruticultor: { quantidade: 2, tempo: 7 },
      pescador: { quantidade: 1, tempo: 11 },
      comerciante: { quantidade: 3, tempo: 2 },
      ferreiro: { quantidade: 2, tempo: 4 },
      mineiro: { quantidade: 5, tempo: 6 },
      banqueiro: { quantidade: 2, tempo: 8 },
      escritorio: { quantidade: 3, tempo: 9, fundo: 456.78 },
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 888.5,
          tempoTransferencia: 25,
          lavouraConstruida: true,
          tempoLavoura: 12,
          armazemGraosConstruido: true,
          hortaConstruida: true,
          armazemHortalicasConstruido: true,
          feijaoConstruido: true,
          armazemFeijaoConstruido: true,
          pastagemConstruida: true,
          tempoPastagem: 34,
          celeiroConstruido: true,
          moinhoConstruido: true,
          armazemFarinhaConstruido: true,
          padariaConstruida: true,
          armazemPaesConstruido: true,
          floresta: {
            cabanasLenhadores: 2,
            depositoMadeira: true,
            cabanaReflorestamento: true,
            cabanasColeta: 1,
            ervario: true,
            oficinaArmasMadeira: true,
            arsenalMadeira: true,
            flecharia: true,
            depositoFlechas: true,
          },
          defesas: {
            trechosPalicadaInterna: 2,
            trechosPalicadaExterna: 3,
            estagioInterno: 0,
            estagioExterno: 0,
          },
          obraAutomatica: null,
          tempoObraAutomatica: 0,
          estoqueAlimentos: 80,
          tempoNecessidades: 30,
          colonosComFome: 0,
          populacao: 33,
          casas: 7,
          administradoresMigracao: 3,
          cargasMigracao: 2,
          tempoRecargaMigracao: 25,
          tempoTentativaMigracao: 35,
          migracoesPendentes: [5],
          edificios: {
            mina: true,
            pedreira: true,
            caisPesca: true,
            segundoCaisPesca: true,
            mercadoPeixes: true,
            caisComercial: true,
            feitoria: true,
            estaleiro: true,
            ferraria: true,
            forja: true,
          },
          estoques: {
            graos: 66,
            hortalicas: 33,
            feijao: 22,
            farinha: 44,
            paes: 11,
            peixes: 55,
            arvores: 145,
            madeira: 88,
            ervas: 27,
            lancasMadeira: 14,
            arcos: 12,
            flechas: 240,
            minerio: 44,
            pedra: 73,
            ferramentas: 22,
            armas: 11,
            mercadorias: 17,
          },
          frota: {
            barcosPesca: 2,
            naviosMercantes: 3,
            progressoNavio: 4,
          },
        },
        construcao: { etapa: 4, tempo: 0 },
        camera: { x: 3100, y: 2100, zoom: 1.5 },
      },
    }),
  ],
]);
const transferSource = createHarness(transferSourceStorage);
transferSource.listeners.get("abrir-transferencia:click")();
if (!transferSource.elements.get("transferencia").open) {
  throw new Error("A janela de transferência de save não abriu.");
}
const transferCode = transferSource.elements.get("codigo-exportacao").value;
if (!transferCode.startsWith("ARQUEIRO1-")) {
  throw new Error("O código de transferência não foi gerado corretamente.");
}

const transferTargetStorage = new Map();
const transferTarget = createHarness(transferTargetStorage);
transferTarget.elements.get("codigo-importacao").value = transferCode;
transferTarget.listeners.get("importar-save:click")();
const transferredSave = JSON.parse(
  transferTargetStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  transferredSave.vida !== 77 ||
  transferredSave.ouro !== 1234.56 ||
  transferredSave.combate.ataque !== 3 ||
  transferredSave.combate.armadura !== 2 ||
  transferredSave.fazendeiro.quantidade !== 4 ||
  transferredSave.escritorio.fundo !== 456.78 ||
  !transferredSave.expansao.mapaComprado ||
  transferredSave.expansao.camera.x !== 3100 ||
  transferredSave.expansao.camera.y !== 2100 ||
  transferredSave.expansao.camera.zoom !== 1.5 ||
  transferredSave.expansao.revisaoColonia !== 5 ||
  transferredSave.expansao.construcao.etapa !== 4 ||
  transferredSave.expansao.construcao.tempo !== 0 ||
  !transferredSave.expansao.economia.coloniaIniciada ||
  transferredSave.expansao.economia.tesouro !== 888.5 ||
  transferredSave.expansao.economia.tempoTransferencia !== 25 ||
  !transferredSave.expansao.economia.lavouraConstruida ||
  transferredSave.expansao.economia.tempoLavoura !== 12 ||
  !transferredSave.expansao.economia.armazemGraosConstruido ||
  !transferredSave.expansao.economia.hortaConstruida ||
  !transferredSave.expansao.economia.armazemHortalicasConstruido ||
  !transferredSave.expansao.economia.feijaoConstruido ||
  !transferredSave.expansao.economia.armazemFeijaoConstruido ||
  !transferredSave.expansao.economia.pastagemConstruida ||
  transferredSave.expansao.economia.tempoPastagem !== 34 ||
  !transferredSave.expansao.economia.celeiroConstruido ||
  !transferredSave.expansao.economia.moinhoConstruido ||
  !transferredSave.expansao.economia.armazemFarinhaConstruido ||
  !transferredSave.expansao.economia.padariaConstruida ||
  !transferredSave.expansao.economia.armazemPaesConstruido ||
  transferredSave.expansao.economia.floresta.cabanasLenhadores !== 2 ||
  !transferredSave.expansao.economia.floresta.depositoMadeira ||
  !transferredSave.expansao.economia.floresta.cabanaReflorestamento ||
  transferredSave.expansao.economia.floresta.cabanasColeta !== 1 ||
  !transferredSave.expansao.economia.floresta.ervario ||
  !transferredSave.expansao.economia.floresta.oficinaArmasMadeira ||
  !transferredSave.expansao.economia.floresta.arsenalMadeira ||
  !transferredSave.expansao.economia.floresta.flecharia ||
  !transferredSave.expansao.economia.floresta.depositoFlechas ||
  transferredSave.expansao.economia.defesas.trechosPalicadaInterna !== 2 ||
  transferredSave.expansao.economia.defesas.trechosPalicadaExterna !== 3 ||
  transferredSave.expansao.economia.defesas.estagioInterno !== 0 ||
  transferredSave.expansao.economia.defesas.estagioExterno !== 0 ||
  transferredSave.expansao.economia.estoqueAlimentos !== 80 ||
  transferredSave.expansao.economia.tempoNecessidades !== 30 ||
  transferredSave.expansao.economia.populacao !== 33 ||
  transferredSave.expansao.economia.casas !== 7 ||
  transferredSave.expansao.economia.administradoresMigracao !== 3 ||
  transferredSave.expansao.economia.cargasMigracao !== 2 ||
  transferredSave.expansao.economia.tempoRecargaMigracao !== 25 ||
  transferredSave.expansao.economia.tempoTentativaMigracao !== 35 ||
  transferredSave.expansao.economia.migracoesPendentes[0] !== 5 ||
  !transferredSave.expansao.economia.edificios.mina ||
  !transferredSave.expansao.economia.edificios.pedreira ||
  !transferredSave.expansao.economia.edificios.caisPesca ||
  !transferredSave.expansao.economia.edificios.segundoCaisPesca ||
  !transferredSave.expansao.economia.edificios.mercadoPeixes ||
  !transferredSave.expansao.economia.edificios.caisComercial ||
  !transferredSave.expansao.economia.edificios.feitoria ||
  !transferredSave.expansao.economia.edificios.estaleiro ||
  !transferredSave.expansao.economia.edificios.ferraria ||
  !transferredSave.expansao.economia.edificios.forja ||
  transferredSave.expansao.economia.estoques.graos !== 66 ||
  transferredSave.expansao.economia.estoques.hortalicas !== 33 ||
  transferredSave.expansao.economia.estoques.feijao !== 22 ||
  transferredSave.expansao.economia.estoques.farinha !== 44 ||
  transferredSave.expansao.economia.estoques.paes !== 11 ||
  transferredSave.expansao.economia.estoques.peixes !== 55 ||
  transferredSave.expansao.economia.estoques.arvores !== 145 ||
  transferredSave.expansao.economia.estoques.madeira !== 88 ||
  transferredSave.expansao.economia.estoques.ervas !== 27 ||
  transferredSave.expansao.economia.estoques.lancasMadeira !== 14 ||
  transferredSave.expansao.economia.estoques.arcos !== 12 ||
  transferredSave.expansao.economia.estoques.flechas !== 240 ||
  transferredSave.expansao.economia.estoques.minerio !== 44 ||
  transferredSave.expansao.economia.estoques.pedra !== 73 ||
  transferredSave.expansao.economia.estoques.ferramentas !== 22 ||
  transferredSave.expansao.economia.estoques.armas !== 11 ||
  transferredSave.expansao.economia.estoques.mercadorias !== 17 ||
  transferredSave.expansao.economia.frota.barcosPesca !== 2 ||
  transferredSave.expansao.economia.frota.naviosMercantes !== 3 ||
  transferredSave.expansao.economia.frota.progressoNavio !== 4 ||
  !transferTarget.elements
    .get("resultado-transferencia")
    .textContent.includes("Save importado")
) {
  throw new Error("O save não foi transferido integralmente entre navegadores.");
}

transferTarget.elements.get("codigo-importacao").value = "CODIGO INVALIDO";
transferTarget.listeners.get("importar-save:click")();
const saveAfterInvalidImport = JSON.parse(
  transferTargetStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  saveAfterInvalidImport.vida !== 77 ||
  saveAfterInvalidImport.ouro !== 1234.56 ||
  !transferTarget.elements
    .get("resultado-transferencia")
    .textContent.startsWith("Não foi possível importar")
) {
  throw new Error("Um código inválido alterou o progresso atual.");
}
transferTarget.listeners.get("fechar-transferencia:click")();
if (transferTarget.elements.get("transferencia").open) {
  throw new Error("A janela de transferência de save não fechou.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "assentamento",
    vida: 100,
    ouro: 200,
    combate: { ataque: 1, armadura: 0 },
    jogador: { x: 500, y: 390 },
    inimigos: [],
    fazendeiro: { contratado: false, tempo: 0 },
  }),
);

const shopGame = createHarness(storage);
shopGame.listeners.get("abrir-loja:click")();
if (!shopGame.elements.get("loja").open) {
  throw new Error("A loja não abriu no assentamento.");
}
shopGame.listeners.get("melhorar-ataque:click")();
shopGame.listeners.get("melhorar-armadura:click")();

const shopSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  shopSave.ouro !== 0 ||
  shopSave.combate.ataque !== 2 ||
  shopSave.combate.armadura !== 1
) {
  throw new Error("As melhorias da loja não foram compradas ou salvas.");
}

const shopRestored = createHarness(storage);
if (shopRestored.elements.get("combate-status").textContent !== "ATQ 2 · ARM 1") {
  throw new Error("Os níveis de combate não foram restaurados.");
}

storage.set(
  "arqueiro-do-assentamento-v1",
  JSON.stringify({
    versao: 1,
    local: "floresta",
    vida: 1,
    ouro: 5,
    combate: { ataque: 1, armadura: 0 },
    jogador: { x: 500, y: 390 },
    inimigos: [
      {
        id: "inimigo-derrota",
        x: 500,
        y: 390,
        nivel: 1,
        vida: 3,
        velocidade: 24,
      },
    ],
    fazendeiro: { quantidade: 0, tempo: 0 },
  }),
);

const defeatGame = createHarness(storage);
for (let frame = 1; frame <= 15; frame += 1) {
  defeatGame.step(frame * 50);
}
const defeatSave = JSON.parse(storage.get("arqueiro-do-assentamento-v1"));
if (
  defeatSave.local !== "assentamento" ||
  defeatSave.vida !== 100 ||
  defeatSave.ouro !== -10 ||
  defeatGame.elements.get("ouro").textContent !== "-10" ||
  defeatGame.elements.get("patrimonio-pessoal").textContent !== "-10 ouro"
) {
  throw new Error("A derrota não retornou o jogador com a penalidade correta.");
}

const familyStorage = new Map();
const familyGame = createHarness(familyStorage);
Object.assign(familyGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 5,
  tesouroColonia: 1000,
  estoqueAlimentos: 200,
  saudeColonia: 100,
  colonosComFome: 0,
  celeiroConstruido: true,
  guildaConstrutoresConstruida: true,
  estoqueFerramentasMadeira: 40,
  kitFerramentasInicialRecebido: true,
  escolaConstruida: false,
  familiasColonia: [],
  criancasColonia: [],
});
familyGame.setRandom(0);
familyGame.atualizarNecessidades(60);
if (
  familyGame.estado.familiasColonia.length !== 10 ||
  familyGame.estado.criancasColonia.length !== 1 ||
  familyGame.quantidadeBebes() !== 1 ||
  familyGame.totalMoradores() !== 21 ||
  familyGame.elements.get("painel-populacao").textContent !== "21" ||
  familyGame.elements.get("registro-consumo").textContent !==
    "20,3 alimento / 60 s"
) {
  throw new Error(
    `O nascimento não criou um bebê dependente com família, alimento, moradia e prioridade escolar: ${JSON.stringify({ familias: familyGame.estado.familiasColonia.length, criancas: familyGame.estado.criancasColonia.length, bebes: familyGame.quantidadeBebes(), moradores: familyGame.totalMoradores(), painel: familyGame.elements.get("painel-populacao").textContent, consumo: familyGame.elements.get("registro-consumo").textContent, prioridade: familyGame.elements.get("prioridade-colonia-status").textContent })}.`,
  );
}
const tesouroAntesEscola = familyGame.estado.tesouroColonia;
familyGame.atualizarPrioridades(0);
if (
  familyGame.estado.obraAutomaticaColonia !== "escola" ||
  familyGame.estado.tesouroColonia !== tesouroAntesEscola - 550 ||
  familyGame.estado.escolaConstruida
) {
  throw new Error("A escola não começou como obra municipal prioritária de 550 de ouro.");
}
concluirObraAtiva(familyGame);
const familyJobs = familyGame.redistribuirTrabalhadores();
if (!familyGame.estado.escolaConstruida || familyJobs.professor !== 1) {
  throw new Error("A escola concluída não recebeu o professor essencial.");
}
const familySave = JSON.parse(
  familyStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  !familySave.expansao.economia.edificios.escola ||
  familySave.expansao.economia.familias.length !== 10 ||
  familySave.expansao.economia.criancas.length !== 1
) {
  throw new Error("Famílias, crianças e escola não foram preservadas no save.");
}

familyGame.setRandom(0.99);
familyGame.estado.criancasColonia[0].idade =
  familyGame.duracaoBebeColonia - 60;
familyGame.atualizarNecessidades(60);
if (
  familyGame.quantidadeBebes() !== 0 ||
  familyGame.quantidadeCriancas() !== 1
) {
  throw new Error("O bebê não passou corretamente para a infância.");
}
familyGame.estado.criancasColonia[0].idade =
  familyGame.duracaoInfanciaColonia - 60;
familyGame.atualizarNecessidades(60);
if (
  familyGame.estado.criancasColonia.length !== 0 ||
  familyGame.estado.populacaoColonia !== 21
) {
  throw new Error("A criança escolarizada não amadureceu como colono adulto.");
}
familyGame.step(100);
if (!familyGame.fillTexts.some(([texto]) => String(texto).startsWith("ESCOLA"))) {
  throw new Error("A escola não apareceu no mapa colonial.");
}

const educationPauseGame = createHarness(new Map());
Object.assign(educationPauseGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 5,
  estoqueAlimentos: 200,
  saudeColonia: 100,
  colonosComFome: 0,
  celeiroConstruido: true,
  escolaConstruida: false,
  familiasColonia: [],
  criancasColonia: [
    {
      id: "crianca-sem-escola",
      familiaId: null,
      idade: educationPauseGame.duracaoInfanciaColonia - 60,
    },
  ],
});
educationPauseGame.setRandom(0.99);
educationPauseGame.atualizarNecessidades(60);
if (
  educationPauseGame.estado.criancasColonia.length !== 1 ||
  educationPauseGame.estado.populacaoColonia !== 20 ||
  !educationPauseGame.elements
    .get("registro-proxima-maturidade")
    .textContent.includes("Pausada")
) {
  throw new Error("A maioridade não foi pausada quando faltavam escola e professor.");
}

const trailGame = createHarness(new Map());
const roadAuditGame = createHarness(new Map());
Object.assign(roadAuditGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 4,
  niveisEstradasColonia: Array(8).fill(0),
});
const todosCaminhosViarios = roadAuditGame.trechosEstradaColonia.flatMap(
  (trecho) => roadAuditGame.caminhosTrechoEstrada(trecho),
);
if (
  roadAuditGame.trechosEstradaColonia.length !== 8 ||
  todosCaminhosViarios.some((caminho) =>
    caminho.slice(1).some(
      (ponto, indice) =>
        ponto.x !== caminho[indice].x && ponto.y !== caminho[indice].y,
    ),
  )
) {
  throw new Error("A auditoria encontrou uma estrada diagonal ou alterou os 8 trechos financiáveis.");
}

const empregosComDeslocamento = [
  "administracao",
  "professor",
  "migracao",
  "celeiro",
  "pesca",
  "estaleiro",
  "moinho",
  "padaria",
  "acougue",
  "cozinhaCarne",
  "cozinhaHortalicas",
  "cozinhaFeijao",
  "conserveiro",
  "clinica",
  "armeiroMadeira",
  "flecheiro",
  "mina",
  "pedreira",
  "comercio",
  "ferraria",
  "forja",
  "armeiro",
  "transportador",
  "ferramenteiro",
  "bombeiro",
  "bibliotecario",
  "religioso",
  "feirante",
];
empregosComDeslocamento.forEach((tipo, indice) => {
  const rota = roadAuditGame.rotaMaisRapida(
    roadAuditGame.acessoCasa(indice),
    roadAuditGame.destinoEmprego(tipo, tipo === "pesca" ? 6 : 0),
  );
  if (
    rota.trechos.length === 0 ||
    rota.pontos.some((ponto, pontoIndice) => {
      if (pontoIndice === 0) return false;
      const anterior = rota.pontos[pontoIndice - 1];
      return ponto.x !== anterior.x && ponto.y !== anterior.y;
    })
  ) {
    throw new Error(`O emprego ${tipo} ainda corta lotes ou ignora a rede viária.`);
  }
});

roadAuditGame.estado.cemiterioConstruido = true;
const rotaCemiterio = roadAuditGame.rotaMaisRapida(
  roadAuditGame.acessoCasa(1),
  roadAuditGame.destinoEmprego("religioso", 1),
);
if (
  rotaCemiterio.trechos.length === 0 ||
  rotaCemiterio.pontos.some((ponto, indice) => {
    if (indice === 0) return false;
    const anterior = rotaCemiterio.pontos[indice - 1];
    return ponto.x !== anterior.x && ponto.y !== anterior.y;
  })
) {
  throw new Error("O trajeto da igreja ao cemitério distante deixou de ser ortogonal.");
}

const rotaDiretaSemMelhorias = roadAuditGame.rotaMaisRapida(
  { x: 4000, y: 2700 },
  { x: 5000, y: 4150 },
);
roadAuditGame.estado.niveisEstradasColonia = [0, 0, 0, 3, 0, 0, 0, 0];
const rotaFlorestalMaisRapida = roadAuditGame.rotaMaisRapida(
  { x: 4000, y: 2700 },
  { x: 5000, y: 4150 },
);
if (
  !rotaDiretaSemMelhorias.trechos.includes(0) ||
  rotaDiretaSemMelhorias.trechos.includes(3) ||
  !rotaFlorestalMaisRapida.trechos.includes(3) ||
  rotaFlorestalMaisRapida.custo >= rotaDiretaSemMelhorias.custo
) {
  throw new Error("Os moradores não escolheram o trajeto realmente mais rápido após uma melhoria viária.");
}

Object.assign(trailGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 4,
  estoqueAlimentos: 120,
  niveisEstradasColonia: Array(8).fill(0),
  estradasTerraConstruidas: false,
});
trailGame.resetDrawCalls();
trailGame.step(100);
if (
  !trailGame.lineSegments.some(
    ([x1, y1, x2, y2]) =>
      x1 === 5000 && y1 === 4150 && x2 === 6700 && y2 === 4150,
  ) ||
  trailGame.fillTexts.some(([texto]) => texto === "TERRA") ||
  trailGame.elements.get("edificio-estradas").textContent !== "Somente trilhas" ||
  trailGame.elements.get("registro-estradas-trilhas").textContent === "0 / 8"
) {
  throw new Error("O movimento inicial não marcou trilhas antes da construção de estradas.");
}

const roadStorage = new Map(infrastructureStorage);
const roadGame = createHarness(roadStorage);
Object.assign(roadGame.estado, {
  tesouroColonia: 50000,
  estoqueMadeira: 200,
  estoquePedra: 1000,
  niveisEstradasColonia: Array(8).fill(1),
  estradasTerraConstruidas: true,
  obraAutomaticaColonia: null,
  tempoObraAutomaticaColonia: 0,
  trechoEstradaEmObra: null,
});
const manutencaoAntesReforcos = roadGame.manutencaoMunicipal();
for (let trecho = 0; trecho < 8; trecho += 1) {
  const ouroAntes = roadGame.estado.tesouroColonia;
  const madeiraAntes = roadGame.estado.estoqueMadeira;
  roadGame.atualizarPrioridades(0);
  if (
    roadGame.estado.obraAutomaticaColonia !== "estradaSegmento" ||
    roadGame.estado.tesouroColonia !== ouroAntes - 220 ||
    roadGame.estado.estoqueMadeira !== madeiraAntes - 12
  ) {
    throw new Error(
      `O reforço viário de madeira não reservou ouro e madeira por trecho: ${JSON.stringify({ obra: roadGame.estado.obraAutomaticaColonia, ouroAntes, ouro: roadGame.estado.tesouroColonia, madeiraAntes, madeira: roadGame.estado.estoqueMadeira, niveis: roadGame.estado.niveisEstradasColonia })}.`,
    );
  }
  concluirObraAtiva(roadGame);
}
if (
  roadGame.quantidadeTrechosEstrada(2) !== 8 ||
  roadGame.quantidadeTrechosEstrada(3) !== 0
) {
  throw new Error("A rede começou o reforço de pedra antes de concluir a madeira.");
}
for (let trecho = 0; trecho < 8; trecho += 1) {
  const ouroAntes = roadGame.estado.tesouroColonia;
  const pedraAntes = roadGame.estado.estoquePedra;
  roadGame.atualizarPrioridades(0);
  if (
    roadGame.estado.obraAutomaticaColonia !== "estradaSegmento" ||
    roadGame.estado.tesouroColonia !== ouroAntes - 360 ||
    roadGame.estado.estoquePedra !== pedraAntes - 18
  ) {
    throw new Error("O reforço viário de pedra não reservou ouro e pedra por trecho.");
  }
  concluirObraAtiva(roadGame);
}
if (
  roadGame.quantidadeTrechosEstrada(3) !== 8 ||
  Math.abs(roadGame.multiplicadorProducaoEstradas() - 1.18) > 0.0001 ||
  Math.abs(roadGame.multiplicadorMovimentoEstradas() - 1.35) > 0.0001 ||
  Math.abs(roadGame.multiplicadorConstrucaoEstradas() - 1.25) > 0.0001 ||
  roadGame.manutencaoMunicipal() !== manutencaoAntesReforcos + 4
) {
  throw new Error("A rede concluída não aplicou eficiência e manutenção por nível.");
}
roadGame.resetDrawCalls();
roadGame.step(100);
if (
  !roadGame.fillTexts.some(([texto]) => texto === "PEDRA") ||
  roadGame.elements.get("edificio-estradas").textContent !== "Toda em pedra" ||
  roadGame.elements.get("registro-estradas-pedra").textContent !== "8 / 8" ||
  roadGame.elements.get("registro-estradas-producao").textContent !== "+18%" ||
  roadGame.elements.get("registro-estradas-movimento").textContent !== "+35%"
) {
  throw new Error("Os trechos reforçados com pedra não ficaram identificáveis no mapa.");
}
roadGame.atualizarPrioridades(0);
const fortificacoesEsperadas = [
  ...Array(4).fill(["muralhaPedraInterna", "trechosMuralhaPedraInterna"]),
  ...Array(4).fill(["muralhaPedraExterna", "trechosMuralhaPedraExterna"]),
  ...Array(8).fill(["torreMuralha", "quantidadeTorresMuralha"]),
  ...Array(7).fill(["portaoFortificado", "quantidadePortoesFortificados"]),
];
for (let indice = 0; indice < fortificacoesEsperadas.length; indice += 1) {
  const [obra, propriedade] = fortificacoesEsperadas[indice];
  if (indice > 0) roadGame.atualizarPrioridades(0);
  if (roadGame.estado.obraAutomaticaColonia !== obra) {
    throw new Error(`A fortificação de pedra saiu da ordem em ${obra}.`);
  }
  const quantidadeAntes = roadGame.estado[propriedade];
  concluirObraAtiva(roadGame);
  if (roadGame.estado[propriedade] !== quantidadeAntes + 1) {
    throw new Error(`A fortificação ${obra} não foi concluída isoladamente.`);
  }
}
roadGame.atualizarPrioridades(0);
if (roadGame.estado.obraAutomaticaColonia !== "patioTreino") {
  throw new Error("Estradas e fortificações concluídas não devolveram a prioridade ao treinamento.");
}
concluirObraAtiva(roadGame, 16);
if (!roadGame.estado.patioTreinoConstruido) {
  throw new Error("A rede de pedra e a equipe exclusiva não concluíram o pátio.");
}
const roadSave = JSON.parse(
  roadStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  roadSave.expansao.economia.edificios.estradas.niveis.some(
    (nivel) => nivel !== 3,
  ) ||
  createHarness(roadStorage).estado.niveisEstradasColonia.some(
    (nivel) => nivel !== 3,
  )
) {
  throw new Error("Os níveis segmentados das estradas não foram preservados no save.");
}

const legacyRoadStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          populacao: 20,
          casas: 4,
          edificios: { estradasTerra: true },
        },
        construcao: { etapa: 4, tempo: 0 },
      },
    }),
  ],
]);
if (
  createHarness(legacyRoadStorage).estado.niveisEstradasColonia.some(
    (nivel) => nivel !== 1,
  )
) {
  throw new Error("Um save antigo com estrada de terra não migrou para os oito trechos básicos.");
}

const defenseStorage = new Map();
const defenseGame = createHarness(defenseStorage);
Object.assign(defenseGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 6,
  tesouroColonia: 10000,
  estoqueAlimentos: 200,
  saudeColonia: 100,
  colonosComFome: 0,
  lavouraConstruida: true,
  armazemGraosConstruido: true,
  hortaConstruida: true,
  armazemHortalicasConstruido: true,
  feijaoConstruido: true,
  armazemFeijaoConstruido: true,
  pastagemConstruida: true,
  celeiroConstruido: true,
  moinhoConstruido: true,
  armazemFarinhaConstruido: true,
  padariaConstruida: true,
  armazemPaesConstruido: true,
  cabanaCacadoresConstruida: true,
  acougueConstruido: true,
  cozinhaCarneConstruida: true,
  cozinhaHortalicasConstruida: true,
  cozinhaFeijaoConstruida: true,
  defumadorioConstruido: true,
  adegaFriaConstruida: true,
  armazensInternosPedraConstruidos: true,
  companhiaTransportadoresConstruida: true,
  guildaConstrutoresConstruida: true,
  nivelOficinaFerramentas: 3,
  bancoColoniaConstruido: true,
  caisPescaConstruido: true,
  segundoCaisPescaConstruido: true,
  mercadoPeixesConstruido: true,
  quantidadeCabanasLenhadores: 2,
  depositoMadeiraConstruido: true,
  cabanaReflorestamentoConstruida: true,
  minaConstruida: true,
  pedreiraConstruida: true,
  caisComercialConstruido: true,
  feitoriaConstruida: true,
  ferrariaColoniaConstruida: true,
  estaleiroConstruido: true,
  forjaColoniaConstruida: true,
  quantidadeCabanasColeta: 2,
  ervarioConstruido: true,
  clinicaConstruida: true,
  oficinaArmasMadeiraConstruida: true,
  arsenalMadeiraConstruido: true,
  flechariaConstruida: true,
  depositoFlechasConstruido: true,
  trechosPalicadaInterna: 4,
  trechosPalicadaExterna: 4,
  cisternaConstruida: true,
  estradasTerraConstruidas: true,
  niveisEstradasColonia: Array(8).fill(3),
  saneamentoConstruido: true,
  quantidadePostosGuarda: 4,
  quantidadePocosPublicos: 4,
  saneamentoAvancadoConstruido: true,
  quartelBombeirosConstruido: true,
  escolaConstruida: true,
  bibliotecaConstruida: true,
  igrejaConstruida: true,
  mercadoPublicoConstruido: true,
  armeiroConstruido: true,
  cemiterioConstruido: true,
  trechosMuralhaPedraInterna: 4,
  trechosMuralhaPedraExterna: 4,
  quantidadeTorresMuralha: 8,
  quantidadePortoesFortificados: 7,
  estoqueLancasMadeira: 10,
  estoqueArcos: 10,
  estoqueFlechas: 200,
  estoqueArmas: 10,
  estoqueArmaduras: { couro: 10, reforcada: 10, malha: 5, placas: 5 },
});
defenseGame.atualizarPrioridades(0);
if (
  defenseGame.estado.obraAutomaticaColonia !== "patioTreino" ||
  defenseGame.estado.tesouroColonia !== 9350
) {
  throw new Error("O pátio de treino não começou como prioridade municipal tardia de 650 ouro.");
}
concluirObraAtiva(defenseGame);
defenseGame.atualizarDefesa(60);
if (
  !defenseGame.estado.patioTreinoConstruido ||
  defenseGame.estado.quantidadeMilicianos !== 1 ||
  defenseGame.estado.estoqueLancasMadeira !== 9 ||
  defenseGame.estado.estoqueArmaduras.couro !== 9 ||
  defenseGame.estado.tesouroColonia !== 9290 ||
  defenseGame.folhaSoldos() !== 1
) {
  throw new Error("A milícia não foi contratada, equipada e debitada corretamente.");
}
const despesasAntesSegundaContratacao = defenseGame.despesasEssenciais();
defenseGame.atualizarOrcamento(60);
defenseGame.atualizarDefesa(60);
if (
  defenseGame.estado.quantidadeMilicianos !== 2 ||
  defenseGame.estado.tesouroColonia !==
    9290 - despesasAntesSegundaContratacao - 60
) {
  throw new Error("O orçamento não pagou despesas essenciais antes da contratação seguinte.");
}
for (let ciclo = 0; ciclo < 3; ciclo += 1) {
  defenseGame.atualizarOrcamento(60);
  defenseGame.atualizarDefesa(60);
}
defenseGame.atualizarPrioridades(0);
if (
  defenseGame.estado.quantidadeMilicianos !== 5 ||
  defenseGame.estado.obraAutomaticaColonia !== "campoGuarda" ||
  defenseGame.estado.tesouroColonia < 2500
) {
  throw new Error("A ampliação para a guarda não respeitou cinco milicianos e a reserva municipal.");
}
concluirObraAtiva(defenseGame);
defenseGame.atualizarDefesa(60);
if (
  !defenseGame.estado.campoGuardaConstruido ||
  defenseGame.estado.quantidadeGuardas !== 1 ||
  defenseGame.segurancaCivil() !== 41
) {
  throw new Error("A guarda municipal não elevou a segurança civil depois da ampliação.");
}
defenseGame.resetDrawCalls();
defenseGame.step(100);
if (
  !defenseGame.fillTexts.some(([texto]) =>
    String(texto).includes("CAMPO DE TREINAMENTO DA GUARDA"),
  ) ||
  !defenseGame.fillRects.some(([, , largura, altura]) =>
    largura === 6 && altura === 6,
  )
) {
  throw new Error("O campo de treinamento ou a patrulha identificável da guarda não foi desenhado.");
}
const defenseSave = JSON.parse(
  defenseStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  defenseSave.expansao.economia.defesas.milicia.total !== 5 ||
  defenseSave.expansao.economia.defesas.guardas.total !== 1 ||
  !defenseSave.expansao.economia.defesas.campoGuarda
) {
  throw new Error("Edifícios, efetivos e equipamentos de defesa não foram preservados no save.");
}

const reserveGame = createHarness(new Map());
Object.assign(reserveGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  tesouroColonia: 2559,
  patioTreinoConstruido: true,
  estoqueLancasMadeira: 5,
});
reserveGame.atualizarDefesa(60);
if (
  reserveGame.estado.quantidadeMilicianos !== 0 ||
  reserveGame.estado.tesouroColonia !== 2559 ||
  !reserveGame.elements
    .get("defesa-proxima-contratacao")
    .textContent.includes("reserva")
) {
  throw new Error("O recrutamento não preservou a reserva municipal de 2.500 ouro.");
}
Object.assign(reserveGame.estado, {
  quantidadeMilicianos: 10,
  quantidadeGuardas: 10,
  quantidadeSoldados: 10,
  ciclosSoldosAtrasados: 0,
});
if (
  reserveGame.folhaSoldos() !== 70 ||
  reserveGame.limiteSoldos() !== 81 ||
  reserveGame.segurancaCivil() !== 90 ||
  reserveGame.forcaMilitar() !== 100
) {
  throw new Error("O efetivo completo não permaneceu dentro do teto sustentável de soldos.");
}

const budgetGame = createHarness(defenseStorage);
Object.assign(budgetGame.estado, {
  tesouroColonia: 10000,
  populacaoColonia: 150,
  quantidadeCasasColonia: 30,
  quantidadeMilicianos: 10,
  quantidadeGuardas: 10,
  quantidadeSoldados: 10,
  cisternaConstruida: true,
  estradasTerraConstruidas: true,
  niveisEstradasColonia: Array(8).fill(3),
  saneamentoConstruido: true,
  quantidadePostosGuarda: 4,
});
const empregosOrcados = budgetGame.redistribuirTrabalhadores();
if (
  budgetGame.saldoOperacional() <= 0 ||
  empregosOrcados.geral <= 0 ||
  budgetGame.reservaMunicipal() < 2500
) {
  throw new Error("A distribuição de trabalho não preservou folha, saldo e reserva sustentáveis.");
}
const tesouroAntesOrcamento = budgetGame.estado.tesouroColonia;
budgetGame.atualizarOrcamento(60);
if (
  budgetGame.estado.tesouroColonia !==
    tesouroAntesOrcamento - budgetGame.estado.ultimaDespesaMunicipal ||
  budgetGame.estado.ultimaDespesaMunicipal <= 0 ||
  budgetGame.elements.get("orcamento-colonia-status").textContent.includes(
    "Sustentável",
  ) === false
) {
  throw new Error("O ciclo orçamentário não pagou folha, soldos e manutenção na ordem prevista.");
}
budgetGame.resetDrawCalls();
budgetGame.step(100);
if (
  !budgetGame.fillTexts.some(([texto]) => texto === "POÇO E CISTERNA") ||
  !budgetGame.fillTexts.some(
    ([texto]) =>
      texto === "LINHAS AZUIS · REDE SUBTERRÂNEA DE ÁGUA E ESGOTO",
  ) ||
  !budgetGame.fillTexts.some(([texto]) => texto === "POSTO 1")
) {
  throw new Error("As obras públicas concluídas não apareceram no mapa colonial.");
}
const budgetSave = JSON.parse(
  defenseStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  !budgetSave.expansao.economia.edificios.cisterna ||
  !budgetSave.expansao.economia.edificios.estradasTerra ||
  !budgetSave.expansao.economia.edificios.saneamento ||
  budgetSave.expansao.economia.edificios.postosGuarda !== 4 ||
  budgetSave.expansao.economia.orcamento.ultimaDespesa <= 0
) {
  throw new Error("Orçamento e obras públicas não foram preservados no save.");
}

const expectedRoadOrder = [
  "centro",
  "moradias",
  "campos",
  "floresta",
  "recursos",
  "costa",
  "caisNorte",
  "caisSul",
];
if (
  JSON.stringify(budgetGame.trechosEstradaColonia.map(({ id }) => id)) !==
  JSON.stringify(expectedRoadOrder)
) {
  throw new Error("A ordem canônica dos oito grupos viários foi alterada.");
}

const wallAuditGame = createHarness(new Map());
const {
  recintoExterno: outerWard,
  recintoInterno: innerWard,
  portoesMuralhaColonia: auditedGates,
  cantosTorresMuralhaColonia: auditedTowers,
  areasPostosGuardaColonia: auditedGuardPosts,
  totalTorresMuralhaColonia: auditedTowerTotal,
  totalPortoesFortificadosColonia: auditedGateTotal,
  meiaAberturaPortaoColonia: auditedGateHalfOpening,
} = wallAuditGame.defesasAuditadas;
const wards = [outerWard, innerWard];
const betweenInclusive = (value, start, end) =>
  value >= Math.min(start, end) && value <= Math.max(start, end);
const roadWallCrossings = new Set();
wallAuditGame.arestasRedeViaria().forEach(({ inicio, fim }) => {
  wards.forEach((ward) => {
    const left = ward.x;
    const right = ward.x + ward.largura;
    const top = ward.y;
    const bottom = ward.y + ward.altura;
    if (inicio.y === fim.y && betweenInclusive(inicio.y, top, bottom)) {
      [left, right].forEach((x) => {
        if (betweenInclusive(x, inicio.x, fim.x)) {
          roadWallCrossings.add(`${x},${inicio.y}`);
        }
      });
    }
    if (inicio.x === fim.x && betweenInclusive(inicio.x, left, right)) {
      [top, bottom].forEach((y) => {
        if (betweenInclusive(y, inicio.y, fim.y)) {
          roadWallCrossings.add(`${inicio.x},${y}`);
        }
      });
    }
  });
});
const gateCrossings = new Set(auditedGates.map(({ x, y }) => `${x},${y}`));
if (
  roadWallCrossings.size !== auditedGateTotal ||
  gateCrossings.size !== auditedGateTotal ||
  [...roadWallCrossings].some((crossing) => !gateCrossings.has(crossing)) ||
  [...gateCrossings].some((crossing) => !roadWallCrossings.has(crossing))
) {
  throw new Error("Cada cruzamento entre estrada e muralha deve possuir exatamente um portão.");
}

const expectedTowerCorners = new Set(
  wards.flatMap((ward) => [
    `${ward.x},${ward.y}`,
    `${ward.x + ward.largura},${ward.y}`,
    `${ward.x},${ward.y + ward.altura}`,
    `${ward.x + ward.largura},${ward.y + ward.altura}`,
  ]),
);
const towerCorners = new Set(auditedTowers.map(({ x, y }) => `${x},${y}`));
if (
  auditedTowerTotal !== 8 ||
  towerCorners.size !== 8 ||
  [...expectedTowerCorners].some((corner) => !towerCorners.has(corner)) ||
  auditedGateTotal !== 7
) {
  throw new Error("Torres e portões não cobrem os cantos e cruzamentos dos dois recintos.");
}

const segmentIntersectsArea = (edge, area, margin = 45) => {
  const left = area.x - margin;
  const right = area.x + area.largura + margin;
  const top = area.y - margin;
  const bottom = area.y + area.altura + margin;
  if (edge.inicio.y === edge.fim.y) {
    return betweenInclusive(edge.inicio.y, top, bottom) &&
      Math.max(Math.min(edge.inicio.x, edge.fim.x), left) <=
        Math.min(Math.max(edge.inicio.x, edge.fim.x), right);
  }
  return betweenInclusive(edge.inicio.x, left, right) &&
    Math.max(Math.min(edge.inicio.y, edge.fim.y), top) <=
      Math.min(Math.max(edge.inicio.y, edge.fim.y), bottom);
};
const auditedRoadEdges = wallAuditGame.arestasRedeViaria();
if (
  auditedGuardPosts.length !== 4 ||
  auditedGuardPosts.some((post) =>
    auditedRoadEdges.some((edge) => segmentIntersectsArea(edge, post)),
  )
) {
  throw new Error("Um posto da guarda ainda obstrui a faixa de uma estrada.");
}

const normalizedWallSegments = [];
wards.forEach((ward) => {
  const sides = [
    { name: "norte", horizontal: true, fixed: ward.y, start: ward.x, end: ward.x + ward.largura },
    { name: "leste", horizontal: false, fixed: ward.x + ward.largura, start: ward.y, end: ward.y + ward.altura },
    { name: "sul", horizontal: true, fixed: ward.y + ward.altura, start: ward.x, end: ward.x + ward.largura },
    { name: "oeste", horizontal: false, fixed: ward.x, start: ward.y, end: ward.y + ward.altura },
  ];
  sides.forEach((side) => {
    const openings = auditedGates
      .filter(({ recinto, lado }) => recinto === ward && lado === side.name)
      .map((gate) => side.horizontal ? gate.x : gate.y)
      .sort((a, b) => a - b);
    let cursor = side.start;
    openings.forEach((center) => {
      const before = Math.max(side.start, center - auditedGateHalfOpening);
      const after = Math.min(side.end, center + auditedGateHalfOpening);
      if (before > cursor) {
        normalizedWallSegments.push(side.horizontal
          ? { inicio: { x: cursor, y: side.fixed }, fim: { x: before, y: side.fixed } }
          : { inicio: { x: side.fixed, y: cursor }, fim: { x: side.fixed, y: before } });
      }
      cursor = Math.max(cursor, after);
    });
    if (cursor < side.end) {
      normalizedWallSegments.push(side.horizontal
        ? { inicio: { x: cursor, y: side.fixed }, fim: { x: side.end, y: side.fixed } }
        : { inicio: { x: side.fixed, y: cursor }, fim: { x: side.fixed, y: side.end } });
    }
  });
});
if (
  auditedGuardPosts.some((post) =>
    normalizedWallSegments.some((edge) => segmentIntersectsArea(edge, post, 9)),
  )
) {
  throw new Error("Um posto da guarda ainda invade uma muralha.");
}
const expectedGuardPostSides = ["norte", "leste", "sul", "oeste"];
const outerCenter = {
  x: outerWard.x + outerWard.largura / 2,
  y: outerWard.y + outerWard.altura / 2,
};
const guardPostCenters = Object.fromEntries(
  auditedGuardPosts.map((post) => [
    post.lado,
    {
      x: post.x + post.largura / 2,
      y: post.y + post.altura / 2,
    },
  ]),
);
if (
  JSON.stringify(auditedGuardPosts.map(({ lado }) => lado)) !==
    JSON.stringify(expectedGuardPostSides) ||
  auditedGuardPosts.some((post) => !(
    post.x >= outerWard.x &&
    post.y >= outerWard.y &&
    post.x + post.largura <= outerWard.x + outerWard.largura &&
    post.y + post.altura <= outerWard.y + outerWard.altura
  )) ||
  Math.abs(guardPostCenters.norte.x + guardPostCenters.sul.x - 2 * outerCenter.x) > 1 ||
  Math.abs(guardPostCenters.norte.y + guardPostCenters.sul.y - 2 * outerCenter.y) > 1 ||
  Math.abs(guardPostCenters.leste.x + guardPostCenters.oeste.x - 2 * outerCenter.x) > 1 ||
  Math.abs(guardPostCenters.leste.y + guardPostCenters.oeste.y - 2 * outerCenter.y) > 1
) {
  throw new Error("Os quatro postos não ficaram um por lado, internos e simétricos na muralha externa.");
}
const rectanglesOverlap = (first, second, margin = 0) =>
  first.x - margin < second.x + second.largura + margin &&
  first.x + first.largura + margin > second.x - margin &&
  first.y - margin < second.y + second.altura + margin &&
  first.y + first.altura + margin > second.y - margin;
const buildingsWithoutGuardPosts =
  wallAuditGame.infraestruturaHidricaAuditada.areasEdificadas.filter(
    (area) => !auditedGuardPosts.includes(area),
  );
if (
  auditedGuardPosts.some((post) =>
    buildingsWithoutGuardPosts.some((building) =>
      rectanglesOverlap(post, building, 5),
    ),
  )
) {
  throw new Error("Um posto da guarda ainda invade outro edifício.");
}
const fortifiedGatePiers = auditedGates.flatMap((gate) => {
  const horizontal = gate.lado === "norte" || gate.lado === "sul";
  return horizontal
    ? [
        { x: gate.x - 136, y: gate.y - 52, largura: 88, altura: 104 },
        { x: gate.x + 48, y: gate.y - 52, largura: 88, altura: 104 },
      ]
    : [
        { x: gate.x - 52, y: gate.y - 136, largura: 104, altura: 88 },
        { x: gate.x - 52, y: gate.y + 48, largura: 104, altura: 88 },
      ];
});
if (
  auditedGuardPosts.some((post) =>
    fortifiedGatePiers.some((pier) => rectanglesOverlap(post, pier, 5)),
  )
) {
  throw new Error("Um posto da guarda ainda invade a estrutura de um portão fortificado.");
}

const resourceGateRoute = wallAuditGame.rotaMaisRapida(
  { x: 4400, y: 5520 },
  { x: 6900, y: 5520 },
);
const trainingGateRoute = wallAuditGame.rotaMaisRapida(
  { x: 6700, y: 7400 },
  { x: 7200, y: 8060 },
);
const routeCrossesPoint = (route, x, y) =>
  route.pontos.some((point, index) => {
    const next = route.pontos[index + 1];
    if (!next) return point.x === x && point.y === y;
    return (
      point.y === next.y && point.y === y && betweenInclusive(x, point.x, next.x)
    ) || (
      point.x === next.x && point.x === x && betweenInclusive(y, point.y, next.y)
    );
  });
if (
  resourceGateRoute.distanciaForaRede !== 0 ||
  trainingGateRoute.distanciaForaRede !== 0 ||
  !routeCrossesPoint(resourceGateRoute, 5000, 5520) ||
  !routeCrossesPoint(resourceGateRoute, 6800, 5520) ||
  !routeCrossesPoint(trainingGateRoute, 6700, 7500)
) {
  throw new Error("As novas passagens não conectam recursos, recinto interno e campo de treino pela rede.");
}

Object.assign(wallAuditGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  niveisEstradasColonia: Array(8).fill(3),
  trechosPalicadaInterna: 4,
  trechosPalicadaExterna: 4,
  trechosMuralhaPedraInterna: 4,
  trechosMuralhaPedraExterna: 4,
  quantidadeTorresMuralha: 8,
  quantidadePortoesFortificados: 7,
  quantidadePostosGuarda: 4,
});
wallAuditGame.resetDrawCalls();
wallAuditGame.step(100);
wallAuditGame.atualizarInterface();
const drawnStoneWalls = new Set(
  wallAuditGame.lineSegments
    .filter((segment) => segment[4] === "#747a76" && segment[5] === 18)
    .map(([x1, y1, x2, y2]) => `${x1},${y1},${x2},${y2}`),
);
const expectedStoneWalls = new Set(
  normalizedWallSegments.map(
    ({ inicio, fim }) => `${inicio.x},${inicio.y},${fim.x},${fim.y}`,
  ),
);
if (
  drawnStoneWalls.size !== expectedStoneWalls.size ||
  [...expectedStoneWalls].some((segment) => !drawnStoneWalls.has(segment))
) {
  throw new Error("Os trechos visuais das muralhas não fecham os dois recintos até os portões.");
}
if (
  wallAuditGame.fillTexts.filter(([text]) => text === "PORTÃO DE PEDRA").length !== 7 ||
  [1, 2, 3, 4].some(
    (number) => !wallAuditGame.fillTexts.some(([text]) => text === `POSTO ${number}`),
  ) ||
  wallAuditGame.elements.get("edificio-defesa-pedra").textContent !== "23 / 23 obras"
) {
  throw new Error("Portões, postos ou o total auditado de fortificações não aparecem corretamente.");
}
auditedGates.forEach(({ x, y, lado }) => {
  const horizontal = lado === "norte" || lado === "sul";
  if (
    !wallAuditGame.fillRects.some(
      ([rectX, rectY, width, height]) =>
        rectX === x - (horizontal ? 54 : 12) &&
        rectY === y - (horizontal ? 12 : 54) &&
        width === (horizontal ? 108 : 24) &&
        height === (horizontal ? 24 : 108),
    )
  ) {
    throw new Error(`O portão em ${x},${y} deixou uma abertura vazia na muralha.`);
  }
});
if (
  html.indexOf("desenharObrasPublicasColonia();") >
  html.indexOf("desenharPortoesETorresColonia();")
) {
  throw new Error("Os portões precisam ser desenhados sobre as estradas, sem desaparecer sob elas.");
}

const hydraulicAuditGame = createHarness(new Map());
const {
  areaCisternaColonia: auditedCistern,
  posicoesPocosPublicosColonia: auditedWells,
  raioPocoPublicoColonia: auditedWellRadius,
  redeHidricaBasicaColonia: basicHydraulicNetwork,
  redeHidricaAvancadaColonia: advancedHydraulicNetwork,
  areasEdificadas: hydraulicBuildingAreas,
} = hydraulicAuditGame.infraestruturaHidricaAuditada;
const hydraulicPaths = [
  ...basicHydraulicNetwork.map((path) => ({ ...path, type: "basic" })),
  ...advancedHydraulicNetwork.map((path) => ({ ...path, type: "advanced" })),
];
const hydraulicSegments = hydraulicPaths.flatMap((path) =>
  path.pontos.slice(1).map((end, index) => ({
    inicio: path.pontos[index],
    fim: end,
    path,
    index,
  })),
);
if (
  auditedWells.length !== 4 ||
  JSON.stringify(auditedWells.map(({ id }) => id)) !==
    JSON.stringify(["oeste", "sul", "norte", "leste"]) ||
  hydraulicSegments.some(
    ({ inicio, fim }) =>
      (inicio.x !== fim.x && inicio.y !== fim.y) ||
      (inicio.x === fim.x && inicio.y === fim.y),
  )
) {
  throw new Error("A rede hidrossanitária não preservou quatro setores e traçado ortogonal.");
}

const distancePointToSegment = (point, edge) => {
  if (edge.inicio.x === edge.fim.x) {
    return Math.hypot(
      point.x - edge.inicio.x,
      point.y - Math.max(
        Math.min(point.y, Math.max(edge.inicio.y, edge.fim.y)),
        Math.min(edge.inicio.y, edge.fim.y),
      ),
    );
  }
  return Math.hypot(
    point.x - Math.max(
      Math.min(point.x, Math.max(edge.inicio.x, edge.fim.x)),
      Math.min(edge.inicio.x, edge.fim.x),
    ),
    point.y - edge.inicio.y,
  );
};
const distancePointToArea = (point, area) => {
  const nearestX = Math.max(area.x, Math.min(point.x, area.x + area.largura));
  const nearestY = Math.max(area.y, Math.min(point.y, area.y + area.altura));
  return Math.hypot(point.x - nearestX, point.y - nearestY);
};
const housingAreas = Array.from({ length: 90 }, (_, index) => {
  const position = hydraulicAuditGame.posicaoCasa(index);
  return { ...position, largura: 130, altura: 105 };
});
const allOccupiedAreas = [
  ...hydraulicBuildingAreas,
  ...housingAreas,
  auditedCistern,
];
if (
  auditedWells.some((well) =>
    !(
      well.x - auditedWellRadius > outerWard.x &&
      well.x + auditedWellRadius < outerWard.x + outerWard.largura &&
      well.y - auditedWellRadius > outerWard.y &&
      well.y + auditedWellRadius < outerWard.y + outerWard.altura
    ) ||
    distancePointToArea(well, innerWard) <= auditedWellRadius + 20 ||
    allOccupiedAreas.some(
      (area) => distancePointToArea(well, area) <= auditedWellRadius + 20,
    ) ||
    auditedRoadEdges.some(
      (edge) => distancePointToSegment(well, edge) <= auditedWellRadius + 60,
    ) ||
    normalizedWallSegments.some(
      (edge) => distancePointToSegment(well, edge) <= auditedWellRadius + 20,
    ),
  )
) {
  throw new Error("Um poço ainda ocupa estrada, muralha, recinto interno ou área edificada.");
}
for (let firstIndex = 0; firstIndex < auditedWells.length; firstIndex += 1) {
  for (let secondIndex = firstIndex + 1; secondIndex < auditedWells.length; secondIndex += 1) {
    if (
      Math.hypot(
        auditedWells[firstIndex].x - auditedWells[secondIndex].x,
        auditedWells[firstIndex].y - auditedWells[secondIndex].y,
      ) <= auditedWellRadius * 2 + 40
    ) {
      throw new Error("Dois poços públicos ainda se sobrepõem.");
    }
  }
}

advancedHydraulicNetwork.forEach((branch) => {
  const well = auditedWells.find(({ id }) => id === branch.poco);
  const terminal = branch.pontos.at(-1);
  if (
    !well ||
    Math.abs(Math.hypot(terminal.x - well.x, terminal.y - well.y) - auditedWellRadius) > 0.001
  ) {
    throw new Error(`O ramal ${branch.id} não termina na borda do poço correspondente.`);
  }
});
auditedWells.forEach((well) => {
  const connectedBranch = advancedHydraulicNetwork.find(
    ({ poco }) => poco === well.id,
  );
  hydraulicSegments.forEach((segment) => {
    const isOwnTerminal =
      segment.path.id === connectedBranch.id &&
      segment.index === connectedBranch.pontos.length - 2;
    const distance = distancePointToSegment(well, segment);
    if (
      (isOwnTerminal && Math.abs(distance - auditedWellRadius) > 0.001) ||
      (!isOwnTerminal && distance < auditedWellRadius + 12)
    ) {
      throw new Error(`Uma tubulação ainda atravessa o poço ${well.id}.`);
    }
  });
});

const hydraulicWallCrossings = new Set();
hydraulicSegments.forEach((edge) => {
  wards.forEach((ward) => {
    const left = ward.x;
    const right = ward.x + ward.largura;
    const top = ward.y;
    const bottom = ward.y + ward.altura;
    if (edge.inicio.y === edge.fim.y && betweenInclusive(edge.inicio.y, top, bottom)) {
      [left, right].forEach((x) => {
        if (betweenInclusive(x, edge.inicio.x, edge.fim.x)) {
          hydraulicWallCrossings.add(`${x},${edge.inicio.y}`);
        }
      });
    }
    if (edge.inicio.x === edge.fim.x && betweenInclusive(edge.inicio.x, left, right)) {
      [top, bottom].forEach((y) => {
        if (betweenInclusive(y, edge.inicio.y, edge.fim.y)) {
          hydraulicWallCrossings.add(`${edge.inicio.x},${y}`);
        }
      });
    }
  });
});
const expectedHydraulicGateCrossings = new Set(["6800,4150", "10300,4150"]);
if (
  hydraulicWallCrossings.size !== expectedHydraulicGateCrossings.size ||
  [...hydraulicWallCrossings].some(
    (crossing) =>
      !expectedHydraulicGateCrossings.has(crossing) ||
      !gateCrossings.has(crossing),
  )
) {
  throw new Error("Uma tubulação ainda cruza muralha fora de um portão auditado.");
}

const pipelineOccupiedAreas = [...hydraulicBuildingAreas, ...housingAreas];
if (
  hydraulicSegments.some((segment) =>
    pipelineOccupiedAreas.some((area) =>
      segmentIntersectsArea(segment, area, 12),
    ),
  ) ||
  !basicHydraulicNetwork.some(({ pontos }) =>
    pontos.some(
      (point) =>
        point.x === auditedCistern.x + auditedCistern.largura &&
        point.y === auditedCistern.y + auditedCistern.altura / 2,
    ),
  )
) {
  throw new Error("A rede hidrossanitária ainda invade um edifício ou perdeu a cisterna.");
}

Object.assign(hydraulicAuditGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  niveisEstradasColonia: Array(8).fill(3),
  cisternaConstruida: true,
  saneamentoConstruido: true,
  quantidadePocosPublicos: 4,
  saneamentoAvancadoConstruido: true,
  quartelBombeirosConstruido: true,
  empregosColonia: {
    ...hydraulicAuditGame.estado.empregosColonia,
    bombeiro: 4,
  },
});
const auditedFullFireProtection = hydraulicAuditGame.protecaoIncendio();
hydraulicAuditGame.resetDrawCalls();
hydraulicAuditGame.step(100);
hydraulicAuditGame.atualizarInterface();
if (
  hydraulicAuditGame.lineSegments.filter(
    (segment) => segment[4] === "#4d7370" && segment[5] === 12,
  ).length !== basicHydraulicNetwork.reduce(
    (total, path) => total + path.pontos.length - 1,
    0,
  ) ||
  hydraulicAuditGame.lineSegments.filter(
    (segment) => segment[4] === "#326d82" && segment[5] === 10,
  ).length !== advancedHydraulicNetwork.reduce(
    (total, path) => total + path.pontos.length - 1,
    0,
  ) ||
  auditedWells.some(
    ({ nome }, index) =>
      !hydraulicAuditGame.fillTexts.some(
        ([text]) => text === `POÇO ${index + 1} · ${nome}`,
      ),
  ) ||
  !hydraulicAuditGame.fillTexts.some(
    ([text]) => text === "LINHAS AZUIS · REDE SUBTERRÂNEA DE ÁGUA E ESGOTO",
  ) ||
  !hydraulicAuditGame.elements
    .get("registro-saneamento-ampliado")
    .textContent.includes("3 bairros + setor leste") ||
  auditedFullFireProtection !== 100
) {
  throw new Error("Poços, tubulações, legenda ou proteção contra incêndio não reconciliaram no mapa.");
}

const legacyFortificationStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          populacao: 20,
          casas: 4,
          defesas: { torres: 4, portoes: 2 },
        },
        construcao: { etapa: 4, tempo: 0 },
      },
    }),
  ],
]);
const legacyFortificationGame = createHarness(legacyFortificationStorage);
if (
  legacyFortificationGame.estado.quantidadeTorresMuralha !== 4 ||
  legacyFortificationGame.estado.quantidadePortoesFortificados !== 2
) {
  throw new Error("A ampliação defensiva alterou uma fortificação existente no save.");
}

const housingGame = createHarness(new Map());
Object.assign(housingGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 126,
  quantidadeCasasColonia: 26,
  tesouroColonia: 20000,
  estoqueAlimentos: 200,
  saudeColonia: 100,
  lavouraConstruida: true,
  armazemGraosConstruido: true,
  hortaConstruida: true,
  armazemHortalicasConstruido: true,
  feijaoConstruido: true,
  armazemFeijaoConstruido: true,
  pastagemConstruida: true,
  celeiroConstruido: true,
  moinhoConstruido: true,
  armazemFarinhaConstruido: true,
  padariaConstruida: true,
  armazemPaesConstruido: true,
  guildaConstrutoresConstruida: true,
  estoqueFerramentasMadeira: 40,
  kitFerramentasInicialRecebido: true,
  cisternaConstruida: true,
  niveisEstradasColonia: Array(8).fill(3),
  estradasTerraConstruidas: true,
});
if (
  housingGame.proximaObra() !== "segundoBlocoMoradias" ||
  housingGame.casasNecessarias() !== 28 ||
  housingGame.reservaMoradia() !== 13
) {
  throw new Error("O segundo bairro não antecipou a reserva de moradia da cidade madura.");
}
const expectedHousingWorks = [
  ["segundoBlocoMoradias", "segundoBlocoMoradiasConstruido"],
  ["moradia", null],
  ["moradia", null],
  ["companhiaTransportadores", "companhiaTransportadoresConstruida"],
  ["cabanaColeta", null],
  ["ervario", "ervarioConstruido"],
  ["clinica", "clinicaConstruida"],
  ["saneamento", "saneamentoConstruido"],
  ["pocoPublico", null],
  ["pocoPublico", null],
  ["cabanaCacadores", "cabanaCacadoresConstruida"],
  ["acougue", "acougueConstruido"],
  ["cozinhaCarne", "cozinhaCarneConstruida"],
];
for (const [work, flag] of expectedHousingWorks) {
  housingGame.atualizarPrioridades(0);
  if (housingGame.estado.obraAutomaticaColonia !== work) {
    throw new Error(`A fila autônoma não iniciou ${work} na ordem planejada.`);
  }
  concluirObraAtiva(housingGame);
  if (flag && !housingGame.estado[flag]) {
    throw new Error(`A obra ${work} não foi concluída nem registrada.`);
  }
}
if (
  housingGame.estado.quantidadeCasasColonia !== 28 ||
  housingGame.capacidadeMoradias() !== 140 ||
  housingGame.maximoCasasDisponiveis() !== 60 ||
  housingGame.vagasMigracao() !== 1 ||
  housingGame.estado.quantidadeCabanasColeta !== 1 ||
  housingGame.estado.quantidadePocosPublicos !== 2 ||
  housingGame.estado.tesouroColonia !== 7600 ||
  housingGame.saldoOperacional() <= 0
) {
  throw new Error(
    `Moradia antecipada, gasto de capital ou sustentabilidade não foram reconciliados: ${JSON.stringify({ casas: housingGame.estado.quantidadeCasasColonia, capacidade: housingGame.capacidadeMoradias(), maximo: housingGame.maximoCasasDisponiveis(), vagas: housingGame.vagasMigracao(), coleta: housingGame.estado.quantidadeCabanasColeta, pocos: housingGame.estado.quantidadePocosPublicos, tesouro: housingGame.estado.tesouroColonia, saldo: housingGame.saldoOperacional() })}.`,
  );
}
const firstHouseSecondBlock = housingGame.posicaoCasa(30);
if (
  firstHouseSecondBlock.x !== 7145 ||
  firstHouseSecondBlock.y !== 6565
) {
  throw new Error("As casas do segundo bairro não foram colocadas no lote reservado.");
}
housingGame.resetDrawCalls();
Object.assign(housingGame.estado, {
  cozinhaHortalicasConstruida: true,
  cozinhaFeijaoConstruida: true,
  defumadorioConstruido: true,
  adegaFriaConstruida: true,
  cemiterioConstruido: true,
});
housingGame.step(100);
const protectedMeatSites = [
  [420, 500, 600, 260],
  [4500, 4550, 420, 340],
  [7100, 6500, 1200, 900],
  [9450, 2920, 500, 280],
  [9830, 5580, 180, 350],
];
if (
  !protectedMeatSites.every(([sx, sy, sw, sh]) =>
    housingGame.strokeRects.some(
      ([x, y, width, height]) =>
        x === sx && y === sy && width === sw && height === sh,
    ),
  ) ||
  !housingGame.fillTexts.some(([label]) =>
    String(label).startsWith("COFRE DE CORTES"),
  ) ||
  !housingGame.fillTexts.some(([label]) =>
    String(label).startsWith("REFEIÇÕES"),
  )
) {
  throw new Error("O bairro ou a cadeia de carnes não apareceu nos locais seguros planejados.");
}

const {
  recintoExterno: limiteExternoCozinhas,
  recintoInterno: limiteInternoCozinhas,
  areaCozinhaCarneColonia: cozinhaCarneExterna,
  areaCozinhaHortalicasColonia: cozinhaHortalicasExterna,
  areaCozinhaFeijaoColonia: cozinhaFeijaoExterna,
  areaCofreCortesColonia: cofreCortesInterno,
  areaDespensaRefeicoesColonia: despensaRefeicoesInterna,
  areaAdegaFriaColonia: adegaFriaInterna,
  areaDefumadorioColonia: defumadorioInterno,
  areaCemiterioColonia: cemiterioSul,
  areaPatioTreinoColonia: patioTreinoSul,
} = housingGame.areasHotfixCozinhas;
const areaContida = (area, limite) =>
  area.x >= limite.x &&
  area.y >= limite.y &&
  area.x + area.largura <= limite.x + limite.largura &&
  area.y + area.altura <= limite.y + limite.altura;
const areasSobrepostas = (a, b) =>
  a.x < b.x + b.largura &&
  a.x + a.largura > b.x &&
  a.y < b.y + b.altura &&
  a.y + a.altura > b.y;
const cozinhasExternas = [
  cozinhaCarneExterna,
  cozinhaHortalicasExterna,
  cozinhaFeijaoExterna,
];
const estoquesPreservadosInternos = [
  cofreCortesInterno,
  despensaRefeicoesInterna,
  adegaFriaInterna,
  defumadorioInterno,
];
if (
  !cozinhasExternas.every(
    (area) =>
      areaContida(area, limiteExternoCozinhas) &&
      !areasSobrepostas(area, limiteInternoCozinhas),
  ) ||
  !estoquesPreservadosInternos.every((area) =>
    areaContida(area, limiteInternoCozinhas),
  ) ||
  areasSobrepostas(cemiterioSul, limiteExternoCozinhas) ||
  cemiterioSul.y < 8200 ||
  cemiterioSul.y + cemiterioSul.altura < 8800 ||
  cemiterioSul.x - (patioTreinoSul.x + patioTreinoSul.largura) !== 200 ||
  cemiterioSul.y >= patioTreinoSul.y + patioTreinoSul.altura ||
  cemiterioSul.y + cemiterioSul.altura <= patioTreinoSul.y ||
  ![
    [8400, 6400, 360, 430],
    [8810, 6400, 430, 340],
    [9290, 6400, 430, 340],
  ].every(([sx, sy, sw, sh]) =>
    housingGame.strokeRects.some(
      ([x, y, width, height]) =>
        x === sx && y === sy && width === sw && height === sh,
    ),
  ) ||
  !housingGame.strokeRects.some(
    ([x, y, width, height]) =>
      x === 8350 && y === 8200 && width === 1800 && height === 650,
  )
) {
  throw new Error("As cozinhas, os estoques preservados ou o cemitério não ficaram nas zonas planejadas.");
}

const thirdHousingGame = createHarness(new Map());
Object.assign(thirdHousingGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 250,
  quantidadeCasasColonia: 54,
  segundoBlocoMoradiasConstruido: true,
  terceiroBlocoMoradiasConstruido: false,
  tesouroColonia: 10000,
  estoqueAlimentos: 500,
  saudeColonia: 100,
  lavouraConstruida: true,
  armazemGraosConstruido: true,
  hortaConstruida: true,
  armazemHortalicasConstruido: true,
  feijaoConstruido: true,
  armazemFeijaoConstruido: true,
  pastagemConstruida: true,
  celeiroConstruido: true,
  moinhoConstruido: true,
  armazemFarinhaConstruido: true,
  padariaConstruida: true,
  armazemPaesConstruido: true,
  guildaConstrutoresConstruida: true,
  estoqueFerramentasMadeira: 40,
  kitFerramentasInicialRecebido: true,
  niveisEstradasColonia: Array(8).fill(3),
});
if (
  thirdHousingGame.proximaObra() !== "terceiroBlocoMoradias" ||
  thirdHousingGame.custoObra("terceiroBlocoMoradias") !== 3500 ||
  thirdHousingGame.maximoCasasDisponiveis() !== 60
) {
  throw new Error("O terceiro bairro não entrou preventivamente na fila aos 54 imóveis.");
}
thirdHousingGame.atualizarPrioridades(0);
concluirObraAtiva(thirdHousingGame);
if (
  !thirdHousingGame.estado.terceiroBlocoMoradiasConstruido ||
  thirdHousingGame.estado.tesouroColonia !== 6500 ||
  thirdHousingGame.maximoCasasDisponiveis() !== 90 ||
  thirdHousingGame.proximaObra() !== "moradia"
) {
  throw new Error("O terceiro bairro não abriu 30 lotes sem romper o orçamento autônomo.");
}
thirdHousingGame.atualizarPrioridades(0);
concluirObraAtiva(thirdHousingGame);
const firstHouseThirdBlock = thirdHousingGame.posicaoCasa(60);
const lastHouseThirdBlock = thirdHousingGame.posicaoCasa(89);
const {
  recintoExterno: limiteExternoMoradias,
  recintoInterno: limiteInternoMoradias,
  areaTerceiroBlocoMoradias: terceiroBairroNordeste,
} = thirdHousingGame.areasMoradia;
const housingRoadGroup = thirdHousingGame.trechosEstradaColonia.find(
  ({ id }) => id === "moradias",
);
const northeastRoute = thirdHousingGame.rotaMaisRapida(
  thirdHousingGame.acessoCasa(300),
  thirdHousingGame.destinoEmprego("administracao", 0),
);
if (
  thirdHousingGame.estado.quantidadeCasasColonia !== 55 ||
  thirdHousingGame.capacidadeMoradias() !== 275 ||
  firstHouseThirdBlock.x !== 9845 ||
  firstHouseThirdBlock.y !== 1615 ||
  lastHouseThirdBlock.x !== 10795 ||
  lastHouseThirdBlock.y !== 2275 ||
  !areaContida(terceiroBairroNordeste, limiteExternoMoradias) ||
  areasSobrepostas(terceiroBairroNordeste, limiteInternoMoradias) ||
  housingRoadGroup.acessos.length !== 15 ||
  northeastRoute.trechos.length === 0 ||
  northeastRoute.pontos.some((ponto, indice) => {
    if (indice === 0) return false;
    const anterior = northeastRoute.pontos[indice - 1];
    return ponto.x !== anterior.x && ponto.y !== anterior.y;
  })
) {
  throw new Error("O lote nordeste, suas 30 casas ou os acessos ortogonais não foram preservados.");
}
thirdHousingGame.estado.quantidadeCasasColonia = 61;
thirdHousingGame.resetDrawCalls();
thirdHousingGame.step(100);
if (
  !thirdHousingGame.strokeRects.some(
    ([x, y, width, height]) =>
      x === 9800 && y === 1550 && width === 1200 && height === 900,
  ) ||
  !thirdHousingGame.strokeRects.some(
    ([x, y, width, height]) =>
      x === 9845 && y === 1615 && width === 130 && height === 105,
  ) ||
  !thirdHousingGame.fillTexts.some(([label]) =>
    String(label).startsWith("BAIRRO 3 · 1/30 CASAS"),
  )
) {
  throw new Error("O terceiro bairro não apareceu no mapa no lote nordeste.");
}

const meatStorage = new Map();
const meatGame = createHarness(meatStorage);
Object.assign(meatGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 20,
  quantidadeCasasColonia: 6,
  tesouroColonia: 10000,
  estoqueAlimentos: 0,
  estoqueCarneSelvagem: 0,
  estoqueCarneCriacao: 0,
  estoqueCortesCarne: 0,
  estoqueRefeicoesCarne: 0,
  cabanaCacadoresConstruida: true,
  acougueConstruido: true,
  cozinhaCarneConstruida: true,
  companhiaTransportadoresConstruida: true,
  estoqueFerramentasMadeira: 40,
  saudeColonia: 100,
});
const meatJobs = meatGame.redistribuirTrabalhadores();
if (
  meatJobs.cacador !== 3 ||
  meatJobs.acougue !== 3 ||
  meatJobs.cozinhaCarne !== 3 ||
  meatGame.producaoAlimentar(meatJobs) !== 36
) {
  throw new Error("Os três estágios da cadeia de carnes não receberam equipes equilibradas.");
}
meatGame.atualizarNecessidades(60);
if (
  meatGame.estado.colonosComFome !== 0 ||
  meatGame.estado.estoqueCarneSelvagem !== 0 ||
  meatGame.estado.estoqueCarneCriacao !== 0 ||
  meatGame.estado.estoqueCortesCarne !== 0 ||
  meatGame.estado.estoqueRefeicoesCarne !== 4 ||
  meatGame.valorAlimentarTotal() !== 16
) {
  throw new Error("Caça, açougue, cozinha ou consumo de refeições não fecharam o ciclo alimentar.");
}
const meatSave = JSON.parse(
  meatStorage.get("arqueiro-do-assentamento-v1"),
);
if (
  !meatSave.expansao.economia.cadeiaCarne.cabanaCacadores ||
  !meatSave.expansao.economia.cadeiaCarne.acougue ||
  !meatSave.expansao.economia.cadeiaCarne.cozinha ||
  meatSave.expansao.economia.estoques.refeicoesCarne !== 4 ||
  createHarness(meatStorage).estado.estoqueRefeicoesCarne !== 4
) {
  throw new Error("A cadeia de carnes não sobreviveu ao save local e à recarga.");
}

const legacyFeatureStorage = new Map([
  [
    "arqueiro-do-assentamento-v1",
    JSON.stringify({
      versao: 1,
      mapaVersao: 2,
      expansao: {
        mapaComprado: true,
        mapaAtual: "expansao",
        revisaoColonia: 5,
        economia: {
          coloniaIniciada: true,
          tesouro: 20000,
          populacao: 126,
          casas: 26,
          lavouraConstruida: true,
          armazemGraosConstruido: true,
          hortaConstruida: true,
          armazemHortalicasConstruido: true,
          feijaoConstruido: true,
          armazemFeijaoConstruido: true,
          pastagemConstruida: true,
          celeiroConstruido: true,
          moinhoConstruido: true,
          armazemFarinhaConstruido: true,
          padariaConstruida: true,
          armazemPaesConstruido: true,
        },
        construcao: { etapa: 4, tempo: 0 },
      },
    }),
  ],
]);
const legacyFeatureGame = createHarness(legacyFeatureStorage);
if (
  legacyFeatureGame.estado.revisaoColonia !== 5 ||
  legacyFeatureGame.estado.segundoBlocoMoradiasConstruido ||
  legacyFeatureGame.estado.terceiroBlocoMoradiasConstruido ||
  legacyFeatureGame.estado.cabanaCacadoresConstruida ||
  legacyFeatureGame.estado.acougueConstruido ||
  legacyFeatureGame.estado.cozinhaCarneConstruida ||
  legacyFeatureGame.proximaObra() !== "guildaConstrutores"
) {
  throw new Error("Um save anterior não migrou defensivamente para a guilda, moradia e carnes.");
}

const fullCapacityGame = createHarness(legacyFeatureStorage);
Object.assign(fullCapacityGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  segundoBlocoMoradiasConstruido: true,
  terceiroBlocoMoradiasConstruido: true,
  populacaoColonia: 450,
  criancasColonia: [],
  quantidadeCasasColonia: 90,
  idadesAdultosColonia: Array(450).fill(32),
  cabanaCacadoresConstruida: true,
  acougueConstruido: true,
  cozinhaCarneConstruida: true,
  cozinhaHortalicasConstruida: true,
  cozinhaFeijaoConstruida: true,
  defumadorioConstruido: true,
  adegaFriaConstruida: true,
  armazensInternosPedraConstruidos: true,
  companhiaTransportadoresConstruida: true,
  guildaConstrutoresConstruida: true,
  nivelOficinaFerramentas: 3,
  estoqueFerramentas: 60,
  estoqueFerramentasPedra: 40,
  estoqueFerramentasMadeira: 40,
  kitFerramentasInicialRecebido: true,
  cisternaConstruida: true,
  saneamentoConstruido: true,
  quantidadePocosPublicos: 4,
  saneamentoAvancadoConstruido: true,
  clinicaConstruida: true,
  quantidadeCabanasColeta: 2,
  ervarioConstruido: true,
  quartelBombeirosConstruido: true,
  bibliotecaConstruida: true,
  igrejaConstruida: true,
  mercadoPublicoConstruido: true,
  armeiroConstruido: true,
  cemiterioConstruido: true,
  caisPescaConstruido: true,
  segundoCaisPescaConstruido: true,
  mercadoPeixesConstruido: true,
  barcosPesca: 5,
  quantidadeTorresMuralha: 8,
  quantidadePortoesFortificados: 7,
  trechosMuralhaPedraInterna: 4,
  trechosMuralhaPedraExterna: 4,
  niveisEstradasColonia: Array(8).fill(3),
});
const fullCapacityFoodKeys = [
  "lavoura",
  "horta",
  "feijao",
  "pastagem",
  "celeiro",
  "moinho",
  "padaria",
  "cacador",
  "acougue",
  "cozinhaCarne",
  "cozinhaHortalicas",
  "cozinhaFeijao",
  "conserveiro",
  "pesca",
];
const fullCapacityJobs = fullCapacityGame.redistribuirTrabalhadores();
const fullCapacityJobLimits = fullCapacityGame.capacidadesEmprego();
const fullCapacityFoodNeed = fullCapacityGame.necessidadeAlimentos();
const fullCapacityFoodProduction =
  fullCapacityGame.producaoAlimentar(fullCapacityJobs);
const fullCapacityFoodSlots = fullCapacityFoodKeys.reduce(
  (total, key) => total + (fullCapacityJobLimits[key] || 0),
  0,
);
const fullCapacityFoodWorkers = fullCapacityFoodKeys.reduce(
  (total, key) => total + (fullCapacityJobs[key] || 0),
  0,
);
const fullCapacityBalance = fullCapacityGame.saldoOperacional(
  fullCapacityJobs,
);
const fullCapacityRackSlots = Object.values(
  fullCapacityGame.estado.ferramentasLocaisColonia,
).reduce((total, local) => total + (local.capacidade || 0), 0);
const fullCapacityAllJobSlots = Object.values(fullCapacityJobLimits).reduce(
  (total, slots) => total + slots,
  0,
);
if (
  fullCapacityGame.capacidadeMoradias() !== 450 ||
  fullCapacityFoodSlots !== 76 ||
  fullCapacityFoodProduction < fullCapacityFoodNeed * 1.2 ||
  fullCapacityBalance < 0 ||
  fullCapacityRackSlots !== fullCapacityAllJobSlots ||
  fullCapacityJobs.construtor !== 0
) {
  throw new Error(
    `A auditoria permanente da lotação máxima falhou: ${JSON.stringify({ moradores: fullCapacityGame.totalMoradores(), moradia: fullCapacityGame.capacidadeMoradias(), trabalhadoresAlimentos: fullCapacityFoodWorkers, vagasAlimentos: fullCapacityFoodSlots, producao: fullCapacityFoodProduction, necessidade: fullCapacityFoodNeed, saldo: fullCapacityBalance, racks: fullCapacityRackSlots, postos: fullCapacityAllJobSlots, construtoresSemObra: fullCapacityJobs.construtor })}.`,
  );
}
console.log(
  `FULL_CAPACITY_FOOD_AUDIT ${JSON.stringify({ moradores: fullCapacityGame.totalMoradores(), trabalhadoresAlimentos: fullCapacityFoodWorkers, vagasAlimentos: fullCapacityFoodSlots, producao: fullCapacityFoodProduction, necessidade: fullCapacityFoodNeed, coberturaPercentual: Math.round((fullCapacityFoodProduction / fullCapacityFoodNeed) * 1000) / 10, saldoOperacional: fullCapacityBalance })}`,
);

const armorGame = createHarness(new Map());
Object.assign(armorGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  tesouroColonia: 50000,
  populacaoColonia: 60,
  quantidadeCasasColonia: 20,
  estoqueAlimentos: 500,
  saudeColonia: 100,
  colonosComFome: 0,
  pastagemConstruida: true,
  celeiroConstruido: true,
  cabanaCacadoresConstruida: true,
  acougueConstruido: true,
  cozinhaCarneConstruida: true,
  armeiroConstruido: true,
  estoqueCouro: 12,
  estoqueArmaduras: { couro: 0, reforcada: 0, malha: 0, placas: 0 },
});
armorGame.estado.idadesAdultosColonia = Array(60).fill(32);
const armorMaterials = armorGame.materiaisObra("armeiro");
if (
  armorGame.custoObra("armeiro") !== 2500 ||
  armorMaterials.madeira !== 20 ||
  armorMaterials.ferramentas !== 10 ||
  armorGame.tipoArmaduraPrioritaria() !== "couro"
) {
  throw new Error("O armeiro não preservou custo, materiais ou prioridade inicial de couro.");
}
const armorJobs = armorGame.redistribuirTrabalhadores();
if (
  armorJobs.armeiro !== 4 ||
  armorJobs.cacador + armorJobs.pastagem <= 0
) {
  throw new Error(
    `A produção de armaduras não recebeu vagas depois das cadeias alimentares prioritárias: ${JSON.stringify(armorJobs)}.`,
  );
}
armorGame.atualizarNecessidades(60);
if (
  armorGame.estado.estoqueArmaduras.couro !== 2 ||
  armorGame.estado.estoqueArmaduras.reforcada !== 0 ||
  armorGame.escolherArmadura("milicia") !== "couro"
) {
  throw new Error("Peles não viraram armaduras básicas com a penalidade correta de ferramentas.");
}
Object.assign(armorGame.estado.estoqueArmaduras, {
  couro: 10,
  reforcada: 10,
  malha: 5,
  placas: 1,
});
armorGame.estado.estoqueMinerio = 20;
armorGame.estado.estoqueFerramentas = 10;
if (
  armorGame.tipoArmaduraProduzivel() !== "placas" ||
  armorGame.escolherArmadura("guarda") !== "reforcada" ||
  armorGame.escolherArmadura("soldado") !== "placas"
) {
  throw new Error("As qualidades de armadura não seguem as prioridades de produção e de cada força.");
}
Object.assign(armorGame.estado, {
  quantidadeMilicianos: 10,
  quantidadeGuardas: 10,
  quantidadeSoldados: 10,
  estoqueArmaduras: { couro: 6, reforcada: 0, malha: 0, placas: 0 },
  armadurasEquipadasColonia: {
    milicia: { couro: 0, reforcada: 0, malha: 0, placas: 0 },
    guarda: { couro: 0, reforcada: 0, malha: 0, placas: 0 },
    soldado: { couro: 0, reforcada: 0, malha: 0, placas: 0 },
  },
  tempoDefesaColonia: 0,
});
armorGame.atualizarDefesa(0);
if (
  armorGame.estado.estoqueArmaduras.couro !== 0 ||
  armorGame.estado.armadurasEquipadasColonia.milicia.couro !== 6 ||
  armorGame.estado.quantidadeMilicianos !== 10 ||
  armorGame.estado.quantidadeGuardas !== 10 ||
  armorGame.estado.quantidadeSoldados !== 10
) {
  throw new Error("As armaduras de couro estocadas não foram adaptadas à milícia existente sem nova contratação.");
}

const mortalityGame = createHarness(new Map());
Object.assign(mortalityGame.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 21,
  quantidadeCasasColonia: 8,
  saudeColonia: 100,
  colonosComFome: 0,
  igrejaConstruida: true,
  cemiterioConstruido: true,
  migrantesChegadosColonia: 1,
  creditosObitosColonia: 1,
  mortesTotaisColonia: 0,
  registrosObitosColonia: [],
});
mortalityGame.estado.idadesAdultosColonia = [95, ...Array(20).fill(30)];
mortalityGame.definirAleatorio(0);
const firstDeath = mortalityGame.atualizarObitos();
const churchRoute = mortalityGame.destinoEmprego("religioso", 0);
const cemeteryRoute = mortalityGame.destinoEmprego("religioso", 1);
if (
  !firstDeath ||
  firstDeath.idade < 95 ||
  mortalityGame.estado.populacaoColonia !== 20 ||
  mortalityGame.estado.mortesTotaisColonia !== 1 ||
  mortalityGame.estado.creditosObitosColonia !== 0 ||
  churchRoute.x === cemeteryRoute.x && churchRoute.y === cemeteryRoute.y ||
  Object.hasOwn(mortalityGame.capacidadesEmprego(), "coveiro")
) {
  throw new Error("O cemitério, a rota religiosa ou o primeiro óbito controlado não foram aplicados corretamente.");
}
if (
  mortalityGame.atualizarObitos() !== null ||
  mortalityGame.estado.mortesTotaisColonia >
    mortalityGame.estado.nascimentosTotaisColonia +
      mortalityGame.estado.migrantesChegadosColonia ||
  mortalityGame.estado.populacaoColonia < 20
) {
  throw new Error("Os óbitos ultrapassaram o crescimento acumulado ou a população fundadora.");
}

const featureSaveSource = createHarness(new Map());
Object.assign(featureSaveSource.estado, {
  coloniaIniciada: true,
  mapaExpansaoComprado: true,
  mapaAtual: "expansao",
  revisaoColonia: 5,
  etapaConstrucaoColonia: 4,
  populacaoColonia: 22,
  quantidadeCasasColonia: 61,
  segundoBlocoMoradiasConstruido: true,
  terceiroBlocoMoradiasConstruido: true,
  armazensInternosPedraConstruidos: true,
  armeiroConstruido: true,
  cemiterioConstruido: true,
  estoqueCouro: 150,
  estoqueArmaduras: { couro: 3, reforcada: 2, malha: 1, placas: 1 },
  idadesAdultosColonia: Array(22).fill(41),
  nascimentosTotaisColonia: 2,
  migrantesChegadosColonia: 1,
  creditosObitosColonia: 2,
  mortesTotaisColonia: 1,
  registrosObitosColonia: [
    { idade: 81, causa: "idade avançada", registradoEm: 12345 },
  ],
  armadurasEquipadasColonia: {
    milicia: { couro: 1, reforcada: 0, malha: 0, placas: 0 },
    guarda: { couro: 0, reforcada: 1, malha: 0, placas: 0 },
    soldado: { couro: 0, reforcada: 0, malha: 0, placas: 1 },
  },
});
featureSaveSource.listeners.get("abrir-transferencia:click")();
const featureSaveTarget = createHarness(new Map());
featureSaveTarget.elements.get("codigo-importacao").value =
  featureSaveSource.elements.get("codigo-exportacao").value;
featureSaveTarget.listeners.get("importar-save:click")();
if (
  !featureSaveTarget.estado.armeiroConstruido ||
  !featureSaveTarget.estado.cemiterioConstruido ||
  !featureSaveTarget.estado.segundoBlocoMoradiasConstruido ||
  !featureSaveTarget.estado.terceiroBlocoMoradiasConstruido ||
  !featureSaveTarget.estado.armazensInternosPedraConstruidos ||
  featureSaveTarget.estado.quantidadeCasasColonia !== 61 ||
  featureSaveTarget.estado.estoqueCouro !== 150 ||
  featureSaveTarget.estado.estoqueArmaduras.placas !== 1 ||
  featureSaveTarget.estado.armadurasEquipadasColonia.soldado.placas !== 1 ||
  featureSaveTarget.estado.mortesTotaisColonia !== 1 ||
  featureSaveTarget.estado.registrosObitosColonia[0].idade !== 81 ||
  featureSaveTarget.estado.idadesAdultosColonia.length !== 22
) {
  throw new Error("Armaduras, idades, óbitos e edifícios novos não sobreviveram à transferência do save.");
}

if (process.argv[2]) {
  const imported = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const liveSave = imported?.dados || imported;
  const liveStorage = new Map([
    ["arqueiro-do-assentamento-v1", JSON.stringify(liveSave)],
  ]);
  const liveGame = createHarness(liveStorage);
  const couroCarregadoDoSave = liveGame.estado.estoqueCouro;
  const armadurasCouroAntesRetrofit =
    liveGame.estado.estoqueArmaduras.couro;
  liveGame.atualizarDefesa(0);
  const armadurasCouroMiliciaDepoisRetrofit =
    liveGame.estado.armadurasEquipadasColonia.milicia.couro;
  const foodJobKeys = [
    "lavoura",
    "horta",
    "feijao",
    "pastagem",
    "celeiro",
    "moinho",
    "padaria",
    "cacador",
    "acougue",
    "cozinhaCarne",
    "cozinhaHortalicas",
    "cozinhaFeijao",
    "conserveiro",
    "pesca",
  ];
  const snapshotAudit = (game) => {
    const jobs = game.redistribuirTrabalhadores();
    const capacities = game.capacidadesEmprego();
    const need = game.necessidadeAlimentos();
    const production = game.producaoAlimentar(jobs);
    return {
      moradores: game.totalMoradores(),
      adultos: game.estado.populacaoColonia,
      dependentes: game.estado.criancasColonia.length,
      casas: game.estado.quantidadeCasasColonia,
      capacidadeMoradia: game.capacidadeMoradias(),
      maximoCasasNoBairroAtual: game.maximoCasasDisponiveis(),
      vagasLivres: game.capacidadeMoradias() - game.totalMoradores(),
      reservaPlanejada: game.reservaMoradia(),
      vagasFisicasMigracao: game.vagasFisicasMigracao(),
      vagasEspontaneasAlemDaReserva: game.vagasMigracao(),
      postosEstruturais: game.totalCapacidadeEmpregos(),
      postosOcupados: game.totalEmpregosOcupados(jobs),
      adultosDisponiveis: jobs.geral,
      capacidadePorFuncao: capacities,
      vagasAlimentares: foodJobKeys.reduce(
        (total, key) => total + (capacities[key] || 0),
        0,
      ),
      empregosAlimentares: foodJobKeys.reduce(
        (total, key) => total + (jobs[key] || 0),
        0,
      ),
      necessidadeAlimentar: need,
      metaProducaoAlimentar: game.metaProducaoAlimentar(),
      producaoAlimentar: production,
      margemAlimentar: production - need,
      coberturaPercentual: Math.round((production / need) * 1000) / 10,
      diagnosticoPrioridadeAlimentar:
        game.diagnosticoPrioridadeAlimentar(jobs),
      folhaCivil: game.folhaCivil(),
      limiteFolhaCivil: game.limiteFolhaCivil(),
      manutencao: game.manutencaoMunicipal(),
      saldoOperacional: game.saldoOperacional(),
      empregos: jobs,
    };
  };
  const beforeWorksAudit = snapshotAudit(liveGame);
  const migrationAuditBeforeWorks = {
    ouroPessoal: liveGame.estado.ouro,
    escriturarios: liveGame.estado.quantidadeAdministradoresMigracao,
    incentivosDisponiveis: liveGame.estado.cargasMigracaoDisponiveis,
    barcosPendentes: liveGame.estado.migracoesPendentes.length,
    vagasFisicas: liveGame.vagasFisicasMigracao(),
    vagasEspontaneasAlemDaReserva: liveGame.vagasMigracao(),
    incentivoPermitido: liveGame.migracaoIncentivadaPermitida(),
    motivoBloqueio: liveGame.motivoBloqueioIncentivoMigracao() || null,
    pescadoresDoPosto: liveGame.estado.quantidadePescadores,
    botaoDesativado: liveGame.elements.get("incentivar-migracao").disabled,
    textoBotao: liveGame.elements.get("incentivar-migracao").textContent,
    desembarque: liveGame.elements.get("registro-desembarque-migracao").textContent,
  };
  const treasuryBefore = liveGame.estado.tesouroColonia;
  const completedWorks = [];
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const nextWork = liveGame.proximaObra();
    if (!nextWork) break;
    liveGame.atualizarPrioridades(0);
    const startedWork = liveGame.estado.obraAutomaticaColonia;
    if (!startedWork) break;
    concluirObraAtiva(liveGame);
    if (liveGame.estado.obraAutomaticaColonia === startedWork) {
      throw new Error(`A obra ${startedWork} não terminou durante a auditoria do save.`);
    }
    completedWorks.push(startedWork);
  }
  const liveJobs = liveGame.redistribuirTrabalhadores();
  const need = liveGame.necessidadeAlimentos();
  const production = liveGame.producaoAlimentar(liveJobs);
  const report = {
    obrasConcluidas: completedWorks,
    investimento:
      Math.round((treasuryBefore - liveGame.estado.tesouroColonia) * 100) /
      100,
    tesouroAntes: treasuryBefore,
    tesouroDepois: liveGame.estado.tesouroColonia,
    moradores: liveGame.totalMoradores(),
    adultos: liveGame.estado.populacaoColonia,
    dependentes: liveGame.estado.criancasColonia.length,
    casas: liveGame.estado.quantidadeCasasColonia,
    capacidadeMoradia: liveGame.capacidadeMoradias(),
    vagasLivres: liveGame.capacidadeMoradias() - liveGame.totalMoradores(),
    reservaPlanejada: liveGame.reservaMoradia(),
    vagasFisicasMigracao: liveGame.vagasFisicasMigracao(),
    vagasMigracaoAlemDaReserva: liveGame.vagasMigracao(),
    empregos: liveJobs,
    postosEstruturais: liveGame.totalCapacidadeEmpregos(),
    postosOcupados: liveGame.totalEmpregosOcupados(liveJobs),
    adultosDisponiveis: liveJobs.geral,
    folhaCivil: liveGame.folhaCivil(),
    limiteFolhaCivil: liveGame.limiteFolhaCivil(),
    manutencao: liveGame.manutencaoMunicipal(),
    saldoOperacional: liveGame.saldoOperacional(),
    prioridadeAtual: liveGame.prioridadeAtual(),
    logistica: {
      metaTransportadores: liveGame.alvoTransportadores(liveJobs),
      capacidadeCarga: liveGame.capacidadeCargaTransportadores(liveJobs),
      bonusFerramentas: liveGame.bonusLogistica(liveJobs),
      cargaNaOrigem: liveGame.cargaLocalPendente(),
      cargaEntregavel: liveGame.cargaLocalEntregavel(),
    },
    resiliencia: {
      protecaoIncendio: liveGame.protecaoIncendio(liveJobs),
      reservaDuravel: liveGame.valorReservaDuravel(),
      metaReservaDuravel: liveGame.reservaDuravelAlvo(),
      alvoPedreira: liveGame.alvoPedreiraPrioritaria(liveJobs),
    },
    compatibilidadeSave: {
      couroCarregado: couroCarregadoDoSave,
      armadurasCouroAntesRetrofit,
      armadurasCouroMiliciaDepoisRetrofit,
      armadurasCouroRestantes:
        liveGame.estado.estoqueArmaduras.couro,
    },
    alimentoEstocadoAntes: liveGame.valorAlimentarTotal(),
    necessidadeAlimentar: need,
    metaProducaoAlimentar: liveGame.metaProducaoAlimentar(),
    producaoAlimentar: production,
    margemAlimentar: production - need,
    coberturaPercentual: Math.round((production / need) * 1000) / 10,
    diagnosticoPrioridadeAlimentar:
      liveGame.diagnosticoPrioridadeAlimentar(liveJobs),
    auditoriaMigracaoAntesDasObras: migrationAuditBeforeWorks,
  };
  liveGame.atualizarNecessidades(60);
  report.famintosDepoisDoCiclo = liveGame.estado.colonosComFome;
  report.alimentoEstocadoDepois = liveGame.valorAlimentarTotal();
  report.antesDasObras = beforeWorksAudit;

  const matureGame = createHarness(
    new Map([
      ["arqueiro-do-assentamento-v1", JSON.stringify(liveSave)],
    ]),
  );
  Object.assign(matureGame.estado, {
    segundoBlocoMoradiasConstruido: true,
    quantidadeCasasColonia: Math.max(
      28,
      matureGame.estado.quantidadeCasasColonia,
    ),
    cabanaCacadoresConstruida: true,
    acougueConstruido: true,
    cozinhaCarneConstruida: true,
    cozinhaHortalicasConstruida: true,
    cozinhaFeijaoConstruida: true,
    defumadorioConstruido: true,
    adegaFriaConstruida: true,
    armazensInternosPedraConstruidos: true,
    companhiaTransportadoresConstruida: true,
    guildaConstrutoresConstruida: true,
    nivelOficinaFerramentas: 3,
    quantidadePocosPublicos: 4,
    saneamentoAvancadoConstruido: true,
    quartelBombeirosConstruido: true,
    bibliotecaConstruida: true,
    igrejaConstruida: true,
    mercadoPublicoConstruido: true,
    armeiroConstruido: true,
    cemiterioConstruido: true,
    estoqueCouro: 20,
    estoqueMinerio: Math.max(50, matureGame.estado.estoqueMinerio),
    estoqueFerramentas: Math.max(30, matureGame.estado.estoqueFerramentas),
  });
  report.configuracaoMadura = snapshotAudit(matureGame);
  Object.assign(matureGame.estado, {
    terceiroBlocoMoradiasConstruido: true,
    populacaoColonia: 450,
    criancasColonia: [],
    quantidadeCasasColonia: 90,
    idadesAdultosColonia: Array(450).fill(32),
    quantidadeTorresMuralha: 8,
    quantidadePortoesFortificados: 7,
  });
  const empregosAutomaticosLotacaoMaxima =
    matureGame.redistribuirTrabalhadores();
  const capacidadesLotacaoMaxima = matureGame.capacidadesEmprego();
  const empregosAlimentaresCompletos = {
    ...empregosAutomaticosLotacaoMaxima,
  };
  foodJobKeys.forEach((key) => {
    empregosAlimentaresCompletos[key] = capacidadesLotacaoMaxima[key] || 0;
  });
  const empregosAlimentaresComApoio = {
    ...empregosAlimentaresCompletos,
    transportador: capacidadesLotacaoMaxima.transportador || 0,
    bibliotecario: capacidadesLotacaoMaxima.bibliotecario || 0,
  };
  const necessidadeLotacaoMaxima = matureGame.necessidadeAlimentos();
  const producaoAutomaticaLotacaoMaxima = matureGame.producaoAlimentar(
    empregosAutomaticosLotacaoMaxima,
  );
  const producaoAlimentarCompleta = matureGame.producaoAlimentar(
    empregosAlimentaresCompletos,
  );
  const producaoAlimentarComApoio = matureGame.producaoAlimentar(
    empregosAlimentaresComApoio,
  );
  report.lotacaoMaximaTresBairros = {
    moradores: matureGame.totalMoradores(),
    casas: matureGame.estado.quantidadeCasasColonia,
    capacidadeMoradia: matureGame.capacidadeMoradias(),
    necessidadeAlimentar: necessidadeLotacaoMaxima,
    metaProducaoAlimentar: matureGame.metaProducaoAlimentar(),
    empregosAutomaticos: empregosAutomaticosLotacaoMaxima,
    empregosAlimentaresAutomaticos: foodJobKeys.reduce(
      (total, key) =>
        total + (empregosAutomaticosLotacaoMaxima[key] || 0),
      0,
    ),
    vagasAlimentares: foodJobKeys.reduce(
      (total, key) => total + (capacidadesLotacaoMaxima[key] || 0),
      0,
    ),
    producaoAutomatica: producaoAutomaticaLotacaoMaxima,
    coberturaAutomaticaPercentual:
      Math.round(
        (producaoAutomaticaLotacaoMaxima / necessidadeLotacaoMaxima) * 1000,
      ) / 10,
    producaoComTodasVagasAlimentares: producaoAlimentarCompleta,
    coberturaComTodasVagasAlimentaresPercentual:
      Math.round(
        (producaoAlimentarCompleta / necessidadeLotacaoMaxima) * 1000,
      ) / 10,
    producaoComAlimentacaoEApoioCompletos: producaoAlimentarComApoio,
    coberturaComAlimentacaoEApoioCompletosPercentual:
      Math.round(
        (producaoAlimentarComApoio / necessidadeLotacaoMaxima) * 1000,
      ) / 10,
    folhaAutomatica: matureGame.folhaCivil(
      empregosAutomaticosLotacaoMaxima,
    ),
    saldoAutomatico: matureGame.saldoOperacional(
      empregosAutomaticosLotacaoMaxima,
    ),
    folhaComAlimentacaoEApoioCompletos: matureGame.folhaCivil(
      empregosAlimentaresComApoio,
    ),
    limiteFolhaCivil: matureGame.limiteFolhaCivil(),
    manutencao: matureGame.manutencaoMunicipal(),
    saldoComAlimentacaoEApoioCompletos: matureGame.saldoOperacional(
      empregosAlimentaresComApoio,
    ),
  };
  if (
    report.lotacaoMaximaTresBairros.capacidadeMoradia !== 450 ||
    report.lotacaoMaximaTresBairros.vagasAlimentares !== 76 ||
    report.lotacaoMaximaTresBairros.producaoAutomatica <
      necessidadeLotacaoMaxima ||
    report.lotacaoMaximaTresBairros.saldoAutomatico < 0 ||
    report.lotacaoMaximaTresBairros.producaoComAlimentacaoEApoioCompletos <
      necessidadeLotacaoMaxima
  ) {
    throw new Error(
      `A auditoria automática de alimentação na lotação máxima não reconciliou capacidade e sustentabilidade: ${JSON.stringify(report.lotacaoMaximaTresBairros)}.`,
    );
  }
  console.log(`LIVE_SAVE_AUDIT ${JSON.stringify(report)}`);
}

console.log(
  "Orthogonal roads, proactive housing, maximum-capacity food, sustainable healthcare, exclusive wagon logistics, retained jobs, tiered worksite tools, audited walls and symmetric posts, wells and hydraulic network, defense economy, families, saves, migration, speed control, and hunting: OK",
);
