import React, { useEffect } from 'react';
import PopulationMap from './components/PopulationMap';
import AgeGroupFilter from './components/AgeGroupFilter';
import AreaSearch from './components/AreaSearch';
import AreaCategories from './components/AreaCategories';
import PlaceDetail from './components/PlaceDetail';
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
    error 
  } = usePopulationStore();
  
  // 애플리케이션 마운트시 데이터 로드
  useEffect(() => {
    fetchAreas(); // 지역 목록 가져오기
    fetchData();
    
    // 실시간 업데이트를 위한 인터벌 설정 (3분)
    const intervalId = setInterval(() => {
      fetchData();
    }, 3 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchData, fetchAreas]);
  
  // 선택된 지역 이름 가져오기
  const getSelectedAreaName = () => {
    if (!selectedArea) return null;
    return availableAreas.find(a => a.id === selectedArea)?.name || selectedArea;
  };
  
  return (
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
        
        {selectedPlace && <PlaceDetail />}
      </main>
      
      <footer className="app-footer">
        <p>© 2025 서울시 실시간 인구 핫스팟 | 서울 열린데이터 광장 API 활용</p>
        <small>데이터 출처: 서울시 공공데이터</small>
      </footer>
    </div>
  );
}

export default PopulationApp;