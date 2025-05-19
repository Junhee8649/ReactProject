// frontend/src/store/populationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { debounce } from 'lodash';

// 중요 지역 목록 정의 (데이터 사전 수집용)
const importantAreas = [
  '강남 MICE 관광특구', '명동 관광특구', '홍대 관광특구', 
  '동대문 관광특구', '이태원 관광특구', '잠실 관광특구',
  '광화문·덕수궁', '경복궁', '서울역', '강남역', '홍대입구역(2호선)',
  '가로수길', '성수카페거리', '여의도한강공원', '북촌한옥마을'
];

// 캐시 관리 설정
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24시간 (밀리초)

// 혼잡도 레벨에 따른 색상 맵핑
const congestionColors = {
  '여유': '#10b981', // 녹색
  '보통': '#f59e0b', // 노랑/주황
  '약간 붐빔': '#f97316', // 주황
  '붐빔': '#ef4444', // 빨강
  '매우 붐빔': '#b91c1c'  // 진한 빨강
};

// 혼잡도 레벨에 따른 점수 맵핑 (최적 방문 시간 계산용)
const congestionScores = {
  '여유': 1,
  '보통': 2,
  '약간 붐빔': 3,
  '붐빔': 4,
  '매우 붐빔': 5
};

// 개선된 캐시 유틸리티
const cacheUtils = {
  // 동적 캐시 만료 시간
  getCacheExpiry: (areaId) => {
    const hour = new Date().getHours();
    const isImportantArea = importantAreas.includes(areaId);
    
    // 피크 시간에는 데이터가 더 자주 변함
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return isImportantArea ? 15 * 60 * 1000 : 30 * 60 * 1000; // 15분 또는 30분
    }
    
    // 비피크 시간에는 데이터가 더 안정적
    return isImportantArea ? 60 * 60 * 1000 : 3 * 60 * 60 * 1000; // 1시간 또는 3시간
  },
  
  // 지역 데이터 저장
  saveAreaData: (areaId, data) => {
    try {
      // 캐시 크기 제한을 위한 최적화
      const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
      
      // 최대 캐시 크기 제한 (50개 항목)
      if (cachedAreas.length >= 50 && !cachedAreas.includes(areaId)) {
        // 중요하지 않은 지역 중 가장 오래된 항목 제거
        const nonEssentialAreas = cachedAreas.filter(
          area => !importantAreas.includes(area)
        );
        
        if (nonEssentialAreas.length > 0) {
          const areaToRemove = nonEssentialAreas[0];
          localStorage.removeItem(`area_${areaToRemove}`);
          
          // 목록 업데이트
          const newList = cachedAreas.filter(a => a !== areaToRemove);
          newList.push(areaId);
          localStorage.setItem('cached_areas', JSON.stringify(newList));
        }
      }
      
      // 예측 데이터 최적화 (과거 6시간부터 미래 12시간까지 유지)
      if (data.places) {
        data.places.forEach(place => {
          if (place.FCST_PPLTN && Array.isArray(place.FCST_PPLTN)) {
            const now = new Date();
            place.FCST_PPLTN = place.FCST_PPLTN
              .filter(f => {
                const forecastTime = new Date(f.FCST_TIME);
                const hoursDiff = (forecastTime - now) / (1000 * 60 * 60);
                return hoursDiff >= -6 && hoursDiff <= 12; // 과거 6시간부터 미래 12시간까지
              })
              .slice(0, 24); // 최대 24개 예측 포인트
          }
        });
      }
      
      const cacheItem = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: data
      };
      
      localStorage.setItem(`area_${areaId}`, JSON.stringify(cacheItem));
      
      // 캐시된 지역 목록 업데이트
      if (!cachedAreas.includes(areaId)) {
        cachedAreas.push(areaId);
        localStorage.setItem('cached_areas', JSON.stringify(cachedAreas));
      }
    } catch (error) {
      console.error('Cache save error:', error);
    }
  },
  
  loadAreaData: (areaId) => {
    try {
      console.log(`캐시 확인: ${areaId}`);
      const cached = localStorage.getItem(`area_${areaId}`);
      if (!cached) {
        console.log(`캐시 없음: ${areaId}`);
        return null;
      }
      
      const cacheItem = JSON.parse(cached);
      const now = Date.now();
      
      // 이 지역에 대한 동적 만료 시간 가져오기
      const expiry = cacheUtils.getCacheExpiry(areaId);
      
      // 캐시 유효성 검사
      if (cacheItem.version !== CACHE_VERSION || now - cacheItem.timestamp > expiry) {
        console.log(`캐시 만료됨: ${areaId} (version: ${cacheItem.version}, age: ${(now - cacheItem.timestamp) / 1000 / 60}분)`);
        localStorage.removeItem(`area_${areaId}`);
        return null;
      }
      
      // 캐시된 데이터가 올바른 구조인지 확인
      if (!cacheItem.data || !cacheItem.data.places || !Array.isArray(cacheItem.data.places)) {
        console.log(`캐시 데이터 구조 오류: ${areaId}`);
        localStorage.removeItem(`area_${areaId}`);
        return null;
      }
      
      console.log(`유효한 캐시 발견: ${areaId} (${cacheItem.data.places.length}개 장소 포함)`);
      return cacheItem.data;
    } catch (error) {
      console.error(`캐시 로드 중 오류 (${areaId}):`, error);
      
      // 오류 발생 시 캐시 항목 제거
      try {
        localStorage.removeItem(`area_${areaId}`);
      } catch (e) {
        // 제거 시도 중 오류 무시
      }
      
      return null;
    }
  },
  
  // 캐시된 모든 지역 데이터 로드
  loadAllCachedAreas: () => {
    try {
      const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
      const allData = [];
      let loadedAreas = 0;
      let failedAreas = 0;
      
      console.log(`${cachedAreas.length}개 캐시된 지역에서 데이터 로드 중...`);
      
      cachedAreas.forEach(areaId => {
        const data = cacheUtils.loadAreaData(areaId);
        if (data && data.places && Array.isArray(data.places)) {
          allData.push(...data.places);
          loadedAreas++;
        } else {
          failedAreas++;
        }
      });
      
      console.log(`캐시된 데이터 로드 완료: ${loadedAreas}개 지역 성공, ${failedAreas}개 지역 실패, 총 ${allData.length}개 장소`);
      return allData;
    } catch (error) {
      console.error('캐시된 데이터 전체 로드 중 오류:', error);
      return [];
    }
  },
  
  // 캐시 상태 확인
  getCacheStatus: () => {
    try {
      const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
      return {
        areaCount: cachedAreas.length,
        areaIds: cachedAreas,
        lastUpdated: localStorage.getItem('last_cache_update') || null
      };
    } catch (error) {
      return { areaCount: 0, areaIds: [], lastUpdated: null };
    }
  }
};

// 비용이 많이 드는 계산에 대한 디바운스
const debouncedCalculations = {
  // 전역 추천 계산
  globalRecommendations: debounce((state) => {
    // 이미 계산 중이면 건너뛰기
    if (state.isCalculatingRecommendations) return;
    
    state.set({ isCalculatingRecommendations: true });
    
    // 지연 타이머 설정하여 UI 블로킹 방지
    setTimeout(() => {
      const { cachedAllAreasData, userPreferences } = state;
      
      if (!cachedAllAreasData || cachedAllAreasData.length === 0) {
        state.set({ globalRecommendations: [], isCalculatingRecommendations: false });
        return;
      }
      
      // 중복 제거 (같은 id의 장소는 가장 최근 데이터만 사용)
      const uniquePlaces = [];
      const placeIds = new Set();
      
      cachedAllAreasData.forEach(place => {
        if (!placeIds.has(place.id)) {
          placeIds.add(place.id);
          uniquePlaces.push(place);
        }
      });
      
      // 작은 청크로 처리하여 UI 블로킹 방지
      const CHUNK_SIZE = 30;
      const places = [...uniquePlaces];
      const results = [];
      
      const processNextChunk = () => {
        if (places.length === 0) {
          // 완료, 결과로 상태 업데이트
          const topRecommendations = results
            .sort((a, b) => b.recommendScore - a.recommendScore)
            .slice(0, 5);
            
          state.set({ 
            globalRecommendations: topRecommendations,
            isCalculatingRecommendations: false
          });
          return;
        }
        
        // 다음 청크 처리
        const chunk = places.splice(0, Math.min(CHUNK_SIZE, places.length));
        
        // 이 청크에 대한 점수 계산
        const scoredChunk = chunk.map(place => {
          // 기본 점수
          let score = 50;
          
          // 연령대별 점수 (0-30점)
          const ageGroupRate = place.ageGroups[state.userPreferences.preferredAgeGroup] || 0;
          score += ageGroupRate * 1.5;
          
          // 혼잡도 점수 (0-20점)
          const congestionScores = {
            '여유': state.userPreferences.preferQuiet ? 20 : 5,
            '보통': state.userPreferences.preferQuiet ? 15 : 10,
            '약간 붐빔': 10,
            '붐빔': state.userPreferences.preferQuiet ? 5 : 15,
            '매우 붐빔': state.userPreferences.preferQuiet ? 0 : 20
          };
          score += congestionScores[place.congestionLevel] || 10;
          
          // 붐비는 곳 회피 설정 (-10점)
          if (state.userPreferences.avoidCrowds && 
              (place.congestionLevel === '붐빔' || place.congestionLevel === '매우 붐빔')) {
            score -= 10;
          }
          
          return {
            ...place,
            recommendScore: score,
            matchReason: getMatchReason(place, state.userPreferences)
          };
        });
        
        // 결과에 추가
        results.push(...scoredChunk);
        
        // 작은 지연으로 다음 청크 예약
        setTimeout(processNextChunk, 10);
      };
      
      // 처리 시작
      processNextChunk();
    }, 100);
  }, 2000)
};

// 추천 이유 생성 헬퍼 함수
function getMatchReason(place, preferences) {
  const reasons = [];
  
  // 선호 나이대 비율이 높은 경우
  const preferredAgeRate = place.ageGroups[preferences.preferredAgeGroup] || 0;
  if (preferredAgeRate > 20) {
    reasons.push(`${preferences.preferredAgeGroup} 인구 비율이 ${preferredAgeRate.toFixed(1)}%로 높음`);
  }
  
  // 혼잡도 관련 이유
  if (preferences.preferQuiet) {
    if (place.congestionLevel === '여유' || place.congestionLevel === '보통') {
      reasons.push(`혼잡도가 '${place.congestionLevel}'로 조용한 분위기`);
    }
  } else {
    if (place.congestionLevel === '붐빔' || place.congestionLevel === '매우 붐빔') {
      reasons.push(`혼잡도가 '${place.congestionLevel}'로 활기찬 분위기`);
    }
  }
  
  return reasons.length > 0 ? reasons : ['종합적인 점수가 높은 장소'];
}

// 인구 데이터 스토어
const usePopulationStore = create(
  persist(
    (set, get) => ({
      // 데이터 상태
      populationData: null,
      filteredData: null,
      selectedAgeGroup: 'all',
      selectedPlace: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      
      // 검색 관련 상태
      availableAreas: [],
      areaCategories: [],
      selectedArea: null,
      searchText: '',
      searchResults: [],
      searchFeedback: '',
      
      // 예측 데이터 관련 상태
      showForecast: true,
      optimalVisitTime: null,
      
      // 사용자 선호도 관련 상태
      userPreferences: {
        preferQuiet: true,        // 조용한 곳 선호 여부
        preferredAgeGroup: '20s', // 선호하는 나이대
        avoidCrowds: true,        // 혼잡한 곳 피하기 여부
      },
      
      // 추천 관련 상태
      recommendedPlaces: [],      // 현재 지역 기반 추천 장소 목록
      globalRecommendations: [],  // 모든 캐시된 지역 기반 추천 장소 목록
      showRecommendations: false, // 추천 화면 표시 여부
      isCalculatingRecommendations: false, // 추가: 계산 중 플래그
      
      // 데이터 수집 관련 상태
      cachedAllAreasData: [],    // 캐시된 모든 지역 데이터
      cacheStatus: { areaCount: 0, areaIds: [] }, // 캐시 상태
      dataCollectionStatus: {    // 데이터 수집 진행 상태
        total: importantAreas.length,
        loaded: 0,
        inProgress: false
      },
      
      // 요청 관리 상태 추가
      requestQueue: [],
      isProcessingQueue: false,
      pauseDataCollection: false,
      
      // 중요성에 따른 지역 분류
      categorizePlaces: () => {
        return {
          // 사용자 선택 지역과 중요 지역 (항상 최신 유지)
          highPriority: [
            get().selectedArea, 
            '강남 MICE 관광특구', 
            '명동 관광특구', 
            '홍대 관광특구'
          ].filter(Boolean),
          
          // 나머지 지역 (필요할 때만 로드)
          lowPriority: importantAreas.filter(area => 
            !get().highPriority?.includes(area)
          )
        };
      },
      
      // 요청 큐잉 및 우선순위 시스템
      queueRequest: (requestFn, priority = 'normal') => {
        const state = get();
        const queue = [...state.requestQueue];
        
        // 우선순위와 함께 큐에 추가
        queue.push({ fn: requestFn, priority, timestamp: Date.now() });
        
        // 우선순위(높은 순)와 시간(오래된 순)으로 정렬
        queue.sort((a, b) => {
          if (a.priority === 'high' && b.priority !== 'high') return -1;
          if (a.priority !== 'high' && b.priority === 'high') return 1;
          return a.timestamp - b.timestamp;
        });
        
        set({ requestQueue: queue });
        
        // 처리 중이 아니면 처리 시작
        if (!state.isProcessingQueue) {
          get().processNextRequest();
        }
      },
      
      // 다음 요청 처리
      processNextRequest: async () => {
        const state = get();
        if (state.requestQueue.length === 0) {
          set({ isProcessingQueue: false });
          return;
        }
        
        set({ isProcessingQueue: true });
        
        // 다음 요청 가져오기
        const nextRequest = state.requestQueue[0];
        
        try {
          // 요청 실행
          await nextRequest.fn();
        } catch (error) {
          console.error("요청 처리 중 오류:", error);
        }
        
        // 큐에서 제거
        set(state => ({ 
          requestQueue: state.requestQueue.slice(1) 
        }));
        
        // API 오버로드 방지를 위해 지연 후 다음 요청 처리
        setTimeout(() => {
          get().processNextRequest();
        }, 2000); // 2초 지연
      },
      
      // 초기화 함수
      initializeStore: () => {
        // 캐시 상태 로드
        const cacheStatus = cacheUtils.getCacheStatus();
        
        // 캐시된 지역 수에 기반한 dataCollectionStatus 업데이트
        const dataCollectionStatus = {
          total: importantAreas.length,
          loaded: cacheStatus.areaIds.length,
          inProgress: false
        };
        
        set({ 
          cacheStatus, 
          dataCollectionStatus,
          // 데이터 수집 기본값 일시 정지로 설정
          pauseDataCollection: true 
        });
        
        // 이미 캐시된 데이터 로드 (필요한 것만)
        if (cacheStatus.areaCount > 0) {
          // 처음에는 최대 5개 지역만 로드하여 초기 로딩 속도 개선
          const limitedAreas = cacheStatus.areaIds.slice(0, 5);
          const cachedData = [];
          
          limitedAreas.forEach(areaId => {
            const data = cacheUtils.loadAreaData(areaId);
            if (data && data.places) {
              cachedData.push(...data.places);
            }
          });
          
          set({ cachedAllAreasData: cachedData });
          console.log(`Limited initial load: ${cachedData.length} places from ${limitedAreas.length} cached areas`);
          
          // 나머지 캐시 데이터는 지연 로드
          setTimeout(() => {
            const remainingAreas = cacheStatus.areaIds.slice(5);
            let remainingData = [...cachedData];
            
            remainingAreas.forEach(areaId => {
              const data = cacheUtils.loadAreaData(areaId);
              if (data && data.places) {
                remainingData = [...remainingData, ...data.places];
              }
            });
            
            set({ cachedAllAreasData: remainingData });
            console.log(`Full cache loaded: ${remainingData.length} places from ${cacheStatus.areaCount} areas`);
            
            // 추천 계산 (지연하여 UI 블로킹 방지)
            if (remainingData.length > 0) {
              setTimeout(() => get().calculateGlobalRecommendations(), 2000);
            }
          }, 5000); // 5초 후 나머지 로드
        }
        
        // 기본 지역 데이터 로드
        get().fetchData();
      },
      
      // 지역 데이터 로드 액션
      fetchAreas: async () => {
        try {
          set({ isLoading: true });
          console.log("Fetching areas...");
          const response = await fetch('/api/areas');
          
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Areas data received:", data);
          
          set({ 
            availableAreas: data.areas,
            areaCategories: data.categories,
            isLoading: false
          });
        } catch (error) {
          console.error('Error fetching areas:', error);
          set({ 
            error: '지역 목록을 불러오는 중 오류가 발생했습니다: ' + error.message,
            isLoading: false 
          });
        }
      },
      
      // 검색 액션
      searchAreas: (text) => {
        const { availableAreas } = get();
        set({ searchText: text });
        
        if (text.trim() === '') {
          set({ searchResults: [] });
          return;
        }
        
        const textLower = text.toLowerCase();
        
        // 다단계 검색 점수 계산
        const scoredResults = availableAreas.map(area => {
          let score = 0;
          
          // 1. 완전 일치 - 가장 높은 점수
          if (area.name.toLowerCase() === textLower) {
            score += 100;
          }
          
          // 2. 이름에 포함 - 높은 점수
          else if (area.name.toLowerCase().includes(textLower)) {
            score += 70;
          }
          
          // 3. 키워드 매칭 - 중간 점수
          else if (area.keywords?.some(k => k === textLower)) {
            score += 50;
          }
          
          // 4. 부분 키워드 매칭 - 낮은 점수
          else if (area.keywords?.some(k => k.includes(textLower) || textLower.includes(k))) {
            score += 30;
          }
          
          return { ...area, score };
        });
        
        // 점수 기준 정렬 및 0점 제외
        const filtered = scoredResults
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 7);
        
        set({ searchResults: filtered });
      },
      
      setSearchFeedback: (message) => {
        set({ searchFeedback: message });
        if (message) {
          setTimeout(() => {
            set({ searchFeedback: '' });
          }, 3000);
        }
      },
      
      selectArea: (areaId) => {
        console.log(`지역 선택: ${areaId}`);
        
        const { availableAreas, selectedArea } = get();
        
        // 이미 같은 지역이 선택되어 있는지 확인
        const isReselectingSameArea = selectedArea === areaId && areaId !== null;
        
        // 지역 객체 찾기
        const selectedAreaObj = areaId ? 
          availableAreas.find(a => a.id === areaId) : null;
        
        if (selectedAreaObj) {
          console.log(`선택된 지역 객체:`, selectedAreaObj);
        } else if (areaId) {
          console.warn(`해당하는 지역 객체를 찾을 수 없음: ${areaId}`);
          return; // 유효한 지역이 없으면 여기서 종료
        }
        
        // 상태 업데이트
        set({ 
          selectedArea: selectedAreaObj ? selectedAreaObj.id : null,
          searchText: '',
          searchResults: [],
          selectedPlace: null,
          optimalVisitTime: null // 지역 변경 시 최적 방문 시간 초기화
        });
        
        // 지역 객체가 있거나 동일 지역 재선택인 경우에만 데이터 요청
        if (selectedAreaObj || isReselectingSameArea) {
          // 요청할 지역 ID 결정 (객체가 있으면 객체 ID 사용, 없으면 현재 선택된 지역 ID 사용)
          const areaIdToFetch = selectedAreaObj ? selectedAreaObj.id : selectedArea;
          console.log(`지역 데이터 요청: ${areaIdToFetch}${isReselectingSameArea ? " (동일 지역 재요청)" : ""}`);
          
          // 명시적으로 지역 ID를 전달하여 데이터 요청
          get().fetchData(areaIdToFetch, isReselectingSameArea);
        }
      },
      
      fetchData: async (directAreaName = null, forceRefresh = false) => {
        // 상태 설정 - 로딩 시작, 에러 초기화
        set({ isLoading: true, error: null });
        
        try {
          // 요청할 지역 결정
          const { selectedArea } = get();
          
          let area = directAreaName || (selectedArea ? selectedArea : null);
          
          // 기본값 설정
          if (!area) {
            area = '강남 MICE 관광특구';
            console.log(`지역이 지정되지 않아 기본값 사용: ${area}`);
          }
          
          // 지역명 매핑 테이블
          const fallbackMap = {
            // 기존 매핑
            '동대문 시장': '동대문 관광특구',
            '남대문 시장': '남대문시장',
            '광장 시장': '광장(전통)시장',
            '홍대입구역': '홍대입구역(2호선)',
            '홍대입구': '홍대입구역(2호선)',
            '홍대역': '홍대입구역(2호선)',
            
            // 추가 매핑 - 관광특구
            '강남': '강남 MICE 관광특구',
            '강남구': '강남 MICE 관광특구',
            '동대문': '동대문 관광특구',
            '동대문역': '동대문역',
            '명동': '명동 관광특구',
            '이태원': '이태원 관광특구',
            '홍대': '홍대 관광특구',
            '홍익대': '홍대 관광특구',
            '종로': '종로·청계 관광특구',
            '청계': '종로·청계 관광특구',
            '잠실': '잠실 관광특구',
            
            // 고궁·문화유산
            '경복궁': '경복궁',
            '광화문·덕수궁': '광화문·덕수궁',
            '광화문': '광화문·덕수궁',
            '덕수궁': '광화문·덕수궁',
            '보신각': '보신각',
            '서울 암사동 유적': '서울 암사동 유적',
            '암사동': '서울 암사동 유적',
            '창덕궁·종묘': '창덕궁·종묘',
            '창덕궁': '창덕궁·종묘',
            '종묘': '창덕궁·종묘',
            
            // 역삼역 및 기타 역 추가
            '역삼역': '역삼역',
            '역삼': '역삼역',
            '가산디지털단지역': '가산디지털단지역',
            '가산디지털단지': '가산디지털단지역',
            '강남역': '강남역',
            '건대입구역': '건대입구역',
            '건대입구': '건대입구역',
            '건대': '건대입구역',
            
            // 발달상권
            '가락시장': '가락시장',
            '가로수길': '가로수길',
            'DDP': 'DDP(동대문디자인플라자)'
          };
          
          if (area && fallbackMap[area]) {
            console.log(`매핑 적용: ${area} -> ${fallbackMap[area]}`);
            area = fallbackMap[area];
          }
          
          // 캐시 확인 (강제 새로고침이 아닌 경우)
          if (!forceRefresh) {
            const cachedData = cacheUtils.loadAreaData(area);
            if (cachedData) {
              console.log(`캐시된 데이터 사용: ${area}`);
              set({ 
                populationData: cachedData,
                filteredData: cachedData.places, 
                lastUpdated: new Date(cachedData.timestamp || Date.now()),
                isLoading: false 
              });
              
              // 최적 방문 시간 계산
              if (cachedData.places && cachedData.places.length > 0) {
                const place = cachedData.places[0];
                if (place.hasForecast && Array.isArray(place.FCST_PPLTN)) {
                  get().calculateOptimalVisitTime(place);
                }
              }
              
              // 필터 적용
              const { selectedAgeGroup } = get();
              if (selectedAgeGroup !== 'all') {
                get().filterByAgeGroup(selectedAgeGroup);
              }
              
              return;
            }
          }
          
          // API 요청 URL 생성
          let url = `/api/population?area=${encodeURIComponent(area)}`;
          
          if (forceRefresh) {
            const timestamp = new Date().getTime();
            url = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
          }
          
          console.log(`API 요청: ${url}`);
          
          // API 요청
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 404 && directAreaName && !directAreaName.includes('관광특구')) {
              // 404 오류 시 관광특구 시도
              if (directAreaName.includes('동대문')) {
                console.log("동대문 관광특구로 다시 시도합니다");
                return get().fetchData('동대문 관광특구');
              } else if (directAreaName.includes('명동')) {
                console.log("명동 관광특구로 다시 시도합니다");
                return get().fetchData('명동 관광특구');
              } else if (directAreaName.includes('강남')) {
                console.log("강남 MICE 관광특구로 다시 시도합니다");
                return get().fetchData('강남 MICE 관광특구');
              } else if (directAreaName.includes('홍대')) {
                console.log("홍대 관광특구로 다시 시도합니다");
                return get().fetchData('홍대 관광특구');
              }
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error: ${response.status}`);
          }
          
          const data = await response.json();
          data.timestamp = Date.now();
          console.log("Population data received:", data);
          
          // 캐시에 데이터 저장
          cacheUtils.saveAreaData(area, data);
          localStorage.setItem('last_cache_update', new Date().toISOString());
          
          // 캐시 상태 업데이트
          const cacheStatus = cacheUtils.getCacheStatus();
          const dataCollectionStatus = get().dataCollectionStatus;
          dataCollectionStatus.loaded = Math.min(cacheStatus.areaCount, importantAreas.length);
          
          // 상태 업데이트
          set({ 
            populationData: data,
            filteredData: data.places, 
            lastUpdated: new Date(),
            isLoading: false,
            cacheStatus,
            dataCollectionStatus
          });
          
          // 캐시된 전체 데이터 업데이트
          const cachedData = cacheUtils.loadAllCachedAreas();
          set({ cachedAllAreasData: cachedData });
          
          // 예측 데이터가 있는 경우, 최적 방문 시간 계산
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            if (place.hasForecast && Array.isArray(place.FCST_PPLTN)) {
              get().calculateOptimalVisitTime(place);
            }
          }
          
          // 선택된 나이대 필터 적용
          const { selectedAgeGroup } = get();
          if (selectedAgeGroup !== 'all') {
            get().filterByAgeGroup(selectedAgeGroup);
          }
          
          // 전역 추천 업데이트
          get().calculateGlobalRecommendations();
          // 현재 지역 추천 계산
          get().calculateRecommendations();
          
        } catch (error) {
          console.error('Error fetching population data:', error);
          set({ 
            error: '데이터를 불러오는 중 오류가 발생했습니다: ' + error.message, 
            isLoading: false 
          });
          
          if (directAreaName) {
            get().setSearchFeedback(`"${directAreaName}" 데이터를 찾을 수 없습니다.`);
          }
        }
      },
      
      // 데이터 수집 일시 중지/재개 토글
      togglePauseDataCollection: () => {
        set(state => ({ 
          pauseDataCollection: !state.pauseDataCollection,
          // 메시지 피드백 추가
          searchFeedback: !state.pauseDataCollection 
            ? "데이터 수집이 일시 중지되었습니다." 
            : "데이터 수집이 재개되었습니다."
        }));
        
        // 메시지 자동 삭제
        setTimeout(() => {
          set({ searchFeedback: '' });
        }, 3000);
        
        // 일시 중지 상태에서 재개할 때 수집 다시 시작
        if (get().pauseDataCollection) {
          setTimeout(() => {
            // 현재 진행 중이 아니고 완료되지 않았으면 재개
            const { dataCollectionStatus } = get();
            if (!dataCollectionStatus.inProgress && 
                dataCollectionStatus.loaded < dataCollectionStatus.total) {
              get().startDataCollection();
            }
          }, 500);
        }
      },
      
      // 최적화된 백그라운드 데이터 수집
      startDataCollection: async () => {
        const { dataCollectionStatus, pauseDataCollection } = get();
        
        // 이미 진행 중이거나 일시 중지된 경우 건너뛰기
        if (dataCollectionStatus.inProgress || pauseDataCollection) {
          console.log(pauseDataCollection ? "데이터 수집이 일시 중지 상태입니다" : "이미 진행 중입니다");
          return;
        }
        
        set({ 
          dataCollectionStatus: {
            ...dataCollectionStatus,
            inProgress: true
          }
        });
        
        // 이미 캐시된 지역 확인
        const cacheStatus = cacheUtils.getCacheStatus();
        const cachedAreas = cacheStatus.areaIds || [];
        
        // 아직 캐시되지 않은 중요 지역 필터링
        const areasToFetch = importantAreas
          .filter(area => !cachedAreas.includes(area))
          .slice(0, 2); // 한 번에 최대 2개만 가져오기 (수정: 이전에는 1개만 가져왔음)
        
        if (areasToFetch.length === 0) {
          console.log('모든 중요 지역이 이미 캐시되었습니다.');
          set({ 
            dataCollectionStatus: {
              ...dataCollectionStatus,
              inProgress: false,
              loaded: importantAreas.length
            }
          });
          return;
        }
        
        console.log(`${areasToFetch.length}개 지역의 데이터 수집 시작: ${areasToFetch.join(', ')}`);
        
        // 작은 배치로 나누어 처리
        for (const area of areasToFetch) {
          try {
            // 일시 중지 상태 확인
            if (get().pauseDataCollection) {
              console.log('데이터 수집이 일시 중지되었습니다.');
              break;
            }
            
            console.log(`${area} 데이터 가져오는 중...`);
            
            // 우선순위를 'low'로 설정하여 큐잉
            const requestFn = async () => {
              try {
                const url = `/api/population?area=${encodeURIComponent(area)}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                  console.warn(`${area} 가져오기 실패: ${response.status}`);
                  return;
                }
                
                const data = await response.json();
                data.timestamp = Date.now();
                
                // 캐시에 저장
                cacheUtils.saveAreaData(area, data);
                localStorage.setItem('last_cache_update', new Date().toISOString());
                
                // 상태 업데이트
                const updatedCacheStatus = cacheUtils.getCacheStatus();
                const loaded = Math.min(updatedCacheStatus.areaCount, importantAreas.length);
                
                set(state => ({ 
                  cacheStatus: updatedCacheStatus,
                  dataCollectionStatus: {
                    ...state.dataCollectionStatus,
                    loaded
                  }
                }));
                
                // 캐시된 전체 데이터 업데이트
                const cachedData = cacheUtils.loadAllCachedAreas();
                set({ cachedAllAreasData: cachedData });
                
                console.log(`${area} 데이터 수집 완료 (${loaded}/${importantAreas.length})`);
              } catch (error) {
                console.error(`${area} 데이터 로드 중 오류:`, error);
              }
            };
            
            get().queueRequest(requestFn, 'low');
          } catch (error) {
            console.error(`${area} 데이터 로드 중 오류:`, error);
          }
        }
        
        // 배치 처리 완료 후
        setTimeout(() => {
          // 일시 중지 상태가 아니고 아직 완료되지 않은 경우
          if (!get().pauseDataCollection && get().dataCollectionStatus.loaded < importantAreas.length) {
            // 다음 배치 처리를 위한 재귀 호출
            get().startDataCollection();
          } else {
            set(state => ({ 
              dataCollectionStatus: {
                ...state.dataCollectionStatus,
                inProgress: false
              }
            }));
          }
        }, 30000); // 30초 지연 (수정: 이전에는 10초)
      },
      
      filterByAgeGroup: (ageGroup) => {
        const { populationData } = get();
        
        if (!populationData || !populationData.places) return;
        
        set({ selectedAgeGroup: ageGroup });
        
        if (ageGroup === 'all') {
          set({ filteredData: populationData.places });
          return;
        }
        
        const filtered = populationData.places
          .map(place => ({
            ...place,
            selectedAgeGroupPercentage: place.ageGroups[ageGroup]
          }))
          .sort((a, b) => b.selectedAgeGroupPercentage - a.selectedAgeGroupPercentage);
        
        set({ filteredData: filtered });
      },
      
      selectPlace: (placeId) => {
        const { filteredData } = get();
        if (!filteredData) return;
        
        const selectedPlace = placeId 
          ? filteredData.find(p => p.id === placeId)
          : null;
        
        set({ selectedPlace });
        
        if (selectedPlace && selectedPlace.hasForecast) {
          get().calculateOptimalVisitTime(selectedPlace);
        } else {
          set({ optimalVisitTime: null });
        }
      },
      
      calculateOptimalVisitTime: (place) => {
        console.log("calculateOptimalVisitTime 호출됨, 장소:", place.name);
        
        if (!place || !place.hasForecast) {
          console.log("장소가 없거나 예측 데이터가 없음");
          set({ optimalVisitTime: null });
          return;
        }
        
        // API 응답에서 예측 데이터 배열 가져오기
        const forecastData = place.FCST_PPLTN || [];
        console.log("예측 데이터:", forecastData);
        
        if (!forecastData || forecastData.length === 0) {
          console.log("예측 데이터 배열이 비어있음");
          set({ optimalVisitTime: null });
          return;
        }
        
        // 점수 기반으로 가장 덜 혼잡한 시간대 찾기
        const scoredForecast = forecastData.map(forecast => ({
          time: forecast.FCST_TIME,
          congestionLevel: forecast.FCST_CONGEST_LVL,
          score: congestionScores[forecast.FCST_CONGEST_LVL] || 3,
          minPeople: forecast.FCST_PPLTN_MIN,
          maxPeople: forecast.FCST_PPLTN_MAX
        }));
        console.log("점수 할당된 예측 데이터:", scoredForecast);
        
        // 현재 시간 확인
        const now = new Date();
        console.log("현재 시간:", now);
        
        // 개선: 현재 시간에서 가장 가까운 '여유' 또는 '보통' 시간대도 고려
        let bestTimeInRange = null;
        let minTimeDiff = Infinity;
        
        scoredForecast.forEach(forecast => {
          const forecastTime = new Date(forecast.time);
          if (forecastTime > now && forecast.score <= 2) { // '여유' 또는 '보통'인 경우
            const timeDiff = forecastTime.getTime() - now.getTime();
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              bestTimeInRange = forecast;
            }
          }
        });
        
        // 가장 가까운 '여유/보통' 시간이 있으면 사용
        if (bestTimeInRange) {
          console.log("가장 가까운 여유/보통 시간:", bestTimeInRange);
          set({ optimalVisitTime: bestTimeInRange });
          return;
        }
        
        // 점수가 가장 낮은(덜 혼잡한) 시간 찾기
        const optimal = scoredForecast.reduce((best, current) => {
          // 현재 시간 이후의 예측만 고려
          const forecastTime = new Date(current.time);
          console.log("검토 중인 시간:", forecastTime, "점수:", current.score, "현재보다 이후?", forecastTime > now);
          
          if (forecastTime > now && current.score < best.score) {
            return current;
          }
          return best;
        }, { score: Infinity });
        console.log("계산된 최적 시간:", optimal);
        
        // 최적 시간을 찾았다면 상태에 저장
        if (optimal.score !== Infinity) {
          console.log("최적 시간 설정:", optimal);
          set({ optimalVisitTime: optimal });
        } else {
          console.log("적합한 최적 시간 없음");
          set({ optimalVisitTime: null });
        }
      },
      
      getCongestionColor: (congestionLevel) => {
        return congestionColors[congestionLevel] || '#666666'; // 기본 회색
      },
      
      getCongestionScore: (congestionLevel) => {
        return congestionScores[congestionLevel] || 3; // 기본값
      },
      
      toggleForecast: () => {
        set(state => ({ showForecast: !state.showForecast }));
      },
      
      resetData: () => {
        set({
          selectedPlace: null,
          error: null,
          optimalVisitTime: null
        });
      },
      
      // 사용자 선호도 관련 액션
      updateUserPreference: (key, value) => {
        set(state => ({
          userPreferences: {
            ...state.userPreferences,
            [key]: value
          }
        }));
        
        // 선호도가 변경되면 추천 재계산
        const { cachedAllAreasData } = get();
        if (cachedAllAreasData.length > 0) {
          get().calculateGlobalRecommendations();
        } else {
          get().calculateRecommendations();
        }
      },
      
      // 현재 장소 기반 추천 계산
      calculateRecommendations: () => {
        const { populationData, userPreferences } = get();
        
        if (!populationData || !populationData.places || populationData.places.length === 0) {
          return set({ recommendedPlaces: [] });
        }
        
        // 추천 알고리즘
        const scored = populationData.places.map(place => {
          // 기본 점수
          let score = 50;
          
          // 1. 선호 나이대 비율에 따른 점수 (0-30점)
          const ageGroupRate = place.ageGroups[userPreferences.preferredAgeGroup] || 0;
          score += ageGroupRate * 1.5; // 비율이 높을수록 더 높은 점수
          
          // 2. 혼잡도에 따른 점수 (0-20점)
          const congestionScores = {
            '여유': userPreferences.preferQuiet ? 20 : 5,
            '보통': userPreferences.preferQuiet ? 15 : 10,
            '약간 붐빔': 10,
            '붐빔': userPreferences.preferQuiet ? 5 : 15,
            '매우 붐빔': userPreferences.preferQuiet ? 0 : 20
          };
          score += congestionScores[place.congestionLevel] || 10;
          
          // 3. 붐비는 곳 회피 설정에 따른 보정 (-10점)
          if (userPreferences.avoidCrowds && 
             (place.congestionLevel === '붐빔' || place.congestionLevel === '매우 붐빔')) {
            score -= 10;
          }
          
          return {
            ...place,
            recommendScore: score,
            matchReason: getMatchReason(place, userPreferences)
          };
        });
        
        // 점수에 따라 정렬하고 상위 5개만 선택
        const recommendations = scored
          .sort((a, b) => b.recommendScore - a.recommendScore)
          .slice(0, 5);
        
        set({ recommendedPlaces: recommendations });
      },
      
      // 전역 추천 계산 (최적화 적용)
      calculateGlobalRecommendations: () => {
        // 기존 코드를 아래 코드로 대체:
        console.log("전역 추천 계산 시작");
        
        // 이미 계산 중이면 건너뛰기
        if (get().isCalculatingRecommendations) {
          console.log("이미 추천 계산 중입니다");
          return;
        }
        
        set({ isCalculatingRecommendations: true });
        
        // 처리에 약간의 지연 추가하여 UI 블로킹 방지
        setTimeout(() => {
          const { cachedAllAreasData, userPreferences } = get();
          
          if (!cachedAllAreasData || cachedAllAreasData.length === 0) {
            console.log("캐시된 데이터 없음, 추천 계산 중단");
            set({ globalRecommendations: [], isCalculatingRecommendations: false });
            return;
          }
          
          // 중복 제거 (같은 id의 장소는 가장 최근 데이터만 사용)
          const uniquePlaces = [];
          const placeIds = new Set();
          
          cachedAllAreasData.forEach(place => {
            if (!placeIds.has(place.id)) {
              placeIds.add(place.id);
              uniquePlaces.push(place);
            }
          });
          
          console.log(`${uniquePlaces.length}개의 장소로 추천 계산`);
          
          // 작은 청크로 처리하여 UI 블로킹 방지
          const CHUNK_SIZE = 30;
          const places = [...uniquePlaces];
          const results = [];
          
          const processNextChunk = () => {
            if (places.length === 0) {
              // 완료, 결과로 상태 업데이트
              const topRecommendations = results
                .sort((a, b) => b.recommendScore - a.recommendScore)
                .slice(0, 5);
                
              console.log(`추천 계산 완료: ${topRecommendations.length}개 항목`);
              
              set({ 
                globalRecommendations: topRecommendations,
                isCalculatingRecommendations: false
              });
              return;
            }
            
            // 다음 청크 처리
            const chunk = places.splice(0, Math.min(CHUNK_SIZE, places.length));
            
            // 이 청크에 대한 점수 계산
            const scoredChunk = chunk.map(place => {
              // 기본 점수
              let score = 50;
              
              // 연령대별 점수 (0-30점)
              const ageGroupRate = place.ageGroups[userPreferences.preferredAgeGroup] || 0;
              score += ageGroupRate * 1.5;
              
              // 혼잡도 점수 (0-20점)
              const congestionScores = {
                '여유': userPreferences.preferQuiet ? 20 : 5,
                '보통': userPreferences.preferQuiet ? 15 : 10,
                '약간 붐빔': 10,
                '붐빔': userPreferences.preferQuiet ? 5 : 15,
                '매우 붐빔': userPreferences.preferQuiet ? 0 : 20
              };
              score += congestionScores[place.congestionLevel] || 10;
              
              // 붐비는 곳 회피 설정 (-10점)
              if (userPreferences.avoidCrowds && 
                  (place.congestionLevel === '붐빔' || place.congestionLevel === '매우 붐빔')) {
                score -= 10;
              }
              
              return {
                ...place,
                recommendScore: score,
                matchReason: getMatchReason(place, userPreferences)
              };
            });
            
            // 결과에 추가
            results.push(...scoredChunk);
            
            // 작은 지연으로 다음 청크 예약
            setTimeout(processNextChunk, 10);
          };
          
          // 처리 시작
          processNextChunk();
        }, 100);
      },
      
      // 추천 화면 토글
      toggleRecommendations: () => {
        const { showRecommendations, recommendedPlaces, globalRecommendations } = get();
        
        // 추천 목록이 비어있으면 계산
        if (!showRecommendations) {
          if (globalRecommendations.length === 0 && recommendedPlaces.length === 0) {
            get().calculateRecommendations();
            
            // 전역 추천이 가능하면 계산
            const { cachedAllAreasData } = get();
            if (cachedAllAreasData.length > 0) {
              get().calculateGlobalRecommendations();
            }
          }
        }
        
        set(state => ({ showRecommendations: !state.showRecommendations }));
      },
      
      // 자원 최적화 함수 추가
      optimizeResources: () => {
        const state = get();
        
        // 1. 오래된 캐시 항목 정리
        const cachedAreas = [...state.cacheStatus.areaIds];
        const now = Date.now();
        
        let removedCount = 0;
        
        cachedAreas.forEach(areaId => {
          // 중요 지역이 아닌 항목 중 12시간 이상 지난 항목 제거
          if (!importantAreas.includes(areaId)) {
            try {
              const cached = localStorage.getItem(`area_${areaId}`);
              if (cached) {
                const cacheItem = JSON.parse(cached);
                if (now - cacheItem.timestamp > 12 * 60 * 60 * 1000) {
                  localStorage.removeItem(`area_${areaId}`);
                  removedCount++;
                }
              }
            } catch (e) {
              console.error("Cache cleanup error:", e);
            }
          }
        });
        
        // 2. 메모리 최적화 - 필요없는 데이터 참조 제거
        if (state.cachedAllAreasData.length > 100) {
          // 최대 100개 장소만 유지 (중요 지역 우선)
          const importantPlaces = state.cachedAllAreasData.filter(place => 
            importantAreas.includes(place.name)
          );
          
          const otherPlaces = state.cachedAllAreasData.filter(place => 
            !importantAreas.includes(place.name)
          ).slice(0, 100 - importantPlaces.length);
          
          set({ cachedAllAreasData: [...importantPlaces, ...otherPlaces] });
        }
        
        console.log(`Resource optimization: Removed ${removedCount} old cache entries`);
        
        // 3. 3시간마다 실행 (앱이 열려있는 동안)
        setTimeout(() => get().optimizeResources(), 3 * 60 * 60 * 1000);
      }
    }),
    {
      name: 'seoul-population-storage',
      getStorage: () => localStorage,
    }
  )
);

export default usePopulationStore;