import PocketBase from 'pocketbase';

const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL
    ?? 'https://pocketbase-fly-late-glade-7750.fly.dev'
);

// Empêche PocketBase d'annuler les requêtes quand les composants changent
pb.autoCancellation(false);

// 🔇 Option : neutraliser proprement le realtime pour éviter les erreurs "client id"
// (on garde l'API mais on ignore les erreurs 404 côté unsubscribe)
const originalUnsubscribe = pb.realtime.unsubscribe.bind(pb);

pb.realtime.unsubscribe = async (...args: any[]) => {
  try {
    return await originalUnsubscribe(...args);
  } catch (err: any) {
    // On ignore juste les erreurs de realtime, pour ne pas polluer la console
    console.warn('Realtime unsubscribe error ignorée:', err?.message ?? err);
  }
};

export default pb;
