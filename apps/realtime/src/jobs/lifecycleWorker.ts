import { dbRepo } from '@dco/database';
import { eventBus } from '../services/eventBus';

export async function runLifecycleSweep(): Promise<{
  expiredTrials: string[];
  archivedWeddings: string[];
}> {
  const expiredTrials = await dbRepo.expireDueTrials();
  for (const weddingId of expiredTrials) {
    eventBus.publish({ type: 'ROOM_EXPIRED', weddingId });
  }

  const archivedWeddings = await dbRepo.archiveDueWeddings();
  for (const weddingId of archivedWeddings) {
    eventBus.publish({ type: 'FORCE_ARCHIVE_ROOM', weddingId });
  }

  return { expiredTrials, archivedWeddings };
}

export function startLifecycleCron(): NodeJS.Timeout {
  // Run immediately once on startup, then every 15 minutes
  runLifecycleSweep().catch(() => {});
  return setInterval(async () => {
    const result = await runLifecycleSweep();
    if (result.expiredTrials.length > 0 || result.archivedWeddings.length > 0) {
      console.log('[lifecycleWorker]', JSON.stringify(result));
    }
  }, 15 * 60 * 1000);
}
