// ============================================================
// profile.js — Profil local (pseudo uniquement, aucune autre info).
// ============================================================

function loadProfile(){
  try{const raw=localStorage.getItem(PROFILE_KEY);if(!raw)return null;return JSON.parse(raw);}catch(e){return null;}
}
function saveProfile(){
  const name=document.getElementById('inp-name').value.trim();
  if(!name){toast('Entre un pseudo avant de sauvegarder !');return;}
  localStorage.setItem(PROFILE_KEY,JSON.stringify({pseudo:name}));
  document.getElementById('profile-hint').textContent='✅ Pseudo sauvegardé sur cet appareil.';
  toast('Pseudo sauvegardé !');
}
function initProfileUI(){
  const prof=loadProfile();
  if(prof?.pseudo){
    document.getElementById('inp-name').value=prof.pseudo;
    document.getElementById('profile-hint').textContent='Pseudo chargé depuis ton profil local.';
  }
}
