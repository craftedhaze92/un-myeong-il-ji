import { FONT_MONO, FONT_MYEONGJO, FS } from "../constants";
import type { GanjiCellVM } from "../view-model";

export interface GanjiColumnProps {
  /** 대운이면 시작 나이("10"), 세운이면 연도("2026") */
  topLabel: string;
  cell: GanjiCellVM;
  current: boolean;
  /** 현재 구간 강조에 쓸 색 (오행 고유색) */
  accentColor: string;
}

/**
 * 대운·세운이 공유하는 칸 — 위에서부터
 * [나이/연도] → [천간 십성] → [천간] → [지지] → [지지 십성] → [십이운성] → [십이신살].
 * result-panel.tsx의 대운 띠·세운 띠가 이 컴포넌트를 그대로 반복해 쓴다.
 */
export function GanjiColumn({ topLabel, cell, current, accentColor }: GanjiColumnProps) {
  return (
    <div
      style={{
        flex: "0 0 108px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "12px 8px 14px",
        borderRadius: 4,
        border: current ? `1px dashed ${accentColor}` : "1px solid var(--line)",
        background: current ? `color-mix(in srgb, ${accentColor} 10%, transparent)` : "transparent",
      }}
    >
      <div
        style={{
          fontFamily: FONT_MONO,
          fontSize: FS.subtitle,
          fontWeight: 700,
          color: current ? accentColor : "var(--fg)",
        }}
      >
        {topLabel}
      </div>

      <div style={{ fontSize: FS.micro, color: "var(--dim)" }}>{cell.stemGod}</div>
      <GanjiChip ch={cell.stem.ch} ko={cell.stem.ko} color={cell.stem.color} bg={cell.stem.bg} />
      <GanjiChip ch={cell.branch.ch} ko={cell.branch.ko} color={cell.branch.color} bg={cell.branch.bg} />
      <div style={{ fontSize: FS.micro, color: "var(--dim)" }}>{cell.branchGod}</div>

      <div
        style={{
          marginTop: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: FS.micro, fontFamily: FONT_MYEONGJO, color: "var(--fg)" }}>
          {cell.stage}
        </span>
        <span style={{ fontSize: FS.micro, color: "var(--mute)" }}>{cell.sinsal}</span>
      </div>
    </div>
  );
}

function GanjiChip({
  ch,
  ko,
  color,
  bg,
}: {
  ch: string;
  ko: string;
  color: string;
  bg: string;
}) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 4,
        background: bg,
        border: `1px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
      }}
    >
      <span style={{ fontFamily: FONT_MYEONGJO, fontWeight: 800, fontSize: 22, color }}>{ch}</span>
      <span style={{ fontSize: 10, color, opacity: 0.85, marginTop: 2 }}>{ko}</span>
    </div>
  );
}
