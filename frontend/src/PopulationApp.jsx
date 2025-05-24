import React, { useEffect, useRef, useCallback } from 'react';
import PopulationMap from './components/PopulationMap';
import AreaSearch from './components/AreaSearch';
import AreaCategories from './components/AreaCategories';
import PlaceDetail from './components/PlaceDetail';
import UserPreferences from './components/UserPreferences';
import RecommendedPlaces from './components/RecommendedPlaces';
import DataCollectionStatus from './components/DataCollectionStatus';
import { optimizeResources } from './utils/performanceUtils';
import usePopulationStore from './store/populationStore';
import './PopulationApp.css';

function PopulationApp() {
  const { 
    selectedPlace, 
    selectedArea,
    lastUpdated, 
    fetchData, 
    fetchAreas,
    initializeStore, 
    selectArea,
    availableAreas,
    error,
    optimizeResources: storeOptimizeResources
  } = usePopulationStore();
  
  // 초기화 플래그용 ref 추가
  const isInitializedRef = useRef(false);
  const placeDetailRef = useRef(null);
  
  // 최적화: 데이터 새로고침 함수 메모이제이션하여 불필요한 렌더링 방지
  const refreshData = useCallback(() => {
    if (selectedArea) {
      fetchData(null, true); // 현재 표시 중인 지역 데이터 새로고침
    }
  }, [selectedArea, fetchData]);
  
  // 앱 초기화 시 필요한 데이터 로드 - LoadingSequence 로직 통합
  useEffect(() => {
    // 이미 초기화되었으면 실행하지 않음
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    console.log("앱 초기화 시작");
    
    // ⭐ 핵심: 스토어 초기화 먼저 실행 (기존 LoadingSequence 역할)
    initializeStore();
    
    // 지역 목록 가져오기 (한 번만 실행)
    fetchAreas();
    
    // 성능 최적화 실행
    optimizeResources(usePopulationStore);
    
    // 스토어의 최적화 함수도 실행
    if (typeof storeOptimizeResources === 'function') {
      storeOptimizeResources();
    }
    
    // 최적화: 실시간 업데이트를 위한 인터벌 관리 개선
    let intervalId;
    
    const setupDataRefresh = () => {
      // 기존 인터벌 정리
      if (intervalId) clearInterval(intervalId);
      
      // 3분 주기로 데이터 새로고침
      intervalId = setInterval(() => {
        refreshData();
      }, 3 * 60 * 1000);
      
      console.log("데이터 자동 새로고침 설정 완료 (3분 간격)");
    };
    
    // 초기 설정
    setupDataRefresh();
    
    // 네트워크 상태 변화 감지하여 자동 새로고침 최적화
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        console.log("네트워크 연결 복원됨, 데이터 갱신");
        refreshData();
        setupDataRefresh(); // 인터벌 재설정
      } else {
        console.log("네트워크 연결 끊김, 자동 갱신 중지");
        if (intervalId) clearInterval(intervalId);
      }
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // 정리 함수
    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      console.log("앱 리소스 정리 완료");
    };
  }, [fetchAreas, fetchData, initializeStore, storeOptimizeResources, refreshData]); // ⭐ initializeStore 의존성 추가
  
  // 선택된 지역 이름 가져오기 - 최적화
  const getSelectedAreaName = useCallback(() => {
    if (!selectedArea) return null;
    return availableAreas.find(a => a.id === selectedArea)?.name || selectedArea;
  }, [selectedArea, availableAreas]);
  
  // 최적화: selectedPlace 변경 시에만 스크롤 처리
  useEffect(() => {
    if (selectedPlace && placeDetailRef.current) {
      // requestAnimationFrame 사용하여 렌더링 최적화
      requestAnimationFrame(() => {
        placeDetailRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      });
    }
  }, [selectedPlace]);
  
  return (
    <>
      {/* ❌ LoadingSequence 제거 - 즉시 사용 가능한 UI 제공 */}
      {/* <LoadingSequence /> */}
      
      <div className="app-container">
        <header className="app-header">
          <h1>서울시 실시간 인구 핫스팟</h1>
          {lastUpdated && (
            <p className="last-updated">
              마지막 업데이트: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </header>
        
        <main className="main-content">
          <div className="control-panel">
            <AreaSearch />
            <AreaCategories />
          </div>
          
          {/* ✅ 핵심 지역 데이터 수집 상태 표시 - 기술적 도전성 증명 */}
          <DataCollectionStatus />
          
          {/* 사용자 선호도 컴포넌트 */}
          <UserPreferences />
          
          {selectedArea && (
            <div className="selected-area-info">
              선택된 지역: <strong>{getSelectedAreaName()}</strong>
              <button 
                className="clear-btn"
                onClick={() => selectArea(null)}
              >
                초기화
              </button>
            </div>
          )}
          
          <PopulationMap />
          
          {error && (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              {error}
            </div>
          )}
          
          {selectedPlace && (
            <div ref={placeDetailRef}>
              <PlaceDetail />
            </div>
          )}
          
          {/* 추천 장소 모달 컴포넌트 */}
          <RecommendedPlaces />
        </main>
        
        <footer className="app-footer">
          <p>© 2025 서울시 실시간 인구 핫스팟 | 서울 열린데이터 광장 API 활용</p>
          <small>데이터 출처: 서울시 공공데이터</small>
        </footer>
      </div>
    </>
  );
}

export default PopulationApp;