// frontend/src/components/DataCollectionStatus.jsx
import React from 'react';
import usePopulationStore from '../store/populationStore';

const DataCollectionStatus = () => {
  const { 
    dataCollectionStatus, 
    startDataCollection, 
    globalRecommendations,
    cacheStatus
  } = usePopulationStore();
  
  const progress = Math.round((dataCollectionStatus.loaded / dataCollectionStatus.total) * 100);
  
  return (
    <div className="data-collection-status">
      {dataCollectionStatus.loaded < dataCollectionStatus.total && (
        <>
          <div className="status-header">
            <h4>추천 시스템 데이터 수집</h4>
            {!dataCollectionStatus.inProgress && dataCollectionStatus.loaded < dataCollectionStatus.total && (
              <button onClick={startDataCollection} className="start-collection-btn">
                계속 수집
              </button>
            )}
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {dataCollectionStatus.loaded} / {dataCollectionStatus.total} 지역 로드됨
              {dataCollectionStatus.loaded > 0 && globalRecommendations.length > 0 && (
                <span className="progress-note"> (일부 추천 가능)</span>
              )}
            </div>
          </div>
          
          {dataCollectionStatus.inProgress && (
            <div className="collection-status">
              <div className="loading-spinner-small"></div>
              <span>데이터 수집 중...</span>
            </div>
          )}
        </>
      )}
      
      {dataCollectionStatus.loaded === dataCollectionStatus.total && (
        <div className="collection-complete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>모든 지역 데이터가 수집되었습니다. 정확한 추천이 가능합니다.</span>
        </div>
      )}
      
      {/* 캐시 크기 및 마지막 업데이트 정보 (선택 사항) */}
      {cacheStatus && cacheStatus.lastUpdated && (
        <div className="cache-info">
          <small>
            최근 업데이트: {new Date(cacheStatus.lastUpdated).toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};

export default DataCollectionStatus;