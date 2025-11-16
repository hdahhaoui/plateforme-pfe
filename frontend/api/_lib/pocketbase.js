import PocketBase from 'pocketbase';

const pbUrl =
  process.env.VITE_POCKETBASE_URL ??
  'https://pocketbase-fly-late-glade-7750.fly.dev';

// Client simple
export function getPocketBase() {
  const pb = new PocketBase(pbUrl);
  pb.autoCancellation(false);
  return pb;
}

// Client ADMIN utilisé par submitChoices & recomputeAssignments
export async function getPocketBaseAdmin() {
  const pb = new PocketBase(pbUrl);

  await pb.admins.authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD,
  );

  pb.autoCancellation(false);
  return pb;
}

// Export par défaut
const defaultClient = getPocketBase();
export default defaultClient;
