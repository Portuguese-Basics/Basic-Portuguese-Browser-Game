"""Paired host benchmark: identical mature core settlement, baseline vs funded industries.
--save is a synthetic save from industry-soak-test.js, never a real player save.
For the previous runtime only, remove the unknown business extension and reduce
opening-account assets by that removed cash/escrow. No baseline simulation rule is
changed. Additional jobs and routes exist only in the new variant by definition.
"""
import argparse,hashlib,json,platform,shutil,statistics,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--save',required=True);p.add_argument('--seconds',type=float,default=20);p.add_argument('--output',default='verification-output/industry-performance');a=p.parse_args()
out=Path(a.output);out.mkdir(parents=True,exist_ok=True);saved=json.loads(Path(a.save).read_text());key=next(iter(saved));original=json.loads(saved[key]);results=[]
def stats(x):
 y=sorted(x)
 return {'count':len(x),'mean':statistics.fmean(x) if x else 0,'p95':y[int((len(y)-1)*.95)] if y else 0,'max':max(x) if x else 0}
prelude='''(data)=>{const m=new Map(Object.entries(data));let uid=0,s=829417;crypto.randomUUID=()=>`bench-${++uid}`;Math.random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};Object.defineProperty(window,'localStorage',{value:{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}});window.__b={on:false,work:[],intervals:[],sim:0,last:null};const native=requestAnimationFrame;window.requestAnimationFrame=cb=>native(t=>{const b=__b,active=b.on&&cb.name==='quadro',before=active?window.__time():0,start=performance.now();try{cb(t)}finally{if(active){b.work.push(performance.now()-start);if(b.last!==null)b.intervals.push(t-b.last);b.last=t;b.sim+=window.__time()-before}}});}'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
 (out/'environment.json').write_text(json.dumps({'browser':browser.version,'platform':platform.platform(),'cpu':subprocess.check_output(['lscpu'],text=True),'scope':'Host Chromium; mobile viewport; synthetic save and in-memory storage. Not physical handset/battery.'},indent=2))
 for scene in ['overview','district','resident-ledger','business-panel']:
  variants=['baseline','industry','industry','baseline'] if scene!='business-panel' else ['industry','industry']
  for variant in variants:
   data=json.loads(json.dumps(original));removed=0
   if variant=='baseline':
    s=data['expansao']['economia'].pop('industriaColonia');removed=sum(b['caixa'] for b in s['negocios'].values())+sum(b.get('reserva',0) for b in s['agentes'].values());data['expansao']['economia']['economiaCidada']['abertura']-=removed
   text=Path(a.baseline if variant=='baseline' else 'index.html').read_text();ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.evaluate(prelude,{key:json.dumps(data)});page.set_content(text,wait_until='load')
   page.evaluate('''()=>{estado.jogoPausado=false;estado.velocidadeTempo=10;window.__time=()=>tempoRio;focarCameraExpansao=()=>{};window.centerBench=(x,y,z)=>{estado.cameraExpansao.zoom=z;const v=dimensoesVisaoExpansao();estado.cameraExpansao.x=x-v.largura/2;estado.cameraExpansao.y=y-v.altura/2;limitarCameraExpansao();desenhar()};}''')
   page.evaluate('centerBench(larguraMundoExpansao/2,alturaMundoExpansao/2,zoomMinimoExpansao)' if scene=='overview' else 'centerBench(8400,4430,.7)')
   page.locator('#jogo').scroll_into_view_if_needed()
   if scene=='resident-ledger':page.locator('#abrir-economia-cidada').click()
   if scene=='business-panel':page.locator('#abrir-industria').click()
   page.wait_for_timeout(3000)
   before=page.evaluate('()=>{__b.on=true;return performance.now()}');page.wait_for_timeout(a.seconds*1000)
   raw=page.evaluate('()=>{__b.on=false;return{...__b,end:performance.now(),accounting:auditoriaCidada(),population:estado.populacaoColonia,canvas:[canvas.width,canvas.height],tasks:typeof industriaAtiva==="function"&&industriaAtiva()?Object.values(estado.industriaColonia.agentes).reduce((o,x)=>(o[x.funcao]=(o[x.funcao]||0)+1,o),{}):null}}');duration=(raw['end']-before)/1000
   r={'run':len(results)+1,'scene':scene,'variant':variant,'seconds':duration,'fps':len(raw['intervals'])/duration,'workMs':stats(raw['work']),'intervalMs':stats(raw['intervals']),'effective10x':raw['sim']/duration,'framesOver50ms':sum(x>50 for x in raw['intervals']),'accounting':raw['accounting'],'tasks':raw['tasks'],'canvas':raw['canvas'],'errors':errors,'removedBaselineBusinessAssetsMicros':removed,'htmlSha256':hashlib.sha256(text.encode()).hexdigest()}
   assert not errors,errors;assert r['accounting']['diferenca']==0,r['accounting']
   (out/f'run-{len(results)+1}-raw.json').write_text(json.dumps(raw));results.append(r);(out/'summary.json').write_text(json.dumps(results,indent=2));print(json.dumps(r),flush=True);ctx.close()
 browser.close()
