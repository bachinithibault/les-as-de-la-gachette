// ============================================================
// endturn.js — Fin de tour : remise à zéro des états transitoires,
// décompte des blocages, passage au joueur suivant.
// ============================================================

function endTurn(){
  hasRolled=false;stepsLeft=0;movableSet=new Set();blockMode=false;trainMode=false;blockModeSource=null;
  document.getElementById('block-hint').style.display='none';
  document.getElementById('cv').classList.remove('blockmode');
  document.getElementById('train-hint').style.display='none';
  document.getElementById('cv').classList.remove('trainmode');
  document.getElementById('dice-res').textContent='';
  document.getElementById('steps-left').textContent='';
  document.getElementById('d1').textContent='?';document.getElementById('d2').textContent='?';
  if(gs.blocked)for(const k in gs.blocked){gs.blocked[k]--;if(gs.blocked[k]<=0)delete gs.blocked[k];}
  const p=cur();if(p)p.buysThisTurn=0;
  gs.turnIdx=(gs.turnIdx+1)%gs.players.length;
  broadcast({type:'state',gs});renderAll();maybeBotTurn();
}
