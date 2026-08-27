# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

패키지 매니저는 **pnpm**(`pnpm-lock.yaml`, `pnpm-workspace.yaml` 존재 — npm/yarn 대신 사용).

```bash
pnpm dev                              # next dev --turbopack
pnpm build
pnpm lint                             # eslint
pnpm typecheck                        # next typegen && tsc --noEmit (타입 라우트 생성 후 체크 — 순서 중요)
pnpm test                             # vitest run (전체)
pnpm test:watch                       # vitest (watch)
pnpm vitest run src/lib/saju.test.ts  # 단일 파일
pnpm vitest run -t "절입"              # 이름 패턴 필터 (describe/it 제목 매칭)
```

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
- `earthly_branches.ts#calculateJiJangGanStrength`(정적 테이블) vs `jijanggan_precise.ts#calculateJiJangGanStrengthPrecise`(절기 기반)

`saju.ts`가 근사 함수를 쓰다가 절입 당일 경계에서 월주가 틀리는 버그가 실제로 있었다(`saju.test.ts`의
"절입 경계 회귀 테스트" 참고). **절기·월건 관련 로직을 만지거나 리뷰할 때는 어느 쪽 함수를 쓰는지부터 확인할 것.**

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
