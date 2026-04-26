# LinguaClass P2 API/Server Actions 명세

| 항목 | 내용 |
|------|------|
| Base URL | `https://linguaclass.kr` |
| 작성일 | 2026-04-26 |
| 형태 | Next.js Server Actions + 일부 Route Handler |
| 인증 | NextAuth 세션 쿠키 (JWT) |

> P2는 Server Actions 중심이며, 외부에서 호출 가능한 REST API는 최소화한다. 아래는 액션·핸들러 단위 명세.

---

## 공통

### 응답 형식 (Server Action 반환)

```ts
type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };
```

### 권한 기호

| 기호 | 설명 |
|------|------|
| 🔓 | 비로그인 가능 |
| 🔑 | 로그인 필요 (STUDENT 이상) |
| 🎓 | INSTRUCTOR 필요 |
| 🛡️ | ADMIN 필요 |

---

## 1. 인증 (P1 유지)

| 액션 | 시그니처 | 권한 |
|------|----------|------|
| `register(formData)` | email/password/nickname | 🔓 |
| `verifyEmail(token)` | 이메일 인증 | 🔓 |
| `login(formData)` | 이메일 로그인 | 🔓 |
| `logout()` | 로그아웃 | 🔑 |
| `forgotPassword(formData)` | 재설정 메일 발송 | 🔓 |
| `resetPassword(token, formData)` | 비밀번호 재설정 | 🔓 |
| `changePassword(formData)` | 현재 비번 확인 후 변경 | 🔑 |
| `updateProfile(formData)` | 닉네임/프로필 | 🔑 |
| `deleteAccount(formData)` | 회원 탈퇴 | 🔑 |

---

## 2. 강사 신청 / 강사 액션

| 액션 | 설명 | 권한 |
|------|------|------|
| `applyInstructor(formData)` | 실명/헤드라인/경력 제출, status=PENDING 생성 | 🔑 |
| `instructor.createCourse(formData)` | 강의 생성(DRAFT) | 🎓 |
| `instructor.updateCourse(id, formData)` | 강의 수정 (본인만) | 🎓 |
| `instructor.deleteCourse(id)` | DRAFT 강의 삭제 (본인만) | 🎓 |
| `instructor.submitForReview(id)` | DRAFT→REVIEW | 🎓 |
| `instructor.addSection(courseId, title)` | 섹션 추가 | 🎓 |
| `instructor.updateSection(id, formData)` | 섹션 수정 | 🎓 |
| `instructor.reorderSection(id, sortOrder)` | 순서 변경 | 🎓 |
| `instructor.deleteSection(id)` | 섹션 삭제 | 🎓 |
| `instructor.addLecture(sectionId, formData)` | 차시 추가 | 🎓 |
| `instructor.updateLecture(id, formData)` | 차시 수정 | 🎓 |
| `instructor.deleteLecture(id)` | 차시 삭제 | 🎓 |
| `instructor.answerQna(questionId, content)` | 본인 강의 Q&A 답변 | 🎓 |

---

## 3. 관리자 액션

| 액션 | 설명 | 권한 |
|------|------|------|
| `admin.listUsers(query)` | 회원 목록·검색 | 🛡️ |
| `admin.updateUserStatus(userId, status)` | ACTIVE/SUSPENDED/DELETED | 🛡️ |
| `admin.approveInstructor(profileId)` | PENDING → APPROVED, role 추가 | 🛡️ |
| `admin.rejectInstructor(profileId, reason)` | PENDING → REJECTED | 🛡️ |
| `admin.approveCourse(courseId)` | REVIEW → PUBLISHED | 🛡️ |
| `admin.rejectCourse(courseId, reason)` | REVIEW → HIDDEN | 🛡️ |
| `admin.upsertCategory(formData)` | 카테고리 생성/수정 | 🛡️ |
| `admin.toggleCategory(id)` | 활성/비활성 토글 | 🛡️ |
| `admin.toggleLanguage(id)` | 언어 활성/비활성 | 🛡️ |

---

## 4. 학생 추가 액션

### 4-1. Q&A

| 액션 | 설명 | 권한 |
|------|------|------|
| `qna.create(courseId, formData)` | 질문 등록 | 🔑(수강생만) |
| `qna.update(id, formData)` | 본인 질문 수정 | 🔑 |
| `qna.delete(id)` | 본인 질문 삭제 | 🔑 |

### 4-2. 단어장

| 액션 | 설명 | 권한 |
|------|------|------|
| `vocab.createBook(formData)` | 단어장 생성 | 🔑 |
| `vocab.deleteBook(id)` | 단어장 삭제 | 🔑 |
| `vocab.addItem(bookId, formData)` | 단어 추가 | 🔑 |
| `vocab.updateItem(id, formData)` | 단어 수정 | 🔑 |
| `vocab.toggleLearned(id)` | 학습 완료 토글 | 🔑 |
| `vocab.deleteItem(id)` | 단어 삭제 | 🔑 |

### 4-3. 학습 노트

| 액션 | 설명 | 권한 |
|------|------|------|
| `notes.create(lectureId, formData)` | 노트 생성 | 🔑 |
| `notes.update(id, formData)` | 노트 수정 | 🔑 |
| `notes.delete(id)` | 노트 삭제 | 🔑 |

### 4-4. 수료증

| 액션 | 설명 | 권한 |
|------|------|------|
| `certificate.issue(courseId)` | 진도 100% 검증 후 발급 | 🔑 |

| Route Handler | 설명 | 권한 |
|---------------|------|------|
| `GET /api/certificates/:id/pdf` | 수료증 PDF 응답 | 🔑(본인) |

---

## 5. 미들웨어 (RBAC)

| 경로 prefix | 요구 권한 | 미통과 시 |
|-------------|-----------|-----------|
| `/admin/**` | ADMIN | `/403` |
| `/instructor/**` | INSTRUCTOR | `/403` |
| `/my/**`, `/become-instructor` | 로그인 | `/login?next=...` |
| 그 외 | 공개 | - |

---

## 6. 엔드포인트 요약

| # | 영역 | 액션 수 |
|---|------|---------|
| 1 | 인증·계정 | 9 |
| 2 | 강사 | 13 |
| 3 | 관리자 | 9 |
| 4 | Q&A | 3 |
| 5 | 단어장 | 6 |
| 6 | 노트 | 3 |
| 7 | 수료증 (액션+핸들러) | 2 |
| | **합계** | **45** |
