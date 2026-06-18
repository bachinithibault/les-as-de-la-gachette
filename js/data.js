// ============================================================
// data.js — Toutes les CONSTANTES et données statiques du jeu.
// Modifier une mission, une carte hasard, une carte magasin ou
// une case du plateau ne touche QUE ce fichier.
// ============================================================

const COLORS=['#A13A2A','#4A8A86','#C9A227','#8B6FA3','#7C9A5E','#C97B3D','#5C7A99','#8B5E3C'];
const PRIME_NAMES=['Le Bleu','Voyou','Cow-boy','Fin Tireur','As de la Gâchette'];
// Niveau 1 = aucun bonus ; le bonus de prime n'apparaît qu'à partir du niveau 2.
const PRIME_BONUS=[0,1,2,3,4];
const PRIME_MONEY=[30,60,90,120,200];
const BOT_NAMES=['Jesse James','Doc Holliday','Black Bart','Belle Starr','Calamity Jane'];
const MAX_TRAIN=3;
// Taille des cases légèrement augmentée (42→46 / 24→26) ; le plateau est ensuite
// mis à l'échelle en CSS (voir #board-wrap / #cv) pour remplir exactement la hauteur de page.
const CELL=46,PAD=26;
const BLOCK_PRICE=40,MAX_BUY_PER_TURN=3,BLOCK_DURATION=2;
const PROFILE_KEY='gachette_profile';

// Barème des récompenses par score minimum (2026-06-18, Thibault) : toutes les missions
// partageant le même score minimum rapportent EXACTEMENT le même montant, et ce montant
// augmente avec le score minimum exigé (plus dur = plus payant).
// Équilibrage : un tirage type (4 missions normales au pool mixte 5/6/7 + 1 mission
// difficile obligatoire à 9, voir HARD_IDX) rapporte en moyenne ~1350$ si tout réussit —
// suffisant pour dépasser le seuil de 1000$ requis pour le braquage final (départ 200$)
// tout en laissant une marge pour les achats au magasin (50$/carte), le train (50$/trajet)
// et les pertes de duel (-50$), sans rendre la victoire automatique.
const MISSION_REWARD_BY_SCORE={5:200,6:260,7:325,9:450};

const MISSION_POOL=[
  {title:'Vol de diligence',     body:'Arrête la diligence.',                  minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Los Lobos',      two:false},
  {title:'Braquage local',       body:'Dévalisez Dusty Creek.',                minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Dusty Creek',     two:false},
  {title:'Capture de bandit',    body:'Ramène le hors-la-loi.',                minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Coyote Peak',     two:false},
  {title:'Passage à Redrock',    body:'Traverse les plaines.',                 minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Redrock',         two:false},
  {title:'Embuscade',            body:'Tends une embuscade.',                  minScore:6, reward:MISSION_REWARD_BY_SCORE[6],dest:"Devil's Pass",   two:false},
  {title:'Fuite à cheval',       body:'Échappe au shérif.',                    minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Snake Bend',      two:false},
  {title:"Convoi d'or",          body:'Intercepte le convoi.',                 minScore:7, reward:MISSION_REWARD_BY_SCORE[7],dest:'Amber Falls',     two:false},
  {title:'Fusillade',            body:'Survie à la fusillade.',                minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Badwater',        two:false},
  {title:'Prisonnier évadé',     body:'Retrouve le prisonnier.',               minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Fort Diablo',     two:false},
  {title:'Sabotage ferroviaire', body:'Fais sauter les rails.',                minScore:7, reward:MISSION_REWARD_BY_SCORE[7],dest:'Ghost Valley',    two:false},
  {title:'Vendetta',             body:'Rejoins Saloon Ridge.',                 minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Saloon Ridge',    two:false},
  {title:'Carte au trésor',      body:'Suis les indices.',                     minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Rio Seco',        two:false},
  {title:'Règlement de comptes', body:'Retrouve ton ennemi.',                  minScore:6, reward:MISSION_REWARD_BY_SCORE[6],dest:'Black Mesa',      two:false},
  {title:'Razzia',               body:'Attaque le camp.',                      minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Los Lobos',       two:false},
  {title:'Trafic de chevaux',    body:'Récupère les chevaux.',                 minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Amber Falls',     two:false},
  {title:'Règle du silence',     body:'Intimide les témoins.',                 minScore:6, reward:MISSION_REWARD_BY_SCORE[6],dest:'Dusty Creek',     two:false},
  {title:'Hold-up à Tombstone',  body:'Vide le coffre de la banque locale.',   minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Tombstone Creek', two:true},
  {title:"Chasse à l'homme",     body:'Traque le tueur à gages.',              minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Vulture Gulch',   two:true},
  {title:'Le dernier train',     body:'Stoppe le train blindé.',               minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Silver Hollow',   two:true},
  {title:'Duel au sommet',       body:'Affronte le pistolero légendaire.',     minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Coyote Peak',     two:true},
  {title:'Raid nocturne',        body:'Pille le campement militaire.',         minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Ghost Valley',    two:true},
  {title:'La rançon',            body:"Libère l'otage sans te faire repérer.", minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Fort Diablo',     two:true},
  {title:'Le grand coup',        body:'Braque la diligence présidentielle.',   minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Redrock',         two:true},
  {title:'Tête mise à prix',     body:'Élimine le hors-la-loi le plus recherché.',minScore:9, reward:MISSION_REWARD_BY_SCORE[9],dest:'Snake Bend',   two:true},
  {title:'Cargaison perdue',     body:'Retrouve la cargaison volée.',          minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Badwater',        two:false},
  {title:'Messager pressé',      body:'Livre un message urgent.',              minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Black Mesa',      two:false},
  {title:'Bétail égaré',         body:'Ramène le troupeau égaré.',             minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Rio Seco',        two:false},
  {title:'Eau empoisonnée',      body:'Trouve la source du poison.',           minScore:5, reward:MISSION_REWARD_BY_SCORE[5],dest:'Amber Falls',     two:false},
  {title:'Le notaire véreux',    body:'Récupère les faux papiers.',            minScore:6, reward:MISSION_REWARD_BY_SCORE[6],dest:'Saloon Ridge',    two:false},
  {title:'Mine abandonnée',      body:'Explore la mine abandonnée.',           minScore:6, reward:MISSION_REWARD_BY_SCORE[6],dest:"Devil's Pass",   two:false},
  {title:'Caravane attaquée',    body:'Escorte la caravane marchande.',        minScore:7, reward:MISSION_REWARD_BY_SCORE[7],dest:'Dusty Creek',     two:false},
  {title:'Le passeur',           body:'Traverse la frontière sans encombre.',  minScore:7, reward:MISSION_REWARD_BY_SCORE[7],dest:'Los Lobos',       two:false},
];
const HARD_IDX=[16,17,18,19,20,21,22,23]; // 8 missions difficiles, toutes à score minimum 9

// Cartes Imprévu : 'bad' (perte d'argent), 'good' (gain d'argent), 'amb' (embuscade — voir chance.js :
// le joueur concerné choisit lui-même la case à bloquer, plus de tirage aléatoire).
const CHANCE_POOL=[
  {type:'bad', tag:'IMPRÉVU',       title:'Arrestation !',    body:'Le shérif t\'a repéré. -60$',  fx:p=>{p.money=Math.max(0,p.money-60);}},
  {type:'bad', tag:'IMPRÉVU',       title:'Cheval blessé !',  body:'Tu perds 40 $.',               fx:p=>{p.money=Math.max(0,p.money-40);}},
  {type:'bad', tag:'IMPRÉVU',       title:'Tempête de sable', body:'Tu perds 30 $.',               fx:p=>{p.money=Math.max(0,p.money-30);}},
  {type:'good',tag:'COUP DE CHANCE',title:'Lingot trouvé !',  body:'+80 $ — quelle veine !',       fx:p=>{p.money+=80;}},
  {type:'good',tag:'COUP DE CHANCE',title:'Informateur',      body:'Un tuyau en or. +60$',         fx:p=>{p.money+=60;}},
  {type:'good',tag:'COUP DE CHANCE',title:'Bonne réputation', body:'Les habitants aident. +50$',   fx:p=>{p.money+=50;}},
  {type:'amb', tag:'EMBUSCADE',     title:'Pillards !',       body:'Choisis la case à bloquer 2 tours.', fx:()=>{}},
  {type:'amb', tag:'EMBUSCADE',     title:'Patrouille',       body:'Choisis une case à bloquer 2 tours.', fx:()=>{}},
];

// ------------------------------------------------------------
// MAGASIN — registre extensible des cartes achetables.
// Pour ajouter une 7e carte : ajouter une entrée ici (le reste du
// code — shop.js, missions.js, duel.js — lit ce tableau dynamiquement).
//   kind:
//     'targeted'   → carte à usage unique qui demande de cliquer une case (Blocage)
//     'roll-buff'  → carte à usage unique qui ajoute un bonus choisi à un lancer (Revolver)
//     'mission-buff' → carte à usage unique qui modifie une mission tentée (Trèfle)
//     'permanent-stack'    → effet permanent qui s'additionne à chaque achat (Selle)
//     'permanent-flag'     → effet binaire ; ici, Fusil est consommé (flag remis à false) dès
//                            qu'il sert dans un duel — voir duel.js openDuelModal — et doit être racheté
//     'permanent-unique'   → effet permanent non cumulable, achat unique (Comme son ombre)
// ------------------------------------------------------------
const SHOP_STOCK_PER_CARD=8;
// Les 6 cartes ont toutes le même prix (50$) — aucune carte n'est avantagée par rapport
// aux autres au moment de l'achat ; seuls leurs effets en jeu diffèrent.
const SHOP_PRICE=50;
const SHOP_CARDS=[
  {id:'block',    name:'Blocage',          icon:'⭐', price:SHOP_PRICE, kind:'targeted',
    desc:'Bloque la case de ton choix (hors villes et banque) pendant 2 tours.'},
  {id:'revolver', name:'Revolver',         icon:'🔫', price:SHOP_PRICE, kind:'roll-buff',
    desc:"Usage unique : +1 ou +2 (à ton choix) à un lancer de mission ou de duel, en attaque comme en défense."},
  {id:'trefle',   name:'Trèfle',           icon:'🍀', price:SHOP_PRICE, kind:'mission-buff',
    desc:"Usage unique : -1 au score minimum d'une mission (pas la banque, pas les duels) et +50$ si elle réussit."},
  {id:'selle',    name:'Selle',            icon:'🐴', price:SHOP_PRICE, kind:'permanent-stack',
    desc:'Effet permanent et cumulable : +1 au total des dés de déplacement.'},
  {id:'fusil',    name:'Fusil',            icon:'🔭', price:SHOP_PRICE, kind:'permanent-flag',
    desc:"À usage unique : augmente d'1 case la portée de duel. Si utilisé contre un adversaire sans Fusil à 2 cases d'écart, celui-ci perd 2 points à son lancer défensif. La carte est consommée dès qu'elle sert dans un duel (retour dans la pioche du magasin) — il faut la racheter pour l'utiliser à nouveau."},
  {id:'ombre',    name:'Comme son ombre',  icon:'🕶️', price:SHOP_PRICE, kind:'permanent-unique',
    desc:'Permanent, non cumulable : annule la pénalité de 2 points du Fusil quand tu te défends.'},
];
function shopCard(id){return SHOP_CARDS.find(c=>c.id===id);}

// BOARD (122 cases ; 16 villes ; 3 impasses de quête uniques à 3 cases)
// Le magasin historiquement le plus proche de Fort Diablo (r:3,c:9) a été retiré
// du plateau à la demande de Thibault (29).
// Ajustements 2026-06-18 (Thibault) : cases 8,1 et 10,1 supprimées ; case 6,4 ajoutée
// (reliée uniquement à 7,4 et 6,5 — voir EDGE_EXCLUDE) ; case 3,12 redevenue une case
// banale ('n', plus de hasard) ; case 2,0 ajoutée (reliée uniquement à 1,0 et 3,0 —
// voir EDGE_EXCLUDE).
const RAW=[
{r:0,c:1,t:'n'},{r:0,c:2,t:'c'},{r:0,c:3,t:'n'},{r:0,c:4,t:'m',l:'Los Lobos'},{r:0,c:5,t:'n'},{r:0,c:6,t:'c'},{r:0,c:7,t:'n'},{r:0,c:8,t:'s'},{r:0,c:9,t:'n'},{r:0,c:10,t:'m',l:'Dusty Creek'},{r:0,c:11,t:'n'},{r:1,c:1,t:'m',l:'Coyote Peak'},{r:1,c:4,t:'n'},{r:1,c:7,t:'n'},{r:2,c:1,t:'n'},{r:2,c:2,t:'s'},{r:2,c:3,t:'n'},{r:2,c:4,t:'n'},{r:2,c:5,t:'n'},{r:2,c:6,t:'m',l:'Redrock'},{r:2,c:7,t:'c'},{r:2,c:8,t:'n'},{r:2,c:9,t:'n'},{r:2,c:10,t:'n'},{r:2,c:11,t:'n'},{r:3,c:3,t:'n'},{r:3,c:6,t:'n'},{r:3,c:11,t:'m',l:'Fort Diablo'},{r:4,c:1,t:'n'},{r:4,c:2,t:'n'},{r:4,c:3,t:'m',l:'Rio Seco'},{r:4,c:4,t:'n'},{r:4,c:5,t:'c'},{r:4,c:6,t:'B',l:'BANQUE'},{r:4,c:7,t:'n'},{r:4,c:8,t:'n'},{r:4,c:9,t:'m',l:'Ghost Valley'},{r:4,c:11,t:'n'},{r:5,c:1,t:'s'},{r:5,c:3,t:'n'},{r:5,c:4,t:'T',l:'Central Station'},{r:5,c:6,t:'n'},{r:5,c:9,t:'c'},{r:5,c:11,t:'m',l:'Saloon Ridge'},{r:6,c:1,t:'n'},{r:6,c:2,t:'n'},{r:6,c:3,t:'c'},{r:6,c:4,t:'n'},{r:6,c:5,t:'m',l:"Devil's Pass"},{r:6,c:6,t:'n'},{r:6,c:7,t:'n'},{r:6,c:8,t:'n'},{r:6,c:9,t:'n'},{r:6,c:10,t:'s'},{r:6,c:11,t:'n'},{r:7,c:4,t:'n'},{r:7,c:6,t:'c'},{r:7,c:9,t:'n'},{r:7,c:11,t:'n'},{r:8,c:2,t:'c'},{r:8,c:3,t:'n'},{r:8,c:4,t:'m',l:'Amber Falls'},{r:8,c:5,t:'n'},{r:8,c:6,t:'s'},{r:8,c:7,t:'n'},{r:8,c:9,t:'n'},{r:8,c:10,t:'n'},{r:8,c:11,t:'m',l:'Black Mesa'},{r:9,c:1,t:'m',l:'Snake Bend'},{r:9,c:2,t:'n'},{r:9,c:4,t:'c'},{r:10,c:2,t:'n'},{r:9,c:7,t:'m',l:'Badwater'},{r:9,c:8,t:'n'},{r:9,c:9,t:'n'},{r:0,c:0,t:'T',l:'Comanche Station'},{r:1,c:0,t:'n'},{r:2,c:0,t:'n'},{r:3,c:0,t:'m',l:'Tombstone Creek'},{r:4,c:0,t:'n'},{r:6,c:0,t:'n'},{r:7,c:0,t:'c'},{r:8,c:0,t:'s'},{r:9,c:0,t:'n'},{r:0,c:12,t:'T',l:'Eastwind Station'},{r:1,c:12,t:'n'},{r:2,c:12,t:'c'},{r:3,c:12,t:'n'},{r:4,c:12,t:'n'},{r:8,c:12,t:'c'},{r:9,c:12,t:'n'},{r:10,c:3,t:'m',l:'Silver Hollow'},{r:10,c:4,t:'n'},{r:10,c:5,t:'n'},{r:10,c:6,t:'n'},{r:10,c:7,t:'n'},{r:10,c:9,t:'m',l:'Vulture Gulch'},{r:10,c:10,t:'s'},{r:10,c:11,t:'n'},{r:11,c:6,t:'n'},{r:12,c:6,t:'n'},{r:4,c:13,t:'n'},{r:4,c:14,t:'n'},{r:10,c:12,t:'T',l:'Southfork Station'},{r:10,c:0,t:'T',l:'Ironwood Station'},{r:4,c:-1,t:'n'},{r:4,c:-2,t:'n'},{r:5,c:-2,t:'q',l:'Trésor'},{r:3,c:14,t:'q',l:'Armurier'},{r:12,c:7,t:'q',l:"École Shérif"},{r:4,c:10,t:'T',l:'Prairie Station'}
];

// EDGE_EXCLUDE — exceptions à la règle d'adjacence automatique de board.js : certaines
// cases sont volontairement reliées à seulement UN SOUS-ENSEMBLE de leurs voisines
// géométriques (case par case, repérées par [r,c]).
// - 6,4 : reliée uniquement à 7,4 et 6,5 (pas à 5,4, ni à 6,3).
// - 2,0 : reliée uniquement à 1,0 et 3,0 (pas à 2,1).
const EDGE_EXCLUDE=[
  [[6,4],[5,4]],
  [[6,4],[6,3]],
  [[2,0],[2,1]],
];
