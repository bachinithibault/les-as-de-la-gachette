// ============================================================
// bots.js — IA simple : déplacement vers la mission la plus proche,
// résolution automatique des cases spéciales.
// ============================================================

function maybeBotTurn(){
  if(!botMode)return;const c=cur();if(!c?.isBot)return;
  setTimeout(()=>doBotTurn(c),900);
}
function doBotTurn(bot){
  const v1=Math.ceil(Math.random()*6),v2=Math.ceil(Math.random()*6),total=v1+v2+(bot.hasGun?2:0)+(bot.selleCount||0);
  addLog(`🤖 ${bot.name} lance ${v1}+${v2}=${total}`,'me2');
  const pend=pendingMissions(bot);
  let best=null,bestD=Infinity;
  for(const o of pend){
    const tn=nodes.find(n=>n.label===o.m.dest);if(!tn)continue;
    const d=bfsDist(bot.nodeId,tn.id);if(d<bestD){bestD=d;best=o;}
  }
  const tgt=best?nodes.find(n=>n.label===best.m.dest):nodes.find(n=>n.type==='B');
  let fid=bot.nodeId;
  if(tgt){
    const path=bfsPath(bot.nodeId,tgt.id,total);
    if(path&&path.length>1)fid=path[Math.min(total,path.length-1)];
    else{const r=[...reachable(bot.nodeId,total)];if(r.length)fid=r[Math.floor(Math.random()*r.length)];}
  }
  bot.nodeId=fid;
  const fn=nodes[fid];addLog(`🤖 ${bot.name} → ${fn.label||ntl(fn.type)}`,'me2');
  let turnEndsNow=true;
  if(fn.type==='c')doChance(bot,fn.id);
  else if(fn.type==='m'){
    const cands=missionsAt(bot,fn.label);
    if(cands.length){
      const o=cands[0];
      const roll=Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6)+PRIME_BONUS[bot.prime];
      if(roll>=o.m.minScore){bot.money+=o.m.reward;bot.missionsWon++;bot.prime=Math.min(4,bot.prime+(o.m.two?2:1));bot.doneMask[o.pos]=true;bot.failedMission=false;bot.failedPos=null;addLog(`⭐ ${bot.name} réussit "${o.m.title}" +${o.m.reward}$`,'ev');}
      else{bot.failedMission=true;bot.failedPos=o.pos;addLog(`❌ ${bot.name} échoue "${o.m.title}" — tour terminé`,'');}
    }
  }
  else if(fn.type==='B'&&allDone(bot)&&bot.money>=1000){
    const roll=Math.ceil(Math.random()*6)+Math.ceil(Math.random()*6);
    if(roll>=9){bot.money+=1000;addLog(`🎉 ${bot.name} braque la banque ! +1000$`,'ev');gs.phase='finished';turnEndsNow=false;}
    else addLog(`💥 ${bot.name} rate le braquage (${roll}/9)`,'du');
  }
  else if(fn.type==='q')doQuest(bot,fn);
  else if(fn.type==='s'&&bot.money>=shopCard('block').price&&Math.random()<0.3&&(gs.shopStock?.block||0)>0){
    bot.money-=shopCard('block').price;bot.blockCards=(bot.blockCards||0)+1;gs.shopStock.block--;
    addLog(`🤖 ${bot.name} achète une carte de blocage`,'');
  }
  if(gs.phase==='finished'){broadcast({type:'state',gs});renderAll();showEndScreen();return;}
  gs.turnIdx=(gs.turnIdx+1)%gs.players.length;
  broadcast({type:'state',gs});renderAll();
  setTimeout(()=>maybeBotTurn(),600);
}
