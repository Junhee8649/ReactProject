// frontend/src/PopulationApp.jsx
import React, { useEffect, useRef } from 'react';
import PopulationMap from './components/PopulationMap';
import AgeGroupFilter from './components/AgeGroupFilter';
import AreaSearch from './components/AreaSearch';
import AreaCategories from './components/AreaCategories';
import PlaceDetail from './components/PlaceDetail';
import UserPreferences from './components/UserPreferences';
import RecommendedPlaces from './components/RecommendedPlaces';
import DataCollectionStatus from './components/DataCollectionStatus';
import LoadingSequence from './components/LoadingSequence';
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
    selectArea,
    availableAreas,
    startDataCollection,
    error,
    isLoading,
    isDataInitialized,  // 새로 추가할 상태
    setDataInitialized  // 새로 추가할 액션
  } = usePopulationStore();
  
    // 초기화 플래그용 ref 추가
    const isInitializedRef = useRef(false);
    
    // 앱 초기화 시 필요한 데이터 로드
    useEffect(() => {
      // 이미 초기화되었으면 실행하지 않음
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;
      
      // 지역 목록 가져오기 (한 번만 실행)
      fetchAreas();
      
      // 실시간 업데이트를 위한 인터벌 설정 (3분)
      const intervalId = setInterval(() => {
        if (selectedArea) {
          fetchData(null, true); // 현재 표시 중인 지역 데이터 새로고침
        }
      }, 3 * 60 * 1000);
      
      // 백그라운드 데이터 수집 - 초기 로드 후 한 번만 실행
      const collectionTimeout = setTimeout(() => {
        if (!isLoading) {
          startDataCollection();
          setDataInitialized(true);
        }
      }, 5000);
      
      return () => {
        clearInterval(intervalId);
        clearTimeout(collectionTimeout);
      };
    }, [fetchData, fetchAreas, startDataCollection, isLoading, setDataInitialized]);
  
  // 선택된 지역 이름 가져오기
  const getSelectedAreaName = () => {
    if (!selectedArea) return null;
    return availableAreas.find(a => a.id === selectedArea)?.name || selectedArea;
  };
  
  // selectedPlace가 변경될 때 자동 스크롤
  useEffect(() => {
    if (selectedPlace && placeDetailRef.current) {
      // 부드러운 스크롤로 PlaceDetail 컴포넌트로 이동
      placeDetailRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }, [selectedPlace]);
  
  return (
    <>
      <LoadingSequence />
      
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
            <AgeGroupFilter />
          </div>
          
          {/* 데이터 수집 상태 표시 */}
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
          
          {error && <div className="error-message">{error}</div>}
          
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