"""Map restructuring acceptance against exact served bytes or labelled isolated DOM.
Disposable fictional saves only. No physical-phone or hydraulic certification.
"""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--isolated',action='store_true');p.add_argument('--output',default='verification-output/map-browser');a=p.parse_args()
if not a.isolated and not a.url:p.error('Specify --url or --isolated')
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
subprocess.run(['node','verification/map-fixture.js'],check=True)
old=json.loads(Path('verification-output/map-legacy-fixture.json').read_text());html=Path('index.html').read_text();sha=hashlib.sha256(html.encode()).hexdigest();results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for name,vp,touch in [('desktop',{'width':1600,'height':1000},False),('mobile',{'width':390,'height':844},True)]:
  context=browser.new_context(viewport=vp,device_scale_factor=2,is_mobile=touch,has_touch=touch);errors=[]
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def load(saved):
   global page
   if a.isolated:
    page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.evaluate('''data=>{let i=0;crypto.randomUUID=()=>`map-${++i}`;const m=new Map(Object.entries(data));window.__mapStore=m;Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''',saved)
    page.set_content(html,wait_until='load')
   else:
    # Install the disposable save before the game script starts. Writing it into an
    # already-running game lets its pagehide autosave overwrite the fixture on reload.
    page.close();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script('localStorage.clear();for(const [k,v]of Object.entries('+json.dumps(saved)+'))localStorage.setItem(k,v);')
    r=page.goto(a.url,wait_until='load');assert r and r.ok and hashlib.sha256(r.body()).hexdigest()==sha
   page.wait_for_timeout(150)
  load(old)
  assert page.evaluate('larguraMundoExpansao')==17500
  assert page.evaluate('estado.populacaoColonia')==450
  assert page.evaluate('estado.defesaPosicional.unidades.length')==30
  assert page.evaluate('auditoriaCidada().diferenca')==0
  assert page.evaluate('estado.quantidadeCasasColonia')==90
  page.locator('#abrir-planta-colonia').focus();page.keyboard.press('Enter')
  assert page.locator('#painel-planta-colonia').is_visible()
  assert page.evaluate('document.querySelector("#painel-planta-colonia").scrollWidth<=document.querySelector("#painel-planta-colonia").clientWidth+1')
  page.screenshot(path=str(out/f'{name}-plan-panel.png'))
  page.locator('#mostrar-lotes-planta').uncheck();assert not page.evaluate('mostrarReservasPlanta')
  page.locator('#mostrar-lotes-planta').check();assert page.evaluate('mostrarReservasPlanta')
  for scene in ['panorama','cidadela','cidade','costa']:
   if not page.locator('#painel-planta-colonia').is_visible():page.locator('#abrir-planta-colonia').click()
   page.locator('#planta-'+scene).click();page.locator('#jogo').scroll_into_view_if_needed()
   if scene=='panorama':assert page.evaluate('dimensoesVisaoExpansao().largura')==17500
   page.locator('#jogo').screenshot(path=str(out/f'{name}-{scene}.png'))
  # A new geographic location still opens the correct live stock inspection on tap.
  page.evaluate('''()=>{const a=areaDepositoFlechas;focarCameraExpansao({x:a.x+a.largura/2,y:a.y+a.altura/2},1.3);desenhar()}''')
  point=page.evaluate('''()=>{const a=areaDepositoFlechas,r=canvas.getBoundingClientRect(),v=dimensoesVisaoExpansao();return{x:r.left+(a.x+a.largura/2-estado.cameraExpansao.x)/v.largura*r.width,y:r.top+(a.y+a.altura/2-estado.cameraExpansao.y)/v.altura*r.height}}''')
  if touch:page.touchscreen.tap(point['x'],point['y'])
  else:page.mouse.click(point['x'],point['y'])
  assert page.locator('dialog[open] meter').count()>0
  page.screenshot(path=str(out/f'{name}-relocated-ammunition-inspection.png'))
  page.keyboard.press('Escape')
  # The current migration marker must make another full load idempotent, including all positions.
  page.evaluate('salvarProgresso()')
  snapshot=page.evaluate('JSON.stringify(estado)')
  saved=page.evaluate('Object.fromEntries(__mapStore)' if a.isolated else 'Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))')
  assert json.loads(next(iter(saved.values())))['expansao']['plantaRevisao']==1
  load(saved)
  assert page.evaluate('JSON.stringify(estado)')==snapshot, 'Second relocation moved state again'
  assert not errors,errors
  results.append({'viewport':name,'legacySaveMigrated':True,'houseCount':90,'population':450,'garrison':30,'accountingDiscrepancy':0,'keyboardPanel':True,'noHorizontalOverflow':True,'relocatedStockTap':True,'secondLoadExact':True,'javascriptErrors':errors})
  context.close()
 browser.close()
report={'htmlSha256':sha,'url':a.url,'isolated':a.isolated,'results':results};(out/'browser-map-report.json').write_text(json.dumps(report,indent=2)+'\n');print('MAP_BROWSER_OK '+json.dumps(report))
