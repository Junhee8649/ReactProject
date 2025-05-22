import React, { useState, useEffect } from 'react';
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
    isLoading,
    selectedArea,
    availableAreas
  } = usePopulationStore();
  
  const [lastSearched, setLastSearched] = useState('');
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);
  
  // 인기 지역 리스트 - 실제 데이터에 맞게 조정 필요
  const popularAreas = [
    '강남 MICE 관광특구', '명동 관광특구', '홍대 관광특구', 
    '동대문 관광특구', '경복궁', '서울역'
  ];
  
  // 검색어와 유사한 지역 찾기
  const getSimilarAreas = (query) => {
    if (!query || !availableAreas || availableAreas.length === 0) {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    return availableAreas
      .filter(area => 
        area.name.toLowerCase().includes(lowerQuery) || 
        (area.keywords && area.keywords.some(k => k.includes(lowerQuery)))
      )
      .slice(0, 3); // 상위 3개만 보여주기
  };
  
  // 재검색 처리
  const handleResearch = () => {
    if (selectedArea) {
      selectArea(selectedArea);
      setSearchFeedback("선택된 지역 데이터를 새로고침합니다.");
    } else if (lastSearched) {
      fetchData(lastSearched, true);
      setSearchFeedback(`"${lastSearched}" 데이터를 새로고침합니다.`);
    }
  };
  
  // 검색 입력창 변경 핸들러
  const handleSearchInputChange = (e) => {
    searchAreas(e.target.value);
    
    if (e.target.value.trim() !== '') {
      setIsSearchResultsVisible(true);
    } else {
      setIsSearchResultsVisible(false);
    }
  };
  
  // 검색 결과 아이템 선택 핸들러
  const handleSelectArea = (areaId) => {
    selectArea(areaId);
    setIsSearchResultsVisible(false);
  };
  
  // 검색창 포커스 핸들러
  const handleSearchFocus = () => {
    if (searchText.trim() !== '') {
      setIsSearchResultsVisible(true);
    }
  };
  
  // 검색 결과 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSearchResultsVisible && !event.target.closest('.area-search')) {
        setIsSearchResultsVisible(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchResultsVisible]);
  
  return (
    <div className="area-search">
      <h3>지역 검색</h3>
      
      <div className="search-input-container">
        <div className="search-container">
          <input
            type="text"
            value={searchText}
            onChange={handleSearchInputChange}
            onFocus={handleSearchFocus}
            placeholder="지역명 검색 (예: 강남, 홍대, 명동)"
            className="search-input"
            disabled={isLoading}
          />
          <button 
            className="search-button" 
            disabled={isLoading}
            onClick={() => searchText.trim() && selectArea(searchText.trim())}
            title="검색"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        
        {/* 검색 결과 - 검색창 바로 아래에 위치 */}
        {isSearchResultsVisible && searchText.trim() !== '' && (
          <div className="search-results">
            {searchResults.length > 0 ? (
              // 검색 결과가 있는 경우
              searchResults.map(area => (
                <div 
                  key={area.id}
                  className="search-result-item"
                  onClick={() => handleSelectArea(area.id)}
                >
                  <span className="result-name">{area.name}</span>
                  {area.category && (
                    <span className="result-category">
                      {area.category === 'tourist' ? '관광특구' : 
                       area.category === 'station' ? '주요역' :
                       area.category === 'park' ? '공원' :
                       area.category === 'shopping' ? '발달상권' :
                       area.category === 'heritage' ? '고궁·문화유산' : 
                       area.category}
                    </span>
                  )}
                </div>
              ))
            ) : (
              // 검색 결과가 없는 경우 - 인기/추천 지역 표시
              <div className="no-results-content">
                <p>검색 결과가 없습니다. 인기 지역을 확인해보세요:</p>
                <div className="suggested-areas">
                  {/* 인기 지역 표시 */}
                  {popularAreas.slice(0, 3).map((areaName, index) => {
                    const area = availableAreas.find(a => a.name === areaName);
                    if (!area) return null;
                    
                    return (
                      <div 
                        key={index}
                        className="suggested-area-item"
                        onClick={() => handleSelectArea(area.id)}
                      >
                        <span className="suggestion-icon">🔍</span>
                        <span>{area.name}</span>
                      </div>
                    );
                  })}
                  
                  {/* 유사한 지역 표시 */}
                  {getSimilarAreas(searchText).map((area, index) => (
                    <div 
                      key={`similar-${index}`}
                      className="suggested-area-item"
                      onClick={() => handleSelectArea(area.id)}
                    >
                      <span className="suggestion-icon">📍</span>
                      <span>{area.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* 검색 피드백 표시 */}
      {searchFeedback && (
        <div className="search-feedback">
          {searchFeedback}
        </div>
      )}
      
      {/* 재검색 버튼은 검색 결과 영역과 분리하여 아래에 배치 */}
      {(selectedArea || lastSearched) && (
        <button 
          className="refresh-search-btn"
          onClick={handleResearch}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
          </svg>
          {selectedArea ? '선택 지역 새로고침' : `"${lastSearched}" 재검색`}
        </button>
      )}
      
      {/* 모바일용 오버레이 배경 */}
      {isSearchResultsVisible && searchText.trim() !== '' && (
        <div className="search-overlay" onClick={() => setIsSearchResultsVisible(false)}></div>
      )}
    </div>
  );
};

export default AreaSearch;