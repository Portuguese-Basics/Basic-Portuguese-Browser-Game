from pathlib import Path
import hashlib
p=Path('index.html');s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='3056150b0a2992331641d74a83012c159e5f5acd94bf2a629254709a9cad67a4'
start=s.index('      function desenharCaminhoTrechoEstradaColonia(');end=s.index('      function desenharCaminhoParcialRedeHidricaColonia(',start)
block=s[start:end]
block=block.replace('function desenharCaminhoTrechoEstradaColonia(pontos)', 'function desenharCaminhoTrechoEstradaColonia(pontos, ctx = contexto)')
block=block.replace('function desenharTrechoEstradaColonia(trecho, nivel, opacidade = 1)', 'function desenharTrechoEstradaColonia(trecho, nivel, opacidade = 1, ctx = contexto)')
block=block.replace('function desenharRedeViariaColonia()', 'function desenharRedeViariaColoniaDireta(ctx = contexto)')
block=block.replace('contexto.', 'ctx.')
block=block.replace('desenharCaminhoTrechoEstradaColonia(pontos)', 'desenharCaminhoTrechoEstradaColonia(pontos, ctx)')
block=block.replace('nivel === 0 ? opacidadeTrilha : 1,\n          );', 'nivel === 0 ? opacidadeTrilha : 1,\n            ctx,\n          );')
block=block.replace('0.2 + progresso * 0.8,\n            );','0.2 + progresso * 0.8,\n              ctx,\n            );')
wrapper='''      // One screen-sized road layer, never a world-sized bitmap. Production and
      // routes still update normally. Camera, resolution, road tiers and traffic
      // change the key; road construction bypasses the cache for every progress step.
      let cachePinturaEstradasColonia = null;
      function desenharRedeViariaColonia() {
        if (!estado.coloniaIniciada || estado.etapaConstrucaoColonia < 1) return;
        if (typeof contexto.getTransform !== "function" ||
            typeof contexto.drawImage !== "function" ||
            canvas.width * canvas.height > 4194304 ||
            estado.obraAutomaticaColonia === "estradaSegmento") {
          cachePinturaEstradasColonia = null;
          desenharRedeViariaColoniaDireta();
          return;
        }
        const m = contexto.getTransform();
        const niveis = estado.niveisEstradasColonia;
        const trafego = trechosEstradaColonia.map((_, i) =>
          (niveis[i] || 0) === 0 ? trafegoTrechoEstradaColonia(i) : 0);
        const chave = [versaoPlantaColonia, canvas.width, canvas.height,
          m.a, m.b, m.c, m.d, m.e, m.f, niveis.join(","), trafego.join(",")].join("|");
        const propriedades = ["fillStyle", "strokeStyle", "lineWidth", "lineCap",
          "lineJoin", "font", "textAlign", "textBaseline", "globalAlpha"];
        if (!cachePinturaEstradasColonia) {
          let camada;
          try {
            camada = typeof OffscreenCanvas === "function"
              ? new OffscreenCanvas(canvas.width, canvas.height)
              : document.createElement("canvas");
            camada.width = canvas.width; camada.height = canvas.height;
            const ctx = camada.getContext("2d");
            if (!ctx) throw new Error("Canvas de apoio indisponível");
            cachePinturaEstradasColonia = { camada, ctx, chave: "", finais: null, refeitas: 0 };
          } catch (_) {
            cachePinturaEstradasColonia = null;
            desenharRedeViariaColoniaDireta();
            return;
          }
        }
        const cache = cachePinturaEstradasColonia;
        if (cache.chave !== chave) {
          const { camada, ctx } = cache;
          if (camada.width !== canvas.width) camada.width = canvas.width;
          if (camada.height !== canvas.height) camada.height = canvas.height;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, camada.width, camada.height);
          for (const k of propriedades) ctx[k] = contexto[k];
          ctx.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
          desenharRedeViariaColoniaDireta(ctx);
          cache.finais = Object.fromEntries(propriedades.map(k => [k, ctx[k]]));
          cache.chave = chave;
          cache.refeitas += 1;
        }
        contexto.save();
        contexto.setTransform(1, 0, 0, 1, 0, 0);
        contexto.globalAlpha = 1;
        contexto.drawImage(cache.camada, 0, 0);
        contexto.restore();
        for (const k of propriedades) contexto[k] = cache.finais[k];
      }

'''
s=s[:start]+block+wrapper+s[end:]
assert hashlib.sha256(s.encode()).hexdigest()=='1b7e6a932d1574d7e248e6f649b8388ee8352274b5cb2ed0bb3f26ad8e8cc776'
p.write_text(s)
