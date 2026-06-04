// 캐시 만료 정책 — 단일 출처(Single Source of Truth)
// 스토어(populationStore.js)와 벤치마크(scripts/cache-benchmark.js)가 동일한 정책을 공유한다.
// 순수 함수로만 구성하여 라이브 API/localStorage 없이도 테스트·시뮬레이션이 가능하다.

// 추천용으로 사전 수집하는 주요 지역 (데이터가 자주 변해 짧은 TTL 적용)
export const importantAreas = [
  '강남 MICE 관광특구', '명동 관광특구', '홍대 관광특구',
  '동대문 관광특구', '이태원 관광특구', '잠실 관광특구',
  '광화문·덕수궁', '경복궁', '서울역', '강남역', '홍대입구역(2호선)',
  '가로수길', '성수카페거리', '여의도한강공원', '북촌한옥마을',
];

// 동적 캐시 만료 시간 (밀리초)
export const CACHE_TTL = {
  peakImportant: 15 * 60 * 1000, // 피크 + 주요 지역: 15분
  peakNormal: 30 * 60 * 1000, // 피크 + 일반 지역: 30분
  offPeakImportant: 60 * 60 * 1000, // 비피크 + 주요 지역: 1시간
  offPeakNormal: 3 * 60 * 60 * 1000, // 비피크 + 일반 지역: 3시간
};

// 출퇴근 피크 시간대 (데이터가 더 자주 변함): 7~10시, 17~20시
export function isPeakHour(hour) {
  return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
}

// 지역·시각 기준 캐시 만료 시간 산출
// hour를 인자로 받아 테스트 가능하게 한다(기본값: 현재 시각).
export function getCacheExpiry(areaId, hour = new Date().getHours()) {
  const isImportant = importantAreas.includes(areaId);

  if (isPeakHour(hour)) {
    return isImportant ? CACHE_TTL.peakImportant : CACHE_TTL.peakNormal;
  }
  return isImportant ? CACHE_TTL.offPeakImportant : CACHE_TTL.offPeakNormal;
}
