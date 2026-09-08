'use strict';
// Three-way invariant checks: actual old runtime -> relocated runtime -> reloaded relocation.
// Geometry is allowed to change; money, people, equipment, construction and timers are not.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');const {game,plain}=require('./layout-harness');
const previous=execFileSync('git',['show','c158b99822563e0f94c5f47ac00391e05de0b1c0:index.html'],{encoding:'utf8'});
let groups=0;function test(name,f){f();groups++;console.log('PASS '+name);}
function moneyState(g){const s=plain(g.estado);delete s.cameraExpansao;delete s.jogador.x;delete s.jogador.y;
 for(const u of s.defesaPosicional.unidades)for(const k of ['x','y','rota','trecho'])delete u[k];
 if(s.defesaPosicional.exercicio){for(const t of s.defesaPosicional.exercicio.alvos){delete t.x;delete t.y;}for(const p of s.defesaPosicional.exercicio.flechas){delete p.origem;delete p.destino;}}
 return s;
}
function full(g){g.mature();g.eval('estado.trechosPalicadaInterna=4;estado.trechosPalicadaExterna=4;estado.trechosMuralhaPedraInterna=4;estado.trechosMuralhaPedraExterna=4;estado.quantidadeTorresMuralha=8;estado.quantidadePortoesFortificados=7;estado.trechosAdarveInterno=4;estado.trechosAdarveExterno=4;estado.arqueirosMilicia=4;estado.arqueirosGuarda=4;estado.arqueirosSoldados=4;estado.estoqueFlechas=120;estado.defesaPosicional=normalizarDefesaPosicional(null)');}
test('25% extra world area, same 90 houses, same colony reset version and building sizes',()=>{
 const a=game(new Map(),previous),b=game();a.mature();b.mature();assert.equal(b.eval('larguraMundoExpansao*alturaMundoExpansao')/a.eval('larguraMundoExpansao*alturaMundoExpansao'),1.25);
 assert.equal(b.eval('versaoColonia'),a.eval('versaoColonia'));assert.equal(b.eval('versaoMapa'),a.eval('versaoMapa'));
 const old=b.eval('areasPlantaAnteriorColonia'),now=b.eval('areasPlantaColonia');
 for(const k of Object.keys(old))if(!['areaMoradias','areaSegundoBlocoMoradias','areaTerceiroBlocoMoradias'].includes(k)){assert.equal(now[k].largura,old[k].largura,k);assert.equal(now[k].altura,old[k].altura,k);}
 assert.equal(b.estado.quantidadeCasasColonia,90);assert.equal(b.estado.populacaoColonia,450);
});
test('garrison, funds and precious stocks lie inside the stronghold; housing outside it',()=>{
 const g=game();const names=['areaAdministracao','areaPatioTreinoColonia','areaQuartelMilitarColonia','areaBancoColonia','areaArsenalMadeira','areaArsenalColonia','areaDepositoFlechas','areaArmazemFerramentas','areaArmeiroColonia','areaArmazemComercial','areaAdegaFriaColonia','areaDefumadorioColonia','areaCofreCortesColonia','areaDespensaRefeicoesColonia','areaCeleiro','areaCisternaColonia','areaFarmaciaColonia'];g.context.names=names;
 assert.equal(g.eval('names.every(n=>{const a=areasPlantaColonia[n],r=recintoInterno;return a.x>r.x&&a.y>r.y&&a.x+a.largura<r.x+r.largura&&a.y+a.altura<r.y+r.altura})'),true);
 assert.equal(g.eval('[areaMoradias,areaSegundoBlocoMoradias,areaTerceiroBlocoMoradias].every(a=>a.x>recintoExterno.x&&a.y>recintoExterno.y&&a.x+a.largura<recintoExterno.x+recintoExterno.largura&&a.y+a.altura<recintoExterno.y+recintoExterno.altura&&!(a.x<recintoInterno.x+recintoInterno.largura&&a.x+a.largura>recintoInterno.x&&a.y<recintoInterno.y+recintoInterno.altura&&a.y+a.altura>recintoInterno.y))'),true);
 assert.equal(g.eval('areaCemiterioColonia.y>recintoExterno.y+recintoExterno.altura&&areaAcougueColonia.x+areaAcougueColonia.largura<recintoExterno.x'),true);
});
test('12 varied unbuilt plots stay empty and cannot alter money or construction',()=>{
 const g=game();g.mature();const before=plain(g.estado);assert.equal(g.eval('reservasPlantaColonia.length'),12);
 assert.ok(g.eval('new Set(reservasPlantaColonia.map(p=>p.largura+"x"+p.altura)).size')>=8);
 g.eval('desenharReservasPlantaColonia();abrirPlantaColonia()');assert.deepEqual(plain(g.estado),before);
 assert.equal(g.eval('reservasPlantaColonia.filter(p=>p.zona==="cidadela").length'),3);
});
test('all 160 site frontages and all 144 military approaches are reachable without cutting walls',()=>{
 const g=game();full(g);const report=g.eval(`(()=>{const bad=[];const end=acessosPlantaColonia.areaTransportadoresColonia;for(const [k,p]of Object.entries(acessosPlantaColonia)){const r=rotaMaisRapidaColonia(p,end);if(r.bloqueada||!r.pontos.slice(1).every((b,i)=>segmentoNavegavelPlanta(r.pontos[i],b,null,0)))bad.push(k);}for(const p of postosElevadosColonia())for(const c of categoriasGuarnicao){const r=rotaAcessoGuarnicao(origemDefensorColonia(c,0),p);if(r.length<2||r.length>64||!r.slice(1).every((b,i)=>segmentoNavegavelPlanta(r[i],b,null,0)))bad.push(p.id+':'+c);}return{fronts:Object.keys(acessosPlantaColonia).length,posts:postosElevadosColonia().length,bad,warnings:[...avisosRotasPlanta]};})()`);
 assert.equal(report.fronts,160);assert.equal(report.posts,48);assert.deepEqual(plain(report.bad),[]);assert.deepEqual(plain(report.warnings),[]);
});
test('foundation settlers, job centers and house exits have valid attachments, including clearance margins',()=>{
 const g=game();g.mature();const result=g.eval(`(()=>{const bad=[];for(let i=0;i<20;i++){const a=posicaoFormacaoColonos({x:posicaoNovaColonia.x+35,y:posicaoNovaColonia.y+75},i),b=posicaoTrabalhoAdministracao(i),c=posicaoTrabalhoMoradias(i);for(const [p,q]of [[a,b],[b,c]])if(rotaMaisRapidaColonia(p,q).bloqueada)bad.push({i,p,q});}for(const type of Object.keys(coresVidaCotidiana).filter(t=>t!=='crianca')){const p=destinoEmpregoColonia(type,0);if(p&&Number.isFinite(p.x)&&rotaMaisRapidaColonia(acessoCasaColonia(0),p).bloqueada)bad.push({type,p});}return bad;})()`);assert.deepEqual(plain(result),[]);
});
test('one-time migration preserves every financial/identity/paid construction field and progress',()=>{
 for(const scene of ['mature','partial','indo','subindo','posto','descendo','voltando','flight','hunt']){
  const seed=game(new Map(),previous);full(seed);
  if(scene==='partial')seed.eval('estado.trechosAdarveInterno=2;estado.trechosAdarveExterno=4;estado.obraAutomaticaColonia="adarveInterno";estado.tempoObraAutomaticaColonia=13.25;estado.ampliacaoMuralhasAutorizada=true;estado.niveisEstradasColonia[3]=1;estado.trechoEstradaEmObra=3;');
  if(['indo','subindo','posto','descendo','voltando','flight'].includes(scene)){
   seed.eval('atualizarGuarnicaoColonia(500)');const u=seed.estado.defesaPosicional.unidades[0];u.fase=scene==='flight'?'posto':scene;
   if(['indo','voltando'].includes(scene)){if(scene==='voltando')u.rota.reverse();u.trecho=1;u.x=(u.rota[0].x+u.rota[1].x)/2;u.y=(u.rota[0].y+u.rota[1].y)/2;}
   if(['subindo','descendo'].includes(scene)){u.altura=.5;const p=seed.eval(`postosElevadosColonia().find(p=>p.id===${JSON.stringify(u.posto)})`);u.x=(p.x+p.pe.x)/2;u.y=(p.y+p.pe.y)/2;}
   if(scene==='flight')seed.eval('iniciarExercicioMuralhas();atualizarGuarnicaoColonia(.2)');
  }
  if(scene==='hunt')seed.eval('iniciarExpedicaoMilicia(5,120);atualizarExpedicaoMilicia(90)');
  seed.eval('estado.jogoPausado=true;estado.cameraExpansao={x:6300,y:3800,zoom:.7};salvarProgresso()');
  const a=game(new Map(seed.storage),previous),b=game(new Map(seed.storage));assert.equal(a.eval('larguraMundoExpansao'),14000);assert.equal(b.eval('larguraMundoExpansao'),17500);
  a.step(0);b.step(0);a.resetDrawCalls();b.resetDrawCalls();
  assert.deepEqual(moneyState(b),moneyState(a),scene+' resource/identity/phase invariants');
  for(const u of b.estado.defesaPosicional.unidades){assert.ok(u.rota.length>=2&&u.rota.length<=64);assert.ok(u.rota.slice(1).every((p,i)=>{b.context.A=u.rota[i];b.context.B=p;return b.eval('segmentoNavegavelPlanta(A,B,null,0)')}),scene+' route');}
  b.eval('salvarProgresso()');const raw=JSON.parse([...b.storage.values()][0]);assert.equal(raw.expansao.plantaRevisao,1);
  const c=game(new Map(b.storage));c.step(0);c.resetDrawCalls();assert.deepEqual(plain(c.estado),plain(b.estado),scene+' repeated reload is exact');
 }
});
test('whole-map camera fits land and sea; all sector controls stay in bounds',()=>{
 const g=game();g.mature();for(const s of ['panorama','cidadela','cidade','costa']){g.eval(`focarSetorPlanta('${s}')`);assert.equal(g.eval('estado.cameraExpansao.x>=0&&estado.cameraExpansao.y>=0&&estado.cameraExpansao.x+dimensoesVisaoExpansao().largura<=larguraMundoExpansao+.001&&estado.cameraExpansao.y+dimensoesVisaoExpansao().altura<=alturaMundoExpansao+.001'),true);}
 g.eval('focarSetorPlanta("panorama")');assert.deepEqual(plain(g.eval('dimensoesVisaoExpansao()')),{largura:17500,altura:9000});
});
test('cache respects road upgrades and route results never mutate economy',()=>{
 const g=game();g.mature();g.eval('limitarCameraExpansao()');const before=plain(g.estado);g.eval('globalThis.a=rotaMaisRapidaColonia(acessosPlantaColonia.areaQuartelMilitarColonia,acessosPlantaColonia.areaCaisComercialColonia);');
 assert.equal(g.eval('a===rotaMaisRapidaColonia(acessosPlantaColonia.areaQuartelMilitarColonia,acessosPlantaColonia.areaCaisComercialColonia)'),true);g.eval('desenhar()');assert.deepEqual(plain(g.estado),before);
 g.estado.niveisEstradasColonia.fill(0);assert.equal(g.eval('a===rotaMaisRapidaColonia(acessosPlantaColonia.areaQuartelMilitarColonia,acessosPlantaColonia.areaCaisComercialColonia)'),false);
 assert.ok(g.eval('cacheRotasEstradaColonia.size')<=800&&g.eval('cacheLigacoesPlanta.size')<=1200);
});
test('migrant/fleet hulls stay on current water and shipyard jobs target the relocated yard',()=>{
 const g=game();g.mature();const before=plain(g.estado);
 assert.equal(g.eval('(()=>{const p=destinoEmpregoColonia("estaleiro",0),a=areaEstaleiroColonia;return p.x>=a.x&&p.x<=a.x+a.largura&&p.y===a.y})()'),true);
 const bad=g.eval(`(()=>{const bad=[];for(let i=0;i<20;i++)for(const phase of [0,.25,.5,.75,1]){const p=posicaoBarcoMigracaoColonia(duracaoViagemMigrante*phase,i);if(p.x-95<limiteCosta||p.x+95>larguraMundoExpansao||p.y-85<0||p.y+55>alturaMundoExpansao)bad.push(['migration',i,phase,p]);}for(const scale of [.62,.92,1])for(const x of [0,limiteCosta,limiteCosta+850,larguraMundoExpansao+500])for(const y of [-100,2000,alturaMundoExpansao+500]){const p=posicaoNavioNoMarColonia(x,y,scale);if(p.x-110*scale<limiteCosta||p.x+110*scale>larguraMundoExpansao||p.y-108*scale<0||p.y+46*scale>alturaMundoExpansao)bad.push(['fleet',p]);}return bad;})()`);
 assert.deepEqual(plain(bad),[]);assert.deepEqual(plain(g.estado),before);
});
console.log('MAP_LAYOUT_OK '+groups+' groups');
