// frontend/src/components/AreaSearch.jsx - 개선된 버전
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
  
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);
  
  // 인기 지역 리스트
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
      .slice(0, 3);
  };
  
  // 선택된 지역 이름 가져오기
  const getSelectedAreaName = () => {
    if (!selectedArea) return null;
    const area = availableAreas.find(a => a.id === selectedArea);
    return area ? area.name : selectedArea;
  };
  
  // 🔧 개선된 새로고침 처리
  const handleRefreshSelectedArea = () => {
    if (!selectedArea) return;
    
    const areaName = getSelectedAreaName();
    console.log(`지역 데이터 강제 새로고침: ${areaName}`);
    
    // 강제 새로고침으로 최신 데이터 가져오기
    fetchData(selectedArea, true);
    setSearchFeedback(`"${areaName}" 지역의 최신 데이터를 가져오는 중입니다.`);
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
        
        {/* 검색 결과 */}
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
              // 검색 결과가 없는 경우
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
      
      {/* 🔧 개선된 새로고침 버튼 - 선택된 지역이 있을 때만 표시 */}
      {selectedArea && (
        <div className="refresh-section">
          <button 
            className="refresh-search-btn"
            onClick={handleRefreshSelectedArea}
            disabled={isLoading}
            title="선택된 지역의 최신 데이터를 가져옵니다"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/>
            </svg>
            {isLoading ? '새로고침 중...' : `"${getSelectedAreaName()}" 데이터 새로고침`}
          </button>
          
          {/* 추가 정보 표시 */}
          <div className="refresh-info">
            <small>
              💡 캐시된 데이터를 무시하고 서버에서 최신 정보를 가져옵니다
            </small>
          </div>
        </div>
      )}
      
      {/* 모바일용 오버레이 배경 */}
      {isSearchResultsVisible && searchText.trim() !== '' && (
        <div className="search-overlay" onClick={() => setIsSearchResultsVisible(false)}></div>
      )}
    </div>
  );
};

export default AreaSearch;