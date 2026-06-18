// ============================================================
// shop.js — Magasin : 6 types de cartes (voir SHOP_CARDS, data.js),
// 8 exemplaires chacune (stock partagé gs.shopStock), jusqu'à 3
// cartes achetées par tour au total, quantité au choix par carte.
// ============================================================

function openShopModal(){
  const p=me();if(!p)return;
  shopSelection={};
  renderShopUI();
  document.getElementById('modal-shop').classList.add('open');
}
function shopRemainingBuys(){
  const p=me();return MAX_BUY_PER_TURN-(p?.buysThisTurn||0);
}
function shopOtherSelected(excludeId){
  return Object.entries(shopSelection).filter(([k])=>k!==excludeId).reduce((a,[,v])=>a+v,0);
}
function shopMaxQtyFor(card){
  const p=me();if(!p)return 0;
  const stock=gs.shopStock?.[card.id]??0;
  const remaining=shopRemainingBuys()-shopOtherSelected(card.id);
  let max=Math.max(0,Math.min(stock,remaining));
  if(card.kind==='permanent-flag'&&p.hasFusil)max=0;
  if(card.kind==='permanent-unique'&&p.hasOmbre)max=0;
  if(card.kind==='permanent-flag'||card.kind==='permanent-unique')max=Math.min(max,1);
  return max;
}
function shopQty(id,delta){
  const card=shopCard(id);if(!card)return;
  const max=shopMaxQtyFor(card);
  const cur=shopSelection[id]||0;
  const next=Math.max(0,Math.min(max,cur+delta));
  if(next>0)shopSelection[id]=next;else delete shopSelection[id];
  renderShopUI();
}
function shopOwnedLabel(card,p){
  if(card.id==='fusil')return p.hasFusil?'oui':'non';
  if(card.id==='ombre')return p.hasOmbre?'oui':'non';
  if(card.id==='block')return p.blockCards||0;
  if(card.id==='revolver')return p.revolverCount||0;
  if(card.id==='trefle')return p.trefleCount||0;
  if(card.id==='selle')return p.selleCount||0;
  return 0;
}
function renderShopUI(){
  const p=me();if(!p)return;
  const box=document.getElementById('shop-list');if(!box)return;
  box.innerHTML=SHOP_CARDS.map(card=>{
    const stock=gs.shopStock?.[card.id]??0;
    const qty=shopSelection[card.id]||0;
    const max=shopMaxQtyFor(card);
    return `<div class="shop-card">
      <div class="shop-card-head"><span class="shop-icon">${card.icon}</span><b>${card.name}</b><span class="shop-price">${card.price}$</span></div>
      <div class="shop-desc">${card.desc}</div>
      <div class="shop-row2">
        <span class="shop-stock">Stock : ${stock} · Tu en as : ${shopOwnedLabel(card,p)}</span>
        <span class="shop-stepper">
          <button class="m-close" style="padding:2px 8px" onclick="shopQty('${card.id}',-1)" ${qty<=0?'disabled':''}>−</button>
          <b style="margin:0 8px">${qty}</b>
          <button class="m-close" style="padding:2px 8px" onclick="shopQty('${card.id}',1)" ${qty>=max?'disabled':''}>+</button>
        </span>
      </div>
    </div>`;
  }).join('');
  const total=SHOP_CARDS.reduce((sum,c)=>sum+(shopSelection[c.id]||0)*c.price,0);
  const qtySum=Object.values(shopSelection).reduce((a,b)=>a+b,0);
  document.getElementById('shop-total').textContent=total;
  const confirmBtn=document.getElementById('shop-confirm');
  if(confirmBtn)confirmBtn.disabled=qtySum<=0||total>p.money;
}
function confirmShop(){
  const p=me();if(!p)return;
  const total=SHOP_CARDS.reduce((sum,c)=>sum+(shopSelection[c.id]||0)*c.price,0);
  const qtySum=Object.values(shopSelection).reduce((a,b)=>a+b,0);
  if(qtySum<=0)return;
  if(total>p.money){toast('Pas assez d\'argent !');return;}
  if(qtySum>shopRemainingBuys()){toast('Limite de 3 achats par tour atteinte !');return;}
  for(const card of SHOP_CARDS){
    const qty=shopSelection[card.id]||0;if(qty<=0)continue;
    if((gs.shopStock[card.id]||0)<qty){toast(`Stock insuffisant pour ${card.name} !`);return;}
  }
  for(const card of SHOP_CARDS){
    const qty=shopSelection[card.id]||0;if(qty<=0)continue;
    gs.shopStock[card.id]-=qty;
    if(card.id==='block')p.blockCards=(p.blockCards||0)+qty;
    else if(card.id==='revolver')p.revolverCount=(p.revolverCount||0)+qty;
    else if(card.id==='trefle')p.trefleCount=(p.trefleCount||0)+qty;
    else if(card.id==='selle')p.selleCount=(p.selleCount||0)+qty;
    else if(card.id==='fusil')p.hasFusil=true;
    else if(card.id==='ombre')p.hasOmbre=true;
  }
  p.money-=total;p.buysThisTurn=(p.buysThisTurn||0)+qtySum;
  addLog(`🛒 ${p.name} achète ${qtySum} carte(s) au magasin (-${total}$)`,'ev');
  shopSelection={};
  document.getElementById('modal-shop').classList.remove('open');
  broadcast({type:'state',gs});
  endTurn();
}
function skipShop(){
  shopSelection={};
  document.getElementById('modal-shop').classList.remove('open');
  endTurn();
}
