import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useThemeStore } from "@/store/theme-store";
import { SajuApp } from "./saju-app";

vi.mock("next/font/google", () => {
  const font = () => ({ variable: "test-font" });
  return {
    Gowun_Batang: font,
    IBM_Plex_Mono: font,
    IBM_Plex_Sans_KR: font,
    Nanum_Myeongjo: font,
  };
});

function matchMediaResult(matches: boolean): MediaQueryList {
  return {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe("SajuApp — 운명 일지 결과 화면으로 전환할 때 문서 최상단 이동", () => {
  const scrollTo = vi.fn();

  beforeEach(() => {
    useThemeStore.setState({ theme: "light" });
    scrollTo.mockClear();
    Object.defineProperty(window, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue(matchMediaResult(false)),
    });
  });

  async function enterRequiredBirthData() {
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("이름"), "홍길동");
    await user.type(screen.getByPlaceholderText("년도"), "1990");
    await user.type(screen.getByPlaceholderText("월"), "5");
    await user.type(screen.getByPlaceholderText("일"), "15");
    return user;
  }

  it("정상 명식을 계산하면 결과 렌더 다음 프레임에 최상단으로 부드럽게 이동한다", async () => {
    render(<SajuApp />);
    const user = await enterRequiredBirthData();
    await user.click(screen.getByRole("button", { name: "운명 일지 보기" }));

    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  });

  it("모션 감소 설정에서는 애니메이션 없이 최상단으로 이동한다", async () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue(matchMediaResult(true)),
    });
    render(<SajuApp />);
    const user = await enterRequiredBirthData();
    await user.click(screen.getByRole("button", { name: "운명 일지 보기" }));

    expect(scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  });

  it("잘못된 생년월일로 결과 생성에 실패하면 스크롤하지 않는다", async () => {
    render(<SajuApp />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("이름"), "홍길동");
    await user.type(screen.getByPlaceholderText("년도"), "1990");
    await user.type(screen.getByPlaceholderText("월"), "2");
    await user.type(screen.getByPlaceholderText("일"), "31");
    await user.click(screen.getByRole("button", { name: "운명 일지 보기" }));

    expect(screen.getByText(/2월에는 31일이 없습니다/)).toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
