import PocketBase from 'pocketbase';

const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL
    ?? 'https://pocketbase-fly-late-glade-7750.fly.dev'
);

pb.autoCancellation(false);

export default pb;
