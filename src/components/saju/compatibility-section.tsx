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
    <section className="umij-container pt-5">
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex cursor-pointer items-center gap-1.5 rounded-[2px] border border-line bg-transparent px-5 py-2.5 font-batang text-body text-dim"
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

        <Collapsible.Content className={cn("overflow-hidden", styles.collapsibleContent)}>
          <SectionCard title="상대방 정보" className="mt-4">
            <BirthForm
              values={partner}
              onChange={(patch) => setPartner((v) => ({ ...v, ...patch }))}
              nameLabel="상대방 이름"
              nameLabelHanja="他人"
              cityListId="compat-city-list"
            />
            <div className="flex justify-center">
              <motion.button
                onClick={compute}
                disabled={!canSubmit}
                whileHover={canSubmit ? { scale: 1.02 } : undefined}
                whileTap={canSubmit ? { scale: 0.97 } : undefined}
                className={cn(
                  "rounded-[2px] border-none bg-fg px-10 py-3.5 font-batang text-body font-bold text-bg",
                  canSubmit ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40",
                )}
              >
                궁합 보기
              </motion.button>
            </div>
            {error && <p className="mt-3.5 text-center text-small text-danger">{error}</p>}
          </SectionCard>
        </Collapsible.Content>
      </Collapsible.Root>

      {result && (
        <SectionCard title={`${myName} · ${result.partnerName} 궁합`} className="mt-4">
          <ScoreBar label="종합 궁합" score={result.analysis.compatibilityScore} />
          <div className="my-3.5 text-body leading-[1.75] text-dim">
            {result.analysis.summary}
          </div>
          <ScoreBar label="오행 조화" score={result.analysis.elementHarmony.harmony} />
          <div className="my-1.5 mb-4 text-small text-mute">
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
