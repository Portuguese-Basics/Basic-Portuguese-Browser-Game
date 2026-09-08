"""Independent geometry checks against data exported from the actual game, not a parallel layout copy."""
from pathlib import Path
import json,itertools
from shapely.geometry import box,LineString,Point
import argparse
p=argparse.ArgumentParser();p.add_argument('--input',default='verification-output/map-layout.json');p.add_argument('--output',default='verification-output/map-geometry');args=p.parse_args()
w=Path(args.output);w.mkdir(parents=True,exist_ok=True);l=json.loads(Path(args.input).read_text())
def rect(a):return box(a['x'],a['y'],a['x']+a['largura'],a['y']+a['altura'])
opens={'areaMoradias','areaSegundoBlocoMoradias','areaTerceiroBlocoMoradias','areaFlorestaColonia','areaPontoCacaMilicia'}
bodies={k:rect(a) for k,a in l['areas'].items() if k not in opens}
for group in ['areasCabanasLenhadores','areasCabanasColeta','guards','prestige']:
 for i,a in enumerate(l[group]):bodies[group+'-'+str(i)]=rect(a)
for i in range(90):
 a=l['areas'][['areaMoradias','areaSegundoBlocoMoradias','areaTerceiroBlocoMoradias'][i//30]];x=a['x']+60+(i%6)*220;y=a['y']+100+((i%30)//6)*260
 bodies['casa-'+str(i+1)]=box(x,y,x+130,y+105)
for p in l['wells']:bodies['poco-'+p['id']]=Point(p['x'],p['y']).buffer(54)
errors=[]
for (k,a),(m,b) in itertools.combinations(bodies.items(),2):
 if a.intersection(b).area>0.01:errors.append(['body-overlap',k,m])
roads=[]
for ri,r in enumerate(l['roads']):
 for tipo,paths,width in [('principal',[r['pontos']],40),('ramal',r['ramais'],40),('acesso',r['acessos'],18)]:
  for j,p in enumerate(paths):
   line=LineString([(v['x'],v['y'])for v in p]);area=line.buffer(width,cap_style='flat');roads.append((r['id']+'-'+tipo+'-'+str(j),area))
   for k,a in bodies.items():
    if area.intersection(a).area>0.01:errors.append(['road-body',r['id'],tipo,j,k,round(area.intersection(a).area,2)])
for p in l['plots']:
 for k,b in bodies.items():
  if rect(p).intersects(b):errors.append(['plot-body',p['id'],k])
 for k,b in roads:
  if rect(p).intersection(b).area>.01:errors.append(['plot-road',p['id'],k,round(rect(p).intersection(b).area,1)])
for kind in ['waterBase','waterAdvanced','sewers']:
 for p in l[kind]:
  line=LineString([(v['x'],v['y'])for v in p['pontos']]);
  for k,b in bodies.items():
   # Connections may touch the cistern/well edge, never traverse another building.
   if line.intersection(b).length>.01:errors.append(['utility-body',kind,p['id'],k,round(line.intersection(b).length,1)])
  for site in l['plots']:
   if line.intersection(rect(site)).length>.01:errors.append(['utility-plot',kind,p['id'],site['id']])
result={'world':l.get('world'),'bodies':len(bodies),'roads':len(roads),'reserves':len(l['plots']),'errors':errors};(w/'geometry-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

assert not errors,errors

from shapely.geometry import Polygon
import re
s=Path('index.html').read_text()
roofnames=set(re.findall(r'desenharArmazemAlimentoColonia\(\s*(area\w+)',s));roofs={}
for k in roofnames:
 if k not in l['areas']:continue
 a=l['areas'][k];roofs[k]=Polygon([(a['x']-12,a['y']+18),(a['x']+a['largura']/2,a['y']-58),(a['x']+a['largura']+12,a['y']+18)])
for k,b in bodies.items():
 if k.startswith('casa-'):
  x,y,xx,yy=b.bounds;roofs[k]=Polygon([(x-10,y+18),((x+xx)/2,y-38),(xx+10,y+18)])
for group in ['areasCabanasLenhadores','areasCabanasColeta','prestige']:
 for i,a in enumerate(l[group]):
  roofs[group+'-'+str(i)]=Polygon([(a['x']-14,a['y']+18),(a['x']+a['largura']/2,a['y']-58),(a['x']+a['largura']+14,a['y']+18)])
errors=[]
for r in l['roads']:
 for name,ps,width in [('main',[r['pontos']],40),('branches',r['ramais'],40),('access',r['acessos'],18)]:
  for i,p in enumerate(ps):
   a=LineString([(v['x'],v['y'])for v in p]).buffer(width,cap_style='flat')
   for k,roof in roofs.items():
    if a.intersection(roof).area>.1:errors.append(['roof-road',r['id'],name,i,k,round(a.intersection(roof).area,2)])
for k,r in roofs.items():
 for n,a in bodies.items():
  if k!=n and a.intersection(r).area>.1:errors.append(['roof-building',k,n])
result={'roofedStructures':len(roofs),'errors':errors};(w/'roof-audit.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

assert not errors,errors

from shapely.ops import unary_union
import networkx as nx
errors=[];report={}
def line(p):return LineString([(v['x'],v['y'])for v in p])
def check(name,paths):
 union=unary_union([line(r['pontos']) for r in paths]);graph=nx.Graph()
 for segment in union.geoms if hasattr(union,'geoms') else [union]:
  xy=list(segment.coords)
  for a,b in zip(xy,xy[1:]):graph.add_edge(a,b)
 components=nx.number_connected_components(graph)
 if components!=1:errors.append([name,'disconnected',components])
 crossings=[]
 for pipe in paths:
  for a,b in zip(pipe['pontos'],pipe['pontos'][1:]):
   if a['x']!=b['x'] and a['y']!=b['y']:errors.append([name,'diagonal',pipe['id']])
   seg=line([a,b])
   for rn in ['inner','outer']:
    r=l[rn];x,y=r['x'],r['y'];xr=x+r['largura'];yb=y+r['altura']
    for side,endpoints in [('norte',[(x,y),(xr,y)]),('sul',[(x,yb),(xr,yb)]),('oeste',[(x,y),(x,yb)]),('leste',[(xr,y),(xr,yb)])]:
     hit=seg.intersection(LineString(endpoints))
     if hit.is_empty:continue
     if hit.geom_type!='Point':errors.append([name,'follows-wall',pipe['id'],rn,side]);continue
     allowed=[g for g in l['gates'] if g['ring']==rn and g['side']==side and hit.distance(Point(g['x'],g['y']))<=85]
     if not allowed:errors.append([name,'outside-gate',pipe['id'],rn,side,hit.x,hit.y])
     else:crossings.append({'pipe':pipe['id'],'gate':allowed[0]['id'],'x':hit.x,'y':hit.y})
 report[name]={'polylines':len(paths),'components':components,'gateCrossings':crossings};return union
water=check('potable',l['waterBase']+l['waterAdvanced']);sewer=check('sewage',l['sewers'])
for p in l['wells']:
 endpoints=[r['pontos'][-1] for r in l['waterAdvanced'] if r['poco']==p['id']]
 if len(endpoints)!=1 or abs(Point(p['x'],p['y']).distance(Point(endpoints[0]['x'],endpoints[0]['y']))-54)>.001:errors.append(['well-terminal',p['id']])
rows=[p for p in l['sewers'] if p['id'].startswith('area')];assert len(rows)==15
outfall=l['sewers'][0]['pontos'][-1];assert outfall['x']>l['world']['coast'] and outfall['y']>l['areas']['areaEstaleiroColonia']['y']+l['areas']['areaEstaleiroColonia']['altura']
# This is topology/clearance, not modeled flow, treatment, pollution or pressure.
report.update({'houseRowCollectors':len(rows),'wells':4,'outfall':outfall,'hydraulicsSimulated':False,'errors':errors})
(w/'utilities-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));assert not errors,errors
