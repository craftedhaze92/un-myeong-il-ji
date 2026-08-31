/**
 * 궁통보감(窮通寶鑑, 일명 난강망欄江網) 조후용신표 — 흔히 〈희용제요(喜用提要)〉로 요약되는
 * 일간(10) × 월지(12) = 120칸 표.
 *
 * 궁통보감의 핵심 주장은 "같은 월지라도 일간이 다르면 필요한 조후 글자가 다르다"는 것이다
 * (예: 子月 갑목은 丁火로 온난하지만, 子月 경금은 丁火+甲木이 함께 필요하다). 그래서 이 표는
 * 반드시 천간 단위로 저장한다 — 丙火(태양)와 丁火(등불), 壬水(강물)와 癸水(이슬)를 오행으로
 * 뭉개면 조후 이론 자체가 무의미해진다. 오행 환산은 조회 함수(johu.ts) 쪽에서 한다.
 *
 * 데이터 출처: 궁통보감(난강망) 원문에 근거해 여러 현대 명리학 강의 자료·해설서에서
 * 공통적으로 인용되는 〈희용제요〉 요약표를 정리했다. 자체 원문 대조까지는 못 마쳤으므로,
 * 웹 검색으로 복수 출처가 서로 일치함을 직접 확인한 칸만 verified: true로 표시하고,
 * 나머지는 통설을 따르되 verified: false로 남긴다 — johu.ts#selectJohuYongSin이 이 값을
 * 보고 신뢰도(confidence)를 낮춘다. 미확정 칸을 확정처럼 내보내지 않는다는 원칙은
 * jakmeong_analysis.ts의 가짜 획수를 화면에서 비노출한 것과 같다(docs/AI_AGENT_GUIDE.md 참고).
 *
 * 참고: https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002857929
 *       (『궁통보감』에서 용신의 의미와 〈희용제요〉 — 甲木과 庚金을 중심으로)
 *       https://www.kabsool.com/bbs/board.php?bo_table=basic&wr_id=83 (일간과 생월에 따른 조후용신일람표)
 */

import type { EarthlyBranch, HeavenlyStem } from '../types/index';

export interface JohuEntry {
  /** 주 조후용신 (천간 단위, 보통 1~2개) */
  primary: HeavenlyStem[];
  /** 보조용신 */
  secondary: HeavenlyStem[];
  /** 조건부 분기나 특기사항 (예: "지지에 水局을 이루면 戊土로 막아야 함") */
  note?: string;
  /** 복수 출처로 대조된 칸인가 — false면 조회 시 신뢰도를 낮춘다 */
  verified: boolean;
}

type JohuRow = Record<EarthlyBranch, JohuEntry>;

function entry(primary: HeavenlyStem[], secondary: HeavenlyStem[], verified: boolean, note?: string): JohuEntry {
  return note ? { primary, secondary, verified, note } : { primary, secondary, verified };
}

// 갑목(甲木, 양목)
const GAP: JohuRow = {
  인: entry(['병', '계'], ['경'], false, '초봄, 한기가 남아 병화로 온난하고 계수로 뿌리를 적신다'),
  묘: entry(['경'], ['병', '정'], false),
  진: entry(['경', '임'], ['정'], false),
  사: entry(['계'], ['정', '경'], false),
  오: entry(['계'], ['정', '경'], false),
  미: entry(['계'], ['경', '정'], false),
  신: entry(['경', '정'], ['임'], false),
  유: entry(['경'], ['병', '정'], false),
  술: entry(['갑', '정'], ['임', '계'], false, '갑목으로 조토를 소토(疏土)'),
  해: entry(['경', '정'], ['병'], false),
  자: entry(['정'], ['경', '병'], false, '한겨울, 정화로 온난'),
  축: entry(['정'], ['경', '병'], false),
};

// 을목(乙木, 음목) — 유·술·해월은 웹 검색으로 복수 출처 대조 완료
const EUL: JohuRow = {
  인: entry(['병'], ['계'], false),
  묘: entry(['병'], ['계'], false),
  진: entry(['계'], ['병', '무'], false),
  사: entry(['계'], ['병'], false),
  오: entry(['계'], [], false),
  미: entry(['계'], ['병'], false),
  신: entry(['병'], ['계'], false),
  유: entry(['계'], ['병', '정'], true, '가을 건조 — 계수로 자윤, 병정으로 온기 보완'),
  술: entry(['계'], ['신'], true, '늦가을 — 계수로 자윤, 신금으로 수원 보충'),
  해: entry(['병'], ['무'], true, '초겨울 한습 — 병화로 온난, 무토로 물을 막아 뿌리 보호'),
  자: entry(['병'], ['정'], false),
  축: entry(['병'], ['정'], false),
};

// 병화(丙火, 양화) — 인·묘·사월은 웹 검색으로 복수 출처 대조 완료
const BYEONG: JohuRow = {
  인: entry(['임', '경'], [], true, '임수로 반조(反照), 경금으로 임수의 근원을 생조'),
  묘: entry(['임'], ['갑'], true, '갑목이 병화를 도와 목화통명(木火通明)'),
  진: entry(['임'], ['갑'], false),
  사: entry(['임', '경'], ['계'], true, '득록한 여름 초입 — 임수로 조절, 경금으로 수원 보충'),
  오: entry(['임'], ['경'], false),
  미: entry(['임'], ['경'], false),
  신: entry(['임'], ['무'], false),
  유: entry(['임'], ['계'], false),
  술: entry(['갑'], ['임'], false),
  해: entry(['갑'], ['무', '경'], false),
  자: entry(['임'], ['무', '기'], false, '한겨울 — 임수로 조후하되 무기토로 범람 방지'),
  축: entry(['임'], ['갑'], false),
};

// 정화(丁火, 음화)
const JEONG: JohuRow = {
  인: entry(['갑'], ['경'], false),
  묘: entry(['경'], ['갑'], false),
  진: entry(['갑'], ['경'], false),
  사: entry(['갑'], ['경'], false),
  오: entry(['임'], ['경'], false),
  미: entry(['갑'], ['임'], false),
  신: entry(['갑'], ['경', '무'], false),
  유: entry(['갑'], ['경'], false),
  술: entry(['갑'], ['경'], false),
  해: entry(['갑'], ['경'], false),
  자: entry(['갑'], ['경'], false),
  축: entry(['갑'], ['경'], false),
};

// 무토(戊土, 양토) — 웹 검색(threads 요약)으로 12개월 전체 대조 완료
const MU: JohuRow = {
  인: entry(['병', '갑'], ['계'], true),
  묘: entry(['병', '갑'], ['계'], true),
  진: entry(['갑', '병'], ['계'], true),
  사: entry(['갑', '병'], ['계'], true),
  오: entry(['임', '갑', '병'], ['신'], true),
  미: entry(['계', '병'], ['갑'], true),
  신: entry(['병', '계'], ['갑'], true),
  유: entry(['병', '정'], ['계', '임'], true),
  술: entry(['갑', '계'], ['병'], true),
  해: entry(['갑', '병'], [], true),
  자: entry(['병'], [], true),
  축: entry(['병'], [], true),
};

// 기토(己土, 음토)
const GI: JohuRow = {
  인: entry(['병', '갑'], ['계'], false),
  묘: entry(['갑', '계'], ['병'], false),
  진: entry(['병', '계'], ['갑'], false),
  사: entry(['계'], ['병'], false),
  오: entry(['계'], ['병'], false),
  미: entry(['계'], ['병'], false),
  신: entry(['병'], ['계'], false),
  유: entry(['병'], ['계'], false),
  술: entry(['갑', '병'], ['계'], false),
  해: entry(['병', '갑'], ['무'], false),
  자: entry(['병', '갑'], ['무'], false),
  축: entry(['병', '갑'], [], false),
};

// 경금(庚金, 양금)
const GYEONG: JohuRow = {
  인: entry(['무', '갑'], ['임', '병'], false),
  묘: entry(['정', '갑'], ['경'], false),
  진: entry(['갑', '정'], ['임'], false),
  사: entry(['임', '무'], ['병'], false),
  오: entry(['임'], ['계'], false),
  미: entry(['정'], ['갑'], false),
  신: entry(['정'], ['갑'], false),
  유: entry(['정'], ['갑', '병'], false),
  술: entry(['갑'], ['임'], false),
  해: entry(['정'], ['병'], false),
  자: entry(['병', '정'], ['갑'], false),
  축: entry(['병', '정'], ['갑'], false),
};

// 신금(辛金, 음금)
const SIN: JohuRow = {
  인: entry(['기'], ['임'], false),
  묘: entry(['임'], ['갑'], false),
  진: entry(['임'], ['갑'], false),
  사: entry(['임', '갑'], ['계'], false),
  오: entry(['임', '기'], ['계'], false),
  미: entry(['임'], ['경', '갑'], false),
  신: entry(['임'], ['갑'], false),
  유: entry(['임'], ['갑'], false),
  술: entry(['임'], ['갑'], false),
  해: entry(['임'], ['병'], false),
  자: entry(['병'], ['임'], false),
  축: entry(['병'], ['임'], false),
};

// 임수(壬水, 양수)
const IM: JohuRow = {
  인: entry(['경', '병'], ['무'], false),
  묘: entry(['경'], ['신'], false),
  진: entry(['갑'], ['경'], false),
  사: entry(['임', '신'], ['경'], false),
  오: entry(['계', '경'], ['신'], false),
  미: entry(['신'], ['갑'], false),
  신: entry(['무'], ['정'], false),
  유: entry(['갑'], ['경'], false),
  술: entry(['갑'], ['병'], false),
  해: entry(['무', '경'], ['병'], false),
  자: entry(['무'], ['병'], true, '한겨울 범람 방지 — 무토로 둑을 쌓음'),
  축: entry(['병'], ['정'], false),
};

// 계수(癸水, 음수)
const GYE: JohuRow = {
  인: entry(['신'], ['병'], false),
  묘: entry(['경'], ['신'], false),
  진: entry(['병'], ['신', '갑'], false),
  사: entry(['신'], ['경'], false),
  오: entry(['경', '임'], ['계'], false),
  미: entry(['경', '신'], ['임'], false),
  신: entry(['정'], ['갑'], false),
  유: entry(['신'], ['병'], false),
  술: entry(['신', '갑'], ['임'], false),
  해: entry(['경'], ['신'], false),
  자: entry(['병'], ['신'], false),
  축: entry(['병'], ['정'], false),
};

export const JOHU_TABLE: Record<HeavenlyStem, JohuRow> = {
  갑: GAP,
  을: EUL,
  병: BYEONG,
  정: JEONG,
  무: MU,
  기: GI,
  경: GYEONG,
  신: SIN,
  임: IM,
  계: GYE,
};

/** 한랭(亥子丑) 또는 염열(巳午未) 월지 — 조후 시급도(urgency) 판단에 쓴다 */
export const COLD_BRANCHES: EarthlyBranch[] = ['해', '자', '축'];
export const HOT_BRANCHES: EarthlyBranch[] = ['사', '오', '미'];
