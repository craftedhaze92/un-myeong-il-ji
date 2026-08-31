import { describe, expect, it } from "vitest";
import { convertCalendar } from "./calendar";

describe("양력 설 이전 날짜는 실제 입력일을 전년도 음력 데이터로 계산해야 한다 — 전년도 12월 31일로 고정되던 회귀", () => {
  it("양력 1997-01-16은 음력 1996-12-08이다", () => {
    const result = convertCalendar("1997-01-16", "solar", "lunar");

    expect(result.convertedDate).toBe("1996-12-08");
    expect(result.isLeapMonth).toBe(false);
  });

  it("음력 1996-12-08을 다시 양력으로 바꾸면 원래 날짜와 일치한다", () => {
    const lunar = convertCalendar("1997-01-16", "solar", "lunar");
    const solar = convertCalendar(
      lunar.convertedDate,
      "lunar",
      "solar",
      lunar.isLeapMonth,
    );

    expect(solar.convertedDate).toBe("1997-01-16");
  });

  it("1997년 설 전날은 전년도 음력 말일이고 설 당일부터 새 음력 연도가 시작된다", () => {
    expect(convertCalendar("1997-02-06", "solar", "lunar").convertedDate).toBe(
      "1996-12-29",
    );
    expect(convertCalendar("1997-02-07", "solar", "lunar").convertedDate).toBe(
      "1997-01-01",
    );
  });
});
