// ============================================================
// lobby.js — Création / connexion de salle, partie contre des bots.
// ============================================================

function createRoom(){
  const name=document.getElementById('inp-name').value.trim();
  if(!name){toast('Entre ton pseudo !');return;}
  roomCode=Math.random().toString(36).substr(2,6).toUpperCase();
  myId='p_'+Date.now();botMode=false;
  gs={phase:'lobby',players:[mkPlayer(myId,name,0)],turnIdx:0,log:[],blocked:{}};
  setupHostPeer(roomCode);
  document.getElementById('disp-code').textContent=roomCode;
  document.getElementById('box-main').style.display='none';
  document.getElementById('box-wait').style.display='block';
  renderLobby();
}
function joinRoom(){
  const name=document.getElementById('inp-name').value.trim();
  const code=document.getElementById('inp-code').value.trim().toUpperCase();
  if(!name||!code){toast('Remplis les champs !');return;}
  roomCode=code;myId='p_'+Date.now();botMode=false;
  gs={phase:'lobby',players:[mkPlayer(myId,name,0)],turnIdx:0,log:[],blocked:{}};
  setupGuestPeer(code,name);
  document.getElementById('disp-code').textContent=roomCode;
  document.getElementById('box-main').style.display='none';
  document.getElementById('box-wait').style.display='block';
  renderLobby();
}
function startVsBots(){
  const name=document.getElementById('inp-name').value.trim();
  if(!name){toast('Entre ton pseudo !');return;}
  const n=parseInt(document.getElementById('bot-count').value)||2;
  myId='p_'+Date.now();botMode=true;roomCode='LOCAL';
  gs={phase:'lobby',players:[mkPlayer(myId,name,0)],turnIdx:0,log:[],blocked:{}};
  for(let i=0;i<n;i++){const bp=mkPlayer('bot_'+i,BOT_NAMES[i%BOT_NAMES.length],i+1);bp.isBot=true;gs.players.push(bp);}
  initMissionPicker();
}
function renderLobby(){
  if(!gs)return;
  document.getElementById('wait-players').innerHTML=gs.players.map(p=>`<div class="pill"><div class="pdot" style="background:${p.color}"></div>${p.name}</div>`).join('');
  if(gs.players[0]?.id===myId)document.getElementById('start-btn').style.display='block';
}
