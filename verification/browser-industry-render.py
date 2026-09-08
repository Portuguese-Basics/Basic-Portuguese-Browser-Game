"""Read-only bounded background caching; live actors are never cached in the layer."""
import argparse,ast,hashlib,json,shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--output',default='verification-output/industry-render');a=p.parse_args();out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=next(ast.literal_eval(n.value) for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets));rows=[]
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for name,vp,dpr in [('desktop',{'width':1440,'height':1000},1),('mobile',{'width':390,'height':844},2)]:
  c=b.new_context(viewport=vp,device_scale_factor=dpr);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate('''()=>{let uid=0;crypto.randomUUID=()=>`industry-raster-${++uid}`;const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''');page.set_content(Path('index.html').read_text(),wait_until='load');page.evaluate(setup)
  page.evaluate('''()=>{estado.jogoPausado=true;autorizarIndustria();for(const p of planosIndustria){const b=estado.industriaColonia.negocios[p.id];b.estado='ativo';b.obra=p.obra;b.caixa=p.capital*1000000;}prepararVidaCotidiana();window.__cached=desenharIndustriaColonia;window.__direct=()=>desenharIndustriaColoniaDireta(contexto);window.__original=desenharIndustriaColonia;}''')
  def compare(label):
   r=page.evaluate('''()=>{const before=JSON.stringify(estado);desenharIndustriaColonia=__direct;desenhar();const a=contexto.getImageData(0,0,canvas.width,canvas.height).data;desenharIndustriaColonia=__cached;desenhar();const b=contexto.getImageData(0,0,canvas.width,canvas.height).data;let n=0,max=0,sum=0;for(let i=0;i<a.length;i+=4){let ch=false;for(let j=0;j<4;j++){const d=Math.abs(a[i+j]-b[i+j]);max=Math.max(max,d);sum+=d;ch ||= d>0;}if(ch)n++;}return{pixels:canvas.width*canvas.height,changed:n,max,mean:sum/a.length,readOnly:before===JSON.stringify(estado),cachePixels:cachePinturaIndustria?cachePinturaIndustria.camada.width*cachePinturaIndustria.camada.height:0};}''')
   assert r['readOnly'] and r['cachePixels']<=4194304,r
   assert r['mean']<=.06 and r['max']<=12 and r['changed']/r['pixels']<=.05,(label,r)
   rows.append({'viewport':name,'case':label,**r});print(rows[-1],flush=True)
  for scene in ['panorama','cidade','cidadela']:
   page.evaluate('(s)=>focarSetorPlanta(s)',scene);compare(scene)
  for id in ['taverna','teatro','lupulo','cervejaria']:
   page.evaluate('(id)=>focarIndustria(id)',id);compare(id)
  for code,label in [('estado.industriaColonia.negocios.taverna.caixa-=1000000','cash'),('estado.industriaColonia.negocios.teatro.estado="obra";estado.industriaColonia.negocios.teatro.obra=5','construction'),('estado.cameraExpansao.x+=33','pan'),('estado.cameraExpansao.zoom=.5;limitarCameraExpansao()','zoom'),('canvas.width+=8;canvas.height+=4','resize')]:
   page.evaluate('desenhar()');old=page.evaluate('cachePinturaIndustria.refeitas');page.evaluate(code+';desenhar()');assert page.evaluate('cachePinturaIndustria.refeitas')>old;compare(label)
  before=page.evaluate('cachePinturaIndustria.refeitas');page.evaluate('desenhar();desenhar()');assert page.evaluate('cachePinturaIndustria.refeitas')==before
  # Registered active task count invalidates, but walking poses are not in this background.
  old=page.evaluate('cachePinturaIndustria.refeitas');page.evaluate('''()=>{const p=candidatosIndustria()[0],a=novoAgenteIndustria(p,'visita','taverna',entradaIndustria('taverna'));estado.industriaColonia.agentes[p.id]=a;desenhar();}''');assert page.evaluate('cachePinturaIndustria.refeitas')>old;compare('new-actor-count')
  page.evaluate('cachePinturaIndustria=null;window.OffscreenCanvas=undefined;desenhar()');assert page.evaluate('Boolean(cachePinturaIndustria)');compare('html-canvas-fallback')
  page.evaluate('canvas.width=2049;canvas.height=2049;desenhar()');assert page.evaluate('cachePinturaIndustria===null');compare('memory-cap-fallback')
  page.evaluate('estado.industriaColonia.ativa=false;desenharIndustriaColonia()');assert page.evaluate('cachePinturaIndustria===null')
  assert not errors,errors;c.close()
 b.close()
report={'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'checks':rows,'scope':'Synthetic Chromium raster/invalidation checks; antialiasing tolerance is not a geometry change.'};(out/'report.json').write_text(json.dumps(report,indent=2));print('INDUSTRY_RENDER_OK',len(rows))
