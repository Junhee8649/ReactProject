# Frontend — 서울시 실시간 인구 핫스팟

React + Vite SPA. 프로젝트 전체 개요·아키텍처·문제 해결 과정은 [루트 README](../README.md) 참고.

## 스크립트

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (Vite HMR)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 산출물 로컬 미리보기
npm run lint     # ESLint
npm test         # Vitest (cachePolicy 단위 테스트)
```

## 구조

```
src/
├── PopulationApp.jsx       앱 진입점 — 초기화·3분 폴링·오프라인 감지
├── components/
│   ├── PopulationMap.jsx       Leaflet 지도 + 혼잡도 색상 마커
│   ├── AreaSearch.jsx          지역 검색(키워드 매핑)
│   ├── AreaCategories.jsx      카테고리 필터
│   ├── RecommendedPlaces.jsx   추천 결과 + 차선책 안내
│   ├── PlaceDetail.jsx         장소 상세
│   ├── UserPreferences.jsx     선호도(나이대·분위기·카테고리)
│   └── DataCollectionStatus.jsx 데이터 수집 상태
├── store/
│   └── populationStore.js  Zustand — 동적 캐시·추천 엔진·차선책 로직
└── utils/
    └── performanceUtils.js 리소스 최적화
```

## 핵심 로직 위치

- **캐시 만료 정책(단일 출처)**: `store/cachePolicy.js` → `getCacheExpiry` / `CACHE_TTL`
- **추천 점수 계산**: `store/populationStore.js` → `calculatePlaceScore` (기본 50 + 나이대·혼잡도·카테고리)
- **차선책 fallback**: 전역 추천 계산 내 2–3단계 대체 로직
- **3분 폴링·오프라인 감지**: `PopulationApp.jsx`의 `useEffect`

## 캐시 절감 측정

```bash
node scripts/cache-benchmark.js
```

캐시 정책(`cachePolicy.js`)을 사용 시나리오로 시뮬레이션해 외부 API 호출 절감률을 출력합니다(결정적·재현 가능, 라이브 API 불필요).

## 빌드 산출물 (참고, 코드 스플리팅 적용 후)

| 청크 | 크기 | gzip | 로딩 |
|---|---|---|---|
| index (앱) | 316.99 kB | 103.70 kB | 초기 |
| map-vendor (leaflet) | 154.75 kB | 45.22 kB | 초기 |
| react-vendor | 11.95 kB | 4.25 kB | 초기 |
| PlaceDetail (recharts) | 402.32 kB | 111.21 kB | 지연(장소 선택 시) |
| CSS | 46.38 kB | 11.73 kB | 초기 |

> **초기 JS 합계 483.69 kB / gzip 153.17 kB** (단일 청크 890kB 대비 −45.6%).
> `vite.config.js`의 `manualChunks` + `PopulationApp.jsx`의 `React.lazy(PlaceDetail)`로 분할.
