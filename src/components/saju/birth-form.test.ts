import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import {
  BirthForm,
  deriveBirthInput,
  EMPTY_BIRTH_FORM_VALUES,
  type BirthFormValues,
} from "./birth-form";

const BASE: BirthFormValues = {
  name: "홍길동",
  city: "서울",
  y: "1990",
  m: "5",
  d: "15",
  hh: "14",
  mi: "30",
  calendarType: "solar",
  isLeapMonth: false,
  gender: "male",
};

describe("deriveBirthInput — saju-app.tsx#submit과 궁합 상대방 입력이 공유하는 검증 로직", () => {
  it("정상 양력 입력을 birthDate/birthTime으로 변환한다", () => {
    const result = deriveBirthInput(BASE);
    expect(result).toEqual({
      birthDate: "1990-05-15",
      birthTime: "14:30",
      unknownHour: false,
    });
  });

  it("시·분을 비우면 정오(12:00)로, unknownHour: true로 넘어간다", () => {
    const result = deriveBirthInput({ ...BASE, hh: "", mi: "" });
    expect(result.birthTime).toBe("12:00");
    expect(result.unknownHour).toBe(true);
  });

  it("2월 31일처럼 존재하지 않는 날짜는 조용히 3월로 넘기지 않고 에러를 던진다 — " +
    "예전엔 saju-app.tsx가 Math.min/max로 클램프해 이런 입력이 그대로 통과했다", () => {
    expect(() => deriveBirthInput({ ...BASE, m: "2", d: "31" })).toThrow(
      /2월에는 31일이 없습니다/,
    );
  });

  it("월이 1~12 범위를 벗어나면 에러를 던진다", () => {
    expect(() => deriveBirthInput({ ...BASE, m: "13" })).toThrow(
      /월은 1부터 12 사이/,
    );
  });

  it("연도가 지원 범위(1900~2200) 밖이면 에러를 던진다", () => {
    expect(() => deriveBirthInput({ ...BASE, y: "1850" })).toThrow();
    expect(() => deriveBirthInput({ ...BASE, y: "2250" })).toThrow();
  });

  it("음력 입력은 월/일 범위만 검증한다(윤달 포함)", () => {
    const result = deriveBirthInput({
      ...BASE,
      calendarType: "lunar",
      m: "4",
      d: "22",
      isLeapMonth: true,
    });
    expect(result.birthDate).toBe("1990-04-22");
  });
});

describe("BirthForm — 표준 시진 드롭다운과 정확한 시·분 입력", () => {
  it("시진을 선택하면 중앙 시각을 채우고 정확한 시·분으로 다시 조정할 수 있다", async () => {
    const user = userEvent.setup();
    let values = { ...EMPTY_BIRTH_FORM_VALUES };
    render(
      createElement(BirthForm, {
        values,
        onChange: (patch) => {
          values = { ...values, ...patch };
        },
      }),
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "시진 선택" }), "오");
    expect(values).toMatchObject({ hh: "12", mi: "00" });
  });

  it("시간 미상 선택은 시·분을 비워 unknownHour 처리를 유지한다", async () => {
    const user = userEvent.setup();
    let values = { ...BASE };
    render(
      createElement(BirthForm, {
        values,
        onChange: (patch) => {
          values = { ...values, ...patch };
        },
      }),
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "시진 선택" }), "");
    expect(values).toMatchObject({ hh: "", mi: "" });
    expect(deriveBirthInput(values).unknownHour).toBe(true);
  });
});
