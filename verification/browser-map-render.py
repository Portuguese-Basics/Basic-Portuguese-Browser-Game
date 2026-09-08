"""Compare old/new wall painting in actual Chromium at fixed, paused poses.
No simulation time is skipped. No screenshots or real player saves are inputs.
"""
import ast,argparse,hashlib,json,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--output',default='verification-output/map-render');args=p.parse_args();out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
setup=None
for node in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
 if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in node.targets):setup=ast.literal_eval(node.value)
old=subprocess.check_output(['git','show','c158b99822563e0f94c5f47ac00391e05de0b1c0:index.html'],text=True)
start=old.index('      function desenharLinhaPalicada(');end=old.index('\n      function ',start+20);old=old[start:end].strip()
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 for name,viewport in [('desktop',{'width':1440,'height':1000}),('mobile',{'width':390,'height':844})]:
  context=browser.new_context(viewport=viewport);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.evaluate('''()=>{let uid=0;crypto.randomUUID=()=>`pixel-${++uid}`;const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}''')
  page.set_content(Path('index.html').read_text(),wait_until='load');page.evaluate(setup)
  page.evaluate('''()=>{estado.jogoPausado=true;window.__batchedPainter=desenharLinhaPalicada;}''')
  page.evaluate('window.__oldPainter=('+old+')')
  for scene in ['plan','wood','stone','partial','parapet']:
   page.evaluate('''scene=>{estado.trechosPalicadaInterna=estado.trechosPalicadaExterna=scene==='plan'?0:4;estado.trechosMuralhaPedraInterna=estado.trechosMuralhaPedraExterna=['stone','parapet'].includes(scene)?4:0;estado.trechosAdarveInterno=estado.trechosAdarveExterno=scene==='parapet'?4:0;estado.obraAutomaticaColonia=scene==='partial'?'muralhaPedraExterna':null;estado.tempoObraAutomaticaColonia=scene==='partial'?13.2:0;estado.quantidadeTorresMuralha=scene==='parapet'?8:0;}''',scene)
   for zoom in ['whole','close']:
    page.evaluate('focarSetorPlanta("panorama")' if zoom=='whole' else 'centerTest(recintoExterno.x+200,recintoExterno.y+130,1.3)')
    result=page.evaluate('''()=>{const before=JSON.stringify(estado);desenharLinhaPalicada=__oldPainter;desenhar();const a=contexto.getImageData(0,0,canvas.width,canvas.height).data;desenharLinhaPalicada=__batchedPainter;desenhar();const b=contexto.getImageData(0,0,canvas.width,canvas.height).data;let pixels=0,max=0,total=0;for(let i=0;i<a.length;i+=4){let changed=false;for(let j=0;j<4;j++){const d=Math.abs(a[i+j]-b[i+j]);max=Math.max(max,d);total+=d;changed ||= d>0;}if(changed)pixels++;}return {pixels:canvas.width*canvas.height,changedPixels:pixels,maxChannelDifference:max,meanChannelDifference:total/a.length,stateUnchanged:before===JSON.stringify(estado)};}''')
    assert result['stateUnchanged'],result
    # Canvas batches rasterize stroke edges slightly differently. Geometry is
    # checked exactly in Node; these bounds detect missing/recolored structures,
    # not byte-identical antialiasing. Report every measured difference.
    assert result['maxChannelDifference'] <= 32, result
    assert result['meanChannelDifference'] <= .05, result
    assert result['changedPixels'] / result['pixels'] <= .03, result
    result.update(viewport=name,scene=scene,zoom=zoom);results.append(result)
   page.locator('#jogo').screenshot(path=str(out/f'{name}-{scene}.png'))
  assert not errors,errors
  context.close()
 browser.close()
report={'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'comparisons':results,'scope':'Host raster comparison; not handset certification.'}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print('MAP_RENDER_BROWSER_OK '+json.dumps(report))
