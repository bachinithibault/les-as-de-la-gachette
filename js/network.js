// ============================================================
// network.js — Multijoueur réel (WebRTC via PeerJS), fonctionne
// entre deux ordinateurs différents.
// ============================================================

let peer=null,conns=[],isHost=false,hostConn=null;
function setupHostPeer(code){
  isHost=true;
  console.log('[net] host: creating peer id=gachette-'+code);
  peer=new Peer('gachette-'+code);
  peer.on('open',(id)=>{console.log('[net] host: peer registered with broker, id=',id);});
  peer.on('connection',(conn)=>{
    console.log('[net] host: incoming connection from',conn.peer);
    conns.push(conn);
    conn.on('data',(data)=>{console.log('[net] host: received',data);handlePeerData(data,conn);});
    conn.on('open',()=>{console.log('[net] host: data channel open, sending initial state');conn.send({type:'state',gs});});
    conn.on('close',()=>{console.log('[net] host: connection closed',conn.peer);conns=conns.filter(c=>c!==conn);});
    conn.on('error',(e)=>{console.error('[net] host: connection error',e);});
  });
  peer.on('disconnected',()=>{console.warn('[net] host: disconnected from broker');});
  peer.on('error',(e)=>{console.error('[net] host: peer error',e);toast('Erreur réseau : '+(e?.type||e));});
}
function setupGuestPeer(code,name){
  isHost=false;
  console.log('[net] guest: creating own peer, will connect to gachette-'+code);
  peer=new Peer();
  peer.on('open',(myPeerId)=>{
    console.log('[net] guest: own peer registered, id=',myPeerId,'now connecting to host');
    hostConn=peer.connect('gachette-'+code);
    hostConn.on('open',()=>{console.log('[net] guest: data channel to host open, sending join');hostConn.send({type:'join',id:myId,name});});
    hostConn.on('data',(data)=>{console.log('[net] guest: received',data);handlePeerData(data,hostConn);});
    hostConn.on('close',()=>{console.log('[net] guest: connection to host closed');toast('Connexion à l\'hôte perdue.');});
    hostConn.on('error',(e)=>{console.error('[net] guest: connection error',e);});
  });
  peer.on('disconnected',()=>{console.warn('[net] guest: disconnected from broker');});
  peer.on('error',(e)=>{console.error('[net] guest: peer error',e);toast('Salle introuvable ou erreur réseau.');});
}
function handlePeerData(msg,fromConn){
  if(msg.type==='join'){
    if(isHost&&gs?.phase==='lobby'){
      if(!gs.players.find(p=>p.id===msg.id))gs.players.push(mkPlayer(msg.id,msg.name,gs.players.length));
      broadcast({type:'state',gs});renderLobby();
    }
    return;
  }
  if(msg.type==='state'){
    gs=msg.gs;
    if(isHost)conns.forEach(c=>{if(c!==fromConn){try{c.send(msg);}catch(e){}}});
    if(gs.phase==='picker')showPicker();
    else if(gs.phase==='game')showGame();
    else if(gs.phase==='finished')showEndScreen();
    else renderLobby();
    renderAll();
  }
  if(msg.type==='missionPick'){
    const pl=gs?.players.find(p=>p.id===msg.id);
    if(pl){pl.missionOrder=msg.missionOrder;pl.doneMask=msg.doneMask;}
    if(isHost){
      conns.forEach(c=>{if(c!==fromConn){try{c.send(msg);}catch(e){}}});
      tryStartIfAllReady();
    }
    if(gs?.phase==='game')renderAll();
  }
}
function broadcast(msg){
  if(botMode)return;
  if(isHost)conns.forEach(c=>{try{c.send(msg);}catch(e){}});
  else if(hostConn){try{hostConn.send(msg);}catch(e){}}
}
