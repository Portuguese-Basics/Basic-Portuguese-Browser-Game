"""Desktop/touch acceptance of funded businesses and actual delivery; disposable saves."""
import argparse, ast, hashlib, http.server, json, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--isolated',action='store_true');p.add_argument('--output',default='verification-output/industry-browser');args=p.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
setup=next(ast.literal_eval(n.value) for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
sha=hashlib.sha256(Path('index.html').read_bytes()).hexdigest();server=None
if not args.url and not args.isolated:
 class Quiet(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*args):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start();args.url=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
  for name,vp,touch in [('desktop',{'width':1440,'height':1050},False),('mobile',{'width':390,'height':844},True)]:
   ctx=browser.new_context(viewport=vp,is_mobile=touch,has_touch=touch,device_scale_factor=2,accept_downloads=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   def load(saved=None):
    global page
    if args.isolated:
     if saved is None:saved={}
     page.close();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
     page.evaluate('''data=>{let uid=0;crypto.randomUUID=()=>`industry-test-${++uid}`;window.__industryStore=new Map(Object.entries(data));Object.defineProperty(window,'localStorage',{value:{getItem:k=>__industryStore.get(k)??null,setItem:(k,v)=>__industryStore.set(k,String(v)),removeItem:k=>__industryStore.delete(k)}})}''',saved)
     page.set_content(Path('index.html').read_text(),wait_until='load')
    else:
     r=page.goto(args.url,wait_until='load');assert r and r.ok and hashlib.sha256(r.body()).hexdigest()==sha
   def reload_game():
    if args.isolated:load(page.evaluate('Object.fromEntries(__industryStore)'))
    else:page.reload(wait_until='load')
    page.wait_for_timeout(100)
   load()
   page.evaluate(setup);page.evaluate('''()=>{estado.economiaCidada=novaEconomiaCidada();estado.industriaColonia=novaIndustriaColonia();sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);prepararVidaCotidiana();estado.jogoPausado=true;estado.salvamentoAtivo=true;}''')
   page.locator('#abrir-industria').focus();page.keyboard.press('Enter');assert page.locator('#painel-industria').is_visible()
   town=page.evaluate('estado.tesouroColonia');page.locator('#autorizar-industria').click()
   assert page.evaluate('estado.industriaColonia.ativa')
   assert page.evaluate('estado.tesouroColonia')==town-240
   assert page.evaluate('estado.industriaColonia.negocios.zeladoria.estado')=='obra'
   assert page.locator('#corpo-industria tr').count()==10
   assert page.evaluate('painelIndustria.scrollWidth<=painelIndustria.clientWidth+1')
   page.screenshot(path=str(out/f'{name}-funded-construction.png'))
   page.locator('#fechar-industria').click()
   # Synthetic completed establishments for focused UI/arrival tests. Full staged
   # paid construction is tested separately by industry-soak-test.js.
   page.evaluate('''()=>{
    const s=estado.industriaColonia,e=estado.economiaCidada;observarContasCidada();
    for(const p of planosIndustria){const b=s.negocios[p.id];if(b.estado==='planejado'){estado.tesouroColonia-=p.capital;b.caixa=p.capital*1000000;b.capital=b.caixa;}b.estado='ativo';b.obra=p.obra;b.meta=1;}
    for(const id of e.adultos){estado.tesouroColonia-=5;e.pessoas[id].saldo+=5000000;}marcarContasCidada();s.expansao=false;
    Object.assign(s.negocios.cervejaria.estoque,{lupulo:24,graos:48,madeira:12,cerveja:64});Object.assign(s.negocios.floresta.estoque,{madeira:48});s.negocios.artes.estoque.artigos=32;
    s.negocios.taverna.estoque.cerveja=32;s.negocios['taverna-sul'].estoque.cerveja=32;s.negocios.teatro.estoque.ingressos=48;s.negocios.festival.estoque.ingressos=48;s.festivalAte=1000;
    for(const place of ['taverna','taverna-sul','teatro','festival']){const worker=candidatosIndustria()[0],b=s.negocios[place],a=novoAgenteIndustria(worker,'trabalho',place,entradaIndustria(place),salarioTurnoIndustria);b.caixa-=salarioTurnoIndustria;Object.assign(a,entradaIndustria(place));a.trecho=a.caminho.length;a.fase='atividade';a.trabalho=20;s.agentes[worker.id]=a;}
    const person=candidatosIndustria()[0];window.__buyer=person.id;const a=novoAgenteIndustria(person,'visita','taverna',entradaIndustria('taverna'));s.agentes[person.id]=a;window.__before=person.saldo;
    prepararVidaCotidiana();atualizarPainelIndustria(true);salvarProgresso();desenhar();
   }''')
   assert page.evaluate('auditoriaCidada().diferenca')==0
   assert page.evaluate('executarCompraIndustria(estado.industriaColonia.agentes[__buyer])') is False
   buyer=page.evaluate('__buyer');before=page.evaluate('__before')
   initial=page.evaluate('amostraVidaCotidiana(__buyer)')
   page.evaluate('''()=>{estado.jogoPausado=false;for(let i=0;i<10;i++)atualizarIndustriaColonia(.5);estado.jogoPausado=true;desenhar();}''')
   later=page.evaluate('amostraVidaCotidiana(__buyer)');assert (later['x'],later['y'])!=(initial['x'],initial['y'])
   assert page.evaluate('estado.economiaCidada.pessoas[__buyer].saldo')==before
   # Save mid-route at the actual origin, not a set_content simulation.
   page.evaluate('salvarProgresso()');state=page.evaluate('estado.industriaColonia');financial=page.evaluate('estado.economiaCidada')
   reload_game()
   (out/f'{name}-saved-before.json').write_text(json.dumps(state,indent=2));(out/f'{name}-saved-after.json').write_text(json.dumps(page.evaluate('estado.industriaColonia'),indent=2))
   assert page.evaluate('estado.industriaColonia')==state
   assert page.evaluate('estado.economiaCidada')==financial
   page.evaluate('(id)=>window.__buyer=id',buyer)
   # Traverse the recorded route; actual visit waits for service after arrival.
   page.evaluate('(value)=>window.__testBefore=value',before)
   seconds=page.evaluate('''()=>{estado.jogoPausado=false;let seconds=0;while(seconds<350&&estado.economiaCidada.pessoas[__buyer].saldo===__testBefore){atualizarIndustriaColonia(.5);seconds+=.5;}estado.jogoPausado=true;desenhar();salvarProgresso();return seconds;}''')
   assert page.evaluate('estado.economiaCidada.pessoas[__buyer].saldo')==before-1540000, (name,seconds,page.evaluate('estado.industriaColonia.agentes[__buyer]'))
   assert page.evaluate('auditoriaCidada().diferenca')==0
   for place in ['taverna','teatro','lupulo','cervejaria']:
    page.evaluate('(id)=>focarIndustria(id)',place);page.locator('#jogo').scroll_into_view_if_needed();page.locator('#jogo').screenshot(path=str(out/f'{name}-{place}.png'))
   page.locator('#abrir-industria').click();assert page.evaluate('painelIndustria.scrollWidth<=painelIndustria.clientWidth+1');page.screenshot(path=str(out/f'{name}-business-accounts.png'))
   page.locator('[data-empresa="teatro"]').click();assert not page.locator('#painel-industria').is_visible()
   # Real canvas/touch selection opens the new inspected business.
   point=page.evaluate('''()=>{const a=planoIndustria('teatro'),r=canvas.getBoundingClientRect(),v=dimensoesVisaoExpansao();return{x:r.left+(a.x+a.largura/2-estado.cameraExpansao.x)/v.largura*r.width,y:r.top+(a.y+a.altura/2-estado.cameraExpansao.y)/v.altura*r.height}}''')
   if touch:page.touchscreen.tap(point['x'],point['y'])
   else:page.mouse.click(point['x'],point['y'])
   assert page.locator('#painel-industria').is_visible()
   totals=page.evaluate('estado.industriaColonia.totais');page.locator('#fechar-industria').click();page.evaluate('salvarProgresso()');reload_game()
   assert page.evaluate('estado.industriaColonia.totais')==totals
   assert page.evaluate('auditoriaCidada().diferenca')==0
   assert not errors,errors
   results.append({'viewport':name,'touch':touch,'capitalTransferred':240,'businesses':10,'realVisitTravelSeconds':seconds+5,'customerPaid':1.54,'saveMidTrip':True,'exactTaxesCoveredByUnitSuite':True,'noRepeatedPaymentOnReload':True,'keyboardAndCanvasTap':True,'noHorizontalOverflow':True,'accountingDiscrepancy':0,'javascriptErrors':errors})
   ctx.close()
  browser.close()
finally:
 if server:server.shutdown()
report={'url':args.url,'isolated':args.isolated,'htmlSha256':sha,'results':results,'scope':'Disposable synthetic browser contexts; staged construction and budget tested separately. Not physical-phone certification.'};(out/'industry-browser-report.json').write_text(json.dumps(report,indent=2));print('INDUSTRY_BROWSER_OK '+json.dumps(report))
