/// <reference types="node" />

import { getPocketBaseAdmin } from './_lib/pocketbase';
import { recomputeAssignments } from './_lib/matching';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const expectedToken = process.env.RECOMPUTE_TOKEN;
  if (expectedToken && req.headers['x-cron-token'] !== expectedToken) {
    res.status(401).json({ error: 'Token invalide.' });
    return;
  }

  try {
    const pb = await getPocketBaseAdmin();
    await recomputeAssignments(pb);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Erreur lors du recalcul.' });
  }
}
