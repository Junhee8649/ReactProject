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
      
      // 액션
      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          // API 호출
          const response = await fetch('/api/population');
          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }
          const data = await response.json();
          
          set({ 
            populationData: data,
            filteredData: data.places, // 초기에는 모든 데이터 표시
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
        // 나이대별 비율을 기준으로 정렬
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
      getStorage: () => localStorage, // 나중에 IndexedDB로 변경 가능
    }
  )
);

export default usePopulationStore;