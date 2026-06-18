// ============================================================
// helpers.js — Petites fonctions utilitaires partagées par tous
// les autres modules (joueur courant, missions en attente,
// journal, modales génériques…). Aucune logique de jeu ici.
// ============================================================

function me(){return gs?.players.find(p=>p.id===myId);}
function cur(){return gs?.players[gs.turnIdx];}
function isMyTurn(){return cur()?.id===myId;}
// Missions réalisables dans l'ordre choisi par le joueur (plus de séquence imposée)
function pendingMissions(p){
  if(!p||!p.missionOrder)return[];
  return p.missionOrder.map((mi,pos)=>({pos,mi,m:MISSION_POOL[mi]})).filter(o=>!(p.doneMask&&p.doneMask[o.pos]));
}
function missionsAt(p,label){return pendingMissions(p).filter(o=>o.m.dest===label);}
function allDone(p){return!!(p.doneMask&&p.doneMask.length&&p.doneMask.every(Boolean));}
function addLog(t,cls){gs.log.push({t,cls});if(gs.log.length>120)gs.log.shift();renderLog();}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._to);t._to=setTimeout(()=>t.classList.remove('show'),2800);}
function showModal(tag,title,body){document.getElementById('m-tag').textContent=tag;document.getElementById('m-title2').textContent=title;document.getElementById('m-body2').textContent=body;document.getElementById('modal').classList.add('open');}
// closeModal() gère l'enchaînement spécial des cartes Imprévu "Embuscade" : une fois
// l'annonce fermée, si chanceBlockArmed est levé, on bascule en sélection manuelle de
// case (voir blocking.js) AVANT de terminer le tour — le tour ne se termine qu'après le clic.
function closeModal(){
  document.getElementById('modal').classList.remove('open');
  if(chanceBlockArmed){chanceBlockArmed=false;startChanceBlockMode();return;}
  if(landingEndsTurn){landingEndsTurn=false;endTurn();}
}
function ntl(t){return{n:'case',c:'hasard',s:'magasin',T:'gare',q:'quête',B:'Banque',m:'ville'}[t]||t;}
