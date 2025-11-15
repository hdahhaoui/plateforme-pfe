import PocketBase from 'pocketbase';

const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
);

// Force /api à la fin
pb.baseUrl = pb.baseUrl.replace(/\/$/, '') + '/api';

export default pb;
