# LinguaClass 개발계획서

| 항목 | 내용 |
|------|------|
| 프로젝트명 | LinguaClass |
| 문서 버전 | v1.0.0 |
| 작성일 | 2026-03-12 |

---

## 1. 기술 스택

### Full-Stack (Next.js)

| 기술 | 버전 | 선택 이유 |
|------|------|-----------|
| Next.js (App Router) | 15.x | 풀스택 단일 프레임워크, SSR/SSG로 SEO 최적화, Server Actions으로 API 대체 |
| TypeScript | 5.x | 정적 타입으로 런타임 오류 방지 |
| Prisma ORM | 5.x | 타입 안전 쿼리, 마이그레이션 관리 |
| TailwindCSS | 4.x | 유틸리티 클래스 기반 빠른 UI 구성 |
| shadcn/ui | latest | 접근성 준수, Radix UI 기반 컴포넌트 |
| NextAuth.js | 5.x | JWT 기반 세션·인증 관리 |

### 데이터베이스 / 인프라

| 기술 | 역할 |
|------|------|
| PostgreSQL 17 | 메인 DB |
| AWS S3 + CloudFront | 영상·이미지 저장 및 CDN |
| Vercel | 배포 (Next.js 최적화 호스팅) |
| GitHub Actions | CI/CD |

---

## 2. 시스템 아키텍처

```
[Next.js - Vercel]
  ├── App Router (페이지·UI)
  ├── Server Actions (비즈니스 로직·인증)
  ├── Route Handlers (스트리밍 URL 발급 등)
  └── Prisma → [PostgreSQL - Vercel Postgres / RDS]

[AWS S3 + CloudFront]
  └── 영상(HLS) · 이미지 저장 및 CDN 배포
```

---

## 3. 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/            # 로그인·회원가입 페이지
│   ├── courses/           # 강의 목록·상세
│   ├── my/                # 내 강의
│   └── api/               # Route Handlers (스트리밍 등)
├── actions/               # Server Actions (인증·수강·리뷰 등)
├── components/            # 공통 UI 컴포넌트
├── lib/
│   ├── prisma.ts          # Prisma 클라이언트
│   └── auth.ts            # NextAuth 설정
└── prisma/
    └── schema.prisma      # DB 스키마
```

---

## 4. 개발 일정

| 단계 | 기간 | 주요 내용 |
|------|------|-----------|
| **P1** | **1~2주차** | **기획·설계 문서 작성 (현재)** |
| P2 | 3~6주차 | 인증, 강의 CRUD, HLS 스트리밍, AI 회화, 튜터링 |
| P3 | 7~10주차 | 결제, 관리자, 정산, 알림, 모니터링 |
| P4 | 11~12주차 | 통합 테스트, 성능 최적화, 배포 |

---

## 5. Git 전략

**브랜치 구조**

```
main          ← 프로덕션
develop       ← 통합 개발
feature/*     ← 기능 개발
hotfix/*      ← 긴급 수정
```

**커밋 컨벤션**

```
feat: 새 기능
fix: 버그 수정
refactor: 리팩토링
docs: 문서
chore: 설정·빌드
```

---

## 6. 주요 환경변수

```env
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...

# AWS
AWS_S3_BUCKET=...
AWS_CLOUDFRONT_URL=...
```
