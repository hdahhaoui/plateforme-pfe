/// <reference types="node" />

import PocketBase from 'pocketbase';

// URL de ton PocketBase côté serveur (Vercel)
const pbUrl =
  process.env.VITE_POCKETBASE_URL ??
  'https://pocketbase-fly-late-glade-7750.fly.dev';

// Client simple (par exemple si un composant a besoin d'un pb)
export function getPocketBase() {
  const pb = new PocketBase(pbUrl);
  pb.autoCancellation(false);
  return pb;
}

// Client ADMIN utilisé dans submitChoices & recomputeAssignments
export async function getPocketBaseAdmin() {
  const pb = new PocketBase(pbUrl);

  // Auth ADMIN avec les variables d'environnement Vercel
  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,     // Ton email admin PocketBase (via Vercel)
    process.env.POCKETBASE_ADMIN_PASSWORD!,  // Ton mot de passe admin (via Vercel)
  );

  pb.autoCancellation(false);
  return pb;
}

// Export par défaut (facultatif mais utile)
const defaultClient = getPocketBase();
export default defaultClient;
