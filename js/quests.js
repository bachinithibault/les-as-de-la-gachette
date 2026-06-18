// ============================================================
// quests.js — Quêtes spéciales (impasses uniques de 3 cases),
// jouable une seule fois par joueur.
// ============================================================

function doQuest(p,node){
  landingEndsTurn=true;
  if(!p.questsClaimed)p.questsClaimed=[];
  if(p.questsClaimed.includes(node.label)){
    showModal('🚫 DÉJÀ FAIT',node.label,'Tu as déjà récupéré cette récompense — elle ne peut être obtenue qu\'une seule fois.');
    return;
  }
  if(node.label==='Trésor'){p.money+=500;p.questsClaimed.push(node.label);addLog(`💰 ${p.name} : Trésor ! +500$`,'ev');showModal('💰 TRÉSOR','Lingot d\'or !','Tu empoche 500 $');}
  else if(node.label==="École Shérif"){p.hasSheriff=true;p.questsClaimed.push(node.label);addLog(`🛡️ ${p.name} devient Shérif`,'ev');showModal('🛡️ SHÉRIF','Représentant de la loi !','Immunisé contre les embuscades.');}
  else if(node.label==='Armurier'){p.hasGun=true;p.questsClaimed.push(node.label);addLog(`🔫 ${p.name} : +2 bonus missions`,'ev');showModal('🔫 ARMURIER','Upgrade !','+2 permanent aux lancers de mission.');}
}
