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
    isLoading
  } = usePopulationStore();
  
  // PlaceDetail 컴포넌트에 대한 ref 생성
  const placeDetailRef = useRef(null);
  
  // 앱 초기화 시 필요한 데이터 로드
  useEffect(() => {
    // 지역 목록 가져오기
    fetchAreas();
    
    // 실시간 업데이트를 위한 인터벌 설정 (3분에서 5분으로 변경)
    const intervalId = setInterval(() => {
      fetchData(null, true); // 현재 표시 중인 지역 데이터 새로고침
    }, 5 * 60 * 1000); // 5분으로 변경
    
    // 백그라운드 데이터 수집 지연 시작 (5초에서 10초로 변경)
    const collectionTimeout = setTimeout(() => {
      if (!isLoading) {
        // 리소스 최적화 함수 실행 추가
        optimizeResources();
        // 데이터 수집 시작
        startDataCollection();
      }
    }, 10000); // 10초로 변경
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(collectionTimeout);
    };
  }, [fetchData, fetchAreas, startDataCollection, optimizeResources, isLoading]);
  
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