// frontend/src/components/RecommendedPlaces.jsx
import React from 'react';
import usePopulationStore from '../store/populationStore';

const RecommendedPlaces = () => {
  const { 
    recommendedPlaces,       // 현재 지역 내 추천
    globalRecommendations,   // 전역 추천 (모든 수집된 지역 기반)
    showRecommendations, 
    toggleRecommendations,
    selectPlace,
    getCongestionColor,
    userPreferences,
    dataCollectionStatus
  } = usePopulationStore();
  
  // 사용할 추천 목록 결정 (전역 추천이 있으면 우선 사용)
  const placesToShow = globalRecommendations.length > 0 
    ? globalRecommendations 
    : recommendedPlaces;
  
  if (!showRecommendations) {
    return null;
  }
  
  return (
    <div className="recommended-places-modal">
      <div className="recommendation-content">
        <div className="recommendation-header">
          <h2>당신을 위한 추천 장소</h2>
          <button className="close-btn" onClick={toggleRecommendations}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        {/* 데이터 수집 상태 표시 */}
        {dataCollectionStatus.loaded < dataCollectionStatus.total && (
          <div className="recommendation-data-status">
            <div className="data-status-icon">ℹ️</div>
            <div className="data-status-text">
              현재 {dataCollectionStatus.loaded}/{dataCollectionStatus.total} 지역의 데이터가 수집되었습니다.
              데이터 수집이 완료되면 더 정확한 추천이 제공됩니다.
            </div>
          </div>
        )}
        
        <div className="recommendation-summary">
          <div className="preference-summary">
            <h4>현재 설정된 선호도:</h4>
            <ul>
              <li>장소 분위기: {userPreferences.preferQuiet ? '조용한 곳' : '활기찬 곳'}</li>
              <li>선호 나이대: {userPreferences.preferredAgeGroup.replace('s', '대')}</li>
              <li>혼잡한 곳 피하기: {userPreferences.avoidCrowds ? '예' : '아니오'}</li>
            </ul>
          </div>
        </div>
        
        <div className="recommended-list">
          {placesToShow.length > 0 ? (
            placesToShow.map((place, index) => (
              <div key={place.id} className="recommended-item">
                <div className="recommendation-rank">
                  <span className="rank-number">{index + 1}</span>
                </div>
                <div className="recommendation-details">
                  <h3>{place.name}</h3>
                  <div className="recommendation-stats">
                    <div 
                      className="recommendation-congestion"
                      style={{ backgroundColor: getCongestionColor(place.congestionLevel) }}
                    >
                      {place.congestionLevel}
                    </div>
                    <div className="recommendation-age">
                      {userPreferences.preferredAgeGroup} 비율: {place.ageGroups[userPreferences.preferredAgeGroup].toFixed(1)}%
                    </div>
                  </div>
                  <div className="recommendation-reasons">
                    <h4>추천 이유:</h4>
                    <ul>
                      {place.matchReason.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    className="recommendation-select-btn"
                    onClick={() => {
                      selectPlace(place.id);
                      toggleRecommendations();
                      
                      // 지도 영역으로 스크롤
                      const mapElement = document.querySelector('.map-container');
                      if (mapElement) {
                        mapElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    이 장소로 이동
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-recommendations">
              <p>현재 설정에 맞는 추천 장소를 찾을 수 없습니다.</p>
              <p>선호도 설정을 변경해보세요.</p>
            </div>
          )}
        </div>
        
        {/* 데이터 출처 표시 */}
        <div className="recommendation-source">
          <small>
            {globalRecommendations.length > 0 
              ? `${dataCollectionStatus.loaded}개 지역의 데이터를 분석한 추천입니다.`
              : '현재 표시 중인 지역의 데이터만 분석한 추천입니다.'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default RecommendedPlaces;