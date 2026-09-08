"""Observe the real frame loop at 1x in an isolated synthetic browser profile.
The supplied fixture is not a real player save; its seed/setup is reported separately.
"""
import argparse
import hashlib
import json
import shutil
import statistics
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url')
parser.add_argument('--save', default='verification-output/industry-live-fixture.json')
parser.add_argument('--seconds', type=float, default=65)
parser.add_argument('--output', default='verification-output/industry-live')
args = parser.parse_args()
if not 1 <= args.seconds <= 300:
    raise ValueError('Use a bounded observation of 1 to 300 seconds')
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
saved = json.loads(Path(args.save).read_text())
html = Path('index.html').read_bytes()
sha = hashlib.sha256(html).hexdigest()
prelude = """() => {
 window.__measure={active:false, work:[], intervals:[], last:null};
 const raf=window.requestAnimationFrame;
 window.requestAnimationFrame=cb=>raf(t=>{
   const m=__measure, active=m.active&&cb.name==='quadro', start=performance.now();
   try {cb(t)} finally {if(active){m.work.push(performance.now()-start);
     if(m.last!==null)m.intervals.push(t-m.last);m.last=t;}}
 });
}"""
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=shutil.which('chromium') or None, args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':390, 'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    if args.url:
        # Seed only the first navigation; a later reload must read the new autosave.
        page.add_init_script("if(!sessionStorage.getItem('industry-test-seeded')){localStorage.clear();for(const[k,v]of Object.entries(" + json.dumps(saved) + "))localStorage.setItem(k,v);sessionStorage.setItem('industry-test-seeded','1');}")
        page.add_init_script('(' + prelude + ')()')
        response = page.goto(args.url, wait_until='load')
        assert response and response.ok and hashlib.sha256(response.body()).hexdigest() == sha
    else:
        page.evaluate("""data=>{let n=0;crypto.randomUUID=()=>`foreground-${++n}`;window.__store=new Map(Object.entries(data));Object.defineProperty(window,'localStorage',{value:{getItem:k=>__store.get(k)??null,setItem:(k,v)=>__store.set(k,String(v)),removeItem:k=>__store.delete(k)}})}""", saved)
        page.evaluate(prelude)
        page.set_content(html.decode(), wait_until='load')
    page.evaluate("estado.jogoPausado=true;estado.velocidadeTempo=1;focarIndustria('taverna')")
    page.locator('#jogo').scroll_into_view_if_needed()
    before = page.evaluate("""() => ({time:estado.industriaColonia.tempo, totals:{...estado.industriaColonia.totais}, accounting:auditoriaCidada().diferenca})""")
    assert before['accounting'] == 0
    page.evaluate("""() => {
      window.__observed={};window.__motion=new Set();window.__seen=new Set();
      window.__sampler=setInterval(()=>{
        for(const a of Object.values(estado.industriaColonia.agentes)){
          if(!Number.isFinite(a.x)||!Number.isFinite(a.y))throw new Error('Non-finite position');
          __seen.add(a.id);const q=__observed[a.id];
          if(q&&Math.hypot(q.x-a.x,q.y-a.y)>20)__motion.add(a.id);
          if(!q)__observed[a.id]={x:a.x,y:a.y};
        }
      },250);estado.jogoPausado=false;__measure.active=true;
    }""")
    start = page.evaluate('performance.now()')
    page.wait_for_timeout(args.seconds * 1000)
    result = page.evaluate("""()=>{__measure.active=false;estado.jogoPausado=true;clearInterval(__sampler);salvarProgresso();return{
      end:performance.now(),time:estado.industriaColonia.tempo,totals:{...estado.industriaColonia.totais},accounting:auditoriaCidada().diferenca,
      seen:__seen.size,moved:__motion.size,work:__measure.work,intervals:__measure.intervals,
      actors:Object.keys(estado.industriaColonia.agentes).length};}""")
    assert result['accounting'] == 0 and result['moved'] > 10 and not errors, (result, errors)
    assert result['totals']['salarios'] > before['totals']['salarios'], 'No completed paid work observed'
    state = page.evaluate('({industry:estado.industriaColonia,economy:estado.economiaCidada})')
    page.locator('#jogo').screenshot(path=str(out/'mobile-active-industry.png'))
    if args.url:
        response = page.reload(wait_until='load')
        assert response and hashlib.sha256(response.body()).hexdigest() == sha
        page.wait_for_timeout(100)
        assert page.evaluate('({industry:estado.industriaColonia,economy:estado.economiaCidada})') == state
    browser_version = browser.version
    browser.close()

def metrics(values):
    ordered = sorted(values)
    return {'count':len(values), 'mean':statistics.fmean(values) if values else 0,
            'p95':ordered[int((len(ordered)-1)*.95)] if ordered else 0, 'max':max(values) if values else 0}

duration = (result['end'] - start) / 1000
report = {k:v for k,v in result.items() if k not in ('work','intervals','end','time')}
report.update({'url':args.url,'storage':'real origin, disposable profile' if args.url else 'isolated in-memory fixture',
 'htmlSha256':sha,'fixtureSha256':hashlib.sha256(Path(args.save).read_bytes()).hexdigest(),'browser':browser_version,
 'durationSeconds':duration,'simulationSeconds':result['time']-before['time'],
 'effective1x':(result['time']-before['time'])/duration,'fps':len(result['intervals'])/duration,
 'gameWorkMs':metrics(result['work']),'frameIntervalMs':metrics(result['intervals']),
 'framesOver50ms':sum(v>50 for v in result['intervals']),
 'wagesDuringObservation':(result['totals']['salarios']-before['totals']['salarios'])/1e6,
 'paidVisitsDuringObservation':result['totals']['visitas']-before['totals']['visitas'],
 'javascriptErrors':errors,'reloadAccountsExact':bool(args.url),
 'scope':'Synthetic completed-business fixture, seeded goods and transferred cash; not staged construction, household affordability, physical handset or thermal proof.'})
(out/'raw.json').write_text(json.dumps(result))
(out/'industry-live-report.json').write_text(json.dumps(report,indent=2)+'\n')
print('INDUSTRY_LIVE_SOAK_OK '+json.dumps(report))
