"use client";

import { motion } from "motion/react";
import type { ElementCycleVM } from "../view-model";

export interface ElementCycleProps {
  cycle: ElementCycleVM;
}

const STATUS_LABEL_COLOR: Record<string, string> = {
  발달: "var(--fg)",
  부족: "var(--danger)",
  적정: "var(--mute)",
};

/**
 * 오행 오각형 — 인접 노드를 잇는 굵은 곡선 화살표가 상생(生), 두 칸 건너 노드를 잇는
 * 점선 직선이 상극(克)이다. 각 원은 오행 비중(%)만큼 아래에서부터 차오르는 반달 채움으로
 * 표시한다. 좌표·경로는 view-model.ts#buildElementCycle이 미리 계산해 넘긴다.
 */
export function ElementCycle({ cycle }: ElementCycleProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-body text-dim flex gap-5">
        <span className="flex items-center gap-1.5">
          생
          <svg
            width="28"
            height="10"
            viewBox="0 0 28 10"
            style={{ overflow: "visible" }}
          >
            <line
              x1="1"
              y1="5"
              x2="22"
              y2="5"
              stroke="var(--fg)"
              strokeWidth={1.5}
              markerEnd="url(#elCycleLegendArrow)"
            />
            <defs>
              <marker
                id="elCycleLegendArrow"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--fg)" />
              </marker>
            </defs>
          </svg>
        </span>
        <span className="flex items-center gap-1.5">
          극
          <svg
            width="28"
            height="10"
            viewBox="0 0 28 10"
            style={{ overflow: "visible" }}
          >
            <line
              x1="1"
              y1="5"
              x2="22"
              y2="5"
              stroke="var(--mute)"
              strokeWidth={1.25}
              strokeDasharray="2.5 3"
              markerEnd="url(#elCycleLegendArrowKe)"
            />
            <defs>
              <marker
                id="elCycleLegendArrowKe"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L6,3 L0,6 Z" fill="var(--mute)" />
              </marker>
            </defs>
          </svg>
        </span>
      </div>

      <svg
        viewBox="-16 -16 232 232"
        className="block w-full"
        style={{ height: "auto", overflow: "visible" }}
      >
        <defs>
          <marker
            id="shengArrow"
            markerWidth="7"
            markerHeight="7"
            refX="5.5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--fg)" />
          </marker>
          <marker
            id="keArrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" fill="var(--mute)" />
          </marker>
          {cycle.nodes.map((n) => (
            <clipPath key={n.clipId} id={n.clipId}>
              <rect
                x={n.cx - n.r - 2}
                y={n.fillY}
                width={n.r * 2 + 4}
                height={n.r * 2 + 4}
              />
            </clipPath>
          ))}
        </defs>

        {cycle.ke.map((arrow, i) => (
          <path
            key={`ke-${i}`}
            d={arrow.d}
            fill="none"
            stroke="var(--mute)"
            strokeWidth={1.25}
            strokeDasharray="2.5 3.5"
            markerEnd="url(#keArrow)"
          />
        ))}

        {cycle.sheng.map((arrow, i) => (
          <path
            key={`sheng-${i}`}
            d={arrow.d}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={1.5}
            opacity={0.55}
            markerEnd="url(#shengArrow)"
          />
        ))}

        {cycle.nodes.map((n, i) => (
          <motion.g
            key={n.key}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
            style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
          >
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill="var(--surface)"
              stroke="var(--line)"
              strokeWidth={1}
            />
            {n.pct > 0 && (
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill={n.color}
                opacity={0.22}
                clipPath={`url(#${n.clipId})`}
              />
            )}
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill="none"
              stroke={n.color}
              strokeWidth={1.5}
            />
            <text
              x={n.cx}
              y={n.cy - 3}
              textAnchor="middle"
              fontFamily="var(--font-plex-mono), monospace"
              fontSize={12.5}
              fontWeight={700}
              fill="var(--fg)"
            >
              {n.pct}%
            </text>
            <g transform={`translate(${n.cx}, ${n.cy + n.r + 6})`}>
              <rect
                x={-11}
                y={-4}
                width={22}
                height={22}
                rx={4}
                fill={n.color}
                opacity={0.16}
              />
              <text
                x={0}
                y={12}
                textAnchor="middle"
                fontFamily="var(--font-myeongjo), serif"
                fontSize={14}
                fontWeight={700}
                fill={n.color}
              >
                {n.ch}
              </text>
            </g>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

export { STATUS_LABEL_COLOR };
