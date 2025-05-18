// frontend/src/components/PlaceDetail.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import usePopulationStore from '../store/populationStore';

const PlaceDetail = () => {
  const { 
    selectedPlace, 
    resetData, 
    getCongestionColor, 
    showForecast,
    toggleForecast,
    optimalVisitTime 
  } = usePopulationStore();
  
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
  
  // 예측 데이터가 있는지 확인 (추가)
  const hasForecast = selectedPlace.hasForecast && 
                     selectedPlace.FCST_PPLTN && 
                     selectedPlace.FCST_PPLTN.length > 0;
  
  // 예측 차트 데이터 준비 (추가)
  const forecastData = hasForecast ? selectedPlace.FCST_PPLTN.map(item => {
    // 날짜 및 시간 포맷팅
    const dateTime = new Date(item.FCST_TIME);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    
    // 시간 포맷 (예: 15:00)
    const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    
    return {
      time: timeString,
      congestionLevel: item.FCST_CONGEST_LVL,
      color: getCongestionColor(item.FCST_CONGEST_LVL),
      minPeople: parseInt(item.FCST_PPLTN_MIN || 0),
      maxPeople: parseInt(item.FCST_PPLTN_MAX || 0),
      // 평균 인구수 계산
      avgPeople: (parseInt(item.FCST_PPLTN_MIN || 0) + parseInt(item.FCST_PPLTN_MAX || 0)) / 2
    };
  }) : [];
  
  // 현재 시간 이후의 예측만 표시
  const currentTime = new Date();
  const futureForecast = forecastData.filter(item => {
    const [hours, minutes] = item.time.split(':').map(Number);
    const itemDate = new Date(currentTime);
    itemDate.setHours(hours, minutes, 0, 0);
    return itemDate > currentTime;
  });
  
  // 최적 방문 시간 포맷팅 (추가)
  const formatOptimalTime = () => {
    if (!optimalVisitTime) return null;
    
    const dateTime = new Date(optimalVisitTime.time);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    
    return {
      time: timeString,
      congestionLevel: optimalVisitTime.congestionLevel,
      color: getCongestionColor(optimalVisitTime.congestionLevel)
    };
  };
  
  const optimalTimeFormatted = formatOptimalTime();
  
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
      
      {/* 최적 방문 시간 추천 (추가) */}
      {optimalTimeFormatted && (
        <div className="optimal-visit-time">
          <h3>방문 추천 시간</h3>
          <div className="optimal-time-container">
            <div className="optimal-time" style={{ borderColor: optimalTimeFormatted.color }}>
              <span className="optimal-time-value">{optimalTimeFormatted.time}</span>
              <span className="optimal-congestion" style={{ color: optimalTimeFormatted.color }}>
                {optimalTimeFormatted.congestionLevel}
              </span>
            </div>
            <small>이 시간에 가장 붐비지 않을 것으로 예상됩니다</small>
          </div>
        </div>
      )}
      
      <div className="last-updated">
        <small>마지막 업데이트: {selectedPlace.updatedAt}</small>
      </div>
      
      {/* 예측 차트 (추가) */}
      {hasForecast && (
        <div className="forecast-section">
          <div className="forecast-header">
            <h3>시간대별 혼잡도 예측</h3>
            <button 
              className="toggle-forecast-btn"
              onClick={toggleForecast}
            >
              {showForecast ? '숨기기' : '보기'}
            </button>
          </div>
          
          {showForecast && futureForecast.length > 0 && (
            <div className="forecast-chart" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={futureForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'avgPeople') {
                        return [`${value.toLocaleString()}명`, '예상 인구'];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgPeople" 
                    name="예상 인구" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="forecast-legend">
                {Array.from(new Set(futureForecast.map(item => item.congestionLevel))).map(level => (
                  <div key={level} className="legend-item">
                    <span 
                      className="legend-color" 
                      style={{ backgroundColor: getCongestionColor(level) }}
                    ></span>
                    <span className="legend-label">{level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {showForecast && futureForecast.length === 0 && (
            <div className="no-forecast">
              <p>현재 시간 이후의 예측 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      )}
      
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