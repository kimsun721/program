export type UserRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "REFUNDED";
export type EmailVerificationType = "SIGNUP" | "RESET_PW";

export interface CourseFilters {
  languageId?: string;
  categoryId?: string;
  level?: CourseLevel;
  search?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popular";
  page?: number;
  limit?: number;
}

export interface CourseWithDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  level: string;
  price: number;
  avgRating: number;
  reviewCount: number;
  enrollmentCount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  language: {
    id: string;
    code: string;
    nameKo: string;
    nameEn: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  instructor: {
    id: string;
    realName: string;
    headline: string;
    description: string;
    career: string;
    user: {
      id: string;
      nickname: string;
      profileImage: string | null;
    };
  };
  sections: SectionWithLectures[];
}

export interface SectionWithLectures {
  id: string;
  title: string;
  sortOrder: number;
  lectures: LectureInfo[];
}

export interface LectureInfo {
  id: string;
  title: string;
  duration: number;
  isFreePreview: boolean;
  sortOrder: number;
  hlsUrl: string | null;
}

export interface EnrollmentWithCourse {
  id: string;
  status: string;
  progressPct: number;
  createdAt: Date;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail: string | null;
    level: string;
    instructor: {
      realName: string;
    };
    sections: {
      lectures: { id: string }[];
    }[];
  };
}

export interface ReviewWithUser {
  id: string;
  rating: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    nickname: string;
    profileImage: string | null;
  };
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image: string | null;
      role: string[];
    };
  }

  interface User {
    role?: string[];
  }
}

