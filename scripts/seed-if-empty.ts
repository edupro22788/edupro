// Fills the DB with demo data on first boot (when the group table is empty).
import 'dotenv/config';
import { execSync } from 'node:child_process';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  const count = await db.group.count();
  if (count > 0) {
    console.log('DB already has data, skipping seed.');
    await db.$disconnect();
    return;
  }

  await db.$disconnect();
  console.log('Seeding demo data...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('Seed completed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});