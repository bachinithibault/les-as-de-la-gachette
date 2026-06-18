// ============================================================
// blocking.js — Blocage manuel de case : soit via une carte Blocage
// achetée en magasin (blockModeSource='shop'), soit forcé par une
// carte Imprévu "Embuscade" (blockModeSource='chance'). Dans les
// deux cas c'est TOUJOURS le joueur qui choisit la case à la souris
// — botAutoBlock() ne sert qu'aux bots, qui n'ont pas d'interface.
// ============================================================

function startBlockMode(){
  const p=me();if(!p||(p.blockCards||0)<=0)return;
  blockMode=true;blockModeSource='shop';
  document.getElementById('block-hint').textContent='Clique sur une case du plateau (hors ville et banque) pour la bloquer…';
  document.getElementById('block-hint').style.display='block';
  document.getElementById('cv').classList.add('blockmode');
  updateBtns();drawBoard();
}
function startChanceBlockMode(){
  blockMode=true;blockModeSource='chance';
  document.getElementById('block-hint').textContent='🃏 Embuscade ! Clique sur une case du plateau (hors ville et banque) pour la bloquer 2 tours…';
  document.getElementById('block-hint').style.display='block';
  document.getElementById('cv').classList.add('blockmode');
  updateBtns();drawBoard();
}
function applyBlock(nid){
  const p=me();if(!p)return;
  if(blockModeSource==='shop'){
    if((p.blockCards||0)<=0){blockMode=false;return;}
    p.blockCards--;
  }
  if(!gs.blocked)gs.blocked={};
  gs.blocked[nid]=BLOCK_DURATION;
  blockMode=false;
  document.getElementById('block-hint').style.display='none';
  document.getElementById('cv').classList.remove('blockmode');
  const n=nodes[nid];
  addLog(`🚧 ${p.name} bloque la case ${n.label||ntl(n.type)} pour ${BLOCK_DURATION} tours`,'ev');
  broadcast({type:'state',gs});updateBtns();drawBoard();renderAll();
  if(blockModeSource==='chance'){
    const endNow=chanceBlockEndsTurn;chanceBlockEndsTurn=false;blockModeSource=null;
    if(endNow)endTurn();
  }else{
    blockModeSource=null;
  }
}
function botAutoBlock(p){
  const opts=blockableNodes().filter(id=>!isBlocked(id));
  if(!opts.length)return;
  const nid=opts[Math.floor(Math.random()*opts.length)];
  if(!gs.blocked)gs.blocked={};
  gs.blocked[nid]=BLOCK_DURATION;
  const n=nodes[nid];
  addLog(`🤖 ${p.name} bloque la case ${n.label||ntl(n.type)} pour ${BLOCK_DURATION} tours`,'ev');
}
