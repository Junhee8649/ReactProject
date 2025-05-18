// frontend/src/components/RecommendedPlaces.jsx
import React from 'react';
import usePopulationStore from '../store/populationStore';

const RecommendedPlaces = () => {
  const { 
    recommendedPlaces, 
    showRecommendations, 
    toggleRecommendations,
    selectPlace,
    getCongestionColor,
    userPreferences
  } = usePopulationStore();
  
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
          {recommendedPlaces.length > 0 ? (
            recommendedPlaces.map((place, index) => (
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
      </div>
    </div>
  );
};

export default RecommendedPlaces;