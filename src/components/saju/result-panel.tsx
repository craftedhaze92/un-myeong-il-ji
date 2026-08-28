"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FONT_BATANG, FONT_MONO, FONT_MYEONGJO, FS } from "./constants";
import styles from "./saju.module.css";
import { ElementCycle } from "./ui/element-cycle";
import { StrengthGauge } from "./ui/strength-gauge";
import { GanjiColumn } from "./ui/ganji-column";
import type { SinSalDetailVM } from "./reading-view-model";
import type { SajuViewModel } from "./view-model";

export interface ResultPanelProps {
  viewModel: SajuViewModel;
  /** 풀이(명식 탭)에 있던 신살 상세 — "신살 — 특별한 자리" 카드 옆으로 옮겨와 여기서만 그린다 */
  sinsalDetails: SinSalDetailVM[];
  onReset: () => void;
}

/**
 * 명식 카드·오행 레이더·십성·신살·용신·대운 띠 — saju-app.tsx에 있던 결과 화면을
 * 그대로 옮긴 것. 입력 폼(saju-app.tsx)과 풀이 패널(reading-panel.tsx)에서 분리해
 * 파일 하나가 3000줄을 넘기지 않게 한다.
 */
export function ResultPanel({ viewModel, sinsalDetails, onReset }: ResultPanelProps) {
  // 오른쪽 열(용신 + 신살 카드)의 높이를 왼쪽 열(오행과 십성 + 신강신약)에 맞춘다.
  // 순수 CSS(flex:1 + min-height:0 + overflow:auto)만으로는 "형제 컬럼 높이만큼만
  // 채우고 넘치면 스크롤"을 만들 수 없다 — 이 섹션 전체가 페이지 흐름 속 auto-height라
  // 어느 쪽도 기준이 될 '정해진 높이'가 없기 때문에(flex-grow가 채울 대상이 없으면
  // 그냥 내용 높이만큼 늘어난다), ResizeObserver로 왼쪽 열의 실제 렌더 높이를 재서
  // 오른쪽 열에 명시적 height로 지정해줘야 그 안의 overflow:auto가 실제로 작동한다.
  const leftColRef = useRef<HTMLDivElement>(null);
  const [leftColHeight, setLeftColHeight] = useState<number>();

  useLayoutEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setLeftColHeight(height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ width: "100%", maxWidth: 1100 }}>
      <div
        className={styles.fadeUp}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 32,
          padding: "54px 0 32px",
          flexWrap: "wrap",
          animationDelay: "1.1s",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: FONT_MYEONGJO,
              fontWeight: 800,
              fontSize: 46,
              margin: "0 0 10px",
              letterSpacing: "-0.01em",
              color: viewModel.myColor,
            }}
          >
            {viewModel.headline}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: FS.bodyLg,
              color: "var(--dim)",
            }}
          >
            {viewModel.headlineSub}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: FS.body,
              letterSpacing: "0.13em",
              color: "var(--dim)",
            }}
          >
            {viewModel.birthLine}
          </span>
          <button onClick={onReset} className={styles.resetButton}>
            다시 입력
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${viewModel.colCount}, 1fr)`,
          gap: 16,
          padding: "4px 0 42px",
        }}
      >
        {viewModel.pillars.map((p, i) => (
          <div
            key={i}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                paddingBottom: 8,
                borderBottom: "1px solid var(--line)",
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.cardTitle,
                  color: p.labelColor,
                }}
              >
                {p.label}
              </span>
              <span
                style={{
                  fontSize: FS.label,
                  letterSpacing: "0.02em",
                  color: p.labelColor,
                }}
              >
                {p.labelEn}
              </span>
            </div>

            <div
              className={styles.slot}
              style={{ animationDelay: `${p.slotDelay}ms` }}
            >
              <div
                className={styles.stampCard}
                style={{
                  background: p.stem.bg,
                  border: `1px solid ${p.stem.line}`,
                  animationDelay: `${p.delayA}ms`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_MYEONGJO,
                    fontWeight: 800,
                    fontSize: p.size,
                    height: 92,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    textAlign: "center",
                    color: p.stem.color,
                    textShadow: `0 0 32px ${p.stem.glow}`,
                  }}
                >
                  {p.stem.ch}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginTop: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: FS.body,
                      color: "var(--dim)",
                    }}
                  >
                    {p.stem.ko} {p.stem.el}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_BATANG,
                      fontSize: FS.body,
                      color: "var(--fg)",
                    }}
                  >
                    {p.stem.god}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={styles.slot}
              style={{ animationDelay: `${p.slotDelay}ms` }}
            >
              <div
                className={styles.stampCard}
                style={{
                  background: p.branch.bg,
                  border: `1px solid ${p.branch.line}`,
                  animationDelay: `${p.delayB}ms`,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_MYEONGJO,
                    fontWeight: 800,
                    fontSize: p.size,
                    height: 92,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    textAlign: "center",
                    color: p.branch.color,
                    textShadow: `0 0 32px ${p.branch.glow}`,
                  }}
                >
                  {p.branch.ch}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginTop: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: FS.body,
                      color: "var(--dim)",
                    }}
                  >
                    {p.branch.ko} {p.branch.el}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT_BATANG,
                      fontSize: FS.body,
                      color: "var(--fg)",
                    }}
                  >
                    {p.branch.god}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: FS.body,
                letterSpacing: "0.02em",
                color: "var(--dim)",
                textAlign: "center",
              }}
            >
              지장간{" "}
              <span
                style={{
                  fontFamily: FONT_MYEONGJO,
                  fontSize: FS.bodyLg,
                  color: "var(--fg)",
                }}
              >
                {p.branch.hidden}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className={styles.fadeUp}
        style={{
          display: "flex",
          gap: 22,
          // "stretch"(기본값)를 쓰면 오른쪽 열의 자연 높이가 왼쪽 열까지 밀어 올려서,
          // 아래 ResizeObserver가 왼쪽 열의 "고유" 높이가 아니라 이미 늘어난 높이를
          // 측정해버리는 순환 문제가 생긴다. flex-start로 두면 왼쪽 열은 항상 자기
          // 콘텐츠만큼의 실제 높이로 렌더되고, 그 값을 오른쪽 열에 그대로 적용할 수 있다.
          alignItems: "flex-start",
          paddingBottom: 22,
          animationDelay: "1.2s",
        }}
      >
        <div
          ref={leftColRef}
          style={{
            flex: "1.05 1 0",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 3,
              padding: "26px 28px 30px",
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.cardTitle,
                  margin: 0,
                }}
              >
                오행과 십성
              </h2>
            </div>
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "minmax(200px, 1fr) 1fr",
                gap: 28,
                alignItems: "center",
              }}
            >
              <ElementCycle cycle={viewModel.elementCycle} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {viewModel.elementDetails.map((d) => (
                  <div key={d.key}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: d.color,
                            opacity: 0.85,
                            fontFamily: FONT_MYEONGJO,
                            fontWeight: 700,
                            fontSize: FS.body,
                            color: "var(--bg)",
                          }}
                        >
                          {d.ch}
                        </span>
                        <span style={{ fontFamily: FONT_BATANG, fontSize: FS.body }}>
                          {d.groupLabel}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: FS.micro,
                          padding: "2px 8px",
                          borderRadius: 10,
                          color:
                            d.status === "발달"
                              ? "var(--fg)"
                              : d.status === "부족"
                                ? "var(--danger)"
                                : "var(--mute)",
                          background: "var(--track)",
                        }}
                      >
                        {d.status}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 14,
                        fontFamily: FONT_MONO,
                        fontSize: FS.body,
                        color: "var(--dim)",
                      }}
                    >
                      {d.gods.map((g) => (
                        <span key={g.name}>
                          {g.name} {g.pct}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: 3,
              padding: "24px 28px 26px",
              background: "var(--surface)",
            }}
          >
            <h2
              style={{
                fontFamily: FONT_BATANG,
                fontWeight: 700,
                fontSize: FS.cardTitle,
                margin: "0 0 16px",
              }}
            >
              신강신약
            </h2>
            {viewModel.strengthGauge && (
              <StrengthGauge gauge={viewModel.strengthGauge} />
            )}
          </div>
        </div>

        <div
          style={{
            flex: "1 1 0",
            // 왼쪽 열 실측 높이가 있으면 그 높이로 고정 — flex:1인 신살 로우가 "채울 대상"을
            // 갖게 되어 그 이상은 늘어나지 않고 내부 스크롤이 실제로 작동한다. 측정 전(첫
            // 렌더)에는 자연 높이로 보여 레이아웃 점프를 피한다.
            height: leftColHeight,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              border: `1px solid ${viewModel.yongLine}`,
              borderRadius: 3,
              padding: "24px 26px",
              background: viewModel.yongBg,
            }}
          >
            <h2
              style={{
                fontFamily: FONT_BATANG,
                fontWeight: 700,
                fontSize: FS.cardTitle,
                margin: "0 0 12px",
                whiteSpace: "nowrap",
              }}
            >
              용신 — 필요한 것
            </h2>
            <div
              style={{
                fontFamily: FONT_MYEONGJO,
                fontWeight: 800,
                fontSize: 54,
                lineHeight: 1,
                color: viewModel.yong.color,
                textShadow: `0 0 28px ${viewModel.yong.glow}`,
              }}
            >
              {viewModel.yong.ch}
            </div>
            <div
              style={{
                fontSize: FS.body,
                color: "var(--dim)",
                lineHeight: 1.75,
                marginTop: 12,
              }}
            >
              {viewModel.yong.desc}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 22,
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--line)",
                borderRadius: 3,
                padding: "24px 26px",
                background: "var(--surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.cardTitle,
                  margin: "0 0 14px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                신살 — 특별한 자리
              </h2>
              <div
                className={styles.sinsalScroll}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {viewModel.sinsal.map((s, i) => (
                  <div key={i}>
                    <div
                      style={{
                        fontFamily: FONT_MYEONGJO,
                        fontSize: FS.subtitle,
                        fontWeight: 700,
                      }}
                    >
                      {s.name}
                    </div>
                    <div
                      style={{
                        fontSize: FS.body,
                        color: "var(--dim)",
                        lineHeight: 1.75,
                      }}
                    >
                      {s.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--line)",
                borderRadius: 3,
                padding: "24px 26px",
                background: "var(--surface)",
              }}
            >
              <h2
                style={{
                  fontFamily: FONT_BATANG,
                  fontWeight: 700,
                  fontSize: FS.cardTitle,
                  margin: "0 0 14px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                신살 상세
              </h2>
              <div
                className={styles.sinsalScroll}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {sinsalDetails.map((s, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        fontFamily: FONT_MYEONGJO,
                        fontSize: FS.label,
                        fontWeight: 700,
                      }}
                    >
                      {s.name}({s.hanja})
                      <span
                        style={{
                          fontFamily: FONT_MONO,
                          fontSize: FS.body,
                          color: "var(--mute)",
                        }}
                      >
                        {s.typeLabel}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: FS.body,
                        lineHeight: 1.75,
                        marginTop: 4,
                        color: "var(--dim)",
                      }}
                    >
                      {s.description}
                    </div>
                    {s.advice.length > 0 && (
                      <div
                        style={{
                          fontSize: FS.body,
                          lineHeight: 1.75,
                          marginTop: 4,
                          color: "var(--mute)",
                        }}
                      >
                        조언: {s.advice.join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
                {sinsalDetails.length === 0 && (
                  <div style={{ fontSize: FS.body, color: "var(--mute)" }}>
                    두드러진 신살이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.fadeUp}
        style={{
          border: "1px solid var(--line)",
          borderRadius: 3,
          padding: "26px 28px 20px",
          background: "var(--surface)",
          animationDelay: "1.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontFamily: FONT_BATANG,
              fontWeight: 700,
              fontSize: FS.cardTitle,
              margin: 0,
            }}
          >
            대운 — 10년의 계절
          </h2>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: FS.body,
              letterSpacing: "0.12em",
              color: "var(--dim)",
            }}
          >
            {viewModel.luckNote}
          </span>
        </div>
        <div
          className={styles.luckScroll}
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 12,
          }}
        >
          {viewModel.luck.map((l, i) => (
            <GanjiColumn
              key={i}
              topLabel={String(l.startAge)}
              cell={l}
              current={l.current}
              accentColor={l.color}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "baseline",
            fontSize: FS.body,
            color: "var(--mute)",
            fontFamily: FONT_MONO,
            letterSpacing: "0.08em",
            paddingTop: 4,
          }}
        >
          {viewModel.luckFoot}
        </div>
      </div>

      <div
        className={styles.fadeUp}
        style={{
          border: "1px solid var(--line)",
          borderRadius: 3,
          padding: "26px 28px 20px",
          background: "var(--surface)",
          animationDelay: "1.35s",
          marginTop: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 18,
          }}
        >
          <h2
            style={{
              fontFamily: FONT_BATANG,
              fontWeight: 700,
              fontSize: FS.cardTitle,
              margin: 0,
            }}
          >
            세운 — 올해를 중심으로
          </h2>
        </div>
        <div
          className={styles.luckScroll}
          style={{
            display: "flex",
            gap: 10,
            overflowX: "auto",
            paddingBottom: 12,
          }}
        >
          {viewModel.seun.map((s, i) => (
            <GanjiColumn
              key={i}
              topLabel={String(s.year)}
              cell={s}
              current={s.current}
              accentColor={s.color}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
