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
    selectedArea
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
    // 스토어 검색 상태 업데이트
    searchAreas(e.target.value);
    
    // 검색어가 있으면 검색 결과 컨테이너 표시
    if (e.target.value.trim() !== '') {
      setIsSearchResultsVisible(true);
    } else {
      setIsSearchResultsVisible(false);
    }
  };
  
  // 검색 결과 아이템 선택 핸들러
  const handleSelectArea = (areaId) => {
    selectArea(areaId);
    setIsSearchResultsVisible(false); // 선택 후 결과창 닫기
  };
  
  // 검색창 포커스 핸들러
  const handleSearchFocus = () => {
    if (searchText.trim() !== '') {
      setIsSearchResultsVisible(true);
    }
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
          onFocus={handleSearchFocus}
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
      
      {/* 모바일용 오버레이 배경 (검색 결과 표시 시) */}
      {isSearchResultsVisible && searchText.trim() !== '' && (
        <div className="search-overlay" onClick={() => setIsSearchResultsVisible(false)}></div>
      )}
      
      {/* 통합된 검색 결과 컨테이너 - 결과 유무와 상관없이 동일한 컨테이너 사용 */}
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
            // 검색 결과가 없는 경우 - 같은 컨테이너 내에 표시
            <div className="no-results-content">
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
        </div>
      )}
    </div>
  );
};

export default AreaSearch;