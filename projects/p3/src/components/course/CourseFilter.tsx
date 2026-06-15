"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface Language {
  id: string;
  code: string;
  nameKo: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CourseFilterProps {
  languages: Language[];
  categories: Category[];
}

export default function CourseFilter({ languages, categories }: CourseFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleFilter = (key: string, value: string) => {
    const qs = createQueryString({ [key]: value });
    router.push(`/courses?${qs}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    const qs = createQueryString({ search: search || null });
    router.push(`/courses?${qs}`);
  };

  const handleReset = () => {
    router.push("/courses");
  };

  const hasFilters =
    searchParams.get("languageId") ||
    searchParams.get("categoryId") ||
    searchParams.get("level") ||
    searchParams.get("search") ||
    searchParams.get("sort");

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            name="search"
            placeholder="강의 검색..."
            defaultValue={searchParams.get("search") || ""}
            className="pl-9"
          />
        </div>
        <Button type="submit">검색</Button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={searchParams.get("languageId") || "all"}
          onValueChange={(v) => handleFilter("languageId", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="언어" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 언어</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.id} value={lang.id}>
                {lang.nameKo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("categoryId") || "all"}
          onValueChange={(v) => handleFilter("categoryId", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("level") || "all"}
          onValueChange={(v) => handleFilter("level", v)}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="레벨" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 레벨</SelectItem>
            <SelectItem value="BEGINNER">입문</SelectItem>
            <SelectItem value="INTERMEDIATE">초급</SelectItem>
            <SelectItem value="ADVANCED">중급</SelectItem>
            <SelectItem value="EXPERT">고급</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("sort") || "newest"}
          onValueChange={(v) => handleFilter("sort", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">최신순</SelectItem>
            <SelectItem value="popular">인기순</SelectItem>
            <SelectItem value="rating">평점 높은순</SelectItem>
            <SelectItem value="price_asc">가격 낮은순</SelectItem>
            <SelectItem value="price_desc">가격 높은순</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500 gap-1"
          >
            <X className="h-4 w-4" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
}
