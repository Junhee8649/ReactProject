import React from 'react';
import usePopulationStore from '../store/populationStore';

const AgeGroupFilter = () => {
  const { selectedAgeGroup, filterByAgeGroup } = usePopulationStore();
  
  const ageGroups = [
    { id: 'all', label: '전체' },
    { id: '10s', label: '10대' },
    { id: '20s', label: '20대' },
    { id: '30s', label: '30대' },
    { id: '40s', label: '40대' },
    { id: '50s', label: '50대' },
    { id: '60s', label: '60대' },
    { id: '70s', label: '70대+' },
  ];
  
  return (
    <div className="filter-container">
      <h3>나이대별 필터</h3>
      <div className="age-filters">
        {ageGroups.map(age => (
          <button
            key={age.id}
            onClick={() => filterByAgeGroup(age.id)}
            className={`filter-btn ${selectedAgeGroup === age.id ? 'active' : ''}`}
          >
            {age.label}
          </button>
        ))}
      </div>
      <div className="filter-info">
        {selectedAgeGroup === 'all' 
          ? '혼잡도 기준으로 표시됩니다' 
          : `${ageGroups.find(a => a.id === selectedAgeGroup)?.label} 인구 비율이 높은 장소가 강조됩니다`}
      </div>
    </div>
  );
};

export default AgeGroupFilter;