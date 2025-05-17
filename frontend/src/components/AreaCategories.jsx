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
              {category.name}
            </button>
            
            {activeCategory === category.id && (
              <div className="category-areas">
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