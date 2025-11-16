// Déclaration minimale pour que TypeScript accepte process.env
declare const process: any;

import PocketBase from 'pocketbase';

// URL de ton PocketBase côté serveur (Vercel)
const pbUrl =
  process.env.VITE_POCKETBASE_URL ??
  'https://pocketbase-fly-late-glade-7750.fly.dev';

// Client simple
export function getPocketBase() {
  const pb = new PocketBase(pbUrl);
  pb.autoCancellation(false);
  return pb;
}

// Client ADMIN utilisé dans submitChoices & recomputeAssignments
export async function getPocketBaseAdmin() {
  const pb = new PocketBase(pbUrl);

  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL!,     // via variables Vercel
    process.env.POCKETBASE_ADMIN_PASSWORD!,  // via variables Vercel
  );

  pb.autoCancellation(false);
  return pb;
}

// Export par défaut
const defaultClient = getPocketBase();
export default defaultClient;
