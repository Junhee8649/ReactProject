// frontend/src/components/AreaSearch.jsx
import React, { useState } from 'react';
import usePopulationStore from '../store/populationStore';

const AreaSearch = () => {
  const { 
    searchText, 
    searchResults, 
    searchAreas, 
    selectArea, 
    fetchData,
    searchFeedback,
    setSearchFeedback,
    isLoading
  } = usePopulationStore();
  
  // 직접 검색 처리
  const handleDirectSearch = () => {
    if (searchText && searchText.trim().length > 1) {
      // 직접 입력 검색 실행
      fetchData(searchText.trim());
    }
  };
  
  return (
    <div className="area-search">
      <h3>지역 검색</h3>
      <div className="search-container">
        <input
          type="text"
          value={searchText}
          onChange={(e) => searchAreas(e.target.value)}
          placeholder="지역명 검색 (예: 강남, 홍대, 명동)"
          className="search-input"
          disabled={isLoading}
        />
        <button 
          className="search-button" 
          disabled={isLoading}
          onClick={() => searchText.trim() && handleDirectSearch()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      {searchFeedback && (
        <div className="search-feedback">
          {searchFeedback}
        </div>
      )}
      
      {searchText.trim() !== '' && searchResults.length === 0 && (
        <div className="search-no-results">
          <p>검색 결과가 없습니다.</p>
          <small>원하는 지역명을 직접 입력해 검색할 수 있습니다:</small>
          <button 
            className="direct-search-btn"
            onClick={handleDirectSearch}
            disabled={isLoading}
          >
            "{searchText}" 직접 검색하기
          </button>
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map(area => (
            <div 
              key={area.id}
              className="search-result-item"
              onClick={() => selectArea(area.id)}
            >
              <span className="result-name">{area.name}</span>
              {area.category && (
                <span className="result-category">
                  {area.category === 'tourist' ? '관광특구' : 
                   area.category === 'station' ? '주요역' :
                   area.category === 'park' ? '공원' :
                   area.category === 'shopping' ? '쇼핑' :
                   area.category === 'heritage' ? '고궁·문화유산' : 
                   area.category}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AreaSearch;