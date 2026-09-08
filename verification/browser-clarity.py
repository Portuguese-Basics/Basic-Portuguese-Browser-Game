"""Field/storage acceptance on desktop/mobile. --isolated uses in-memory saves.
Without --isolated use --url to test the exact release in a real origin.
No physical-phone performance claims are made by viewport emulation.
"""
import argparse, hashlib, json, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser();p.add_argument('--isolated',action='store_true');p.add_argument('--url');p.add_argument('--output',default='verification-output/clarity');a=p.parse_args()
if not a.isolated and not a.url: p.error('Use --url or --isolated')
out=Path(a.output);out.mkdir(parents=True,exist_ok=True);html=Path('index.html').read_text()
PRELUDE='''() => {let n=0;crypto.randomUUID=()=>`clarity-${++n}`;const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}'''
SETUP='''() => {
 for(const k of Object.keys(estado))if(/Construid[oa]s?$/.test(k)&&typeof estado[k]==='boolean')estado[k]=true;
 Object.assign(estado,{coloniaIniciada:true,mapaExpansaoComprado:true,mapaAtual:'expansao',revisaoColonia:versaoColonia,etapaConstrucaoColonia:4,
 populacaoColonia:450,quantidadeCasasColonia:90,idadesAdultosColonia:Array(450).fill(32),familiasColonia:[],criancasColonia:[],tesouroColonia:20000,
 saudeColonia:100,quantidadeCabanasLenhadores:2,quantidadeCabanasColeta:2,quantidadePocosPublicos:4,quantidadeMilicianos:10,quantidadeGuardas:10,quantidadeSoldados:10,
 quantidadePostosGuarda:4,nivelOficinaFerramentas:3,barcosPesca:5,naviosMercantes:5,obraAutomaticaColonia:null,
 estoqueGraos:75,estoqueHortalicas:100,estoqueFeijao:0,estoquePaes:80,estoqueAlimentos:125,estoqueErvas:100,estoqueMedicamentos:60,
 estoqueMadeira:100,estoqueMinerio:80,estoquePedra:90,estoqueCarneSelvagem:40,estoqueCarneCriacao:100,estoqueCortesCarne:72,
 estoqueRefeicoesCarne:75,estoqueRefeicoesHortalicas:60,estoqueRefeicoesFeijao:90,estoqueCarneDefumada:100,estoquePeixeSeco:70,
 estoqueFerramentas:60,estoqueFerramentasMadeira:30,estoqueFerramentasPedra:40,estoqueCouro:110,estoqueLancasMadeira:60,estoqueArcos:40,estoqueFlechas:600,
 estoqueArmaduras:{couro:9,reforcada:12,malha:8,placas:4},velocidadeTempo:10,jogoPausado:true,ciclosSoldosAtrasados:0,cameraExpansao:{x:0,y:0,zoom:.6}});
 estado.niveisEstradasColonia.fill(3);estado.cacaMilicia=novoEstadoCacaMilicia();atualizarInterface();redimensionar();
 window.centerTest=(x,y,zoom)=>{estado.cameraExpansao.zoom=zoom;const v=dimensoesVisaoExpansao();estado.cameraExpansao.x=x-v.largura/2;estado.cameraExpansao.y=y-v.altura/2;limitarCameraExpansao();desenhar()};
}'''
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for name,vp,touch in [('desktop',{'width':1440,'height':1000},False),('mobile',{'width':390,'height':844},True)]:
  context=browser.new_context(viewport=vp,is_mobile=touch,has_touch=touch,device_scale_factor=2)
  page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  if a.isolated: page.evaluate(PRELUDE);page.set_content(html,wait_until='load')
  else:
   response=page.goto(a.url,wait_until='load');assert response and response.ok
   assert hashlib.sha256(response.body()).hexdigest()==hashlib.sha256(Path('index.html').read_bytes()).hexdigest()
  page.evaluate(SETUP);page.locator('#jogo').scroll_into_view_if_needed()
  page.evaluate('centerTest(2150,4050,.38)');page.locator('#jogo').screenshot(path=str(out/f'{name}-fields.png'))
  page.evaluate('centerTest(areaArmazemGraos.x+190,areaArmazemGraos.y+135,1.6)');page.locator('#jogo').screenshot(path=str(out/f'{name}-stores.png'))
  page.evaluate('centerTest(areaDepositoFlechas.x+areaDepositoFlechas.largura/2,areaDepositoFlechas.y+areaDepositoFlechas.altura/2,1.6)');page.locator('#jogo').screenshot(path=str(out/f'{name}-arsenal.png'))
  page.evaluate('centerTest(areaArmeiroColonia.x+areaArmeiroColonia.largura/2,areaArmeiroColonia.y+areaArmeiroColonia.altura/2,1.8)');page.locator('#jogo').screenshot(path=str(out/f'{name}-armor.png'))
  page.evaluate('centerTest(2150,3550,1.1)');page.locator('#jogo').screenshot(path=str(out/f'{name}-field-close.png'))
  # Direct canvas tap, not a programmatic dialog open.
  page.evaluate('centerTest(areaArmazemGraos.x+190,areaArmazemGraos.y+135,1.6)')
  point=page.evaluate('''()=>{const r=canvas.getBoundingClientRect(),v=dimensoesVisaoExpansao();return {x:r.left+(areaArmazemGraos.x+190-estado.cameraExpansao.x)/v.largura*r.width,y:r.top+(areaArmazemGraos.y+135-estado.cameraExpansao.y)/v.altura*r.height}}''')
  if touch: page.touchscreen.tap(point['x'],point['y'])
  else: page.mouse.click(point['x'],point['y'])
  meter=page.locator('#painel-edificio meter').first
  if meter.count()==0: meter=page.locator('dialog[open] meter').first
  assert meter.is_visible();assert meter.get_attribute('value')=='75';assert meter.get_attribute('max')=='150'
  page.screenshot(path=str(out/f'{name}-inspection.png'))
  page.evaluate('estado.estoqueGraos=150; atualizarPainelEdificioSelecionadoColonia()')
  assert meter.get_attribute('value')=='150'
  page.evaluate('fecharInspecaoEdificioColonia(); estado.estoqueMedicamentos=120; const e=edificiosInspecionaveisColonia().find(e=>e.id==="farmacia");abrirInspecaoEdificioColonia(e)')
  meter=page.locator('dialog[open] meter').first
  assert meter.get_attribute('max')=='120' and meter.get_attribute('value')=='120'
  assert page.evaluate('''()=>{const d=document.querySelector('dialog[open]');return d.scrollWidth<=d.clientWidth+1}''')
  page.evaluate('fecharInspecaoEdificioColonia()')
  assert page.evaluate('''()=>{const state=JSON.stringify(estado);for(let i=0;i<5;i++)desenhar();return state===JSON.stringify(estado)}''')
  assert not errors,errors
  results.append({'viewport':name,'touch':touch,'inventoryMeters':'passed','capacityUpgrade':'passed','liveRefresh':'passed','readOnlyDrawing':'passed','javascriptErrors':errors})
  context.close()
 browser.close()
report={'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'url':a.url,'isolated':a.isolated,'results':results}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('BROWSER_CLARITY_OK '+json.dumps(report))
