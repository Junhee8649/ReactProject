// frontend/src/components/UserPreferences.jsx
import React from 'react';
import usePopulationStore from '../store/populationStore';

const UserPreferences = () => {
  const { 
    userPreferences, 
    updateUserPreference, 
    toggleCategoryPreference,
    toggleRecommendations,
    dataCollectionStatus,
    areaCategories,
    startDataCollection
  } = usePopulationStore();
  
  // 안전 조치: 없는 경우 빈 배열로 처리
  const categories = userPreferences.categories || [];
  
  return (
    <div className="user-preferences">
      <h3>나의 선호도 설정</h3>
      <div className="preferences-container">
        {/* 장소 분위기 선호도 - 통합된 UI */}
        <div className="preference-item">
          <span className="preference-label">선호하는 장소 분위기:</span>
          <div className="toggle-buttons">
            <button 
              className={`toggle-btn ${userPreferences.preferQuiet ? 'active' : ''}`}
              onClick={() => updateUserPreference('preferQuiet', true)}
            >
              조용하고 여유로운 곳
            </button>
            <button 
              className={`toggle-btn ${!userPreferences.preferQuiet ? 'active' : ''}`}
              onClick={() => updateUserPreference('preferQuiet', false)}
            >
              활기차고 북적이는 곳
            </button>
          </div>
        </div>
        
        {/* 관심 장소 유형 */}
        <div className="preference-item">
          <span className="preference-label">관심 장소 유형: <small>(여러 개 선택 가능)</small></span>
          <div className="category-filters">
            {areaCategories && areaCategories.map(category => (
              <label key={category.id} className="category-checkbox">
                <input
                  type="checkbox"
                  checked={categories.includes(category.id)}
                  onChange={() => toggleCategoryPreference(category.id)}
                />
                <span>{category.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* 선호 나이대 설정 */}
        <div className="preference-item">
          <span className="preference-label">선호 나이대:</span>
          <select 
            value={userPreferences.preferredAgeGroup}
            onChange={(e) => updateUserPreference('preferredAgeGroup', e.target.value)}
            className="age-select"
          >
            <option value="10s">10대</option>
            <option value="20s">20대</option>
            <option value="30s">30대</option>
            <option value="40s">40대</option>
            <option value="50s">50대</option>
            <option value="60s">60대</option>
            <option value="70s">70대 이상</option>
          </select>
        </div>
      </div>
      
      <button 
        className="recommendation-btn"
        onClick={() => {
          // 데이터 수집이 아직 완료되지 않았다면 시작
          if (dataCollectionStatus.loaded < dataCollectionStatus.total) {
            startDataCollection();
          }
          // 추천 모달 표시
          toggleRecommendations();
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"></path>
        </svg>
        내게 맞는 장소 추천받기
        {dataCollectionStatus.loaded > 0 && dataCollectionStatus.loaded < dataCollectionStatus.total && (
          <span className="recommendation-badge">
            {Math.round((dataCollectionStatus.loaded / dataCollectionStatus.total) * 100)}% 데이터
          </span>
        )}
      </button>
    </div>
  );
};

export default UserPreferences;