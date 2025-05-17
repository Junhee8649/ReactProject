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

// 인구 데이터 스토어
const usePopulationStore = create(
  persist(
    (set, get) => ({
      // 상태
      populationData: null,
      filteredData: null,
      selectedAgeGroup: 'all', // 'all', '10s', '20s', '30s', '40s', '50s', '60s', '70s'
      selectedPlace: null,
      isLoading: false,
      error: null,
      lastUpdated: null,
      
      // 검색 관련 상태
      availableAreas: [], // 가용 지역 목록
      areaCategories: [], // 지역 카테고리
      selectedArea: null, // 선택된 지역
      searchText: '', // 검색어
      searchResults: [], // 검색 결과
      searchFeedback: '', // 검색 피드백 메시지
      
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
      
      // 검색 액션 - 개선된 스마트 검색
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
          .slice(0, 7); // 상위 7개 결과만
        
        set({ searchResults: filtered });
      },
      
      // 검색 피드백 설정
      setSearchFeedback: (message) => {
        set({ searchFeedback: message });
        if (message) {
          setTimeout(() => {
            set({ searchFeedback: '' });
          }, 3000); // 3초 후 메시지 사라짐
        }
      },
      
      // 지역 선택 액션
      selectArea: (areaId) => {
        const { availableAreas, selectedArea } = get();
        
        // 같은 지역 재선택 시 강제 데이터 갱신을 위한 처리
        const isReselectingSameArea = selectedArea === areaId && areaId !== null;
        
        const selectedAreaObj = areaId ? 
          availableAreas.find(a => a.id === areaId) : null;
        
        set({ 
          selectedArea: selectedAreaObj ? selectedAreaObj.id : null,
          searchText: '',
          searchResults: [],
          selectedPlace: null // 지역 변경 시 선택된 장소 초기화
        });
        
        // 선택된 지역에 따라 데이터 다시 가져오기
        if (selectedAreaObj || isReselectingSameArea) {
          // 강제 갱신 플래그 추가
          get().fetchData(null, isReselectingSameArea);
        }
      },
      
      // 인구 데이터 가져오기 액션 (직접 지역명 입력 지원)
      fetchData: async (directAreaName = null, forceRefresh = false) => {
        set({ isLoading: true, error: null });
        try {
          const { selectedArea } = get();
          
          // 직접 입력한 지역명이 있거나 선택된 지역이 있는 경우
          let area = directAreaName || (selectedArea ? selectedArea : null);
          
          // 대체 지역명 처리
          if (area) {
            // 특정 지역명이 API에서 처리되지 않는 경우 매핑
            const fallbackMap = {
              '동대문 시장': '동대문 관광특구',
              '남대문 시장': '남대문시장',
              '광장 시장': '광장(전통)시장',
              '홍대입구역': '홍대입구역(2호선)',
              '홍대입구': '홍대입구역(2호선)',
              '홍대역': '홍대입구역(2호선)',
            };
            
            if (fallbackMap[area]) {
              console.log(`Using fallback mapping: ${area} -> ${fallbackMap[area]}`);
              area = fallbackMap[area];
            }
          }
          
          // 선택된 지역에 따라 URL 구성
          let url = '/api/population';
          if (area) {
            url = `${url}?area=${encodeURIComponent(area)}`;
          }
          
          // 캐시 무효화를 위한 타임스탬프 추가 (forceRefresh가 true일 때)
          if (forceRefresh) {
            const timestamp = new Date().getTime();
            url = `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
          }
          
          console.log(`Fetching population data from: ${url} (forceRefresh: ${forceRefresh})`);
          
          // API 호출
          const response = await fetch(url);
          
          // 오류 처리
          if (!response.ok) {
            // 404 오류이고 fallback 시도하지 않은 경우 한 번 더 시도
            if (response.status === 404 && directAreaName && !directAreaName.includes('관광특구')) {
              // 유사 지역명 시도 (예: '동대문'을 '동대문 관광특구'로)
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
          
          // 직접 검색인 경우 UI 피드백
          if (directAreaName) {
            get().setSearchFeedback(`"${directAreaName}" 데이터를 성공적으로 가져왔습니다.`);
          }
          
          set({ 
            populationData: data,
            filteredData: data.places, 
            lastUpdated: new Date(),
            isLoading: false 
          });
          
          // 기존에 선택된 나이대가 있으면 다시 필터링
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
          
          // 직접 검색인 경우 에러 피드백
          if (directAreaName) {
            get().setSearchFeedback(`"${directAreaName}" 데이터를 찾을 수 없습니다.`);
          }
        }
      },
      
      // 나이대별 필터링
      filterByAgeGroup: (ageGroup) => {
        const { populationData } = get();
        
        if (!populationData || !populationData.places) return;
        
        set({ selectedAgeGroup: ageGroup });
        
        if (ageGroup === 'all') {
          set({ filteredData: populationData.places });
          return;
        }
        
        // 선택된 나이대 기준으로 데이터 필터링 및 정렬
        const filtered = populationData.places
          .map(place => ({
            ...place,
            selectedAgeGroupPercentage: place.ageGroups[ageGroup]
          }))
          .sort((a, b) => b.selectedAgeGroupPercentage - a.selectedAgeGroupPercentage);
        
        set({ filteredData: filtered });
      },
      
      // 장소 선택
      selectPlace: (placeId) => {
        const { filteredData } = get();
        if (!filteredData) return;
        
        const selectedPlace = placeId 
          ? filteredData.find(p => p.id === placeId)
          : null;
        
        set({ selectedPlace });
      },
      
      // 혼잡도 레벨에 따른 색상 반환
      getCongestionColor: (congestionLevel) => {
        return congestionColors[congestionLevel] || '#666666'; // 기본 회색
      },
      
      // 데이터 초기화
      resetData: () => {
        set({
          selectedPlace: null,
          error: null
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