import PocketBase from 'pocketbase';

const pbUrl =
  process.env.VITE_POCKETBASE_URL ??
  'https://pocketbase-fly-late-glade-7750.fly.dev';

// On crée UN seul client PocketBase réutilisé
const pb = new PocketBase(pbUrl);
pb.autoCancellation(false);

// Client simple (lecture/écriture selon les règles des collections)
export function getPocketBase() {
  return pb;
}

// "Admin" logique : pour l'instant, on utilise le même client
// (pas d'authentification admin, donc pas d'appel /api/admins/auth-with-password)
export async function getPocketBaseAdmin() {
  return pb;
}

// Export par défaut
export default pb;
