"""Map restructuring paired host-browser benchmark. Not a physical-phone/battery test.
Use --baseline with the previous index.html and run from the repository root.
Both builds get identical deterministic fixtures and in-memory storage.
"""
import argparse,ast,hashlib,json,platform,shutil,statistics,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--seconds',type=float,default=30);p.add_argument('--output',default='verification-output/performance');a=p.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=None
for node in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
 if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in node.targets):setup=ast.literal_eval(node.value)
assert setup
prelude='''()=>{const m=new Map();let n=0,s=829417;crypto.randomUUID=()=>`perf-${++n}`;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});
window.__b={on:false,work:[],intervals:[],sim:0,last:null,allocations:0};const native=requestAnimationFrame;
window.requestAnimationFrame=cb=>native(t=>{const b=__b,active=b.on&&cb.name==='quadro',before=active?window.__time():0,start=performance.now();try{cb(t)}finally{if(active){b.work.push(performance.now()-start);if(b.last!==null)b.intervals.push(t-b.last);b.last=t;b.sim+=window.__time()-before}}});}'''
def quant(x,q):return sorted(x)[min(len(x)-1,int((len(x)-1)*q))] if x else None
def stats(x):return {'count':len(x),'mean':statistics.fmean(x) if x else None,'p95':quant(x,.95),'p99':quant(x,.99),'max':max(x) if x else None}
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 sysinfo=browser.new_browser_cdp_session().send('SystemInfo.getInfo')
 (out/'environment.json').write_text(json.dumps({'browser':browser.version,'platform':platform.platform(),'cpu':subprocess.check_output(['lscpu'],text=True),'gpu':sysinfo.get('gpu'),'storage':'in-memory; no real storage cost','device':'host Chromium, mobile viewport only; not a physical phone'},indent=2))
 for scenario in ['overview','stronghold','neighborhood']:
  for variant in ['baseline','map-layout','map-layout','baseline']:
   run=f'{scenario}-{len(results)+1}-{variant}';text=Path(a.baseline if variant=='baseline' else 'index.html').read_text();context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=3,is_mobile=True,has_touch=True)
   page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.evaluate(prelude);page.set_content(text,wait_until='load');page.evaluate(setup)
   page.evaluate('''()=>{estado.jogoPausado=false;window.__time=()=>tempoRio;focarCameraExpansao=()=>{};const name=typeof recalcularTrabalhadoresColonia==='function'?'recalcularTrabalhadoresColonia':'redistribuirTrabalhadoresColonia';const f=eval(name);eval(name+' = function(){if(__b.on)__b.allocations++;return f(...arguments)}')}''')
   page.evaluate({'overview':'centerTest(larguraMundoExpansao/2,alturaMundoExpansao/2,zoomMinimoExpansao)','stronghold':'centerTest(recintoInterno.x+recintoInterno.largura/2,recintoInterno.y+recintoInterno.altura/2,.25)','neighborhood':'centerTest(areaSegundoBlocoMoradias.x+600,areaSegundoBlocoMoradias.y+450,1.25)'}[scenario])
   page.locator('#jogo').scroll_into_view_if_needed();page.wait_for_timeout(3000)
   start=page.evaluate('()=>{__b.on=true;return performance.now()}');page.wait_for_timeout(a.seconds*1000)
   raw=page.evaluate('()=>{__b.on=false;return {...__b,end:performance.now(),population:estado.populacaoColonia,canvas:[canvas.width,canvas.height],economy:typeof auditoriaCidada==="function"?auditoriaCidada():null}}');duration=(raw['end']-start)/1000
   result={'run':run,'variant':variant,'scenario':scenario,'seconds':duration,'fps':len(raw['intervals'])/duration,'gameWorkMs':stats(raw['work']),'frameIntervalMs':stats(raw['intervals']),'effective10x':raw['sim']/duration,'framesOver50ms':sum(x>50 for x in raw['intervals']),'rawAllocations':raw['allocations'],'populationEnd':raw['population'],'canvas':raw['canvas'],'errors':errors,'accounting':raw.get('economy'),'dailyLife':page.evaluate("typeof cacheVidaCotidiana!=='undefined'?{registered:cacheVidaCotidiana.pessoas.length,currentlyExterior:cacheVidaCotidiana.pessoas.filter(p=>amostraVidaCotidiana(p.id)?.visivel).length,paths:cachePatiosCotidianos.size}:null"),'htmlSha256':hashlib.sha256(text.encode()).hexdigest()}
   (out/(run+'-raw.json')).write_text(json.dumps(raw));results.append(result);(out/'summary.json').write_text(json.dumps(results,indent=2));print(json.dumps(result),flush=True);context.close()
 browser.close()
