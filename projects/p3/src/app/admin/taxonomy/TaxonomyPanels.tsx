"use client";

import { useState, useTransition } from "react";
import {
  adminUpsertCategory,
  adminToggleCategory,
  adminToggleLanguage,
} from "@/actions/admin";

type Category = { id: string; name: string; slug: string; isActive: boolean };
type Language = {
  id: string;
  code: string;
  nameKo: string;
  nameEn: string;
  isActive: boolean;
};

export function TaxonomyPanels({
  categories,
  languages,
}: {
  categories: Category[];
  languages: Language[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onUpsert = (fd: FormData) => {
    setError(null);
    startTransition(async () => {
      const res = await adminUpsertCategory(fd);
      if ("error" in res && res.error) setError(res.error);
    });
  };

  const onToggleCat = (id: string) => {
    startTransition(async () => {
      await adminToggleCategory(id);
    });
  };
  const onToggleLang = (id: string) => {
    startTransition(async () => {
      await adminToggleLanguage(id);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <section>
        <h2 className="text-sm font-semibold">카테고리</h2>
        <div className="mt-2 rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">슬러그</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2 text-slate-500">{c.slug}</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        c.isActive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600"
                      }
                    >
                      {c.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={pending}
                      onClick={() => onToggleCat(c.id)}
                    >
                      토글
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form
          action={onUpsert}
          className="mt-3 flex flex-wrap gap-2 rounded-md border bg-slate-50 p-3"
        >
          <input
            name="name"
            placeholder="이름"
            className="flex-1 rounded border px-2 py-1.5 text-sm"
            required
          />
          <input
            name="slug"
            placeholder="slug (예: business)"
            className="flex-1 rounded border px-2 py-1.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            추가
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </section>

      <section>
        <h2 className="text-sm font-semibold">언어</h2>
        <div className="mt-2 rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">코드</th>
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">액션</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{l.code}</td>
                  <td className="px-3 py-2">{l.nameKo} ({l.nameEn})</td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        l.isActive
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                          : "rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600"
                      }
                    >
                      {l.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                      disabled={pending}
                      onClick={() => onToggleLang(l.id)}
                    >
                      토글
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
