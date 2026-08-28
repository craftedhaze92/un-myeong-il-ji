"use client";

import { useState } from "react";
import { checkCompatibility } from "@/lib/compatibility";
import { formatErrorForUser } from "@/lib/error_handler";
import { calculateSaju } from "@/lib/saju";
import type { CompatibilityAnalysis, SajuData } from "@/types";
import {
  BirthForm,
  deriveBirthInput,
  EMPTY_BIRTH_FORM_VALUES,
  type BirthFormValues,
} from "./birth-form";
import { dimText, FONT_BATANG, FS, muteText } from "./constants";
import { BulletList } from "./ui/bullet-list";
import { ScoreBar } from "./ui/score-bar";
import { SectionCard } from "./ui/section-card";

export interface CompatibilitySectionProps {
  mySaju: SajuData;
  myName: string;
}

const PARTNER_DEFAULTS: BirthFormValues = {
  ...EMPTY_BIRTH_FORM_VALUES,
  gender: "female",
};

/**
 * 궁합 보기 — 본인 명식은 이미 계산된 것(mySaju)을 그대로 쓰고, 상대방 생년월일시만
 * 새로 입력받아 lib/compatibility.ts#checkCompatibility로 종합한다.
 * BirthForm/deriveBirthInput을 saju-app.tsx의 메인 입력 폼과 공유해 검증 로직이
 * 두 곳에서 따로 어긋나지 않게 한다.
 */
export function CompatibilitySection({
  mySaju,
  myName,
}: CompatibilitySectionProps) {
  const [open, setOpen] = useState(false);
  const [partner, setPartner] = useState<BirthFormValues>(PARTNER_DEFAULTS);
  const [result, setResult] = useState<{
    partnerName: string;
    analysis: CompatibilityAnalysis;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    partner.name.trim() !== "" && partner.y !== "" && partner.m !== "" && partner.d !== "";

  const compute = () => {
    if (!canSubmit) return;
    setError(null);
    try {
      const { birthDate, birthTime, unknownHour } = deriveBirthInput(partner);
      const partnerSaju = calculateSaju(
        birthDate,
        birthTime,
        partner.calendarType,
        partner.calendarType === "lunar" ? partner.isLeapMonth : false,
        partner.gender,
        partner.city.trim(),
        { unknownHour },
      );
      const analysis = checkCompatibility(mySaju, partnerSaju);
      setResult({ partnerName: partner.name.trim(), analysis });
    } catch (e) {
      setResult(null);
      setError(formatErrorForUser(e).error.message);
    }
  };

  return (
    <section style={{ width: "100%", maxWidth: 1100, paddingTop: 20 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "1px solid var(--line)",
          color: "var(--dim)",
          fontFamily: FONT_BATANG,
          fontSize: FS.body,
          padding: "10px 20px",
          borderRadius: 2,
          cursor: "pointer",
        }}
      >
        {open ? "궁합 보기 닫기" : "다른 사람과 궁합 보기"}
      </button>

      {open && (
        <SectionCard title="상대방 정보" style={{ marginTop: 16 }}>
          <BirthForm
            values={partner}
            onChange={(patch) => setPartner((v) => ({ ...v, ...patch }))}
            nameLabel="상대방 이름"
            nameLabelHanja="他人"
            cityListId="compat-city-list"
          />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={compute}
              disabled={!canSubmit}
              style={{
                background: "var(--fg)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 2,
                padding: "14px 40px",
                fontFamily: FONT_BATANG,
                fontWeight: 700,
                fontSize: FS.body,
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.4,
              }}
            >
              궁합 보기
            </button>
          </div>
          {error && (
            <p
              style={{
                margin: "14px 0 0",
                fontSize: FS.small,
                color: "var(--danger)",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}
        </SectionCard>
      )}

      {result && (
        <SectionCard
          title={`${myName} · ${result.partnerName} 궁합`}
          style={{ marginTop: 16 }}
        >
          <ScoreBar label="종합 궁합" score={result.analysis.compatibilityScore} />
          <div
            style={{ fontSize: FS.body, lineHeight: 1.75, margin: "14px 0", ...dimText }}
          >
            {result.analysis.summary}
          </div>
          <ScoreBar label="오행 조화" score={result.analysis.elementHarmony.harmony} />
          <div style={{ fontSize: FS.small, margin: "6px 0 16px", ...muteText }}>
            {result.analysis.elementHarmony.description}
          </div>
          <BulletList items={result.analysis.strengths} tone="positive" />
          <BulletList items={result.analysis.weaknesses} tone="negative" />
          <BulletList items={result.analysis.advice} />
        </SectionCard>
      )}
    </section>
  );
}
