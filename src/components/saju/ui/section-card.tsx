import type { CSSProperties, ReactNode } from "react";
import { FONT_BATANG, FS } from "../constants";

export interface SectionCardProps {
  title?: string;
  titleRight?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  style?: CSSProperties;
  /** 기본 var(--line) 대신 쓸 테두리 색 (용신 카드처럼 강조가 필요할 때) */
  accentLine?: string;
  /** 기본 var(--surface) 대신 쓸 배경 */
  accentBg?: string;
}

/**
 * saju-app.tsx 결과 화면 전반에서 반복되던 "테두리 + radius 3 + surface 배경 + 제목" 카드 껍데기.
 * 풀이 패널(reading-panel.tsx)과 명식 결과 패널(result-panel.tsx)이 공유한다.
 */
export function SectionCard({
  title,
  titleRight,
  subtitle,
  children,
  style,
  accentLine,
  accentBg,
}: SectionCardProps) {
  return (
    <div
      style={{
        border: `1px solid ${accentLine ?? "var(--line)"}`,
        borderRadius: 3,
        padding: "24px 26px",
        background: accentBg ?? "var(--surface)",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: subtitle ? 6 : 16,
          }}
        >
          <h2
            style={{
              fontFamily: FONT_BATANG,
              fontWeight: 700,
              fontSize: FS.cardTitle,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h2>
          {titleRight}
        </div>
      )}
      {subtitle && (
        <p
          style={{
            margin: "0 0 16px",
            fontSize: FS.body,
            color: "var(--dim)",
          }}
        >
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
