// frontend/src/components/AreaSearch.jsx
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
    selectedArea // 추가: 현재 선택된 지역 상태 가져오기
  } = usePopulationStore();
  
  // 로컬 상태: 이전 검색어 저장
  const [lastSearched, setLastSearched] = useState('');
  // 검색 결과가 보이는지 여부 추적을 위한 상태 추가
  const [isSearchResultsVisible, setIsSearchResultsVisible] = useState(false);
  
  // 직접 검색 처리
  const handleDirectSearch = () => {
    if (searchText && searchText.trim().length > 1) {
      // 직접 검색 수행 전 마지막 검색어 저장
      setLastSearched(searchText.trim());
      // 직접 입력 검색 실행
      fetchData(searchText.trim());
      // 검색 결과 창 닫기
      setIsSearchResultsVisible(false);
    }
  };
  
  // 재검색 처리 (같은 지역 강제 새로고침)
  const handleResearch = () => {
    if (selectedArea) {
      // 같은 지역 재검색 - selectArea 함수 내부에서 forceRefresh 처리됨
      selectArea(selectedArea);
      setSearchFeedback("선택된 지역 데이터를 새로고침합니다.");
    } else if (lastSearched) {
      // 이전 직접 검색어가 있으면 재검색
      fetchData(lastSearched, true); // 강제 갱신 플래그 전달
      setSearchFeedback(`"${lastSearched}" 데이터를 새로고침합니다.`);
    }
  };
  
  // 검색 입력창 변경 핸들러
  const handleSearchInputChange = (e) => {
    searchAreas(e.target.value);
    // 입력값이 있으면 검색 결과 표시
    setIsSearchResultsVisible(e.target.value.trim() !== '');
  };
  
  // 검색 결과 아이템 선택 핸들러
  const handleSelectArea = (areaId) => {
    selectArea(areaId);
    setIsSearchResultsVisible(false); // 선택 후 결과창 닫기
  };
  
  // 검색 결과 외부 클릭 감지를 위한 이벤트 리스너
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
      <div className="search-container">
        <input
          type="text"
          value={searchText}
          onChange={handleSearchInputChange}
          onClick={() => searchText.trim() !== '' && setIsSearchResultsVisible(true)}
          placeholder="지역명 검색 (예: 강남, 홍대, 명동)"
          className="search-input"
          disabled={isLoading}
        />
        <button 
          className="search-button" 
          disabled={isLoading}
          onClick={() => searchText.trim() && handleDirectSearch()}
          title="검색"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      {/* 검색 피드백 표시 */}
      {searchFeedback && (
        <div className="search-feedback">
          {searchFeedback}
        </div>
      )}
      
      {/* 현재 선택된 지역이나 이전 검색어가 있을 때 재검색 버튼 표시 */}
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
      
      {searchText.trim() !== '' && searchResults.length === 0 && isSearchResultsVisible && (
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
      
      {/* 모바일용 오버레이 배경 (검색 결과 표시 시) */}
      {isSearchResultsVisible && searchResults.length > 0 && (
        <div className="search-overlay" onClick={() => setIsSearchResultsVisible(false)}></div>
      )}
      
      {/* 수정된 검색 결과 컨테이너 */}
      {searchResults.length > 0 && isSearchResultsVisible && (
        <div className="search-results" 
             style={{ 
               maxHeight: '300px',
               overflowY: 'auto',
               boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
               zIndex: 1000
             }}>
          {searchResults.map(area => (
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