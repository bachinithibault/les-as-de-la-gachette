// ============================================================
// missions.js — Atterrissage sur une ville, choix de mission,
// lancer de mission/braquage, intégration Revolver + Trèfle.
// ============================================================

// Contexte de la modale mission actuellement ouverte (pour le texte et les boutons de cartes).
let mmCurrentM=null,mmIsHeist=false;

function checkMissionLand(p,node){
  const cands=missionsAt(p,node.label);
  if(!cands.length)return;
  if(cands.length===1){
    pendingMission={player:p,pos:cands[0].pos,isRetry:false};
    openMissionModal(cands[0].m,'🎯 TENTATIVE DE MISSION','🎲 LANCER POUR LA MISSION');
  }else{
    showMissionChoice(p,cands);
  }
}
function showMissionChoice(p,cands){
  document.getElementById('mch-list').innerHTML=cands.map(o=>
    `<button class="m-close" style="width:100%;text-align:left;margin-bottom:8px" onclick="pickMission(${o.pos})">${o.m.title} — min. ${o.m.minScore} — +${o.m.reward}$${o.m.two?' ⭐⭐':''}</button>`
  ).join('');
  document.getElementById('modal-mischoice').classList.add('open');
}
function pickMission(pos){
  document.getElementById('modal-mischoice').classList.remove('open');
  const p=me();const m=MISSION_POOL[p.missionOrder[pos]];
  pendingMission={player:p,pos,isRetry:false};
  openMissionModal(m,'🎯 TENTATIVE DE MISSION','🎲 LANCER POUR LA MISSION');
}
function openMissionModal(m,tag,btnTxt){
  pendingRevolverBonus=0;pendingTrefleActive=false;mmCurrentM=m;mmIsHeist=false;
  document.getElementById('mm-tag').textContent=tag;
  document.getElementById('mm-title').textContent=m.title;
  updMissionBody();
  document.getElementById('mm-d1').textContent='?';document.getElementById('mm-d2').textContent='?';
  document.getElementById('mm-result').textContent='';
  renderMissionCardButtons();
  const btn=document.getElementById('mm-btn');
  btn.textContent=btnTxt;btn.disabled=false;btn.onclick=rollMissionDice;
  document.getElementById('modal-mission').classList.add('open');
}
// Réaffiche le corps de la modale en tenant compte d'un éventuel Trèfle activé (-1 score min).
function updMissionBody(){
  if(!mmCurrentM)return;
  const eff=mmCurrentM.minScore-(pendingTrefleActive?1:0);
  const bp=pendingMission?pendingMission.player:null;
  const primeBonus=bp?PRIME_BONUS[bp.prime]:0;
  document.getElementById('mm-body').textContent=`${mmCurrentM.body}\nBonus de Prime : +${primeBonus}\nScore minimum : ${eff}${pendingTrefleActive?' (🍀 -1)':''}${mmCurrentM.two?'\n⭐⭐ Réussite = +2 niveaux !':''}`;
}
// Boutons d'utilisation de cartes dans la modale mission/braquage (Revolver toujours possible,
// Trèfle interdit pendant un braquage — voir SHOP_CARDS.trefle.desc : "pas la banque").
function renderMissionCardButtons(){
  const p=me();const box=document.getElementById('mm-cards');if(!p||!box)return;
  const parts=[];
  if((p.revolverCount||0)>0&&pendingRevolverBonus===0){
    parts.push(`<button class="m-close" style="width:48%;margin-right:4%;font-size:8px" onclick="useMissionRevolver(1)">🔫 Revolver +1 (${p.revolverCount})</button>`);
    parts.push(`<button class="m-close" style="width:48%;font-size:8px" onclick="useMissionRevolver(2)">🔫 Revolver +2 (${p.revolverCount})</button>`);
  }else if(pendingRevolverBonus>0){
    parts.push(`<div class="mc-reward">🔫 Revolver activé : +${pendingRevolverBonus}</div>`);
  }
  if(!mmIsHeist){
    if((p.trefleCount||0)>0&&!pendingTrefleActive){
      parts.push(`<button class="m-close" style="width:100%;margin-top:6px;font-size:8px" onclick="useMissionTrefle()">🍀 Trèfle : -1 score min, +50$ si réussite (${p.trefleCount})</button>`);
    }else if(pendingTrefleActive){
      parts.push(`<div class="mc-reward">🍀 Trèfle activé</div>`);
    }
  }
  box.innerHTML=parts.join('');
}
function useMissionRevolver(bonus){
  const p=me();if(!p||(p.revolverCount||0)<=0||pendingRevolverBonus>0)return;
  p.revolverCount--;pendingRevolverBonus=bonus;
  addLog(`🔫 ${p.name} utilise un Revolver (+${bonus})`,'ev');
  renderMissionCardButtons();
}
function useMissionTrefle(){
  const p=me();if(!p||(p.trefleCount||0)<=0||pendingTrefleActive||mmIsHeist)return;
  p.trefleCount--;pendingTrefleActive=true;
  addLog(`🍀 ${p.name} utilise un Trèfle`,'ev');
  updMissionBody();renderMissionCardButtons();
}
function rollMissionDice(){
  const btn=document.getElementById('mm-btn');btn.disabled=true;
  const d1=document.getElementById('mm-d1'),d2=document.getElementById('mm-d2');
  d1.classList.add('rolling');d2.classList.add('rolling');
  const revBonus=pendingRevolverBonus,trefleOn=pendingTrefleActive;
  setTimeout(()=>{
    d1.classList.remove('rolling');d2.classList.remove('rolling');
    const v1=Math.ceil(Math.random()*6),v2=Math.ceil(Math.random()*6),base=v1+v2;
    const bp=pendingMission?pendingMission.player:null;
    const primeBonus=bp?PRIME_BONUS[bp.prime]:0;
    const total=base+primeBonus+revBonus;
    d1.textContent=v1;d2.textContent=v2;
    const bonusTxt=[primeBonus?`+${primeBonus}`:'',revBonus?`+${revBonus}🔫`:''].filter(Boolean).join('');
    document.getElementById('mm-result').textContent=bonusTxt?`= ${base}${bonusTxt} = ${total}`:`= ${total}`;
    pendingRevolverBonus=0;pendingTrefleActive=false;

    if(pendingMission){
      const{player:p,pos,isRetry}=pendingMission;pendingMission=null;
      const m=MISSION_POOL[p.missionOrder[pos]];
      const effMin=m.minScore-(trefleOn?1:0);
      if(total>=effMin){
        const reward=m.reward+(trefleOn?50:0);
        p.money+=reward;p.missionsWon++;p.failedMission=false;p.failedPos=null;
        const lv=m.two?2:1;p.prime=Math.min(4,p.prime+lv);p.doneMask[pos]=true;
        addLog(`⭐ ${p.name} : "${m.title}" réussie (${total}/${effMin}) +${reward}$${m.two?' +2niv':''}${trefleOn?' 🍀':''}!`,'ev');
        document.getElementById('mm-body').textContent=`Score : ${total} ≥ ${effMin} ✅\n+${reward}$\nPrime : ${PRIME_NAMES[p.prime]}`+(isRetry?'\nTu peux maintenant jouer ton tour normalement.':'');
        document.getElementById('mm-cards').innerHTML='';
        btn.textContent=isRetry?'✅ RÉUSSIE — JOUER MON TOUR':'✅ RÉUSSIE — FERMER';
        btn.disabled=false;
        btn.onclick=()=>{
          document.getElementById('modal-mission').classList.remove('open');
          if(isRetry){hasRolled=false;stepsLeft=0;movableSet=new Set();}
          broadcast({type:'state',gs});renderAll();
        };
      }else{
        p.failedMission=true;p.failedPos=pos;
        addLog(`❌ ${p.name} : "${m.title}" échouée (${total}/${effMin}) — tour terminé`,'');
        document.getElementById('mm-body').textContent=`Score : ${total} < ${effMin} ❌\nÉchec — ton tour se termine ici. Retente au prochain tour !`;
        document.getElementById('mm-cards').innerHTML='';
        btn.textContent='❌ ÉCHEC — FERMER';
        btn.disabled=false;
        btn.onclick=()=>{document.getElementById('modal-mission').classList.remove('open');broadcast({type:'state',gs});endTurn();};
      }
    }
    if(pendingHeist){
      const{player:p}=pendingHeist;pendingHeist=null;
      const heistTotal=base+revBonus;
      if(heistTotal>=9){
        p.money+=1000;addLog(`🎉 BRAQUAGE RÉUSSI par ${p.name} !`,'ev');gs.phase='finished';
        document.getElementById('mm-body').textContent=`Score : ${heistTotal} ≥ 9 ✅\n+1000$\nFin de partie !`;btn.textContent='🏆 VICTOIRE !';
        document.getElementById('mm-cards').innerHTML='';
        btn.disabled=false;btn.onclick=()=>{document.getElementById('modal-mission').classList.remove('open');broadcast({type:'state',gs});showEndScreen();};
      }else{
        addLog(`💥 Braquage échoué (${heistTotal}/9)`,'du');
        document.getElementById('mm-body').textContent=`Score : ${heistTotal} < 9 ❌`;btn.textContent='💥 RATÉ — FERMER';
        document.getElementById('mm-cards').innerHTML='';
        btn.disabled=false;btn.onclick=()=>{document.getElementById('modal-mission').classList.remove('open');broadcast({type:'state',gs});endTurn();};
      }
    }
  },430);
}
function checkHeist(p){
  if(!allDone(p)||p.money<1000){
    if(!allDone(p))addLog(`🏦 ${p.name} passe par la Banque.`,'');
    else addLog(`🏦 ${p.name} a accompli ses missions mais n'a pas assez d'argent pour le braquage (${p.money}$/1000$).`,'');
    endTurn();
    return;
  }
  pendingHeist={player:p};
  pendingRevolverBonus=0;pendingTrefleActive=false;mmCurrentM=null;mmIsHeist=true;
  document.getElementById('mm-tag').textContent='🏦 BRAQUAGE !';
  document.getElementById('mm-title').textContent='BANQUE FÉDÉRALE';
  document.getElementById('mm-body').textContent='Toutes tes missions accomplies !\nScore minimum : 9 — aucun bonus.';
  document.getElementById('mm-d1').textContent='?';document.getElementById('mm-d2').textContent='?';
  document.getElementById('mm-result').textContent='';
  renderMissionCardButtons();
  const btn=document.getElementById('mm-btn');btn.textContent='🎲 TENTER LE BRAQUAGE';btn.disabled=false;btn.onclick=rollMissionDice;
  document.getElementById('modal-mission').classList.add('open');
}
