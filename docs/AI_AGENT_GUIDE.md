# AI Agent Guide

이 문서는 이 저장소에서 작업하는 AI 코딩 에이전트가 공통으로 따라야 할 프로젝트 지침이다.
`AGENTS.md`와 `CLAUDE.md`는 각 도구가 자동으로 읽는 진입점이며, 상세 규칙의 단일 출처는 이 문서다.

## 프로젝트와 작업 원칙

- 개인용 사주팔자 웹 애플리케이션으로, 계산 정확성과 같은 입력에 대한 결정론적 결과를 최우선으로 한다.
- Node.js 20 이상과 pnpm 10 이상을 사용한다. npm이나 yarn으로 별도 잠금 파일을 만들지 않는다.
- 환경 변수와 외부 API 키는 필요하지 않다. 사주 계산과 달력 데이터는 모두 로컬에서 처리된다.
- 기존 구현과 테스트를 먼저 확인하고, 이미 존재하는 계산·상수·파사드를 재사용한다.
- 사용자 변경이나 관련 없는 작업 트리 변경을 되돌리지 않는다.
- 새 런타임 의존성은 기존 도구로 해결할 수 없는 경우에만 추가하며, 추가 이유와 영향을 명확히 설명한다.

## 개발 명령

```bash
pnpm install
pnpm dev
pnpm test
pnpm test:watch
pnpm typecheck
pnpm lint
pnpm build
```

- 계산 또는 도메인 로직 변경: 관련 테스트를 먼저 실행하고, 완료 전 `pnpm test`, `pnpm typecheck`, `pnpm lint`를 실행한다.
- UI 또는 ViewModel 변경: 관련 콜로케이션 테스트와 `pnpm typecheck`, `pnpm lint`를 실행한다. 라우팅·렌더링·빌드 설정에 영향이 있으면 `pnpm build`도 실행한다.
- 문서나 주석만 변경: 링크·명령·경로를 대조하고 `git diff --check`를 실행한다. 코드 검증을 생략했다면 완료 보고에 명시한다.
- 포매터는 관련 파일에만 적용하고, 무관한 파일을 일괄 재작성하지 않는다.

## Architecture

### 계산 파이프라인 — 단일 진입점

`calculateSaju(birthDate, birthTime, calendar, isLeapMonth, gender, birthCity?)` (`src/lib/saju.ts`)가
사주 계산 전체의 유일한 진입점이다. 내부에서 음력→양력 변환(`calendar.ts`), 출생지 경도에 따른
진태양시 보정(`utils/date.ts#getAdjustedBirthInstantForSaju`), 사주팔자(연/월/일/시주) 계산을 거친 뒤
`ten_gods`·`sin_sal`·`day_master_strength`·`gyeok_guk`·`yong_sin` 분석을 **이미 조합해서** `SajuData`를 반환한다.
다른 모든 분석 모듈(대운/세운/월운 등)은 이 `SajuData`를 입력으로 받는 후속 단계다.

`sajuCache`(`performance_cache.ts`, 1000건/60분)로 결과가 캐싱되므로, 계산 로직을 고치면
같은 프로세스 내에서 캐시가 무효화되지 않는다는 점을 테스트 작성 시 유의(테스트는 매번 새 프로세스라 문제없음).

### 두 계열의 "운(運)" 모듈 — 계산 vs 서술

같은 대상을 다루는 파일이 두 벌 존재한다. 이름이 비슷해 혼동하기 쉽다.

| 계산 레이어 (`*_un.ts`) | 서술/해석 레이어 (`*un_analysis.ts`) |
|---|---|
| `dae_un.ts` — `calculateDaeUn(sajuData)`, 10년 단위 대운 간지 | `daeun_analysis.ts` — 대운 서술 생성 |
| `se_un.ts` — `analyzeSeUn(sajuData, year)`, 연 단위 간지 | `seyun_analysis.ts` |
| `wol_un.ts` — `analyzeWolUn(sajuData, year, month, yearStem)`, 월 단위 간지 (세운의 연간이 필요) | `wolun_analysis.ts` |
| `si_un.ts` — `analyzeSiUn` 등, 12시진 단위. **현재 아무 곳에서도 import 안 됨** | 대응 파일 없음 — 일 단위는 `iljin_analysis.ts#analyzeIljin`이 담당 |

둘 다 `src/lib/index.ts`에서 재노출되므로 새 기능을 짤 때 어느 쪽을 쓸지(순수 계산 vs 서술 포함) 먼저 확인할 것.

### `src/data` — 연도별 샤딩 + 근사/정밀 이중 함수 (핵심 함정)

절기(`solar_terms*.ts`)·음력변환표(`lunar_table*.ts`)가 생성 알고리즘(Jean Meeus)이나 연도 구간별로
여러 파일(1900-2019 / 2020-2030 / 2031-2100 / 2101-2200)로 쪼개져 있다. `unified_data_query.ts`가
구간을 가로지르는 조회 파사드다.

**같은 값을 구하는 함수가 근사판/정밀판으로 쌍을 이루는 경우가 많다** — 반드시 정밀판을 써야 한다:
- `getCurrentSolarTerm`(±1일 오차 고정 날짜표) vs `getCurrentSolarTermPrecise`/`getPreviousJieSolarTermByInstant`(실제 timestamp)

`saju.ts`가 근사 함수를 쓰다가 절입 당일 경계에서 월주가 틀리는 버그가 실제로 있었다(`saju.test.ts`의
"절입 경계 회귀 테스트" 참고). **절기·월건 관련 로직을 만지거나 리뷰할 때는 어느 쪽 함수를 쓰는지부터 확인할 것.**

지장간 세력은 `jijanggan_precise.ts#calculateJiJangGanSlot(branch)`(`saju.ts`가 실제 쓰는 함수)로
계산한다 — 지지 하나만으로 정해지는 **고정 일수비례 비율표**이고, 연·월·일·시지 4주 모두 같은
방식을 쓴다. 예전엔 이 파일이 저장소 어디서도 import되지 않는 죽은 코드였고, `saju.ts`는
`earthly_branches.ts#calculateJiJangGanStrength`(월지와의 거리만 보는 4구간 근사, 90/70/60/50/40
같은 임의 문지방값)를 4주 전부에 썼다. 절입으로부터의 경과일에 따라 특정 phase를 추가로 가중하는
"사령(司令) 가중" 방식도 한 차례 시도했으나, 대부분의 명리 실무는 지장간 세력을 절기(월지) 단위
고정 비율표로만 판단하고 개별 출생 시각으로 추가 가중하지 않는다는 판단에 따라 제외했다 — 이
함수는 이제 `birthDate`를 받지 않는 순수 함수다. 지금은:
- `data/earthly_branches.ts#calculateJiJangGanStrength`는 재배선 후 호출자가 없어져 **삭제했다.**
  같은 이름의 근사/정밀 이중 함수 함정을 다시 만들지 말 것 — 이 값을 구하는 곳은 이제
  `jijanggan_precise.ts` 하나뿐이다.
- `data/earthly_branches.ts#JI_JANG_GAN`은 이제 `data/jijanggan_strength_table.ts#JIJANGGAN_STRENGTH_DETAILED`에서
  파생된 값이다. 예전엔 손으로 채운 별개의 상수라 사(巳)의 중기/여기가 뒤바뀌어 있었고(정기 丙·중기
  庚·여기 戊가 맞는데 secondary: 무/residual: 경으로 반대) 자·묘·유의 여기(壬/甲/庚)가 통째로
  빠져 있었다 — 단일 출처로 합쳐 고쳤다.

### `src/tools/` — 예전 MCP 핸들러, 현재 미연결

`src/tools/index.ts`의 주석대로, 원래 MCP 서버 도구 핸들러였던 함수들을 Next.js Route Handler에서
재사용하기 위해 남긴 배럴 파일이다. 각 핸들러(`handleAnalyzeSaju` 등)는 `lib/`의 계산 함수를 조합할
뿐 MCP 프로토콜에 의존하지 않는다. **저장소 어디에도 MCP 설정이나 실행 진입점이 없고, `src/app/`에
route.ts도 없어 현재 아무 곳에서도 호출되지 않는다** — 죽은 코드가 아니라 향후 API 라우트를 위해
대기 중인 상태이니 삭제하지 말 것. `manage_settings.ts`는 예전에 있던 인메모리 싱글턴 설정을
동시 요청 간 상태 누수를 막기 위해 의도적으로 무상태로 바꿨다 — 호출자가 설정 객체를 매 요청 넘겨야 한다.

### 유파(학파)·용신 — 이중/부분 구현 주의

`types/interpretation.ts`의 5개 유파 코드(`ziping`/`dts`/`qtbj`/`modern`/`shensha`) 중 `ziping`·`modern`만
`src/lib/interpreters/`에 전용 파일이 있고 나머지 셋은 `interpreters/index.ts` 안에 `BaseSchoolInterpreter`의
인라인 서브클래스로 존재한다(대체로 템플릿 문자열). 세 인라인 해석기는 전달받은 사주를 쓰지 않고
`createSimpleSajuData`로 `wuxingCount` 균등분포·`dayMasterStrength` 고정값(`medium`/50점)인 **가짜 명식**을
만들어 넘긴다(`interpreters/index.ts:47-65, 101-119, 153-171`) — 단순 미연결이 아니라 구조적으로 못 쓰는
상태라, 나중에 살리려면 배선이 아니라 재작성이 필요하다. 화면에서는 사용하지 않는다(범위 제외).

별도로 `src/lib/yongsin/`(4개 알고리즘 레지스트리, `selector.ts`)과 `src/lib/yong_sin.ts`(레거시,
`YongSinAnalysis`, `saju.ts`가 실제로 쓰는 것)가 **경쟁하는 두 용신 구현**으로 공존하며 둘 다
`analyze_saju` 도구에서 접근 가능하다. 용신 로직을 고칠 땐 어느 쪽인지 먼저 확인할 것.

`yong_sin.ts#selectYongSin`은 궁통보감·자평명리·적천수 통설의 우선순위를 따른다: **전왕(종격) >
조후(한난조습 극단) > 억부(강약 명확) > 통관(중화)**. 종격 판정은 `gyeok_guk.ts#checkSpecialGyeokGuk`을,
조후는 `johu.ts#selectJohuYongSin`(궁통보감 조후용신표, `data/johu_table.ts`)을 재사용한다 — 세 번째
종격 구현이나 두 번째 조후 구현을 새로 만들지 말 것. `yongsin/seasonal_algorithm.ts`(4-알고리즘
레지스트리의 조후 알고리즘)도 같은 `johu.ts`를 쓰도록 배선돼 있다. 예전엔 중화(medium)일 때
"사주에서 가장 적은 오행"을 그냥 용신으로 골랐는데(`findWeakestElement`, 삭제됨) 명리학적 근거가
없었다 — 지금은 목극토처럼 팽팽히 상극하는 두 세력이 있으면 그 사이를 잇는 통관용신을, 없으면
조후용신으로 폴백한다.

`data/johu_table.ts`는 일간(10) × 월지(12) = 120칸 조후용신표(〈희용제요〉)를 담는다. 반드시 **천간
단위**로 저장한다 — 丙火(태양)와 丁火(등불)를 오행으로 뭉개면 조후 이론 자체가 무의미해진다. 칸마다
`verified` 플래그가 있다: 웹 검색으로 복수 출처가 실제로 일치함을 확인한 칸만 `true`이고, 나머지는
통설을 따르되 `false`로 남겨 `johu.ts`가 신뢰도(`confidence`)를 낮춘다 — 미확정 칸을 확정처럼
내보내지 않는다는 원칙은 `data/naming_hanja_table.ts`의 `strokesVerified`/`elementVerified`
플래그와 같은 원칙이다(아래 "작명" 절 참고). 새 칸을 채울 때 이 규칙을 유지할 것.

### 오행 분포·십이운성·십이신살 — 신규 계산 모듈 (결과 패널 벤치마크 보강)

`result-panel.tsx`의 "오행과 십성"·"신강신약"·대운/세운 십성·십이운성 표시를 위해 추가한 모듈들.

- `src/lib/element_distribution.ts` — 오행 오각형과 오른쪽 십성 상세 리스트가 **같은 분모**를
  쓰도록, 오행 카운트를 독자적으로 세지 않고 `ten_gods.ts#calculateTenGodsDistribution`의
  결과를 오행별로 묶어서 역산한다(`groupTenGodsByElement`). 오행 판정(발달/부족/적정)은
  `data/wuxing.ts#analyzeWuXingBalance`의 임계값(평균의 1.5배/0.5배)을 그대로 재사용 — 새 기준을
  만들지 않았다.
- `ten_gods.ts#calculateTenGodsDistribution`에 `{ includeDayMaster: true }` 옵션이 있다.
  **의미가 한 번 바뀌었다**: 예전엔 `stem !== dayStem` 가드가 "일간과 같은 천간이면 무조건 제외"까지
  겸해서, 연간이나 지장간 정기가 일간과 우연히 같은 천간이어도 통째로 걸러져
  `distribution.비견`이 구조적으로 항상 0이었다(비견의 정의 자체가 "같은 오행+같은 음양"=같은
  천간이라, 다른 자리의 동일 천간은 통근·비겁이지 "일간 자신"이 아니다). 지금은 그 버그를 고쳐
  다른 자리의 동일 천간은 옵션과 무관하게 항상 정상 집계되고, `includeDayMaster`는 순수하게
  "일주 천간 자신(1개)"을 비견에 더 얹을지만 결정한다. 오행 파이차트처럼 8글자(시간 미상이면
  6글자) 전체가 분모여야 하는 곳만 이 옵션을 켠다. 지장간 세력(`jijanggan_precise.ts#calculateJiJangGanSlot`)은
  지지 하나당 정기·중기·여기 합이 항상 정확히 100인 고정 비율표이므로, 지장간 4자리(각 1.0) +
  천간 4자리(각 1) = 총합이 정확히 8(시간 미상이면 6)로 떨어진다(`element_distribution.test.ts`/
  `ten_gods.test.ts` 참고).
- `day_master_strength.ts#analyzeDayMasterStrength`는 위 십성 분포 개수가 아니라, 8글자를 직접
  순회해 자리 가중치(월지 3.0 > 일지 2.0 > 시지/월간 1.5 > 년지/년간·시간 1.0)를 곱한 아군(비겁·
  인성)/적군(식상·재성·관성) 세력비로 재작성됐다. 득령(得令)·득지(得地)·득세(得勢) 3요소와
  통근(通根, 일간과 같은 오행의 천간을 지지에 두었는가) 플래그도 함께 반환한다
  (`{ deukRyeong, deukJi, deukSe, rootedAt }`). 합충(合沖)이 세력에 미치는 영향은 의도적으로
  반영하지 않는다 — 유파마다 결론이 갈려 단일 규칙으로 못 박으면 오히려 정확도가 떨어진다.
- 지지 관계의 성립표와 중립적 설명은 `lib/constants.ts`의 `BRANCH_RELATION_GUIDE` 및 관련
  그룹 상수가 단일 원본이다. `data/earthly_branches.ts#analyzeBranchRelations`는 이 표를
  이용해 실제 성립한 글자와 연·월·일·시의 자리를 반환할 뿐, 오행 개수·일간 강약·격국·용신에는
  영향을 주지 않는다. 시간 미상 명식은 표시용 시지를 이 판정에서도 반드시 제외한다.
- `src/lib/twelve_stages.ts` — 십이운성(장생~양). 음간의 순역에는 두 학파가 있는데, 이 저장소는
  벤치마크 서비스(점신) 화면을 역산해 검증한 "음간 역행" 학파를 따른다.
- `src/lib/twelve_sinsal.ts` — 십이신살(겁살~화개살). `sin_sal.ts`의 `SinSal`(천을귀인 등
  15종, 별개 체계)과 혼동하지 말 것. 기준 지지는 일지가 기본값(현대 명리 대세).
- 신강신약 게이지의 신약/중화/신강 3구간 경계값은 `day_master_strength.ts#STRENGTH_BAND_THRESHOLDS`
  하나가 유일한 출처다 — `analyzeDayMasterStrength`의 레벨 판정(medium>=40, strong>=65)과
  다른 값을 게이지에 하드코딩하면 라벨과 게이지가 서로 다른 말을 하게 된다.

### 격국(格局) — 세 번째 독립 구현이 하나 더 있다

화면(명식 탭)의 격국은 `gyeok_guk.ts#determineGyeokGuk`가 낸다. 종격(종왕격 등, `checkSpecialGyeokGuk`)이
아니면 **월지 지장간 투출법**(정기→중기→여기 순으로 연간·월간·시간 중 하나와 같은 게 있으면 그
지장간을, 없으면 무투용본기로 정기를 그대로 격의 기준으로 삼음, `determineMonthBranchTenGod`)으로
십성을 정하고 `mapTenGodToGyeokGuk`로 격국 이름에 매핑한다. **예전에는 월지를 전혀 안 보고
`sajuData.tenGodsDistribution`(사주 전체 십성 가중합) 최빈값을 그대로 썼다** — `GYEOK_GUK_INFO`의
각 설명("정관이 월지에 투출하여...")과 어긋나는 주석-구현 불일치 버그였다(수정 완료,
`gyeok_guk.test.ts` 참고). `src/lib/interpreters/ziping_interpreter.ts#determineGeokGuk`는 이 파일과
**전혀 무관한 세 번째 구현**으로, 일간조차 안 보고 월지 오행만으로 룩업한다(유파 해석 텍스트에만
쓰임, 화면 표시는 `gyeok_guk.ts` 결과) — 격국 로직을 고칠 땐 어느 파일인지 먼저 확인할 것.

`gyeok_guk.ts`는 격 **이름**만 정한다 — 그 격이 잘 짜였는지(성격/파격)는 `gyeok_guk_quality.ts#
analyzeGyeokGukQuality`가 별도로 판단한다(단일 책임 분리). 자평진전의 순용(順用, 재관인식은
생조해서 씀)/역용(逆用, 살상겁인은 극제해서 씀) 구분과, 격별 파격 조건·구신(救神)을 십성 분포
기준으로 판정해 `{ status, useType, sangSin, brokenBy, rescuedBy, explanation }`을 낸다. 종격
(`jong_wang`/`jong_sal`/`jong_jae`)과 중화격(`balanced`)은 순용/역용 구분 자체가 적용되지 않는
별개 체계라 `null`을 반환한다 — 이 두 파일을 합치지 말 것.

### 직업 추천 — 발달 오행(강점) + 용신(보완 방향) 블렌드, career_matcher.ts 실제 연결

`career_recommendation.ts#recommendCareer`의 오행별 적성 점수는 두 독립 신호의 평균이다:
`strengthScore`(그 오행이 명식에서 얼마나 발달했는지 — `element_distribution.ts`와 동일 소스라
오행과 십성 카드의 %·발달 배지와 항상 같은 숫자를 말한다)와 `yongsinScore`(용신과의 일치/생조/상극).
**예전에는 용신 점수만 썼고, 오행이 강할수록(발달할수록) 오히려 감점(-10)했다** — 실제로 그 오행이
발달해 잘 다루는 사람에게 "이 분야는 안 맞다"는 결과가 나오는 문제가 있었다.

카테고리별 구체적 직업 목록(`specificJobs`)은 **`career_matcher.ts#CareerMatcher`를 실제로
호출**해서 만든다. `modern_careers.ts`의 `CareerCategory`가 직업 추천·매칭 엔진의 단일
직군 체계이며, 현재 직업탭이 쓰는 14개 직군마다 대표 역할 4개와 역할 설명·필요 역량·업무 조건을
가진다. 오행 폴백(`ELEMENT_CAREERS[element].jobsByCategory[category]`)은 현대 직업 매칭 결과를
보완할 뿐이며, 카테고리 이름을 다시 변환하는 별도 매핑을 만들지 않는다.

`CareerMatcher.matchCareers`는 원래 내부에서 `yongsin/selector.ts#YongSinSelector`(4-알고리즘
레지스트리)로 용신을 **자체 재계산**했다 — 화면에 이미 표시 중인 용신(`saju.yongSin`, `saju.ts`가
실제로 쓰는 레거시 `yong_sin.ts#selectYongSin` 결과)과 다른 값이 나올 수 있는 "경쟁하는 두 용신
구현" 함정(바로 위 유파 절 참고)이 여기도 있었다. `CareerMatchOptions.yongSinOverride`를 추가해
`saju.yongSin`을 그대로 넘기도록 고쳤다 — 이 옵션 없이 `CareerMatcher`를 새로 호출하는 코드를
추가하면 똑같은 불일치가 재발한다.

직업 추천은 같은 직군이 여러 오행 근거에서 나오면 하나의 카드로 병합하고, 근거 배지·대표 역할·준비
역량·어울리는 업무 조건을 함께 낸다. 용신 상극은 “피해야 할 직업”이 아니라 장기적으로 부담이 될 수
있는 업무 조건으로만 안내한다.

### 캐싱

`performance_cache.ts`의 범용 `LRUCache`(TTL + 시간별 정리)를 `sajuCache`/`daeUnCache`/`yongSinCache`
(용신은 선언만 되고 미사용) 세 전역 인스턴스가 쓴다. 캐시 키는 `generateSajuCacheKey` 등이
입력 필드(날짜·시간·달력·윤달·성별·출생지 등)를 전부 직렬화해서 만드므로, `calculateSaju` 시그니처에
필드를 추가하면 캐시 키 생성 함수도 같이 고쳐야 한다. `api_cache.ts`는 예전 원격 음양력 변환 API용이었던
잔재로 현재 아무 곳에서도 import되지 않는다(변환은 이제 로컬 테이블만 사용).

### UI — 클라이언트 전용 렌더링

`src/app/page.tsx`는 `<SajuApp />` 하나뿐이고 API 라우트는 없다. `saju-app.tsx`(`"use client"`)가
`calculateSaju`/`calculateDaeUn`을 **브라우저에서 직접** 호출한다 — react-query가 설치돼 있지만
네트워크 호출 없이 로컬 계산만 한다. `view-model.ts`가 `SajuData`를 순수 프레젠테이션 VM으로 변환하고,
`constants.ts`(테마/색상)·`fonts.ts`(한글 명조/모노 폰트 변수)가 스타일 상수를 담당한다.

### 작명 — 발음오행은 한자 없이, 오격 성명학은 한자가 있어야 진짜다

`jakmeong_analysis.ts#analyzeName(fullName, saju, hanja?)`는 두 오행 체계를 글자 단위로 섞어
쓴다. 세 번째 인자 `hanja`가 `fullName`과 **길이가 같을 때만** 쓰고, 길이가 다르거나 없으면
전부 무시한다(부분 입력 없음 — 섞어 쓰면 오격 계산이 애매해진다). 각 글자는:
- 한자가 주어지고 `data/naming_hanja_table.ts`에 있으면 → **자원오행**(그 한자의 부수 기반
  전통 오행)과 **실제 획수**를 씀 (`elementSource: '자원'`)
- 없으면 → 초성(자음) 기준 **발음오행**으로 폴백 (`elementSource: '발음'`)

`strokeAnalysis`(오격: 천격/인격/지격/외격/총격)는 성(1글자)+이름 앞 두 글자, 총 세 글자
**모두**가 사전에 있어야 계산한다. 하나라도 없으면 가짜 숫자를 채우는 대신
`{ available: false, reason }`을 낸다 — 예전엔 한자 입력 경로 자체가 없어서 `getStrokeCount`가
한글 유니코드 코드포인트를 해싱한 임의값(3~30)을 냈고, 그래서 이 필드 전체를 화면에서
숨겼다(`reading-view-model.ts#buildNameAnalysisVM`). 지금은 조건부로 노출한다 — `overall`·
`pronunciation`은 여전히 숨긴다(`pronunciation.easyToWrite`가 아직 그 가짜 `getStrokeCount`를
쓰고 있어서, 다음 기회에 정리).

`data/naming_hanja_table.ts`는 **원획법(原劃法)** 기준 획수를 쓴다 — 옥편 필획과 다르다
(삼수변 氵는 물 수 水=4획, 심방변 忄은 마음 심 心=4획 등으로 계산, 예: 河는 필획 8이지만
원획 9). 阝(阜/邑)·辶(辵)·罒(网) 등 원획 보정이 더 복잡한 부수가 든 한자는 의도적으로
표에서 뺐다 — 어설프게 다뤄서 틀린 값을 내느니 "사전에 없음"으로 정직하게 빠지는 편이
낫다(성씨 鄭·陳, 이름 蓮·進 등이 이래서 없다. 복성 지지도 안 됨 — 첫 글자를 성으로 가정).
각 항목의 `strokesVerified`/`elementVerified`는 `data/johu_table.ts`와 같은 원칙(추측을
확정처럼 내보내지 않음) — 부수가 오행에 직접 대응하는 한자만 `elementVerified: true`.

`reading/myeongsik-tab.tsx#MyeongsikTab`의 한자 입력은 `saju-app.tsx`의 메인 폼(`BirthFormValues`)이
아니라 이 탭 안의 로컬 `useState`로 관리한다 — 한자는 명식 계산에 안 쓰는 부가 정보라
`sajuCache`의 캐시 키에 영향을 주면 안 된다.

### 도메인 값은 한글 리터럴

`types/index.ts`의 천간·지지·오행·음양은 로마자화 없이 한글 문자열 리터럴(`'경'`, `'오'`, `'목'`,
`'음'|'양'`)로 표현된다. 비교·매핑 시 이 점을 그대로 따를 것.

## 테스트 관례

테스트는 소스 파일과 같은 디렉토리에 콜로케이션(`src/lib/saju.test.ts`), `__tests__` 디렉토리를
쓰지 않는다. `describe`/`it` 제목에 산식 근거나 회귀 사유를 길게 적는 관례가 있다(예: "근사 절기표로는
갑진이 되는 회귀 케이스") — 버그 재발 방지 목적이 분명한 서술형 테스트명을 유지할 것.
