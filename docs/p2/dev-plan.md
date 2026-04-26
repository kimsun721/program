# LinguaClass P2 개발계획서

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LinguaClass |
| 단계 | P2 |
| 문서 버전 | v2.0.0 |
| 작성일 | 2026-04-26 |

---

## 1. 기술 스택 (P1 유지)

| 분류 | 기술 |
|------|------|
| Frontend / Backend | Next.js 16 (App Router) + Server Actions |
| 인증 | NextAuth (Auth.js) v5 - JWT 세션, role 배열 포함 |
| DB / ORM | PostgreSQL 17 + Prisma 7 (`pg` adapter) |
| UI | TailwindCSS 4 + shadcn/ui |
| 검증 | zod 4 |
| 보안 | bcryptjs(해싱), 미들웨어 RBAC |
| 수료증 | `@react-pdf/renderer` (서버 측 PDF 렌더링) |

---

## 2. 디렉터리 구조 (P2 확장)

```
src/
├── app/
│   ├── (auth)/                # 회원가입·로그인
│   ├── (public)/              # 공개 강의 탐색 (P1)
│   ├── my/                    # 학생 영역
│   │   ├── qna/               # 내가 한 질문
│   │   ├── notes/             # 학습 노트
│   │   ├── vocab/             # 단어장
│   │   └── certificates/      # 수료증
│   ├── instructor/            # 강사 영역 (role=INSTRUCTOR 강제)
│   │   ├── dashboard/
│   │   ├── courses/           # 본인 강의 관리
│   │   └── qna/               # 받은 질문 답변
│   ├── admin/                 # 관리자 영역 (role=ADMIN 강제)
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── instructor-applications/
│   │   ├── course-approvals/
│   │   └── taxonomy/          # 카테고리·언어
│   └── become-instructor/     # 강사 신청 폼
├── actions/
│   ├── auth.ts
│   ├── instructor.ts          # 강사 신청·강의 CRUD·Q&A 답변
│   ├── admin.ts               # 회원·강사·강의 승인
│   ├── qna.ts
│   ├── vocab.ts
│   ├── notes.ts
│   └── certificate.ts
├── lib/
│   ├── auth.ts
│   ├── rbac.ts                # requireRole() 헬퍼
│   └── prisma.ts
├── middleware.ts              # 경로별 role 검증
└── prisma/schema.prisma
```

---

## 3. 개발 일정 (4/26 ~ 5/4, 9일)

| 일자 | 작업 |
|------|------|
| 04-26(일) | P2 docs(plan/requirements/dev-plan/erd/api) 작성 |
| 04-27(월) | p1 베이스 복제 → p2 스캐폴딩, package.json·schema 정리 |
| 04-28(화) | Prisma 스키마 P2 확장 (Q&A, 단어장, 노트, 수료증), seed 갱신 |
| 04-29(수) | RBAC 미들웨어·헬퍼, 강사 신청 흐름, 관리자 시드 |
| 04-30(목) | 관리자 대시보드·회원·강사 승인·강의 승인 |
| 05-01(금) | 강사 강의/섹션/차시 CRUD, 강사 대시보드 |
| 05-02(토) | 학생 Q&A 질문, 강사 Q&A 답변, 단어장 |
| 05-03(일) | 학습 노트, 수료증(PDF), 마이페이지 통합 |
| 05-04(월) | 통합 점검, 문서 갱신, 발표 자료(PDF) |

---

## 4. 핵심 설계 결정

### 4-1. role 표현
- DB: `users.role` = `String[]` (예: `["STUDENT", "INSTRUCTOR"]`).
- 세션 JWT의 `role` 클레임에 그대로 복사.
- `lib/rbac.ts::requireRole("INSTRUCTOR")` 가 페이지/서버 액션 진입 시 검증.

### 4-2. 강사 승인 워크플로
1. 학생이 `/become-instructor`에서 프로필(실명·헤드라인·경력) 제출 → `InstructorProfile.status = "PENDING"` 생성.
2. 관리자가 승인하면 `status = "APPROVED"` 로 갱신 + `users.role`에 `"INSTRUCTOR"` 추가.
3. 반려 시 사유 저장, role 추가 안 함.

### 4-3. 강의 게시 워크플로
- 강사 측: 강의 상태 흐름 `DRAFT → REVIEW`(게시 요청) → 관리자 처리.
- 관리자 측: `REVIEW → PUBLISHED` 또는 `REVIEW → HIDDEN(반려)`.
- `PUBLISHED` 상태만 공개 목록·상세에 노출.

### 4-4. 미들웨어
- `/admin/**`: ADMIN 미보유 시 `/403`.
- `/instructor/**`: INSTRUCTOR 미보유 시 `/403`.
- `/my/**`: 비로그인 시 `/login?next=...`.

### 4-5. Q&A 모델
- `qna_questions(courseId, lectureId?, userId)` + `qna_answers(questionId, userId)`.
- 강사는 본인 강의의 질문만 답변 가능 (`courses.instructorId.userId == session.user.id` 검증).

---

## 5. Git 전략

- 브랜치는 P1 그대로(`main`) 유지, P2는 `projects/p2/**`에 격리.
- 커밋 컨벤션 동일 (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- P2 작업 기간(4/26~5/4) 내에 일별 단위로 커밋 분할.

---

## 6. 환경변수 (P1과 동일)

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```
