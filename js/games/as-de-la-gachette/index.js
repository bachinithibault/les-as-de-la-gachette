// ============================================================
// Les As de la Gâchette — module de jeu YouPlay
// Un seul fichier : logique pure + affichage DOM. Aucune dépendance
// externe, aucun réseau, aucun stockage. Conforme au contrat YouPlay.
// ============================================================

// ------------------------------------------------------------
// DONNÉES STATIQUES (jamais dans `state` : recalculées/relues ici)
// ------------------------------------------------------------
const PRIME_NAMES = ['Le Bleu', 'Voyou', 'Cow-boy', 'Fin Tireur', 'As de la Gâchette'];
const PRIME_BONUS = [0, 1, 2, 3, 4];
const PRIME_MONEY = [30, 60, 90, 120, 200];
const MAX_TRAIN = 3;
const BLOCK_DURATION = 2;
const BLOCK_PRICE = 40;
const MAX_BUY_PER_TURN = 3;
const SHOP_PRICE = 50;
const SHOP_STOCK_PER_CARD = 8;
const HEIST_MIN_MONEY = 1000;
const HEIST_TARGET = 9;

const MISSION_REWARD_BY_SCORE = { 5: 200, 6: 260, 7: 325, 9: 450 };

const MISSION_POOL = [
  { title: 'Vol de diligence', minScore: 5, dest: 'Los Lobos', hard: false },
  { title: 'Braquage local', minScore: 5, dest: 'Dusty Creek', hard: false },
  { title: 'Capture de bandit', minScore: 5, dest: 'Coyote Peak', hard: false },
  { title: 'Passage à Redrock', minScore: 5, dest: 'Redrock', hard: false },
  { title: 'Embuscade', minScore: 6, dest: "Devil's Pass", hard: false },
  { title: 'Fuite à cheval', minScore: 5, dest: 'Snake Bend', hard: false },
  { title: "Convoi d'or", minScore: 7, dest: 'Amber Falls', hard: false },
  { title: 'Fusillade', minScore: 5, dest: 'Badwater', hard: false },
  { title: 'Prisonnier évadé', minScore: 5, dest: 'Fort Diablo', hard: false },
  { title: 'Sabotage ferroviaire', minScore: 7, dest: 'Ghost Valley', hard: false },
  { title: 'Vendetta', minScore: 5, dest: 'Saloon Ridge', hard: false },
  { title: 'Carte au trésor', minScore: 5, dest: 'Rio Seco', hard: false },
  { title: 'Règlement de comptes', minScore: 6, dest: 'Black Mesa', hard: false },
  { title: 'Razzia', minScore: 5, dest: 'Los Lobos', hard: false },
  { title: 'Trafic de chevaux', minScore: 5, dest: 'Amber Falls', hard: false },
  { title: 'Règle du silence', minScore: 6, dest: 'Dusty Creek', hard: false },
  { title: 'Hold-up à Tombstone', minScore: 9, dest: 'Tombstone Creek', hard: true },
  { title: "Chasse à l'homme", minScore: 9, dest: 'Vulture Gulch', hard: true },
  { title: 'Le dernier train', minScore: 9, dest: 'Silver Hollow', hard: true },
  { title: 'Duel au sommet', minScore: 9, dest: 'Coyote Peak', hard: true },
  { title: 'Raid nocturne', minScore: 9, dest: 'Ghost Valley', hard: true },
  { title: 'La rançon', minScore: 9, dest: 'Fort Diablo', hard: true },
  { title: 'Le grand coup', minScore: 9, dest: 'Redrock', hard: true },
  { title: 'Tête mise à prix', minScore: 9, dest: 'Snake Bend', hard: true },
  { title: 'Cargaison perdue', minScore: 5, dest: 'Badwater', hard: false },
  { title: 'Messager pressé', minScore: 5, dest: 'Black Mesa', hard: false },
  { title: 'Bétail égaré', minScore: 5, dest: 'Rio Seco', hard: false },
  { title: 'Eau empoisonnée', minScore: 5, dest: 'Amber Falls', hard: false },
  { title: 'Le notaire véreux', minScore: 6, dest: 'Saloon Ridge', hard: false },
  { title: 'Mine abandonnée', minScore: 6, dest: "Devil's Pass", hard: false },
  { title: 'Caravane attaquée', minScore: 7, dest: 'Dusty Creek', hard: false },
  { title: 'Le passeur', minScore: 7, dest: 'Los Lobos', hard: false },
].map((m, i) => ({ ...m, idx: i, reward: MISSION_REWARD_BY_SCORE[m.minScore] }));
const HARD_IDX = MISSION_POOL.filter(m => m.hard).map(m => m.idx);

// type: 'bad' (perte d'argent), 'good' (gain d'argent), 'amb' (embuscade : bloque une case)
const CHANCE_POOL = [
  { type: 'bad', title: 'Arrestation !', body: "Le shérif t'a repéré.", amount: -60 },
  { type: 'bad', title: 'Cheval blessé !', body: 'Tu perds 40 $.', amount: -40 },
  { type: 'bad', title: 'Tempête de sable', body: 'Tu perds 30 $.', amount: -30 },
  { type: 'good', title: 'Lingot trouvé !', body: 'Quelle veine !', amount: 80 },
  { type: 'good', title: 'Informateur', body: 'Un tuyau en or.', amount: 60 },
  { type: 'good', title: 'Bonne réputation', body: 'Les habitants aident.', amount: 50 },
  { type: 'amb', title: 'Pillards !', body: 'Une case est bloquée 2 tours.', amount: 0 },
  { type: 'amb', title: 'Patrouille', body: 'Une case est bloquée 2 tours.', amount: 0 },
];

const SHOP_CARDS = [
  { id: 'block', name: 'Blocage', icon: '⭐', kind: 'targeted',
    desc: 'Bloque la case de ton choix (hors villes et banque) pendant 2 tours.' },
  { id: 'revolver', name: 'Revolver', icon: '🔫', kind: 'roll-buff',
    desc: 'Usage unique : +1 ou +2 à ton prochain lancer de mission ou de duel.' },
  { id: 'trefle', name: 'Trèfle', icon: '🍀', kind: 'mission-buff',
    desc: "Usage unique : -1 au score minimum d'une mission, +50$ si elle réussit." },
  { id: 'selle', name: 'Selle', icon: '🐴', kind: 'permanent-stack',
    desc: 'Permanent, cumulable : +1 au total des dés de déplacement.' },
  { id: 'fusil', name: 'Fusil', icon: '🔭', kind: 'permanent-flag',
    desc: "Usage unique : porte de duel +1 case. À 2 cases, l'adversaire (sans Comme son ombre) perd 2 points en défense. Consommé après usage." },
  { id: 'ombre', name: 'Comme son ombre', icon: '🕶️', kind: 'permanent-unique',
    desc: 'Permanent, non cumulable : annule la pénalité du Fusil quand tu te défends.' },
];
const SHOP_IDS = SHOP_CARDS.map(c => c.id);

// Plateau (cases). Identique à js/data.js (RAW) du jeu d'origine.
const RAW = [
  { r: 0, c: 1, t: 'n' }, { r: 0, c: 2, t: 'c' }, { r: 0, c: 3, t: 'n' }, { r: 0, c: 4, t: 'm', l: 'Los Lobos' }, { r: 0, c: 5, t: 'n' }, { r: 0, c: 6, t: 'c' }, { r: 0, c: 7, t: 'n' }, { r: 0, c: 8, t: 's' }, { r: 0, c: 9, t: 'n' }, { r: 0, c: 10, t: 'm', l: 'Dusty Creek' }, { r: 0, c: 11, t: 'n' }, { r: 1, c: 1, t: 'm', l: 'Coyote Peak' }, { r: 1, c: 4, t: 'n' }, { r: 1, c: 7, t: 'n' }, { r: 2, c: 1, t: 'n' }, { r: 2, c: 2, t: 's' }, { r: 2, c: 3, t: 'n' }, { r: 2, c: 4, t: 'n' }, { r: 2, c: 5, t: 'n' }, { r: 2, c: 6, t: 'm', l: 'Redrock' }, { r: 2, c: 7, t: 'c' }, { r: 2, c: 8, t: 'n' }, { r: 2, c: 9, t: 'n' }, { r: 2, c: 10, t: 'n' }, { r: 2, c: 11, t: 'n' }, { r: 3, c: 3, t: 'n' }, { r: 3, c: 6, t: 'n' }, { r: 3, c: 11, t: 'm', l: 'Fort Diablo' }, { r: 4, c: 1, t: 'n' }, { r: 4, c: 2, t: 'n' }, { r: 4, c: 3, t: 'm', l: 'Rio Seco' }, { r: 4, c: 4, t: 'n' }, { r: 4, c: 5, t: 'c' }, { r: 4, c: 6, t: 'B', l: 'BANQUE' }, { r: 4, c: 7, t: 'n' }, { r: 4, c: 8, t: 'n' }, { r: 4, c: 9, t: 'm', l: 'Ghost Valley' }, { r: 4, c: 11, t: 'n' }, { r: 5, c: 1, t: 's' }, { r: 5, c: 3, t: 'n' }, { r: 5, c: 4, t: 'T', l: 'Central Station' }, { r: 5, c: 6, t: 'n' }, { r: 5, c: 9, t: 'c' }, { r: 5, c: 11, t: 'm', l: 'Saloon Ridge' }, { r: 6, c: 1, t: 'n' }, { r: 6, c: 2, t: 'n' }, { r: 6, c: 3, t: 'c' }, { r: 6, c: 4, t: 'n' }, { r: 6, c: 5, t: 'm', l: "Devil's Pass" }, { r: 6, c: 6, t: 'n' }, { r: 6, c: 7, t: 'n' }, { r: 6, c: 8, t: 'n' }, { r: 6, c: 9, t: 'n' }, { r: 6, c: 10, t: 's' }, { r: 6, c: 11, t: 'n' }, { r: 7, c: 4, t: 'n' }, { r: 7, c: 6, t: 'c' }, { r: 7, c: 9, t: 'n' }, { r: 7, c: 11, t: 'n' }, { r: 8, c: 2, t: 'c' }, { r: 8, c: 3, t: 'n' }, { r: 8, c: 4, t: 'm', l: 'Amber Falls' }, { r: 8, c: 5, t: 'n' }, { r: 8, c: 6, t: 's' }, { r: 8, c: 7, t: 'n' }, { r: 8, c: 9, t: 'n' }, { r: 8, c: 10, t: 'n' }, { r: 8, c: 11, t: 'm', l: 'Black Mesa' }, { r: 9, c: 1, t: 'm', l: 'Snake Bend' }, { r: 9, c: 2, t: 'n' }, { r: 9, c: 4, t: 'c' }, { r: 10, c: 2, t: 'n' }, { r: 9, c: 7, t: 'm', l: 'Badwater' }, { r: 9, c: 8, t: 'n' }, { r: 9, c: 9, t: 'n' }, { r: 0, c: 0, t: 'T', l: 'Comanche Station' }, { r: 1, c: 0, t: 'n' }, { r: 2, c: 0, t: 'n' }, { r: 3, c: 0, t: 'm', l: 'Tombstone Creek' }, { r: 4, c: 0, t: 'n' }, { r: 6, c: 0, t: 'n' }, { r: 7, c: 0, t: 'c' }, { r: 8, c: 0, t: 's' }, { r: 9, c: 0, t: 'n' }, { r: 0, c: 12, t: 'T', l: 'Eastwind Station' }, { r: 1, c: 12, t: 'n' }, { r: 2, c: 12, t: 'c' }, { r: 3, c: 12, t: 'n' }, { r: 4, c: 12, t: 'n' }, { r: 8, c: 12, t: 'c' }, { r: 9, c: 12, t: 'n' }, { r: 10, c: 3, t: 'm', l: 'Silver Hollow' }, { r: 10, c: 4, t: 'n' }, { r: 10, c: 5, t: 'n' }, { r: 10, c: 6, t: 'n' }, { r: 10, c: 7, t: 'n' }, { r: 10, c: 9, t: 'm', l: 'Vulture Gulch' }, { r: 10, c: 10, t: 's' }, { r: 10, c: 11, t: 'n' }, { r: 11, c: 6, t: 'n' }, { r: 12, c: 6, t: 'n' }, { r: 4, c: 13, t: 'n' }, { r: 4, c: 14, t: 'n' }, { r: 10, c: 12, t: 'T', l: 'Southfork Station' }, { r: 10, c: 0, t: 'T', l: 'Ironwood Station' }, { r: 4, c: -1, t: 'n' }, { r: 4, c: -2, t: 'n' }, { r: 5, c: -2, t: 'q', l: 'Trésor' }, { r: 3, c: 14, t: 'q', l: 'Armurier' }, { r: 12, c: 7, t: 'q', l: "École Shérif" }, { r: 4, c: 10, t: 'T', l: 'Prairie Station' },
];
const EDGE_EXCLUDE = [
  [[6, 4], [5, 4]],
  [[6, 4], [6, 3]],
  [[2, 0], [2, 1]],
];

const NODES = RAW.map((c, i) => ({ id: i, r: c.r, c: c.c, t: c.t, l: c.l || null }));
const POS_KEY = (r, c) => r + ',' + c;
const POS_TO_ID = new Map(NODES.map(n => [POS_KEY(n.r, n.c), n.id]));
function isExcluded(aId, bId) {
  const a = NODES[aId], b = NODES[bId];
  return EDGE_EXCLUDE.some(([p, q]) =>
    ((a.r === p[0] && a.c === p[1] && b.r === q[0] && b.c === q[1]) ||
     (a.r === q[0] && a.c === q[1] && b.r === p[0] && b.c === p[1]))
  );
}
const ADJ = NODES.map(() => []);
for (const n of NODES) {
  for (const [r, c] of [[n.r - 1, n.c], [n.r + 1, n.c], [n.r, n.c - 1], [n.r, n.c + 1]]) {
    const id = POS_TO_ID.get(POS_KEY(r, c));
    if (id != null && !isExcluded(n.id, id)) ADJ[n.id].push(id);
  }
}
const BANK_ID = NODES.findIndex(n => n.t === 'B');
const STATION_IDS = NODES.filter(n => n.t === 'T').map(n => n.id);
function bfsDist(fromId) {
  const dist = new Array(NODES.length).fill(Infinity);
  dist[fromId] = 0;
  const q = [fromId];
  while (q.length) {
    const u = q.shift();
    for (const v of ADJ[u]) if (dist[v] === Infinity) { dist[v] = dist[u] + 1; q.push(v); }
  }
  return dist;
}

// ------------------------------------------------------------
// UTILITAIRES purs (RNG passé en paramètre pour rester explicite)
// ------------------------------------------------------------
function roll2d6() { return 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6); }
function rollD(rng) { return 1 + Math.floor(rng() * 6); }
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function drawFive(rng) {
  const hard = HARD_IDX[Math.floor(rng() * HARD_IDX.length)];
  const usedDest = new Set([MISSION_POOL[hard].dest]);
  const chosen = [hard];
  const normals = shuffle(MISSION_POOL.filter(m => !m.hard).map(m => m.idx), rng);
  for (const idx of normals) {
    if (chosen.length >= 5) break;
    const dest = MISSION_POOL[idx].dest;
    if (usedDest.has(dest)) continue;
    usedDest.add(dest);
    chosen.push(idx);
  }
  return shuffle(chosen, rng).map(idx => ({ m: idx, done: false }));
}
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function nodeByLabel(label) { return NODES.find(n => n.l === label); }

function nextTurn(s) {
  for (const k of Object.keys(s.blocks)) {
    s.blocks[k] -= 1;
    if (s.blocks[k] <= 0) delete s.blocks[k];
  }
  s.turn = (s.turn + 1) % s.players.length;
  s.phase = 'turn-start';
  s.dice = null;
  s.stepsLeft = 0;
  s.pendingMissionSlot = null;
  s.pendingDuel = null;
  s.pendingTrain = null;
  s.buysThisVisit = 0;
  s.log.push({ seat: s.turn, msg: 'Nouveau tour.' });
  if (s.log.length > 30) s.log.splice(0, s.log.length - 30);
}

function drawChance(s) {
  if (s.chanceDeck.length === 0) s.chanceDeck = shuffle(CHANCE_POOL.map((_, i) => i), Math.random);
  return s.chanceDeck.shift();
}

function nearestBlockable(s, fromId) {
  const dist = bfsDist(fromId);
  let best = null, bestD = Infinity;
  for (const n of NODES) {
    if (n.t !== 'n') continue;
    if (s.blocks[n.id]) continue;
    if (dist[n.id] < bestD) { bestD = dist[n.id]; best = n.id; }
  }
  return best;
}

function promotePrime(p, s, seat) {
  if (p.prime < 4) {
    p.prime += 1;
    p.money += PRIME_MONEY[p.prime];
    s.log.push({ seat, msg: `Promu ${PRIME_NAMES[p.prime]} (+${PRIME_MONEY[p.prime]}$).` });
  }
}

function resolveLanding(s, seat) {
  const p = s.players[seat];
  const node = NODES[p.pos];
  switch (node.t) {
    case 'm': {
      const slot = p.missions.findIndex(m => !m.done && MISSION_POOL[m.m].dest === node.l);
      if (slot >= 0) { s.phase = 'mission-roll'; s.pendingMissionSlot = slot; return; }
      s.log.push({ seat, msg: `${node.l} : rien à faire ici.` });
      nextTurn(s);
      return;
    }
    case 'c': {
      const ci = drawChance(s);
      const card = CHANCE_POOL[ci];
      if (card.type === 'amb') {
        const target = nearestBlockable(s, p.pos);
        if (target != null) { s.blocks[target] = BLOCK_DURATION; s.log.push({ seat, msg: `${card.title} : case ${NODES[target].r},${NODES[target].c} bloquée 2 tours.` }); }
      } else {
        p.money = Math.max(0, p.money + card.amount);
        s.log.push({ seat, msg: `${card.title} (${card.amount > 0 ? '+' : ''}${card.amount}$).` });
      }
      nextTurn(s);
      return;
    }
    case 's':
      s.phase = 'shop';
      s.buysThisVisit = 0;
      return;
    case 'B':
      if (p.missions.every(m => m.done) && p.money >= HEIST_MIN_MONEY) {
        s.phase = 'heist';
        return;
      }
      nextTurn(s);
      return;
    case 'T':
      if (p.trainUses < MAX_TRAIN && p.money >= 50 && STATION_IDS.length > 1) {
        s.phase = 'train';
        return;
      }
      nextTurn(s);
      return;
    case 'q': {
      if (node.l === 'Trésor') { p.money += 100; s.log.push({ seat, msg: 'Trésor : +100$.' }); }
      else if (node.l === 'Armurier') { p.shop.fusil = true; s.log.push({ seat, msg: 'Armurier : Fusil gratuit.' }); }
      else if (node.l === "École Shérif") { promotePrime(p, s, seat); }
      nextTurn(s);
      return;
    }
    default:
      nextTurn(s);
      return;
  }
}

function duelAllowedHere(s, attacker, target) {
  const pa = s.players[attacker], pt = s.players[target];
  if (NODES[pa.pos].t === 'm' || NODES[pt.pos].t === 'm') return false;
  const dist = bfsDist(pa.pos)[pt.pos];
  const maxDist = pa.shop.fusil ? 2 : 1;
  return dist >= 1 && dist <= maxDist;
}

function resolveDuel(s) {
  const d = s.pendingDuel;
  const atk = s.players[d.attacker], def = s.players[d.target];
  let atkRoll = roll2d6() + PRIME_BONUS[atk.prime];
  if (d.revolver) { atkRoll += d.revolver; atk.shop.revolver -= 1; }
  let defRoll = roll2d6() + PRIME_BONUS[def.prime];
  let fusilUsed = false;
  if (atk.shop.fusil && d.dist === 2) {
    fusilUsed = true;
    atk.shop.fusil = false;
    s.shopStock.fusil += 1;
    if (!def.shop.ombre) defRoll -= 2;
  }
  let winnerSeat = null, loserSeat = null;
  if (atkRoll > defRoll) { winnerSeat = d.attacker; loserSeat = d.target; }
  else if (defRoll > atkRoll) { winnerSeat = d.target; loserSeat = d.attacker; }
  s.log.push({ seat: d.attacker, msg: `Duel : ${atkRoll} vs ${defRoll}${fusilUsed ? ' (Fusil)' : ''}.` });
  if (winnerSeat != null) {
    const w = s.players[winnerSeat], l = s.players[loserSeat];
    w.money += 50 + PRIME_MONEY[l.prime];
    l.money = Math.max(0, l.money - 50);
    l.prime = Math.max(0, l.prime - 1);
    l.pos = BANK_ID;
    s.log.push({ seat: winnerSeat, msg: `Duel gagné contre le joueur ${loserSeat + 1}.` });
    const doneIdx = l.missions.findIndex(m => m.done);
    if (doneIdx >= 0) {
      s.pendingDuel.loser = loserSeat;
      s.phase = 'duel-redo';
      return;
    }
  }
  s.pendingDuel = null;
  nextTurn(s);
}

// ------------------------------------------------------------
// LE CONTRAT
// ------------------------------------------------------------
export default {
  id: 'as-de-la-gachette',
  name: 'Les As de la Gâchette',
  emoji: '🤠',
  category: 'plateau',
  rules: {
    but: 'Accomplis tes 5 missions et amasse au moins 1000$, puis braque la Banque Fédérale.',
    jouer: 'Lance les dés, déplace-toi sur le plateau, remplis tes missions, achète des cartes, duel les adversaires.',
    gagner: 'Réussis le braquage final à la banque (2d6 ≥ 9) avec 5/5 missions et 1000$ en poche.',
  },
  minPlayers: 2,
  maxPlayers: 4,

  init(seatIds) {
    const players = seatIds.map(() => ({
      pos: BANK_ID,
      money: 200,
      prime: 0,
      missions: drawFive(Math.random),
      failedIdx: null,
      shop: { block: 0, revolver: 0, trefle: 0, selle: 0, fusil: false, ombre: false },
      trainUses: 0,
    }));
    return {
      players,
      turn: 0,
      phase: 'turn-start',
      dice: null,
      stepsLeft: 0,
      pendingMissionSlot: null,
      pendingDuel: null,
      pendingTrain: null,
      buysThisVisit: 0,
      blocks: {},
      chanceDeck: shuffle(CHANCE_POOL.map((_, i) => i), Math.random),
      shopStock: { block: SHOP_STOCK_PER_CARD, revolver: SHOP_STOCK_PER_CARD, trefle: SHOP_STOCK_PER_CARD, selle: SHOP_STOCK_PER_CARD, fusil: SHOP_STOCK_PER_CARD, ombre: SHOP_STOCK_PER_CARD },
      winner: null,
      finished: false,
      log: [],
    };
  },

  currentSeat(state) {
    if (state.finished) return null;
    if (state.phase === 'duel-redo') return null;
    return state.turn;
  },

  pendingSeats(state) {
    if (!state.finished && state.phase === 'duel-redo' && state.pendingDuel) return [state.pendingDuel.loser];
    return [];
  },

  statusText(state, mySeatIndex) {
    if (state.finished) return 'Partie terminée.';
    const labels = {
      'turn-start': 'doit lancer les dés (ou retenter une mission).',
      moving: 'se déplace.',
      'mission-roll': 'tente une mission.',
      shop: 'fait ses achats.',
      train: 'choisit une gare.',
      heist: 'tente le braquage final !',
      duel: 'lance un duel.',
      'duel-redo': 'doit annuler une mission après un duel perdu.',
    };
    const seat = state.phase === 'duel-redo' ? state.pendingDuel.loser : state.turn;
    return `Joueur ${seat + 1} ${labels[state.phase] || 'joue'}`;
  },

  move(state, mv, seatIndex) {
    if (state.finished) return { valid: false, state };
    const s = clone(state);
    const actorOk = s.phase === 'duel-redo'
      ? (s.pendingDuel && s.pendingDuel.loser === seatIndex)
      : (seatIndex === s.turn);
    if (!actorOk || !mv || typeof mv.type !== 'string') return { valid: false, state };
    const p = s.players[seatIndex];

    try {
      switch (mv.type) {
        case 'retry': {
          if (s.phase !== 'turn-start' || p.failedIdx == null) return { valid: false, state };
          const idx = p.failedIdx;
          const mission = MISSION_POOL[p.missions[idx].m];
          const r = roll2d6() + PRIME_BONUS[p.prime];
          if (r >= mission.minScore) {
            p.missions[idx].done = true;
            p.money += mission.reward;
            p.failedIdx = null;
            if (mission.hard) promotePrime(p, s, seatIndex);
            s.log.push({ seat: seatIndex, msg: `Mission "${mission.title}" réussie (${r}).` });
          } else {
            s.log.push({ seat: seatIndex, msg: `Mission "${mission.title}" ratée à nouveau (${r}).` });
          }
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'roll': {
          if (s.phase !== 'turn-start') return { valid: false, state };
          const d1 = rollD(Math.random), d2 = rollD(Math.random);
          const selleBonus = p.shop.selle;
          s.dice = { d1, d2, selle: selleBonus };
          s.stepsLeft = d1 + d2 + selleBonus;
          s.phase = 'moving';
          return { valid: true, state: s };
        }

        case 'step': {
          if (s.phase !== 'moving' || s.stepsLeft <= 0) return { valid: false, state };
          const to = mv.to;
          if (typeof to !== 'number' || !ADJ[p.pos].includes(to)) return { valid: false, state };
          if (s.blocks[to]) return { valid: false, state };
          p.pos = to;
          s.stepsLeft -= 1;
          if (s.stepsLeft === 0) { resolveLanding(s, seatIndex); }
          return { valid: true, state: s };
        }

        case 'stop': {
          if (s.phase !== 'moving') return { valid: false, state };
          s.stepsLeft = 0;
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'declareDuel': {
          if (s.phase !== 'moving') return { valid: false, state };
          const target = mv.target;
          if (typeof target !== 'number' || target === seatIndex || !s.players[target]) return { valid: false, state };
          if (s.players[target].pos !== p.pos) return { valid: false, state };
          if (!duelAllowedHere(s, seatIndex, target)) return { valid: false, state };
          const dist = bfsDist(p.pos)[s.players[target].pos];
          s.stepsLeft = 0;
          s.phase = 'duel';
          s.pendingDuel = { attacker: seatIndex, target, dist, loser: null };
          return { valid: true, state: s };
        }

        case 'duelRoll': {
          if (s.phase !== 'duel' || !s.pendingDuel || s.pendingDuel.attacker !== seatIndex) return { valid: false, state };
          const useRevolver = mv.useRevolver === 1 || mv.useRevolver === 2 ? mv.useRevolver : 0;
          if (useRevolver && p.shop.revolver <= 0) return { valid: false, state };
          s.pendingDuel.revolver = useRevolver;
          resolveDuel(s);
          return { valid: true, state: s };
        }

        case 'redoPick': {
          if (s.phase !== 'duel-redo' || !s.pendingDuel || s.pendingDuel.loser !== seatIndex) return { valid: false, state };
          const idx = mv.missionIdx;
          if (typeof idx !== 'number' || !p.missions[idx] || !p.missions[idx].done) return { valid: false, state };
          p.missions[idx].done = false;
          s.pendingDuel = null;
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'missionRoll': {
          if (s.phase !== 'mission-roll' || s.pendingMissionSlot == null) return { valid: false, state };
          const slot = s.pendingMissionSlot;
          const mEntry = p.missions[slot];
          const mission = MISSION_POOL[mEntry.m];
          const useTrefle = !!mv.useTrefle && p.shop.trefle > 0;
          const useRevolver = mv.useRevolver === 1 || mv.useRevolver === 2 ? mv.useRevolver : 0;
          if (useRevolver && p.shop.revolver <= 0) return { valid: false, state };
          if (useTrefle) p.shop.trefle -= 1;
          if (useRevolver) p.shop.revolver -= 1;
          const target = mission.minScore - (useTrefle ? 1 : 0);
          const r = roll2d6() + PRIME_BONUS[p.prime] + useRevolver;
          if (r >= target) {
            mEntry.done = true;
            p.money += mission.reward + (useTrefle ? 50 : 0);
            p.failedIdx = null;
            if (mission.hard) promotePrime(p, s, seatIndex);
            s.log.push({ seat: seatIndex, msg: `Mission "${mission.title}" réussie (${r}).` });
          } else {
            p.failedIdx = slot;
            s.log.push({ seat: seatIndex, msg: `Mission "${mission.title}" ratée (${r}).` });
          }
          s.pendingMissionSlot = null;
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'shopBuy': {
          if (s.phase !== 'shop') return { valid: false, state };
          const id = mv.cardId;
          if (!SHOP_IDS.includes(id)) return { valid: false, state };
          if (s.buysThisVisit >= MAX_BUY_PER_TURN) return { valid: false, state };
          if (s.shopStock[id] <= 0 || p.money < SHOP_PRICE) return { valid: false, state };
          if (id === 'ombre' && p.shop.ombre) return { valid: false, state };
          if (id === 'fusil' && p.shop.fusil) return { valid: false, state };
          p.money -= SHOP_PRICE;
          s.shopStock[id] -= 1;
          s.buysThisVisit += 1;
          if (id === 'selle') p.shop.selle += 1;
          else if (id === 'ombre') p.shop.ombre = true;
          else if (id === 'fusil') p.shop.fusil = true;
          else p.shop[id] += 1;
          s.log.push({ seat: seatIndex, msg: `Achat : ${SHOP_CARDS.find(c => c.id === id).name}.` });
          return { valid: true, state: s };
        }

        case 'shopDone': {
          if (s.phase !== 'shop') return { valid: false, state };
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'trainTravel': {
          if (s.phase !== 'train') return { valid: false, state };
          const to = mv.to;
          if (!STATION_IDS.includes(to) || to === p.pos || p.money < 50 || p.trainUses >= MAX_TRAIN) return { valid: false, state };
          p.money -= 50;
          p.trainUses += 1;
          p.pos = to;
          s.log.push({ seat: seatIndex, msg: `Train vers ${NODES[to].l}.` });
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'skipTrain': {
          if (s.phase !== 'train') return { valid: false, state };
          nextTurn(s);
          return { valid: true, state: s };
        }

        case 'heistAttempt': {
          if (s.phase !== 'heist') return { valid: false, state };
          const r = roll2d6();
          if (r >= HEIST_TARGET) {
            s.finished = true;
            s.winner = seatIndex;
            s.log.push({ seat: seatIndex, msg: `BRAQUAGE RÉUSSI (${r}) !` });
          } else {
            s.log.push({ seat: seatIndex, msg: `Braquage raté (${r}).` });
            nextTurn(s);
          }
          return { valid: true, state: s };
        }

        case 'skipHeist': {
          if (s.phase !== 'heist') return { valid: false, state };
          nextTurn(s);
          return { valid: true, state: s };
        }

        default:
          return { valid: false, state };
      }
    } catch (e) {
      return { valid: false, state };
    }
  },

  result(state, seatIds) {
    if (!state.finished) return { finished: false };
    const scores = {};
    seatIds.forEach((id, i) => { scores[id] = state.players[i].money; });
    return { finished: true, scores, summary: `Le joueur ${state.winner + 1} a réussi le braquage de la banque !` };
  },

  botMove(state, seatIndex) {
    if (state.finished) return null;
    if (state.phase === 'duel-redo') {
      if (state.pendingDuel && state.pendingDuel.loser === seatIndex) {
        const p = state.players[seatIndex];
        const idx = p.missions.findIndex(m => m.done);
        if (idx >= 0) return { type: 'redoPick', missionIdx: idx };
      }
      return null;
    }
    if (seatIndex !== state.turn) return null;
    const p = state.players[seatIndex];
    switch (state.phase) {
      case 'turn-start':
        return p.failedIdx != null ? { type: 'retry' } : { type: 'roll' };
      case 'moving': {
        const otherHere = state.players.findIndex((q, i) => i !== seatIndex && q.pos === p.pos);
        if (otherHere >= 0 && duelAllowedHere(state, seatIndex, otherHere) && Math.random() < 0.3) {
          return { type: 'declareDuel', target: otherHere };
        }
        const undone = p.missions.find(m => !m.done);
        let targetId = BANK_ID;
        if (undone) { const n = nodeByLabel(MISSION_POOL[undone.m].dest); if (n) targetId = n.id; }
        const dist = bfsDist(targetId);
        const open = ADJ[p.pos].filter(n => !state.blocks[n]);
        if (open.length === 0) return { type: 'stop' };
        let best = open[0], bestD = Infinity;
        for (const n of open) { if (dist[n] < bestD) { bestD = dist[n]; best = n; } }
        return { type: 'step', to: best };
      }
      case 'mission-roll':
        return { type: 'missionRoll', useTrefle: p.shop.trefle > 0, useRevolver: 0 };
      case 'shop':
        return { type: 'shopDone' };
      case 'train':
        return { type: 'skipTrain' };
      case 'heist':
        return { type: 'heistAttempt' };
      case 'duel':
        return { type: 'duelRoll', useRevolver: 0 };
      default:
        return null;
    }
  },

  render(container, ctx) {
    const { state, mySeatIndex, myTurn, playerName, onMove } = ctx;
    const p = state.players[mySeatIndex] || state.players[0];
    const seat = mySeatIndex != null ? mySeatIndex : 0;

    const esc = (str) => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const playersHtml = state.players.map((pl, i) => {
      const name = playerName ? playerName(i) : `Joueur ${i + 1}`;
      const here = i === state.turn ? ' adlg-active' : '';
      const missionsDone = pl.missions.filter(m => m.done).length;
      return `<div class="adlg-player${here}">
        <div class="adlg-player-name">${esc(name)} ${i === state.turn ? '🎯' : ''}</div>
        <div class="adlg-player-stats">💰 ${pl.money}$ · ⭐ ${esc(PRIME_NAMES[pl.prime])} · 🗒️ ${missionsDone}/5</div>
      </div>`;
    }).join('');

    let actionsHtml = '';
    if (state.finished) {
      actionsHtml = `<div class="adlg-banner">🏁 ${esc(state.winner === seat ? 'Tu as gagné !' : `Le joueur ${state.winner + 1} a gagné.`)}</div>`;
    } else if (state.phase === 'duel-redo') {
      if (state.pendingDuel && state.pendingDuel.loser === seat) {
        const opts = p.missions.map((m, i) => m.done ? `<button class="adlg-btn" data-action="redoPick" data-idx="${i}">Annuler "${esc(MISSION_POOL[m.m].title)}"</button>` : '').join('');
        actionsHtml = `<div class="adlg-banner">Tu as perdu le duel : choisis une mission à annuler.</div><div class="adlg-actions">${opts}</div>`;
      } else {
        actionsHtml = `<div class="adlg-banner">En attente de la décision de l'adversaire vaincu…</div>`;
      }
    } else if (!myTurn) {
      actionsHtml = `<div class="adlg-banner">Au tour de ${esc(playerName ? playerName(state.turn) : `Joueur ${state.turn + 1}`)}…</div>`;
    } else {
      switch (state.phase) {
        case 'turn-start': {
          const failBtn = p.failedIdx != null
            ? `<button class="adlg-btn" data-action="retry">Retenter "${esc(MISSION_POOL[p.missions[p.failedIdx].m].title)}"</button>`
            : '';
          actionsHtml = `<div class="adlg-actions">${failBtn}<button class="adlg-btn adlg-btn-primary" data-action="roll">🎲 Lancer les dés</button></div>`;
          break;
        }
        case 'moving': {
          const choices = ADJ[p.pos].filter(n => !state.blocks[n]).map(n =>
            `<button class="adlg-btn" data-action="step" data-to="${n}">→ ${esc(NODES[n].l || `(${NODES[n].r},${NODES[n].c})`)}</button>`
          ).join('');
          const others = state.players.map((pl, i) => i !== seat && pl.pos === p.pos ? i : -1).filter(i => i >= 0);
          const duelBtns = others.filter(i => duelAllowedHere(state, seat, i))
            .map(i => `<button class="adlg-btn adlg-btn-danger" data-action="declareDuel" data-target="${i}">⚔️ Duel vs ${esc(playerName ? playerName(i) : `Joueur ${i + 1}`)}</button>`).join('');
          const stopBtn = `<button class="adlg-btn" data-action="stop">⏹️ Arrêter le déplacement</button>`;
          actionsHtml = `<div class="adlg-banner">Déplacements restants : ${state.stepsLeft}</div><div class="adlg-actions">${choices}${duelBtns}${stopBtn}</div>`;
          break;
        }
        case 'mission-roll': {
          const mission = MISSION_POOL[p.missions[state.pendingMissionSlot].m];
          actionsHtml = `<div class="adlg-banner">Mission "${esc(mission.title)}" — score requis ${mission.minScore} (Bonus de Prime : +${PRIME_BONUS[p.prime]})</div>
          <div class="adlg-actions">
            ${p.shop.trefle > 0 ? `<label class="adlg-check"><input type="checkbox" id="adlg-trefle"> 🍀 Trèfle (-1 score, +50$)</label>` : ''}
            ${p.shop.revolver > 0 ? `<label class="adlg-check"><input type="checkbox" id="adlg-revolver"> 🔫 Revolver (+2)</label>` : ''}
            <button class="adlg-btn adlg-btn-primary" data-action="missionRoll">🎲 Tenter la mission</button>
          </div>`;
          break;
        }
        case 'shop': {
          const cards = SHOP_CARDS.map(c => {
            const disabled = state.shopStock[c.id] <= 0 || p.money < SHOP_PRICE || state.buysThisVisit >= MAX_BUY_PER_TURN || (c.id === 'ombre' && p.shop.ombre) || (c.id === 'fusil' && p.shop.fusil);
            return `<button class="adlg-btn adlg-shop-card" data-action="shopBuy" data-card="${c.id}" ${disabled ? 'disabled' : ''}>${c.icon} ${esc(c.name)} — 50$ (stock ${state.shopStock[c.id]})</button>`;
          }).join('');
          actionsHtml = `<div class="adlg-banner">Magasin (achats restants : ${MAX_BUY_PER_TURN - state.buysThisVisit})</div><div class="adlg-actions adlg-shop">${cards}<button class="adlg-btn" data-action="shopDone">Terminer</button></div>`;
          break;
        }
        case 'train': {
          const stations = STATION_IDS.filter(id => id !== p.pos).map(id =>
            `<button class="adlg-btn" data-action="trainTravel" data-to="${id}">🚂 ${esc(NODES[id].l)}</button>`
          ).join('');
          actionsHtml = `<div class="adlg-banner">Voyage en train (50$, ${MAX_TRAIN - p.trainUses} restants)</div><div class="adlg-actions">${stations}<button class="adlg-btn" data-action="skipTrain">Ignorer</button></div>`;
          break;
        }
        case 'heist': {
          actionsHtml = `<div class="adlg-banner">5/5 missions et ${p.money}$ en poche : tente le braquage final (2d6 ≥ 9) !</div>
          <div class="adlg-actions"><button class="adlg-btn adlg-btn-primary" data-action="heistAttempt">🏦 Braquer la banque</button><button class="adlg-btn" data-action="skipHeist">Pas encore</button></div>`;
          break;
        }
        case 'duel': {
          actionsHtml = `<div class="adlg-banner">Duel déclaré !</div>
          <div class="adlg-actions">
            ${p.shop.revolver > 0 ? `<label class="adlg-check"><input type="checkbox" id="adlg-revolver"> 🔫 Revolver (+2)</label>` : ''}
            <button class="adlg-btn adlg-btn-danger" data-action="duelRoll">⚔️ Lancer le duel</button>
          </div>`;
          break;
        }
        default:
          actionsHtml = '';
      }
    }

    const missionsHtml = p.missions.map(m => {
      const mission = MISSION_POOL[m.m];
      return `<li class="adlg-mission${m.done ? ' adlg-mission-done' : ''}">${m.done ? '✅' : '⬜'} ${esc(mission.title)} → ${esc(mission.dest)} (score ${mission.minScore}, ${mission.reward}$)</li>`;
    }).join('');

    const logHtml = state.log.slice(-6).reverse().map(l => `<div class="adlg-log-line">${esc(l.msg)}</div>`).join('');

    container.innerHTML = `
      <div class="adlg-root">
        <div class="adlg-players">${playersHtml}</div>
        <div class="adlg-main">
          <div class="adlg-me">
            <div class="adlg-me-stats">💰 ${p.money}$ · ⭐ ${esc(PRIME_NAMES[p.prime])} (bonus +${PRIME_BONUS[p.prime]}) · 🎴 ${p.shop.block + p.shop.revolver + p.shop.trefle + p.shop.selle + (p.shop.fusil ? 1 : 0) + (p.shop.ombre ? 1 : 0)} cartes</div>
            <ul class="adlg-missions">${missionsHtml}</ul>
          </div>
          ${actionsHtml}
          <div class="adlg-log">${logHtml}</div>
        </div>
      </div>`;

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const trefleEl = container.querySelector('#adlg-trefle');
        const revolverEl = container.querySelector('#adlg-revolver');
        switch (action) {
          case 'retry': onMove({ type: 'retry' }); break;
          case 'roll': onMove({ type: 'roll' }); break;
          case 'step': onMove({ type: 'step', to: Number(btn.getAttribute('data-to')) }); break;
          case 'declareDuel': onMove({ type: 'declareDuel', target: Number(btn.getAttribute('data-target')) }); break;
          case 'stop': onMove({ type: 'stop' }); break;
          case 'duelRoll': onMove({ type: 'duelRoll', useRevolver: revolverEl && revolverEl.checked ? 2 : 0 }); break;
          case 'redoPick': onMove({ type: 'redoPick', missionIdx: Number(btn.getAttribute('data-idx')) }); break;
          case 'missionRoll': onMove({ type: 'missionRoll', useTrefle: !!(trefleEl && trefleEl.checked), useRevolver: revolverEl && revolverEl.checked ? 2 : 0 }); break;
          case 'shopBuy': onMove({ type: 'shopBuy', cardId: btn.getAttribute('data-card') }); break;
          case 'shopDone': onMove({ type: 'shopDone' }); break;
          case 'trainTravel': onMove({ type: 'trainTravel', to: Number(btn.getAttribute('data-to')) }); break;
          case 'skipTrain': onMove({ type: 'skipTrain' }); break;
          case 'heistAttempt': onMove({ type: 'heistAttempt' }); break;
          case 'skipHeist': onMove({ type: 'skipHeist' }); break;
        }
      });
    });
  },
};
