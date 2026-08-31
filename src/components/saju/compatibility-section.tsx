"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "motion/react";
import { Collapsible } from "radix-ui";
import { checkCompatibility } from "@/lib/compatibility";
import { formatErrorForUser } from "@/lib/error_handler";
import { calculateSaju } from "@/lib/saju";
import { cn } from "@/lib/utils";
import type { CompatibilityAnalysis, SajuData } from "@/types";
import {
  BirthForm,
  deriveBirthInput,
  EMPTY_BIRTH_FORM_VALUES,
  type BirthFormValues,
} from "./birth-form";
import styles from "./saju.module.css";
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
  const [lens, setLens] = useState<"연인" | "가족" | "동료">("연인");

  const canSubmit =
    partner.name.trim() !== "" &&
    partner.y !== "" &&
    partner.m !== "" &&
    partner.d !== "";

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
    <section className="umij-container pt-5">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="border-line font-batang text-body text-dim flex cursor-pointer items-center gap-1.5 rounded-[2px] border bg-transparent px-5 py-2.5"
          >
            {open ? "궁합 보기 닫기" : "다른 사람과 궁합 보기"}
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              <ChevronDown size={16} />
            </motion.span>
          </motion.button>
        </Collapsible.Trigger>

        <Collapsible.Content
          className={cn("overflow-hidden", styles.collapsibleContent)}
        >
          <SectionCard title="상대방 정보" className="mt-4">
            <BirthForm
              values={partner}
              onChange={(patch) => setPartner((v) => ({ ...v, ...patch }))}
              nameLabel="상대방 이름"
              nameLabelHanja="他人"
              cityListId="compat-city-list"
            />
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-small text-mute mr-1">관계 관점</span>
              {(["연인", "가족", "동료"] as const).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setLens(item)}
                  aria-pressed={lens === item}
                  className="text-small cursor-pointer rounded-[2px] border bg-transparent px-3 py-1.5"
                  style={{
                    borderColor: lens === item ? "var(--fg)" : "var(--line)",
                    color: lens === item ? "var(--fg)" : "var(--mute)",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <motion.button
                onClick={compute}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.97 } : undefined}
                className={cn(
                  "bg-fg font-batang text-body text-bg rounded-[2px] border-none px-10 py-3.5 font-bold",
                  canSubmit
                    ? "cursor-pointer opacity-100"
                    : "cursor-not-allowed opacity-40",
                )}
              >
                궁합 보기
              </motion.button>
            </div>
            {error && (
              <p className="text-small text-danger mt-3.5 text-center">
                {error}
              </p>
            )}
          </SectionCard>
        </Collapsible.Content>
      </Collapsible.Root>

      {result && (
        <SectionCard
          title={`${myName} · ${result.partnerName} ${lens} 궁합`}
          className="mt-4"
        >
          <p className="text-small text-mute mb-4 leading-[1.7]">
            {lens === "연인"
              ? "끌림의 크기보다 감정 표현과 갈등 회복 방식을 중심으로 읽어보세요."
              : lens === "가족"
                ? "생활 리듬과 서로의 다름을 받아들이는 방식을 중심으로 읽어보세요."
                : "역할 분담, 의사결정, 강점 보완 가능성을 중심으로 읽어보세요."}{" "}
            관계 관점은 해석의 초점만 바꾸며 계산 점수를 임의로 바꾸지 않습니다.
          </p>
          <ScoreBar
            label="종합 궁합"
            score={result.analysis.compatibilityScore}
          />
          <div className="text-body text-dim my-3.5 leading-[1.75]">
            {result.analysis.summary}
          </div>
          <ScoreBar
            label="오행 조화"
            score={result.analysis.elementHarmony.harmony}
          />
          <div className="text-small text-mute my-1.5 mb-4">
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
