import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  createSpeakingPrompt,
  toggleSpeakingPrompt,
  deleteSpeakingPrompt,
} from "@/actions/speaking";
import { Mic, Plus, Trash2, ToggleLeft, ToggleRight, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "스피킹 프롬프트 관리" };
export const dynamic = "force-dynamic";

export default async function InstructorPromptsPage() {
  const user = await requireRole("INSTRUCTOR");

  const [prompts, courses] = await Promise.all([
    prisma.speakingPrompt.findMany({
      where: { createdBy: user.id },
      include: { course: { select: { id: true, title: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.course.findMany({
      where: { instructor: { userId: user.id }, status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  async function handleCreate(formData: FormData) {
    "use server";
    await createSpeakingPrompt(formData);
  }

  async function handleToggle(formData: FormData) {
    "use server";
    const id = formData.get("promptId") as string;
    await toggleSpeakingPrompt(id);
  }

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("promptId") as string;
    await deleteSpeakingPrompt(id);
  }

  const activeCount = prompts.filter((p) => p.isActive).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">스피킹 프롬프트 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          학생들의 스피킹 연습에 사용할 문장을 추가하세요
        </p>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{prompts.length}</div>
          <div className="text-xs text-gray-400 mt-1">전체 프롬프트</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{activeCount}</div>
          <div className="text-xs text-green-600 mt-1">활성</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-400">{prompts.length - activeCount}</div>
          <div className="text-xs text-gray-400 mt-1">비활성</div>
        </div>
      </div>

      {/* 프롬프트 추가 폼 */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          새 프롬프트 추가
        </h2>
        <form action={handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              name="text"
              type="text"
              placeholder="영어 문장 (예: How are you today?)"
              className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              required
            />
            <input
              name="hint"
              type="text"
              placeholder="힌트 (예: 안부 묻기)"
              className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              required
            />
          </div>
          <div className="flex gap-2">
            <select
              name="courseId"
              className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            >
              <option value="">전체 공통 (강의 미연결)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 whitespace-nowrap"
            >
              추가
            </button>
          </div>
        </form>
      </div>

      {/* 프롬프트 목록 */}
      {prompts.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
          <Mic className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">
            프롬프트가 없습니다. 위에서 추가해주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((prompt, idx) => (
            <div
              key={prompt.id}
              className={`flex items-start gap-3 rounded-xl p-3 border transition-all ${
                prompt.isActive
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <span className="text-xs text-gray-300 font-mono mt-1 w-5 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{prompt.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                    {prompt.hint}
                  </span>
                  {prompt.course ? (
                    <span className="text-xs text-blue-500">{prompt.course.title}</span>
                  ) : (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Globe className="h-3 w-3" />공통
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <form action={handleToggle}>
                  <input type="hidden" name="promptId" value={prompt.id} />
                  <button
                    type="submit"
                    className={`p-1.5 rounded-lg transition-colors ${
                      prompt.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={prompt.isActive ? "비활성화" : "활성화"}
                  >
                    {prompt.isActive ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                </form>
                <form action={handleDelete}>
                  <input type="hidden" name="promptId" value={prompt.id} />
                  <button
                    type="submit"
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
