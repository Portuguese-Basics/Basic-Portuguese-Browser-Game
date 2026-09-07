"""Manned-wall browser acceptance with disposable synthetic saves, not handset benchmarks."""
import argparse, ast, hashlib, http.server, json, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--isolated',action='store_true');p.add_argument('--output',default='verification-output/walls');a=p.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=None
for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets):setup=ast.literal_eval(n.value)
assert setup
server=None
if not a.url and not a.isolated:
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start();a.url=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
  for name,vp,touch in [('desktop',{'width':1440,'height':1000},False),('mobile',{'width':390,'height':844},True)]:
   ctx=browser.new_context(viewport=vp,has_touch=touch,is_mobile=touch,device_scale_factor=2);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def load_page(storage=None):
    global page
    if a.isolated:
     page.close();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     page.evaluate('''data=>{let uid=0;crypto.randomUUID=()=>`walls-${++uid}`;window.__wallsStorage=new Map(Object.entries(data||{}));Object.defineProperty(window,'localStorage',{value:{getItem:k=>__wallsStorage.get(k)??null,setItem:(k,v)=>__wallsStorage.set(k,String(v)),removeItem:k=>__wallsStorage.delete(k)}})}''',storage)
     page.set_content(Path('index.html').read_text(),wait_until='load')
    else:
     response=page.goto(a.url,wait_until='load');assert response.ok
     assert hashlib.sha256(response.body()).digest()==hashlib.sha256(Path('index.html').read_bytes()).digest()
   def reload_page():
    if a.isolated:load_page(page.evaluate('Object.fromEntries(__wallsStorage)'))
    else:page.reload(wait_until='load')
   load_page()
   page.evaluate(setup)
   page.evaluate('''()=>{Object.assign(estado,{trechosPalicadaInterna:4,trechosPalicadaExterna:4,trechosMuralhaPedraInterna:4,trechosMuralhaPedraExterna:4,quantidadeTorresMuralha:8,quantidadePortoesFortificados:7,arqueirosMilicia:4,arqueirosGuarda:4,arqueirosSoldados:4,estoqueFlechas:100,estoqueArcos:15,estoqueLancasMadeira:0,estoqueArmas:0});estado.defesaPosicional=normalizarDefesaPosicional(null);atualizarInterface()}''')
   page.locator('#abrir-muralhas').focus();page.keyboard.press('Enter');assert page.locator('#painel-muralhas').is_visible()
   page.locator('#autorizar-adarves').click();assert page.evaluate('estado.ampliacaoMuralhasAutorizada') is True
   assert page.evaluate('estado.trechosAdarveInterno+estado.trechosAdarveExterno')==0,'Authorization must not grant a free upgrade'
   page.locator('#fechar-muralhas').click()
   page.evaluate('estado.trechosAdarveInterno=4;estado.trechosAdarveExterno=4')
   def advance(seconds):page.evaluate('''d=>{estado.jogoPausado=false;atualizarGuarnicaoColonia(d);estado.jogoPausado=true;atualizarInterface();desenhar();salvarProgresso()}''',seconds)
   advance(.1);assert page.evaluate('estado.defesaPosicional.unidades.every(u=>u.fase==="indo")')
   advance(500);assert page.evaluate('estado.defesaPosicional.unidades.filter(u=>u.fase==="posto").length')==30
   page.locator('#jogo').scroll_into_view_if_needed()
   page.evaluate('centerTest(8100,4500,.16)');page.locator('#jogo').screenshot(path=str(out/f'{name}-manned-fortress.png'))
   page.evaluate('centerTest(5200,1630,1.3)');page.locator('#jogo').screenshot(path=str(out/f'{name}-tower-close.png'))
   point=page.evaluate('''()=>{const r=canvas.getBoundingClientRect(),v=dimensoesVisaoExpansao();return{x:r.left+(5000-estado.cameraExpansao.x)/v.largura*r.width,y:r.top+(1500-estado.cameraExpansao.y)/v.altura*r.height}}''')
   if touch:page.touchscreen.tap(point['x'],point['y'])
   else:page.mouse.click(point['x'],point['y'])
   assert page.locator('#painel-muralhas').is_visible();assert 'torre' in page.locator('#selecionado-muralhas').inner_text()
   assert page.evaluate('painelMuralhas.scrollWidth<=painelMuralhas.clientWidth+1')
   page.screenshot(path=str(out/f'{name}-garrison-panel.png'))
   page.locator('#exercicio-muralhas').click();page.locator('#fechar-muralhas').click()
   advance(.6);assert page.evaluate('estado.defesaPosicional.exercicio.flechas.length')>0
   page.evaluate('centerTest(4600,1120,.8)');page.locator('#jogo').screenshot(path=str(out/f'{name}-arrow-fire.png'))
   saved=page.evaluate('estado.defesaPosicional');page.wait_for_timeout(250);assert page.evaluate('estado.defesaPosicional')==saved
   reload_page();assert page.evaluate('estado.defesaPosicional')==saved,'Reload must preserve in-flight arrows, troops and quivers'
   advance(90);last=page.evaluate('estado.defesaPosicional.ultimo');assert last['disparos']>0 and last['abatidos']>0
   reload_page();advance(10);assert page.evaluate('estado.defesaPosicional.ultimo')==last
   page.evaluate('abrirPainelMuralhas()');page.locator('#alternar-guarnicao').click();advance(.2)
   assert page.evaluate('estado.defesaPosicional.unidades.every(u=>u.fase==="descendo")')
   advance(500);assert page.evaluate('estado.defesaPosicional.unidades.length')==0
   assert not errors,errors
   results.append({'viewport':name,'keyboardAndTap':'passed','paidUpgradeAuthorization':'passed','troopCount':30,'climbRecall':'passed','realProjectiles':'passed','pause':'passed','saveResume':'passed','noDuplicateExercise':'passed','exercise':last,'javascriptErrors':errors})
   ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'url':a.url,'isolated':a.isolated,'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'results':results}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('BROWSER_WALLS_OK '+json.dumps(report))
