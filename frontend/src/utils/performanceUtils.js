// frontend/src/utils/performanceUtils.js

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
 * - 렌더링 최적화
 * - 이미지 지연 로딩
 * - 성능 측정
 */
export const optimizeResources = async (populationStore) => {
  console.log('리소스 최적화 시작...');
  
  // 성능 측정 시작
  const startTime = performance.now();
  
  try {
    // 실제 스토어 객체 획득
    const store = typeof populationStore === 'function' 
      ? populationStore.getState() 
      : populationStore;
    
    // 브라우저 성능 API가 있으면 측정 시작
    if (window.performance && window.performance.mark) {
      window.performance.mark('optimize-start');
    }
    
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
          
          if (store && typeof store.queueRequest === 'function') {
            // 스토어의 큐잉 시스템 이용
            store.queueRequest(requestFn, item.priority);
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
    await optimizeCache();
    
    // 5. 렌더링 성능 최적화
    optimizeRendering();
    
    // 6. 이미지 지연 로딩 설정
    setupLazyLoading();
    
    // 7. 이벤트 리스너 최적화
    optimizeEventListeners();
    
    // 8. 주기적 최적화 설정
    setupPeriodicOptimization(store);
    
    // 9. 네트워크 상태 감지 및 최적화
    setupNetworkMonitoring();
    
    // 성능 측정 종료
    if (window.performance && window.performance.mark) {
      window.performance.mark('optimize-end');
      window.performance.measure('optimize-duration', 'optimize-start', 'optimize-end');
      const measurements = window.performance.getEntriesByName('optimize-duration');
      if (measurements.length > 0) {
        console.log(`최적화 완료 시간: ${measurements[0].duration.toFixed(2)}ms`);
      }
    }
    
    const endTime = performance.now();
    console.log(`리소스 최적화 완료 (${(endTime - startTime).toFixed(2)}ms)`);
    return true;
  } catch (error) {
    console.error('최적화 중 오류 발생:', error);
    return false;
  }
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
    console.error('캐시 상태 확인 중 오류:', error);
    return { areaCount: 0, areaIds: [], lastUpdated: null };
  }
}

/**
 * 캐시 최적화 - 오래된 데이터 정리
 */
async function optimizeCache() {
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
      for (const area of areasToRemove) {
        localStorage.removeItem(`area_${area}`);
        await new Promise(resolve => setTimeout(resolve, 0)); // 브라우저 블로킹 방지
      }
      
      // 캐시된 지역 목록 업데이트
      localStorage.setItem('cached_areas', JSON.stringify(areasToKeep));
      console.log(`캐시 정리 완료: ${areasToRemove.length}개 지역 제거됨`);
    }
    
    // 오래된 캐시 항목 검사
    const now = Date.now();
    let expiredCount = 0;
    
    for (const area of cachedAreas) {
      try {
        const cacheItem = localStorage.getItem(`area_${area}`);
        if (!cacheItem) continue;
        
        const parsed = JSON.parse(cacheItem);
        const age = now - parsed.timestamp;
        
        // 24시간 이상 지난 비중요 지역 데이터 삭제
        if (age > 24 * 60 * 60 * 1000 && !essentialAreas.includes(area)) {
          localStorage.removeItem(`area_${area}`);
          expiredCount++;
        }
      } catch (error) {
        console.error(`캐시 항목 검사 중 오류 (${area}):`, error);
      }
      
      // 브라우저 블로킹 방지
      if (expiredCount > 0 && expiredCount % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    if (expiredCount > 0) {
      console.log(`만료된 캐시 항목 ${expiredCount}개 제거됨`);
      
      // 캐시된 지역 목록 다시 확인하여 업데이트
      const remainingAreas = cachedAreas.filter(area => {
        return localStorage.getItem(`area_${area}`) !== null;
      });
      
      localStorage.setItem('cached_areas', JSON.stringify(remainingAreas));
    }
  } catch (error) {
    console.error('캐시 최적화 중 오류:', error);
  }
}

/**
 * 렌더링 성능 최적화
 */
function optimizeRendering() {
  // DOM 업데이트를 일괄 처리하기 위해 requestAnimationFrame 사용
  requestAnimationFrame(() => {
    // 지도 렌더링 최적화
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      mapContainer.style.willChange = 'transform';
    }
    
    // 인구 표시 원 최적화
    const circles = document.querySelectorAll('.leaflet-interactive');
    circles.forEach(circle => {
      circle.style.willChange = 'transform';
    });
    
    // 지연 이미지 로딩을 위한 클래스 추가
    const images = document.querySelectorAll('img:not(.lazy-load)');
    images.forEach(img => {
      if (!img.complete && !img.dataset.src) {
        img.classList.add('lazy-load');
        img.dataset.src = img.src;
        img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // 투명 1x1 GIF
      }
    });
    
    // 큰 테이블, 목록 등의 가상화 적용
    virtualizeListsIfNecessary();
  });
}

/**
 * 큰 목록을 가상화하여 DOM 노드 수 줄이기
 */
function virtualizeListsIfNecessary() {
  // 항목이 많은 목록이나 테이블 찾기
  const bigLists = document.querySelectorAll('.search-results, .recommended-list');
  
  bigLists.forEach(list => {
    const items = list.children;
    if (items.length > 30) { // 30개 이상 항목이 있으면 최적화
      console.log(`긴 목록 발견: ${list.className}, ${items.length}개 항목`);
      
      // 화면 밖의 항목 숨기기 (실제 구현에서는 IntersectionObserver 사용)
      Array.from(items).forEach((item, index) => {
        if (index > 20) {
          item.style.display = 'none';
          item.setAttribute('data-virtualized', 'true');
        }
      });
      
      // 스크롤 이벤트에 가상화 핸들러 연결 (최적화를 위해 한 번만 연결)
      if (!list.hasAttribute('data-virtualized')) {
        list.setAttribute('data-virtualized', 'true');
        list.addEventListener('scroll', debounce(handleVirtualScroll, 100));
      }
    }
  });
}

/**
 * 스크롤 이벤트 처리를 위한 디바운스 함수
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 가상화된 리스트의 스크롤 처리
 */
function handleVirtualScroll(event) {
  const list = event.target;
  const items = Array.from(list.children);
  const listRect = list.getBoundingClientRect();
  
  items.forEach(item => {
    if (item.hasAttribute('data-virtualized')) {
      const itemRect = item.getBoundingClientRect();
      
      // 화면에 표시되는지 여부 확인
      const isVisible = 
        itemRect.bottom >= listRect.top - 200 && // 미리 로드 위해 여유 공간
        itemRect.top <= listRect.bottom + 200;
        
      item.style.display = isVisible ? '' : 'none';
    }
  });
}

/**
 * 이미지 지연 로딩 설정
 */
function setupLazyLoading() {
  // 이미지 지연 로딩 구현 (IntersectionObserver 활용)
  if ('IntersectionObserver' in window) {
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImage = entry.target;
          
          if (lazyImage.dataset.src) {
            lazyImage.src = lazyImage.dataset.src;
            lazyImage.removeAttribute('data-src');
            lazyImage.classList.add('loaded');
            lazyImageObserver.unobserve(lazyImage);
          }
        }
      });
    });
    
    // 지연 로딩 이미지 선택
    document.querySelectorAll('img.lazy-load').forEach(img => {
      lazyImageObserver.observe(img);
    });
    
    console.log('이미지 지연 로딩 설정 완료');
  } else {
    // IntersectionObserver를 지원하지 않는 브라우저를 위한 대체 방법
    const lazyload = () => {
      const lazyImages = document.querySelectorAll('img.lazy-load');
      
      lazyImages.forEach(img => {
        if (img.dataset.src && isInViewport(img)) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          img.classList.add('loaded');
        }
      });
    };
    
    // 스크롤 이벤트에 지연 로드 함수 연결
    document.addEventListener('scroll', debounce(lazyload, 200));
    window.addEventListener('resize', debounce(lazyload, 200));
    window.addEventListener('orientationchange', debounce(lazyload, 200));
    
    // 초기 로드
    lazyload();
  }
}

/**
 * 요소가 viewport 내에 있는지 확인
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 이벤트 리스너 최적화
 */
function optimizeEventListeners() {
  // 전역 이벤트 위임 구현으로 개별 이벤트 리스너 수 줄이기
  document.body.addEventListener('click', (e) => {
    // 검색 결과 항목 클릭 처리
    if (e.target.closest('.search-result-item')) {
      const item = e.target.closest('.search-result-item');
      const areaId = item.dataset.areaId;
      
      if (areaId) {
        // 여기서 직접 처리하지 않고 커스텀 이벤트로 발생
        const selectEvent = new CustomEvent('area-selected', { 
          detail: { areaId }, 
          bubbles: true 
        });
        item.dispatchEvent(selectEvent);
      }
    }
    
    // 필터 버튼 클릭 처리
    if (e.target.closest('.filter-btn')) {
      const btn = e.target.closest('.filter-btn');
      const ageGroup = btn.dataset.ageGroup;
      
      if (ageGroup) {
        const filterEvent = new CustomEvent('filter-selected', { 
          detail: { ageGroup }, 
          bubbles: true 
        });
        btn.dispatchEvent(filterEvent);
      }
    }
  }, { passive: true });
  
  // 스크롤 이벤트 최적화 (passive: true)
  document.addEventListener('scroll', debounce(() => {
    // 스크롤 위치에 따른 UI 요소 최적화
    optimizeVisibleUIElements();
  }, 100), { passive: true });
  
  console.log('이벤트 리스너 최적화 완료');
}

/**
 * 화면에 보이는 UI 요소 최적화
 */
function optimizeVisibleUIElements() {
  // 예: 현재 스크롤 위치에 따라 필요한 요소만 렌더링 업데이트
  const scrollPos = window.scrollY;
  const viewportHeight = window.innerHeight;
  
  // 맵이 화면에 보이는지 확인
  const mapContainer = document.querySelector('.map-container');
  if (mapContainer) {
    const mapRect = mapContainer.getBoundingClientRect();
    const isMapInView = mapRect.top < viewportHeight && mapRect.bottom > 0;
    
    // 맵이 화면에 없으면 렌더링 일시중지 (Leaflet 맵 최적화)
    if (!isMapInView && window.map && typeof window.map.invalidateSize === 'function') {
      mapContainer.setAttribute('data-render-paused', 'true');
    } else if (isMapInView && mapContainer.getAttribute('data-render-paused') === 'true') {
      // 다시 화면에 들어오면 맵 업데이트
      mapContainer.removeAttribute('data-render-paused');
      if (window.map && typeof window.map.invalidateSize === 'function') {
        window.map.invalidateSize();
      }
    }
  }
}

/**
 * 주기적 최적화 설정
 */
function setupPeriodicOptimization(store) {
  // 앱 상태를 주기적으로 최적화하기 위한 인터벌 설정
  const intervalId = setInterval(() => {
    console.log('주기적 최적화 실행 중...');
    
    // 캐시 최적화
    optimizeCache();
    
    // 메모리 사용량 확인 및 최적화
    checkMemoryUsage();
    
    // 스토어의 최적화 함수가 있으면 호출
    if (store && typeof store.optimizeResources === 'function') {
      store.optimizeResources();
    }
  }, 15 * 60 * 1000); // 15분마다 실행
  
  // 페이지 언로드 시 인터벌 정리
  window.addEventListener('beforeunload', () => {
    clearInterval(intervalId);
  });
  
  console.log('주기적 최적화 설정 완료');
}

/**
 * 메모리 사용량 확인 및 최적화
 */
function checkMemoryUsage() {
  // 브라우저가 performance.memory API 지원하는지 확인
  if (window.performance && window.performance.memory) {
    const memoryInfo = window.performance.memory;
    const usedHeap = memoryInfo.usedJSHeapSize / (1024 * 1024);
    const totalHeap = memoryInfo.totalJSHeapSize / (1024 * 1024);
    const limit = memoryInfo.jsHeapSizeLimit / (1024 * 1024);
    
    console.log(`메모리 사용량: ${usedHeap.toFixed(2)}MB / ${totalHeap.toFixed(2)}MB (한도: ${limit.toFixed(2)}MB)`);
    
    // 메모리 사용량이 80% 이상이면 추가 정리 수행
    if (usedHeap / totalHeap > 0.8) {
      console.warn('메모리 사용량이 높습니다. 추가 최적화 시작...');
      
      // 큰 캐시 데이터 정리
      aggressiveMemoryCleanup();
    }
  }
}

/**
 * 적극적인 메모리 정리
 */
function aggressiveMemoryCleanup() {
  // 중요하지 않은 캐시 항목 모두 제거
  try {
    const cachedAreas = JSON.parse(localStorage.getItem('cached_areas') || '[]');
    const essentialAreasSet = new Set(essentialAreas);
    
    // 필수 지역만 남기고 나머지 캐시 모두 정리
    const nonEssentialAreas = cachedAreas.filter(area => !essentialAreasSet.has(area));
    
    console.log(`${nonEssentialAreas.length}개의 비필수 지역 캐시 정리 중...`);
    
    // 캐시에서 비필수 지역 제거
    nonEssentialAreas.forEach(area => {
      localStorage.removeItem(`area_${area}`);
    });
    
    // 캐시된 지역 목록 업데이트
    const newCachedAreas = cachedAreas.filter(area => essentialAreasSet.has(area));
    localStorage.setItem('cached_areas', JSON.stringify(newCachedAreas));
    
    console.log('메모리 정리 완료');
  } catch (error) {
    console.error('메모리 정리 중 오류:', error);
  }
}

/**
 * 네트워크 상태 감지 및 최적화
 */
function setupNetworkMonitoring() {
  // 네트워크 연결 상태 감지 (온라인/오프라인)
  window.addEventListener('online', () => {
    console.log('온라인 상태로 변경됨. 데이터 동기화 시작...');
    syncDataOnNetworkReconnect();
  });
  
  window.addEventListener('offline', () => {
    console.log('오프라인 상태로 변경됨. 오프라인 모드 활성화...');
    enableOfflineMode();
  });
  
  // 네트워크 품질 감지 (가능한 경우)
  if ('connection' in navigator) {
    const connection = navigator.connection;
    
    if (connection) {
      // 연결 유형 또는 속도 변경 시 최적화 업데이트
      connection.addEventListener('change', updateForNetworkQuality);
      
      // 초기 네트워크 품질 확인
      updateForNetworkQuality();
    }
  }
  
  console.log('네트워크 모니터링 설정 완료');
}

/**
 * 네트워크 품질에 따른 앱 최적화
 */
function updateForNetworkQuality() {
  if (!('connection' in navigator)) return;
  
  const connection = navigator.connection;
  const connectionType = connection.type; // wifi, cellular, etc.
  const effectiveType = connection.effectiveType; // 4g, 3g, 2g, slow-2g
  const saveData = connection.saveData; // 데이터 절약 모드
  
  console.log(`네트워크 유형: ${connectionType}, 효과적 유형: ${effectiveType}, 데이터 절약: ${saveData}`);
  
  // 저품질 네트워크 조건에서 최적화
  if (effectiveType === '2g' || effectiveType === 'slow-2g' || saveData) {
    console.log('저품질 네트워크 감지. 데이터 사용량 최적화...');
    
    // 이미지 품질 줄이기
    document.querySelectorAll('img').forEach(img => {
      if (!img.classList.contains('low-quality') && !img.src.includes('data:image')) {
        img.classList.add('low-quality');
        img.setAttribute('loading', 'lazy');
      }
    });
    
    // 자동 데이터 새로고침 빈도 줄이기
    window.lowNetworkQuality = true;
  } else {
    // 좋은 네트워크 상태에서는 최적화 해제
    if (window.lowNetworkQuality) {
      window.lowNetworkQuality = false;
      
      // 이미지 품질 복원
      document.querySelectorAll('img.low-quality').forEach(img => {
        img.classList.remove('low-quality');
      });
    }
  }
}

/**
 * 오프라인 모드 활성화
 */
function enableOfflineMode() {
  // 오프라인 상태 UI 표시
  const offlineNotification = document.createElement('div');
  offlineNotification.className = 'offline-notification';
  offlineNotification.textContent = '오프라인 모드 - 마지막으로 저장된 데이터를 표시합니다';
  document.body.appendChild(offlineNotification);
  
  // 자동 데이터 로드 중지
  window.isOffline = true;
  
  // API 요청하는 버튼 비활성화
  document.querySelectorAll('button[data-api-action]').forEach(btn => {
    btn.disabled = true;
    btn.setAttribute('data-offline-disabled', 'true');
  });
}

/**
 * 네트워크 재연결 시 데이터 동기화
 */
function syncDataOnNetworkReconnect() {
  // 오프라인 알림 제거
  const offlineNotification = document.querySelector('.offline-notification');
  if (offlineNotification) {
    offlineNotification.remove();
  }
  
  // 오프라인 플래그 제거
  window.isOffline = false;
  
  // 비활성화된 버튼 다시 활성화
  document.querySelectorAll('button[data-offline-disabled="true"]').forEach(btn => {
    btn.disabled = false;
    btn.removeAttribute('data-offline-disabled');
  });
  
  // 필수 데이터 새로 로드
  if (window.refreshData && typeof window.refreshData === 'function') {
    console.log('네트워크 재연결됨. 데이터 새로고침...');
    window.refreshData();
  }
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
  },
  
  // 지역 데이터 로드
  loadAreaData: (areaId) => {
    try {
      const cached = localStorage.getItem(`area_${areaId}`);
      if (!cached) return null;
      
      const cacheItem = JSON.parse(cached);
      const now = Date.now();
      
      // 캐시 유효성 검사
      const isEssentialArea = essentialAreas.includes(areaId);
      const maxAge = isEssentialArea ? 30 * 60 * 1000 : 3 * 60 * 60 * 1000; // 중요 지역 30분, 기타 3시간
      
      if (cacheItem.version !== '1.0' || now - cacheItem.timestamp > maxAge) {
        localStorage.removeItem(`area_${areaId}`);
        return null;
      }
      
      return cacheItem.data;
    } catch (error) {
      console.error(`${areaId} 캐시 로드 중 오류:`, error);
      return null;
    }
  }
};

// 성능 측정 유틸리티
export const measurePerformance = (name, fn, ...args) => {
  console.time(name);
  const result = fn(...args);
  console.timeEnd(name);
  return result;
};

// 앱 초기화 시 자동 최적화 실행
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      optimizeResources();
    }, 2000); // 페이지 로드 후 2초 후 최적화 실행
  });
}

// UI 갱신 제한 유틸리티
export const throttleUIUpdates = (callback, limit = 100) => {
  let waiting = false;
  return function() {
    if (!waiting) {
      callback.apply(this, arguments);
      waiting = true;
      requestAnimationFrame(() => {
        waiting = false;
      });
    }
  };
};

// 외부에서 사용할 최적화 기능 추가 내보내기
export const performanceUtils = {
  optimizeResources,
  measurePerformance,
  throttleUIUpdates,
  getCacheStatus,
  isInViewport,
  debounce
};

export default performanceUtils;