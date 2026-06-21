# Ma Discipline — v2 (Vite + React + TypeScript)

Refonte architecturale de l'app monofichier d'origine. Mêmes fonctionnalités,
même esprit visuel, mais code modulaire, typé et maintenable.

## Stack

- **Vite** (build) + **React 18** + **TypeScript** (strict)
- **Tailwind CSS** (couleurs pilotées par variables de thème)
- **Firebase** Auth + Firestore (SDK modulaire v10)
- Déploiement **GitHub Pages** via **GitHub Actions**

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (par défaut http://localhost:5173/ma-discipline-vite/).

## Build de production

```bash
npm run build      # tsc (vérif. de types) puis build Vite -> dist/
npm run preview    # prévisualise le build
```

## Déploiement

Le déploiement est **automatique** : à chaque `git push` sur la branche `main`,
le workflow `.github/workflows/deploy.yml` build et publie sur GitHub Pages.

### Réglage unique côté GitHub (à faire une fois)

1. Repo → **Settings** → **Pages**
2. Section **Build and deployment** → **Source** : choisir **GitHub Actions**

Ensuite, plus rien à faire : chaque push déclenche le déploiement.

### Workflow manuel alternatif

Tu peux aussi déclencher le déploiement à la main depuis l'onglet **Actions**
(bouton « Run workflow »), grâce à `workflow_dispatch`.

## Structure

```
src/
  app/            App.tsx (auth, sync, navigation)
  features/
    auth/         écran de connexion
    seance/       onglet Séance + lecteurs Runner/WodRunner
    nutrition/    onglet Nutrition + FoodPicker + rapports + export PDF
    suivi/        onglet Suivi (timeline) + panneau du jour
    settings/     réglages (7 sections)
  shared/
    ui/           Icon, Stepper, Collapsible, SwipeRow, Ring, ConfirmHost...
    theme/        ThemeProvider (Context) + définitions des 5 thèmes
  lib/            logique métier pure + hooks (firebase, workouts, nutrition...)
  data/           ciqual.json (3484 aliments, chargé en lazy)
  types/          index.ts — LA source de vérité du modèle de données
```

## Notes importantes

- **Base path** : configurée sur `/ma-discipline-vite/` dans `vite.config.ts`.
  Si tu renommes le repo, ajuste cette valeur.
- **Images d'exercices** : dans `public/exercices/` (servies à la racine du build).
  Les 21 images d'origine y sont déjà, renommées au format attendu (avec tirets).
- **Firebase** : la config est dans `src/lib/firebase.ts` (projet `snake-s-rule`).
- **CIQUAL** : la base est externalisée en JSON et chargée seulement à la
  première recherche d'aliment (import dynamique), pour alléger le démarrage.
- **Données Firestore** : document unique `users/{uid}/app/data`, écritures
  debouncées (400 ms), archivage automatique des jours de plus de 400 jours
  vers `users/{uid}/archive/{YYYY-MM}`.

## Icônes PWA (optionnel)

Le `manifest.webmanifest` référence `icon-192.png` et `icon-512.png` ainsi qu'un
`icon-180.png` (apple-touch-icon). Dépose ces fichiers dans `public/` si tu veux
une icône personnalisée à l'installation sur l'écran d'accueil.
