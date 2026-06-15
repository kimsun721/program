import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "postgresql://lingua:lingua@localhost:5433/linguaclass_p2",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Languages
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: "en" },
      update: {},
      create: { code: "en", nameKo: "영어", nameEn: "English", sortOrder: 1 },
    }),
    prisma.language.upsert({
      where: { code: "ja" },
      update: {},
      create: { code: "ja", nameKo: "일본어", nameEn: "Japanese", sortOrder: 2 },
    }),
    prisma.language.upsert({
      where: { code: "zh" },
      update: {},
      create: { code: "zh", nameKo: "중국어", nameEn: "Chinese", sortOrder: 3 },
    }),
    prisma.language.upsert({
      where: { code: "es" },
      update: {},
      create: { code: "es", nameKo: "스페인어", nameEn: "Spanish", sortOrder: 4 },
    }),
    prisma.language.upsert({
      where: { code: "fr" },
      update: {},
      create: { code: "fr", nameKo: "프랑스어", nameEn: "French", sortOrder: 5 },
    }),
  ]);
  console.log("Languages seeded:", languages.length);

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "conversation" },
      update: {},
      create: { name: "회화", slug: "conversation", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "grammar" },
      update: {},
      create: { name: "문법", slug: "grammar", sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "reading" },
      update: {},
      create: { name: "독해", slug: "reading", sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: "listening" },
      update: {},
      create: { name: "듣기", slug: "listening", sortOrder: 4 },
    }),
    prisma.category.upsert({
      where: { slug: "business" },
      update: {},
      create: { name: "비즈니스", slug: "business", sortOrder: 5 },
    }),
  ]);
  console.log("Categories seeded:", categories.length);

  // Instructor account
  const hashedPassword = await bcrypt.hash("Test1234!", 10);
  const instructorUser = await prisma.user.upsert({
    where: { email: "instructor@test.com" },
    update: {},
    create: {
      email: "instructor@test.com",
      password: hashedPassword,
      nickname: "김강사",
      role: ["STUDENT", "INSTRUCTOR"],
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const instructorProfile = await prisma.instructorProfile.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      realName: "김민준",
      headline: "10년 경력의 언어 교육 전문가",
      description:
        "안녕하세요! 저는 10년간 언어 교육 분야에서 활동해온 김민준입니다. 영어, 일본어 전문 강사로 다양한 수강생들의 언어 실력 향상을 도왔습니다. 실용적이고 재미있는 강의로 여러분의 언어 학습을 도와드리겠습니다.",
      career:
        "現 LinguaClass 전임 강사\n前 YBM 영어 강사 (5년)\n前 일본어 학원 운영 (3년)\n한국외국어대학교 영어학과 졸업",
      status: "APPROVED",
      reviewedAt: new Date(),
    },
  });

  // Admin account
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      password: hashedPassword,
      nickname: "관리자",
      role: ["ADMIN"],
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  // Pending instructor (for admin approval demo)
  const pendingInstructorUser = await prisma.user.upsert({
    where: { email: "pending-instructor@test.com" },
    update: {},
    create: {
      email: "pending-instructor@test.com",
      password: hashedPassword,
      nickname: "박지원",
      role: ["STUDENT"],
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  await prisma.instructorProfile.upsert({
    where: { userId: pendingInstructorUser.id },
    update: {},
    create: {
      userId: pendingInstructorUser.id,
      realName: "박지원",
      headline: "프랑스에서 7년 거주, 프랑스어 회화 전문",
      description:
        "안녕하세요. 파리 소르본 대학에서 7년간 유학 후 한국에서 프랑스어를 가르치고 있는 박지원입니다. 일상에서 바로 쓸 수 있는 자연스러운 프랑스어를 알려드리고 싶습니다.",
      career: "現 프랑스어 프리랜서 강사\n파리 소르본 대학 졸업\nDALF C1 보유",
      status: "PENDING",
    },
  });

  // Student account
  const studentUser = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      email: "student@test.com",
      password: hashedPassword,
      nickname: "이수강",
      role: ["STUDENT"],
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log(
    "Users seeded:",
    adminUser.email,
    instructorUser.email,
    studentUser.email,
    pendingInstructorUser.email
  );

  // Courses
  const courseData = [
    {
      title: "왕초보 영어 회화 완성",
      slug: "beginner-english-conversation",
      description:
        "영어를 처음 시작하는 분들을 위한 완벽한 기초 회화 강좌입니다. 일상 생활에서 바로 쓸 수 있는 표현들을 중심으로 자신감 있게 영어로 말할 수 있도록 도와드립니다.",
      languageId: languages[0].id,
      categoryId: categories[0].id,
      level: "BEGINNER",
      price: 49000,
      thumbnail: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800",
    },
    {
      title: "비즈니스 영어 이메일 마스터",
      slug: "business-english-email",
      description:
        "직장인을 위한 실전 비즈니스 영어 이메일 강좌입니다. 다양한 상황별 이메일 템플릿과 표현을 익혀 글로벌 비즈니스 커뮤니케이션 능력을 키우세요.",
      languageId: languages[0].id,
      categoryId: categories[4].id,
      level: "INTERMEDIATE",
      price: 79000,
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    },
    {
      title: "일본어 JLPT N5 완전 정복",
      slug: "japanese-jlpt-n5",
      description:
        "JLPT N5 자격증 취득을 목표로 하는 분들을 위한 체계적인 일본어 강좌입니다. 히라가나부터 기초 문법, 어휘까지 단계별로 학습합니다.",
      languageId: languages[1].id,
      categoryId: categories[1].id,
      level: "BEGINNER",
      price: 59000,
      thumbnail: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800",
    },
    {
      title: "중국어 HSK 3급 집중 과정",
      slug: "chinese-hsk-3",
      description:
        "HSK 3급 합격을 위한 집중 과정입니다. 핵심 어휘 600개와 기본 문법을 마스터하고 실전 모의고사로 실력을 점검합니다.",
      languageId: languages[2].id,
      categoryId: categories[1].id,
      level: "INTERMEDIATE",
      price: 69000,
      thumbnail: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=800",
    },
    {
      title: "스페인어 여행 회화",
      slug: "spanish-travel-conversation",
      description:
        "스페인어권 여행에서 필요한 모든 표현을 담은 실용 회화 강좌입니다. 공항, 호텔, 레스토랑, 쇼핑 등 여행의 모든 상황을 대비합니다.",
      languageId: languages[3].id,
      categoryId: categories[0].id,
      level: "BEGINNER",
      price: 39000,
      thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    },
  ];

  for (const courseInfo of courseData) {
    const course = await prisma.course.upsert({
      where: { slug: courseInfo.slug },
      update: {},
      create: {
        ...courseInfo,
        instructorId: instructorProfile.id,
        status: "PUBLISHED",
        avgRating: 0,
        reviewCount: 0,
        enrollmentCount: 0,
      },
    });

    // Create 2 sections per course
    for (let s = 1; s <= 2; s++) {
      const sectionTitles = [
        [`섹션 1: 기초 다지기`, `섹션 2: 심화 학습`],
        [`섹션 1: 핵심 개념`, `섹션 2: 실전 연습`],
      ];

      const section = await prisma.section.create({
        data: {
          courseId: course.id,
          title: sectionTitles[s - 1]?.[s - 1] || `섹션 ${s}`,
          sortOrder: s,
        },
      });

      // Create 3 lectures per section
      const lectureTitles = [
        "오리엔테이션 및 학습 가이드",
        "핵심 표현 익히기",
        "실전 연습 및 복습",
      ];

      for (let l = 1; l <= 3; l++) {
        await prisma.lecture.create({
          data: {
            sectionId: section.id,
            title: `${s}-${l}. ${lectureTitles[l - 1]}`,
            hlsUrl:
              l === 1
                ? "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                : null,
            duration: 600 + Math.floor(Math.random() * 1200),
            isFreePreview: s === 1 && l === 1,
            sortOrder: l,
          },
        });
      }
    }

    // Create enrollment for student
    const enrollment = await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: studentUser.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: studentUser.id,
        courseId: course.id,
        status: "ACTIVE",
        progressPct: Math.floor(Math.random() * 60),
      },
    });

    // Create a review
    await prisma.review.upsert({
      where: {
        userId_courseId: {
          userId: studentUser.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: studentUser.id,
        courseId: course.id,
        rating: Math.floor(Math.random() * 2) + 4,
        content:
          "정말 좋은 강의입니다! 강사님의 설명이 명확하고 이해하기 쉬워서 학습하기 편했습니다. 적극 추천드립니다.",
      },
    });

    // Update course stats from actual data
    const [reviewStats, enrollmentCount] = await Promise.all([
      prisma.review.aggregate({
        where: { courseId: course.id },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.enrollment.count({ where: { courseId: course.id } }),
    ]);

    await prisma.course.update({
      where: { id: course.id },
      data: {
        avgRating: reviewStats._avg.rating ?? 0,
        reviewCount: reviewStats._count.id,
        enrollmentCount,
      },
    });

    console.log(`Course seeded: ${course.title}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
