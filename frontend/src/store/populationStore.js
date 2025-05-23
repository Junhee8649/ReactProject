import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { debounce } from 'lodash';

const API_BASE_URL = '';  // 모든 환경에서 상대경로 사용

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
    // 더 이상 직접 계산하지 않고 메인 함수 호출
    if (typeof state.calculateGlobalRecommendations === 'function') {
      state.calculateGlobalRecommendations();
    } else {
      console.error('calculateGlobalRecommendations 함수를 찾을 수 없습니다');
    }
  }, 2000)
};

// 장소 추천 점수 계산 유틸리티 함수
function calculatePlaceScore(place, userPrefs) {
  // 기본 점수
  let score = 50;
  
  // 나이대 점수 (0-30점)
  const ageGroupRate = place.ageGroups[userPrefs.preferredAgeGroup] || 0;
  score += ageGroupRate * 1.5;
  
  // 혼잡도 선호도 점수 (0-30점) - 분위기와 밀집도 통합
  const isQuietPlace = ['여유', '보통'].includes(place.congestionLevel);
  // 더 강한 일치 보너스 (두 항목이 통합되었으므로)
  if ((userPrefs.preferQuiet && isQuietPlace) || 
      (!userPrefs.preferQuiet && !isQuietPlace)) {
    score += 30;
  }
  
  // 카테고리 점수 (0-30점)
  if (userPrefs.categories && userPrefs.categories.length > 0 && place.category) {
    if (userPrefs.categories.includes(place.category)) {
      score += 30;
    }
  }
  
  return score;
}

// 추천 이유 생성 헬퍼 함수
function getMatchReason(place, preferences) {
  const reasons = [];
  
  // 선호 나이대 비율이 높은 경우
  const preferredAgeRate = place.ageGroups[preferences.preferredAgeGroup] || 0;
  if (preferredAgeRate > 20) {
    reasons.push(`${preferences.preferredAgeGroup} 인구 비율이 ${preferredAgeRate.toFixed(1)}%로 높음`);
  }
  
  // 분위기 관련 이유
  const isQuietPlace = ['여유', '보통'].includes(place.congestionLevel);
  if (preferences.preferQuiet && isQuietPlace) {
    reasons.push(`혼잡도가 '${place.congestionLevel}'로 조용한 분위기`);
  } else if (!preferences.preferQuiet && !isQuietPlace) {
    reasons.push(`혼잡도가 '${place.congestionLevel}'로 활기찬 분위기`);
  }
  
  // 인구 밀집도 관련 이유
  const isLowDensity = ['여유', '보통'].includes(place.congestionLevel);
  if (preferences.preferLowDensity && isLowDensity) {
    reasons.push(`인구 밀집도가 낮아 여유로운 공간`);
  } else if (!preferences.preferLowDensity && !isLowDensity) {
    reasons.push(`인구 밀집도가 높아 북적이는 분위기`);
  }
  
  // 카테고리 일치 이유
  if (preferences.categories && preferences.categories.length > 0 && place.category) {
    if (preferences.categories.includes(place.category)) {
      const categoryName = {
        'tourist': '관광특구',
        'heritage': '고궁·문화유산',
        'station': '주요역',
        'shopping': '발달상권',
        'park': '공원'
      }[place.category] || place.category;
      
      reasons.push(`선호하는 장소 유형 '${categoryName}' 에 해당`);
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
      importantAreas, // 이 줄 추가
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
        preferLowDensity: true,   // 여유로운 곳(낮은 밀집도) 선호 여부
        preferredAgeGroup: '20s', // 선호하는 나이대
        categories: [],           // 선호하는 카테고리 ID 배열
      },
      
      // 추천 관련 상태
      globalRecommendations: [],  // 모든 캐시된 지역 기반 추천 장소 목록
      showRecommendations: false, // 추천 화면 표시 여부
      isCalculatingRecommendations: false, // 추가: 계산 중 플래그
      isCollectingPreferredData: false, // 추가: 선호 카테고리 데이터 수집 중 상태
      preferredCategoriesDataStatus: {  // 추가: 선호 카테고리 데이터 수집 진행 상태
        collecting: false,
        progress: 0,
        total: 0,
        completed: false
      },
      
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
        
        // 수정: 실제 캐시된 핵심 지역 수 계산
        const cachedImportantAreasCount = importantAreas.filter(area => 
          cacheStatus.areaIds.includes(area)
        ).length;
        
        const dataCollectionStatus = {
          total: importantAreas.length,
          loaded: cachedImportantAreasCount, // 실제 캐시된 핵심 지역 수로 설정
          inProgress: false
        };
        
        console.log(`초기화: 캐시된 전체 지역 ${cacheStatus.areaCount}개, 핵심 지역 ${cachedImportantAreasCount}/${importantAreas.length}개`);
        
        set({ 
          cacheStatus, 
          dataCollectionStatus,
          pauseDataCollection: false  // 자동 수집 활성화로 변경
        });

        // 초기화 마지막 부분에 아래 코드 추가
        // 데이터 자동 수집 시작 (지연 시작)
        setTimeout(() => {
          const latestStatus = get().dataCollectionStatus;
          // 아직 모든 핵심 지역이 로드되지 않았고, 일시중지 상태가 아니면 수집 시작
          if (!get().pauseDataCollection && 
              latestStatus.loaded < importantAreas.length) {
            console.log('자동 데이터 수집 시작...');
            get().startDataCollection();
          }
        }, 3000); // 3초 후 데이터 수집 시작 (초기 로딩 충돌 방지)
        
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
          const response = await fetch(`${API_BASE_URL}/api/areas`);
          
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
          
          // 지도 영역으로 스크롤 - 이 부분 추가
              setTimeout(() => {
                const mapElement = document.querySelector('.map-container');
                if (mapElement) {
                  mapElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'
                  });
                }
              }, 300); // 데이터 로드 시작 후 약간의 지연 추가
            }
          },

      fetchData: async (directAreaName = null, forceRefresh = false) => {
        // 상태 설정 - 로딩 시작, 에러 초기화
        set({ isLoading: true, error: null });
        
        // 🔥 추가: 재시도 카운터
        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptFetch = async () => {
          try {
            // 🔥 추가: 네트워크 상태 확인
            if (!navigator.onLine) {
              throw new Error('OFFLINE');
            }
            
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
            let url = `${API_BASE_URL}/api/population?area=${encodeURIComponent(area)}`;
            
            if (forceRefresh) {
              const timestamp = new Date().getTime();
              url = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
            }
            
            console.log(`API 요청: ${url}`);
            
            // 🔥 추가: 요청 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
            
            try {
              // 🔥 개선: 타임아웃과 함께 API 요청
              const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              
              clearTimeout(timeoutId);
              
              // 🔥 추가: HTTP 상태 코드별 세밀한 처리
              if (!response.ok) {
                switch (response.status) {
                  case 400:
                    throw new Error('INVALID_REQUEST');
                  case 401:
                    throw new Error('UNAUTHORIZED');
                  case 403:
                    throw new Error('FORBIDDEN');
                  case 404:
                    if (directAreaName && !directAreaName.includes('관광특구')) {
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
                    throw new Error('NOT_FOUND');
                  case 429:
                    throw new Error('RATE_LIMIT');
                  case 500:
                    throw new Error('SERVER_ERROR');
                  case 502:
                  case 503:
                  case 504:
                    throw new Error('SERVICE_UNAVAILABLE');
                  default:
                    throw new Error(`HTTP_ERROR_${response.status}`);
                }
              }
              
              // 🔥 추가: 응답 데이터 유효성 검사
              let data;
              try {
                data = await response.json();
              } catch (parseError) {
                throw new Error('INVALID_JSON');
              }
              
              // 🔥 추가: 데이터 구조 검증
              if (!data || typeof data !== 'object') {
                throw new Error('INVALID_DATA_STRUCTURE');
              }
              
              if (!data.places || !Array.isArray(data.places)) {
                throw new Error('MISSING_PLACES_DATA');
              }
              
              data.timestamp = Date.now();
              console.log("Population data received:", data);
              
              // 캐시에 데이터 저장
              cacheUtils.saveAreaData(area, data);
              localStorage.setItem('last_cache_update', new Date().toISOString());
              
              // 캐시 상태 업데이트
              const updatedCacheStatus = cacheUtils.getCacheStatus();
              // 핵심 중요 지역 교집합 계산
              const cachedImportantAreasCount = importantAreas.filter(area => 
                updatedCacheStatus.areaIds.includes(area)
              ).length;

              // 상태 업데이트
              set({ 
                populationData: data,
                filteredData: data.places, 
                lastUpdated: new Date(),
                isLoading: false,
                cacheStatus: updatedCacheStatus,
                dataCollectionStatus: {
                  ...get().dataCollectionStatus,
                  loaded: cachedImportantAreasCount  // 실제 로드된 핵심 지역 수로 설정
                }
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
              
            } catch (fetchError) {
              clearTimeout(timeoutId);
              throw fetchError;
            }
            
          } catch (error) {
            console.error('API 요청 중 오류:', error);
            
            // 🔥 추가: 재시도 로직
            if (retryCount < maxRetries && 
                (error.name === 'AbortError' || 
                error.message === 'SERVICE_UNAVAILABLE' ||
                error.message.includes('fetch') ||
                error.message === 'NETWORK_ERROR')) {
              
              retryCount++;
              console.log(`재시도 ${retryCount}/${maxRetries} 시도 중...`);
              
              // 지수 백오프: 1초, 2초, 4초
              const delay = Math.pow(2, retryCount - 1) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              
              return attemptFetch(); // 재귀 호출로 재시도
            }
            
            // 🔥 추가: 사용자 친화적 에러 메시지
            let userMessage = '';
            
            switch (error.message) {
              case 'OFFLINE':
                userMessage = '🔌 인터넷 연결을 확인해주세요. 오프라인 상태입니다.';
                break;
              case 'INVALID_REQUEST':
                userMessage = '❌ 잘못된 지역명입니다. 다른 지역을 선택해주세요.';
                break;
              case 'NOT_FOUND':
                userMessage = `🔍 "${directAreaName || selectedArea}"에 대한 데이터를 찾을 수 없습니다.`;
                break;
              case 'RATE_LIMIT':
                userMessage = '⏱️ 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
                break;
              case 'SERVER_ERROR':
                userMessage = '🔧 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.';
                break;
              case 'SERVICE_UNAVAILABLE':
                userMessage = '🚧 서비스가 일시적으로 이용불가합니다. 몇 분 후 다시 시도해주세요.';
                break;
              case 'INVALID_JSON':
                userMessage = '📄 서버 응답 형식에 오류가 있습니다.';
                break;
              case 'INVALID_DATA_STRUCTURE':
              case 'MISSING_PLACES_DATA':
                userMessage = '📊 데이터 형식이 올바르지 않습니다. 관리자에게 문의해주세요.';
                break;
              default:
                if (error.name === 'AbortError') {
                  userMessage = '⏰ 요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
                } else if (error.message.includes('fetch')) {
                  userMessage = '🌐 네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.';
                } else {
                  userMessage = `⚠️ 데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`;
                }
            }
            
            // 🔥 추가: 캐시된 데이터로 폴백
            const { selectedArea } = get();
            const targetArea = directAreaName || selectedArea;
            
            if (targetArea) {
              const cachedData = cacheUtils.loadAreaData(targetArea);
              if (cachedData) {
                console.log('API 오류로 캐시된 데이터 사용:', targetArea);
                
                set({ 
                  populationData: cachedData,
                  filteredData: cachedData.places, 
                  lastUpdated: new Date(cachedData.timestamp),
                  isLoading: false,
                  error: `${userMessage} (캐시된 데이터를 표시합니다)`
                });
                
                // 3초 후 에러 메시지 자동 제거
                setTimeout(() => set({ error: null }), 3000);
                return;
              }
            }
            
            // 폴백 데이터도 없으면 최종 에러 상태
            set({ 
              error: userMessage, 
              isLoading: false 
            });
            
            // 검색 피드백 설정
            if (directAreaName) {
              get().setSearchFeedback(`"${directAreaName}" 데이터를 불러올 수 없습니다.`);
            }
          }
        };
        
        // 첫 번째 시도 시작
        await attemptFetch();
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
        
        // 이미 진행 중이면 처리 안함
        if (dataCollectionStatus.inProgress) {
          console.log("이미 데이터 수집이 진행 중입니다");
          return;
        }
        
        // 일시 중지 상태 확인
        if (pauseDataCollection) {
          console.log("데이터 수집이 일시 중지 상태입니다");
          if (get().showRecommendations) {
            console.log("추천 화면에서 시작하여 일시 중지 상태를 해제합니다");
            set({ pauseDataCollection: false });
          } else {
            return;
          }
        }
        
        // 정확한 핵심 지역 수 계산
        const cacheStatus = cacheUtils.getCacheStatus();
        const cachedAreas = cacheStatus.areaIds || [];
        const cachedImportantAreasCount = importantAreas.filter(area => 
          cachedAreas.includes(area)
        ).length;
        
        // 모든 핵심 지역이 이미 캐시되었는지 확인 - 무한 로드 방지
        if (cachedImportantAreasCount >= importantAreas.length) {
          console.log('모든 핵심 지역이 이미 캐시되었습니다.');
          set({ 
            dataCollectionStatus: {
              ...dataCollectionStatus,
              inProgress: false,
              loaded: importantAreas.length
            }
          });
          return;
        }
        
        set({ 
          dataCollectionStatus: {
            ...dataCollectionStatus,
            inProgress: true,
            loaded: cachedImportantAreasCount // 정확한 값으로 업데이트
          }
        });
        
        // 아직 캐시되지 않은 중요 지역 필터링
        const areasToFetch = importantAreas
          .filter(area => !cachedAreas.includes(area))
          .slice(0, 2); // 한 번에 최대 2개만 가져오기
        
        if (areasToFetch.length === 0) {
          console.log('캐시되지 않은 중요 지역이 없습니다.');
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
        
        // 데이터 수집 부분을 동기적으로 처리하도록 변경
        try {
          // 작은 배치로 나누어 처리
          for (const area of areasToFetch) {
            try {
              // 일시 중지 상태 확인
              if (get().pauseDataCollection) {
                console.log('데이터 수집이 일시 중지되었습니다.');
                
                // 중요: inProgress 상태 꼭 false로 설정
                set(state => ({
                  dataCollectionStatus: {
                    ...state.dataCollectionStatus,
                    inProgress: false
                  }
                }));
                
                break;
              }
              
              console.log(`${area} 데이터 가져오는 중...`);
              
              // API 직접 호출하여 동기적으로 처리
              const url = `/api/population?area=${encodeURIComponent(area)}`;
              const response = await fetch(url);
              console.log(`${area} API 응답 상태:`, response.status, response.statusText);
              
              if (!response.ok) {
                console.warn(`${area} 가져오기 실패: ${response.status}`);
                continue; // 다음 지역으로 넘어가기
              }
              
              const data = await response.json();
              data.timestamp = Date.now();
              
              // 캐시에 저장
              cacheUtils.saveAreaData(area, data);
              localStorage.setItem('last_cache_update', new Date().toISOString());
              
              // 캐시 상태 및 핵심 지역 수 정확히 계산하여 업데이트
              const updatedCacheStatus = cacheUtils.getCacheStatus();
              const cachedImportantAreasCount = importantAreas.filter(area => 
                updatedCacheStatus.areaIds.includes(area)
              ).length;
              
              set(state => ({ 
                cacheStatus: updatedCacheStatus,
                dataCollectionStatus: {
                  ...state.dataCollectionStatus,
                  loaded: cachedImportantAreasCount
                }
              }));
              
              // 캐시된 전체 데이터 업데이트
              const cachedData = cacheUtils.loadAllCachedAreas();
              set({ cachedAllAreasData: cachedData });
              
              console.log(`${area} 데이터 수집 완료 (${cachedImportantAreasCount}/${importantAreas.length})`);
              
              // 요청 간 지연 추가
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              console.error(`${area} 데이터 로드 중 오류:`, error);
            }
          }
          
          // 모든 데이터 수집 완료 후 inProgress 상태 업데이트
          set(state => ({ 
            dataCollectionStatus: {
              ...state.dataCollectionStatus,
              inProgress: false
            }
          }));
          
          console.log('데이터 수집 완료');
          
          // 더 수집할 지역이 있고 일시 중지 상태가 아니면 다음 수집 예약
          const latestStatus = get().dataCollectionStatus;
          if (latestStatus.loaded < importantAreas.length && !get().pauseDataCollection) {
            console.log('다음 데이터 수집 배치 예약 (10초 후)');
            setTimeout(() => get().startDataCollection(), 10000);
          }
          
        } catch (error) {
          console.error('데이터 수집 중 오류:', error);
          
          // 오류 발생 시에도 inProgress 상태 업데이트
          set(state => ({ 
            dataCollectionStatus: {
              ...state.dataCollectionStatus,
              inProgress: false
            }
          }));
        }
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
        const { filteredData, globalRecommendations, recommendedPlaces } = get();
        
        // 먼저 filteredData에서 찾기
        let selectedPlace = filteredData ? filteredData.find(p => p.id === placeId) : null;

        // filteredData에 없으면 추천 목록에서 찾기
        if (!selectedPlace) {
          // 글로벌 추천 목록만 참조
          selectedPlace = globalRecommendations.find(p => p.id === placeId);
          
          // 추천 장소를 선택했다면, 해당 지역의 전체 데이터도 로드
          if (selectedPlace) {
            console.log(`추천 장소 선택: ${selectedPlace.name} - 데이터 로드 중...`);
            get().fetchData(selectedPlace.name);
          }
        }
        
        if (selectedPlace) {
          set({ selectedPlace });
          
          if (selectedPlace.hasForecast) {
            get().calculateOptimalVisitTime(selectedPlace);
          } else {
            set({ optimalVisitTime: null });
          }
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
        }
      },

      // 카테고리 선호도 토글 함수
      toggleCategoryPreference: (categoryId) => {
        set(state => {
          // 수정: 배열이 undefined나 null인 경우 빈 배열로 초기화
          const currentCategories = state.userPreferences.categories || [];
          // 수정: 배열 복사 전 안전 확인
          const categories = Array.isArray(currentCategories) ? [...currentCategories] : [];
          
          const index = categories.indexOf(categoryId);
          
          if (index >= 0) {
            categories.splice(index, 1);
          } else {
            categories.push(categoryId);
          }
          
          return {
            userPreferences: {
              ...state.userPreferences,
              categories
            },
            // 추가: 카테고리 변경 시 추천 목록 초기화
            globalRecommendations: []
          };
        });
        
        // 추천 재계산
        const { cachedAllAreasData } = get();
        if (cachedAllAreasData.length > 0) {
          get().calculateGlobalRecommendations();
        }
      },

      // 상태에 마지막 계산 시작 시간 관리 추가
      lastCalculationTime: null,
      
      // 전역 추천 계산 (최적화 적용)
      calculateGlobalRecommendations: () => {
        console.log("전역 추천 계산 시작");
        
        // 계산 시작 전 안전장치 추가
        const lastCalcTime = get().lastCalculationTime || 0;
        const now = Date.now();
        
        // 마지막 계산 시작 후 1분이 지났으면 강제 리셋
        if (get().isCalculatingRecommendations && (now - lastCalcTime > 60 * 1000)) {
          console.log("이전 계산이 1분 이상 진행 중입니다. 상태 강제 리셋.");
          set({ isCalculatingRecommendations: false });
        }
        
        // 현재 시간을 마지막 계산 시간으로 설정
        set({ lastCalculationTime: now });
        
        // 기존 로직
        if (get().isCalculatingRecommendations) {
          console.log("이미 추천 계산 중입니다. 시간: " + new Date().toISOString());
          return;
        }
        
        set({ isCalculatingRecommendations: true });
        
        // 처리에 약간의 지연 추가하여 UI 블로킹 방지
        setTimeout(() => {
          const { cachedAllAreasData, userPreferences, availableAreas } = get();
          
          if (!cachedAllAreasData || cachedAllAreasData.length === 0) {
            console.log("캐시된 데이터 없음, 추천 계산 중단");
            set({ globalRecommendations: [], isCalculatingRecommendations: false });
            return;
          }
          
          console.log(`${cachedAllAreasData.length}개의 장소로 추천 계산`);
          
          // 추가: 선호도가 없거나 최소한인 경우 (카테고리 선택 없음)
          const hasMinimalPreferences = !userPreferences.categories || userPreferences.categories.length === 0;
          
          // 중복 제거 (같은 id의 장소는 가장 최근 데이터만 사용)
          const uniquePlaces = [];
          const placeIds = new Set();
          
          cachedAllAreasData.forEach(place => {
            if (!placeIds.has(place.id)) {
              placeIds.add(place.id);
              
              // 변경: 장소와 카테고리 매핑 로직 개선
              const areaInfo = availableAreas.find(area => 
                area.name === place.name || 
                (area.keywords && area.keywords.some(k => 
                  k.includes(place.name.toLowerCase()) || 
                  place.name.toLowerCase().includes(k)
                ))
              ) || {};
              
              // 추가: 매핑 성공 로그
              if (areaInfo.category) {
                console.log(`장소 매핑 성공: ${place.name} -> ${areaInfo.category}`);
              }
              
              uniquePlaces.push({
                ...place,
                category: areaInfo.category // 카테고리 정보 추가
              });
            }
          });
          
          // 추가: 로그 추가
          console.log(`중복 제거 후 ${uniquePlaces.length}개 장소로 추천 계산`);
          
          // 작은 청크로 처리하여 UI 블로킹 방지
          const CHUNK_SIZE = 30;
          const places = [...uniquePlaces];
          const results = [];
          
          const processNextChunk = () => {
            if (places.length === 0) {
              // 완료, 결과로 상태 업데이트
              let topRecommendations = results
                .sort((a, b) => b.recommendScore - a.recommendScore);
                
              // 추가: 점수 계산 결과 로그
              console.log(`점수 계산 완료: ${results.length}개 장소, 최고점: ${results.length > 0 ? topRecommendations[0]?.recommendScore : 'N/A'}`);
                
              // 선호 카테고리가 있을 경우, 해당 카테고리 장소만 우선 필터링
              if (!hasMinimalPreferences && userPreferences.categories.length > 0) {
                const preferredCategoryPlaces = topRecommendations.filter(place => 
                  place.category && userPreferences.categories.includes(place.category)
                );
                
                // 추가: 필터링 결과 로그
                console.log(`선호 카테고리 필터링 결과: ${preferredCategoryPlaces.length}개 장소`);
                
                // 선호 카테고리 장소가 최소 3개 이상이면 해당 항목만 사용
                if (preferredCategoryPlaces.length >= 3) {
                  topRecommendations = preferredCategoryPlaces;
                }
                // 아니면 부족한 만큼 다른 높은 점수 장소로 채우기
                else if (preferredCategoryPlaces.length > 0) {
                  const otherPlaces = topRecommendations.filter(place => 
                    !place.category || !userPreferences.categories.includes(place.category)
                  );
                  topRecommendations = [
                    ...preferredCategoryPlaces,
                    ...otherPlaces.slice(0, 5 - preferredCategoryPlaces.length)
                  ];
                }
                // 추가: 선호 카테고리 장소가 없을 때의 대체 로직
                else {
                  console.log("선호 카테고리 장소 없음, 전체 결과 중 상위 항목 사용");
                  // topRecommendations는 그대로 사용
                }
              }
              
              // 최종 추천 결과 (상위 5개)
              topRecommendations = topRecommendations.slice(0, 5);
              
              // 추가: 빈 추천 리스트 확인 및 대체 로직
              if (topRecommendations.length === 0 && results.length > 0) {
                console.log("필터링 후 추천 결과가 없어 상위 점수 항목 사용");
                topRecommendations = results
                  .sort((a, b) => b.recommendScore - a.recommendScore)
                  .slice(0, 5);
              }
                  
              console.log(`추천 계산 완료: ${topRecommendations.length}개 항목`);
              
              // 추가: 최종 추천 목록 상세 로깅
              topRecommendations.forEach((rec, idx) => {
                console.log(`추천 #${idx+1}: ${rec.name}, 점수: ${rec.recommendScore}, 카테고리: ${rec.category || '미분류'}`);
              });

              // 캐시 상태 갱신하여 정확한 지역 수 표시
              const updatedCacheStatus = cacheUtils.getCacheStatus();
              console.log(`현재 캐시된 지역 수: ${updatedCacheStatus.areaCount}`);

              // 변경: 상태 안전하게 업데이트
              if (get().isCalculatingRecommendations) {
                set({ 
                  globalRecommendations: topRecommendations,
                  isCalculatingRecommendations: false,
                  cacheStatus: updatedCacheStatus // 캐시 상태 갱신
                });
              }
              return;
            }
            
            // 다음 청크 처리
            const chunk = places.splice(0, Math.min(CHUNK_SIZE, places.length));
            
            // 🔥 1단계: 이상적인 선호도 매칭으로 필터링
            const filteredChunk = chunk.filter(place => {
              const isQuietPlace = ['여유', '보통'].includes(place.congestionLevel);
              return userPreferences.preferQuiet === isQuietPlace;
            });
            
            // 🔥 2단계: 선호도 매칭 실패 시 차선책 적용
            let finalChunk = filteredChunk;
            let isSecondChoice = false; // 차선책 여부 플래그
            
            if (filteredChunk.length === 0) {
              console.log('선호도에 맞는 장소가 없어 차선책 적용 중...');
              isSecondChoice = true;
              
              if (userPreferences.preferQuiet) {
                // 조용한 곳 선호 → 상대적으로 덜 붐비는 순서로
                finalChunk = chunk
                  .filter(place => ['약간 붐빔'].includes(place.congestionLevel))
                  .slice(0, 10); // 최대 10개만
                
                // 그것도 없으면 전체에서 가장 덜 붐비는 곳들
                if (finalChunk.length === 0) {
                  finalChunk = chunk
                    .sort((a, b) => {
                      const levels = ['여유', '보통', '약간 붐빔', '붐빔', '매우 붐빔'];
                      return levels.indexOf(a.congestionLevel) - levels.indexOf(b.congestionLevel);
                    })
                    .slice(0, 5);
                }
              } else {
                // 활기찬 곳 선호 → 상대적으로 더 붐비는 순서로
                finalChunk = chunk
                  .filter(place => ['보통'].includes(place.congestionLevel))
                  .slice(0, 10);
                  
                if (finalChunk.length === 0) {
                  finalChunk = chunk
                    .sort((a, b) => {
                      const levels = ['여유', '보통', '약간 붐빔', '붐빔', '매우 붐빔'];
                      return levels.indexOf(b.congestionLevel) - levels.indexOf(a.congestionLevel);
                    })
                    .slice(0, 5);
                }
              }
            }
            
            // 🔥 3단계: 최종 필터링된 장소들로 점수 계산
            const scoredChunk = finalChunk.map(place => {
              let recommendScore = 50;
              let matchReason = [];
              
              // 선호 나이대 점수 (기존 유지)
              const ageGroupRate = place.ageGroups[userPreferences.preferredAgeGroup] || 0;
              recommendScore += ageGroupRate * 1.5;
              
              if (ageGroupRate > 15) {
                matchReason.push(`${userPreferences.preferredAgeGroup.replace('s', '대')} 비율이 ${ageGroupRate.toFixed(1)}%로 높음`);
              }
              
              // 🔥 혼잡도 매칭 결과에 따른 점수 및 설명
              const isQuietPlace = ['여유', '보통'].includes(place.congestionLevel);
              
              if (!isSecondChoice) {
                // 완벽 매칭인 경우
                if (userPreferences.preferQuiet && isQuietPlace) {
                  matchReason.push(`혼잡도가 '${place.congestionLevel}'로 조용한 분위기`);
                } else if (!userPreferences.preferQuiet && !isQuietPlace) {
                  matchReason.push(`혼잡도가 '${place.congestionLevel}'로 활기찬 분위기`);
                }
              } else {
                // 차선책인 경우
                recommendScore -= 10; // 차선책이므로 약간 감점
                if (userPreferences.preferQuiet) {
                  matchReason.push(`현재 시간대 기준 상대적으로 덜 붐비는 곳 (${place.congestionLevel})`);
                } else {
                  matchReason.push(`현재 시간대 기준 상대적으로 더 활기찬 곳 (${place.congestionLevel})`);
                }
              }
              
              // 카테고리 점수 (기존 유지)
              if (!hasMinimalPreferences && place.category) {
                if (userPreferences.categories.includes(place.category)) {
                  recommendScore += 30;
                  
                  // 카테고리 이름 매핑
                  const categoryName = {
                    'tourist': '관광특구',
                    'heritage': '고궁·문화유산',
                    'station': '주요역',
                    'shopping': '발달상권',
                    'park': '공원'
                  }[place.category] || place.category;
                  
                  matchReason.push(`선호하는 장소 유형 '${categoryName}' 에 해당`);
                }
              } 
              // 기본 추천 (카테고리 선택 없을 때)
              else {
                // 인기 장소에 가산점
                if (importantAreas.includes(place.name)) {
                  recommendScore += 15;
                  matchReason.push('서울의 주요 인기 장소');
                }
                
                // 카테고리 없을 때는 다양한 유형 보여주기 위해 분산
                if (matchReason.length === 0) {
                  matchReason.push('종합적인 평가 기준으로 선정된 장소');
                }
              }
              
              // 추가: 디버깅 - 높은 점수 받은 장소 로깅
              if (recommendScore > 70) {
                console.log(`높은 점수 장소: ${place.name}, 점수: ${recommendScore}, 이유: ${matchReason.join(', ')}`);
              }
              
              return {
                ...place,
                recommendScore,
                matchReason: matchReason.length > 0 ? matchReason : ['선호도에 맞는 장소']
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

      // 글로벌 추천으로 통합된 함수:
      toggleRecommendations: async () => {
        const { 
          showRecommendations, 
          userPreferences, 
          cachedAllAreasData,
          isCollectingPreferredData
        } = get();
        
        // 이미 표시 중이면 닫기만 수행
        if (showRecommendations) {
          set({ showRecommendations: false });
          return;
        }
        
        // 데이터 수집 중이면 그대로 모달 표시만
        if (isCollectingPreferredData) {
          set({ showRecommendations: true });
          return;
        }
        
        // 중요: 추천을 요청할 때 데이터 수집 일시 중지 상태를 해제
        set({ pauseDataCollection: false });
        
        // 모달 먼저 표시 (데이터 로딩 상태를 사용자에게 즉시 보여주기 위해)
        set({ showRecommendations: true });
        
        // 선호 카테고리가 설정되어 있으면 선호 카테고리 데이터 수집
        if (userPreferences.categories && userPreferences.categories.length > 0) {
          // 기존 추천 결과 초기화
          set({ globalRecommendations: [] });
          
          // 선호 카테고리 데이터 수집 시작
          const isCompleted = await get().collectPreferredCategoryData();
          
          // 데이터 수집 완료 후 항상 글로벌 추천 계산
          if (isCompleted && cachedAllAreasData.length > 0) {
            get().calculateGlobalRecommendations();
          }
          
          return;
        }
        
        // 기존 추천이 없는 경우 글로벌 추천만 계산
        if (get().globalRecommendations.length === 0) {
          // 캐시된 데이터가 있으면 글로벌 추천 계산
          if (cachedAllAreasData.length > 0) {
            get().calculateGlobalRecommendations();
          } else {
            // 캐시된 데이터가 없으면 데이터 수집 시작
            get().startDataCollection();
          }
        }
      },
      
      // 선호 카테고리의 장소 데이터 우선 수집
      collectPreferredCategoryData: async () => {
        const { userPreferences, availableAreas } = get();
        
        // 디버깅 로그 추가
        console.log("선호 카테고리 데이터 수집 시작", {
          categories: userPreferences.categories,
          availableAreasCount: availableAreas.length
        });
        
        // 선호 카테고리가 없으면 일반 추천 데이터 수집만 진행
        if (!userPreferences.categories || userPreferences.categories.length === 0) {
          get().startDataCollection();
          return false;
        }
        
        // 중요: 데이터 수집 시작 시 일시 중지 상태 해제
        set({ 
          isCollectingPreferredData: true,
          pauseDataCollection: false,
          preferredCategoriesDataStatus: {
            collecting: true,
            progress: 0,
            total: 0,
            completed: false
          }
        });
        
        // 선호 카테고리에 해당하는 지역 필터링
        const preferredAreas = availableAreas.filter(area => 
          userPreferences.categories.includes(area.category)
        );
        
        console.log(`선호 카테고리 해당 지역 수: ${preferredAreas.length}개`);
        
        if (preferredAreas.length === 0) {
          console.log('선호 카테고리에 해당하는 지역이 없습니다.');
          set({ 
            isCollectingPreferredData: false,
            preferredCategoriesDataStatus: {
              collecting: false,
              progress: 0,
              total: 0,
              completed: true
            }
          });
          return false;
        }
        
        // 캐시 상태 확인
        const cacheStatus = cacheUtils.getCacheStatus();
        const cachedAreas = cacheStatus.areaIds || [];
        
        // 아직 캐시되지 않은 선호 카테고리 지역 필터링
        let areasToFetch = preferredAreas
          .filter(area => !cachedAreas.includes(area.id))
          .map(area => area.id);
        
        // 이미 모든 선호 카테고리 데이터가 캐시되어 있는 경우
        if (areasToFetch.length === 0) {
          console.log('모든 선호 카테고리 데이터가 이미 캐시되었습니다. 일부 데이터 갱신');
          
          // 최소 5개의 선호 카테고리 지역은 항상 새로 가져오도록 함
          const areasToRefresh = preferredAreas
            .slice(0, Math.min(5, preferredAreas.length))
            .map(area => area.id);
            
          areasToFetch = areasToRefresh;
        }
        
        // 수집할 지역이 없는 경우 종료
        if (areasToFetch.length === 0) {
          set({ 
            isCollectingPreferredData: false,
            preferredCategoriesDataStatus: {
              collecting: false,
              progress: 100,
              total: preferredAreas.length,
              completed: true
            }
          });
          return true;
        }
        
        // 상태 업데이트
        set({
          preferredCategoriesDataStatus: {
            collecting: true,
            progress: preferredAreas.length - areasToFetch.length,
            total: preferredAreas.length,
            completed: false
          }
        });
        
        console.log(`${areasToFetch.length}개 선호 카테고리 지역의 데이터 수집 시작`);
        
        // 병렬 처리를 위한 배치 크기 설정 (과부하 방지를 위해 3개씩)
        const BATCH_SIZE = 3;
        let completedCount = preferredAreas.length - areasToFetch.length;
        
        // 배치 단위로 처리
        for (let i = 0; i < areasToFetch.length; i += BATCH_SIZE) {
          const batch = areasToFetch.slice(i, i + BATCH_SIZE);
          
          // 배치 내 요청을 병렬로 처리
          await Promise.all(batch.map(async (areaId) => {
            try {
              // 일시 중지 상태 확인
              if (get().pauseDataCollection) {
                console.log("데이터 수집이 일시 중지되어 중단합니다");
                return;
              }
              
              console.log(`선호 카테고리 ${areaId} 데이터 가져오는 중...`);
              
              const url = `/api/population?area=${encodeURIComponent(areaId)}`;
              const response = await fetch(url);
              
              if (!response.ok) {
                console.warn(`${areaId} 가져오기 실패: ${response.status}`);
                return;
              }
              
              const data = await response.json();
              data.timestamp = Date.now();
              
              // 캐시에 저장
              cacheUtils.saveAreaData(areaId, data);
              localStorage.setItem('last_cache_update', new Date().toISOString());
              
              // 진행상황 업데이트
              completedCount++;
              set({
                preferredCategoriesDataStatus: {
                  collecting: true,
                  progress: completedCount,
                  total: preferredAreas.length,
                  completed: false
                }
              });
              
              // 캐시된 전체 데이터 업데이트
              const cachedData = cacheUtils.loadAllCachedAreas();
              set({ cachedAllAreasData: cachedData });
              
              console.log(`선호 카테고리 ${areaId} 데이터 수집 완료 (${completedCount}/${preferredAreas.length})`);
            } catch (error) {
              console.error(`${areaId} 데이터 로드 중 오류:`, error);
            }
          }));
          
          // API 과부하 방지를 위한 지연
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 중간에 일시 중지되었는지 확인하고 중단
          if (get().pauseDataCollection) {
            console.log("데이터 수집이 일시 중지되어 중단합니다");
            break;
          }
        }
        
        // 완료 상태 업데이트
        set({ 
          isCollectingPreferredData: false,
          preferredCategoriesDataStatus: {
            collecting: false,
            progress: completedCount,
            total: preferredAreas.length,
            completed: true
          }
        });
        
        // 글로벌 추천 다시 계산
        get().calculateGlobalRecommendations();
        
        return true;
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