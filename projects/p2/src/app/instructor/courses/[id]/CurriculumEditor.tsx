"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  instructorAddLecture,
  instructorAddSection,
  instructorDeleteLecture,
  instructorDeleteSection,
  instructorUpdateLecture,
  instructorUpdateSection,
} from "@/actions/instructor";

type Lecture = {
  id: string;
  title: string;
  hlsUrl: string | null;
  duration: number;
  isFreePreview: boolean;
  sortOrder: number;
};
type Section = {
  id: string;
  title: string;
  sortOrder: number;
  lectures: Lecture[];
};

export function CurriculumEditor({
  courseId,
  sections,
}: {
  courseId: string;
  sections: Section[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newSectionTitle, setNewSectionTitle] = useState("");

  const refresh = () => router.refresh();

  const addSection = () => {
    if (!newSectionTitle.trim()) return;
    startTransition(async () => {
      const res = await instructorAddSection(courseId, newSectionTitle);
      if ("error" in res && res.error) alert(res.error);
      else {
        setNewSectionTitle("");
        refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <p className="rounded-md border bg-slate-50 p-4 text-sm text-slate-500">
          섹션이 없습니다. 아래에서 추가하세요.
        </p>
      )}
      {sections.map((s, idx) => (
        <SectionBlock
          key={s.id}
          section={s}
          index={idx + 1}
          onChanged={refresh}
        />
      ))}

      <div className="rounded-md border bg-slate-50 p-3">
        <div className="text-xs font-semibold text-slate-600">새 섹션 추가</div>
        <div className="mt-2 flex gap-2">
          <input
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="섹션 제목"
            className="flex-1 rounded border px-2 py-1.5 text-sm"
          />
          <button
            onClick={addSection}
            disabled={pending}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  index,
  onChanged,
}: {
  section: Section;
  index: number;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [showAddLecture, setShowAddLecture] = useState(false);

  const saveTitle = () => {
    startTransition(async () => {
      const res = await instructorUpdateSection(section.id, title);
      if ("error" in res && res.error) alert(res.error);
      else {
        setEditing(false);
        onChanged();
      }
    });
  };

  const del = () => {
    if (!confirm("이 섹션과 차시를 모두 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await instructorDeleteSection(section.id);
      if ("error" in res && res.error) alert(res.error);
      else onChanged();
    });
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">섹션 {index}</div>
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          ) : (
            <div className="text-base font-semibold">{section.title}</div>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                disabled={pending}
                onClick={saveTitle}
                className="rounded bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setTitle(section.title);
                }}
                className="rounded border px-2 py-1 text-xs"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="rounded border px-2 py-1 text-xs"
              >
                이름 변경
              </button>
              <button
                onClick={del}
                disabled={pending}
                className="rounded border px-2 py-1 text-xs text-red-700"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {section.lectures.map((l, li) => (
          <LectureRow
            key={l.id}
            lecture={l}
            index={li + 1}
            onChanged={onChanged}
          />
        ))}

        {showAddLecture ? (
          <NewLectureForm
            sectionId={section.id}
            onCancel={() => setShowAddLecture(false)}
            onDone={() => {
              setShowAddLecture(false);
              onChanged();
            }}
          />
        ) : (
          <button
            onClick={() => setShowAddLecture(true)}
            className="rounded border border-dashed px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            + 차시 추가
          </button>
        )}
      </div>
    </div>
  );
}

function LectureRow({
  lecture,
  index,
  onChanged,
}: {
  lecture: Lecture;
  index: number;
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const del = () => {
    if (!confirm("차시를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const res = await instructorDeleteLecture(lecture.id);
      if ("error" in res && res.error) alert(res.error);
      else onChanged();
    });
  };

  if (editing) {
    return (
      <LectureEditForm
        lecture={lecture}
        onCancel={() => setEditing(false)}
        onDone={() => {
          setEditing(false);
          onChanged();
        }}
      />
    );
  }

  return (
    <div className="flex items-center justify-between rounded border bg-slate-50 px-3 py-2 text-sm">
      <div className="min-w-0">
        <div className="truncate">
          <span className="text-slate-500">{index}. </span>
          {lecture.title}
        </div>
        <div className="text-xs text-slate-500">
          {Math.floor(lecture.duration / 60)}분{" "}
          {lecture.isFreePreview && "· 무료 미리보기"}{" "}
          {lecture.hlsUrl ? "· 영상 등록됨" : "· 영상 미등록"}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded border px-2 py-1 text-xs"
        >
          수정
        </button>
        <button
          onClick={del}
          disabled={pending}
          className="rounded border px-2 py-1 text-xs text-red-700"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

function NewLectureForm({
  sectionId,
  onCancel,
  onDone,
}: {
  sectionId: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await instructorAddLecture(sectionId, fd);
          if ("error" in res && res.error) setError(res.error);
          else onDone();
        });
      }}
      className="rounded border bg-white p-3"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          name="title"
          placeholder="차시 제목"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <input
          name="hlsUrl"
          placeholder="HLS URL (선택)"
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          name="duration"
          type="number"
          min={0}
          placeholder="길이 (초)"
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isFreePreview" /> 무료 미리보기
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          추가
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-3 py-1.5 text-xs"
        >
          취소
        </button>
      </div>
    </form>
  );
}

function LectureEditForm({
  lecture,
  onCancel,
  onDone,
}: {
  lecture: Lecture;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = await instructorUpdateLecture(lecture.id, fd);
          if ("error" in res && res.error) setError(res.error);
          else onDone();
        });
      }}
      className="rounded border bg-white p-3"
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          name="title"
          defaultValue={lecture.title}
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <input
          name="hlsUrl"
          defaultValue={lecture.hlsUrl ?? ""}
          placeholder="HLS URL (선택)"
          className="rounded border px-2 py-1.5 text-sm"
        />
        <input
          name="duration"
          type="number"
          min={0}
          defaultValue={lecture.duration}
          className="rounded border px-2 py-1.5 text-sm"
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFreePreview"
            defaultChecked={lecture.isFreePreview}
          />{" "}
          무료 미리보기
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-3 py-1.5 text-xs"
        >
          취소
        </button>
      </div>
    </form>
  );
}
