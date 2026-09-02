import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculateDaeUn } from "@/lib/dae_un";
import { calculateSaju } from "@/lib/saju";
import { buildReadingViewModel } from "../reading-view-model";
import { LifeTab } from "./life-tab";

function buildVm(unknownHour = false) {
  const saju = calculateSaju(
    "1990-05-15",
    unknownHour ? "12:00" : "14:30",
    "solar",
    false,
    "male",
    "서울",
    { unknownHour },
  );
  return buildReadingViewModel({
    saju,
    daeUn: calculateDaeUn(saju),
    nowYear: 2026,
  });
}

describe("LifeTab — 평생 총평과 생애 흐름 정보 구조", () => {
  it("장문 총평을 먼저 보여주고 초년·중년·말년과 두 주요 시기를 이어서 보여준다", () => {
    const vm = buildVm();
    render(<LifeTab vm={vm} />);

    expect(
      screen.getByRole("heading", { name: "평생 총평" }),
    ).toBeInTheDocument();
    vm.life.overview.paragraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "삶의 큰 흐름" }),
    ).toBeInTheDocument();
    for (const name of [
      "초년",
      "중년",
      "말년",
      "힘이 잘 모이는 시기",
      "속도를 조절할 시기",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    for (const name of ["재물", "건강", "애정", "성격 — 두드러진 십성"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(
      screen.queryByRole("heading", { name: "총평" }),
    ).not.toBeInTheDocument();
  });

  it("시간 미상 명식은 생애 흐름 위에 근사치 안내를 표시한다", () => {
    render(<LifeTab vm={buildVm(true)} />);

    expect(
      screen.getByText(/대운 시작 나이는 정오 기준의 근사치/),
    ).toBeInTheDocument();
  });

  it("재물·건강·애정은 점수 의미와 명식 근거, 강점·주의·실천 팁을 구조화해 보여준다", () => {
    const vm = buildVm();
    render(<LifeTab vm={vm} />);

    for (const label of [
      "재물 운용 지수",
      "생활 균형 지수",
      "관계 유연성 지수",
    ]) {
      expect(screen.getByRole("progressbar", { name: label })).toHaveAttribute(
        "aria-valuenow",
      );
    }
    for (const fortune of vm.life.fortunes) {
      expect(
        screen.getByLabelText(`${fortune.label} 해석 근거`),
      ).toBeInTheDocument();
      expect(screen.getByText(fortune.summary)).toBeInTheDocument();
    }
    expect(
      screen.getAllByRole("heading", { name: "잘 쓰일 때" }).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      screen.getAllByRole("heading", { name: "살펴볼 점" }).length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      screen.getAllByRole("heading", { name: "실천 팁" }).length,
    ).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/의학적 진단이 아닙니다/)).toBeInTheDocument();
    expect(screen.getByText(/전통 배우자성 관점/)).toBeInTheDocument();
  });

  it("두드러진 십성은 한자·장문 성향과 균형 팁을 함께 보여준다", () => {
    const vm = buildVm();
    render(<LifeTab vm={vm} />);

    for (const personality of vm.life.personality) {
      const title = screen.getByText(
        `${personality.tenGod} (${personality.hanja})`,
      );
      const card = title.closest("article")!;

      expect(title).toBeInTheDocument();
      expect(within(card).getByText(personality.summary)).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { name: "과해질 때" }).length).toBe(
      vm.life.personality.length,
    );
    expect(screen.getAllByRole("heading", { name: "균형 팁" }).length).toBe(
      vm.life.personality.length,
    );
  });
});
