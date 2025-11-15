# Architecture & Règles Métier

## Aperçu

- **Frontend** : SPA React (Vite) déployée sur Vercel (hébergement statique + fonctions `api/*`).
- **Backend** : PocketBase (Base NoSQL + realtime). Les fonctions Vercel servent de couche métier (validation, matching, stats).
- **Import CSV** : `npm run import:pocketbase` lit `data/students.csv` (`matricule, nom, prenom, specialite, moyenne…`) et `data/subjects.csv` (`code, titre, specialite, type_sujet…`) puis alimente PocketBase.
- **Temps réel** : le front écoute directement `subjects` et `choices` (subscription PocketBase).

## Collections PocketBase

### `subjects`
```
{
  id: string,
  code: string,
  titre: string,
  specialite: string,
  type_sujet: 'Classique' | '1275',
  encadrant?: string,
  description?: string,
  disponible?: boolean
}
```

### `students`
```
{
  id: string,
  matricule: string,
  nom: string,
  prenom: string,
  specialite: string,
  moyenne: number,
  email?: string,
  phone?: string,
  active: boolean
}
```

### `choices`
```
{
  id: string,
  mode: 'monome' | 'binome',
  members: [{ matricule, nom, prenom, specialite, moyenne }],
  membersIndex: string,            // concat des matricules pour détecter les doublons
  specialty: string,               // spécialité retenue pour le choix (ex. VOA)
  picks: [{ subjectCode, priority: 1..4, isOutOfSpecialty: boolean }],
  locked: true,
  priorityScore: number,           // moyenne ou moyenne des moyennes (2 décimales)
  currentAssignment?: { subjectCode, priority },
  status: 'pending' | 'assigned' | 'waiting' | 'unassigned',
  needsMentorApproval: boolean,
  mentorDecision: 'pending' | 'approved' | 'rejected',
  needsAttention: boolean,
  queuePositions: [{ subjectCode, position }],
  created: ISODate,
  updated: ISODate
}
```

### `metrics`
```
{
  id: string,
  slug: 'global',
  topSubjects: [{ subjectCode, choiceCount }],
  unassignedCount: number,
  updated: ISODate
}
```

## Règles métier

1. **Nombre de choix** : 1 à 4 sujets ordonnés. Aucun doublon (`subjectCode` unique par soumission).
2. **Spécialité** :
   - Les sujets `Classique` doivent appartenir à la même spécialité que les étudiants sélectionnés.
   - Les sujets `1275` peuvent être choisis hors spécialité, mais **un seul** choix hors spécialité est autorisé par soumission.
   - Tous les choix doivent être du même type (4 Classiques ou 4 projets 1275).
3. **Mono/Binôme** :
   - Monome = un étudiant (`mode = "monome"`).
   - Binôme = deux étudiants (même spécialité recommandée). La priorité est la moyenne arithmétique des `moyenne`.
4. **Verrouillage** : après soumission, `locked=true`. Toute modification passe par l’administration.
5. **Matching automatique** :
   - `api/submitChoices` valide les données, calcule la moyenne (`priorityScore`) et enregistre le `choice`.
   - `api/recomputeAssignments` reconstruit toutes les files : tri des équipes par `priorityScore`, attribution sur les sujets disponibles (quota implicite = 1), calcul des files d’attente (`queuePositions`).
   - `needsMentorApproval` passe à `true` pour tout sujet 1275 actuellement attribué.
   - `metrics` conserve un top 5 de sujets les plus demandés et le nombre d’équipes sans sujet (`unassignedCount`).
6. **Transparence** :
   - La page “Classements” affiche les équipes affectées et les files d’attente (grâce à `queuePositions`).
   - Chaque équipe voit son statut (`status`) et un badge si aucun de ses 4 choix n’est disponible (`needsAttention=true`).

## Fonctions Vercel (`api/*`)

| Fichier | Méthode | Rôle |
|---------|---------|------|
| `api/submitChoices.ts` | POST | Endpoint principal : reçoit `{ members: [{ matricule }], picks, specialty, mode }`, vérifie les règles, crée un document `choices` puis relance le matching. |
| `api/recomputeAssignments.ts` | POST (protégé) | Relance manuellement le matching (après import CSV ou action encadrant). Header `x-cron-token` doit correspondre à `RECOMPUTE_TOKEN` s’il est défini. |
| `api/_lib/*` | — | Helpers PocketBase (auth admin), validation (règles métier), algorithme d’affectation. |

Variables d’environnement : `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`, `RECOMPUTE_TOKEN` (optionnel). Côté front : `VITE_POCKETBASE_URL`, `VITE_API_BASE_URL`.

## Import CSV

1. Mettre à jour `data/subjects.csv` et `data/students.csv` (structure décrite dans `data/README.md`).
2. `npm run import:pocketbase` : vide et regénère les collections `subjects` et `students`.
3. Option : `POST /api/recomputeAssignments` pour recalculer immédiatement les files.

## Sécurité

- Lecture des collections : publique (aucune connexion requise pour consulter).
- Écriture `choices` : uniquement via `api/submitChoices`. Possibilité d’ajouter un header ou un rate limit côté Vercel si nécessaire.
- Écriture `subjects/students/metrics` : réservée aux scripts admin ou aux actions PocketBase.

## UI & flux

1. **Landing** : choix du mode (Monome/Binôme).
2. **Sélection étudiants** : recherche/filtre par spécialité, liste triée par `moyenne`.
3. **Wizard 4 choix** : validation immédiate (type homogène, un seul 1275 hors spécialité).
4. **Soumission** : appel `POST /api/submitChoices` ⇒ messages de confirmation, choix verrouillés.
5. **Classements** : cartes par sujet (assignés + file d’attente) + tableau global des équipes.
6. **Alerte** : bandeau rouge si `needsAttention=true` (aucun des 4 sujets n’est disponible compte tenu de la moyenne).

Cette architecture reste 100 % gratuite : PocketBase auto-hébergé, Vercel (free tier) et CSV comme source de vérité pour l’administration.
