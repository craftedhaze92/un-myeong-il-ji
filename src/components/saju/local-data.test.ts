import { describe, expect, it } from "vitest";
import { EMPTY_BIRTH_FORM_VALUES } from "./birth-form";
import {
  deleteProfile,
  loadJournalEntry,
  loadProfiles,
  saveJournalEntry,
  saveProfile,
} from "./local-data";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => {
      data.delete(key);
    },
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe("로컬 프로필과 일지", () => {
  it("같은 명식을 다시 저장하면 중복 대신 갱신한다", () => {
    const storage = memoryStorage();
    const values = {
      ...EMPTY_BIRTH_FORM_VALUES,
      name: "도현",
      y: "1997",
      m: "1",
      d: "16",
    };
    saveProfile(storage, values);
    saveProfile(storage, { ...values, city: "서울" });
    expect(loadProfiles(storage)).toHaveLength(1);
    expect(loadProfiles(storage)[0]!.values.city).toBe("서울");
    expect(deleteProfile(storage, loadProfiles(storage)[0]!.id)).toEqual([]);
  });

  it("프로필·날짜별 일지를 저장하고 빈 내용으로 삭제한다", () => {
    const storage = memoryStorage();
    saveJournalEntry(storage, "fixture-profile", "2026-09-01", "  중요한 미팅  ");
    expect(loadJournalEntry(storage, "fixture-profile", "2026-09-01")?.text).toBe(
      "중요한 미팅",
    );
    saveJournalEntry(storage, "fixture-profile", "2026-09-01", " ");
    expect(loadJournalEntry(storage, "fixture-profile", "2026-09-01")).toBeNull();
  });
});
