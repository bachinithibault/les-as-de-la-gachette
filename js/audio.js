// ============================================================
// audio.js — Musique de fond en boucle + coup de revolver
// synthétisé (discret) à chaque tour.
// ============================================================

let actx=null;
function getActx(){if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();return actx;}
function playBgm(){
  const bgm=document.getElementById('bgm');if(!bgm)return;
  bgm.volume=muted?0:0.12;
  bgm.play().catch(()=>{});
}
function stopBgm(){const bgm=document.getElementById('bgm');if(bgm){bgm.pause();bgm.currentTime=0;}}
function toggleMute(){
  muted=!muted;
  const bgm=document.getElementById('bgm');if(bgm)bgm.volume=muted?0:0.12;
  document.getElementById('mute-btn').textContent=muted?'🔇':'🔊';
}
function gunshot(){
  if(muted)return;
  try{
    const ctx=getActx();
    const dur=0.18;
    const buffer=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const noise=ctx.createBufferSource();noise.buffer=buffer;
    const filt=ctx.createBiquadFilter();filt.type='lowpass';filt.frequency.value=1800;
    const gain=ctx.createGain();gain.gain.value=0.16;
    gain.gain.setValueAtTime(0.16,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);
    noise.connect(filt);filt.connect(gain);gain.connect(ctx.destination);
    noise.start();noise.stop(ctx.currentTime+dur);
  }catch(e){}
}
