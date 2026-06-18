// ============================================================
// state.js — Variables globales mutables partagées par tous les
// modules (scripts classiques, même portée globale) + mkPlayer.
// ============================================================

let myId=null,roomCode=null,gs=null,channel=null;
let stepsLeft=0,movableSet=new Set(),hasRolled=false,botMode=false,landingEndsTurn=false;
let pendingMission=null,pendingHeist=null;
let drawSlots=[],flippedCount=0;
let blockMode=false,blockModeSource=null;
let trainMode=false,muted=false;
let lastTurnSoundIdx=-1;
// Carte Imprevu "Embuscade" tiree par un joueur humain : il choisit lui-meme la case a
// bloquer apres avoir ferme la modale d'annonce (au lieu d'un tirage aleatoire).
// chanceBlockArmed : la modale d'annonce vient de se fermer, on doit enchainer sur le mode
// selection manuelle de case. chanceBlockEndsTurn : faut-il terminer le tour une fois la case
// choisie (= la case Imprevu etait la case d'arrivee, pas une case traversee en chemin).
let chanceBlockArmed=false,chanceBlockEndsTurn=false;
// Magasin : selection en cours dans la modale, avant validation de l'achat. {cardId:quantite}
let shopSelection={};
// Carte Revolver / Trefle : activee par le joueur AVANT de lancer les des d'une mission ou
// d'un duel (boutons dans la modale concernee). Remise a zero apres chaque lancer resolu.
let pendingRevolverBonus=0,pendingTrefleActive=false;
// Idem cote duel : chaque camp (attaquant/defenseur) choisit son propre bonus Revolver sur
// SON propre ecran juste avant de lancer ses des (l'etat du duel, lui, est partage via gs.duel).
let duelRevolverBonus=0;

function mkPlayer(id,name,idx){
  return{id,name,color:COLORS[idx%COLORS.length],money:200,prime:0,
    nodeId:bankId(),missionsWon:0,missionOrder:[],doneMask:[],failedPos:null,
    deaths:0,trainUses:0,hasSheriff:false,hasGun:false,isBot:false,failedMission:false,
    blockCards:0,buysThisTurn:0,questsClaimed:[],
    revolverCount:0,
    trefleCount:0,
    selleCount:0,
    hasFusil:false,
    hasOmbre:false};
}
