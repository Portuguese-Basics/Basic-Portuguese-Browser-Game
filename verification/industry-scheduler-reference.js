// Unoptimized reference with the adopted activity and affordable-choice rules.
// Keep repeated scans for independent optimization comparison. Tests only; never loaded by game.
      function numeroAgentesIndustria(id,funcao=null) {
        return Object.values(estado.industriaColonia.agentes).filter(a=>a.empresa===id&&(!funcao||a.funcao===funcao)).length;
      }
      function agendarVisitaIndustria() {
        const s=estado.industriaColonia,e=estado.economiaCidada;
        if(!e.opcionais||estado.colonosComFome>0||Object.values(s.agentes).filter(a=>a.funcao==='visita').length>=48)return false;
        const destinos=planosIndustria.filter(p=>(p.preco||p.id==='artes')&&s.negocios[p.id]?.estado==='ativo'&&(p.id!=='festival'||s.festivalAte>s.tempo+90)&&Object.values(s.agentes).some(a=>a.empresa===p.id&&a.funcao==='trabalho'&&a.fase==='atividade'&&e.pessoas[a.id]?.emprego==='geral'));
        if(!destinos.length)return false;
        const adultos=e.adultos;
        for(let n=0;n<adultos.length;n++){
          const id=adultos[(n+Math.floor(s.tempo)*7)%adultos.length],p=e.pessoas[id],a=s.agentes[id];
          if(papeisMilitaresCidada.includes(p.emprego)||p.emprego==='transportador'||a&&a.funcao!=='passeio'||e.ciclo-p.ultimaCompra<3)continue;
          const opcoes=destinos.filter(oferta=>{
            const b=s.negocios[oferta.id],item=oferta.item||'artigos',preco=oferta.preco||1600000;
            const esperando=Object.values(s.agentes).filter(a=>a.funcao==='visita'&&a.empresa===b.id).length;
            return esperando<Math.min(b.estoque[item],12)&&b.estoque[item]>=1&&p.saldo>=reservaAlimentarIndustria(p)+precoComTributosCidada(preco).total&&(item!=='cerveja'||idadePessoaCidada(p)>=18);
          }).sort((a,b)=>Math.hypot(a.x-(p.casa?posicaoCasaColonia(p.casa-1).x:areaAdministracao.x),a.y-(p.casa?posicaoCasaColonia(p.casa-1).y:areaAdministracao.y))-Math.hypot(b.x-(p.casa?posicaoCasaColonia(p.casa-1).x:areaAdministracao.x),b.y-(p.casa?posicaoCasaColonia(p.casa-1).y:areaAdministracao.y)));
          if(!opcoes.length)continue;
          // Alternate nearby choices by actual prior visits, not a random walk.
          const oferta=opcoes[(p.lazer+p.bens)%Math.min(3,opcoes.length)],b=s.negocios[oferta.id],item=oferta.item||'artigos',preco=oferta.preco||1600000;
          const esperando=Object.values(s.agentes).filter(a=>a.funcao==='visita'&&a.empresa===b.id).length;
          if(esperando>=Math.min(b.estoque[item],12)||b.estoque[item]<1||p.saldo<reservaAlimentarIndustria(p)+precoComTributosCidada(preco).total)continue;
          if(item==='cerveja'&&idadePessoaCidada(p)<18)continue;
          const visita=novoAgenteIndustria(p,'visita',b.id,entradaIndustria(b.id));if(!visita)return false;
          visita.atividade='Visita a '+oferta.nome;substituirAgenteIndustria(visita);return true;
        }return false;
      }
      function executarCompraIndustria(a) {
        const s=estado.industriaColonia,e=estado.economiaCidada,p=e.pessoas[a.id],b=s.negocios[a.empresa],oferta=planoIndustria(a.empresa);
        if(s.agentes[a.id]!==a||a.funcao!=='visita'||a.fase!=='atividade'||a.trabalho<10||a.consumado||estado.jogoPausado)return false;
        if(!p||!b||!oferta||Math.hypot(a.x-entradaIndustria(a.empresa).x,a.y-entradaIndustria(a.empresa).y)>1||b.estado!=='ativo'||!e.opcionais||estado.colonosComFome>0||a.empresa==='festival'&&s.festivalAte<=s.tempo)return false;
        const item=oferta.item||'artigos',preco=oferta.preco||1600000,t=precoComTributosCidada(preco);
        const atendente=Object.values(s.agentes).some(q=>q.id!==a.id&&q.empresa===a.empresa&&q.funcao==='trabalho'&&q.fase==='atividade'&&e.pessoas[q.id]?.emprego==='geral');
        if(!atendente||b.estoque[item]<1||p.saldo<reservaAlimentarIndustria(p)+t.total||item==='cerveja'&&idadePessoaCidada(p)<18)return false;
        p.saldo-=t.total;p.gasto+=t.total;p.impostos+=t.cidade+t.pessoal;p.ultimaCompra=e.ciclo;
        if(item==='artigos')p.bens++;else p.lazer++;
        a.consumado=true;b.estoque[item]--;tributarIndustria(preco,p.id,a.empresa,'visita_'+item);s.totais.visitas++;
        registrarMovimentoPessoa(p,'compra em '+oferta.nome,-t.total,a.empresa);liquidarCompensacaoCidada();return true;
      }
      function desenharIndustriaColonia() {
        if(!industriaAtiva())return;const s=estado.industriaColonia;
        contexto.save();contexto.textAlign='center';
        for(const pr of pracasIndustria)if(areaVisivelMuralhas(pr.x,pr.y,pr.largura,pr.altura)){
          contexto.fillStyle='#7e946b';contexto.fillRect(pr.x,pr.y,pr.largura,pr.altura);contexto.strokeStyle='#b3bf92';contexto.lineWidth=3;contexto.strokeRect(pr.x,pr.y,pr.largura,pr.altura);
          for(let i=0;i<5;i++){contexto.fillStyle='#6b5035';contexto.fillRect(pr.x+30+i*(pr.largura-60)/5,pr.y+pr.altura/2,40,12);}
          contexto.fillStyle='#ecedd4';contexto.font='bold 18px sans-serif';contexto.fillText(pr.nome+' · gratuito',pr.x+pr.largura/2,pr.y+24);
        }
        for(const p of planosIndustria){if(!areaVisivelMuralhas(p.x,p.y-30,p.largura,p.altura+70))continue;const b=s.negocios[p.id];
          contexto.fillStyle=b.estado==='planejado'?'#879971':p.cor;contexto.fillRect(p.x,p.y,p.largura,p.altura);
          contexto.strokeStyle=b.estado==='ativo'?'#493b2c':'#cbb98a';contexto.lineWidth=6;contexto.strokeRect(p.x,p.y,p.largura,p.altura);
          contexto.fillStyle='#302a24';contexto.fillRect(p.x+8,p.y+8,p.largura-16,32);contexto.fillStyle='#fff1cc';contexto.font='bold 20px sans-serif';contexto.fillText(p.nome,p.x+p.largura/2,p.y+31,p.largura-25);
          if(b.estado==='planejado'){contexto.fillStyle='#fff1cc';contexto.font='18px sans-serif';contexto.fillText('Projeto · '+p.capital+' ouro',p.x+p.largura/2,p.y+p.altura/2);continue;}
          if(p.id==='lupulo'||p.id==='floresta')for(let i=0;i<7;i++)for(let j=0;j<2;j++){const x=p.x+100+i*180,y=p.y+105+j*105;contexto.strokeStyle='#67503d';contexto.beginPath();contexto.moveTo(x,y+45);contexto.lineTo(x,y-10);contexto.stroke();contexto.fillStyle=p.id==='lupulo'&&j===1?'#ddbf59':'#476f38';contexto.fillRect(x-15,y-6,30,32);}
          else if(p.id==='pedreira'){for(let i=0;i<5;i++){contexto.fillStyle=i%2?'#a9aba5':'#777b76';contexto.fillRect(p.x+40+i*135,p.y+80+(i%2)*35,100,75);}}
          else if(p.id==='teatro'||p.id==='festival'){
            contexto.fillStyle='#755042';contexto.fillRect(p.x+25,p.y+58,p.largura-50,60);contexto.fillStyle='#b16e70';contexto.fillRect(p.x+25,p.y+58,30,60);contexto.fillRect(p.x+p.largura-55,p.y+58,30,60);
            for(let i=0;i<4;i++)for(let j=0;j<3;j++){contexto.fillStyle='#d7bd8c';contexto.fillRect(p.x+45+i*(p.largura-100)/4,p.y+160+j*50,35,16);}
          }else if(p.item==='cerveja'){
            contexto.fillStyle='#5d3825';contexto.fillRect(p.x+25,p.y+50,p.largura-50,13);
            const v=dimensoesVisaoExpansao(),aspecto=(canvas.width/v.largura)/(canvas.height/v.altura);
            for(let i=0;i<4;i++){const x=p.x+70+i*(p.largura-140)/3,y=p.y+100;contexto.fillStyle='#ddb675';contexto.beginPath();contexto.ellipse(x,y,27,27*aspecto,0,0,Math.PI*2);contexto.fill();contexto.fillStyle='#62432b';contexto.fillRect(x-40,y-5*aspecto,12,10*aspecto);contexto.fillRect(x+28,y-5*aspecto,12,10*aspecto);contexto.fillStyle='#f0cf61';contexto.fillRect(x-8,y-6*aspecto,10,12*aspecto);}
          }else for(let i=0;i<4;i++){const x=p.x+50+i*(p.largura-100)/4,y=p.y+80;contexto.fillStyle=p.id==='cervejaria'?'#835a30':'#624a34';contexto.fillRect(x,y,45,35);contexto.fillStyle='#debf7d';contexto.fillRect(x+5,y+5,35,8);}
          contexto.fillStyle='#eadabc';contexto.font='18px sans-serif';const texto=b.estado==='obra'?`OBRA ${Math.floor(b.obra)}/${p.obra} · paga`:`${numeroAgentesIndustria(p.id)} em atividade · caixa ${(b.caixa/1000000).toFixed(1)}`;
          contexto.fillText(texto,p.x+p.largura/2,p.y+p.altura-15,p.largura-20);
        }
        // Cutaways use existing footprints. Only staffed indoor workplaces are shown.
        const vistos=new Set();for(const p of cacheVidaCotidiana.pessoas){if(['geral','crianca','transportador',...papeisMilitaresCidada,'lavoura','horta','feijao','pastagem','pesca','cacador','lenhador','coletor','reflorestador'].includes(p.tipo))continue;
          const a=areaEmpregoCotidiano(p.tipo,p.vaga);if(!a||vistos.has(a)||!areaVisivelMuralhas(a.x,a.y,a.largura,a.altura))continue;vistos.add(a);
          contexto.fillStyle='rgba(211,194,154,.86)';contexto.fillRect(a.x+12,a.y+45,a.largura-24,Math.max(20,a.altura-62));
          contexto.strokeStyle='#716145';contexto.lineWidth=2;for(let i=0;i<3;i++)contexto.strokeRect(a.x+30+i*(a.largura-70)/3,a.y+65,30,18);
        }
        contexto.restore();
      }
