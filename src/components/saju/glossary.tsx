const TERMS = [
  ["일간", "태어난 날의 천간. 명식 해석에서 나를 나타내는 기준점입니다."],
  [
    "오행",
    "목·화·토·금·수의 다섯 기운. 많고 적음 자체를 좋고 나쁨으로 단정하지 않습니다.",
  ],
  [
    "십성",
    "일간과 다른 글자의 관계를 비견·식신·재성·관성·인성 등 역할로 읽는 체계입니다.",
  ],
  [
    "용신",
    "명식의 균형을 돕는 오행을 찾는 해석 기준입니다. 운명을 확정하는 단일 정답은 아닙니다.",
  ],
  [
    "대운",
    "절입 시각과 성별·연간 음양을 바탕으로 계산하는 약 10년 단위 흐름입니다.",
  ],
  [
    "세운·월운",
    "해와 달에 들어오는 간지를 원국과 비교한 흐름입니다. 월주는 양력 1일이 아니라 절입 순간에 바뀝니다.",
  ],
  [
    "합·충",
    "지지 사이의 결합·긴장 관계입니다. 실제 사건을 확정하기보다 관계의 작동 방향을 살핍니다.",
  ],
] as const;

export function Glossary() {
  return (
    <details className="border-line umij-container mt-8 border-y py-4">
      <summary className="font-batang text-body text-dim hover:text-fg cursor-pointer font-bold">
        처음 보는 사주 용어
      </summary>
      <dl className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {TERMS.map(([term, description]) => (
          <div key={term}>
            <dt className="font-batang text-label font-bold">{term}</dt>
            <dd className="text-small text-mute mt-1 leading-[1.7]">
              {description}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
