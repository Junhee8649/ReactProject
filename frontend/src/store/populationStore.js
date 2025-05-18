// frontend/src/store/populationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 혼잡도 레벨에 따른 색상 맵핑 (개선된 색상)
const congestionColors = {
  '여유': '#10b981', // 좀 더 눈에 띄는 녹색
  '보통': '#f59e0b', // 좀 더 눈에 띄는 노랑/주황
  '약간 붐빔': '#f97316', // 좀 더 눈에 띄는 주황
  '붐빔': '#ef4444', // 좀 더 눈에 띄는 빨강
  '매우 붐빔': '#b91c1c'  // 좀 더 눈에 띄는 진한 빨강
};

// 혼잡도 레벨에 따른 점수 맵핑 (최적 방문 시간 계산용)
const congestionScores = {
  '여유': 1,
  '보통': 2,
  '약간 붐빔': 3,
  '붐빔': 4,
  '매우 붐빔': 5
};

// 인구 데이터 스토어
const usePopulationStore = create(
  persist(
    (set, get) => ({
      // 기존 상태
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
      
      // 사용자 선호도 관련 상태 추가
      userPreferences: {
        preferQuiet: true,        // 조용한 곳 선호 여부
        preferredAgeGroup: '20s', // 선호하는 나이대
        avoidCrowds: true,        // 혼잡한 곳 피하기 여부
      },
      
      recommendedPlaces: [],      // 추천된 장소 목록
      showRecommendations: false, // 추천 화면 표시 여부
      
      // 기존 액션들...
      
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
        const { availableAreas, selectedArea } = get();
        
        const isReselectingSameArea = selectedArea === areaId && areaId !== null;
        
        const selectedAreaObj = areaId ? 
          availableAreas.find(a => a.id === areaId) : null;
        
        set({ 
          selectedArea: selectedAreaObj ? selectedAreaObj.id : null,
          searchText: '',
          searchResults: [],
          selectedPlace: null,
          optimalVisitTime: null // 지역 변경 시 최적 방문 시간 초기화
        });
        
        if (selectedAreaObj || isReselectingSameArea) {
          get().fetchData(null, isReselectingSameArea);
        }
      },
      
      fetchData: async (directAreaName = null, forceRefresh = false) => {
        set({ isLoading: true, error: null });
        try {
          const { selectedArea } = get();
          
          let area = directAreaName || (selectedArea ? selectedArea : null);
          
          const fallbackMap = {
            '동대문 시장': '동대문 관광특구',
            '남대문 시장': '남대문시장',
            '광장 시장': '광장(전통)시장',
            '홍대입구역': '홍대입구역(2호선)',
            '홍대입구': '홍대입구역(2호선)',
            '홍대역': '홍대입구역(2호선)',
          };
          
          if (area && fallbackMap[area]) {
            console.log(`Using fallback mapping: ${area} -> ${fallbackMap[area]}`);
            area = fallbackMap[area];
          }
          
          let url = '/api/population';
          if (area) {
            url = `${url}?area=${encodeURIComponent(area)}`;
          }
          
          if (forceRefresh) {
            const timestamp = new Date().getTime();
            url = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
          }
          
          console.log(`Fetching population data from: ${url} (forceRefresh: ${forceRefresh})`);
          
          const response = await fetch(url);
          
          if (!response.ok) {
            if (response.status === 404 && directAreaName && !directAreaName.includes('관광특구')) {
              if (directAreaName.includes('동대문')) {
                console.log("Trying with '동대문 관광특구' instead");
                return get().fetchData('동대문 관광특구');
              } else if (directAreaName.includes('명동')) {
                console.log("Trying with '명동 관광특구' instead");
                return get().fetchData('명동 관광특구');
              } else if (directAreaName.includes('강남')) {
                console.log("Trying with '강남 MICE 관광특구' instead");
                return get().fetchData('강남 MICE 관광특구');
              }
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Population data received:", data);

          set({ 
            populationData: data,
            filteredData: data.places, 
            lastUpdated: new Date(),
            isLoading: false 
          });
          
          // 예측 데이터가 있는 경우, 최적 방문 시간 계산
          if (data.places && data.places.length > 0) {
            const place = data.places[0]; // 첫 번째 장소
            if (place.hasForecast && Array.isArray(place.FCST_PPLTN)) {
              get().calculateOptimalVisitTime(place);
            }
          }
          
          const { selectedAgeGroup } = get();
          if (selectedAgeGroup !== 'all') {
            get().filterByAgeGroup(selectedAgeGroup);
          }
          
          // 데이터가, 로드되면 추천 계산
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
      
      // 사용자 선호도 관련 액션 추가
      updateUserPreference: (key, value) => {
        set(state => ({
          userPreferences: {
            ...state.userPreferences,
            [key]: value
          }
        }));
        
        // 선호도가 변경되면 추천 재계산
        get().calculateRecommendations();
      },
      
      // 선호도 기반 장소 추천 계산 함수
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
      
      // 추천 화면 토글
      toggleRecommendations: () => {
        const { showRecommendations, recommendedPlaces } = get();
        
        // 추천 목록이 비어있으면 계산
        if (!showRecommendations && recommendedPlaces.length === 0) {
          get().calculateRecommendations();
        }
        
        set(state => ({ showRecommendations: !state.showRecommendations }));
      }
    }),
    {
      name: 'seoul-population-storage',
      getStorage: () => localStorage,
    }
  )
);

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

export default usePopulationStore;