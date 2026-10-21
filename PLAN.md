# iMessage Simulator — PLAN.md

MVP privé pour la collection de builds **code-ste**. Simulation d'une conversation iMessage sur un iPhone 17 vu de face, messages qui arrivent un à un, sons Apple, rendu pixel-fidèle (police, tailles, bulles, tapbacks).

**Stack** : Next.js (App Router) · TailwindCSS · Framer Motion · TypeScript

---

## 1. Objectifs

- Écran iPhone 17 vu de face, centré sur un fond neutre (gradient Apple-like).
- Barre de statut complète et éditable : heure, 5G / Wi-Fi, batterie %.
- App Messages ouverte sur une conversation, pilotée par un **scénario JSON**.
- Messages qui apparaissent un à un, avec indicateur de frappe, sons envoi/réception, Delivered/Read.
- Fidélité maximale : même police, mêmes tailles, mêmes bulles de réaction (tapbacks) que iOS.
- Architecture prête pour : flip/tilt 3D, vibration, appel entrant, impact tactile.

**Hors périmètre MVP** : éditeur visuel, export vidéo, multi-conversations, 3D réelle.

---

## 2. Décisions de conception

| Sujet | Décision |
|---|---|
| Vue | Face, écran à plat. 3D en V3 via CSS 3D transforms (pas de Three.js). |
| Résolution de référence | iPhone 17 : **402 × 874 pt** (@3x = 1206 × 2622 px). À valider sur une capture réelle. |
| Échelle | Le téléphone est dessiné en pt, puis mis à l'échelle avec `transform: scale()` selon la hauteur de viewport. |
| Moteur | Machine à états pilotée par un scénario JSON. L'UI n'est qu'un rendu de l'état. |
| Police | **SF Pro** en local (usage privé), `font-family: -apple-system, "SF Pro Text", Inter, system-ui`. Fichiers dans `public/fonts/` (gitignorés). |
| Sons | Fichiers audio locaux dans `public/sounds/` (gitignorés), chargés via Web Audio API. |
| Vibration | `navigator.vibrate` inexistant sur iOS Safari → shake visuel Framer Motion (+ vibrate sur Android en bonus). |
| Repo | Privé. Aucun asset Apple (font, sons) commité. |

---

## 3. Design tokens iMessage (à calibrer sur capture de référence)

> Valeurs de départ. À ajuster en superposant le rendu sur un vrai screenshot iPhone 17 (iOS 26).

```ts
// src/lib/tokens.ts
export const tokens = {
  screen: { width: 402, height: 874, radius: 55 },
  font: {
    body: { size: 17, lineHeight: 22, weight: 400 },       // texte des bulles
    caption: { size: 11, weight: 400 },                    // timestamps, Delivered
    title: { size: 17, weight: 600 },                      // nom du contact
    status: { size: 17, weight: 600 },                     // heure barre de statut
  },
  bubble: {
    radius: 18,
    paddingX: 12,
    paddingY: 7,
    maxWidthRatio: 0.72,
    gapSameSender: 2,
    gapDifferentSender: 8,
  },
  color: {
    sent: "#0A84FF",         // bleu iMessage (envoyé)
    received: "#E9E9EB",     // gris clair (reçu)
    receivedDark: "#26252A",
    text: { sent: "#FFFFFF", received: "#000000", receivedDark: "#FFFFFF" },
  },
  tapback: {
    size: 26,
    offset: { x: -8, y: -10 },    // décalage par rapport au coin de la bulle
    borderWidth: 2,               // anneau de la couleur du fond
    fromMe: "#0A84FF",
    fromOther: "#E9E9EB",
  },
};
```

**Règles tapbacks** (à vérifier à l'écran) :
- Sur un message **reçu** : tapback en haut à droite de la bulle.
- Sur un message **envoyé** : tapback en haut à gauche de la bulle.
- Couleur de la pastille : bleue si la réaction vient de moi, grise si elle vient de l'autre.
- Types : `heart`, `thumbsUp`, `thumbsDown`, `haha`, `exclamation`, `question`.
- Animation : pop en spring (scale 0 → 1.15 → 1) avec léger décalage après l'apparition de la bulle.

**Queues de bulle** : une queue uniquement sur le **dernier** message d'une série du même expéditeur.

---

## 4. Structure du projet

```
imessage-sim/
├─ PLAN.md
├─ public/
│  ├─ fonts/            # SF Pro (gitignoré)
│  └─ sounds/           # send.m4a, receive.m4a, tapback.m4a, keyboard.m4a (gitignoré)
├─ scenarios/
│  └─ demo.json
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                  # écran "Touch pour démarrer" + Stage
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ Stage.tsx                 # fond + scaling + (futur) 3D wrapper
│  │  ├─ iPhoneFrame.tsx           # bezel, Dynamic Island, boutons latéraux
│  │  ├─ StatusBar.tsx             # heure, 5G, Wi-Fi, batterie
│  │  ├─ ConversationHeader.tsx    # avatar, nom, FaceTime
│  │  ├─ MessageList.tsx           # scroll auto + AnimatePresence
│  │  ├─ MessageBubble.tsx         # bulle + queue + tapbacks
│  │  ├─ TapbackBadge.tsx
│  │  ├─ TypingIndicator.tsx       # trois points animés
│  │  ├─ InputBar.tsx              # champ iMessage + bouton +
│  │  ├─ Keyboard.tsx              # (V2) clavier iOS
│  │  ├─ HomeIndicator.tsx
│  │  └─ Controls.tsx              # play / pause / reset / vitesse (hors téléphone)
│  ├─ engine/
│  │  ├─ types.ts                  # types du scénario
│  │  ├─ useScenario.ts            # hook : timeline + état
│  │  └─ timeline.ts               # planification des événements
│  ├─ audio/
│  │  └─ sounds.ts                 # préchargement + play via Web Audio API
│  └─ lib/
│     ├─ tokens.ts
│     └─ icons/                    # SVG signal / 5G / wifi / batterie
└─ tailwind.config.ts
```

---

## 5. Format du scénario JSON

```json
{
  "meta": {
    "title": "Démo",
    "theme": "light",
    "contact": { "name": "Instinct", "avatar": null },
    "statusBar": {
      "time": "9:41",
      "network": "5G",
      "wifi": true,
      "battery": 87,
      "charging": false
    }
  },
  "events": [
    { "type": "timestamp", "label": "Aujourd'hui 10:09" },
    {
      "type": "message",
      "from": "them",
      "text": "The Firm : jeudi et vendredi, tout est en liste d'attente.",
      "delay": 800,
      "typing": 1600
    },
    {
      "type": "message",
      "from": "me",
      "text": "Donc jeudi pas confirmé ?",
      "delay": 1200,
      "typing": 900
    },
    {
      "type": "tapback",
      "target": 1,
      "from": "them",
      "kind": "thumbsUp",
      "delay": 600
    },
    {
      "type": "message",
      "from": "them",
      "text": "Non, jeudi n'est pas réservé.",
      "delay": 1000,
      "typing": 1400
    },
    { "type": "status", "value": "delivered", "target": 1, "delay": 500 },
    { "type": "status", "value": "read", "target": 1, "delay": 1500 }
  ]
}
```

**Champs** :

| Champ | Description |
|---|---|
| `type` | `timestamp` · `message` · `tapback` · `status` (V2+ : `call`, `vibrate`, `battery`) |
| `from` | `me` (bulle bleue, droite) ou `them` (bulle grise, gauche) |
| `delay` | Pause avant l'événement (ms), multipliée par le facteur de vitesse |
| `typing` | Durée de frappe en ms : indicateur pour `them`, saisie progressive et touches animées pour `me`. Pour `me`, durée automatique si absent ; `0` désactive la saisie simulée. |
| `target` | Index de l'événement `message` visé (0-based, comptant uniquement les messages) |
| `kind` | `heart` · `thumbsUp` · `thumbsDown` · `haha` · `exclamation` · `question` |

---

## 6. Moteur de timeline

États d'une conversation :

```ts
type PlayerState = "idle" | "playing" | "paused" | "finished";

interface ConversationState {
  visibleMessages: Message[];
  typingFrom: "me" | "them" | null;
  statusByMessage: Record<number, "delivered" | "read">;
  tapbacks: Record<number, Tapback[]>;
}
```

Séquence pour un message `them` :
1. `await delay`
2. `typingFrom = "them"` → indicateur de frappe visible pendant `typing` ms
3. `typingFrom = null` → bulle ajoutée + son **receive**
4. Scroll auto en bas (spring)

Séquence pour un message `me` :
1. `await delay`
2. Texte tapé progressivement dans l'`InputBar` avec clavier AZERTY et effet ping sur chaque touche ; `typing` règle la durée, puis pause de 220 ms avant envoi
3. Bulle ajoutée + son **send**

Exigences : pause/reprise propre (annulation des timers), reset total, facteur de vitesse (0.5× / 1× / 2×).

---

## 7. Animations (Framer Motion)

- **Apparition d'une bulle** : fondu et glissement de 8 pt en 200 ms, sans zoom ni ressort ; animation portée par la bulle elle-même pour éviter de déformer le texte.
- **Réorganisation de la liste** : `layout="position"` sur les lignes et `layoutScroll` sur la liste ; les déplacements sont séparés de l’apparition, sans animation de taille. Animations et défilement fluide désactivés si la réduction des mouvements est demandée.
- **Indicateur de frappe** : trois points en boucle avec opacité décalée.
- **Tapback** : pop spring en scale, léger rebond.
- **Shake (V3, vibration)** : `animate={{ x: [0, -4, 4, -3, 3, 0] }}` sur le conteneur du téléphone.
- **Tilt / flip (V3)** : `useMotionValue` + `useTransform` sur `rotateX/rotateY`, `perspective: 1200px`, `transform-style: preserve-3d`.

---

## 8. Audio

- Fichiers : `send`, `receive`, `tapback`, `keyboard` (optionnel).
- Préchargement via `fetch` → `AudioContext.decodeAudioData`, lecture avec `AudioBufferSourceNode` (latence minimale).
- L'`AudioContext` n'est créé qu'après un **geste utilisateur** (écran "Touch pour démarrer"), sinon Safari et Chrome bloquent la lecture.
- Gestion du mute global dans `Controls`.
- Les sons restent locaux et gitignorés (repo privé, aucun asset Apple publié).

---

## 9. Phases

### Phase 1 — MVP

- [x] Init projet Next.js + Tailwind + Framer Motion, configuration TypeScript
- [ ] `tokens.ts` + chargement de SF Pro (`@font-face` local) avec repli — tokens complétés et reliés au rendu via variables CSS (dimensions, typographie, bulles, réactions) ; chargement local configuré, fichier SF Pro encore absent
- [x] `iPhoneFrame` + `StatusBar` (5G, Wi-Fi, batterie %) + Dynamic Island + `HomeIndicator`
- [x] `ConversationHeader`, `MessageList`, `MessageBubble` (queues, séries, couleurs) — queues sur le dernier message de chaque série, espacement de 2 pt dans une série et 8 pt entre expéditeurs ; fidélité à calibrer
- [x] `TapbackBadge` aux bonnes positions — positions définies en CSS ; comparaison visuelle de référence à faire
- [x] Moteur : `useScenario` + lecture du JSON
- [x] `TypingIndicator`
- [x] Sons Web Audio + écran "Touch pour démarrer" — envoi, réception et réactions envoyées/reçues disponibles en local, hors Git
- [x] Contrôles : play / pause / reset / vitesse
- [x] Scale responsive du téléphone
- [ ] **Calibrage pixel** : superposition avec une capture de référence iPhone 17

**État au 21 octobre 2026 : 9 étapes sur 11 implémentées.** Les coches indiquent la présence de l’implémentation, pas une validation pixel-fidèle. Les images de `public/images/` ont été consultées comme références ; aucune superposition de calibration n’a encore été réalisée.

**Vérifications effectuées** : `npm run lint` et `npm run build` passent. Vérifications ciblées de la timeline (délais, frappe entrante, cibles), du chargement/cache audio avec contexte simulé et de la disponibilité HTTP des sons réalisées. Validation visuelle complète dans un navigateur et fidélité des sons à iOS 26 encore à confirmer.

### Ajouts réalisés au MVP

- [x] Bouton Settings Lucide fixé à droite, au-dessus du slider vertical de zoom (50–150 %), coins `rounded-xl`
- [x] Modale personnalisée centrée, fond flouté et animations d’ouverture/fermeture
- [x] Gestion du focus, fermeture par Échap / clic extérieur / croix et blocage de l’arrière-plan
- [x] Réglages en direct : son, vitesse, nom du contact, heure, Wi-Fi et batterie — conservés pendant la session
- [x] Heure libre (ex. `9:81`) et batterie sans plafond à 100 % dans les réglages et le JSON ; remplissage vert et proportionnel au-delà de 100 %
- [x] Photos de profil importées dans les réglages, recadrées au centre en 256 × 256 et conservées par nom de contact dans le navigateur ; aperçu, remplacement, suppression et affichage dans l’en-tête et le choix des conversations
- [x] Boutons d’écoute des quatre sons dans les paramètres
- [x] Documentation des assets locaux et de leur provenance dans `README.md`
- [x] Réactions multiples disposées côte à côte, sans superposition
- [x] Animations des bulles et réactions adaptées à la préférence de réduction des mouvements

### Phase 2

- [x] Delivered / Read sous le dernier message envoyé — libellés français « Distribué » / « Lu », pilotés par le scénario
- [ ] Mode sombre
- [x] Clavier iOS animé + saisie dans l'`InputBar` — rendu HTML/CSS personnalisé, QWERTY par défaut comme la référence, AZERTY sélectionnable ; touches/ping et prévisualisation des lettres, accents et emoji, clavier numérique pour ponctuation ; saisie synchronisée avec pause, reset et vitesse. Proportions et styles repris depuis la capture ; validation visuelle finale à faire.
- [x] Éditeur de scénario JSON dans la modale des paramètres, section dédiée — validation, aperçu manuel (fermeture de la modale), aperçu live après 650 ms sans modification et brouillon conservé pendant la session
- [x] Plusieurs scénarios sélectionnables dans le menu de démarrage de l’iPhone — trois exemples recommandés et jusqu’à dix scénarios personnels enregistrés dans le navigateur ; bouton de démarrage conservé sous la liste défilante
- [x] Images envoyées/reçues dans les messages : import et réimport depuis l’éditeur, légende facultative, conservation des proportions, réactions et statuts compatibles. Fichiers uniquement en mémoire jusqu’au rechargement ou à la fermeture ; seul leur emplacement est conservé dans les scénarios enregistrés.

### Phase 3

- [ ] Flip / tilt 3D au drag, face arrière du téléphone
- [ ] Vibration simulée (shake) liée aux événements
- [ ] Appel entrant (écran d'appel, sonnerie)
- [ ] Impact tactile (ripple au touch/clic sur l'écran) — effet ping déjà présent sur les touches lors de la saisie du scénario ; interaction libre avec tout l’écran à faire
- [ ] Export vidéo (Playwright + ffmpeg, ou MediaRecorder)

---

## 10. Points de vigilance

- **Fidélité** : fixer la version iOS de référence (iOS 26 / design Liquid Glass) et comparer avec une vraie capture iPhone 17 avant de valider les tokens.
- **Autoplay audio** : toujours déclencher l'audio après un clic.
- **Performances** : animer uniquement `transform` et `opacity`, éviter les re-renders globaux (état de timeline isolé dans le hook).
- **Scaling** : dessiner en pt fixes puis scaler, plutôt que d'utiliser des unités relatives partout.
- **Assets Apple** : SF Pro et sons restent hors Git. Prévoir un `README` listant où les déposer.

---

## 11. Questions ouvertes

1. Version d'iOS cible exacte (iOS 26 avec Liquid Glass ?) pour la barre de saisie et l'en-tête.
2. Thème par défaut : clair ou sombre ?
3. Langue de l'interface simulée (heure au format 24h, libellés "Distribué"/"Lu" en français ?).
4. Source des sons (fichiers extraits d'un appareil perso ou autres).
5. Export vidéo : à prévoir dès la Phase 2 si l'usage principal est de publier sur X.
