import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import usePopulationStore from '../store/populationStore';

const PlaceDetail = () => {
  const { selectedPlace, resetData, getCongestionColor } = usePopulationStore();
  
  if (!selectedPlace) {
    return null;
  }
  
  // 차트 데이터 준비
  const chartData = [
    { age: '0-9세', percentage: selectedPlace.ageGroups['0'] },
    { age: '10대', percentage: selectedPlace.ageGroups['10s'] },
    { age: '20대', percentage: selectedPlace.ageGroups['20s'] },
    { age: '30대', percentage: selectedPlace.ageGroups['30s'] },
    { age: '40대', percentage: selectedPlace.ageGroups['40s'] },
    { age: '50대', percentage: selectedPlace.ageGroups['50s'] },
    { age: '60대', percentage: selectedPlace.ageGroups['60s'] },
    { age: '70대+', percentage: selectedPlace.ageGroups['70s'] },
  ];
  
  // 혼잡도 색상
  const congestionColor = getCongestionColor(selectedPlace.congestionLevel);
  
  return (
    <div className="place-detail">
      <div className="place-header">
        <h2>{selectedPlace.name}</h2>
        <button className="close-btn" onClick={() => resetData()}>닫기</button>
      </div>
      
      <div className="place-stats">
        <div className="stat-item">
          <h3>현재 혼잡도</h3>
          <p style={{ color: congestionColor }}>{selectedPlace.congestionLevel}</p>
          <small>{selectedPlace.congestionMessage}</small>
        </div>
        
        <div className="stat-item">
          <h3>성별 비율</h3>
          <div className="gender-ratio">
            <div className="gender-bar">
              <div 
                className="male-ratio" 
                style={{ 
                  width: `${selectedPlace.gender.male}%`,
                  backgroundColor: '#3b82f6' 
                }}
              >
                {selectedPlace.gender.male}%
              </div>
              <div 
                className="female-ratio"
                style={{ 
                  width: `${selectedPlace.gender.female}%`,
                  backgroundColor: '#ec4899' 
                }}
              >
                {selectedPlace.gender.female}%
              </div>
            </div>
            <div className="gender-labels">
              <span className="male-label">남성</span>
              <span className="female-label">여성</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="last-updated">
        <small>마지막 업데이트: {selectedPlace.updatedAt}</small>
      </div>
      
      <div className="age-distribution">
        <h3>나이대별 분포 (%)</h3>
        <div className="chart-container" style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, '비율']} />
              <Bar dataKey="percentage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetail;