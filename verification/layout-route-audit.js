'use strict';
const fs=require('node:fs');const {game,plain}=require('./layout-harness');const g=game();g.mature();g.eval('estado.trechosAdarveExterno=4;estado.trechosAdarveInterno=4;estado.quantidadeTorresMuralha=8;');
console.time('routes');const report=g.eval(`(()=>{
 const routes=[],errors=[];
 const central={x:areaTransportadoresColonia.x+areaTransportadoresColonia.largura/2,y:areaTransportadoresColonia.y+areaTransportadoresColonia.altura+65};
 for(const [id,front]of Object.entries(acessosPlantaColonia)){
  const r=rotaMaisRapidaColonia(front,central);routes.push({id,...r});if(r.bloqueada)errors.push(['blocked',id]);
  for(let i=1;i<r.pontos.length;i++)if(!segmentoNavegavelPlanta(r.pontos[i-1],r.pontos[i],null,0))errors.push(['obstructed',id,i]);
 }
 const military=[];
 for(const p of postosElevadosColonia())for(const cat of categoriasGuarnicao){
  const route=rotaAcessoGuarnicao(origemDefensorColonia(cat,0),p);military.push({posto:p.id,cat,route});
  if(route.length<2||route.length>64)errors.push(['garrison-length',p.id,cat,route.length]);
  for(let i=1;i<route.length;i++)if(!segmentoNavegavelPlanta(route[i-1],route[i],null,0))errors.push(['garrison-obstructed',p.id,cat,i,route[i-1],route[i]]);
 }
 const graph=grafoRodoviarioPlanta();return{routes,military,graph:{nodes:graph.pontos.size,segments:graph.segmentos.length},errors,warnings:[...avisosRotasPlanta]};
})()`);console.timeEnd('routes');fs.writeFileSync('../evidence/route-audit.json',JSON.stringify(plain(report),null,2));console.log(report.graph,'errors',report.errors.length,JSON.stringify(report.errors.slice(0,15)),report.warnings);
