import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' }),
});

// ============================================================
//  الولايات الجزائرية الـ 58 (بالترتيب الرسمي)
// ============================================================
const WILAYAS: { name: string; university?: string }[] = [
  { name: 'أدرار', university: 'جامعة أحمد دراية' },
  { name: 'الشلف', university: 'جامعة حسيبة بن بوعلي' },
  { name: 'الأغواط', university: 'جامعة عمار ثليجي' },
  { name: 'أم البواقي', university: 'جامعة العربي بن مهيدي' },
  { name: 'باتنة', university: 'جامعة باتنة 1 الحاج لخضر' },
  { name: 'بجاية', university: 'جامعة عبد الرحمان ميرة' },
  { name: 'بسكرة', university: 'جامعة محمد خيضر' },
  { name: 'بشار', university: 'جامعة طاهري محمد' },
  { name: 'البليدة', university: 'جامعة سعد دحلب' },
  { name: 'البويرة', university: 'جامعة أكلي محند أولحاج' },
  { name: 'تمنراست', university: 'جامعة أمين العقال الحاج موسى أق أخموك' },
  { name: 'تبسة', university: 'جامعة العربي التبسي' },
  { name: 'تلمسان', university: 'جامعة أبو بكر بلقايد' },
  { name: 'تيارت', university: 'جامعة ابن خلدون' },
  { name: 'تيزي وزو', university: 'جامعة مولود معمري' },
  { name: 'الجزائر' },
  { name: 'الجلفة', university: 'جامعة زيان عاشور' },
  { name: 'جيجل', university: 'جامعة محمد الصديق بن يحيى' },
  { name: 'سطيف', university: 'جامعة سطيف 1 فرحات عباس' },
  { name: 'سعيدة', university: 'جامعة الدكتور مولاي الطاهر' },
  { name: 'سكيكدة', university: 'جامعة 20 أوت 1955' },
  { name: 'سيدي بلعباس', university: 'جامعة جيلالي ليابس' },
  { name: 'عنابة', university: 'جامعة باجي مختار' },
  { name: 'قالمة', university: 'جامعة 8 ماي 1945' },
  { name: 'قسنطينة', university: 'جامعة الإخوة منتوري قسنطينة 1' },
  { name: 'المدية', university: 'جامعة يحي فارس' },
  { name: 'مستغانم', university: 'جامعة عبد الحميد بن باديس' },
  { name: 'المسيلة', university: 'جامعة محمد بوضياف' },
  { name: 'معسكر', university: 'جامعة مصطفى اسطمبولي' },
  { name: 'ورقلة', university: 'جامعة قاصدي مرباح' },
  { name: 'وهران', university: 'جامعة وهران 1 أحمد بن بلة' },
  { name: 'البيض', university: 'جامعة البيض' },
  { name: 'إليزي' },
  { name: 'برج بوعريريج', university: 'جامعة محمد البشير الإبراهيمي' },
  { name: 'بومرداس', university: 'جامعة أمحمد بوقرة' },
  { name: 'الطارف', university: 'جامعة الشاذلي بن جديد' },
  { name: 'تندوف', university: 'المركز الجامعي لتندوف' },
  { name: 'تيسمسيلت', university: 'المركز الجامعي لتيسمسيلت' },
  { name: 'الوادي', university: 'جامعة الشهيد حمة لخضر' },
  { name: 'خنشلة', university: 'جامعة عباس لغرور' },
  { name: 'سوق أهراس', university: 'جامعة محمد الشريف مساعدية' },
  { name: 'تيبازة', university: 'المركز الجامعي لتيبازة' },
  { name: 'ميلة', university: 'جامعة عبد الحفيظ بوصوف' },
  { name: 'عين الدفلى', university: 'جامعة أحمد زبانة' },
  { name: 'النعامة', university: 'المركز الجامعي للنعامة' },
  { name: 'عين تموشنت', university: 'المركز الجامعي لعين تموشنت' },
  { name: 'غرداية', university: 'جامعة غرداية' },
  { name: 'غليزان', university: 'المركز الجامعي لغليزان' },
  { name: 'تيميمون' },
  { name: 'برج باجي مختار' },
  { name: 'أولاد جلال', university: 'المركز الجامعي لأولاد جلال' },
  { name: 'بني عباس' },
  { name: 'عين صالح' },
  { name: 'عين قزام' },
  { name: 'تقرت', university: 'جامعة حمة لخضر تقرت' },
  { name: 'جانت' },
  { name: 'المغير', university: 'المركز الجامعي للمغير' },
  { name: 'المنيعة', university: 'المركز الجامعي للمنيعة' },
];

// الكليات والفروع (وفق نظام LMD الجزائري: ميدان ← شعبة/فرع ← تخصص)
const FACULTIES: { name: string; majors: string[] }[] = [
  {
    name: 'كلية الآداب واللغات',
    majors: [
      'اللغة العربية وآدابها',
      'اللغة الفرنسية',
      'اللغة الإنجليزية',
      'اللغة الأمازيغية',
      'الترجمة',
      'اللغة الإسبانية',
      'اللغة الألمانية',
      'اللغة الإيطالية',
      'اللغة الروسية',
      'اللغة الصينية',
      'اللغة التركية',
    ],
  },
  {
    name: 'كلية العلوم الإنسانية والاجتماعية',
    majors: [
      'علم النفس',
      'علم النفس العيادي',
      'علم النفس المدرسي',
      'علم النفس العمل والتنظيم',
      'علم النفس التربوي',
      'علم النفس الاجتماعي',
      'علم النفس المعرفي السلوكي',
      'علم النفس المرضي والعلاجات النفسية',
      'علم النفس والصحة',
      'علم النفس الجنائي',
      'الأرطفونيا',
      'أمراض اللغة والاتصال',
      'العلوم العصبية والمعرفية',
      'علم الاجتماع',
      'علم اجتماع العمل والتنظيم',
      'علم الاجتماع الحضري',
      'التاريخ',
      'الفلسفة',
      'علوم الإعلام والاتصال',
      'الصحافة',
      'السمعي البصري',
      'العلاقات العامة',
      'علوم التربية',
      'الأنظمة التعليمية والمناهج',
      'القياس والتقويم التربوي',
      'التربية الخاصة',
      'الخدمة الاجتماعية',
      'الأنثروبولوجيا',
      'الديموغرافيا',
    ],
  },
  {
    name: 'كلية الحقوق والعلوم السياسية',
    majors: [
      'القانون',
      'القانون العام',
      'القانون الخاص',
      'القانون الجنائي',
      'العلوم السياسية',
      'العلاقات الدولية',
      'العلوم الإدارية',
    ],
  },
  {
    name: 'كلية العلوم الاقتصادية والتجارية وعلوم التسيير',
    majors: [
      'العلوم الاقتصادية',
      'علوم التسيير',
      'العلوم التجارية',
      'العلوم المالية والمحاسبية',
      'علوم الأعمال',
      'التسويق',
      'إدارة الموارد البشرية',
      'المالية والمصرفية',
      'المحاسبة والجباية',
    ],
  },
  {
    name: 'كلية العلوم الدقيقة وعلوم الطبيعة والحياة',
    majors: [
      'الرياضيات',
      'الفيزياء',
      'الكيمياء',
      'علوم الطبيعة والحياة',
      'البيولوجيا',
      'علوم الأرض والكون',
      'الجيولوجيا',
      'الجغرافيا',
      'علوم البيئة',
      'علوم البحر',
    ],
  },
  {
    name: 'كلية علوم التكنولوجيا',
    majors: [
      'الإعلام الآلي',
      'الإلكترونيك',
      'الهندسة المدنية',
      'الهندسة الكهربائية',
      'الهندسة الميكانيكية',
      'هندسة الطرائق',
      'الطاقات المتجددة',
      'الهندسة المعمارية',
      'الهندسة الصناعية',
      'الأتمتة (آلية)',
      'هندسة البرمجيات',
      'أنظمة المعلومات',
      'الشبكات والاتصالات',
    ],
  },
  {
    name: 'كلية العلوم الطبية',
    majors: ['الطب', 'الصيدلة', 'طب الأسنان', 'العلوم الطبية الحيوية'],
  },
  {
    name: 'كلية العلوم الإسلامية',
    majors: ['الشريعة', 'أصول الدين', 'الحضارة الإسلامية', 'العلوم الإسلامية', 'الفقه وأصوله'],
  },
  {
    name: 'كلية التربية البدنية والرياضية',
    majors: [
      'التربية البدنية والرياضية',
      'التدريب الرياضي',
      'الإدارة الرياضية',
      'النشاط البدني الرياضي التربوي',
    ],
  },
  {
    name: 'كلية الفنون والثقافة',
    majors: ['الفنون البصرية', 'الفنون الدرامية', 'الموسيقى', 'السينما والسمعي البصري', 'الفنون التشكيلية'],
  },
  {
    name: 'كلية علوم الطبيعة والحياة والزراعة',
    majors: ['العلوم الزراعية', 'العلوم البيطرية', 'علوم الغذاء', 'علوم الغابات', 'البيوتكنولوجيا'],
  },
];

const LEVELS = ['ليسانس 1', 'ليسانس 2', 'ليسانس 3', 'ماستر 1', 'ماستر 2'];

async function main() {
  const credentials = (await bcrypt.hash('admin123', 12)) as string;
  void credentials;

  console.log('🌱 بذر البيانات الأساسية لـ EDU PRO ...');

  // ---- الولايات والجامعات ----
  for (let i = 0; i < WILAYAS.length; i++) {
    const w = WILAYAS[i];
    const state = await prisma.state.upsert({
      where: { name: w.name },
      update: { order: i + 1 },
      create: { name: w.name, order: i + 1 },
    });

    const uniName = w.university || `جامعة ${w.name}`;
    let university = await prisma.university.findFirst({
      where: { stateId: state.id, name: uniName },
    });
    if (!university) {
      university = await prisma.university.create({ data: { name: uniName, stateId: state.id } });
    }

    // الكليات والتخصصات والمستويات (يضيف الناقص فقط — قابل لإعادة التشغيل)
    for (const f of FACULTIES) {
      let faculty = await prisma.faculty.findFirst({
        where: { universityId: university.id, name: f.name },
      });
      if (!faculty) {
        faculty = await prisma.faculty.create({
          data: { name: f.name, universityId: university.id },
        });
      }
      for (const m of f.majors) {
        let major = await prisma.major.findFirst({
          where: { facultyId: faculty.id, name: m },
        });
        if (!major) {
          major = await prisma.major.create({
            data: { name: m, facultyId: faculty.id },
          });
        }
        for (const lvl of LEVELS) {
          const exists = await prisma.studyLevel.findFirst({
            where: { majorId: major.id, name: lvl },
            select: { id: true },
          });
          if (!exists) {
            await prisma.studyLevel.create({
              data: { name: lvl, majorId: major.id },
            });
          }
        }
      }
    }
  }

  // ---- مقياس تجريبي لواجهة العرض ----
  console.log('  ✓ الولايات والجامعات والكليات والتخصصات والمستويات');

  // ---- مستخدم المدير ----
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@edupro.dz';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      firstName: 'مدير',
      lastName: 'المنصة',
      email: adminEmail,
      emailVerifiedAt: new Date(),
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
    },
  });
  console.log('  ✓ حساب المدير:', admin.email);

  // ---- فوج تجريبي: الأغواط → جامعة عمار ثليجي → العلوم الإنسانية → علم النفس → ماستر 1 → الفوج 03 ----
  const demoUni = await prisma.university.findFirst({
    where: { name: 'جامعة عمار ثليجي' },
    include: {
      faculties: {
        include: {
          majors: { include: { levels: true } },
        },
      },
    },
  });

  if (demoUni) {
    const psyMajor = demoUni.faculties
      .flatMap((f) => f.majors)
      .find((m) => m.name === 'علم النفس');
    const master1 = psyMajor?.levels.find((l) => l.name === 'ماستر 1');

    if (master1) {
      let demoGroup = await prisma.group.findFirst({
        where: { studyLevelId: master1.id, name: 'الفوج 03' },
      });
      if (!demoGroup) {
        demoGroup = await prisma.group.create({
          data: { name: 'الفوج 03', studyLevelId: master1.id },
        });
      }

      // مشرف تجريبي
      const sup = await prisma.user.upsert({
        where: { email: 'supervisor@demo.dz' },
        update: {},
        create: {
          firstName: 'كريم',
          lastName: 'بن عيسى',
          email: 'supervisor@demo.dz',
          emailVerifiedAt: new Date(),
          passwordHash: await bcrypt.hash('demo123', 12),
          gender: 'MALE',
        },
      });
      await prisma.membership.upsert({
        where: { userId: sup.id },
        update: { groupId: demoGroup.id },
        create: { userId: sup.id, groupId: demoGroup.id },
      });
      if (!demoGroup.supervisorId) {
        await prisma.group.update({ where: { id: demoGroup.id }, data: { supervisorId: sup.id } });
        const activeSup = await prisma.groupSupervisor.findFirst({
          where: { groupId: demoGroup.id, endedAt: null },
        });
        if (!activeSup) {
          await prisma.groupSupervisor.create({
            data: { groupId: demoGroup.id, userId: sup.id, electedBy: 'seed' },
          });
        }
      }

      // طالبة تجريبية
      const stu = await prisma.user.upsert({
        where: { email: 'student@demo.dz' },
        update: {},
        create: {
          firstName: 'سارة',
          lastName: 'بوعلام',
          email: 'student@demo.dz',
          emailVerifiedAt: new Date(),
          passwordHash: await bcrypt.hash('demo123', 12),
          gender: 'FEMALE',
        },
      });
      await prisma.membership.upsert({
        where: { userId: stu.id },
        update: { groupId: demoGroup.id },
        create: { userId: stu.id, groupId: demoGroup.id },
      });

      // مقاييس تجريبية
      const names = ['علم النفس المرضي', 'علم النفس العصبي', 'مناهج البحث العلمي', 'الإحصاء', 'علم النفس التجريبي'];
      for (const n of names) {
        await prisma.subject.upsert({
          where: { groupId_name: { groupId: demoGroup.id, name: n } },
          update: {},
          create: {
            name: n,
            groupId: demoGroup.id,
            createdById: sup.id,
            icon: 'academic',
            color: '#c9a962',
          },
        });
      }
      console.log('  ✓ الفوج التجريبي: علم النفس / ماستر 1 / الفوج 03 (مشرف: supervisor@demo.dz)');
    }
  }

  // ---- مقاييس عامة لكل الفوج للعرض ----
  console.log('🌱 اكتملت البذر بنجاح ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });