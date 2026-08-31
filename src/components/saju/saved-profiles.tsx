"use client";

import { useEffect, useState } from "react";
import type { BirthFormValues } from "./birth-form";
import { deleteProfile, loadProfiles, type SavedProfile } from "./local-data";

export function SavedProfiles({
  onSelect,
}: {
  onSelect: (values: BirthFormValues) => void;
}) {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setProfiles(loadProfiles(localStorage));
      } catch {
        /* 저장소 비활성 */
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (profiles.length === 0) return null;

  return (
    <section
      className="border-line mb-8 border-y py-4 text-left"
      aria-label="저장한 명식"
    >
      <div className="text-small text-mute mb-2">이 브라우저에 저장한 명식</div>
      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="border-line flex items-center rounded-[2px] border"
          >
            <button
              type="button"
              onClick={() => onSelect(profile.values)}
              className="text-body text-dim hover:text-fg cursor-pointer bg-transparent px-3 py-2"
            >
              {profile.label} · {profile.values.y}.{profile.values.m}.
              {profile.values.d}
            </button>
            <button
              type="button"
              aria-label={`${profile.label} 명식 삭제`}
              onClick={() => {
                try {
                  setProfiles(deleteProfile(localStorage, profile.id));
                } catch {
                  /* 저장소 비활성 */
                }
              }}
              className="text-mute hover:text-danger cursor-pointer border-0 bg-transparent px-2 py-2"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="text-micro text-mute mt-2">
        서버 전송 없이 현재 브라우저에만 보관됩니다.
      </p>
    </section>
  );
}
