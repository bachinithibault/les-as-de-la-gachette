// ============================================================
// duel.js — Duels entre joueurs. État partagé via gs.duel pour que
// CHAQUE joueur lance ses propres dés sur son écran.
// Portée : duelTargets() (board.js) — distance de graphe, +1 si
// Fusil, exclut les cases mission (banque NON exclue : on peut
// mourir en duel sur la case banque, y compris pendant le braquage).
// Pénalité Fusil : si l'attaquant duelle à distance 2 (1 case
// d'écart) grâce à son Fusil, et que le défenseur n'a pas de Fusil,
// le défenseur perd 2 points à son lancer défensif — sauf s'il a
// "Comme son ombre", qui annule cette pénalité.
// ============================================================

function openDuelModal(){
  const atk=me();if(!atk)return;
  if(gs.duel){toast('Un duel est déjà en cours !');return;}
  const targets=duelTargets(atk);
  if(!targets.length){toast('Aucune cible de duel valide à portée !');return;}
  const def=targets[0];
  const dist=bfsDist(atk.nodeId,def.nodeId);
  const defPenalty=(dist===2&&atk.hasFusil&&!def.hasFusil&&!def.hasOmbre)?2:0;
  // Le Fusil est à usage unique : s'il a permis cette attaque à 2 cases d'écart, il est
  // consommé immédiatement et la carte retourne dans la pioche du magasin (restock).
  if(dist===2&&atk.hasFusil){
    atk.hasFusil=false;
    gs.shopStock['fusil']=(gs.shopStock['fusil']||0)+1;
    addLog(`🔭 ${atk.name} utilise son Fusil pour ce duel — la carte est consommée.`,'du');
  }
  gs.duel={atkId:atk.id,defId:def.id,atk:null,def:null,phase:'atk',resultText:null,defPenalty};
  duelRevolverBonus=0;
  // Déclencher un duel — même en pleine résolution de déplacement — interrompt
  // immédiatement et définitivement le reste des pas restants de ce tour.
  hasRolled=true;stepsLeft=0;movableSet=new Set();
  const stepsEl=document.getElementById('steps-left');if(stepsEl)stepsEl.textContent='';
  broadcast({type:'state',gs});
  renderAll();
}
function useDuelRevolver(bonus){
  const d=gs?.duel;if(!d)return;
  if(d.phase==='atk'&&myId!==d.atkId)return;
  if(d.phase==='def'&&myId!==d.defId)return;
  if(d.phase==='done')return;
  const p=me();if(!p||(p.revolverCount||0)<=0||duelRevolverBonus>0)return;
  p.revolverCount--;duelRevolverBonus=bonus;
  addLog(`🔫 ${p.name} utilise un Revolver en duel (+${bonus})`,'du');
  broadcast({type:'state',gs});renderAll();
}
function renderDuelCardButtons(d){
  const box=document.getElementById('duel-cards');if(!box)return;
  if(!d||d.phase==='done'){box.innerHTML='';return;}
  const amActing=(d.phase==='atk'&&myId===d.atkId)||(d.phase==='def'&&myId===d.defId);
  if(!amActing){box.innerHTML='';return;}
  const p=me();if(!p){box.innerHTML='';return;}
  if((p.revolverCount||0)>0&&duelRevolverBonus===0){
    box.innerHTML=`<button class="m-close" style="width:48%;margin-right:4%;font-size:8px" onclick="useDuelRevolver(1)">🔫 Revolver +1 (${p.revolverCount})</button>`+
      `<button class="m-close" style="width:48%;font-size:8px" onclick="useDuelRevolver(2)">🔫 Revolver +2 (${p.revolverCount})</button>`;
  }else if(duelRevolverBonus>0){
    box.innerHTML=`<div class="mc-reward">🔫 Revolver activé : +${duelRevolverBonus}</div>`;
  }else{
    box.innerHTML='';
  }
}
function duelRoll(){
  const d=gs?.duel;if(!d)return;
  if(d.phase==='atk'&&myId!==d.atkId)return;
  if(d.phase==='def'&&myId!==d.defId)return;
  if(d.phase==='done')return;
  performDuelRoll();
}
function performDuelRoll(){
  const d=gs.duel;if(!d)return;
  const isAtk=d.phase==='atk';
  const btn=document.getElementById('duel-btn');if(btn)btn.disabled=true;
  const d1=document.getElementById(isAtk?'da1':'dd1'),d2=document.getElementById(isAtk?'da2':'dd2');
  if(d1){d1.classList.add('rolling');d2.classList.add('rolling');}
  const revBonus=duelRevolverBonus;duelRevolverBonus=0;
  setTimeout(()=>{
    if(d1){d1.classList.remove('rolling');d2.classList.remove('rolling');}
    const v1=Math.ceil(Math.random()*6),v2=Math.ceil(Math.random()*6);
    const atkP=gs.players.find(p=>p.id===d.atkId),defP=gs.players.find(p=>p.id===d.defId);
    if(!atkP||!defP){gs.duel=null;broadcast({type:'state',gs});renderAll();return;}
    let total=v1+v2+PRIME_BONUS[(isAtk?atkP:defP).prime]+revBonus;
    if(!isAtk)total-=(d.defPenalty||0);
    if(isAtk){
      d.atk={d1:v1,d2:v2,total};d.phase='def';
      broadcast({type:'state',gs});renderAll();
      if(defP.isBot)setTimeout(()=>performDuelRoll(),700);
    }else{
      d.def={d1:v1,d2:v2,total};d.phase='done';
      applyDuelResult(d,atkP,defP);
      broadcast({type:'state',gs});renderAll();
    }
  },430);
}
function applyDuelResult(d,atk,def){
  if(d.atk.total===d.def.total){
    // Égalité : aucun gagnant ni perdant, personne ne bouge, aucun argent/prime ne change —
    // le duel se termine simplement et le tour passe au joueur suivant.
    d.loserId=null;
    d.resultText=`🤝 ÉGALITÉ !\nPersonne ne gagne, personne ne perd.`;
    addLog(`⚔️ Duel entre ${atk.name} et ${def.name} : égalité, rien ne se passe.`,'du');
    d.redoResolved=true;
    return;
  }
  const win=d.atk.total>d.def.total,loot=PRIME_MONEY[def.prime]+50;
  d.loserId=win?def.id:atk.id;
  if(win){
    atk.money+=loot;def.money=Math.max(0,def.money-50);
    if(def.prime>0)def.prime--;def.nodeId=bankId();def.deaths++;
    d.resultText=`🏆 ${atk.name} GAGNE !\n+${loot}$ · ${def.name} retourne à la banque · -1 prime`;
    addLog(`⚔️ ${atk.name} bat ${def.name} ! +${loot}$`,'du');
  }else{
    def.money+=50;atk.money=Math.max(0,atk.money-50);
    if(atk.prime>0)atk.prime--;atk.nodeId=bankId();atk.deaths++;
    d.resultText=`🏆 ${def.name} GAGNE !\n${atk.name} : -50$ · -1 prime · retour banque`;
    addLog(`⚔️ ${def.name} repousse ${atk.name}`,'du');
  }
  const loser=win?def:atk;
  if(loser.isBot){
    const redoable=(loser.missionOrder||[]).map((mi,pos)=>({pos,mi})).filter(o=>loser.doneMask&&loser.doneMask[o.pos]);
    if(redoable.length){
      const pick=redoable[Math.floor(Math.random()*redoable.length)];
      loser.doneMask[pick.pos]=false;loser.missionsWon=Math.max(0,(loser.missionsWon||0)-1);
      addLog(`🔁 ${loser.name} doit refaire une mission après sa défaite en duel.`,'du');
    }
    d.redoResolved=true;
  }
}
function closeDuelModal(){
  const d=gs.duel;if(!d)return;
  const loser=gs.players.find(pl=>pl.id===d.loserId);
  const redoable=loser?(loser.missionOrder||[]).map((mi,pos)=>({pos,mi})).filter(o=>loser.doneMask&&loser.doneMask[o.pos]):[];
  const redoNeeded=redoable.length>0;
  const iAmLoser=myId===d.loserId;
  if(iAmLoser&&redoNeeded&&!d.redoResolved){
    openRedoPicker(loser,redoable);
    return;
  }
  if(!iAmLoser&&redoNeeded&&!d.redoResolved){
    toast(`En attente du choix de ${loser.name}…`);
    return;
  }
  document.getElementById('modal-duel').classList.remove('open');
  if(myId===d.atkId){gs.duel=null;endTurn();}
}
function openRedoPicker(loser,redoable){
  document.getElementById('redo-list').innerHTML=redoable.map(o=>{
    const m=MISSION_POOL[o.mi];
    return `<button class="m-close" style="width:100%;text-align:left;margin-bottom:8px" onclick="confirmRedo(${o.pos})">${m.title} — 📍${m.dest}</button>`;
  }).join('');
  document.getElementById('modal-redo').classList.add('open');
}
function confirmRedo(pos){
  const d=gs.duel;if(!d)return;
  const loser=gs.players.find(pl=>pl.id===d.loserId);
  if(loser){
    loser.doneMask[pos]=false;
    loser.missionsWon=Math.max(0,(loser.missionsWon||0)-1);
    addLog(`🔁 ${loser.name} doit refaire une mission après sa défaite en duel.`,'du');
  }
  d.redoResolved=true;
  document.getElementById('modal-redo').classList.remove('open');
  broadcast({type:'state',gs});
  closeDuelModal();
}
function syncDuelModal(){
  const modal=document.getElementById('modal-duel');
  const d=gs?.duel;
  if(!d){modal.classList.remove('open');return;}
  const atk=gs.players.find(p=>p.id===d.atkId),def=gs.players.find(p=>p.id===d.defId);
  if(!atk||!def){gs.duel=null;modal.classList.remove('open');return;}
  modal.classList.add('open');
  document.getElementById('duel-title').textContent=`${atk.name} défie ${def.name} !`;
  document.getElementById('da-name').textContent=atk.name+' ⚔️';
  document.getElementById('da-sub').textContent=`Bonus : +${PRIME_BONUS[atk.prime]}`;
  document.getElementById('dd-name').textContent=def.name+' 🛡️'+(d.defPenalty?` (🔭 -${d.defPenalty})`:'');
  document.getElementById('dd-sub').textContent=`Bonus : +${PRIME_BONUS[def.prime]}${d.defPenalty?` − ${d.defPenalty} 🔭`:''}`;
  document.getElementById('da1').textContent=d.atk?d.atk.d1:'?';
  document.getElementById('da2').textContent=d.atk?d.atk.d2:'?';
  document.getElementById('da-total').textContent=d.atk?`Total : ${d.atk.total}`:'';
  document.getElementById('dd1').textContent=d.def?d.def.d1:'?';
  document.getElementById('dd2').textContent=d.def?d.def.d2:'?';
  document.getElementById('dd-total').textContent=d.def?`Total : ${d.def.total}`:'';
  renderDuelCardButtons(d);
  const btn=document.getElementById('duel-btn');
  const body=document.getElementById('duel-body');
  if(d.phase==='atk'){
    if(myId===d.atkId){body.textContent='À toi de lancer (attaquant) !';btn.textContent='🎲 ATTAQUANT LANCE';btn.disabled=false;btn.onclick=duelRoll;}
    else{body.textContent=`En attente du lancer de ${atk.name} (attaquant)…`;btn.textContent='⏳ EN ATTENTE…';btn.disabled=true;btn.onclick=null;}
  }else if(d.phase==='def'){
    if(myId===d.defId){body.textContent='À toi de lancer (défenseur) !';btn.textContent='🎲 DÉFENSEUR LANCE';btn.disabled=false;btn.onclick=duelRoll;}
    else{body.textContent=`En attente du lancer de ${def.name} (défenseur)…`;btn.textContent='⏳ EN ATTENTE…';btn.disabled=true;btn.onclick=null;}
  }else{
    body.textContent=d.resultText||'';
    const loser=gs.players.find(pl=>pl.id===d.loserId);
    const redoable=loser?(loser.missionOrder||[]).map((mi,pos)=>({pos,mi})).filter(o=>loser.doneMask&&loser.doneMask[o.pos]):[];
    const redoNeeded=redoable.length>0&&!d.redoResolved;
    const iAmLoser=myId===d.loserId;
    if(redoNeeded&&!iAmLoser){
      btn.textContent=`⏳ ${loser.name} CHOISIT SA MISSION À REFAIRE…`;btn.disabled=true;btn.onclick=null;
    }else{
      btn.textContent=(redoNeeded&&iAmLoser)?'🔁 CHOISIR UNE MISSION À REFAIRE':'FERMER';
      btn.disabled=false;btn.onclick=closeDuelModal;
    }
  }
}
