// ============================================================
// chance.js — Cartes Imprévu (CHANCE_POOL, voir data.js).
// Les cartes "Embuscade" (type 'amb') forcent un blocage de case :
// c'est TOUJOURS le joueur concerné qui choisit la case (jamais
// un tirage aléatoire) — sauf pour les bots, qui n'ont pas
// d'interface de clic et choisissent donc au hasard (botAutoBlock).
// ============================================================

function doChance(p,nid,isFinal){
  landingEndsTurn=!!isFinal;
  const c=CHANCE_POOL[Math.floor(Math.random()*CHANCE_POOL.length)];
  if(p.hasSheriff&&c.type==='amb'){addLog(`🛡️ ${p.name} shérif — embuscade ignorée`,'ev');if(isFinal)endTurn();return;}
  c.fx(p,nid);
  addLog(`🃏 ${p.name} : "${c.title}"`,c.type==='good'?'ev':c.type==='amb'?'du':'');
  if(c.type==='amb'){
    if(p.isBot){
      botAutoBlock(p);
    }else{
      // On enchaînera sur la sélection manuelle de case juste après la fermeture de cette
      // modale d'annonce (voir closeModal() dans helpers.js et startChanceBlockMode() dans blocking.js).
      chanceBlockArmed=true;chanceBlockEndsTurn=landingEndsTurn;landingEndsTurn=false;
    }
  }
  showModal(c.tag,c.title,c.body);
}
