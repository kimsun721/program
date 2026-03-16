# LinguaClass API 명세서

| 항목 | 내용 |
|------|------|
| Base URL | `https://linguaclass.kr/api` |
| 인증 | `Authorization: Bearer {access_token}` |
| 작성일 | 2026-03-12 |

---

## 공통

### 응답 형식

```json
// 성공
{ "success": true, "data": { ... } }

// 목록 (페이지네이션)
{ "success": true, "data": [...], "meta": { "page": 1, "limit": 20, "total": 150 } }

// 에러
{ "success": false, "error": { "code": "UNAUTHORIZED", "message": "인증이 필요합니다." } }
```

### 에러 코드

| 상태 | 코드 | 설명 |
|------|------|------|
| 400 | `VALIDATION_ERROR` | 유효성 검사 실패 |
| 401 | `UNAUTHORIZED` | 토큰 없음/만료 |
| 403 | `FORBIDDEN` | 권한 없음 |
| 404 | `NOT_FOUND` | 리소스 없음 |
| 409 | `CONFLICT` | 중복 (이메일 등) |
| 500 | `INTERNAL_ERROR` | 서버 오류 |

### 권한

| 기호 | 설명 |
|------|------|
| 🔓 | 비회원 포함 누구나 |
| 🔑 | 로그인 필요 |

---

## 1. 인증 (Auth)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| POST | `/auth/register` | 이메일 회원가입 | 🔓 |
| POST | `/auth/login` | 이메일 로그인 | 🔓 |
| POST | `/auth/refresh` | Access Token 재발급 | 🔓 |
| POST | `/auth/logout` | 로그아웃 | 🔑 |
| POST | `/auth/forgot-password` | 비밀번호 재설정 이메일 발송 | 🔓 |
| POST | `/auth/reset-password` | 비밀번호 변경 | 🔓 |
| GET | `/auth/verify-email` | 이메일 인증 | 🔓 |

**POST /auth/register**
```json
// Request
{ "email": "user@example.com", "password": "Pass1234!", "nickname": "언어학습자" }

// Response 201
{ "success": true, "data": { "message": "이메일 인증 링크를 발송했습니다." } }
```

**POST /auth/login**
```json
// Request
{ "email": "user@example.com", "password": "Pass1234!" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": { "id": 1, "email": "user@example.com", "nickname": "언어학습자" }
  }
}
```

---

## 2. 사용자 (Users)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/users/me` | 내 프로필 조회 | 🔑 |
| PATCH | `/users/me` | 프로필 수정 | 🔑 |
| DELETE | `/users/me` | 회원탈퇴 | 🔑 |

**PATCH /users/me**
```json
// Request
{ "nickname": "새닉네임", "bio": "안녕하세요", "profileImage": "https://s3.../img.jpg" }
```

---

## 3. 강의 탐색 (Courses)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/courses` | 강의 목록 (필터·정렬·검색) | 🔓 |
| GET | `/courses/:id` | 강의 상세 | 🔓 |
| GET | `/languages` | 지원 언어 목록 | 🔓 |
| GET | `/categories` | 카테고리 목록 | 🔓 |

**GET /courses**

Query Parameters:
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| language | string | 언어 코드 (en/ja/zh/...) |
| category | string | 카테고리 슬러그 |
| level | string | BEGINNER/ELEMENTARY/INTERMEDIATE/ADVANCED |
| q | string | 키워드 검색 |
| sort | string | latest/popular/rating/price_asc/price_desc |
| page | number | 페이지 (default: 1) |
| limit | number | 개수 (default: 20) |

```json
// Response 200
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "영어 회화 입문",
      "thumbnail": "https://cdn.../thumb.jpg",
      "instructor": { "id": 1, "nickname": "강사A" },
      "language": { "code": "en", "name": "영어" },
      "level": "BEGINNER",
      "price": 50000,
      "avgRating": 4.7,
      "enrollmentCount": 320
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 85 }
}
```

**GET /courses/:id**
```json
// Response 200
{
  "success": true,
  "data": {
    "id": 1,
    "title": "영어 회화 입문",
    "description": "...",
    "instructor": { "id": 1, "nickname": "강사A", "headline": "10년 경력 영어 강사" },
    "sections": [
      {
        "id": 1,
        "title": "1강 자기소개",
        "lectures": [
          { "id": 1, "title": "오리엔테이션", "duration": 600, "isFreePreview": true }
        ]
      }
    ],
    "avgRating": 4.7,
    "reviewCount": 42
  }
}
```

---

## 4. 위시리스트 (Wishlists)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/wishlists` | 위시리스트 목록 | 🔑 |
| POST | `/wishlists` | 강의 추가 | 🔑 |
| DELETE | `/wishlists/:courseId` | 강의 제거 | 🔑 |

**POST /wishlists**
```json
// Request
{ "courseId": 1 }
```

---

## 5. 수강 (Enrollments & Learning)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/enrollments` | 내 수강 목록 | 🔑 |
| GET | `/enrollments/:courseId` | 수강 상세 (진도) | 🔑 |
| GET | `/lectures/:id/stream` | 강의 스트리밍 URL | 🔑 |
| POST | `/lectures/:id/progress` | 진도 저장 | 🔑 |

**GET /lectures/:id/stream**
```json
// Response 200
{
  "success": true,
  "data": {
    "hlsUrl": "https://cdn.linguaclass.kr/lectures/1/master.m3u8",
    "expiresAt": "2026-03-12T13:00:00Z"
  }
}
```

**POST /lectures/:id/progress**
```json
// Request
{ "watchedSeconds": 350, "isCompleted": false }
```

---

## 6. 리뷰 (Reviews)

| 메서드 | 엔드포인트 | 설명 | 권한 |
|--------|-----------|------|------|
| GET | `/courses/:id/reviews` | 강의 리뷰 목록 | 🔓 |
| POST | `/courses/:id/reviews` | 리뷰 작성 | 🔑 |
| PATCH | `/reviews/:id` | 리뷰 수정 | 🔑 |
| DELETE | `/reviews/:id` | 리뷰 삭제 | 🔑 |

**POST /courses/:id/reviews**
```json
// Request
{ "rating": 5, "content": "정말 유익한 강의였습니다!" }
```

---

## 엔드포인트 요약

| # | 섹션 | 엔드포인트 수 |
|---|------|--------------|
| 1 | 인증 | 7 |
| 2 | 사용자 | 3 |
| 3 | 강의 탐색 | 4 |
| 4 | 위시리스트 | 3 |
| 5 | 수강 | 4 |
| 6 | 리뷰 | 4 |
| | **합계** | **25** |
