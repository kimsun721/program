"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  instructorCreateCourse,
  instructorUpdateCourse,
} from "@/actions/instructor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Option = { id: string; name?: string; nameKo?: string };
type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  courseId?: string;
  defaultValues?: {
    title: string;
    slug: string;
    description: string;
    thumbnail: string | null;
    level: string;
    price: number;
    languageId: string;
    categoryId: string;
  };
  languages: { id: string; nameKo: string; code: string }[];
  categories: { id: string; name: string }[];
};

export function CourseForm({
  mode,
  courseId,
  defaultValues,
  languages,
  categories,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res =
            mode === "create"
              ? await instructorCreateCourse(fd)
              : await instructorUpdateCourse(courseId!, fd);
          if ("error" in res && res.error) {
            setError(res.error);
            return;
          }
          if (mode === "create" && "courseId" in res && res.courseId) {
            router.push(`/instructor/courses/${res.courseId}`);
          } else {
            router.refresh();
          }
        });
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title}
            required
          />
        </div>
        <div>
          <Label htmlFor="slug">URL Slug</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={defaultValues?.slug}
            placeholder="english-beginner"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaultValues?.description}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="thumbnail">썸네일 URL (선택)</Label>
          <Input
            id="thumbnail"
            name="thumbnail"
            defaultValue={defaultValues?.thumbnail ?? ""}
            placeholder="https://..."
          />
        </div>
        <div>
          <Label htmlFor="price">가격 (원)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            defaultValue={defaultValues?.price ?? 0}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="languageId">언어</Label>
          <select
            id="languageId"
            name="languageId"
            defaultValue={defaultValues?.languageId}
            required
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nameKo} ({l.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="categoryId">카테고리</Label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={defaultValues?.categoryId}
            required
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="level">레벨</Label>
          <select
            id="level"
            name="level"
            defaultValue={defaultValues?.level ?? "BEGINNER"}
            required
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="BEGINNER">BEGINNER</option>
            <option value="INTERMEDIATE">INTERMEDIATE</option>
            <option value="ADVANCED">ADVANCED</option>
            <option value="EXPERT">EXPERT</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "저장 중..." : mode === "create" ? "생성" : "저장"}
      </Button>
    </form>
  );
}
