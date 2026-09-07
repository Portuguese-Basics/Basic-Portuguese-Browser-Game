"""Real-origin UI, persistence and conservation checks using disposable synthetic colonies."""
import argparse, ast, hashlib, http.server, json, shutil, threading
from pathlib import Path
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url');parser.add_argument('--isolated',action='store_true');parser.add_argument('--output',default='verification-output/economy');args=parser.parse_args()
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
setup=None
for n in ast.parse(Path('verification/browser-clarity.py').read_text()).body:
    if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='SETUP' for t in n.targets):setup=ast.literal_eval(n.value)
server=None
if not args.url and not args.isolated:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Quiet);threading.Thread(target=server.serve_forever,daemon=True).start();args.url=f'http://127.0.0.1:{server.server_port}/'
results=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
        for name,vp,touch in [('desktop',{'width':1440,'height':1050},False),('mobile',{'width':390,'height':844},True)]:
            ctx=browser.new_context(viewport=vp,is_mobile=touch,has_touch=touch,device_scale_factor=2,accept_downloads=True)
            page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
            def load(storage=None):
                global page
                if args.isolated:
                    page.close();page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                    page.evaluate('''data=>{let n=0;crypto.randomUUID=()=>`economy-${++n}`;window.__economyStore=new Map(Object.entries(data||{}));Object.defineProperty(window,'localStorage',{value:{getItem:k=>__economyStore.get(k)??null,setItem:(k,v)=>__economyStore.set(k,String(v)),removeItem:k=>__economyStore.delete(k)}})}''',storage)
                    page.set_content(Path('index.html').read_text(),wait_until='load')
                else:
                    response=page.goto(args.url,wait_until='load');assert response and response.ok
                    assert hashlib.sha256(response.body()).digest()==hashlib.sha256(Path('index.html').read_bytes()).digest()
            load()
            page.evaluate(setup)
            page.evaluate('''()=>{estado.economiaCidada=novaEconomiaCidada();estado.jogoPausado=true;estado.salvamentoAtivo=true;sincronizarFamiliasColonia();redistribuirTrabalhadoresColonia();atualizarCadastroCidada(true);
            for(let c=0;c<8;c++){atualizarTransferenciaPosto(60);atualizarOrcamentoMunicipalColonia(60);atualizarNecessidadesColonia(60);observarContasCidada();if(auditoriaCidada().diferenca!==0)throw Error('Conservation failed at '+c);}
            salvarProgresso();}''')
            page.locator('#abrir-economia-cidada').focus();page.keyboard.press('Enter')
            assert page.locator('#painel-economia-cidada').is_visible()
            assert page.locator('#corpo-cidadaos tr').count()==20
            assert page.evaluate('painelEconomiaCidada.scrollWidth<=painelEconomiaCidada.clientWidth+1')
            page.screenshot(path=str(out/f'{name}-economy-panel.png'))
            page.locator('#balanco-cidada summary').click();assert page.locator('#tributos-economia-cidada').is_visible()
            assert page.evaluate('painelEconomiaCidada.scrollWidth<=painelEconomiaCidada.clientWidth+1')
            page.screenshot(path=str(out/f'{name}-taxes-food.png'));page.locator('#balanco-cidada summary').click()
            page.locator('#pagina-cidadao-proxima').click();assert 'Página 2/' in page.locator('#pagina-cidadao').inner_text()
            first=page.locator('[data-cidadao]').first;person_id=first.get_attribute('data-cidadao');first.click()
            assert person_id in page.locator('#detalhe-cidadao').inner_text()
            page.locator('#buscar-cidadao').fill(person_id)
            assert page.locator('#corpo-cidadaos tr').count()>=1
            page.locator('#detalhe-cidadao').scroll_into_view_if_needed();page.screenshot(path=str(out/f'{name}-individual-ledger.png'))
            page.locator('#alternar-compras-cidada').click();assert page.evaluate('estado.economiaCidada.opcionais') is False
            with page.expect_download() as download:
                page.locator('#exportar-economia-cidada').click()
            path=out/f'{name}-export.json';download.value.save_as(str(path));export=json.loads(path.read_text())
            assert export['auditoria']['diferenca']==0
            assert len(export['economia']['pessoas'])==450
            assert export['economia']['totais']['salarios']>0 and export['economia']['totais']['tributoVendasCidade']>0
            page.locator('#fechar-economia-cidada').click();page.evaluate('salvarProgresso()')
            financial=page.evaluate('JSON.stringify(estado.economiaCidada)')
            page.wait_for_timeout(350);assert page.evaluate('JSON.stringify(estado.economiaCidada)')==financial,'Paused economy changed'
            wallet_snapshot=page.evaluate('Object.fromEntries(Object.entries(estado.economiaCidada.pessoas).map(([id,p])=>[id,[p.nome,p.genero,p.saldo,p.atrasados,p.impostos,p.heranca]]))')
            cycles=page.evaluate('estado.economiaCidada.ciclo')
            if args.isolated:load(page.evaluate('Object.fromEntries(__economyStore)'))
            else:page.reload(wait_until='load')
            page.wait_for_timeout(150)
            assert page.evaluate('Object.fromEntries(Object.entries(estado.economiaCidada.pessoas).map(([id,p])=>[id,[p.nome,p.genero,p.saldo,p.atrasados,p.impostos,p.heranca]]))')==wallet_snapshot
            assert page.evaluate('estado.economiaCidada.ciclo')==cycles
            assert page.evaluate('estado.economiaCidada.opcionais') is False
            assert page.evaluate('auditoriaCidada().diferenca')==0
            assert page.evaluate('Object.values(estado.economiaCidada.pessoas).filter(p=>papeisMilitaresCidada.includes(p.emprego)).length')==30
            assert page.evaluate('Object.values(estado.empregosColonia).reduce((a,b)=>a+b,0)')==420
            page.evaluate('''()=>{const p=estado.economiaCidada.pessoas[estado.economiaCidada.adultos[0]];p.nome='<img src=x onerror="window.__bad=true">';abrirEconomiaCidada()}''')
            assert page.locator('#corpo-cidadaos img').count()==0 and page.evaluate('window.__bad===undefined')
            assert not errors,errors
            results.append({'viewport':name,'citizens':450,'realTroops':30,'civilianSlots':420,'keyboardAccess':True,'pagination':True,'individualLedger':True,'jsonExport':True,'saveNoDuplicateCharges':True,'noHorizontalDialogOverflow':True,'moneyDifference':0,'javascriptErrors':errors,'taxes':export['economia']['totais']})
            ctx.close()
        browser.close()
finally:
    if server:server.shutdown()
report={'url':args.url,'isolated':args.isolated,'htmlSha256':hashlib.sha256(Path('index.html').read_bytes()).hexdigest(),'results':results,'scope':'Disposable browser profiles, not physical handset tests.'}
(out/'report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print('BROWSER_ECONOMY_OK '+json.dumps(report,ensure_ascii=False))
