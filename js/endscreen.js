// ============================================================
// endscreen.js — Écran de fin de partie + retour à la plateforme.
// ============================================================

function showEndScreen(){
  stopBgm();
  ['lobby','mission-picker','game'].forEach(id=>document.getElementById(id).classList.remove('active'));
  document.getElementById('endscreen').classList.add('active');
  const ranked=[...gs.players].sort((a,b)=>b.money-a.money);
  document.getElementById('end-table').innerHTML=ranked.map((p,i)=>`
    <div class="end-row ${i===0?'first':''}">
      <div class="end-rank">#${i+1}</div>
      <div class="pdot" style="background:${p.color}"></div>
      <div class="end-name">${p.name}${p.isBot?' 🤖':''}</div>
      <div class="end-missions">${p.missionsWon||0} mission(s)</div>
      <div class="end-money">${p.money}$</div>
    </div>`).join('');
}
function returnToLobby(){
  document.getElementById('endscreen').classList.remove('active');
  document.getElementById('lobby').classList.add('active');
  document.getElementById('box-main').style.display='block';
  document.getElementById('box-wait').style.display='none';
  gs=null;myId=null;roomCode=null;botMode=false;isHost=false;
  if(peer){try{peer.destroy();}catch(e){}peer=null;}
  conns=[];hostConn=null;
  hasRolled=false;stepsLeft=0;movableSet=new Set();blockMode=false;trainMode=false;
  initProfileUI();
}
