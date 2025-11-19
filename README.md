# Plateforme PFE

Application web (React + PocketBase + Vercel) permettant aux étudiants de classer jusqu’à quatre sujets de PFE (classiques ou « 1275 »), avec affectations dynamiques basées sur la moyenne et support des binômes.

## Structure

```
Plateforme PFE/
├─ frontend/          # Application Vite React (SPA publique déployée sur Vercel)
├─ api/               # Fonctions serverless Vercel (soumission + recalcul)
├─ backend/           # Configuration PocketBase (collections, hooks, tutoriel)
├─ data/              # Modèles CSV pour sujets et étudiants
├─ docs/              # Documentation fonctionnelle & technique
├─ scripts/           # Scripts d’import CSV -> PocketBase
└─ package.json       # Dépendances partagées (PocketBase SDK + outils CLI)
```

## Flux principaux

1. **Import CSV** : un administrateur met à jour `data/subjects.csv` et `data/students.csv`, puis exécute `npm run import:pocketbase` pour synchroniser PocketBase.
2. **Fonction serverless** (`api/submitChoices.ts`) :
   - vérifie les règles (mono/binôme, spécialité, quota de sujets 1275 hors spécialité) et calcule la moyenne prioritaire.
   - enregistre les choix dans PocketBase et déclenche le recalcul des affectations/statistiques.
3. **Étudiants** : sélectionnent leur(s) nom(s), choisissent jusqu’à 4 sujets classés par priorité (classique ou 1275), puis verrouillent leurs choix (pas de modification sans l’administration).
4. **Visualisation** : tout le monde consulte en direct les listes d’équipes, les affectations provisoires, les files d’attente et les sujets 1275 en attente de validation encadrant.

## Mise en route

1. Installer PocketBase (binaire autonome) et importer la structure décrite dans `backend/README.md`.
2. Copier `.env.example` → `.env` (racine) et renseigner `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD` (utilisés par les scripts et les fonctions Vercel). `RECOMPUTE_TOKEN` est optionnel (clé secrète pour l’endpoint `/api/recomputeAssignments`).
3. `cd frontend && npm install && npm run dev` pour lancer l’interface localement (utilise `VITE_POCKETBASE_URL`). Pour tester les fonctions `api/*` en local, installez la CLI Vercel puis exécutez `vercel dev` à la racine (les requêtes `/api/...` sont alors proxifiées automatiquement).
4. Déployer sur Vercel (`vercel deploy`) : Vercel build la SPA, expose les fonctions `api/*` et communique avec PocketBase via les variables d’environnement.

Consultez `docs/architecture.md` pour les règles détaillées, `backend/README.md` pour la configuration PocketBase et `data/README.md` pour le format des CSV.
