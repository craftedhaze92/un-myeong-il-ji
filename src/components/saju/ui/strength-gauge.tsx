import { FONT_MONO, FONT_MYEONGJO, FS } from "../constants";
import type { StrengthGaugeVM } from "../view-model";

export interface StrengthGaugeProps {
  gauge: StrengthGaugeVM;
}

/**
 * 신강신약 270° 아크 게이지. 트랙(회색 전체 호) 위에 점수만큼 진행 호를 덧그리고
 * 끝점에 캡 원을 찍는다. 진행색은 일간 오행 고유색(view-model.ts의 myColor)을 그대로
 * 쓴다 — 점신처럼 신약/중화/신강마다 다른 색을 새로 정하지 않고 기존 팔레트에 맞춘다.
 */
export function StrengthGauge({ gauge }: StrengthGaugeProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 240, aspectRatio: "1 / 1" }}>
        <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", display: "block" }}>
          <path d={gauge.trackD} fill="none" stroke="var(--track)" strokeWidth={14} strokeLinecap="round" />
          {gauge.progressD && (
            <path
              d={gauge.progressD}
              fill="none"
              stroke={gauge.color}
              strokeWidth={14}
              strokeLinecap="round"
            />
          )}
          <circle cx={gauge.capX} cy={gauge.capY} r={9} fill={gauge.color} stroke="var(--bg)" strokeWidth={2} />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            textAlign: "center",
          }}
        >
          <div style={{ fontFamily: FONT_MYEONGJO, fontWeight: 800, fontSize: FS.display, lineHeight: 1 }}>
            {gauge.score}
          </div>
          <div style={{ fontSize: FS.body, color: "var(--dim)" }}>{gauge.bandLine}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 18 }}>
        {gauge.bands.map((b) => (
          <div key={b.band} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: b.active ? gauge.color : "var(--track)",
                display: "inline-block",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
              <span
                style={{
                  fontSize: FS.body,
                  color: b.active ? "var(--fg)" : "var(--dim)",
                  fontWeight: b.active ? 700 : 400,
                }}
              >
                {b.label}
              </span>
              <span style={{ fontFamily: FONT_MONO, fontSize: FS.micro, color: "var(--mute)" }}>
                {b.range}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
