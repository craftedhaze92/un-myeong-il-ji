import { FONT_MONO, FS } from "../constants";

export interface ScoreBarProps {
  label?: string;
  score: number; // 0-100
  color?: string;
}

/**
 * 0-100 점수 게이지. 일간 강약·운세 점수·직업 적합도 등 saju-app.tsx 전반에서
 * 반복되는 "라벨 + 얇은 막대 + 수치" 패턴을 하나로 모은 것.
 */
export function ScoreBar({ label, score, color = "var(--fg)" }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: FS.small,
            color: "var(--dim)",
          }}
        >
          <span>{label}</span>
          <span style={{ fontFamily: FONT_MONO }}>{pct}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        style={{
          height: 6,
          borderRadius: 3,
          background: "var(--track)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}
