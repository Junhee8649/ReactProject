// frontend/src/components/UserPreferences.jsx
import React from 'react';
import usePopulationStore from '../store/populationStore';

const UserPreferences = () => {
  const { userPreferences, updateUserPreference, toggleRecommendations } = usePopulationStore();
  
  return (
    <div className="user-preferences">
      <h3>나의 선호도 설정</h3>
      <div className="preferences-container">
        {/* 조용한 곳 선호 설정 */}
        <div className="preference-item">
          <span className="preference-label">장소 분위기 선호도:</span>
          <div className="toggle-buttons">
            <button 
              className={`toggle-btn ${userPreferences.preferQuiet ? 'active' : ''}`}
              onClick={() => updateUserPreference('preferQuiet', true)}
            >
              조용한 곳
            </button>
            <button 
              className={`toggle-btn ${!userPreferences.preferQuiet ? 'active' : ''}`}
              onClick={() => updateUserPreference('preferQuiet', false)}
            >
              활기찬 곳
            </button>
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
        
        {/* 혼잡한 곳 피하기 설정 */}
        <div className="preference-item">
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={userPreferences.avoidCrowds}
              onChange={(e) => updateUserPreference('avoidCrowds', e.target.checked)}
            />
            <span>혼잡한 곳 피하기</span>
          </label>
        </div>
      </div>
      
      <button 
        className="recommendation-btn"
        onClick={toggleRecommendations}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"></path>
        </svg>
        내게 맞는 장소 추천받기
      </button>
    </div>
  );
};

export default UserPreferences;