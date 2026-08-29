import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  titleRight?: ReactNode;
  subtitle?: string;
  children: ReactNode;
  className?: string;
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
  className,
  style,
  accentLine,
  accentBg,
}: SectionCardProps) {
  return (
    <div
      className={cn("rounded-[3px] border p-4 sm:px-[26px] sm:py-6", className)}
      style={{
        borderColor: accentLine ?? "var(--line)",
        background: accentBg ?? "var(--surface)",
        ...style,
      }}
    >
      {title && (
        <div
          className={cn(
            "flex flex-wrap items-baseline justify-between gap-3",
            subtitle ? "mb-1.5" : "mb-4",
          )}
        >
          <h2 className="m-0 whitespace-normal font-batang text-card-title font-bold sm:whitespace-nowrap">
            {title}
          </h2>
          {titleRight}
        </div>
      )}
      {subtitle && <p className="mb-4 text-body text-dim">{subtitle}</p>}
      {children}
    </div>
  );
}
