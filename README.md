# 운명일지 (un-myeong-il-ji)

생년월일시로 사주 명식을 계산하고, 대운·세운·월운·일진까지 서술하는 웹 앱입니다.

**배포:** https://un-myeong-il-ji.vercel.app

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Vitest · motion · Radix UI

<!--
  TODO: 데스크톱/모바일 스크린샷(또는 짧은 GIF)을 docs/screenshots/ 에 추가하고
  아래에 ![결과 화면](docs/screenshots/result.png) 형태로 삽입할 것.
  motion 등장 연출이 들어간 화면이라 정지 이미지보다 짧은 GIF가 더 잘 어울릴 수 있음.
-->

---

## 왜 만들었나

"사주 볼 때마다 다른 말을 듣는다"는 불만은 사실 기술 문제다 — **같은 입력에 같은 결과가
나오는가**. 이 프로젝트에서 실제로 가장 많이 고친 문제가 바로 이것이었다. 대운·세운·월운
세부 점수가 `Math.random()`으로 매 조회마다 달라지던 버그, 절기 경계일에 월주가 틀리던
버그, 지장간 세력이 구조적으로 과소 계상되던 버그 — 전부 "같은 생년월일시를 다시 넣었는데
다른 명식이 나온다"는 한 가지 신뢰성 문제의 변주였다. 아래 [문제 해결 사례](#문제-해결-사례)에
구체적인 증상과 해결을 정리했다.

---

## 기술 스택

| 영역 | 선택 | 선택 이유 |
|---|---|---|
| 프레임워크 | Next.js 16 App Router, React 19 (React Compiler on) | `next.config.ts`의 `reactCompiler: true` |
| 계산 | 순수 TypeScript, 외부 API 호출 0회 | 만세력·절기 테이블을 로컬에 내장 — 네트워크·요금·가용성 의존을 없앰 |
| 스타일 | Tailwind CSS v4, CSS-first (`globals.css`의 `@theme inline`) | 별도 `tailwind.config` 파일 없음 |
| 인터랙션 | motion, Radix UI (`Tabs`/`ToggleGroup`/`Toggle`/`Tooltip`/`Collapsible`) | 상태·접근성(키보드 내비게이션, `aria-*`)은 Radix에, 등장·전환 연출은 motion에 위임 |
| 테스트 | Vitest + jsdom | 계산 엔진과 뷰모델(순수 함수) 대상, 26개 파일 300개 테스트 |
| 날짜 계산 | date-fns / date-fns-tz v3 | 출생지 경도 기반 진태양시(眞太陽時) 보정 전용, `lib`/`utils` 레이어에만 스코프 |

`recharts`·`react-hook-form`·`zustand`도 `package.json`에 있지만 현재 화면 로직에서는 쓰지
않는다(`zustand`는 모바일 내비게이션 상태 하나만 담당하는 11줄짜리 스토어). 실제로 화면에
쓰이는 것만 표에 남겼다.

---

## 주요 기능

**입력** — 이름 / 출생지(경도 자동완성, 진태양시 보정에 사용) / 양력·음력(윤달 포함) / 성별 /
시·분을 비우면 "시간 미상"으로 시주 없는 삼주(三柱)로 계산.

**명식 화면(상단 고정)** — 사주팔자 4기둥(천간·지지·십성·지장간), 오행 분포, 신강신약 게이지,
용신, 신살, 대운 띠(클릭하면 아래 세운이 그 10년으로 전환), 십이운성·십이신살.

**풀이 탭(6개)**
- **명식** — 격국과 성패(成敗) 판정, 지장간 세력, 지지 관계(삼합·삼형·육해), 이름 오행(발음오행
  기본, 한자 입력 시 자원오행 + 실제 획수 성명학 오격)
- **인생** — 총평·직업·재물·건강·애정 5종 운세 + 두드러진 십성 기반 성격 서술
- **흐름** — 대운 → 세운 → 월운으로 이어지는 드릴다운, 결혼·이직·창업 등 10종 시기 조언
- **직업** — 오행별 적성 점수, 추천/회피 직업, 경력 단계별 조언
- **오늘** — 일진, 건제십이신, 12시진별 추천 활동
- **방위** — 풍수 방위·공간별 인테리어 조언

**궁합** — 상대방 생년월일시를 입력해 종합 궁합 점수와 오행 조화를 계산(본인 입력 폼과 검증
로직을 공유).

**인터랙션** — 결과 화면 진입 시 명식 카드 → 오행 → 대운/세운이 순차적으로 떠오르는 등장
연출, 대운 선택 표시의 슬라이드 전환, 탭·토글의 키보드 내비게이션, OS의 "동작 줄이기"
설정을 자동으로 존중.

---

## 아키텍처

```mermaid
flowchart LR
    A["BirthForm 입력"] --> B["calculateSaju()"]
    B --> C["SajuData"]
    C --> D["dae_un / se_un / wol_un\n(간지 계산)"]
    D --> E["*_analysis.ts\n(서술 생성)"]
    E --> F["view-model.ts /\nreading-view-model.ts"]
    F --> G["ResultPanel / ReadingPanel"]
```

- **단일 진입점** — `src/lib/saju.ts#calculateSaju`가 음력→양력 변환, 출생지 경도 기반
  진태양시 보정, 사주팔자 계산을 거쳐 십성·신살·신강신약·격국·용신 분석까지 **이미 조합해서**
  `SajuData`를 반환한다. 대운·세운·월운 등 후속 분석은 전부 이 `SajuData` 하나를 입력으로 받는
  후속 단계다.
- **계산과 서술의 분리** — 같은 대상(예: 대운)을 다루는 파일이 두 벌이다. `src/lib/dae_un.ts`는 순수
  간지 계산만, `src/lib/daeun_analysis.ts`는 그 결과를 문장으로 만드는 서술만 책임진다. 세운·월운도
  동일한 패턴을 따른다.
- **ViewModel 패턴** — `SajuData`를 화면 컴포넌트가 그대로 쓰지 않고, `src/components/saju/view-model.ts`/
  `src/components/saju/reading-view-model.ts`가 순수 프레젠테이션 객체로 한 번 더 변환한다. 컴포넌트에 계산 로직이
  없어 뷰모델 단위로 테스트할 수 있다(`src/components/saju/view-model.test.ts` 등 4개 파일).
- **캐싱** — `src/lib/performance_cache.ts`의 범용 LRU(TTL 포함, 1000건/60분)를 계산 결과 캐시에 쓴다.
  캐시 키는 입력 필드 전부를 직렬화해서 만든다.
- **서버 호출 0회** — API 라우트가 없다. 사주 계산이 전부 브라우저에서 실행되므로 생년월일시가
  서버로 전송되지 않는다(개인정보 최소화 관점의 설계 선택).
- **데이터 샤딩** — 절기표를 생성 알고리즘과 연도 구간(1900–2019 / 2020–2030 / 2031–2100 /
  2101–2200)에 따라 여러 파일로 쪼개고, `src/lib/unified_data_query.ts`가 구간을 가로지르는 조회
  파사드 역할을 한다.

---

## 기여 범위 (Fork & 개선)

`src/lib`, `src/data`, `src/types`, `src/utils`는
[hjsh200219/fortuneteller](https://github.com/hjsh200219/fortuneteller)(MIT 라이선스)에서
출발했다 — 자세한 조건은 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 명시했다.

그 위에서 직접 작업한 범위(스캐폴드 커밋 이후 git 통계):

- 계산 레이어(`src/lib`, `src/data`, `src/types`) — **+4,562 / −841줄**. 버그 수정, 정밀도
  개선, 신규 모듈 추가
- UI·뷰모델(`src/components`, `src/app`) — **+4,758 / −1,438줄**, 전량 신규 작성
- 테스트 26개 파일 전부 신규 작성(upstream에는 테스트가 없었음)
- 신규 계산 모듈: `src/lib/element_distribution.ts`, `src/lib/twelve_stages.ts`(십이운성), `src/lib/twelve_sinsal.ts`
  (십이신살), `src/lib/gyeok_guk_quality.ts`(격국 성패 판정), `src/lib/johu.ts` + `src/data/johu_table.ts`(120칸
  조후용신표), `src/data/naming_hanja_table.ts`(원획법 성명학 한자 사전), `src/lib/korean.ts`(한글 조사
  처리)

남이 쓴 3만 줄 규모의 도메인 코드를 읽고, 테스트로 검증하고, 버그를 찾아 고치는 작업이었다 —
이건 약점이 아니라 실무에서 매일 하는 일 그 자체라고 생각한다.

---

## 문제 해결 사례

각 항목을 증상 → 원인 → 해결 → 검증 순서로 정리했다. 코드 경로는 전부 실제 파일을 가리킨다.

### 같은 사주인데 조회할 때마다 점수가 바뀜

- **원인**: `src/lib/daeun_analysis.ts`·`src/lib/seyun_analysis.ts`·`src/lib/wolun_analysis.ts`·`src/lib/fortune.ts`의 세부
  점수가 `Math.random()`을 직접 썼다(`70 + Math.random() * 20` 형태).
- **해결**: `src/lib/ten_gods.ts#getTenGodDomainDelta`(해당 기간 천간의 십성-육친 대응)로 방향과
  크기를 결정론적으로 유도하도록 교체.
- **부수 발견**: `src/lib/daeun_analysis.ts#calculateDaeunList`가 대운 순역(順逆)을 연간 음양 없이
  성별만으로 판정하고 있었다 — 음남·양녀 명식에서 `src/lib/dae_un.ts#calculateDaeUn`과 다른 간지가
  나오는 버그였다. 중복 구현을 없애고 `calculateDaeUn`에 위임했다.

### 절입(節入) 당일 경계에서 월주가 틀림

절기는 매년 시각이 달라지는데(입춘이 어느 해는 2/3일, 어느 해는 2/5일), 근사 절기표는 ±1일
오차를 고정으로 갖고 있었다.

- **해결**: 실제 timestamp 기반의 `getCurrentSolarTermPrecise` /
  `getPreviousJieSolarTermByInstant`로 교체.
- **검증** (`src/lib/saju.test.ts`의 실제 테스트 제목):
  > `'월주는 을사(乙巳) — 근사 절기표로는 갑진(甲辰)이 되는 회귀 케이스'`
  > `'입춘 이전(경도 보정 후 22:28)은 전년도 신미(辛未)년'`

<details>
<summary>출생지 경도(진태양시) 보정 미연결</summary>

한국 표준시는 동경 135° 기준이라, 서울(−32분)과 부산(−24분)은 같은 시각에 태어나도 실제
"태양이 남중하는 시각" 기준으로는 시주가 달라질 수 있다. 이 보정이 연결되지 않았던 시절에는
지방을 어디로 입력하든 서울과 같은 시주가 나왔다.

검증(`src/lib/saju.test.ts`):
> `'서울(−32분): 17:30 → 16:58 → 병신(丙申)'`
> `'부산(−24분): 같은 17:30 → 17:06 → 정유(丁酉) — 출생지 미연결 시 서울과 같은 丙申이 나오던 회귀 케이스'`
</details>

<details>
<summary>지장간 세력이 구조적으로 과소 계상</summary>

`src/data/earthly_branches.ts#calculateJiJangGanStrength`의 `monthIndex` 파라미터는 "인(寅)월=0" 기준을
쓰는데, 함수 내부에서는 `EARTHLY_BRANCHES`의 "자(子)=0" 기준 인덱스와 보정 없이 그대로 뺐다.
2칸이 어긋나 있어서, 당령(當令 — 지금 이 계절의 지지)인데도 계산상 "먼 시기"로 취급되어 지장간
세력이 실제보다 낮게 나왔다. `src/lib/saju.ts`에 이미 있던 `(monthIndex + 2) % 12` 보정을 그대로
적용해서 고쳤다.
</details>

<details>
<summary>십성 분포의 "비견"이 항상 0으로 나옴</summary>

`stem !== dayStem` 가드가 "일간 자신은 제외"를 넘어 "일간과 같은 천간이면 무조건 제외"까지
겸하고 있었다. 비견의 정의 자체가 "일간과 같은 오행·같은 음양"인데, 연간이나 지장간 정기가
일간과 우연히 같은 천간이어도(= 통근·비겁) 전부 걸러져서 `distribution.비견`이 구조적으로
항상 0이었다. 지금은 다른 자리의 동일 천간은 옵션과 무관하게 항상 정상 집계되고,
`includeDayMaster` 옵션은 순수하게 "일주 천간 자신 1개"를 비견에 더 얹을지만 결정한다.
검증: `src/lib/ten_gods.test.ts`, `src/lib/element_distribution.test.ts`.
</details>

<details>
<summary>미검증 데이터를 확정처럼 내보내지 않기 (설계 원칙)</summary>

`src/data/johu_table.ts`(일간×월지 120칸 조후용신표)와 `src/data/naming_hanja_table.ts`(원획법 한자
사전)는 칸마다 `verified`/`strokesVerified`/`elementVerified` 플래그를 갖는다. 웹 검색으로
복수 출처가 실제로 일치함을 확인한 항목만 `true`이고, 나머지는 통설을 따르되 신뢰도를 낮춰
노출한다. 오격(五格) 성명학도 성+이름 세 글자가 **모두** 사전에 있을 때만 계산하고, 하나라도
없으면 가짜 숫자를 채우는 대신 `{ available: false, reason }`을 반환한다.
</details>

### 주석과 구현이 어긋난 격국 판정

`GYEOK_GUK_INFO`의 설명은 "정관이 월지에 투출하여…"인데, 실제 구현은 월지를 전혀 보지 않고
사주 전체 십성 가중합의 최빈값을 그대로 격으로 삼고 있었다.

- **해결**: 월지 지장간 투출법(정기→중기→여기 순으로 연간·월간·시간과 겹치는 것을 찾음)으로
  재작성했다. 격의 **이름**을 정하는 `src/lib/gyeok_guk.ts`와, 그 격이 잘 짜였는지(성격/파격) 판단하는
  `src/lib/gyeok_guk_quality.ts`를 단일 책임으로 분리했다.
- **검증**: `src/lib/gyeok_guk.test.ts`, `src/lib/gyeok_guk_quality.test.ts`

### 직업 추천이 강점을 감점하고 있었음

오행이 발달할수록 용신 점수에서 −10점을 감점하는 로직이 있었다 — 실제로 그 오행을 잘 다루는
사람에게 "이 분야는 안 맞다"는 결과가 나오는 문제였다.

- **해결**: `strengthScore`(발달도)와 `yongsinScore`(용신 부합도)의 블렌드로 교체하고, 저장소
  어디서도 import되지 않던 `src/lib/career_matcher.ts`를 실제로 배선했다.
- **함께 해결한 일관성 문제**: `CareerMatcher`가 화면에 이미 표시 중인 용신과 **다른 용신 구현**
  으로 내부에서 재계산하고 있었다. `yongSinOverride` 옵션을 추가해 화면과 항상 같은 용신을
  쓰도록 강제했다.

### 모바일에서 사주 명식 카드 행 정렬이 무너짐

좁은 화면에서 각 기둥(時/日/月/年)이 독립된 flex 컬럼이라, 십성 라벨 줄바꿈 여부에 따라
열마다 카드 높이가 제각각이 되어 지지 카드와 지장간 텍스트가 계단처럼 어긋났다(일주 십성
`"나"` 1글자 vs 다른 기둥의 `"편관"` 2글자처럼 줄 수가 달랐던 것이 원인).

- **해결**: 카드 패딩을 반응형화하고 메타 줄을 모바일에서 세로 스택으로 고정해 줄 수를 통일한
  뒤, CSS **subgrid**(`grid-rows-subgrid`)로 헤더·천간·지지·지장간 4행을 열을 가로질러
  정렬되게 만들었다. `min-height` 하드코딩 없이 구조로 정렬을 보장해서, 나중에 라벨 길이가
  바뀌어도 재발하지 않는다.

<details>
<summary>애니메이션이 CSS 키프레임과 하드코딩된 초 단위 delay로 암묵적으로만 맞춰져 있었음</summary>

명식 카드 등장 순서는 뷰모델이 계산한 ms 값(`slotDelay`/`delayA`/`delayB`)으로, 뒤이은
섹션들의 등장 시점은 컴포넌트 곳곳에 박힌 `1.1s`/`1.2s`/`1.3s`/`1.35s` 하드코딩으로 각각
따로 관리되고 있었다 — 한쪽 공식을 고치면 다른 쪽을 손으로 재조정해야 하는 구조였다.
motion의 `staggerChildren`으로 통합해 순서를 배열 인덱스에서 자동 계산하게 했고, 그 김에
사용처가 0건이던 `drawRing`/`.ringShape` 키프레임도 정리했다. 부수 효과로
`MotionConfig reducedMotion="user"` 한 줄을 추가해 OS의 "동작 줄이기" 설정을 앱 전체
애니메이션이 존중하게 됐다(기존에는 대응이 전혀 없었다).
</details>

---

## 테스트

**26개 파일, 300개 테스트** — `pnpm test`로 확인 가능. 계산 엔진(`src/lib`)과 순수 함수
뷰모델을 콜로케이션 방식으로 테스트한다(`src/lib/saju.test.ts`처럼 소스 옆에 배치,
`__tests__` 디렉터리는 쓰지 않음).

버그 재발을 막기 위해, 회귀 사유를 테스트 제목에 그대로 남기는 관례가 있다:

> `'월주는 을사(乙巳) — 근사 절기표로는 갑진(甲辰)이 되는 회귀 케이스'`
> `'부산(−24분): 같은 17:30 → 17:06 → 정유(丁酉) — 출생지 미연결 시 서울과 같은 丙申이 나오던 회귀 케이스'`

**한계**: 컴포넌트 렌더 테스트는 아직 없다(`@testing-library/react`는 설치만 되어 있고
미사용). 계산 정확성 검증에 우선순위를 두었고, 렌더 테스트는 다음 과제로 남겨뒀다.

---

## AI 협업 워크플로우

`CLAUDE.md`(약 20KB)에 이 저장소에서 반복적으로 빠지기 쉬운 함정을 문서화해서 AI 에이전트와
협업했다 — 근사판/정밀판 함수가 쌍으로 존재하는 지점, 서로 경쟁하는 두 용신 구현, 세 개의
독립된 격국 구현, "죽은 코드"와 "아직 배선되지 않았을 뿐인 코드"의 구분 등이다.

AI에게 코드를 통째로 맡긴 게 아니라, AI(그리고 나 자신)가 반복해서 걸려 넘어지던 함정을
문서로 고정해 재발을 막는 방식으로 활용했다. 이 문서 자체도 세션마다 갱신했다
(`docs: CLAUDE.md 아키텍처 문서 갱신` 커밋들).

---

## 실행 방법

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # Vitest
pnpm typecheck  # next typegen && tsc --noEmit
pnpm lint
```

Node 20 이상, pnpm 10 이상을 가정한다. **환경 변수나 외부 API 키가 하나도 필요 없다** — 만세력·
절기 데이터가 전부 로컬 테이블이라 네트워크 호출 없이 바로 실행된다.

---

## 한계와 다음 과제

- 컴포넌트 렌더/E2E 테스트 부재 — motion·Radix 배선 이후에도 여전히 계산·뷰모델 레이어만
  테스트로 커버된다.
- `src/components/saju/reading-panel.tsx`가 1,000줄을 넘는다 — 이번에 Radix `Tabs`로 구조는 정리했지만 탭별 파일
  분리는 하지 않았다.
- `src/tools/`는 예전 MCP 도구 핸들러를 Next.js Route Handler에서 재사용하기 위해 남긴
  코드로, 아직 API 라우트가 없어 호출되지 않는다(삭제 대상 아님, 배선 대기 상태).
- `src/lib/jijanggan_precise.ts`(절기 시작일로부터 경과 일수 기반의 정밀 지장간 계산)가 미배선 —
  현재는 근사판(4구간)을 쓴다. 더 높은 정밀도가 필요할 때의 다음 단계.
- 유파(학파)별 해석기 3종(`src/lib/interpreters/index.ts`)이 실제 사주 대신 가짜 합성 명식을 써서
  구조적으로 재작성이 필요하다. 화면에서는 사용하지 않는 코드라 우선순위가 낮다.

---

## 라이선스

`src/lib`, `src/data`, `src/types`, `src/utils`의 출처와 라이선스 조건은
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)를 참고하세요.
