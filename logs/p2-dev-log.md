# LinguaClass P2 개발 일지

| 항목 | 내용 |
|------|------|
| 단계 | P2 — 역할 분리 / 인증 강화 / 전체 기능 구현 |
| 기간 | 2026-04-26 ~ 2026-05-04 (9일) |
| 결과 | 학생/강사/관리자 3개 역할 RBAC, 강사 승인 워크플로, 강의 게시 승인 워크플로, Q&A, 단어장, 학습 노트, 수료증 PDF |

---

## Day 1 — 2026-04-26 (일)
- P2 docs 5종 작성: `plan.md`, `requirements.md`, `dev-plan.md`, `erd.md`, `api.md`.
- 역할 매트릭스 정리 (STUDENT/INSTRUCTOR/ADMIN), P2 범위/비범위 확정.
- 신규 ERD 7개 테이블 정의 (Q&A 2개, 단어장 2개, 노트, 수료증).
- 커밋: `docs: add p2 plan/requirements/dev-plan/erd/api`

## Day 2 — 2026-04-27 (월)
- P1 베이스를 `projects/p2`로 스캐폴딩(rsync). 의존성·`tsconfig` 확인.
- `package.json` 이름/버전 갱신, `@react-pdf/renderer` 추가.
- 커밋: `chore(p2): scaffold project from p1 base`

## Day 3 — 2026-04-28 (화)
- Prisma 스키마 확장.
  - `instructor_profiles`: `status` 흐름 `PENDING/APPROVED/REJECTED` + `rejectionReason`/`reviewedAt`.
  - `courses`: 상태 흐름 `DRAFT → REVIEW → PUBLISHED | HIDDEN`로 변경.
  - 신규 모델: `QnaQuestion`, `QnaAnswer`, `VocabularyBook`, `VocabularyItem`, `StudyNote`, `Certificate`.
- `seed.ts`에 ADMIN 계정과 PENDING 강사 신청 데이터 추가.
- 커밋: `feat(p2): extend prisma schema for RBAC, instructor approval, Q&A, vocab, notes, certificates`

## Day 4 — 2026-04-29 (수)
- `lib/rbac.ts`로 `requireUser/requireRole/requireAnyRole/assertRoleInAction` 헬퍼 작성.
- 루트 `middleware.ts`에서 `/admin/**`·`/instructor/**`·`/my/**`·`/become-instructor` 경로별 권한 검증.
- 공통 `/403` 페이지 추가.
- `Header.tsx`에 역할에 따라 강사/관리자 메뉴 노출.
- 강사 신청(`/become-instructor`) + 액션 `applyInstructor`, 비밀번호 변경 액션 `changePassword`, 마이페이지 계정 화면 추가.
- 커밋: `feat(p2): RBAC middleware, role-aware header, 403 page, instructor application flow, change password`

## Day 5 — 2026-04-30 (목)
- 관리자 영역 전체 구현.
  - 사이드 레이아웃과 5개 메뉴(대시보드/회원/강사 신청/강의 승인/카테고리·언어).
  - 회원 상태 변경, 강사 신청 승인·반려, 강의 게시 승인·반려, 카테고리 CRUD, 언어 토글.
- 액션: `actions/admin.ts` 9개.
- 커밋: `feat(p2): admin dashboard, user/instructor/course approvals, taxonomy management`

## Day 6 — 2026-05-01 (금)
- 강사 영역 전체 구현.
  - 강사 사이드 레이아웃, 대시보드(KPI 4종 + 최근 강의).
  - 강의 CRUD, 섹션·차시 CRUD를 가진 커리큘럼 에디터.
  - DRAFT → REVIEW 게시 요청 흐름.
  - 본인 강의 Q&A 답변 페이지.
- 액션: `actions/instructor.ts` 13개.
- 커밋: `feat(p2): instructor dashboard, course CRUD with curriculum editor, Q&A answering`

## Day 7 — 2026-05-02 (토)
- 학생 영역 확장.
  - Q&A 마이페이지(/my/qna): 본인 질문 수정/삭제.
  - 단어장(/my/vocab, /my/vocab/[bookId]): 단어장 CRUD + 단어 CRUD + 학습 토글 + 진행률 표시.
  - 학습 노트(/my/notes): 일목요연한 목록 + 차시 학습 페이지 안에 노트 작성 위젯.
  - 수료증(/my/certificates): 진도 100% 강의 자동 노출 + 발급 버튼.
  - 수료증 PDF Route Handler(`/api/certificates/:id/pdf`) — `@react-pdf/renderer`로 서버 렌더링.
- 커밋: `feat(p2): student Q&A, vocabulary, study notes, certificate issue + PDF`

## Day 8 — 2026-05-03 (일)
- 강의 상세 페이지에 Q&A 탭 통합. 수강생만 작성 가능, 비수강생은 안내.
- 강사 답변이 학생 질문 아래에 인라인 노출.
- 커밋: `feat(p2): integrate Q&A section into course detail page`

## Day 9 — 2026-05-04 (월)
- 통합 점검(역할별 로그인 → 페이지 진입 → 핵심 시나리오 1회씩).
- 개발 일지(이 문서) 정리.
- 발표 자료(슬라이드 → PDF) 작성, 본 리포지토리 루트에 출력.
- 커밋: `docs(p2): development log`

---

## 시나리오 점검 체크리스트

- [x] STUDENT 회원가입 → 이메일 인증 → 로그인
- [x] STUDENT가 강사 신청 → ADMIN 승인 → STUDENT 세션 갱신 후 INSTRUCTOR 메뉴 노출
- [x] INSTRUCTOR가 강의 생성(DRAFT) → 섹션·차시 추가 → 게시 요청(REVIEW)
- [x] ADMIN이 강의 승인(PUBLISHED) → 공개 목록 노출
- [x] STUDENT가 강의 상세 → Q&A 작성 → INSTRUCTOR 답변
- [x] STUDENT가 차시 시청 → 진도 100% → 수료증 발급 → PDF 다운로드
- [x] STUDENT가 단어장 만들고 단어 추가/학습 체크
- [x] ADMIN이 회원 정지(SUSPENDED) → 로그인 차단 확인

## 비범위 (P3 이월)

- 결제/환불/구독, 정산, 알림(이메일/푸시) 스케줄러
- 모니터링·로깅, 배치 작업, 캐싱
- AI 회화, 원어민 튜터 1:1 화상 수업
