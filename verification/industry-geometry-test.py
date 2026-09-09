"""Independent building, public-space, utility and route checks from the runtime."""
import json, subprocess, itertools
from pathlib import Path
from shapely.geometry import box, LineString
Path('verification-output').mkdir(exist_ok=True)
js=r'''const {game}=require('./verification/layout-harness');const fs=require('fs');let g=game();g.mature();g.eval('autorizarIndustria()');
const data=g.eval(`(()=>{const routes=[],failures=[];const from=acessosPlantaColonia.areaTransportadoresColonia;const points=[...planosIndustria.map(p=>({id:p.id,...entradaIndustria(p.id)})),...pracasIndustria.map(p=>({id:p.id,x:p.x+p.largura/2,y:p.y+p.altura/2}))];
for(const p of points)for(const q of [from,...Object.values(acessosPlantaColonia),...Array.from({length:90},(_,i)=>{const a=posicaoCasaColonia(i);return{x:a.x+65,y:a.y+150}})]){const r=rotaMaisRapidaColonia(q,p);if(r.bloqueada)failures.push(['blocked',p.id,q]);for(let i=1;i<r.pontos.length;i++)if(!segmentoNavegavelPlanta(r.pontos[i-1],r.pontos[i],null,0))failures.push(['crossing',p.id,i]);routes.push({id:p.id,source:q,points:r.pontos});}
return{plans:planosIndustria,plazas:pracasIndustria,solids:retangulosSolidosPlanta(),roads:trechosEstradaColonia,water:redeHidricaBasicaColonia.concat(redeHidricaAvancadaColonia),sewers:redeEsgotoColonia,world:{width:larguraMundoExpansao,height:alturaMundoExpansao,coast:limiteCosta},routes,failures};})()`);fs.writeFileSync('verification-output/industry-layout.json',JSON.stringify(data));'''
subprocess.run(['node','-e',js],check=True)
l=json.loads(Path('verification-output/industry-layout.json').read_text());errors=list(l['failures'])
def rect(b):return box(b['x'],b['y'],b['x']+b['largura'],b['y']+b['altura'])
for p in l['plans']+l['plazas']:
 a=rect(p)
 assert 0<=p['x']<p['x']+p['largura']<l['world']['coast']
 assert 0<=p['y']<p['y']+p['altura']<l['world']['height']
 for q in l['solids']:
  if q['id']=='empresa-'+p['id']:continue
  if a.intersection(rect(q)).area>.01:errors.append(['solid',p['id'],q['id']])
 for r in l['roads']:
  for paths,w in [([r['pontos']],40),(r['ramais'],40),(r['acessos'],18)]:
   for path in paths:
    line=LineString([(x['x'],x['y']) for x in path]).buffer(w,cap_style='flat')
    if a.intersection(line).area>.01:errors.append(['road',p['id'],r['id']])
 for r in l['water']+l['sewers']:
  if a.intersection(LineString([(x['x'],x['y']) for x in r['pontos']])).length>.01:errors.append(['utility',p['id'],r['id']])
report={'newBuildings':len(l['plans']),'freePublicSpaces':len(l['plazas']),'verifiedRoutes':len(l['routes']),'errors':errors,'scope':'Clearance/connectivity, not modeled hydraulic flow. No replacement of existing utility networks.'}
Path('verification-output/industry-geometry-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert not errors,errors
