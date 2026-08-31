import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { calculateSaju } from "@/lib/saju";
import { calculateDaeUn } from "@/lib/dae_un";
import { useThemeStore } from "@/store/theme-store";
import { ReadingPanel } from "./reading-panel";
import { buildReadingViewModel } from "./reading-view-model";

// 탭 UI를 박스형에서 밑줄형으로 바꾼 뒤에도 Radix가 주는 tab/aria-selected 시맨틱이
// 그대로 유지되는지 확인한다 — 스타일 변경이 접근성 계약을 깨뜨리지 않았는지가 핵심.
describe("ReadingPanel — 탭 내비게이션", () => {
  const saju = calculateSaju(
    "1990-05-15",
    "14:30",
    "solar",
    false,
    "male",
    "서울",
  );
  const daeUn = calculateDaeUn(saju);
  const readingVM = buildReadingViewModel({ saju, daeUn, nowYear: 2024 });

  // useThemeStore는 모듈 싱글턴이라 테스트 파일 간(및 케이스 간) 상태가 공유된다.
  // dark={false}로 넘기던 기존 렌더 조건("light")을 매 테스트 시작 시 되살려 결정성을 지킨다.
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
  });

  function renderPanel() {
    return render(
      <ReadingPanel
        saju={saju}
        daeUn={daeUn}
        readingVM={readingVM}
        name="홍길동"
      />,
    );
  }

  it("탭 6개(명식·인생·흐름·직업·오늘·방위)가 role=tab으로 렌더된다", () => {
    renderPanel();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      "명식",
      "인생",
      "흐름",
      "직업",
      "오늘",
      "방위",
    ]);
  });

  it("초기에는 명식 탭만 선택돼 있다", () => {
    renderPanel();
    const tabs = screen.getAllByRole("tab");
    const selected = tabs.filter(
      (t) => t.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]!.textContent).toBe("명식");
  });

  it("다른 탭을 클릭하면 선택이 그쪽으로 옮겨간다", async () => {
    renderPanel();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "흐름" }));

    expect(screen.getByRole("tab", { name: "흐름" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "명식" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("활성 탭은 로컬 상태라 언마운트 후 다시 열면 명식 탭으로 돌아온다 — saju-app.tsx의 resetAll()이 ReadingPanel을 통째로 언마운트시키는 동작에 의존한다. 활성 탭을 전역(zustand) 스토어로 옮기면 이 리셋이 깨진다", async () => {
    const { unmount } = renderPanel();
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: "흐름" }));
    expect(screen.getByRole("tab", { name: "흐름" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    unmount();
    renderPanel();

    const tabs = screen.getAllByRole("tab");
    const selected = tabs.filter(
      (t) => t.getAttribute("aria-selected") === "true",
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]!.textContent).toBe("명식");
  });

  it("정보 배지(득령/실령 등)는 button/tab role이 아니다 — 눌리는 것처럼 보이지만 안 눌리는 회귀 방지", () => {
    renderPanel();
    // 같은 문구가 서술 문장(<div>) 안에도 나오므로 배지(<span>)로 좁혀서 찾는다.
    const badge = screen.getByText(/득령|실령/, { selector: "span" });
    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role", "button");
    expect(badge.closest("button")).toBeNull();
  });

  it("일주 카드는 요약을 먼저 보여주고 상세 설명은 접근 가능한 버튼으로 펼친다", async () => {
    renderPanel();
    const user = userEvent.setup();
    const ilju = readingVM.myeongsik.ilju;

    expect(
      screen.getByText(`나의 일주 — ${ilju.name} (${ilju.hanja})`),
    ).toBeInTheDocument();
    expect(screen.getByText(ilju.summary)).toBeInTheDocument();
    expect(
      screen.queryByText("일간 · 겉으로 드러나는 기질"),
    ).not.toBeInTheDocument();

    const trigger = screen.getByRole("button", { name: "자세히 보기" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);

    expect(screen.getByRole("button", { name: "간단히 보기" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("일간 · 겉으로 드러나는 기질")).toBeInTheDocument();
    expect(screen.getByText(ilju.relation)).toBeInTheDocument();
  });
});
