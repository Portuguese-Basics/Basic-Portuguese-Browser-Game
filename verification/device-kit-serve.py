#!/usr/bin/env python3
"""Serve unchanged game bytes and a fictional save on an isolated test origin.

No production deployment, browser-profile access, telemetry, or storage clearing.
Use a fresh port/private browsing context. Network binding is an explicit option.
"""
import argparse
import hashlib
import http.server
import json
from pathlib import Path
import ssl
import subprocess
import urllib.parse


INSTALLER = r'''<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fictional colony device test</title>
<style>body{font:17px system-ui;max-width:44rem;margin:2rem auto;padding:0 1rem;line-height:1.5}button,a{display:inline-block;padding:.7rem;margin:.3rem 0;min-height:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#eee;padding:1rem}#status{font-weight:bold}</style>
<h1>Fictional colony device test</h1>
<p>This separate test origin serves the exact candidate bytes. Use a new private browsing context and a port never used by your real game. The installer refuses to replace existing storage.</p>
<pre id="identity">Loading candidate identity…</pre>
<button id="install" disabled>Install fictional save once</button>
<p id="status" role="status"></p>
<a id="open-game" role="link" aria-disabled="true">Open game at this test origin</a>
<p>Keep the game in the foreground during measurement. Returning here saves the game through its ordinary lifecycle. The export button reads this test origin's storage without changing it.</p>
<button id="export" disabled>Download current test storage</button>
<script>
let identity;
const status=document.querySelector('#status'),install=document.querySelector('#install');
function platformProblem(){
 if(!globalThis.isSecureContext)return 'Test blocked: this is not a secure context. Use trusted HTTPS for a LAN phone, or localhost on the same computer. No fixture was installed.';
 if(typeof globalThis.crypto?.randomUUID!=='function')return 'Test blocked: crypto.randomUUID is unavailable in this browser. Use a supporting browser in a secure context. No fixture was installed.';
 return '';
}
fetch('/candidate.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Identity unavailable');return r.json();}).then(data=>{
 identity={...data,browserSecureContext:globalThis.isSecureContext,randomUUIDAvailable:typeof globalThis.crypto?.randomUUID==='function'};document.querySelector('#identity').textContent=JSON.stringify(identity,null,2);
 const problem=platformProblem();if(problem){status.textContent=problem;return;}
 const openGame=document.querySelector('#open-game');openGame.href='/index.html';openGame.removeAttribute('aria-disabled');document.querySelector('#export').disabled=false;
 install.disabled=localStorage.length!==0;
 status.textContent=localStorage.length?'Storage exists: installation blocked. Open the current test game, or use a fresh private context and unused port.':'Storage is empty. Ready to install the fictional fixture before the first game script.';
}).catch(e=>{status.textContent=e.message;});
install.addEventListener('click',async()=>{
 install.disabled=true;
 try{
  const problem=platformProblem();if(problem)throw Error(problem);
  if(localStorage.length)throw Error('Storage exists; nothing was replaced.');
  const response=await fetch('/fixture.json',{cache:'no-store'});if(!response.ok)throw Error('Fixture unavailable');
  const fixture=await response.json();
  if(!fixture||Array.isArray(fixture)||typeof fixture!=='object'||Object.entries(fixture).some(([key,value])=>!key||typeof value!=='string'))throw Error('Invalid storage fixture');
  if(localStorage.length)throw Error('Storage changed; nothing was replaced.');
  for(const [key,value]of Object.entries(fixture))localStorage.setItem(key,value);
  status.textContent='Fictional save installed. Open the game. Record the candidate and fixture hashes above.';
 }catch(e){status.textContent=e.message+' Use a fresh test origin if installation was interrupted.';}
});
document.querySelector('#export').addEventListener('click',()=>{
 const problem=platformProblem();if(problem){status.textContent=problem;return;}
 const storage={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);storage[key]=localStorage.getItem(key);}
 const data={identity,observedUtc:new Date().toISOString(),storage};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='fictional-device-test-storage.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
</script></html>'''.encode()


def assets(repo, fixture_path):
    runtime = (repo / 'index.html').read_bytes()
    fixture_bytes = fixture_path.read_bytes()
    fixture = json.loads(fixture_bytes)
    if not isinstance(fixture, dict) or not fixture or any(
            not isinstance(key, str) or not key or not isinstance(value, str)
            for key, value in fixture.items()):
        raise ValueError('Fixture must map localStorage keys to JSON strings')
    for value in fixture.values():
        json.loads(value)
    try:
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo,
                                       text=True, stderr=subprocess.DEVNULL).strip()
        head_runtime = subprocess.check_output(['git', 'show', 'HEAD:index.html'], cwd=repo,
                                               stderr=subprocess.DEVNULL)
        head_runtime_matches = runtime == head_runtime
    except (OSError, subprocess.CalledProcessError):
        head = None
        head_runtime_matches = None
    identity = {
        'purpose': 'Isolated fictional physical-device acceptance; no result implied',
        'gitHeadIfAvailable': head,
        'runtimeMatchesGitHead': head_runtime_matches,
        'runtimeBytes': len(runtime), 'runtimeSha256': hashlib.sha256(runtime).hexdigest(),
        'fixtureBytes': len(fixture_bytes), 'fixtureSha256': hashlib.sha256(fixture_bytes).hexdigest(),
        'servedRuntime': 'Exact index.html bytes captured at server startup',
        'physicalDeviceStatus': 'NOT_TESTED until an actual authorized device run is recorded',
    }
    return {
        '/': ('text/html; charset=utf-8', INSTALLER),
        '/index.html': ('text/html; charset=utf-8', runtime),
        '/fixture.json': ('application/json', fixture_bytes),
        '/candidate.json': ('application/json', json.dumps(identity, indent=2).encode()),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path('.'))
    parser.add_argument('--fixture', type=Path, required=True,
                        help='Generated fictional storage mapping, never a real player save')
    parser.add_argument('--bind', default='127.0.0.1',
                        help='Use 0.0.0.0 only for an authorized private LAN device test')
    parser.add_argument('--port', type=int, default=8877)
    parser.add_argument('--certfile', type=Path,
                        help='Provided PEM certificate chain trusted by the test device for its exact hostname')
    parser.add_argument('--keyfile', type=Path,
                        help='Provided matching PEM private key; keep outside the repository and evidence archives')
    args = parser.parse_args()
    if bool(args.certfile) != bool(args.keyfile):
        parser.error('--certfile and --keyfile must be supplied together')
    tls_context = None
    if args.certfile:
        tls_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        try:
            # An empty password callback prevents an interactive key-password prompt.
            # The kit does not provision certificates or change browser/device trust.
            tls_context.load_cert_chain(args.certfile, args.keyfile, password=lambda: b'')
        except (OSError, ssl.SSLError):
            parser.error('Could not load the supplied certificate/key; provide matching readable PEM files and a key that needs no interactive password')
    routes = assets(args.repo.resolve(), args.fixture.resolve())

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            route = routes.get(urllib.parse.urlsplit(self.path).path)
            if route is None:
                self.send_error(404)
                return
            mime, payload = route
            self.send_response(200)
            self.send_header('Content-Type', mime)
            self.send_header('Content-Length', str(len(payload)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *_args):
            pass  # Do not record device IP addresses in a distributable log.

    server = http.server.ThreadingHTTPServer((args.bind, args.port), Handler)
    if tls_context:
        server.socket = tls_context.wrap_socket(server.socket, server_side=True)
    print(routes['/candidate.json'][1].decode(), flush=True)
    scheme = 'https' if tls_context else 'http'
    print('Installer: %s://HOST:%s/ — use the certificate hostname for LAN HTTPS, or localhost for same-computer HTTP.' % (scheme, server.server_port), flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
