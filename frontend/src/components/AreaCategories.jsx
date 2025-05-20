import React, { useState } from 'react';
import usePopulationStore from '../store/populationStore';

const AreaCategories = () => {
  const { areaCategories, availableAreas, selectArea } = usePopulationStore();
  const [activeCategory, setActiveCategory] = useState(null);
  
  // 카테고리별 지역 필터링
  const getAreasByCategory = (categoryId) => {
    return availableAreas.filter(area => area.category === categoryId);
  };
  
  const toggleCategory = (categoryId) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
    }
  };
  
  // 카테고리 아이콘 매핑
  const getCategoryIcon = (categoryId) => {
    switch(categoryId) {
      case 'tourist':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11l18-5v12L3 14v-3z"></path>
            <path d="M11.6 16.8a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0Z"></path>
          </svg>
        ); // 관광특구
      case 'heritage':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="12" width="20" height="10" rx="2"></rect>
            <path d="M7 12V6a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v6"></path>
            <path d="M5 12v-2a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2"></path>
            <path d="M12 19v-5"></path>
          </svg>
        ); // 고궁·문화유산
      case 'station':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2"></rect>
            <path d="M9 22v-4h6v4"></path>
            <circle cx="9" cy="9" r="1"></circle>
            <circle cx="15" cy="9" r="1"></circle>
            <path d="M8 14h8a2 2 0 0 0 2-2v-1H6v1a2 2 0 0 0 2 2Z"></path>
          </svg>
        ); // 주요역
      case 'shopping':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        ); // 발달상권
      case 'park':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8c0 4.5-6 9-6 9s-6-4.5-6-9a6 6 0 0 1 12 0Z"></path>
            <circle cx="12" cy="8" r="2"></circle>
          </svg>
        ); // 공원
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
        );
    }
  };
  
  if (!areaCategories || areaCategories.length === 0) {
    return null; // 카테고리가 로드되지 않았으면 아무것도 표시하지 않음
  }
  
  return (
    <div className="area-categories">
      <h3>인기 카테고리</h3>
      <div className="category-buttons">
        {areaCategories.map(category => (
          <div key={category.id} className="category-dropdown">
            <button 
              className={`category-button ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => toggleCategory(category.id)}
            >
              <span className="category-icon">{getCategoryIcon(category.id)}</span>
              {category.name}
            </button>
            
            {activeCategory === category.id && (
              <div className="category-areas">
                <div className="category-areas-header">
                  <strong>{category.name} 인기 장소</strong>
                  <small>{getAreasByCategory(category.id).length}개 장소</small>
                </div>
                {getAreasByCategory(category.id).map(area => (
                  <div 
                    key={area.id}
                    className="category-area-item"
                    onClick={() => selectArea(area.id)}
                  >
                    {area.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AreaCategories;