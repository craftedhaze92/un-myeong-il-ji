import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "radix-ui";
import { calculateSaju } from "@/lib/saju";
import { calculateDaeUn } from "@/lib/dae_un";
import { buildReadingViewModel } from "../reading-view-model";
import { FlowTab } from "./flow-tab";

// 대운 pill 선택이 세운·월운·시기 조언의 기준 시점을 함께 이동시키는 캐스케이드
// (flow-tab.tsx#selectDaeun)가 이 탭을 reading-panel.tsx에서 별도 파일로 분리한 뒤에도
// 그대로 동작하는지 확인한다. FlowTab은 4개 선택 상태 + 6개 파생값이 서로 의존하고 있어
// 이번 리팩토링에서 유일하게 쪼개지지 않고 남은 최대 위험 파일인데, 지금까지 커버리지가
// 0이었다. Tooltip.Provider로 감싸는 이유: 프로덕션에서는 부모 reading-panel.tsx가
// 이 컨텍스트를 제공한다(FlowTab의 12개월 예보 Tooltip이 이를 전제로 한다).
describe("FlowTab — 대운→세운 캐스케이드", () => {
  const saju = calculateSaju("1990-05-15", "14:30", "solar", false, "male", "서울");
  const daeUn = calculateDaeUn(saju);
  const vm = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  function renderFlowTab() {
    return render(
      <Tooltip.Provider delayDuration={200}>
        <FlowTab saju={saju} daeUn={daeUn} vm={vm} />
      </Tooltip.Provider>,
    );
  }

  it("현재 대운이 아닌 대운을 고르면 세운 헤더가 그 대운 구간(선택한 대운)으로 바뀐다", async () => {
    renderFlowTab();
    const user = userEvent.setup();

    const nonCurrent = vm.flow.daeunOptions.find((o) => !o.isCurrent);
    if (!nonCurrent) throw new Error("테스트 전제 실패: 비교할 비현재 대운이 없음");

    const pill = screen.getByRole("button", {
      name: new RegExp(`^${nonCurrent.startAge}–${nonCurrent.endAge} `),
    });
    await user.click(pill);

    expect(
      screen.getByRole("heading", { level: 2, name: /세운 —/ }),
    ).toHaveTextContent(
      `세운 — ${nonCurrent.startYear}–${nonCurrent.endYear}년 (선택한 대운)`,
    );
  });

  it("현재 대운을 다시 고르면 세운 헤더가 '올해를 중심으로'로 돌아온다", async () => {
    renderFlowTab();
    const user = userEvent.setup();

    const nonCurrent = vm.flow.daeunOptions.find((o) => !o.isCurrent);
    const current = vm.flow.daeunOptions.find((o) => o.isCurrent);
    if (!nonCurrent || !current) {
      throw new Error("테스트 전제 실패: 현재/비현재 대운이 모두 있어야 함");
    }

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(`^${nonCurrent.startAge}–${nonCurrent.endAge} `),
      }),
    );
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(`^${current.startAge}–${current.endAge} `),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 2, name: /세운 —/ }),
    ).toHaveTextContent("세운 — 올해를 중심으로");
  });
});
