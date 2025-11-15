# Backend PocketBase

PocketBase fournit l’API REST/temps réel et stocke les données (sujets, étudiants, choix, métriques). Le dépôt contient :

- `collections/schema.json` : structure exportable/importable via la console PocketBase.
- `scripts/import-pocketbase.mjs` : synchronisation des CSV (`data/`) vers PocketBase (via l’API admin).

## Installation rapide

1. **Télécharger PocketBase**  
   - https://pocketbase.io/docs/ (binaire unique).  
   - Décompresser à la racine ou dans `/srv/pocketbase`.

2. **Lancer le serveur**  
   ```bash
   ./pocketbase serve --http=0.0.0.0:8090
   ```  
   Premier lancement → création d’un admin (email + mot de passe). Conservez ces identifiants pour `.env`.

3. **Importer le schéma**  
   - Ouvrir `http://localhost:8090/_/` (console admin).  
   - `Settings > Import collections` → choisir `backend/collections/schema.json`.  
   - Dans `Settings > Auth`, désactiver l’inscription publique (pas d’auth nécessaire) et autoriser la lecture des collections publiques (`listRule`/`viewRule` vides pour `subjects`, `students`, `choices`, `metrics`).

4. **Variables d’environnement**  
   - Copier `.env.example` → `.env` à la racine et renseigner :  
     ```
     POCKETBASE_URL=https://votre-pocketbase.exemple.com
     POCKETBASE_ADMIN_EMAIL=admin@example.com
     POCKETBASE_ADMIN_PASSWORD=motdepasse
     ```
   - Ces variables sont utilisées par les fonctions Vercel (`api/*`) et par `npm run import:pocketbase`.

5. **Import CSV initial**  
   ```bash
   npm install
   npm run import:pocketbase
   ```  
   Le script lit `data/subjects.csv` & `data/students.csv`, vide les collections PocketBase et recrée les enregistrements.

6. **Déploiement**  
   - Déployer PocketBase sur un VPS ou Fly.io (binaire autonome + volume pour `pb_data`).  
   - Sur Vercel : déployer la SPA (`frontend/`) + les fonctions `api/`.  
   - Définir les variables d’environnement Vercel (`POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `VITE_POCKETBASE_URL` pour le front).

## Collections principales

| Collection | Description |
|------------|-------------|
| `subjects` | Sujets PFE (type `classique/1275`, quota, spécialité, stats). |
| `students` | Liste officielle des étudiants (spécialité, moyenne, contact). |
| `choices`  | Choix verrouillés (mono/binôme, picks, score, statut, assignation actuelle). |
| `metrics`  | Agrégations globales (top sujets, nombre d’équipes sans affectation). |

Les définitions détaillées (champs, types, contraintes) se trouvent dans `collections/schema.json`. Ajustez les règles d’accès directement dans la console PocketBase selon vos besoins.
