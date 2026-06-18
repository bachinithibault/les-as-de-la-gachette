// ============================================================
// render.js — Tout ce qui peint l'état du jeu dans le DOM (HUD,
// tour, carte mission, scores, journal, état des boutons).
// Le rendu du plateau lui-même est dans drawboard.js.
// ============================================================

function renderAll(){
  if(!gs||gs.phase!=='game')return;
  renderHUD();renderTurn();renderMissionCard();renderLog();renderScores();updateBtns();drawBoard();syncDuelModal();
}
function renderHUD(){
  document.getElementById('hud').innerHTML=gs.players.map(p=>`
    <div class="hud-card ${p.id===myId?'me':''}">
      <div class="pdot" style="background:${p.color};width:9px;height:9px;border-radius:50%"></div>
      <span>${p.name}</span><span class="hud-prime">${PRIME_NAMES[p.prime]}</span>
      <span class="hud-money">${p.money}$</span>
    </div>`).join('');
}
function renderTurn(){
  const b=document.getElementById('turn-banner'),c=cur();if(!c)return;
  if(isMyTurn()){
    b.className='turn-banner mine';b.textContent='🎯 C\'EST TON TOUR !';
    if(lastTurnSoundIdx!==gs.turnIdx){lastTurnSoundIdx=gs.turnIdx;gunshot();}
  }else{b.className='turn-banner other';b.textContent=`⏳ Tour de ${c.name}…`;}
}
function renderMissionCard(){
  const p=me();if(!p)return;
  const pend=pendingMissions(p);
  if(!pend.length){
    document.getElementById('mc-order').textContent='MISSION FINALE';
    document.getElementById('mc-title').textContent='Braque la Banque !';
    document.getElementById('mc-body').innerHTML='Toutes tes missions sont accomplies.';
    document.getElementById('mc-dest').textContent='🏦 Rends-toi à la BANQUE FÉDÉRALE';
    document.getElementById('mc-reward').textContent='Score min : 9 aux dés';
    document.getElementById('mc-retry').textContent='';
    return;
  }
  document.getElementById('mc-order').textContent=`${pend.length} MISSION${pend.length>1?'S':''} — ORDRE LIBRE`;
  document.getElementById('mc-title').textContent='Choisis ta route !';
  document.getElementById('mc-body').innerHTML=pend.map(o=>
    `<div style="margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid rgba(186,117,23,.18)">
      <b>${o.m.title}</b>${p.failedMission&&p.failedPos===o.pos?' <span class="mc-retry">⚠️ retente !</span>':''}<br>
      <span class="mc-dest">📍 ${o.m.dest}</span> · min ${o.m.minScore} · <span class="mc-reward">+${o.m.reward}$${o.m.two?' ⭐⭐':''}</span>
    </div>`
  ).join('');
  document.getElementById('mc-dest').textContent='';
  document.getElementById('mc-reward').textContent='';
  document.getElementById('mc-retry').textContent='';
}
function renderScores(){
  document.getElementById('scores-content').innerHTML=gs.players.map(p=>{
    const boxes=Array.from({length:5},(_,i)=>{
      if(p.doneMask&&p.doneMask[i])return'<div class="sp-m done"></div>';
      if(p.failedMission&&p.failedPos===i)return'<div class="sp-m current"></div>';
      return'<div class="sp-m"></div>';
    }).join('');
    return`<div class="sp-player">
      <div class="sp-name" style="color:${p.color}">${p.name}${p.isBot?' 🤖':''}</div>
      <div class="sp-row">Prime : <span>${PRIME_NAMES[p.prime]}</span></div>
      <div class="sp-row">Argent : <span style="color:var(--green)">${p.money}$</span></div>
      <div class="sp-row">Missions :</div><div class="sp-missions">${boxes}</div>
      <div class="sp-row">Morts : <span>${p.deaths||0}</span></div>
      <div class="sp-row">Train : <span>${p.trainUses||0}/${MAX_TRAIN}</span></div>
      <div class="sp-row">🎴 Cartes bonus : <span>${(p.blockCards||0)+(p.revolverCount||0)+(p.trefleCount||0)+(p.selleCount||0)+(p.hasFusil?1:0)+(p.hasOmbre?1:0)}</span></div>
      ${p.hasSheriff?'<div class="sp-row" style="color:var(--cyan)">🛡️ Shérif</div>':''}
      ${p.hasGun?'<div class="sp-row" style="color:var(--yellow)">🔫 Armurier</div>':''}
    </div>`;
  }).join('');
}
function renderLog(){document.getElementById('log').innerHTML=[...gs.log].reverse().slice(0,60).map(e=>`<div class="log-entry ${e.cls||''}">${e.t}</div>`).join('');}
function updateBtns(){
  const my=isMyTurn();
  document.getElementById('roll-btn').disabled=!my||hasRolled;
  const onT=me()&&nodes[me().nodeId]?.type==='T';
  document.getElementById('btn-train').disabled=!my||!onT||(me()?.trainUses||0)>=MAX_TRAIN||blockMode||trainMode;
  // Portée de duel : graphe (bfsDist), pas seulement voisin direct — voir duelTargets() (board.js).
  // Exclut les joueurs (attaquant OU cible) actuellement sur une case mission ; la banque N'EST PAS exclue.
  const hasTarget=duelTargets(me()).length>0;
  document.getElementById('btn-duel').disabled=!my||!hasTarget||trainMode||blockMode||!!gs.duel;
  const myBlocks=me()?.blockCards||0;
  const bb=document.getElementById('btn-block');
  bb.textContent=`🚧 BLOQUER UNE CASE (${myBlocks})`;
  bb.disabled=!my||myBlocks<=0||blockMode||trainMode;
  document.getElementById('btn-end').disabled=!my||!hasRolled;
}
function updSteps(){document.getElementById('steps-left').textContent=stepsLeft>0?`${stepsLeft} pas — clique pour avancer`:'';}
