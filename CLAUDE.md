# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `earthly_branches.ts#calculateJiJangGanStrength`(절기 인덱스 4구간 근사, `saju.ts`가 실제 쓰는 함수)
  vs `jijanggan_precise.ts#calculateJiJangGanStrengthPrecise`(절기 시작일로부터 경과 일수 기반 정밀
  계산) — **후자는 저장소 어디서도 import되지 않는 죽은 코드다.** `saju.ts:146-151`은 항상 전자를
  쓴다. 이 파일 이름만 보고 "정밀판이 이미 연결돼 있겠지"라고 넘겨짚지 말 것 — 더 정확한 계산이
  필요하면 `jijanggan_precise.ts`를 실제로 배선하는 작업이 별도로 필요하다.

`saju.ts`가 근사 함수를 쓰다가 절입 당일 경계에서 월주가 틀리는 버그가 실제로 있었다(`saju.test.ts`의
"절입 경계 회귀 테스트" 참고). **절기·월건 관련 로직을 만지거나 리뷰할 때는 어느 쪽 함수를 쓰는지부터 확인할 것.**

`earthly_branches.ts#calculateJiJangGanStrength`에는 별개로 **월 인덱스 기준 불일치 버그**가 있었다
(수정 완료) — 파라미터 `monthIndex`는 `saju.ts#getPreciseSolarTermMonthIndex`가 주는 "인(寅)월=0"
기준인데, 함수 내부에서 `EARTHLY_BRANCHES`의 "자(子)=0" 기준 인덱스와 보정 없이 직접 뺐다. 2칸
어긋나 있어서 당령(當令, 지금 이 달의 지지)인데도 "먼 시기"로 계산돼 지장간 세력이 과소 계상됐다
— `saju.ts:240`의 `(monthIndex + 2) % 12` 보정을 그대로 적용해서 고쳤다. 이 함수를 다시 만질 때는
두 인덱스 기준이 다르다는 것부터 기억할 것.

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
인라인 서브클래스로 존재한다(대체로 템플릿 문자열). 별도로 `src/lib/yongsin/`(4개 알고리즘 레지스트리,
`selector.ts`)과 `src/lib/yong_sin.ts`(레거시, `YongSinAnalysis`)가 **경쟁하는 두 용신 구현**으로 공존하며
둘 다 `analyze_saju` 도구에서 접근 가능하다. 용신 로직을 고칠 땐 어느 쪽인지 먼저 확인할 것.

### 오행 분포·십이운성·십이신살 — 신규 계산 모듈 (결과 패널 벤치마크 보강)

`result-panel.tsx`의 "오행과 십성"·"신강신약"·대운/세운 십성·십이운성 표시를 위해 추가한 모듈들.

- `src/lib/element_distribution.ts` — 오행 오각형과 오른쪽 십성 상세 리스트가 **같은 분모**를
  쓰도록, 오행 카운트를 독자적으로 세지 않고 `ten_gods.ts#calculateTenGodsDistribution`의
  결과를 오행별로 묶어서 역산한다(`groupTenGodsByElement`). 오행 판정(발달/부족/적정)은
  `data/wuxing.ts#analyzeWuXingBalance`의 임계값(평균의 1.5배/0.5배)을 그대로 재사용 — 새 기준을
  만들지 않았다.
- `ten_gods.ts#calculateTenGodsDistribution`에 `{ includeDayMaster: true }` 옵션이 추가됐다.
  **기본값은 여전히 일간 자신과 일간과 같은 천간을 분포에서 제외**한다(기존 호출부 무변경) —
  오행 파이차트처럼 8글자(시간 미상이면 6글자) 전체가 분모여야 하는 곳만 이 옵션을 켠다.
  지장간 세력(`calculateJiJangGanStrength`)이 절기 근접도에 따라 40~100 사이로 변하므로,
  `includeDayMaster: true`를 켜도 총합이 정확히 8/6으로 떨어지지는 않는다 — 정확한 합계를
  검증하려면 지장간 세력이 100으로 딱 떨어지는 통제된 합성 명식이 필요하다
  (`element_distribution.test.ts`/`ten_gods.test.ts` 참고).
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

### 직업 추천 — 발달 오행(강점) + 용신(보완 방향) 블렌드, career_matcher.ts 실제 연결

`career_recommendation.ts#recommendCareer`의 오행별 적성 점수는 두 독립 신호의 평균이다:
`strengthScore`(그 오행이 명식에서 얼마나 발달했는지 — `element_distribution.ts`와 동일 소스라
오행과 십성 카드의 %·발달 배지와 항상 같은 숫자를 말한다)와 `yongsinScore`(용신과의 일치/생조/상극).
**예전에는 용신 점수만 썼고, 오행이 강할수록(발달할수록) 오히려 감점(-10)했다** — 실제로 그 오행이
발달해 잘 다루는 사람에게 "이 분야는 안 맞다"는 결과가 나오는 문제가 있었다.

카테고리별 구체적 직업 목록(`specificJobs`)은 이제 **`career_matcher.ts#CareerMatcher`를 실제로
호출**해서 만든다(예전엔 이 파일 전체가 저장소 어디서도 import되지 않는 죽은 코드였다). 카테고리별
직업은 `ELEMENT_CAREERS[element].jobsByCategory[category]`(오행 자체 데이터, 카테고리를 키로
명시적으로 매핑 — **예전엔 `jobs: string[]` 평평한 배열을 categories 개수로 기계적으로 등분해서
배정하다가 5개 오행 전부에서 어긋나 있었다**, 예: 화 오행의 "예술/문화"에 "프로그래머"가 들어가던
회귀)과, `career_matcher.ts`가 `modern_careers.ts#MODERN_CAREERS_DB`(십성·오행 태그가 붙은 개별
직업 500+ 라는 주석과 달리 **실제로는 IT/기술·금융/경제 두 카테고리, 21개뿐**)에서 점수 매긴 결과를
합쳐서 만든다 — 카테고리 이름이 두 파일에서 서로 달라(`career_recommendation.ts`의
"금융/재무" vs `modern_careers.ts`의 "금융/경제" 등) `MODERN_CATEGORY_MAP`으로 연결한다.

`CareerMatcher.matchCareers`는 원래 내부에서 `yongsin/selector.ts#YongSinSelector`(4-알고리즘
레지스트리)로 용신을 **자체 재계산**했다 — 화면에 이미 표시 중인 용신(`saju.yongSin`, `saju.ts`가
실제로 쓰는 레거시 `yong_sin.ts#selectYongSin` 결과)과 다른 값이 나올 수 있는 "경쟁하는 두 용신
구현" 함정(바로 위 유파 절 참고)이 여기도 있었다. `CareerMatchOptions.yongSinOverride`를 추가해
`saju.yongSin`을 그대로 넘기도록 고쳤다 — 이 옵션 없이 `CareerMatcher`를 새로 호출하는 코드를
추가하면 똑같은 불일치가 재발한다.

`src/data/modern_careers.ts#CAREER_BY_ELEMENT`/`CAREER_BY_TEN_GOD`는 위 흐름과 무관한
**여전히 죽은 코드**다(정의부만 있고 어디서도 안 쓰임) — `MODERN_CAREERS_DB`(위 흐름에서 실제로
쓰임)와 혼동하지 말 것.

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

### 도메인 값은 한글 리터럴

`types/index.ts`의 천간·지지·오행·음양은 로마자화 없이 한글 문자열 리터럴(`'경'`, `'오'`, `'목'`,
`'음'|'양'`)로 표현된다. 비교·매핑 시 이 점을 그대로 따를 것.

## 테스트 관례

테스트는 소스 파일과 같은 디렉토리에 콜로케이션(`src/lib/saju.test.ts`), `__tests__` 디렉토리를
쓰지 않는다. `describe`/`it` 제목에 산식 근거나 회귀 사유를 길게 적는 관례가 있다(예: "근사 절기표로는
갑진이 되는 회귀 케이스") — 버그 재발 방지 목적이 분명한 서술형 테스트명을 유지할 것.
