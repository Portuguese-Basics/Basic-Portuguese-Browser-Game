"""Exclusive-slot Chromium benchmark with a real origin and isolated native storage.

Only benchmark instrumentation is injected. Runtime inputs and SHA-256 remain
identified separately. --profile adds inclusive function instrumentation and is
diagnostic only. Every variant runs alone; order reverses across repetitions.
"""
import argparse, hashlib, json, math, os, platform, shutil, statistics, subprocess, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser()
p.add_argument('--production',required=True);p.add_argument('--untouched',required=True);p.add_argument('--candidate',required=True);p.add_argument('--save',required=True)
p.add_argument('--production-ref');p.add_argument('--untouched-ref');p.add_argument('--candidate-ref');p.add_argument('--motion-save')
p.add_argument('--executable');p.add_argument('--output',required=True);p.add_argument('--seconds',type=float,default=15);p.add_argument('--warmup',type=float,default=3)
p.add_argument('--repetitions',type=int,default=2);p.add_argument('--scenes',default='overview');p.add_argument('--variants',default='untouched,candidate')
p.add_argument('--profile',action='store_true');p.add_argument('--dpr',type=float,default=2);p.add_argument('--width',type=int,default=390);p.add_argument('--height',type=int,default=844)
p.add_argument('--port',type=int,default=8766);p.add_argument('--speed',type=int,default=10);p.add_argument('--headful',action='store_true')
p.add_argument('--soak-seconds',type=float,default=0);p.add_argument('--soak-speed',type=int,default=1)
p.add_argument('--enforce-budgets',action='store_true',help='Exit nonzero for unmet stable-view absolute budgets, after preserving every planned sample.')
a=p.parse_args();out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
assert 1<=a.repetitions<=10 and 0<a.seconds<=1800 and 0<=a.warmup<=60
assert 0<=a.soak_seconds<=1800 and a.speed in [1,2,5,10] and a.soak_speed in [1,2,5,10]
scenes=a.scenes.split(',');variants=a.variants.split(',')
assert set(scenes)<=set(['overview','district','tavern','resident-ledger','business-panel','motion','disabled'])
assert set(variants)<=set(['production','untouched','candidate'])
source_bytes={k:Path(getattr(a,k)).read_bytes() for k in ['production','untouched','candidate']}
sources={k:v.decode('utf-8') for k,v in source_bytes.items()}
saved=json.loads(Path(a.save).read_text());assert len(saved)==1
key=next(iter(saved));original=json.loads(saved[key]);source_meta={k:{'path':str(Path(getattr(a,k)).resolve()),'declaredGitRef':getattr(a,k+'_ref'),'bytes':len(v),'sha256':hashlib.sha256(v).hexdigest()} for k,v in source_bytes.items()}
motion_saved=json.loads(Path(a.motion_save).read_text()) if a.motion_save else saved
assert list(motion_saved)==[key], 'The motion fixture must use the same game storage key.'
motion_original=json.loads(motion_saved[key])

PRELUDE=r'''
const benchInput=__BENCH_INPUT__;
let benchSeed=829417,benchUUID=0;
Math.random=()=>{benchSeed=(Math.imul(benchSeed,1664525)+1013904223)>>>0;return benchSeed/4294967296};
crypto.randomUUID=()=>`bench-${++benchUUID}`;
for(const [k,v] of Object.entries(benchInput.save))localStorage.setItem(k,v);
window.__bench={on:false,work:[],intervals:[],sim:0,last:null,saves:[],profile:{},counts:{},memory:[],longs:[],lastSample:0};
const benchNativeRAF=requestAnimationFrame;
window.requestAnimationFrame=cb=>benchNativeRAF(t=>{
 const b=__bench,active=b.on&&cb.name==='quadro',before=active?window.__benchTime():0,saveCount=b.saves.length,routeCount=b.counts.rotaSeguraPlantaColonia||0,sequence=active?window.__benchSequence():0,start=performance.now();
 try{cb(t)}finally{if(active){
  const elapsed=performance.now()-start,interval=b.last===null?null:t-b.last;
  b.work.push(elapsed);if(interval!==null)b.intervals.push(interval);b.last=t;b.sim+=window.__benchTime()-before;
  if(elapsed>50||(interval!==null&&interval>50))b.longs.push({elapsedMs:performance.now()-b.start,workMs:elapsed,intervalMs:interval,saveDurationsMs:b.saves.slice(saveCount).map(s=>s.durationMs),routeCalls:(b.counts.rotaSeguraPlantaColonia||0)-routeCount,transactions:window.__benchSequence()-sequence});
  if(t-b.lastSample>5000){b.memory.push({elapsedMs:performance.now()-b.start,...window.__benchMemory()});b.lastSample=t;}
 }}
});
'''
POSTLUDE=r'''
window.__benchTime=()=>tempoRio;
window.__benchSequence=()=>estado.economiaCidada.sequencia;
window.__benchMemory=()=>({jsHeap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null,
 road:typeof cachePinturaEstradasColonia!=='undefined'&&cachePinturaEstradasColonia?{width:cachePinturaEstradasColonia.camada.width,height:cachePinturaEstradasColonia.camada.height,bytes:cachePinturaEstradasColonia.camada.width*cachePinturaEstradasColonia.camada.height*4}:null,
 industry:typeof cachePinturaIndustria!=='undefined'&&cachePinturaIndustria?{width:cachePinturaIndustria.camada.width,height:cachePinturaIndustria.camada.height,bytes:cachePinturaIndustria.camada.width*cachePinturaIndustria.camada.height*4}:null,
 routes:typeof cacheRotasEstradaColonia!=='undefined'?cacheRotasEstradaColonia.size:null,
 attachments:typeof cacheLigacoesPlanta!=='undefined'?cacheLigacoesPlanta.size:null,
 canvas:{width:canvas.width,height:canvas.height,bytes:canvas.width*canvas.height*4},
 accountingDifference:auditoriaCidada().diferenca,
 scheduling:estado.industriaColonia?.escala??null,
 activeAgents:estado.industriaColonia?Object.keys(estado.industriaColonia.agentes).length:0,
 agentRoles:estado.industriaColonia?Object.values(estado.industriaColonia.agentes).reduce((o,a)=>(o[a.funcao]=(o[a.funcao]||0)+1,o),{}):{},
 visibility:document.visibilityState,
 journalEntries:estado.economiaCidada.livro.length,
 construction:estado.obraAutomaticaColonia||null,
 businessesUnderConstruction:estado.industriaColonia?Object.values(estado.industriaColonia.negocios).filter(b=>b.estado==='obra').length:0,
 activeFestival:Boolean(estado.industriaColonia&&estado.industriaColonia.festivalAte>estado.industriaColonia.tempo),
 deliveries:estado.industriaColonia?.totais?.entregas??null,
 routeCacheApproxBytes:null});
const benchSave=salvarProgresso;
salvarProgresso=function(...args){const start=performance.now();try{return benchSave.apply(this,args)}finally{if(__bench.on)__bench.saves.push({elapsedMs:performance.now()-__bench.start,durationMs:performance.now()-start})}};
window.__benchCenter=(x,y,z)=>{estado.cameraExpansao.zoom=z;const v=dimensoesVisaoExpansao();estado.cameraExpansao.x=x-v.largura/2;estado.cameraExpansao.y=y-v.altura/2;limitarCameraExpansao();};
window.__benchSetup=(scene,speed)=>{
 estado.jogoPausado=false;estado.velocidadeTempo=speed;
 // Prevent legacy automated construction from replacing the matched measurement camera.
 // Construction, payments and activity continue normally; this is a camera-only fixture control.
 focarCameraExpansao=()=>{};
 if(scene==='overview'||scene==='disabled')__benchCenter(larguraMundoExpansao/2,alturaMundoExpansao/2,zoomMinimoExpansao);
 else if(scene==='tavern')__benchCenter(7935,4420,.7);
 else __benchCenter(8400,4430,.7);
 if(scene==='resident-ledger')abrirEconomiaCidada();
 if(scene==='business-panel'&&typeof abrirPainelIndustria==='function')abrirPainelIndustria();
 if(scene==='disabled'&&typeof industriaAtiva==='function'&&industriaAtiva())throw new Error('Disabled fixture unexpectedly activated industries');
 desenhar();
};
window.__benchStart=()=>{const b=__bench;b.startSequence=estado.economiaCidada.sequencia;b.startTotals=JSON.parse(JSON.stringify(estado.industriaColonia?.totais||{}));b.initialMemory=__benchMemory();b.initialAccounting=auditoriaCidada();b.start=performance.now();b.on=true;return b.start;};
window.__benchEnd=()=>{const b=__bench;b.on=false;b.end=performance.now();const t=performance.now(),encoded=JSON.stringify(dadosParaSalvar());b.serializationMs=performance.now()-t;b.saveBytes=new TextEncoder().encode(encoded).length;
 return{...b,accounting:auditoriaCidada(),population:estado.populacaoColonia,canvas:[canvas.width,canvas.height],dpr:devicePixelRatio,visibility:document.visibilityState,
 finalMemory:__benchMemory(),transactions:estado.economiaCidada.sequencia-b.startSequence,finalTotals:estado.industriaColonia?.totais||{},
 activity:typeof industriaAtiva==='function'&&industriaAtiva()?Object.values(estado.industriaColonia.agentes).reduce((o,x)=>(o[x.funcao]=(o[x.funcao]||0)+1,o),{}):null,
 storageKind:'native localStorage in fresh browser context and local HTTP origin'};};
'''
PROFILE_NAMES=['atualizarIndustriaColonia','alocarTrabalhoIndustria','agendarVisitaIndustria','rotaSeguraPlantaColonia','ligacoesPontoPlanta','numeroAgentesIndustria','candidatosIndustria','executarEntregaIndustria','executarCompraIndustria','pagarPessoaIndustria','liquidarCompensacaoCidada','registrarLivroCidada','desenhar','desenharIndustriaColonia','desenharVidaCotidiana','atualizarPainelIndustria','atualizarPainelEconomiaCidada']
COUNT_NAMES=['rotaSeguraPlantaColonia','ligacoesPontoPlanta','alocarTrabalhoIndustria','agendarVisitaIndustria','agendarPasseioIndustria','solicitarFretesIndustria']

def runtime(variant,scene):
    data=json.loads(json.dumps(motion_original if scene=='motion' else original));removed=0
    if variant=='production' or scene=='disabled':
        extension=data['expansao']['economia'].pop('industriaColonia',None)
        if extension:
            removed=sum(b['caixa'] for b in extension['negocios'].values())+sum(b.get('reserva',0) for b in extension['agentes'].values())
            data['expansao']['economia']['economiaCidada']['abertura']-=removed
    payload={'save':{key:json.dumps(data)},'removedBusinessAssetsMicros':removed,'scene':scene}
    pre=PRELUDE.replace('__BENCH_INPUT__',json.dumps(payload).replace('</','<'+chr(92)+'/'))
    post=POSTLUDE
    for name in COUNT_NAMES:
        if 'function '+name+'(' not in sources[variant]:continue
        post+=f'''\n{name}=((original)=>function(...args){{if(__bench.on)__bench.counts.{name}=(__bench.counts.{name}||0)+1;return original.apply(this,args);}})({name});'''
    if a.profile:
        for name in PROFILE_NAMES:
            if 'function '+name+'(' not in sources[variant]:continue
            post+=f'''\n{name}=((original)=>function(...args){{if(!__bench.on)return original.apply(this,args);const t=performance.now();try{{return original.apply(this,args)}}finally{{const p=__bench.profile.{name}||(__bench.profile.{name}={{calls:0,totalMs:0,maxMs:0}}),d=performance.now()-t;p.calls++;p.totalMs+=d;p.maxMs=Math.max(p.maxMs,d);}}}})({name});'''
    text=sources[variant].replace('<script>','<script>'+pre,1).replace('</script>',post+'\n</script>',1)
    return text.encode(),removed

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url=urlparse(self.path);variant=url.path.rsplit('/',1)[-1];scene=parse_qs(url.query).get('scene',['overview'])[0]
        if variant not in sources:self.send_error(404);return
        body,_=runtime(variant,scene);self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    def log_message(self,*args):pass

def stats(values):
    if not values:return {'count':0,'mean':None,'p95':None,'p99':None,'max':None}
    v=sorted(values);return {'count':len(v),'mean':statistics.fmean(v),'p95':v[max(0,math.ceil(len(v)*.95)-1)],'p99':v[max(0,math.ceil(len(v)*.99)-1)],'max':max(v)}

server=ThreadingHTTPServer(('127.0.0.1',a.port),Handler);threading.Thread(target=server.serve_forever,daemon=True).start()
rows=[]
plan=[]
for scene in scenes:
    for repetition in range(a.repetitions):
        for variant in (variants if repetition%2==0 else list(reversed(variants))):
            if scene=='business-panel' and variant=='production':continue
            plan.append({'scene':scene,'variant':variant,'repetition':repetition+1,'seconds':a.seconds,'speed':a.speed,'phase':'matrix'})
if a.soak_seconds:plan.append({'scene':'overview','variant':'candidate','repetition':1,'seconds':a.soak_seconds,'speed':a.soak_speed,'phase':'long-overview-soak'})
(out/'plan.json').write_text(json.dumps({'runs':plan,'measurementAndWarmupSeconds':sum(r['seconds']+a.warmup for r in plan),'instrumentation':'Callback work/intervals, native saves, lightweight request counts, five-second state/memory checkpoints; inclusive profile only with --profile'},indent=2))
try:
 with sync_playwright() as pw:
    exe=a.executable or pw.chromium.executable_path
    browser=pw.chromium.launch(headless=not a.headful,executable_path=exe,args=['--no-sandbox','--enable-precise-memory-info','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
    environment={'browser':browser.version,'executable':exe,'python':platform.python_version(),'platform':platform.platform(),'cpu':subprocess.check_output(['lscpu'],text=True),'loadAtStart':os.getloadavg(),'sources':source_meta,'fixture':{'path':str(Path(a.save).resolve()),'sha256':hashlib.sha256(Path(a.save).read_bytes()).hexdigest()},'motionFixture':{'path':str(Path(a.motion_save).resolve()),'sha256':hashlib.sha256(Path(a.motion_save).read_bytes()).hexdigest()} if a.motion_save else None,'options':vars(a),'physicalRefreshRateHz':None,'powerSource':None,'thermalCondition':None,'cpuSlowdown':1,'backgroundThrottlingDisabled':True,'percentiles':'Nearest-rank within each run; raw samples retained, no averaging of run percentiles','scope':'Host Chromium. Mobile viewport/DPR are explicit test settings; no physical phone, battery, thermal or Safari certification. Actual foreground interval cadence is measured; physical refresh rate is unavailable. Function profile is inclusive and adds overhead when enabled. JS heap samples are estimates, not a retained-heap leak proof.'}
    (out/'environment.json').write_text(json.dumps(environment,indent=2))
    for item in plan:
        scene=item['scene'];variant=item['variant'];repetition=item['repetition']
        run=len(rows)+1;ctx=browser.new_context(viewport={'width':a.width,'height':a.height},device_scale_factor=a.dpr,is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        load_before=os.getloadavg()
        page.goto(f'http://127.0.0.1:{a.port}/game/{variant}?scene={scene}',wait_until='load');page.evaluate('(s)=>__benchSetup(s.scene,s.speed)',{'scene':scene,'speed':item['speed']});page.locator('#jogo').scroll_into_view_if_needed()
        page.wait_for_timeout(a.warmup*1000)
        page.evaluate('__benchStart()')
        if scene=='motion':
          page.evaluate('''()=>{window.__motion=setInterval(()=>{const t=(performance.now()-__bench.start)/1000;__benchCenter(8400+Math.sin(t/3)*1600,4430+Math.cos(t/4)*900,.35+.15*(1+Math.sin(t/5)));},100)}''')
        page.wait_for_timeout(item['seconds']*1000)
        if scene=='motion':page.evaluate('clearInterval(__motion)')
        raw=page.evaluate('__benchEnd()');duration=(raw['end']-raw['start'])/1000
        _,removed=runtime(variant,scene)
        checkpoints=[raw['initialMemory'],*raw['memory'],raw['finalMemory']]
        raw_canvas_bytes=[sum((point.get(layer) or {}).get('bytes',0) for layer in ['canvas','road','industry']) for point in checkpoints]
        row={'run':run,'scene':scene,'variant':variant,'phase':item['phase'],'repetition':repetition,'seconds':duration,'requestedSpeed':item['speed'],'simulatedSeconds':raw['sim'],'fps':len(raw['work'])/duration,'workMs':stats(raw['work']),'intervalMs':stats(raw['intervals']),'effectiveSpeed':raw['sim']/duration,'intervalsOver33_3ms':sum(x>33.3 for x in raw['intervals']),'intervalsOver50ms':sum(x>50 for x in raw['intervals']),'intervalsOver100ms':sum(x>100 for x in raw['intervals']),'saveWorkMs':stats([s['durationMs'] for s in raw['saves']]),'saveBytes':raw['saveBytes'],'serializationMs':raw['serializationMs'],'population':raw['population'],'canvas':raw['canvas'],'dpr':raw['dpr'],'visibility':raw['visibility'],'transactions':raw['transactions'],'accounting':raw['accounting'],'checkpointMoneyDifferences':[p['accountingDifference'] for p in checkpoints],'activity':raw['activity'],'finalMemory':raw['finalMemory'],'maxObservedRawCanvasBytes':max(raw_canvas_bytes),'source':source_meta[variant],'removedBusinessAssetsMicros':removed,'errors':errors,'loadBefore':load_before,'loadAfter':os.getloadavg(),'counts':raw['counts'],'schedulerTicks':None if raw['initialMemory']['scheduling'] is None else raw['finalMemory']['scheduling']-raw['initialMemory']['scheduling'],'workloadObserved':{'construction':any(p['construction'] or p['businessesUnderConstruction'] for p in checkpoints),'festival':any(p['activeFestival'] for p in checkpoints),'freightActors':any(p['agentRoles'].get('frete',0)>0 for p in checkpoints),'deliveries':None if raw['initialMemory']['deliveries'] is None else raw['finalMemory']['deliveries']-raw['initialMemory']['deliveries']},'profile':raw['profile'],'scope':'diagnostic-instrumented' if a.profile else 'foreground-host'}
        row['absoluteBudgets']={'fpsAtLeast58':row['fps']>=58,'p95WorkAtMost8ms':row['workMs']['p95'] is not None and row['workMs']['p95']<=8,'p99WorkBelow16_7ms':row['workMs']['p99'] is not None and row['workMs']['p99']<16.7,'atLeast98PercentRequestedSpeed':row['effectiveSpeed']>=item['speed']*.98}
        (out/f'run-{run:03d}-{scene}-{variant}-raw.json').write_text(json.dumps(raw))
        page.screenshot(path=str(out/f'run-{run:03d}-{scene}-{variant}.png'))
        rows.append(row);(out/'summary.json').write_text(json.dumps(rows,indent=2));print(json.dumps(row),flush=True)
        assert not errors,errors
        assert row['accounting']['diferenca']==0,row['accounting']
        assert raw['initialAccounting']['diferenca']==0,raw['initialAccounting']
        assert all(p['accountingDifference']==0 for p in checkpoints),'Money discrepancy at a five-second checkpoint'
        assert all(p['visibility']=='visible' for p in checkpoints),'Foreground run became hidden'
        ctx.close()
    browser.close()
finally:server.shutdown()
budget_failures=[{'run':r['run'],'scene':r['scene'],'variant':r['variant'],'budgets':r['absoluteBudgets']} for r in rows if r['scene']!='motion' and not all(r['absoluteBudgets'].values())]
(out/'acceptance.json').write_text(json.dumps({'completedRuns':len(rows),'plannedRuns':len(plan),'absoluteBudgetFailures':budget_failures,'profileOverheadEnabled':a.profile,'remainingInterpretation':'Assess paired relative regression and every long-frame cluster using raw data. Absolute misses remain open. JS heap trends do not prove absence of retained-memory growth across reloads. Motion requires observed freight, construction and event coverage; absent activity is a workload gap.'},indent=2))
if a.enforce_budgets and budget_failures:raise SystemExit('Absolute performance budgets remain unmet; all planned samples and raw evidence were preserved.')
