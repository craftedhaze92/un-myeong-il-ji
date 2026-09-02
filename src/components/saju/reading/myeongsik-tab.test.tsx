import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { calculateDaeUn } from "@/lib/dae_un";
import { calculateSaju } from "@/lib/saju";
import { useThemeStore } from "@/store/theme-store";
import { buildReadingViewModel } from "../reading-view-model";
import { MyeongsikTab } from "./myeongsik-tab";

function buildFixture() {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  return {
    saju,
    vm: buildReadingViewModel({
      saju,
      daeUn: calculateDaeUn(saju),
      nowYear: 2026,
    }),
  };
}

describe("MyeongsikTab — 지지 관계", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
  });

  it("성립 관계의 설명·자리와 접을 수 있는 전체 참고표를 제공한다", async () => {
    const { saju, vm } = buildFixture();
    const user = userEvent.setup();
    render(<MyeongsikTab vm={vm} saju={saju} name="홍길동" />);

    expect(screen.getByRole("heading", { name: "지지 관계" })).toBeInTheDocument();
    expect(screen.getByText(/하나만으로 길흉이나 강약을 확정하지 않습니다/)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "관계의 특징" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "생활에서 살펴볼 흐름" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "전체 관계 참고표" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "지지 관계 참고표" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "전체 관계 참고표" }));

    expect(screen.getByRole("heading", { name: "지지 관계 참고표" })).toBeInTheDocument();
    for (const name of ["삼합", "방합", "육합", "충", "형", "파", "해"]) {
      expect(
        screen.getByRole("heading", { level: 4, name: new RegExp(`^${name}`) }),
      ).toBeInTheDocument();
    }
  });

  it("출생 시간이 미상이면 시지 제외 안내를 표시한다", () => {
    const saju = calculateSaju(
      "1990-05-15",
      "14:30",
      "solar",
      false,
      "male",
      "서울",
      { unknownHour: true },
    );
    const vm = buildReadingViewModel({
      saju,
      daeUn: calculateDaeUn(saju),
      nowYear: 2026,
    });
    render(<MyeongsikTab vm={vm} saju={saju} name="홍길동" />);

    expect(screen.getByText("출생 시간이 미상이므로 시지는 관계 판정에서 제외했습니다.")).toBeInTheDocument();
  });
});
