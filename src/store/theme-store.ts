import { create } from "zustand";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

/**
 * saju-app.tsx → reading-panel.tsx → 명식/흐름/직업/방위 4개 탭으로 손수 내려가던
 * `dark` prop을 대체하는 전역 스토어. 초기값은 반드시 "dark" 리터럴이어야 한다 —
 * create() 안에서 localStorage를 lazy init으로 읽으면 SSR에서 ReferenceError가 나고
 * 하이드레이션이 어긋난다. 저장된 테마 복원은 saju-app.tsx의 마운트 effect가
 * setTheme()을 호출하는 방식으로 그대로 유지한다(FOUC 방지를 위해 effect를
 * 의도적으로 쓴다는 원래 설명 참고).
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  setTheme: (t) => set({ theme: t }),
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("umij.theme", next);
    } catch {
      // 저장 실패 시에도 화면 전환은 진행
    }
    set({ theme: next });
  },
}));

export const selectIsDark = (s: ThemeState) => s.theme === "dark";
