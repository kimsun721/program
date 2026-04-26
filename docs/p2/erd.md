# LinguaClass P2 ERD

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LinguaClass |
| 단계 | P2 |
| 작성일 | 2026-04-26 |
| DB | PostgreSQL 17 |

---

## 1. 변경 요약 (P1 → P2)

### 변경 테이블

| 테이블 | 변경 내용 |
|--------|-----------|
| `users` | `role`은 그대로 배열. 값에 `STUDENT/INSTRUCTOR/ADMIN` 사용 |
| `instructor_profiles` | `status` 흐름 `PENDING/APPROVED/REJECTED`, `rejectionReason` 컬럼 추가 |
| `courses` | `status` 흐름 `DRAFT/REVIEW/PUBLISHED/HIDDEN`, `reviewedAt`, `rejectionReason` 추가 |

### 신규 테이블

| 테이블 | 설명 |
|--------|------|
| `qna_questions` | 강의·차시 단위 학생 질문 |
| `qna_answers` | 강사/관리자 답변 |
| `vocabulary_books` | 강의별 단어장 |
| `vocabulary_items` | 단어장 항목 |
| `study_notes` | 차시별 학습 노트 |
| `certificates` | 수강 완료 수료증 |

---

## 2. 관계도

```
users (role[])
  ├── instructor_profiles (1:1)  ── courses (1:N)
  ├── enrollments (1:N) ──── courses (N:1)
  │     ├── lecture_progresses (1:N) ── lectures
  │     ├── vocabulary_books (1:N) ── vocabulary_items
  │     ├── study_notes (1:N) ── lectures
  │     └── certificates (1:1)
  ├── qna_questions (1:N) ── courses / lectures
  │     └── qna_answers (1:N) ── users(강사/관리자)
  ├── reviews (1:N)
  └── wishlists (1:N)
```

---

## 3. 신규/변경 테이블 상세

### users (변경 없음, role 사용 규칙만 정리)
- `role`: `String[]`. 가능한 값 `STUDENT`, `INSTRUCTOR`, `ADMIN`.
- 기본 가입은 `["STUDENT"]`, 강사 승인 시 `"INSTRUCTOR"` 추가.
- `ADMIN`은 seed로만 부여.

### instructor_profiles (변경)
```
┌─────────────────────────────────────────────────┐
│              instructor_profiles                 │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK user_id       │ String, UNIQ  │ → users.id   │
│    realName      │ varchar(100)  │              │
│    headline      │ text          │              │
│    description   │ text          │              │
│    career        │ text          │              │
│    status        │ varchar(20)   │ PENDING/     │
│                  │               │ APPROVED/    │
│                  │               │ REJECTED     │
│    rejectionReason│ text         │ NULL 허용    │
│    reviewedAt    │ timestamptz   │              │
│    createdAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
```

### courses (변경)
- `status` 흐름: `DRAFT → REVIEW → PUBLISHED | HIDDEN`
- 추가 컬럼: `reviewedAt timestamptz?`, `rejectionReason text?`
- 인덱스: `status`, `(instructorId, status)`

### qna_questions
```
┌─────────────────────────────────────────────────┐
│                qna_questions                     │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK user_id       │ String        │ → users.id   │
│ FK course_id     │ String        │ → courses.id │
│ FK lecture_id    │ String?       │ → lectures.id│
│    title         │ varchar(200)  │              │
│    content       │ text          │              │
│    status        │ varchar(20)   │ OPEN/ANSWERED│
│    createdAt     │ timestamptz   │              │
│    updatedAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
INDEX: (course_id, status), (user_id)
```

### qna_answers
```
┌─────────────────────────────────────────────────┐
│                 qna_answers                      │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK question_id   │ String        │ → qna_q.id   │
│ FK user_id       │ String        │ → users.id   │
│    content       │ text          │              │
│    createdAt     │ timestamptz   │              │
│    updatedAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
INDEX: (question_id)
```

### vocabulary_books
```
┌─────────────────────────────────────────────────┐
│              vocabulary_books                    │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK user_id       │ String        │ → users.id   │
│ FK course_id     │ String?       │ → courses.id │
│    title         │ varchar(100)  │              │
│    createdAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
```

### vocabulary_items
```
┌─────────────────────────────────────────────────┐
│              vocabulary_items                    │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK book_id       │ String        │ → books.id   │
│    term          │ varchar(100)  │ 단어         │
│    meaning       │ text          │ 뜻           │
│    example       │ text?         │ 예문         │
│    learned       │ boolean       │ DEFAULT false│
│    createdAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
INDEX: (book_id)
```

### study_notes
```
┌─────────────────────────────────────────────────┐
│                 study_notes                      │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK user_id       │ String        │ → users.id   │
│ FK lecture_id    │ String        │ → lectures.id│
│    content       │ text          │              │
│    timestampSec  │ int?          │ 영상 시각    │
│    createdAt     │ timestamptz   │              │
│    updatedAt     │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
INDEX: (user_id, lecture_id)
```

### certificates
```
┌─────────────────────────────────────────────────┐
│                 certificates                     │
├──────────────────┬───────────────┬──────────────┤
│ PK id            │ cuid          │              │
│ FK user_id       │ String        │ → users.id   │
│ FK course_id     │ String        │ → courses.id │
│    serialNo      │ varchar(50)   │ UNIQUE       │
│    issuedAt      │ timestamptz   │              │
└──────────────────┴───────────────┴──────────────┘
UNIQUE: (user_id, course_id)
```

---

## 4. Prisma DBML 발췌 (신규 모델)

```dbml
Table qna_questions {
  id varchar [pk]
  user_id varchar [ref: > users.id]
  course_id varchar [ref: > courses.id]
  lecture_id varchar [ref: > lectures.id, null]
  title varchar(200)
  content text
  status varchar(20) [default: 'OPEN']
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]
  indexes {
    (course_id, status)
    (user_id)
  }
}

Table qna_answers {
  id varchar [pk]
  question_id varchar [ref: > qna_questions.id]
  user_id varchar [ref: > users.id]
  content text
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]
}

Table vocabulary_books {
  id varchar [pk]
  user_id varchar [ref: > users.id]
  course_id varchar [ref: > courses.id, null]
  title varchar(100)
  created_at timestamptz [default: `now()`]
}

Table vocabulary_items {
  id varchar [pk]
  book_id varchar [ref: > vocabulary_books.id]
  term varchar(100)
  meaning text
  example text
  learned boolean [default: false]
  created_at timestamptz [default: `now()`]
}

Table study_notes {
  id varchar [pk]
  user_id varchar [ref: > users.id]
  lecture_id varchar [ref: > lectures.id]
  content text
  timestamp_sec int
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]
}

Table certificates {
  id varchar [pk]
  user_id varchar [ref: > users.id]
  course_id varchar [ref: > courses.id]
  serial_no varchar(50) [unique]
  issued_at timestamptz [default: `now()`]
  indexes {
    (user_id, course_id) [unique]
  }
}
```
