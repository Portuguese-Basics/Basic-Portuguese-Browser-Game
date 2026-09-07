"""Identity-linked presence, real-origin persistence and desktop/touch acceptance.
Synthetic disposable saves; viewport emulation is not physical-device certification.
"""
import argparse, ast, hashlib, http.server, json, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url');parser.add_argument('--isolated',action='store_true');parser.add_argument('--output',default='verification-output/daily-life');a=parser.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
 if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets):setup=ast.literal_eval(n.value)
server=None
if not a.url and not a.isolated:
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start();a.url=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
  for name,vp,touch in [('desktop',{'width':1440,'height':1050},False),('mobile',{'width':390,'height':844},True)]:
   ctx=browser.new_context(viewport=vp,is_mobile=touch,has_touch=touch,device_scale_factor=2);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def load(saved=None):
    global page
    if a.isolated:
     page.close();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     page.evaluate("""data=>{let n=0;crypto.randomUUID=()=>`life-${++n}`;const m=new Map(Object.entries(data||{}));window.__lifeStorage=m;Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}""",saved)
     page.set_content(Path('index.html').read_text(),wait_until='load')
    else:
     res=page.goto(a.url,wait_until='load');assert res and res.ok
     assert hashlib.sha256(res.body()).digest()==hashlib.sha256(Path('index.html').read_bytes()).digest()
   load()
   page.evaluate(setup)
   page.evaluate('''()=>{estado.economiaCidada=novaEconomiaCidada();estado.vidaCotidiana=novaVidaCotidiana();estado.jogoPausado=true;estado.salvamentoAtivo=true;sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);prepararVidaCotidiana();estado.vidaCotidiana.tempo=37.25;salvarProgresso();}''')
   coverage=page.evaluate('''()=>{let min=60,maxGap=0;const rows=[];for(const p of cacheVidaCotidiana.pessoas){if(papeisMilitaresCidada.includes(p.tipo))continue;let visible=0,gap=0,big=0;for(let n=0;n<240;n++){const a=amostraVidaCotidiana(p.id,37.25+n*.25);if(a.visivel){visible+=.25;gap=0;}else{gap+=.25;big=Math.max(big,gap);}}rows.push({id:p.id,job:p.tipo,exteriorSeconds:visible,maxHiddenSeconds:big});min=Math.min(min,visible);maxGap=Math.max(maxGap,big);}return {residents:cacheVidaCotidiana.pessoas.length,minimumExteriorSeconds:min,maximumHiddenSeconds:maxGap,rows};}''')
   assert coverage['residents']==450 and coverage['minimumExteriorSeconds']>=40 and coverage['maximumHiddenSeconds']<=14
   (out/f'{name}-coverage.json').write_text(json.dumps(coverage,indent=2))
   page.locator('#jogo').scroll_into_view_if_needed()
   for scene,expr in [('neighborhood','centerTest(areaSegundoBlocoMoradias.x+600,areaSegundoBlocoMoradias.y+450,1.25)'),('workyards','centerTest(areaClinicaColonia.x+areaClinicaColonia.largura/2,areaClinicaColonia.y+areaClinicaColonia.altura+30,1.05)'),('fields','centerTest(2200,3440,.52)'),('city','centerTest(7900,4250,.17)')]:
    page.evaluate(expr+';atualizarControlesCamera()');page.locator('#jogo').screenshot(path=str(out/f'{name}-{scene}.png'))
   # Find a resident using their real register ID and the actual control.
   resident=page.evaluate('cacheVidaCotidiana.pessoas.find(p=>p.tipo==="geral").id')
   page.locator('#abrir-economia-cidada').click();page.locator('#buscar-cidadao').fill(resident)
   page.locator(f'[data-cidadao="{resident}"]').click();assert page.locator('#localizar-cidadao-mapa').is_enabled()
   page.locator('#localizar-cidadao-mapa').focus();page.keyboard.press('Enter');assert not page.locator('#painel-economia-cidada').is_visible()
   assert page.evaluate('destaqueVidaCotidiana')==resident
   page.locator('#jogo').screenshot(path=str(out/f'{name}-named-resident.png'))
   # Paused movement stays put, including hauling; the clock is persistent.
   snapshot=page.evaluate('JSON.stringify(cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id)))')
   page.wait_for_timeout(300);assert page.evaluate('JSON.stringify(cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id)))')==snapshot
   page.evaluate('salvarProgresso()');clock=page.evaluate('estado.vidaCotidiana.tempo');money=page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(estado.economiaCidada.pessoas).map(([id,p])=>[id,[p.saldo,p.atrasados,p.impostos]])))')
   if a.isolated:load(page.evaluate('Object.fromEntries(__lifeStorage)'))
   else:page.reload(wait_until='load')
   page.wait_for_timeout(150)
   assert page.evaluate('estado.vidaCotidiana.tempo')==clock
   assert page.evaluate('JSON.stringify(cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id)))')==snapshot
   assert page.evaluate('JSON.stringify(Object.fromEntries(Object.entries(estado.economiaCidada.pessoas).map(([id,p])=>[id,[p.saldo,p.atrasados,p.impostos]])))')==money
   # A changing clock moves real residents, not cargo stock; drawing is pure.
   readonly=page.evaluate('''()=>{const before=JSON.stringify(estado);for(let i=0;i<8;i++)desenhar();return before===JSON.stringify(estado)}''');assert readonly
   page.evaluate('''()=>{estado.jogoPausado=false;atualizarVidaCotidiana(5);estado.jogoPausado=true;desenhar()}''')
   assert page.evaluate('JSON.stringify(cacheVidaCotidiana.pessoas.filter(p=>!papeisMilitaresCidada.includes(p.tipo)).map(p=>amostraVidaCotidiana(p.id)))')!=snapshot
   # The person locator must not turn an off-map expedition into a second town resident.
   page.evaluate('''()=>{estado.defesaPosicional.unidades=[];estado.cacaMilicia.expedicao={fase:'cacando',quantidade:5,duracao:120,tempo:1,esforco:5,semente:2};prepararVidaCotidiana()}''')
   assert page.evaluate('cacheVidaCotidiana.pessoas.filter(p=>p.tipo==="milicia"&&p.vaga<5).every(p=>amostraVidaCotidiana(p.id).fora)')
   assert not errors,errors
   results.append({'viewport':name,'registeredResidents':450,'coverageMinimumExteriorSeconds':coverage['minimumExteriorSeconds'],'coverageMaximumHiddenSeconds':coverage['maximumHiddenSeconds'],'locatorKeyboard':True,'saveResumeExact':True,'pausedStable':True,'readOnlyDrawing':readonly,'offMapHuntNotDuplicated':True,'javascriptErrors':errors})
   ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'url':a.url,'isolated':a.isolated,'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'results':results}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('BROWSER_DAILY_LIFE_OK '+json.dumps(report))
