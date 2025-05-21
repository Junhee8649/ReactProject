import React from 'react';
import usePopulationStore from '../store/populationStore';

const DataCollectionStatus = () => {
  const { 
    dataCollectionStatus, 
    startDataCollection, 
    pauseDataCollection,
    togglePauseDataCollection,
    globalRecommendations,
    cacheStatus
  } = usePopulationStore();
  
  // 진행률 계산 - 더 간단하게
  const progress = Math.round((dataCollectionStatus.loaded / dataCollectionStatus.total) * 100);
  
  // 진행 중일 때는 간결한 형태로 표시
  if (dataCollectionStatus.inProgress) {
    return (
      <div className="data-collection-status collecting">
        <div className="collection-status">
          <div className="loading-spinner-small"></div>
          <span>데이터 수집 중... {progress}%</span>
          <button 
            className="pause-button"
            onClick={togglePauseDataCollection}
            title={pauseDataCollection ? "데이터 수집 재개" : "일시 중지"}
          >
            {pauseDataCollection ? "▶" : "⏸"}
          </button>
        </div>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // 모든 핵심 지역 로드 확인
  const allImportantAreasLoaded = dataCollectionStatus.loaded >= dataCollectionStatus.total;
  
  // 진행 중이 아니고 아직 완료되지 않은 경우
  if (!allImportantAreasLoaded) {
    return (
      <div className="data-collection-status">
        <div className="status-header">
          <h4>추천 시스템 데이터 수집</h4>
          {!dataCollectionStatus.inProgress && (
            <button onClick={startDataCollection} className="start-collection-btn">
              {dataCollectionStatus.loaded > 0 ? '계속 수집' : '데이터 수집 시작'}
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
            <span>{dataCollectionStatus.loaded} / {dataCollectionStatus.total} 핵심 지역 로드됨</span>
            <span className="progress-info">
              {dataCollectionStatus.loaded > 0 && globalRecommendations.length > 0 ? 
                " (기본 추천 가능)" : 
                " (총 120개 지역 중 핵심 지역 우선 로드 중)"}
            </span>
          </div>
        </div>
      </div>
    );
  }
  
  // 완료된 경우 간단한 표시
  return (
    <div className="collection-complete">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>
        핵심 지역 데이터 수집 완료 ({dataCollectionStatus.loaded}/{dataCollectionStatus.total}개 핵심 지역).
        전체 {cacheStatus.areaCount}개/{120}개 지역 데이터 보유 중.
        {cacheStatus.areaCount > 30 ? " 정확한 추천이 가능합니다." : " 기본 추천이 가능합니다."}
      </span>
      
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