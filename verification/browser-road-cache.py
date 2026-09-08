"""Verify bounded screen-road caching, visible equivalence and invalidation.
An offscreen transparent layer can differ in edge antialiasing, not geometry.
"""
import ast,argparse,hashlib,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--output',default='verification-output/road-cache');a=p.parse_args();out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=None
for node in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
 if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in node.targets):setup=ast.literal_eval(node.value)
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for name,viewport,dpr in [('desktop',{'width':1440,'height':1000},1),('mobile',{'width':390,'height':844},2)]:
  context=browser.new_context(viewport=viewport,device_scale_factor=dpr);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate('''()=>{let n=0;crypto.randomUUID=()=>`road-${++n}`;const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''')
  page.set_content(Path('index.html').read_text(),wait_until='load');page.evaluate(setup)
  page.evaluate('''()=>{estado.jogoPausado=true;estado.tesouroColonia=0;estado.obraAutomaticaColonia=null;window.__cacheRoad=desenharRedeViariaColonia;window.__directRoad=()=>desenharRedeViariaColoniaDireta();}''')
  def compare(label):
   r=page.evaluate('''()=>{const before=JSON.stringify(estado);desenharRedeViariaColonia=__directRoad;desenhar();const a=contexto.getImageData(0,0,canvas.width,canvas.height).data;desenharRedeViariaColonia=__cacheRoad;desenhar();const b=contexto.getImageData(0,0,canvas.width,canvas.height).data;let pixels=0,max=0,total=0;for(let i=0;i<a.length;i+=4){let changed=false;for(let j=0;j<4;j++){const d=Math.abs(a[i+j]-b[i+j]);max=Math.max(max,d);total+=d;changed ||= d>0;}if(changed)pixels++;}return {pixels:canvas.width*canvas.height,changedPixels:pixels,maxChannelDifference:max,meanChannelDifference:total/a.length,stateUnchanged:before===JSON.stringify(estado),cachePixels:cachePinturaEstradasColonia?cachePinturaEstradasColonia.camada.width*cachePinturaEstradasColonia.camada.height:0};}''')
   assert r['stateUnchanged'],r
   assert r['cachePixels']<=4194304,r
   assert r['maxChannelDifference']<=8 and r['meanChannelDifference']<=.02,r
   assert r['changedPixels']/r['pixels']<=.04,r
   r.update(viewport=name,case=label);results.append(r);print(label,r,flush=True)
  for level in range(4):
   page.evaluate('(n)=>{estado.niveisEstradasColonia.fill(n);focarSetorPlanta("panorama");estado.obraAutomaticaColonia=null;}',level);compare('whole-tier-'+str(level))
   before=page.evaluate('cachePinturaEstradasColonia.refeitas');page.evaluate('desenhar();desenhar()');assert page.evaluate('cachePinturaEstradasColonia.refeitas')==before
   page.evaluate('centerTest(recintoInterno.x+900,recintoInterno.y+800,.8)');compare('close-tier-'+str(level))
   before=page.evaluate('cachePinturaEstradasColonia.refeitas')
   page.evaluate('estado.cameraExpansao.x+=31.25;desenhar()');assert page.evaluate('cachePinturaEstradasColonia.refeitas')>before;compare('panned-tier-'+str(level))
  page.evaluate('estado.niveisEstradasColonia.fill(0);estado.empregosColonia={};desenhar()');compare('sparse-trails')
  before=page.evaluate('cachePinturaEstradasColonia.refeitas');page.evaluate('estado.empregosColonia.lavoura=80;desenhar()');assert page.evaluate('cachePinturaEstradasColonia.refeitas')>before;compare('changed-traffic')
  for progress in [0,.4,.9]:
   page.evaluate('t=>{estado.obraAutomaticaColonia="estradaSegmento";estado.trechoEstradaEmObra=0;estado.tempoObraAutomaticaColonia=t*duracaoObraAutomaticaColonia;desenhar()}',progress)
   assert page.evaluate('cachePinturaEstradasColonia===null');compare('construction-'+str(progress))
  page.evaluate('estado.obraAutomaticaColonia=null;estado.niveisEstradasColonia.fill(3);cachePinturaEstradasColonia=null;window.OffscreenCanvas=undefined;desenhar()');assert page.evaluate('Boolean(cachePinturaEstradasColonia)');compare('html-canvas-fallback')
  page.evaluate('canvas.width+=8;canvas.height+=4;desenhar()');compare('resized')
  page.evaluate('canvas.width=2049;canvas.height=2049;desenhar()');assert page.evaluate('cachePinturaEstradasColonia===null');compare('memory-cap-fallback')
  assert not errors,errors;context.close()
 browser.close()
report={'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'results':results,'scope':'Synthetic Chromium pixel and invalidation checks, not physical-device profiling.'};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('ROAD_CACHE_BROWSER_OK '+json.dumps(report))
