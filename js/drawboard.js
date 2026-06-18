// ============================================================
// drawboard.js — Rendu Canvas du plateau (cases, liens, pions,
// surbrillances, légende).
// Affichage responsive : la taille CSS du canvas est pilotée par
// #cv en CSS (height:100%;width:auto) pour remplir exactement la
// hauteur disponible sans scroll — ici on ne fixe QUE la résolution
// interne du buffer (cv.width/height), jamais cv.style.width/height.
// ============================================================

const NS={
  n:{fill:'#241A10',stroke:'rgba(236,220,176,.16)',r:8,icon:''},
  m:{fill:'#2A1608',stroke:'#C9A227',r:12,icon:'⚑'},
  c:{fill:'#141B0E',stroke:'#7C9A5E',r:9,icon:'?'},
  s:{fill:'#1F140A',stroke:'#C97B3D',r:9,icon:'$'},
  T:{fill:'#16111C',stroke:'#8B6FA3',r:9,icon:'⊞'},
  q:{fill:'#1C1605',stroke:'#4A8A86',r:13,icon:'★'},
  B:{fill:'#220705',stroke:'#A13A2A',r:16,icon:'🏦'},
};
const LEG=[
  {c:'#C9A227',l:'Mission (ville)'},
  {c:'#7C9A5E',l:'Hasard (en passant)'},
  {c:'#C97B3D',l:'Magasin (à l\'arrêt)'},
  {c:'#8B6FA3',l:'Gare (train)'},
  {c:'#4A8A86',l:'Quête spéciale (impasse)'},
  {c:'#A13A2A',l:'Banque Fédérale'},
];
function drawBoard(){
  const cv=document.getElementById('cv');
  const dpr=window.devicePixelRatio||1;
  cv.width=BW*dpr;cv.height=BH*dpr;
  const ctx=cv.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.scale(dpr,dpr);
  ctx.fillStyle='#1A120A';ctx.fillRect(0,0,BW,BH);
  ctx.strokeStyle='rgba(160,110,60,.08)';ctx.lineWidth=.5;
  for(let x=0;x<BW;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,BH);ctx.stroke();}
  for(let y=0;y<BH;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(BW,y);ctx.stroke();}
  edges.forEach(([a,b])=>{
    const na=nodes[a],nb2=nodes[b];if(!na||!nb2)return;
    ctx.strokeStyle='rgba(170,120,60,.35)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(na.x,na.y);ctx.lineTo(nb2.x,nb2.y);ctx.stroke();
  });
  if(gs?.blocked)Object.keys(gs.blocked).forEach(id=>{
    const n=nodes[parseInt(id)];if(!n)return;
    ctx.beginPath();ctx.arc(n.x,n.y,(NS[n.type]?.r||8)+6,0,Math.PI*2);
    ctx.fillStyle='rgba(161,58,42,.18)';ctx.fill();
    ctx.strokeStyle='rgba(161,58,42,.6)';ctx.lineWidth=1.5;ctx.stroke();
  });
  if(blockMode){
    blockableNodes().forEach(id=>{
      if(isBlocked(id))return;
      const n=nodes[id];
      ctx.beginPath();ctx.arc(n.x,n.y,(NS[n.type]?.r||8)+4,0,Math.PI*2);
      ctx.strokeStyle='rgba(201,162,39,.45)';ctx.lineWidth=1.5;ctx.stroke();
    });
  }
  if(trainMode){
    trainNodes.filter(n=>n.id!==me()?.nodeId).forEach(n=>{
      ctx.beginPath();ctx.arc(n.x,n.y,(NS[n.type]?.r||8)+6,0,Math.PI*2);
      ctx.fillStyle='rgba(139,111,163,.18)';ctx.fill();
      ctx.strokeStyle='rgba(139,111,163,.85)';ctx.lineWidth=2;ctx.stroke();
    });
  }
  if(isMyTurn()&&hasRolled&&movableSet.size>0&&!blockMode){
    for(const id of movableSet){const n=nodes[id];if(!n)continue;
      ctx.beginPath();ctx.arc(n.x,n.y,(NS[n.type]?.r||8)+6,0,Math.PI*2);
      ctx.fillStyle='rgba(236,220,176,.12)';ctx.fill();
      ctx.strokeStyle='rgba(236,220,176,.65)';ctx.lineWidth=2;ctx.stroke();
    }
  }
  const myP=me();
  if(myP&&gs?.phase==='game'){
    const pend=pendingMissions(myP);
    const destLabels=[...new Set(pend.map(o=>o.m.dest))];
    let tgts=destLabels.map(lbl=>nodes.find(n=>n.label===lbl)).filter(Boolean);
    const isBank=tgts.length===0;
    if(isBank){const bk=nodes.find(n=>n.type==='B');if(bk)tgts=[bk];}
    tgts.forEach(tgt=>{
      const sr=NS[tgt.type]?.r||12;
      ctx.beginPath();ctx.arc(tgt.x,tgt.y,sr+8,0,Math.PI*2);
      ctx.strokeStyle='rgba(232,178,61,.9)';ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
      ctx.font='bold 7px Arial,sans-serif';
      const lbl=isBank?'🏦 BRAQUAGE !':'🎯 OBJECTIF';
      const tw=ctx.measureText(lbl).width;
      ctx.fillStyle='rgba(26,16,8,.85)';ctx.fillRect(tgt.x-tw/2-4,tgt.y-sr-16,tw+8,11);
      ctx.fillStyle='#E8B23D';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(lbl,tgt.x,tgt.y-sr-11);
    });
  }
  nodes.forEach(node=>{
    const s=NS[node.type]||NS.n;
    const bl=isBlocked(node.id);
    ctx.beginPath();ctx.arc(node.x,node.y,s.r,0,Math.PI*2);
    ctx.fillStyle=bl?'#241008':s.fill;ctx.fill();
    ctx.strokeStyle=bl?'#A13A2A':s.stroke;ctx.lineWidth=node.type==='B'?2.5:1.5;ctx.stroke();
    if(s.icon){ctx.font=`${node.type==='B'?11:8}px serif`;ctx.fillStyle=s.stroke;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s.icon,node.x,node.y);}
    if(node.label&&node.type!=='n'){
      const lc=node.type==='B'?'#D9694A':node.type==='q'?'#5DBDB6':'#D9A45C';
      ctx.font='bold 7px Arial,sans-serif';
      const tw=ctx.measureText(node.label).width,ly=node.y+s.r+8;
      ctx.fillStyle='rgba(26,16,8,.82)';
      if(ctx.roundRect)ctx.roundRect(node.x-tw/2-3,ly-6,tw+6,11,3);
      else ctx.rect(node.x-tw/2-3,ly-6,tw+6,11);
      ctx.fill();
      ctx.fillStyle=lc;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(node.label,node.x,ly);
    }
  });
  if(gs?.players){
    const grp={};gs.players.forEach(p=>{if(!grp[p.nodeId])grp[p.nodeId]=[];grp[p.nodeId].push(p);});
    Object.entries(grp).forEach(([nid,pls])=>{
      const node=nodes[parseInt(nid)];if(!node)return;
      pls.forEach((p,i)=>{
        const angle=(i/pls.length)*Math.PI*2,dist=pls.length>1?10:0;
        const px=node.x+Math.cos(angle)*dist,py=node.y+Math.sin(angle)*dist;
        ctx.beginPath();ctx.arc(px+1,py+1,7,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.4)';ctx.fill();
        ctx.beginPath();ctx.arc(px,py,7,0,Math.PI*2);ctx.fillStyle='#C9A227';ctx.fill();
        ctx.beginPath();ctx.arc(px,py,6,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();
        if(p.id===myId){ctx.strokeStyle='#F0E4C0';ctx.lineWidth=1.5;ctx.stroke();}
        else{ctx.strokeStyle='rgba(236,220,176,.35)';ctx.lineWidth=1;ctx.stroke();}
        ctx.font='bold 6px Arial,sans-serif';ctx.fillStyle='rgba(20,10,5,.88)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.name[0].toUpperCase(),px,py);
        ctx.font='bold 7px Arial,sans-serif';const nw=ctx.measureText(p.name).width;
        ctx.fillStyle='rgba(26,16,8,.82)';ctx.fillRect(px-nw/2-2,py+8,nw+4,10);
        ctx.fillStyle=p.id===myId?'#E8B23D':p.isBot?'#B8A888':'#ECDCB0';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(p.name,px,py+9);
      });
    });
  }
  ctx.font='bold 9px Arial,sans-serif';
  LEG.forEach((l,i)=>{
    const lx=8,ly=BH-12-(LEG.length-1-i)*17;
    ctx.beginPath();ctx.arc(lx+5,ly-3,5,0,Math.PI*2);ctx.fillStyle=l.c;ctx.fill();
    ctx.fillStyle='rgba(236,220,176,.5)';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(l.l,lx+14,ly-3);
  });
}
