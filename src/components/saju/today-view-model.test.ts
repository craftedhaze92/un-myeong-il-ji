import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateSaju } from "@/lib/saju";
import { buildTodayViewModel } from "./today-view-model";

const saju = calculateSaju("1990-05-15", "14:30", "solar", false, "male", "서울");

describe("buildTodayViewModel — 조회 날짜가 실제 오늘이 아니면 어떤 시진도 강조하지 않는다", () => {
  it("과거 날짜를 조회하면 hours의 isNow가 전부 false다", () => {
    const vm = buildTodayViewModel(saju, new Date(2020, 0, 1));
    expect(vm.hours.length).toBe(12);
    expect(vm.hours.every((h) => !h.isNow)).toBe(true);
  });

  it("dayPillar·score·rating이 채워진다", () => {
    const vm = buildTodayViewModel(saju, new Date(2020, 0, 1));
    expect(vm.dayPillar.length).toBe(2);
    expect(vm.score).toBeGreaterThanOrEqual(0);
    expect(vm.score).toBeLessThanOrEqual(100);
    expect(["대길일", "길일", "평일", "흉일", "대흉일"]).toContain(vm.ratingLabel);
  });

  it("5개 항목(종합/재물/직업/건강/애정)의 오늘의 운세 점수를 담는다", () => {
    const vm = buildTodayViewModel(saju, new Date(2020, 0, 1));
    expect(vm.scores.map((s) => s.label)).toEqual([
      "종합",
      "재물",
      "직업",
      "건강",
      "애정",
    ]);
    vm.scores.forEach((s) => {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    });
  });

  it("28수(constellation)는 VM에 노출하지 않는다 — 기준일 미검증 근사값이라서다", () => {
    const vm = buildTodayViewModel(saju, new Date(2020, 0, 1));
    expect(vm).not.toHaveProperty("constellation");
  });
});

describe("buildTodayViewModel — 실제 오늘을 조회하면 현재 시진 하나만 강조한다", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("서울 기준 오후 2시(14:00)면 미시(13:00-15:00)가 isNow다", () => {
    // 2024-06-20 14:00 KST = 2024-06-20 05:00 UTC
    vi.setSystemTime(new Date("2024-06-20T05:00:00.000Z"));
    const vm = buildTodayViewModel(saju, new Date(2024, 5, 20));
    const nowHours = vm.hours.filter((h) => h.isNow);
    expect(nowHours.length).toBe(1);
    expect(nowHours[0]?.branchName).toBe("미시");
  });

  it("서울 기준 자정 넘긴 자시(00:30)에도 정확히 하나만 강조된다", () => {
    // 2024-06-21 00:30 KST = 2024-06-20 15:30 UTC
    vi.setSystemTime(new Date("2024-06-20T15:30:00.000Z"));
    const vm = buildTodayViewModel(saju, new Date(2024, 5, 21));
    const nowHours = vm.hours.filter((h) => h.isNow);
    expect(nowHours.length).toBe(1);
    expect(nowHours[0]?.branchName).toBe("자시");
  });
});
