"""Foreground 10x ledger soak with timing and conservation evidence.
A host-browser run is not a physical-phone, battery or thermal certification.
Use --url for a real origin; without it, use isolated content/in-memory storage.
"""
import argparse,ast,hashlib,json,shutil,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url');p.add_argument('--seconds',type=float,default=60);p.add_argument('--output',default='verification-output/economy-live-soak');a=p.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
setup=next(ast.literal_eval(n.value) for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets))
PRELUDE='''()=>{window.__economyTiming={on:false,last:null,work:[],intervals:[],sim:0};const native=requestAnimationFrame;
window.requestAnimationFrame=cb=>native(t=>{const b=__economyTiming,active=b.on&&cb.name==='quadro',before=active?window.__clock():0,start=performance.now();try{cb(t)}finally{if(active){b.work.push(performance.now()-start);if(b.last!==null)b.intervals.push(t-b.last);b.last=t;b.sim+=window.__clock()-before}}});}'''
def stats(x):
    y=sorted(x)
    return {'count':len(x),'mean':statistics.fmean(x) if x else 0,'p95':y[int((len(y)-1)*.95)] if y else 0,'p99':y[int((len(y)-1)*.99)] if y else 0,'max':max(x) if x else 0}
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
    ctx.add_init_script('('+PRELUDE+')()');page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    html=Path('index.html').read_bytes()
    if a.url:
        r=page.goto(a.url,wait_until='load');assert r and r.ok and hashlib.sha256(r.body()).digest()==hashlib.sha256(html).digest()
    else:
        page.evaluate(PRELUDE)
        page.evaluate("()=>{const m=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}})}")
        page.set_content(html.decode(),wait_until='load')
    page.evaluate(setup)
    page.evaluate("()=>{estado.economiaCidada=novaEconomiaCidada();sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);estado.jogoPausado=false;estado.velocidadeTempo=10;window.__clock=()=>tempoRio;focarCameraExpansao=()=>{};centerTest(7000,4500,.1);abrirEconomiaCidada();}")
    page.wait_for_timeout(3000);start=page.evaluate('()=>{__economyTiming.on=true;return performance.now()}')
    checkpoints=[]
    for interval in range(max(1,int(a.seconds/10))):
        page.wait_for_timeout(a.seconds/max(1,int(a.seconds/10))*1000)
        check=page.evaluate("()=>({audit:auditoriaCidada(),adults:estado.populacaoColonia,children:estado.criancasColonia.length,registered:Object.keys(estado.economiaCidada.pessoas).length,cycle:estado.economiaCidada.ciclo,health:estado.saudeColonia})")
        assert check['audit']['diferenca']==0 and check['registered']==check['adults']+check['children'];checkpoints.append(check)
    raw=page.evaluate('()=>{__economyTiming.on=false;return {...__economyTiming,end:performance.now(),canvas:[canvas.width,canvas.height],totals:estado.economiaCidada.totais,saveBytes:new TextEncoder().encode([...Object.keys(localStorage)].map(k=>localStorage.getItem(k)).join(" ")).length}}')
    duration=(raw['end']-start)/1000
    assert not errors,errors
    assert raw['totals']['salarios']>0 and raw['totals']['vendasBase']>0
    page.screenshot(path=str(out/'mobile-foreground-ledger.png'))
    report={'htmlSha256':hashlib.sha256(html).hexdigest(),'url':a.url,'storage':'real origin, disposable profile' if a.url else 'isolated in memory','browser':browser.version,'durationSeconds':duration,'fps':len(raw['intervals'])/duration,'effective10x':raw['sim']/duration,'gameWorkMs':stats(raw['work']),'frameIntervalMs':stats(raw['intervals']),'framesOver50ms':sum(x>50 for x in raw['intervals']),'checkpoints':checkpoints,'javascriptErrors':errors,'scope':'60-second-class host foreground sample, not a phone or thermal soak'}
    (out/'raw.json').write_text(json.dumps(raw));(out/'report.json').write_text(json.dumps(report,indent=2));print('ECONOMY_LIVE_SOAK_OK '+json.dumps(report));ctx.close();browser.close()
