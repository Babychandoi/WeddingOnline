import { seedPostgresIfEmpty } from './prismaRepo';
import { getStorageDriver } from './store';

async function main() {
  const driver = getStorageDriver();
  if (driver !== 'prisma-postgres') {
    console.log('DATABASE_URL is not set; local JSON store auto-seeds automatically on startup.');
    process.exit(0);
  }
  const res = await seedPostgresIfEmpty();
  console.log(
    res.seeded
      ? `Seeded PostgreSQL successfully (${res.count} weddings).`
      : `PostgreSQL already initialized (${res.count} weddings found).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
