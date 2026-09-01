import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateSaju } from "@/lib/saju";
import { TodayTab } from "./today-tab";

describe("TodayTab — 월간 달력 목적 선택", () => {
  beforeEach(() => {
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: vi.fn().mockReturnValue(1),
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("취업/이직을 계약 다음 목적 항목으로 제공한다", () => {
    const saju = calculateSaju(
      "1990-05-15",
      "14:30",
      "solar",
      false,
      "male",
      "서울",
    );
    render(<TodayTab saju={saju} />);

    const options = screen.getAllByRole("option").map((option) => option.textContent);
    expect(options.slice(0, 3)).toEqual(["계약", "취업/이직", "이사"]);
  });
});
