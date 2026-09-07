"""Foreground 1x presence observation, not a physical-phone benchmark.
World availability is distinguished from actual drawing in the current viewport.
--url uses a disposable real-origin save; otherwise the save is isolated in memory.
"""
import argparse, ast, hashlib, json, shutil, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--seconds',type=float,default=65);p.add_argument('--output',default='verification-output/daily-life-soak');a=p.parse_args()
if a.seconds<61:p.error('At least 61 foreground seconds are required')
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=next(ast.literal_eval(n.value) for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
prelude='''(()=>{let n=0,s=829417;crypto.randomUUID=()=>`presence-${++n}`;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
window.__presence={on:false,work:[],intervals:[],last:null,sampledAt:-Infinity,observations:{},drawn:[],startSim:0};const native=requestAnimationFrame;
requestAnimationFrame=cb=>native(t=>{const b=__presence,active=b.on&&cb.name==='quadro',start=performance.now();try{cb(t)}finally{if(active){b.work.push(performance.now()-start);if(b.last!==null)b.intervals.push(t-b.last);b.last=t;if(t-b.sampledAt>=200){b.sampledAt=t;window.__observeLife()}}}});})();'''
def stats(x):
 y=sorted(x);return {'count':len(y),'mean':statistics.fmean(y) if y else 0,'p95':y[int((len(y)-1)*.95)] if y else 0,'max':max(y) if y else 0}
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2);c.add_init_script(prelude);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));html=Path('index.html').read_bytes()
 if a.url:
  r=page.goto(a.url,wait_until='load');assert r and r.ok and hashlib.sha256(r.body()).digest()==hashlib.sha256(html).digest()
 else:
  page.evaluate(prelude);page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}")
  page.set_content(html.decode(),wait_until='load')
 page.evaluate(setup)
 page.evaluate('''()=>{estado.economiaCidada=novaEconomiaCidada();estado.vidaCotidiana=novaVidaCotidiana();sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);prepararVidaCotidiana();estado.jogoPausado=false;estado.velocidadeTempo=1;focarCameraExpansao=()=>{};centerTest(areaSegundoBlocoMoradias.x+600,areaSegundoBlocoMoradias.y+450,1.25);
 const draw=desenharPessoaCotidiana,seen=new Set();desenharPessoaCotidiana=function(a,p,...rest){if(__presence.on)seen.add(p.id);return draw(a,p,...rest)};
 window.__observeLife=()=>{for(const p of cacheVidaCotidiana.pessoas){const a=amostraVidaCotidiana(p.id);let o=__presence.observations[p.id];if(!o)o=__presence.observations[p.id]={id:p.id,job:p.tipo,seenOutside:false,offMap:false,firstObserved:estado.vidaCotidiana.tempo,lastVisible:null,maxHidden:0};if(a.fora){o.offMap=true;continue;}if(a.visivel){o.seenOutside=true;o.lastVisible=estado.vidaCotidiana.tempo;}else o.maxHidden=Math.max(o.maxHidden,estado.vidaCotidiana.tempo-(o.lastVisible??o.firstObserved));}__presence.drawn=[...seen]};}''')
 page.locator('#jogo').scroll_into_view_if_needed();page.wait_for_timeout(1000)
 start=page.evaluate('()=>{__presence.on=true;__presence.startSim=estado.vidaCotidiana.tempo;return performance.now()}');page.wait_for_timeout(a.seconds*1000)
 raw=page.evaluate('()=>{__presence.on=false;__observeLife();return {...__presence,end:performance.now(),endSim:estado.vidaCotidiana.tempo,audit:auditoriaCidada(),registered:cacheVidaCotidiana.pessoas.length}}')
 duration=(raw['end']-start)/1000;sim=raw['endSim']-raw['startSim'];rows=list(raw['observations'].values());eligible=[o for o in rows if not o['offMap']]
 assert sim>=60, f'Only {sim} simulated seconds advanced';assert eligible and all(o['seenOutside'] for o in eligible);assert max(o['maxHidden'] for o in eligible)<=14.5
 assert len(raw['drawn'])>=20,'The visible neighborhood should draw multiple distinct actual residents'
 assert raw['audit']['diferenca']==0 and not errors
 page.locator('#jogo').screenshot(path=str(out/'mobile-minute-neighborhood.png'))
 report={'url':a.url,'storage':'real origin, disposable profile' if a.url else 'isolated in memory','htmlSha256':hashlib.sha256(html).hexdigest(),'browser':b.version,'durationSeconds':duration,'simulationSeconds':sim,'effective1x':sim/duration,'fps':len(raw['intervals'])/duration,'gameWorkMs':stats(raw['work']),'frameIntervalMs':stats(raw['intervals']),'framesOver50ms':sum(x>50 for x in raw['intervals']),'residentsObserved':len(rows),'onMapResidentsSeenOutside':len(eligible),'longestSampledIndoorGapSeconds':max(o['maxHidden'] for o in eligible),'distinctActuallyDrawnInNeighborhoodViewport':len(raw['drawn']),'offMapExceptions':len(rows)-len(eligible),'accounting':raw['audit'],'javascriptErrors':errors,'scope':'World availability for all identities; actual drawing counted separately for this fixed viewport. Not a handset or thermal certification.'}
 (out/'raw.json').write_text(json.dumps(raw));(out/'report.json').write_text(json.dumps(report,indent=2));print('DAILY_LIFE_LIVE_SOAK_OK '+json.dumps(report));c.close();b.close()
