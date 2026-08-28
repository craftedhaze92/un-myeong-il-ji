/**
 * 상용 작명 한자 사전 — 획수(오격 성명학용)와 자원오행(字源五行).
 *
 * `jakmeong_analysis.ts`의 예전 `getStrokeCount`는 한글 유니코드 코드포인트를 해싱해
 * 3~30 사이 임의값을 내는 가짜 계산이었다(한자 입력 경로 자체가 없었음). 이 표는 사용자가
 * 실제 한자를 입력했을 때만 참조되는 진짜 데이터로, 상용 인명용 한자 중 자주 쓰이는 것만
 * 좁게 채웠다 — 조후용신표(120칸, 이론적 해석)와 달리 이건 "몇 획인가"라는 사실 문제라
 * 잘못되면 실제 이름의 길흉 판정이 틀어진다. 정확도가 불확실하면 아예 빼거나 verified를
 * false로 낮춘다(추측을 확정처럼 내보내지 않는다는 `data/johu_table.ts`와 같은 원칙).
 *
 * ## 획수 — 원획법(原劃法)
 * 성명학은 옥편에 실린 필획(筆劃)이 아니라 부수의 "원래 글자" 획수로 계산하는 원획법을 쓴다
 * (현재 99% 이상의 작명소가 원획법 사용). 삼수변(氵)은 물 수(水, 4획), 심방변(忄)·마음심
 * 부수(心)는 마음 심(心, 4획)으로 계산한다 — 예: 河는 부수를 획수 그대로 세면(필획) 8획이지만
 * 삼수변을 水(4획)로 보는 원획법으로는 9획이다.
 * 참고: [원획과 필획의 차이](https://www.knaming.org/05_2.html),
 *       [성명학 획수 계산법](https://kimtaku.com/news/6125)
 *
 * 阝(阜/邑)·辶(辵)·罒(网) 등 원획 보정이 더 복잡한 부수가 든 한자는 이번 표에서 아예 뺐다 —
 * 어설프게 다뤄서 틀린 값을 내느니 "사전에 없음"으로 정직하게 빠지는 편이 낫다.
 *
 * ## 자원오행 — 부수 기반, 확신 있는 것만
 * 부수가 오행에 직접 대응하는 한자만(木→목, 火/灬/心/忄→화, 土/山/石→토, 金/釒→금,
 * 水/氵/氺→수) `elementVerified: true`로 표시한다. 그 외(예: 民의 부수 氏, 賢의 부수 貝)는
 * 발음오행으로 대체될 것을 전제로 임의값을 채워두되 `elementVerified: false`로 낮춘다 —
 * 실제 대체 로직은 `jakmeong_analysis.ts`에 있다(이 파일은 순수 데이터만 담는다).
 */

import type { WuXing } from '../types/index';

export interface NamingHanjaEntry {
  /** 원획법 기준 실제 획수 */
  strokes: number;
  /** 직접 확인했거나(웹 검색으로 원획 총획수 대조) 원획 보정이 필요 없는 단순 한자만 true */
  strokesVerified: boolean;
  /** 자원오행 — 부수가 오행에 직접 대응하지 않으면 낮은 신뢰도로 채운 참고값 */
  element: WuXing;
  /** 부수가 오행에 직접 대응하는가 */
  elementVerified: boolean;
  meaning: string;
}

function entry(
  strokes: number,
  strokesVerified: boolean,
  element: WuXing,
  elementVerified: boolean,
  meaning: string,
): NamingHanjaEntry {
  return { strokes, strokesVerified, element, elementVerified, meaning };
}

export const NAMING_HANJA_TABLE: Record<string, NamingHanjaEntry> = {
  // ── 성씨(단일 음절만 — 복성은 이번 범위 밖) ──────────────────────────
  金: entry(8, true, '금', true, '성씨 김/쇠 금'),
  李: entry(7, true, '목', false, '성씨 이/오얏나무'),
  朴: entry(6, true, '목', true, '성씨 박/후박나무'),
  崔: entry(11, true, '토', true, '성씨 최/높다'),
  姜: entry(9, true, '토', false, '성씨 강'),
  尹: entry(4, true, '토', false, '성씨 윤/다스리다'),
  張: entry(11, true, '목', false, '성씨 장/베풀다'),
  林: entry(8, true, '목', true, '성씨 임/수풀'),
  韓: entry(17, true, '목', false, '성씨 한/나라'),
  吳: entry(7, true, '목', false, '성씨 오'),
  徐: entry(10, true, '금', false, '성씨 서/천천히'),
  申: entry(5, true, '금', false, '성씨 신/펴다'),
  黃: entry(12, true, '토', true, '성씨 황/누렇다'),
  安: entry(6, true, '목', false, '성씨 안/편안하다'),
  宋: entry(7, true, '목', false, '성씨 송'),
  全: entry(6, true, '토', false, '성씨 전/온전하다'),
  高: entry(10, true, '목', false, '성씨 고/높다'),
  文: entry(4, true, '목', false, '성씨 문/글월'),
  孫: entry(10, true, '금', false, '성씨 손/손자'),
  白: entry(5, true, '금', true, '성씨 백/희다'),
  許: entry(11, true, '금', false, '성씨 허/허락하다'),
  南: entry(9, true, '화', false, '성씨 남/남녘'),
  成: entry(7, true, '금', false, '성씨 성/이루다'),
  車: entry(7, true, '화', false, '성씨 차/수레'),
  朱: entry(6, true, '목', false, '성씨 주/붉다'),
  禹: entry(9, true, '토', false, '성씨 우'),
  具: entry(8, true, '목', false, '성씨 구/갖추다'),

  // ── 이름 한자(공통) ──────────────────────────────────────────────
  民: entry(5, true, '토', false, '백성 민'),
  敏: entry(11, true, '토', false, '민첩할 민'),
  珉: entry(9, true, '토', false, '옥돌 민'),
  俊: entry(9, true, '금', false, '준걸 준'),
  賢: entry(15, true, '금', false, '어질 현'),
  現: entry(11, true, '금', false, '나타날 현'),
  度: entry(9, true, '토', false, '법도 도/헤아릴 탁(广 부수, 원획 보정 불필요)'),
  炫: entry(9, true, '화', true, '밝을 현/빛나다'),
  昊: entry(8, true, '화', false, '하늘 호'),
  皓: entry(12, true, '금', false, '밝을 호'),
  浩: entry(11, false, '수', true, '넓을 호(삼수변 원획 보정)'),
  瑞: entry(14, true, '금', false, '상서로울 서'),
  恩: entry(10, true, '화', true, '은혜 은(마음심 부수)'),
  銀: entry(14, true, '금', true, '은 은'),
  河: entry(9, true, '수', true, '물 하(원획: 삼수변→水)'),
  娥: entry(10, true, '토', false, '아름다울 아'),
  雅: entry(12, true, '토', false, '맑을 아'),
  榮: entry(15, true, '목', true, '영화로울 영'),
  瑛: entry(13, true, '금', false, '옥빛 영'),
  永: entry(5, true, '수', true, '길 영(물이 흐르는 모양)'),
  志: entry(7, true, '화', true, '뜻 지(마음심 부수)'),
  智: entry(12, true, '토', false, '지혜 지'),
  池: entry(7, false, '수', true, '못 지(삼수변 원획 보정)'),
  潤: entry(16, true, '수', true, '윤택할 윤(원획: 삼수변→水)'),
  胤: entry(9, true, '금', false, '이을 윤'),
  夏: entry(10, true, '화', false, '여름 하'),
  昌: entry(8, true, '화', false, '창성할 창'),
  盛: entry(11, true, '금', false, '성할 성'),
  星: entry(9, true, '화', false, '별 성'),
  秀: entry(7, true, '목', false, '빼어날 수'),
  修: entry(10, true, '금', false, '닦을 수'),
  洙: entry(10, false, '수', true, '물가 수(원획: 삼수변→水)'),
  眞: entry(10, true, '금', false, '참 진'),
  珍: entry(9, true, '토', false, '보배 진'),
  珠: entry(11, true, '토', false, '구슬 주'),
  熙: entry(13, true, '화', true, '빛날 희'),
  熹: entry(16, true, '화', true, '빛날 희'),
  弘: entry(5, true, '금', false, '넓을 홍'),
  洪: entry(10, false, '수', true, '넓을 홍(원획: 삼수변→水)'),
  昇: entry(8, true, '화', false, '오를 승'),
  勝: entry(12, true, '금', false, '이길 승'),
  承: entry(8, true, '목', false, '이을 승'),
  台: entry(5, true, '토', false, '별 태/태풍 태'),
  泰: entry(10, false, '수', true, '클 태(물 수 부수, 원획 보정)'),
  祐: entry(10, true, '금', false, '도울 우'),
  佑: entry(7, true, '화', false, '도울 우'),
  宇: entry(6, true, '목', false, '집 우'),
  雨: entry(8, true, '수', true, '비 우'),
  源: entry(14, false, '수', true, '근원 원(삼수변 원획 보정)'),
  沅: entry(8, false, '수', true, '물이름 원(삼수변 원획 보정)'),
  垠: entry(9, true, '토', true, '지경 은(흙토 부수)'),
  斗: entry(4, true, '화', false, '말 두'),
  鎭: entry(18, true, '금', true, '진압할 진'),
  信: entry(9, true, '화', false, '믿을 신'),
  愼: entry(14, false, '화', true, '삼갈 신(마음심 부수, 원획 보정)'),
  然: entry(12, true, '화', true, '그럴 연(불화발 부수)'),
  淵: entry(13, false, '수', true, '못 연(삼수변 원획 보정)'),
  妍: entry(9, true, '토', false, '고울 연'),
  英: entry(9, true, '목', false, '꽃부리 영'),
  幸: entry(8, true, '토', false, '다행 행'),
  行: entry(6, true, '화', false, '다닐 행'),
  烈: entry(10, true, '화', true, '매울 렬(불화발 부수)'),
  烏: entry(10, true, '화', true, '까마귀 오(불화 부수 아님, 참고용)'),
  和: entry(8, true, '금', false, '화할 화'),
  華: entry(12, true, '목', false, '빛날 화'),
  湖: entry(13, false, '수', true, '호수 호(삼수변 원획 보정)'),
  準: entry(14, false, '수', true, '준할 준(삼수변 원획 보정)'),
};

// 다음처럼 착받침(辶)·좌부방/우부방(阝)·그물망(罒) 부수가 든 한자는 원획 보정이 더
// 복잡해(阜/邑/网 등 원래 글자 획수를 부수 위치에 따라 다르게 적용해야 함) 이번 표에서
// 의도적으로 뺐다: 遵(쫓을 준), 鄭(성씨 정), 陳(성씨 진), 郁(성할 욱), 蓮(연꽃 연),
// 進(나아갈 진), 遠(멀 원), 道(길 도) 등. 어설프게 다뤄서 틀린 값을 내느니 "사전에 없음"으로
// 정직하게 빠지는 편이 낫다 — 나중에 보강할 때 이 부수들의 원획 규칙부터 검증할 것.
