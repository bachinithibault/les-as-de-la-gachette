// ============================================================
// movement.js — Lancer de dés, clic sur le plateau, déplacement.
// ============================================================

function rollDice(){
  if(!isMyTurn()||hasRolled)return;
  // Échec de mission en attente : on ne propose la retentative (sans se déplacer,
  // voir openRetryChoice ci-dessous) que si le joueur est physiquement revenu sur la
  // case de cette mission. Sinon il a choisi de se déplacer à un tour précédent et
  // doit d'abord retourner sur la case pour pouvoir retenter (flux normal via landOn/
  // checkMissionLand) — la mission en échec reste en attente tant qu'il n'y est pas.
  if(me()?.failedMission&&isOnFailedMissionTile(me())){openRetryChoice();return;}
  rollMovementDice();
}
function isOnFailedMissionTile(p){
  if(p.failedPos==null||!p.missionOrder)return false;
  const mi=p.missionOrder[p.failedPos];if(mi==null)return false;
  const m=MISSION_POOL[mi];if(!m)return false;
  return nodes[p.nodeId]?.label===m.dest;
}
// Lancer de dés "normal" (déplacement). Extrait de rollDice() pour pouvoir être appelé
// soit directement (pas de mission en échec), soit via le choix "lance les dés" quand
// une mission en échec est en attente (voir openRetryChoice/chooseMoveInstead).
function rollMovementDice(){
  if(!isMyTurn()||hasRolled)return;
  const v1=Math.ceil(Math.random()*6),v2=Math.ceil(Math.random()*6);
  const d1=document.getElementById('d1'),d2=document.getElementById('d2');
  d1.classList.add('rolling');d2.classList.add('rolling');
  setTimeout(()=>{
    d1.classList.remove('rolling');d2.classList.remove('rolling');
    d1.textContent=v1;d2.textContent=v2;
    // Carte Selle (permanente, cumulable) : +1 par exemplaire au total des dés de déplacement.
    const total=v1+v2+(me()?.hasGun?2:0)+(me()?.selleCount||0);
    document.getElementById('dice-res').textContent=`= ${total}`;
    hasRolled=true;stepsLeft=total;
    movableSet=reachable(me().nodeId,stepsLeft);
    updSteps();addLog(`🎲 ${me().name} lance ${v1}+${v2}=${total}`,'me2');
    broadcast({type:'state',gs});updateBtns();drawBoard();
  },430);
}
function openMissionRetry(){
  hasRolled=true;const p=me();const pos=p.failedPos;
  if(pos==null||!p.missionOrder||p.missionOrder[pos]==null)return;
  const m=MISSION_POOL[p.missionOrder[pos]];
  pendingMission={player:p,pos,isRetry:true};
  openMissionModal(m,'🔄 RETENTATIVE','🔄 RETENTE LA MISSION');
}
// Choix en début de tour quand une mission a échoué au tour précédent (voir data.js/
// missions.js pour p.failedMission/p.failedPos) : soit on retente la mission (flux
// inchangé, openMissionRetry), soit on lance les dés et on se déplace normalement sans
// y toucher ce tour-ci (rollMovementDice) — la mission en échec reste en attente pour
// un tour ultérieur dans ce cas, p.failedMission/p.failedPos ne sont PAS modifiés.
function openRetryChoice(){
  if(!isMyTurn()||hasRolled)return;
  document.getElementById('modal-retrychoice').classList.add('open');
}
function chooseRetryMission(){
  document.getElementById('modal-retrychoice').classList.remove('open');
  openMissionRetry();
}
function chooseMoveInstead(){
  document.getElementById('modal-retrychoice').classList.remove('open');
  rollMovementDice();
}
document.getElementById('cv').addEventListener('click',function(e){
  const rect=this.getBoundingClientRect();
  // Le canvas est dessiné à la résolution BW×BH mais affiché à une taille CSS responsive
  // (voir #cv en CSS) : on remet les coordonnées du clic à l'échelle du plateau réel.
  const scaleX=BW/rect.width,scaleY=BH/rect.height;
  const cx=(e.clientX-rect.left)*scaleX,cy=(e.clientY-rect.top)*scaleY;
  let best=null,bd=9999;
  for(const n of nodes){const d=Math.hypot(n.x-cx,n.y-cy);if(d<bd){bd=d;best=n;}}
  if(trainMode){
    if(!best||bd>55||best.type!=='T'||best.id===me().nodeId){toast('Clique sur une autre gare 🚂 !');return;}
    takeTrain(best.id);
    return;
  }
  if(blockMode){
    if(!best||bd>55){toast('Clique sur une case du plateau !');return;}
    if(best.type==='m'||best.type==='B'){toast('Les villes et la banque ne peuvent pas être bloquées !');return;}
    applyBlock(best.id);
    return;
  }
  // gs.duel : un duel en cours (y compris déclenché en pleine résolution de déplacement,
  // voir duel.js openDuelModal) bloque tout déplacement supplémentaire pour ce tour.
  if(!isMyTurn()||!hasRolled||stepsLeft<=0||gs.duel)return;
  if(!best||bd>55||!movableSet.has(best.id)){toast('Clique sur une case illuminée !');return;}
  const dist=bfsDist(me().nodeId,best.id);
  if(dist>stepsLeft||dist===Infinity){toast('Trop loin ou inaccessible !');return;}
  moveTo(best.id,dist);
});
function moveTo(nodeId,distUsed){
  const p=me();
  const path=bfsPath(p.nodeId,nodeId,distUsed)||[];
  p.nodeId=nodeId;stepsLeft-=distUsed;
  const node=nodes[nodeId];
  addLog(`📍 ${p.name} → ${node.label||ntl(node.type)} (${stepsLeft} restants)`,'me2');
  // path[0] est la case de départ (celle où le joueur se trouvait déjà, par ex. après avoir
  // fini son tour précédent sur une case chance) — on ne la compte jamais comme "traversée",
  // sinon le joueur repiocherait une carte chance juste en quittant la case où il était déjà.
  for(let i=1;i<path.length;i++){
    const vid=path[i];
    if(vid===nodeId)continue;
    const vn=nodes[vid];if(vn.type==='c')doChance(p,vid);
  }
  landOn(p,node);
  if(stepsLeft>0)movableSet=reachable(p.nodeId,stepsLeft);
  else movableSet=new Set();
  updSteps();broadcast({type:'state',gs});updateBtns();drawBoard();
}
function landOn(p,node){
  if(node.type==='c')doChance(p,node.id,true);
  else if(node.type==='s')openShopModal();
  else if(node.type==='m')checkMissionLand(p,node);
  else if(node.type==='B')checkHeist(p);
  else if(node.type==='q')doQuest(p,node);
}
