// 캐시 정책 효과 측정 벤치마크 (결정적·재현 가능)
//
// 측정 대상: 추천용 주요 지역(importantAreas) 사전 수집 시,
//   동적 캐시 만료 정책(cachePolicy.js)이 외부 API 호출을 얼마나 줄이는가.
//
// 모델: 사용자가 하루 동안 앱을 여러 번 연다(open). 매 open마다 추천을 위해
//   15개 주요 지역 데이터가 필요하다. 각 지역은 캐시가 없거나 TTL이 만료된
//   경우에만 네트워크 호출이 발생한다(populationStore의 startDataCollection 동작과 동일).
//
// 실행: node scripts/cache-benchmark.js   (frontend 디렉터리에서)

import { importantAreas, getCacheExpiry } from '../src/store/cachePolicy.js';

const MIN = 60 * 1000;

// 한 번의 사용 시나리오를 시뮬레이션한다.
// opens: 앱을 여는 시각 목록(epoch ms). 각 open에서 15개 주요 지역을 요청한다.
function simulate(opens) {
  const lastFetch = new Map(); // areaId -> 마지막 네트워크 호출 시각

  let withCache = 0; // 캐시 정책 적용 시 실제 네트워크 호출 수
  const withoutCache = opens.length * importantAreas.length; // 매번 전부 재호출

  for (const t of opens) {
    const hour = new Date(t).getHours();
    for (const area of importantAreas) {
      const prev = lastFetch.get(area);
      const expired = prev === undefined || t - prev > getCacheExpiry(area, hour);
      if (expired) {
        withCache += 1;
        lastFetch.set(area, t);
      }
    }
  }

  const saved = withoutCache - withCache;
  const reductionPct = ((saved / withoutCache) * 100).toFixed(1);
  return { opens: opens.length, withoutCache, withCache, saved, reductionPct };
}

// 특정 날짜의 시:분을 epoch ms로
function at(hour, minute = 0) {
  const d = new Date(2026, 5, 4, hour, minute, 0, 0); // 2026-06-04 기준
  return d.getTime();
}

// 일정 간격 N회 open
function everyN(startHour, intervalMin, count) {
  const start = at(startHour);
  return Array.from({ length: count }, (_, i) => start + i * intervalMin * MIN);
}

const scenarios = [
  {
    name: 'A. 비피크 오후, 10분 간격 6회 (1시간 TTL 내 재방문)',
    opens: everyN(14, 10, 6),
  },
  {
    name: 'B. 출근 피크, 10분 간격 6회 (15분 TTL)',
    opens: everyN(8, 10, 6),
  },
  {
    name: 'C. 하루 분산 사용 8회 (오전~밤, 다양한 간격)',
    opens: [at(8, 0), at(8, 20), at(12, 30), at(13, 0), at(15, 0), at(18, 0), at(18, 25), at(21, 0)],
  },
];

console.log('주요 지역 수:', importantAreas.length);
console.log('='.repeat(78));
for (const s of scenarios) {
  const r = simulate(s.opens);
  console.log(s.name);
  console.log(
    `  open ${r.opens}회 | 캐시 없음 ${r.withoutCache}회 → 캐시 적용 ${r.withCache}회 ` +
      `| 절감 ${r.saved}회 (${r.reductionPct}%)`,
  );
  console.log('-'.repeat(78));
}
