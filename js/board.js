// ============================================================
// board.js — Construction du graphe (nodes/edges) à partir de RAW
// (data.js) + tous les helpers géométriques / topologiques.
// ============================================================

const nodes=RAW.map((n,i)=>({id:i,r:n.r,c:n.c,x:PAD+(n.c+3)*CELL,y:PAD+(n.r+1)*CELL,type:n.t,label:n.l||''}));
const minC=Math.min(...nodes.map(n=>n.c)),maxC=Math.max(...nodes.map(n=>n.c));
const minR=Math.min(...nodes.map(n=>n.r)),maxR=Math.max(...nodes.map(n=>n.r));
const BW=PAD*2+(maxC-minC+1)*CELL, BH=PAD*2+(maxR-minR+1)*CELL;

const edges=[];
const edgeSet=new Set();
function addEdge(a,b){
  if(a<0||b<0||a>=nodes.length||b>=nodes.length) return;
  const k=`${Math.min(a,b)}-${Math.max(a,b)}`;
  if(!edgeSet.has(k)){edgeSet.add(k);edges.push([a,b]);}
}
// Certaines cases (voir EDGE_EXCLUDE, data.js) ne doivent PAS être reliées à toutes
// leurs voisines géométriques — ex. la case 6,4 n'est reliée qu'à 7,4 et 6,5.
function edgeExcluded(a,b){
  return (typeof EDGE_EXCLUDE!=='undefined'?EDGE_EXCLUDE:[]).some(([p,q])=>
    (a.r===p[0]&&a.c===p[1]&&b.r===q[0]&&b.c===q[1])||
    (a.r===q[0]&&a.c===q[1]&&b.r===p[0]&&b.c===p[1])
  );
}
for(let i=0;i<nodes.length;i++)
  for(let j=i+1;j<nodes.length;j++){
    const a=nodes[i],b=nodes[j],dr=Math.abs(a.r-b.r),dc=Math.abs(a.c-b.c);
    if((dr===1&&dc===0)||(dr===0&&dc===1)){
      if(edgeExcluded(a,b))continue;
      addEdge(i,j);
    }
  }

function nb(id){return edges.filter(e=>e[0]===id||e[1]===id).map(e=>e[0]===id?e[1]:e[0]);}
function bfsDist(s,g){
  if(s===g)return 0; const vis=new Set([s]);let fr=[s],d=0;
  while(fr.length){d++;const nx=[];
    for(const n of fr)for(const b of nb(n)){if(b===g)return d;if(!vis.has(b)){vis.add(b);nx.push(b);}}
    fr=nx;} return Infinity;
}
function bfsPath(s,g,mx){
  if(s===g)return[s]; const prev={[s]:null};const q=[s];let found=false;
  outer:for(let d=0;d<mx;d++){const nx=[];
    for(const n of q)for(const b of nb(n)){
      if(prev[b]===undefined){prev[b]=n;if(b===g){found=true;break outer;}nx.push(b);}
    }q.length=0;q.push(...nx);if(!nx.length)break;}
  if(!found)return null;
  const path=[];let cur=g;while(cur!==null){path.unshift(cur);cur=prev[cur];}return path;
}
function reachable(s,steps){
  const vis=new Set([s]);let fr=[s];
  for(let d=0;d<steps;d++){const nx=[];
    for(const n of fr)for(const b of nb(n)){if(!vis.has(b)&&!isBlocked(b)){vis.add(b);nx.push(b);}}
    fr=nx;if(!fr.length)break;}
  vis.delete(s);return vis;
}
function isBlocked(id){return gs?.blocked&&(gs.blocked[id]||0)>0;}
function blockableNodes(){return nodes.filter(n=>n.type!=='m'&&n.type!=='B').map(n=>n.id);}
const trainNodes=nodes.filter(n=>n.type==='T');
function bankId(){return nodes.find(n=>n.type==='B')?.id??0;}

// DUEL — cibles à portée. Portée normale = 1 case d'écart (adjacence directe) ; un Fusil
// (carte magasin, voir data.js) étend la portée de l'attaquant à 2 cases d'écart.
// Un joueur sur une case mission ('m') ne peut ni attaquer ni être visé ; la banque ('B')
// N'EST PAS protégée — on peut tuer / être tué en duel dessus, y compris pendant le braquage final.
function duelTargets(atk){
  if(!atk||nodes[atk.nodeId]?.type==='m')return[];
  const maxRange=atk.hasFusil?2:1;
  return gs.players.filter(p=>{
    if(p.id===atk.id)return false;
    if(nodes[p.nodeId]?.type==='m')return false;
    const d=bfsDist(atk.nodeId,p.nodeId);
    return d>=1&&d<=maxRange;
  });
}
