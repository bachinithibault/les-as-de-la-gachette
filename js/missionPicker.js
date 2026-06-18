// ============================================================
// missionPicker.js — Pioche de 5 missions face cachée (dont 1
// difficile obligatoire) + démarrage de la partie.
// ============================================================

function drawFive(){
  // Exactement 1 mission difficile (HARD_IDX) + 4 missions normales (jamais une 2e difficile).
  // De plus, les 5 missions tirées doivent toutes avoir une destination (dest) différente —
  // si une mission normale tirée partage sa dest avec une déjà retenue, on la rejette et on
  // retire la suivante du paquet mélangé, jusqu'à obtenir 4 dest distinctes (et différentes
  // de celle de la mission difficile).
  const hard=HARD_IDX[Math.floor(Math.random()*HARD_IDX.length)];
  const usedDests=new Set([MISSION_POOL[hard].dest]);
  const restPool=[...Array(MISSION_POOL.length).keys()].filter(i=>!HARD_IDX.includes(i));
  const shuffled=restPool.sort(()=>Math.random()-.5);
  const chosen=[];
  for(const i of shuffled){
    if(chosen.length>=4)break;
    const d=MISSION_POOL[i].dest;
    if(usedDests.has(d))continue;
    usedDests.add(d);chosen.push(i);
  }
  return [hard,...chosen].sort(()=>Math.random()-.5);
}
function initMissionPicker(){
  gs.players.forEach(p=>{if(p.isBot){p.missionOrder=drawFive();p.doneMask=[false,false,false,false,false];}});
  gs.phase='picker';broadcast({type:'state',gs});showPicker();
}
function showPicker(){
  ['lobby','game','endscreen'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById('mission-picker').classList.add('active');
  const p=me();
  if(p&&(!p.missionOrder||!p.missionOrder.length)){p.missionOrder=drawFive();p.doneMask=[false,false,false,false,false];}
  drawSlots=p?p.missionOrder.slice():[];flippedCount=0;
  renderFlipGrid();
}
function renderFlipGrid(){
  document.getElementById('flip-grid').innerHTML=drawSlots.map((mi,i)=>{
    const m=MISSION_POOL[mi],isHard=HARD_IDX.includes(mi);
    return `<div class="flipcard" id="fc-${i}" onclick="flipCard(${i})">
      <div class="flipcard-inner">
        <div class="flipface back"><div class="fc-skull">🂠</div></div>
        <div class="flipface front ${isHard?'hard':''}">
          <div class="fc-title">${m.title}</div>
          <div class="fc-dest">📍 ${m.dest}</div>
          <div class="fc-score">Score min : ${m.minScore}${m.two?' ⭐⭐':''}</div>
          <div class="fc-reward">+${m.reward}$</div>
          ${isHard?'<div class="fc-hardtag">MISSION DIFFICILE</div>':''}
        </div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('picker-confirm').style.display='none';
}
function flipCard(i){
  const el=document.getElementById('fc-'+i);if(!el||el.classList.contains('flipped'))return;
  el.classList.add('flipped');flippedCount++;
  if(flippedCount>=drawSlots.length)document.getElementById('picker-confirm').style.display='block';
}
function confirmMissions(){
  if(flippedCount<drawSlots.length){toast('Retourne toutes tes cartes avant de continuer !');return;}
  const p=me();p.missionOrder=drawSlots.slice();p.doneMask=[false,false,false,false,false];
  document.getElementById('picker-confirm').style.display='none';
  if(botMode){startGame();return;}
  // Multijoueur réel : on diffuse son propre choix de missions (pas un état complet)
  // pour ne jamais écraser le choix d'un autre joueur qui n'aurait pas encore été reçu.
  broadcast({type:'missionPick',id:myId,missionOrder:p.missionOrder,doneMask:p.doneMask});
  document.getElementById('picker-sub').textContent='Missions choisies — en attente des autres joueurs…';
  if(isHost)tryStartIfAllReady();
}
// Démarre la partie seulement quand TOUS les joueurs (humains + bots) ont choisi leurs missions —
// évite que le premier qui confirme écrase le choix des autres en lançant la partie trop tôt.
function tryStartIfAllReady(){
  if(!isHost)return;
  if(gs.players.every(p=>p.missionOrder&&p.missionOrder.length))startGame();
}
function startGame(){
  gs.players.forEach(p=>{p.nodeId=bankId();});
  gs.phase='game';gs.turnIdx=0;gs.log=[{t:'⚡ La partie commence !',cls:'ev'}];gs.blocked={};
  gs.shopStock=Object.fromEntries(SHOP_CARDS.map(c=>[c.id,SHOP_STOCK_PER_CARD]));
  broadcast({type:'state',gs});showGame();maybeBotTurn();
}
function showGame(){
  ['lobby','mission-picker','endscreen'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById('game').classList.add('active');playBgm();lastTurnSoundIdx=-1;renderAll();
}
