// ============================================================
// train.js — Voyage rapide entre gares (clic direct sur une gare
// du plateau, pas d'overlay opaque).
// ============================================================

function startTrainMode(){
  const p=me();if(!p)return;
  if(p.money<50){toast('Pas assez d\'argent (50$) !');return;}
  if((p.trainUses||0)>=MAX_TRAIN){toast('Plus de voyages en train disponibles !');return;}
  trainMode=true;blockMode=false;
  document.getElementById('train-hint').style.display='block';
  document.getElementById('block-hint').style.display='none';
  document.getElementById('cv').classList.add('trainmode');
  document.getElementById('cv').classList.remove('blockmode');
  updateBtns();drawBoard();
}
function cancelTrainMode(){
  trainMode=false;
  document.getElementById('train-hint').style.display='none';
  document.getElementById('cv').classList.remove('trainmode');
  updateBtns();drawBoard();
}
function takeTrain(destId){
  const p=me();if(!p)return;
  p.money=Math.max(0,p.money-50);p.trainUses++;p.nodeId=destId;
  stepsLeft=0;movableSet=new Set();trainMode=false;
  document.getElementById('train-hint').style.display='none';
  document.getElementById('cv').classList.remove('trainmode');
  addLog(`🚂 ${p.name} prend le train pour ${nodes[destId]?.label||'une autre gare'} (-50$)`,'ev');
  broadcast({type:'state',gs});renderAll();
}
