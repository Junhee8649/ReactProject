import React from 'react';
import usePopulationStore from '../store/populationStore';

const AreaSearch = () => {
  const { 
    searchText, 
    searchResults, 
    searchAreas, 
    selectArea, 
    isLoading
  } = usePopulationStore();
  
  return (
    <div className="area-search">
      <h3>지역 검색</h3>
      <div className="search-container">
        <input
          type="text"
          value={searchText}
          onChange={(e) => searchAreas(e.target.value)}
          placeholder="지역명 검색 (예: 강남, 홍대, 사당역)"
          className="search-input"
          disabled={isLoading}
        />
        <button className="search-button" disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(area => (
            <div 
              key={area.id}
              className="search-result-item"
              onClick={() => selectArea(area.id)}
            >
              {area.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AreaSearch;