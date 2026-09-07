"""Browser checks against a local checkout or --url (no player saves are used).
Requires playwright==1.57.0 and Chromium. Run from the repository root.
"""
import argparse
import hashlib
import http.server
import json
from pathlib import Path
import shutil
import threading
import urllib.request
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument("--url")
parser.add_argument("--output", default="verification-output")
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
server = None
if args.url:
    url = args.url
    with urllib.request.urlopen(url, timeout=30) as response:
        served = response.read()
    assert hashlib.sha256(served).digest() == hashlib.sha256(Path("index.html").read_bytes()).digest(), "Published HTML differs from the tested checkout"
else:
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/"

results = []
try:
    with sync_playwright() as p:
        chromium = shutil.which("chromium") or shutil.which("chromium-browser")
        browser = p.chromium.launch(headless=True, **({"executable_path": chromium} if chromium else {}), args=["--no-sandbox"])
        for name, viewport, touch in [("desktop", {"width": 1440, "height": 1000}, False), ("mobile", {"width": 390, "height": 844}, True)]:
            context = browser.new_context(viewport=viewport, is_mobile=touch, has_touch=touch)
            page = context.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(url, wait_until="load")
            page.evaluate("""() => {
              Object.assign(estado, { coloniaIniciada: true, mapaExpansaoComprado: true, mapaAtual: 'expansao', revisaoColonia: versaoColonia, etapaConstrucaoColonia: 4, cabanaCacadoresConstruida: true, patioTreinoConstruido: true, quantidadeMilicianos: 10, ciclosSoldosAtrasados: 0, jogoPausado: true });
              estado.cacaMilicia = novoEstadoCacaMilicia();
              estado.cameraExpansao = { x: 0, y: 0, zoom: 0.55 };
              atualizarInterface(); redimensionar(); desenhar(); salvarProgresso();
            }""")
            page.locator("#abrir-caca-milicia").focus()
            page.keyboard.press("Enter")
            assert page.locator("#painel-caca-milicia").is_visible()
            page.locator("#fechar-caca-milicia").click()
            page.locator("#jogo").scroll_into_view_if_needed()

            def rally_point():
                return page.evaluate("""() => {
                  estado.cameraExpansao.x = 0; estado.cameraExpansao.y = 0; desenhar();
                  const r = canvas.getBoundingClientRect(), v = dimensoesVisaoExpansao();
                  return { x: r.left + (areaPontoCacaMilicia.x + 310) / v.largura * r.width, y: r.top + (areaPontoCacaMilicia.y + 125) / v.altura * r.height };
                }""")

            point = rally_point()
            page.mouse.move(point["x"], point["y"])
            page.mouse.down()
            page.mouse.move(point["x"] + 65, point["y"] + 25, steps=5)
            page.mouse.up()
            assert not page.locator("#painel-caca-milicia").is_visible(), "Dragging should not open a hunt"
            point = rally_point()
            if touch:
                page.touchscreen.tap(point["x"], point["y"])
            else:
                page.mouse.click(point["x"], point["y"])
            assert page.locator("#painel-caca-milicia").is_visible(), "Rally tap should open expedition controls"
            page.locator("#equipe-caca-milicia").fill("5")
            page.locator("#duracao-caca-milicia").select_option("60")
            page.locator("#iniciar-caca-milicia").click()
            assert page.evaluate("estado.cacaMilicia.expedicao.fase") == "reunindo"
            assert page.locator("#iniciar-caca-milicia").is_disabled()
            assert page.evaluate("painelCacaMilicia.scrollWidth <= painelCacaMilicia.clientWidth + 1"), "Dialog overflows horizontally"
            page.screenshot(path=str(out / f"{name}-hunt-panel.png"))
            seed = page.evaluate("estado.cacaMilicia.expedicao.semente")
            page.locator("#fechar-caca-milicia").click()
            page.reload(wait_until="load")
            assert page.evaluate("estado.cacaMilicia.expedicao.semente") == seed
            assert page.evaluate("estado.cacaMilicia.expedicao.fase") == "reunindo"
            assert page.evaluate("estado.jogoPausado") is True

            def advance(seconds):
                page.evaluate("""(seconds) => { estado.jogoPausado = false; atualizarExpedicaoMilicia(seconds); estado.jogoPausado = true; atualizarInterface(); desenhar(); salvarProgresso(); }""", seconds)

            advance(45)
            assert page.evaluate("estado.cacaMilicia.expedicao.fase") == "saindo"
            advance(18)
            assert page.evaluate("posicaoMilicianoExpedicao(0)") is None
            advance(60)
            assert page.evaluate("estado.cacaMilicia.expedicao.fase") == "voltando"
            advance(13)
            page.locator("#jogo").scroll_into_view_if_needed()
            page.locator("#jogo").screenshot(path=str(out / f"{name}-returning-hunt.png"))
            advance(5 + 8)
            assert page.evaluate("estado.cacaMilicia.concluidas") == 1
            report = page.evaluate("estado.cacaMilicia.ultima")
            assert report["quantidade"] == 5 and report["segundos"] == 60
            advance(45)
            assert page.evaluate("estado.cacaMilicia.expedicao") is None
            page.reload(wait_until="load")
            advance(1000)
            assert page.evaluate("estado.cacaMilicia.concluidas") == 1
            assert page.evaluate("estado.cacaMilicia.ultima") == report
            assert not errors, errors
            results.append({"viewport": name, "touch": touch, "rallyTap": "passed", "dragDoesNotLaunch": "passed", "keyboardAccess": "passed", "saveResume": "passed", "noDuplicateReward": "passed", "horizontalOverflow": False, "javascriptErrors": errors, "report": report})
            context.close()
        browser.close()
finally:
    if server:
        server.shutdown()
report = {"url": url, "htmlSha256": hashlib.sha256(Path("index.html").read_bytes()).hexdigest(), "checks": results}
(out / "browser-hunts-report.json").write_text(json.dumps(report, indent=2) + "\n")
print("BROWSER_HUNTS_OK " + json.dumps(report))
