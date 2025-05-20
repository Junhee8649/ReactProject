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
    dataCollectionStatus,
    isCollectingPreferredData, // 추가: 선호 카테고리 데이터 수집 중 상태
    preferredCategoriesDataStatus, // 추가: 선호 카테고리 데이터 수집 진행 상태
    areaCategories,
    cacheStatus  // 추가: 캐시 상태 정보 가져오기
  } = usePopulationStore();
  
  // 사용할 추천 목록 결정 (전역 추천이 있으면 우선 사용)
  const placesToShow = globalRecommendations.length > 0 
    ? globalRecommendations 
    : recommendedPlaces;
  
  if (!showRecommendations) {
    return null;
  }
  
  // 카테고리 이름 찾기 헬퍼 함수
  const getCategoryName = (categoryId) => {
    if (!areaCategories || areaCategories.length === 0) return categoryId;
    const category = areaCategories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };
  
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
        
        {/* 선호 카테고리 데이터 수집 중 상태 표시 */}
        {isCollectingPreferredData && (
          <div className="data-collection-progress">
            <div className="loading-spinner"></div>
            <div className="progress-info">
              <h3>선호하신 카테고리의 데이터를 수집 중입니다</h3>
              <p>더 정확한 추천을 위해 선택하신 장소 유형의 데이터를 우선 수집합니다.</p>
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.round((preferredCategoriesDataStatus.progress / preferredCategoriesDataStatus.total) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="progress-text">
                  {preferredCategoriesDataStatus.progress} / {preferredCategoriesDataStatus.total} 장소 로드됨 
                  ({Math.round((preferredCategoriesDataStatus.progress / preferredCategoriesDataStatus.total) * 100)}%)
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 일반 데이터 수집 상태 표시 - 선호 카테고리 데이터 수집 중이 아닐 때만 */}
        {!isCollectingPreferredData && dataCollectionStatus.loaded < dataCollectionStatus.total && (
          <div className="recommendation-data-status">
            <div className="data-status-icon">ℹ️</div>
            <div className="data-status-text">
              현재 {dataCollectionStatus.loaded}개 지역의 데이터가 수집되었습니다.
              데이터 수집이 진행될수록 더 정확한 추천이 제공됩니다.
            </div>
          </div>
        )}
        
        <div className="recommendation-summary">
          {/* 추천 범위 표시 */}
          <div className="recommendation-scope">
            {placesToShow === globalRecommendations && globalRecommendations.length > 0 ? (
              <div className="global-recommendation-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>서울 전역에서 찾은 추천 장소입니다 ({cacheStatus.areaCount}개 지역 데이터 기반)</span>
              </div>
            ) : (
              <div className="local-recommendation-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>현재 선택한 지역 주변에서만 찾은 추천입니다</span>
              </div>
            )}
          </div>
          
          {/* 선호도 알림 메시지 */}
          {(!userPreferences.categories || userPreferences.categories.length === 0) && (
            <div className="preference-alert">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>관심 장소 유형을 선택하지 않아 일반적인 인기 장소를 기준으로 추천합니다. 더 맞춤화된 추천을 원하시면 선호도 설정에서 관심 장소 유형을 선택해주세요.</span>
            </div>
          )}
          
          <div className="preference-summary">
            <h4>현재 설정된 선호도:</h4>
            <ul>
              <li>장소 분위기: {userPreferences.preferQuiet ? '조용한 곳' : '활기찬 곳'}</li>
              <li>선호 나이대: {userPreferences.preferredAgeGroup.replace('s', '대')}</li>
              {userPreferences.categories && userPreferences.categories.length > 0 && (
                <li>
                  선호 카테고리: {userPreferences.categories.map(catId => getCategoryName(catId)).join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
        
        {/* 추천 목록 섹션 - 데이터 수집 중이 아니고 추천이 있을 때만 */}
        {!isCollectingPreferredData && (
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
        )}
        
        {/* 하단 정보 */}
        <div className="recommendation-source">
          <small>
            마지막 업데이트: {new Date().toLocaleString()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default RecommendedPlaces;