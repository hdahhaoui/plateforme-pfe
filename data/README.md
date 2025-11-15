# Modèles CSV

Ces fichiers sont l’unique source de vérité pour l’offre PFE et la liste des étudiants. Après modification, exécutez `npm run import:pocketbase` pour synchroniser PocketBase (via `scripts/import-pocketbase.mjs`).

## subjects.csv

| Colonne        | Description                                                                                     | Exemple                            |
|----------------|-------------------------------------------------------------------------------------------------|------------------------------------|
| `code`         | Identifiant unique du sujet (slug ou code)                                                      | `STR-1`                            |
| `titre`        | Titre complet                                                                                   | `Comportement hydromécanique…`     |
| `specialite`   | Spécialité ciblée                                                                               | `Structures`                       |
| `type_sujet`   | `Classique` ou `1275`                                                                           | `Classique`                        |
| `encadrant`    | Nom(s) de l’encadrant (libre)                                                                    | `ABOU-BEKR Nabil / AIT SALEM...`   |
| `disponible`   | `true` / `false` (optionnel) pour indiquer si le sujet peut être choisi                          | `true`                             |
| `description`  | Résumé (optionnel)                                                                              | `Migration...`                     |

**Contraintes :**
- Les valeurs de `type_sujet` doivent être `Classique` ou `1275`.
- `code` doit être unique (utilisé par l’application pour lier les choix).
- Même logique métier : un seul sujet 1275 hors spécialité, choix homogène (tout Classique ou tout 1275), etc.

## students.csv

| Colonne       | Description                                                     | Exemple                 |
|---------------|-----------------------------------------------------------------|-------------------------|
| `matricule`   | Identifiant unique (numéro d’inscription)                       | `191937016477`          |
| `nom`         | Nom de famille                                                  | `DJEBBOUR`              |
| `prenom`      | Prénom                                                          | `Youcef`                |
| `specialite`  | Spécialité principale                                           | `VOA`                   |
| `moyenne`     | Moyenne/Classement (nombre décimal, séparateur `.`)             | `9.4`                   |
| `email`       | Email institutionnel (facultatif)                               | `youcef@example.com`    |
| `phone`       | Téléphone (facultatif)                                          | `+213600000000`         |

**Notes :**
- L’ordre des lignes n’a pas d’importance. La moyenne est utilisée par l’API pour calculer la priorité.
- Pour retirer un étudiant, supprimez sa ligne et relancez `npm run import:pocketbase`.
- Les colonnes supplémentaires seront ignorées par le script.

## Processus de mise à jour

1. Modifier les fichiers CSV (Excel → exporter UTF-8).  
2. Vérifier/valider les valeurs (types/classiques, quotas, moyennes).  
3. `npm run import:pocketbase` (besoin de `.env` avec les identifiants admin PocketBase).  
4. (Optionnel) `curl -X POST https://<vercel-app>/api/recomputeAssignments` pour recalculer les stats si nécessaire.  
5. Rafraîchir la SPA : les nouvelles données sont servies immédiatement.
