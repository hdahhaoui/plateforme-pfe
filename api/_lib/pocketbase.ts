import PocketBase from 'pocketbase';

function assertEnv(key: string) {
  if (!process.env[key]) {
    throw new Error(`Variable d'environnement ${key} manquante`);
  }
  return process.env[key]!;
}

export async function getPocketBaseAdmin() {
  const url = assertEnv('POCKETBASE_URL');
  const email = assertEnv('POCKETBASE_ADMIN_EMAIL');
  const password = assertEnv('POCKETBASE_ADMIN_PASSWORD');

  const pb = new PocketBase(url);
  pb.autoCancellation(false);
  await pb.admins.authWithPassword(email, password);
  return pb;
}
