import { describe, it, expect } from 'vitest';
import {
  importantAreas,
  CACHE_TTL,
  isPeakHour,
  getCacheExpiry,
} from './cachePolicy';

describe('isPeakHour', () => {
  it('출퇴근 시간대(7~10시, 17~20시)를 피크로 판정한다', () => {
    expect(isPeakHour(8)).toBe(true);
    expect(isPeakHour(18)).toBe(true);
    expect(isPeakHour(7)).toBe(true);
    expect(isPeakHour(20)).toBe(true);
  });

  it('그 외 시간대는 비피크로 판정한다', () => {
    expect(isPeakHour(6)).toBe(false);
    expect(isPeakHour(11)).toBe(false);
    expect(isPeakHour(14)).toBe(false);
    expect(isPeakHour(21)).toBe(false);
  });
});

describe('getCacheExpiry', () => {
  const importantArea = importantAreas[0]; // 강남 MICE 관광특구
  const normalArea = '존재하지않는일반지역';

  it('피크 + 주요 지역 → 15분', () => {
    expect(getCacheExpiry(importantArea, 8)).toBe(CACHE_TTL.peakImportant);
    expect(CACHE_TTL.peakImportant).toBe(15 * 60 * 1000);
  });

  it('피크 + 일반 지역 → 30분', () => {
    expect(getCacheExpiry(normalArea, 8)).toBe(CACHE_TTL.peakNormal);
    expect(CACHE_TTL.peakNormal).toBe(30 * 60 * 1000);
  });

  it('비피크 + 주요 지역 → 1시간', () => {
    expect(getCacheExpiry(importantArea, 14)).toBe(CACHE_TTL.offPeakImportant);
    expect(CACHE_TTL.offPeakImportant).toBe(60 * 60 * 1000);
  });

  it('비피크 + 일반 지역 → 3시간', () => {
    expect(getCacheExpiry(normalArea, 14)).toBe(CACHE_TTL.offPeakNormal);
    expect(CACHE_TTL.offPeakNormal).toBe(3 * 60 * 60 * 1000);
  });

  it('주요 지역은 항상 일반 지역보다 만료 시간이 짧다(데이터가 더 자주 변하므로)', () => {
    expect(getCacheExpiry(importantArea, 8)).toBeLessThan(getCacheExpiry(normalArea, 8));
    expect(getCacheExpiry(importantArea, 14)).toBeLessThan(getCacheExpiry(normalArea, 14));
  });
});

describe('importantAreas', () => {
  it('사전 수집 대상 주요 지역은 15곳이다', () => {
    expect(importantAreas).toHaveLength(15);
  });

  it('중복이 없다', () => {
    expect(new Set(importantAreas).size).toBe(importantAreas.length);
  });
});
