// frontend/src/store/populationStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 혼잡도 레벨에 따른 색상 맵핑
const congestionColors = {
  '여유': '#34c759', // 초록
  '보통': '#ffcc00', // 노랑
  '약간 붐빔': '#ff9500', // 주황
  '붐빔': '#ff3b30', // 빨강
  '매우 붐빔': '#af2a2a'  // 진한 빨강
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
      
      // 새로 추가: 예측 데이터 관련 상태
      showForecast: true, // 예측 데이터 표시 여부
      optimalVisitTime: null, // 최적 방문 시간
      
      // 지역 데이터 로드 액션
      fetchAreas: async () => {
        // 기존 코드 유지
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
      
      // 검색 액션 - 기존 코드 유지
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
      
      // 기존 함수들 유지...
      
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
        // 기존 코드 유지
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
          
          if (directAreaName) {
            get().setSearchFeedback(`"${directAreaName}" 데이터를 성공적으로 가져왔습니다.`);
          }
          
          // 데이터 설정 및 예측 데이터 처리
          set({ 
            populationData: data,
            filteredData: data.places, 
            lastUpdated: new Date(),
            isLoading: false 
          });
          
          // 예측 데이터가 있는 경우, 최적 방문 시간 계산
          if (data.places && data.places.length > 0) {
            const place = data.places[0]; // 첫 번째 장소
            if (place.hasForecast && Array.isArray(place.forecastData)) {
              get().calculateOptimalVisitTime(place);
            }
          }
          
          const { selectedAgeGroup } = get();
          if (selectedAgeGroup !== 'all') {
            get().filterByAgeGroup(selectedAgeGroup);
          }
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
      
      // 기존 기능 유지
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
      
      // 장소 선택 (최적 방문 시간 계산 추가)
      selectPlace: (placeId) => {
        const { filteredData } = get();
        if (!filteredData) return;
        
        const selectedPlace = placeId 
          ? filteredData.find(p => p.id === placeId)
          : null;
        
        set({ selectedPlace });
        
        // 선택된 장소에 예측 데이터가 있으면 최적 방문 시간 계산
        if (selectedPlace && selectedPlace.hasForecast) {
          get().calculateOptimalVisitTime(selectedPlace);
        } else {
          set({ optimalVisitTime: null });
        }
      },
      
      // 새로 추가: 예측 데이터 처리 및 최적 방문 시간 계산
      calculateOptimalVisitTime: (place) => {
        if (!place || !place.hasForecast) {
          set({ optimalVisitTime: null });
          return;
        }
        
        // API 응답에서 예측 데이터 배열 가져오기
        const forecastData = place.FCST_PPLTN || [];
        
        if (!forecastData || forecastData.length === 0) {
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
        
        // 점수가 가장 낮은(덜 혼잡한) 시간 찾기
        const optimal = scoredForecast.reduce((best, current) => {
          // 현재 시간 이후의 예측만 고려
          const forecastTime = new Date(current.time);
          const now = new Date();
          
          if (forecastTime > now && current.score < best.score) {
            return current;
          }
          return best;
        }, { score: Infinity });
        
        // 최적 시간을 찾았다면 상태에 저장
        if (optimal.score !== Infinity) {
          set({ optimalVisitTime: optimal });
        } else {
          set({ optimalVisitTime: null });
        }
      },
      
      // 혼잡도 색상 반환
      getCongestionColor: (congestionLevel) => {
        return congestionColors[congestionLevel] || '#666666'; // 기본 회색
      },
      
      // 혼잡도 점수 반환 (추가)
      getCongestionScore: (congestionLevel) => {
        return congestionScores[congestionLevel] || 3; // 기본값
      },
      
      // 예측 차트 표시 여부 토글
      toggleForecast: () => {
        set(state => ({ showForecast: !state.showForecast }));
      },
      
      // 데이터 초기화
      resetData: () => {
        set({
          selectedPlace: null,
          error: null,
          optimalVisitTime: null
        });
      }
    }),
    {
      name: 'seoul-population-storage',
      getStorage: () => localStorage,
    }
  )
);

export default usePopulationStore;