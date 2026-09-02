import { describe, expect, it } from "vitest";
import { convertCalendar } from "./calendar";

describe("양력 설 이전 날짜는 실제 입력일을 전년도 음력 데이터로 계산해야 한다 — 전년도 12월 31일로 고정되던 회귀", () => {
  it("양력 2024-02-01은 새 음력 연도가 아니라 전년도 12월의 실제 날짜로 계산된다", () => {
    const result = convertCalendar("2024-02-01", "solar", "lunar");

    expect(result.convertedDate).toMatch(/^2023-12-\d{2}$/);
    expect(result.convertedDate).not.toBe("2023-12-31");
    expect(result.isLeapMonth).toBe(false);
  });

  it("변환된 전년도 음력 날짜를 다시 양력으로 바꾸면 원래 날짜와 일치한다", () => {
    const lunar = convertCalendar("2024-02-01", "solar", "lunar");
    const solar = convertCalendar(
      lunar.convertedDate,
      "lunar",
      "solar",
      lunar.isLeapMonth,
    );

    expect(solar.convertedDate).toBe("2024-02-01");
  });

  it("2024년 설 전날은 전년도 음력 말일이고 설 당일부터 새 음력 연도가 시작된다", () => {
    expect(convertCalendar("2024-02-09", "solar", "lunar").convertedDate).toMatch(
      /^2023-12-\d{2}$/,
    );
    expect(convertCalendar("2024-02-10", "solar", "lunar").convertedDate).toBe(
      "2024-01-01",
    );
  });
});
