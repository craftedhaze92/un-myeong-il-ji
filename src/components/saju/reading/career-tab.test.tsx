import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calculateDaeUn } from "@/lib/dae_un";
import { calculateSaju } from "@/lib/saju";
import { buildReadingViewModel } from "../reading-view-model";
import { CareerTab } from "./career-tab";

function buildVm() {
  const saju = calculateSaju(
    "1992-05-05",
    "17:50",
    "solar",
    false,
    "male",
    "서울",
  );
  return buildReadingViewModel({
    saju,
    daeUn: calculateDaeUn(saju),
    nowYear: 2026,
  });
}

describe("CareerTab — 직업명을 단정하지 않고 역할·근거·업무 조건으로 안내한다", () => {
  it("추천 진로 방향에 역할·준비 역량·해석 근거를 함께 보여준다", () => {
    const vm = buildVm();
    render(<CareerTab vm={vm} />);

    expect(screen.getByRole("heading", { name: "직업 적성 안내" })).toBeInTheDocument();
    expect(screen.getByText(/채용, 소득, 성과를 예측하거나 보장하지 않으므로/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "추천 진로 방향" })).toBeInTheDocument();

    const recommendation = vm.career.recommendations[0];
    const title = screen.getByRole("heading", { name: recommendation.categoryLabel });
    const card = title.closest("article")!;
    expect(within(card).getByText("대표 역할")).toBeInTheDocument();
    expect(within(card).getByText("준비할 역량")).toBeInTheDocument();
    expect(within(card).getByText("어울리는 업무 조건")).toBeInTheDocument();
    expect(
      screen.getByLabelText(`${recommendation.categoryLabel} 해석 근거`),
    ).toBeInTheDocument();
  });

  it("직장 환경과 살펴볼 업무 조건을 노출하고, 기존 직업 금지 제목은 쓰지 않는다", () => {
    const vm = buildVm();
    render(<CareerTab vm={vm} />);

    expect(screen.getByRole("heading", { name: "일하기 좋은 환경" })).toBeInTheDocument();
    for (const label of ["조직 규모", "일하는 방식", "역할 성향", "변화 선호"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole("heading", { name: "살펴볼 업무 조건" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "피해야 할 직업" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/비교해 볼 방향:/).length).toBeGreaterThan(0);
  });

  it("연령 고정 경력 조언 대신 탐색·역량 축적·전환 확장 단계를 보여준다", () => {
    render(<CareerTab vm={buildVm()} />);

    for (const label of ["탐색", "역량 축적", "전환·확장"]) {
      expect(screen.getByRole("heading", { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByText(/초기 경력 \\(20-30대\\)/)).not.toBeInTheDocument();
  });
});
