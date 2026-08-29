import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest.config.ts가 globals: false라 @testing-library/react의 자동 정리(afterEach 훅
// 자동 등록)가 감지되지 않는다 — 명시적으로 등록하지 않으면 컴포넌트 테스트마다 이전
// render()의 DOM이 남아 다음 테스트에서 "여러 개 찾음" 오류가 난다.
afterEach(cleanup);
