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
    <div className="flex flex-col gap-1.5">
      {label && (
        <div className="flex justify-between text-small text-dim">
          <span>{label}</span>
          <span className="font-mono-plex">{pct}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="relative h-1.5 overflow-hidden rounded-[3px] bg-track"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-[3px]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
