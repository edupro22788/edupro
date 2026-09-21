// مرة واحدة: توحيد أسماء الأفواج الموجودة (01، 02، 03 …) ودمج المكرر منها.
// قابل لإعادة التشغيل بأمان (لا يفعل شيئًا إذا كانت الأسماء موحّدة بالفعل).
import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import { normalizeGroupName } from '../src/lib/group-name';

async function main() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

  const groups = await db.group.findMany({
    select: { id: true, name: true, studyLevelId: true, createdAt: true },
  });
  if (groups.length === 0) {
    console.log('[migrate] لا توجد أفواج.');
    await db.$disconnect();
    return;
  }

  const buckets = new Map<string, typeof groups>();
  for (const g of groups) {
    const key = `${g.studyLevelId}::${normalizeGroupName(g.name)}`;
    const arr = buckets.get(key) || [];
    arr.push(g);
    buckets.set(key, arr);
  }

  let merged = 0;
  let renamed = 0;

  for (const [, arr] of buckets) {
    const norm = normalizeGroupName(arr[0].name);

    if (arr.length > 1) {
      // دمج كل الأفواج المكررة في الفوج المعياري (الاسم الصحيح أو الأقدم)
      const canonical =
        arr.find((g) => g.name === norm) ||
        arr.slice().sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      const canonicalMembers = new Set(
        (await db.membership.findMany({ where: { groupId: canonical.id }, select: { userId: true } })).map(
          (m) => m.userId,
        ),
      );

      for (const other of arr.filter((g) => g.id !== canonical.id)) {
        const members = await db.membership.findMany({
          where: { groupId: other.id },
          select: { id: true, userId: true },
        });
        for (const m of members) {
          if (canonicalMembers.has(m.userId)) {
            await db.membership.delete({ where: { id: m.id } }).catch(() => {});
          } else {
            await db.membership
              .updateMany({ where: { userId: m.userId, groupId: other.id }, data: { groupId: canonical.id } })
              .catch(() => {});
          }
        }
        await db.group.delete({ where: { id: other.id } }).catch(() => {});
        merged++;
      }
      merged--;
      console.log(`[migrate] دُمج «${arr.map((g) => g.name).join('» / «')}» ← «${canonical.name}»`);
      if (canonical.name !== norm) {
        await db.group.update({ where: { id: canonical.id }, data: { name: norm } }).catch(() => {});
        renamed++;
      }
      continue;
    }

    if (arr[0].name !== norm) {
      await db.group.update({ where: { id: arr[0].id }, data: { name: norm } }).catch(() => {});
      renamed++;
      console.log(`[migrate] «${arr[0].name}» ← «${norm}»`);
    }
  }

  console.log(`[migrate] انتهى: ${merged} دمجًا، ${renamed} إعادة تسمية.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});