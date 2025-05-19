// /frontend/src/utils/performanceUtils.js

// 중요 지역 목록 정의 (미리 로딩할 지역들)
const essentialAreas = [
  '강남 MICE 관광특구', '명동 관광특구', '홍대 관광특구', 
  '동대문 관광특구', '이태원 관광특구', '잠실 관광특구',
  '광화문·덕수궁', '서울역', '강남역', '홍대입구역(2호선)'
];

/**
 * 리소스 최적화 및 데이터 로딩 전략 관리
 * - 중요 지역 데이터 미리 로딩
 * - 캐시 관리
 * - 메모리 최적화
 */
export const optimizeResources = async (populationStore) => {
  console.log('리소스 최적화 시작...');
  
  // 현재 시간에 따른 최적화 전략 결정
  const currentHour = new Date().getHours();
  const isDaytime = currentHour >= 8 && currentHour <= 22;
  const timeOfDay = isDaytime ? '주간' : '야간';
  
  // 1. 캐시 상태 확인
  const cacheStatus = getCacheStatus();
  console.log(`캐시 상태: ${cacheStatus.areaCount}개 지역 캐시됨`);
  
  // 2. 중요 지역 데이터 미리 로딩 (UX를 위해)
  const preloadQueue = [];
  let preloadCount = 0;
  
  for (const area of essentialAreas) {
    // 이미 캐시된 지역은 다시 로드하지 않음
    if (cacheStatus.areaIds.includes(area)) {
      continue;
    }
    
    // 주/야간에 따라 로드 우선순위 조정
    // 주간에는 상업지구, 야간에는 유흥가 우선
    const isPriority = isDaytime ? 
      isPriorityDaytimeArea(area) : 
      isPriorityNighttimeArea(area);
    
    if (preloadCount < 5 || isPriority) {
      preloadQueue.push({
        area,
        priority: isPriority ? 'normal' : 'low'
      });
      preloadCount++;
    }
  }
  
  // 3. 백그라운드에서 중요 지역 데이터 로드
  console.log(`${timeOfDay} 시간대 맞춤 데이터 최적화: ${preloadQueue.length}개 지역 로드 예정`);
  
  if (preloadQueue.length > 0) {
    // 스토어에 접근해 큐잉 시스템 활용
    try {
      preloadQueue.forEach(item => {
        const requestFn = async () => {
          await preloadAreaData(item.area);
          console.log(`백그라운드 데이터 로드 완료: ${item.area}`);
        };
        
        if (populationStore) {
          // 스토어의 큐잉 시스템 이용
          populationStore.queueRequest(requestFn, item.priority);
        } else {
          // 직접 실행 (스토어 사용 불가시)
          setTimeout(() => requestFn(), 100);
        }
      });
    } catch (error) {
      console.error('데이터 최적화 중 오류:', error);
    }
  }
  
  // 4. 메모리 최적화 및 오래된 캐시 정리
  optimizeCache();
  
  // 5. 렌더링 성능 최적화
  optimizeRendering();
  
  console.log('리소스 최적화 완료');
  return true;
};

/**
 * 지역 데이터 미리 로드
 */
async function preloadAreaData(area) {
  try {
    const url = `/api/population?area=${encodeURIComponent(area)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`${area} 데이터 로드 실패: ${response.status}`);
      return;
    }
    
    const data = await response.json();
    data.timestamp = Date.now();
    
    // 캐시에 저장
    cacheUtils.saveAreaData(area, data);
    localStorage.setItem('last_cache_update', new Date().toISOString());
    
    console.log(`${area} 데이터 미리 로드 완료`);
  } catch (error) {
    console.error(`${area} 데이터 미리 로드 중 오류:`, error);
  }
}

/**
 * 캐시 상태 확인
 */
function getCacheStatus() {
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

/**
 * 캐시 최적화 - 오래된 데이터 정리
 */
function optimizeCache() {
  try {
    const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
    
    // 캐시가 너무 많으면 정리
    if (cachedAreas.length > 30) {
      console.log('캐시 정리 시작...');
      
      // 중요 지역과 그렇지 않은 지역 분리
      const importantAreas = cachedAreas.filter(area => essentialAreas.includes(area));
      const nonImportantAreas = cachedAreas.filter(area => !essentialAreas.includes(area));
      
      // 중요하지 않은 지역 중 50%만 유지
      const areasToKeep = [...importantAreas];
      const areasToRemove = [];
      
      nonImportantAreas.forEach(area => {
        if (Math.random() > 0.5) {
          areasToKeep.push(area);
        } else {
          areasToRemove.push(area);
        }
      });
      
      // 캐시에서 제거
      areasToRemove.forEach(area => {
        localStorage.removeItem(`area_${area}`);
      });
      
      // 캐시된 지역 목록 업데이트
      localStorage.setItem('cached_areas', JSON.stringify(areasToKeep));
      console.log(`캐시 정리 완료: ${areasToRemove.length}개 지역 제거됨`);
    }
  } catch (error) {
    console.error('캐시 최적화 중 오류:', error);
  }
}

/**
 * 렌더링 성능 최적화
 */
function optimizeRendering() {
  // 지도 렌더링 최적화
  setTimeout(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      mapContainer.style.willChange = 'transform';
    }
    
    // 인구 표시 원 최적화
    const circles = document.querySelectorAll('.leaflet-interactive');
    circles.forEach(circle => {
      circle.style.willChange = 'transform';
    });
  }, 1000);
}

/**
 * 주간 시간대 우선순위 지역 확인
 */
function isPriorityDaytimeArea(area) {
  const daytimePriorities = [
    '강남 MICE 관광특구', '명동 관광특구', '여의도',
    '서울역', '강남역', '홍대입구역(2호선)'
  ];
  return daytimePriorities.includes(area);
}

/**
 * 야간 시간대 우선순위 지역 확인
 */
function isPriorityNighttimeArea(area) {
  const nighttimePriorities = [
    '홍대 관광특구', '이태원 관광특구', '명동 관광특구',
    '가로수길', '연남동', '익선동'
  ];
  return nighttimePriorities.includes(area);
}

// 외부 cacheUtils 참조 (기존 코드에서 가져옴)
const cacheUtils = {
  saveAreaData: (areaId, data) => {
    try {
      const cacheItem = {
        version: '1.0',
        timestamp: Date.now(),
        data: data
      };
      
      localStorage.setItem(`area_${areaId}`, JSON.stringify(cacheItem));
      
      // 캐시된 지역 목록 업데이트
      const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
      if (!cachedAreas.includes(areaId)) {
        cachedAreas.push(areaId);
        localStorage.setItem('cached_areas', JSON.stringify(cachedAreas));
      }
    } catch (error) {
      console.error('Cache save error:', error);
    }
  }
};