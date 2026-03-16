# LinguaClass ERD

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LinguaClass |
| 작성일 | 2026-03-12 |
| DB | PostgreSQL 17 |

---

## 1. 테이블 목록

### P1 핵심 테이블 (수강생 기능)

| 테이블 | 설명 |
|--------|------|
| `users` | 회원 기본 정보 |
| `email_verifications` | 이메일 인증 토큰 |
| `languages` | 지원 언어 목록 |
| `categories` | 강의 카테고리 |
| `instructor_profiles` | 강사 프로필 |
| `courses` | 강의 상품 |
| `sections` | 강의 내 챕터 |
| `lectures` | 차시(영상) |
| `enrollments` | 수강신청 |
| `lecture_progresses` | 차시별 진도 |
| `reviews` | 강의 리뷰 |
| `wishlists` | 위시리스트 |

### P2~P3 추가 테이블

| 테이블 | 설명 | 단계 |
|--------|------|------|
| `tutor_profiles` | 튜터 프로필 | P2 |
| `tutor_schedules` | 튜터 가능 시간 | P2 |
| `tutor_bookings` | 튜터링 예약 | P2 |
| `qna_questions` / `qna_answers` | 강의 Q&A | P2 |
| `vocabulary_books` / `vocabulary_items` | 단어장 | P2 |
| `study_notes` | 학습 노트 | P2 |
| `certificates` | 수료증 | P2 |
| `ai_conversations` | AI 회화 이력 | P2 |
| `settlements` / `settlement_items` | 정산 | P3 |
| `banners` / `notices` | 공지·배너 | P3 |

---

## 2. 관계도

```
users
  ├── email_verifications (1:N)
  ├── enrollments (1:N) ──────── courses (N:1)
  │     └── lecture_progresses (1:N) ── lectures (N:1)
  ├── reviews (1:N) ──────────── courses (N:1)
  └── wishlists (1:N) ─────────── courses (N:1)

courses
  ├── instructor_profiles (N:1) ── users (1:1)
  ├── languages (N:1)
  ├── categories (N:1)
  └── sections (1:N)
        └── lectures (1:N)
```

---

## 3. 테이블 상세 (P1)

### users
```
┌─────────────────────────────────────────────┐
│                   users                      │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │ 기본 키        │
│    email    │ varchar(255)  │ UNIQUE         │
│    password │ varchar(255)  │ 소셜 시 NULL   │
│    nickname │ varchar(50)   │ NOT NULL       │
│    profile  │ text          │ S3 URL         │
│    role     │ varchar[]     │ USER/INSTRUCTOR │
│    status   │ varchar(20)   │ ACTIVE/DELETED │
│    verified │ boolean       │ DEFAULT false  │
│    created_at│ timestamptz  │                │
│    deleted_at│ timestamptz  │ 소프트 삭제    │
└─────────────┴───────────────┴───────────────┘
```

### email_verifications
```
┌─────────────────────────────────────────────┐
│             email_verifications              │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK user_id  │ bigint        │ → users.id    │
│    token    │ varchar(255)  │ UUID, UNIQUE   │
│    type     │ varchar(20)   │ SIGNUP/RESET  │
│    expires_at│ timestamptz  │               │
│    used_at  │ timestamptz   │               │
└─────────────┴───────────────┴───────────────┘
```

### languages
```
┌─────────────────────────────────────────────┐
│                  languages                   │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│    code     │ varchar(10)   │ en/ja/zh 등   │
│    name_ko  │ varchar(50)   │ 영어/일본어    │
│    name_en  │ varchar(50)   │               │
│    is_active│ boolean       │ DEFAULT true  │
└─────────────┴───────────────┴───────────────┘
UNIQUE: code
```

### categories
```
┌─────────────────────────────────────────────┐
│                 categories                   │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│    name     │ varchar(100)  │ 회화/문법 등   │
│    slug     │ varchar(100)  │ UNIQUE         │
│    is_active│ boolean       │ DEFAULT true  │
└─────────────┴───────────────┴───────────────┘
```

### instructor_profiles
```
┌─────────────────────────────────────────────┐
│             instructor_profiles              │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK user_id  │ bigint        │ → users.id    │
│    real_name│ varchar(100)  │ 실명           │
│    headline │ text          │ 한줄 소개      │
│    career   │ text          │ 경력           │
│    status   │ varchar(20)   │ PENDING/       │
│             │               │ APPROVED       │
└─────────────┴───────────────┴───────────────┘
UNIQUE: user_id
```

### courses
```
┌─────────────────────────────────────────────┐
│                   courses                    │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK instructor│ bigint       │ → instruct... │
│ FK language │ bigint        │ → languages   │
│ FK category │ bigint        │ → categories  │
│    title    │ varchar(200)  │               │
│    slug     │ varchar(200)  │ UNIQUE         │
│    thumbnail│ text          │ S3 URL         │
│    level    │ varchar(20)   │ BEGINNER/...  │
│    price    │ integer       │ 원, 0=무료     │
│    status   │ varchar(20)   │ DRAFT/PUBLISHED│
│    avg_rating│ numeric(3,2) │               │
│    created_at│ timestamptz  │               │
└─────────────┴───────────────┴───────────────┘
INDEX: language_id, category_id, status, level
```

### sections
```
┌─────────────────────────────────────────────┐
│                  sections                    │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK course_id│ bigint        │ → courses.id  │
│    title    │ varchar(200)  │               │
│    sort_order│ integer      │               │
└─────────────┴───────────────┴───────────────┘
```

### lectures
```
┌─────────────────────────────────────────────┐
│                  lectures                    │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK section  │ bigint        │ → sections.id │
│    title    │ varchar(200)  │               │
│    hls_url  │ text          │ CloudFront URL │
│    duration │ integer       │ 초            │
│    is_free  │ boolean       │ 무료 미리보기  │
│    sort_order│ integer      │               │
└─────────────┴───────────────┴───────────────┘
```

### enrollments
```
┌─────────────────────────────────────────────┐
│                 enrollments                  │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK user_id  │ bigint        │ → users.id    │
│ FK course_id│ bigint        │ → courses.id  │
│    status   │ varchar(20)   │ ACTIVE/REFUNDED│
│    progress │ numeric(5,2)  │ 진도율 (%)    │
│    created_at│ timestamptz  │               │
└─────────────┴───────────────┴───────────────┘
UNIQUE: (user_id, course_id)
```

### lecture_progresses
```
┌─────────────────────────────────────────────┐
│              lecture_progresses              │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK enrollment│ bigint       │ →enrollments  │
│ FK lecture  │ bigint        │ → lectures.id │
│    watched  │ integer       │ 시청 위치(초) │
│    completed│ boolean       │ DEFAULT false │
└─────────────┴───────────────┴───────────────┘
UNIQUE: (enrollment_id, lecture_id)
```

### reviews
```
┌─────────────────────────────────────────────┐
│                  reviews                     │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK user_id  │ bigint        │ → users.id    │
│ FK course_id│ bigint        │ → courses.id  │
│    rating   │ smallint      │ 1~5           │
│    content  │ text          │               │
│    created_at│ timestamptz  │               │
└─────────────┴───────────────┴───────────────┘
UNIQUE: (user_id, course_id)
```

### wishlists
```
┌─────────────────────────────────────────────┐
│                  wishlists                   │
├─────────────┬───────────────┬───────────────┤
│ PK id       │ bigserial     │               │
│ FK user_id  │ bigint        │ → users.id    │
│ FK course_id│ bigint        │ → courses.id  │
│    created_at│ timestamptz  │               │
└─────────────┴───────────────┴───────────────┘
UNIQUE: (user_id, course_id)
```

---

## 4. DBML (dbdiagram.io)

```dbml
Table users {
  id bigserial [pk]
  email varchar(255) [unique, not null]
  password_hash varchar(255)
  nickname varchar(50) [not null]
  profile_image text
  role varchar[] [note: 'USER/INSTRUCTOR/TUTOR/ADMIN']
  status varchar(20) [default: 'ACTIVE', note: 'ACTIVE/SUSPENDED/DELETED']
  email_verified boolean [default: false]
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]
  deleted_at timestamptz
}

Table email_verifications {
  id bigserial [pk]
  user_id bigint [ref: > users.id]
  token varchar(255) [unique]
  type varchar(20) [note: 'SIGNUP/RESET_PW']
  expires_at timestamptz
  used_at timestamptz
  created_at timestamptz [default: `now()`]
}

Table languages {
  id bigserial [pk]
  code varchar(10) [unique, note: 'en/ja/zh/es/fr/ko']
  name_ko varchar(50)
  name_en varchar(50)
  is_active boolean [default: true]
  sort_order integer
}

Table categories {
  id bigserial [pk]
  name varchar(100)
  slug varchar(100) [unique]
  is_active boolean [default: true]
  sort_order integer
}

Table instructor_profiles {
  id bigserial [pk]
  user_id bigint [ref: - users.id, unique]
  real_name varchar(100)
  headline text
  description text
  career text
  status varchar(20) [default: 'PENDING', note: 'PENDING/APPROVED/REJECTED']
  created_at timestamptz [default: `now()`]
}

Table courses {
  id bigserial [pk]
  instructor_id bigint [ref: > instructor_profiles.id]
  language_id bigint [ref: > languages.id]
  category_id bigint [ref: > categories.id]
  title varchar(200)
  slug varchar(200) [unique]
  description text
  thumbnail text
  level varchar(20) [note: 'BEGINNER/ELEMENTARY/INTERMEDIATE/ADVANCED']
  price integer [default: 0]
  status varchar(20) [default: 'DRAFT', note: 'DRAFT/REVIEW/PUBLISHED/HIDDEN']
  avg_rating numeric(3,2) [default: 0]
  review_count integer [default: 0]
  enrollment_count integer [default: 0]
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]

  indexes {
    language_id
    category_id
    status
    level
  }
}

Table sections {
  id bigserial [pk]
  course_id bigint [ref: > courses.id]
  title varchar(200)
  sort_order integer
  created_at timestamptz [default: `now()`]
}

Table lectures {
  id bigserial [pk]
  section_id bigint [ref: > sections.id]
  title varchar(200)
  hls_url text
  duration integer [note: '초']
  is_free_preview boolean [default: false]
  sort_order integer
  created_at timestamptz [default: `now()`]
}

Table enrollments {
  id bigserial [pk]
  user_id bigint [ref: > users.id]
  course_id bigint [ref: > courses.id]
  status varchar(20) [default: 'ACTIVE', note: 'ACTIVE/COMPLETED/REFUNDED']
  progress_pct numeric(5,2) [default: 0]
  created_at timestamptz [default: `now()`]

  indexes {
    (user_id, course_id) [unique]
  }
}

Table lecture_progresses {
  id bigserial [pk]
  enrollment_id bigint [ref: > enrollments.id]
  lecture_id bigint [ref: > lectures.id]
  watched_seconds integer [default: 0]
  is_completed boolean [default: false]
  updated_at timestamptz [default: `now()`]

  indexes {
    (enrollment_id, lecture_id) [unique]
  }
}

Table reviews {
  id bigserial [pk]
  user_id bigint [ref: > users.id]
  course_id bigint [ref: > courses.id]
  rating smallint [note: '1~5']
  content text
  created_at timestamptz [default: `now()`]
  updated_at timestamptz [default: `now()`]

  indexes {
    (user_id, course_id) [unique]
  }
}

Table wishlists {
  id bigserial [pk]
  user_id bigint [ref: > users.id]
  course_id bigint [ref: > courses.id]
  created_at timestamptz [default: `now()`]

  indexes {
    (user_id, course_id) [unique]
  }
}
```
