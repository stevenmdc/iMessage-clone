# iMessage Studio

MVP privé de simulateur iMessage : téléphone de face, scénario JSON, frappe animée, réactions, statuts Distribué/Lu et contrôles de lecture.

## Démarrer

```sh
npm install
npm run dev
```

Ouvrir http://localhost:3000 puis cliquer sur « Toucher pour démarrer ». Contrôles : pause/reprise, réinitialisation, vitesse 0.5× / 1× / 2× et son.

## Scénario

Modifier `scenarios/demo.json`. Les délais et durées de frappe sont en millisecondes ; 2× accélère la lecture. Les cibles des réactions et statuts comptent uniquement les messages, à partir de zéro. La barre de statut et le nom du contact viennent de `meta`.

Dans **Paramètres → Général → Photo de profil**, importer, remplacer ou retirer la photo du contact. Chaque photo est recadrée au centre, réduite à 256 × 256 et enregistrée localement par nom de contact. Elle reste disponible après rechargement et dans les autres conversations avec le même contact. Les photos importées restent dans ce navigateur ; effacer les données du site les supprime.

Dans **Paramètres → Éditeur JSON → Images de la conversation**, ajouter une image envoyée ou reçue, avec une légende facultative. Elle est ajoutée à la fin du scénario ; déplacer son événement JSON pour changer son emplacement. Les photos gardent leurs proportions et sont réduites à 1280 px maximum. Elles restent uniquement en mémoire pendant que l’app est ouverte et disparaissent au rechargement ou à la fermeture de l’onglet. Les scénarios enregistrés conservent les emplacements des images ; le bouton de réimport permet de rétablir une image à la session suivante.

## Assets privés facultatifs

- Police : déposer `SF-Pro-Text.woff2` dans `public/fonts/`. Repli sur la police système si absente.
- Audio : déposer `send.m4a`, `receive.m4a`, `tapback.m4a` dans `public/sounds/`. Aucun son si les fichiers sont absents. Audio initialisé au premier clic.
- Ces assets sont gitignorés. Aucun asset Apple fourni.

Les images de `public/images/` servent de références visuelles. La capture Messages guide le cadre, les bulles et les éléments translucides. La fidélité pixel reste à calibrer avec une capture de conversation individuelle et la police SF Pro.

Les dimensions du téléphone, la typographie, les couleurs et les espacements sont centralisés dans `src/lib/tokens.ts`, puis transmis au téléphone sous forme de variables CSS. Les messages d’un même expéditeur sont espacés de 2 pt, les changements d’expéditeur de 8 pt. Les réactions multiples restent côte à côte.

Source officielle de SF Pro : [Apple Developer — Fonts](https://developer.apple.com/fonts/). La police n’est pas fournie avec ce dépôt ; consulter les conditions Apple avant de l’ajouter en local.

## Vérifier

```sh
npm run lint
npm run build
```

Le clavier simulé s’ouvre au lancement. Les messages envoyés se composent lettre par lettre, avec un ping sur les touches, puis sont envoyés. Le champ `typing` des messages `me` règle la durée de saisie ; sans ce champ, la durée est calculée selon le texte ; `typing: 0` envoie directement. Pause, reset et vitesse s’appliquent aussi à la saisie. Le clavier est une animation du scénario, sans saisie manuelle. Les emoji restent entiers pendant l’animation.

La bibliothèque propose trois scénarios : rendez-vous, surprise et lancement de projet. L’onglet **Éditeur JSON** permet de modifier le scénario, le prévisualiser et enregistrer jusqu’à dix conversations dans ce navigateur. **Aperçu live** rejoue automatiquement un scénario valide après 650 ms sans modification ; un JSON invalide conserve la dernière conversation valide. Les réglages du clavier proposent QWERTY (par défaut, comme la référence) et AZERTY.

Appels, éditeur par formulaire, export vidéo et 3D restent à venir. Voir `PLAN.md`.

## Sons installés en local

Source : https://github.com/extratone/iOSSystemSounds/tree/04048879c4b16f2372009e1a1d75207647ce16da/m4a

| Fichier local | Fichier source |
| --- | --- |
| send.m4a | SentMessage.m4a |
| receive.m4a | ReceivedMessage.m4a |
| tapback.m4a | acknowledgment_received.m4a |
| tapback-send.m4a | acknowledgment_sent.m4a |

Collection tierce de sons extraits d’iOS ; leur présence ne garantit pas une correspondance exacte avec iOS 26. Les fichiers restent locaux et hors Git conformément au plan. Les boutons d’écoute des paramètres permettent de vérifier chaque son, indépendamment du mute de la conversation.
