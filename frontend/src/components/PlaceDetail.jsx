// frontend/src/components/PlaceDetail.jsx
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, Legend, ReferenceLine
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
  
  // 선택된 시간 포인트 상태 추가
  const [selectedTimePoint, setSelectedTimePoint] = useState(null);
  
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
  
  // 예측 데이터가 있는지 확인
  const hasForecast = selectedPlace.hasForecast && 
                     selectedPlace.FCST_PPLTN && 
                     selectedPlace.FCST_PPLTN.length > 0;
  
  // 예측 차트 데이터 준비 (개선)
  const forecastData = hasForecast ? selectedPlace.FCST_PPLTN.map(item => {
    // 날짜 및 시간 포맷팅
    const dateTime = new Date(item.FCST_TIME);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    
    // 시간 포맷 (예: 15:00)
    const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    
    return {
      time: timeString,
      timeRaw: item.FCST_TIME,
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
  
  // 선택된 시간 포인트 데이터
  const selectedTimeData = selectedTimePoint 
    ? forecastData.find(item => item.timeRaw === selectedTimePoint)
    : null;
  
  // 최적 방문 시간 포맷팅
  const formatOptimalTime = () => {
    if (!optimalVisitTime) return null;
    
    const dateTime = new Date(optimalVisitTime.time);
    const hours = dateTime.getHours();
    const minutes = dateTime.getMinutes();
    const timeString = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    
    return {
      time: timeString,
      timeRaw: optimalVisitTime.time,
      congestionLevel: optimalVisitTime.congestionLevel,
      color: getCongestionColor(optimalVisitTime.congestionLevel)
    };
  };
  
  const optimalTimeFormatted = formatOptimalTime();
  
  // 혼잡도에 따른 배경 그라데이션 ID 생성
  const getCongestionGradientId = () => `congestion-gradient-${selectedPlace.id}`;
  
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
      
      {/* 최적 방문 시간 추천 (UI 개선) */}
      {optimalTimeFormatted && (
        <div className="optimal-visit-time">
          <h3>방문 추천 시간</h3>
          <div className="optimal-time-container">
            <div 
              className="optimal-time" 
              style={{ 
                borderColor: optimalTimeFormatted.color,
                backgroundColor: `${optimalTimeFormatted.color}15` // 투명도 낮은 배경색
              }}
            >
              <div className="optimal-time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="optimal-time-content">
                <span className="optimal-time-value">{optimalTimeFormatted.time}</span>
                <span 
                  className="optimal-congestion" 
                  style={{ color: optimalTimeFormatted.color }}
                >
                  {optimalTimeFormatted.congestionLevel}
                </span>
              </div>
            </div>
            <small>이 시간에 가장 붐비지 않을 것으로 예상됩니다</small>
          </div>
        </div>
      )}
      
      <div className="last-updated">
        <small>마지막 업데이트: {selectedPlace.updatedAt}</small>
      </div>
      
      {/* 예측 차트 (시각화 개선) */}
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
            <div className="forecast-chart-container">
              {/* 선택된 시간 정보 표시 */}
              {selectedTimeData && (
                <div className="selected-time-info">
                  <h4>{selectedTimeData.time} 예상 상황</h4>
                  <div className="selected-time-stats">
                    <div className="stat-pill" style={{ backgroundColor: selectedTimeData.color }}>
                      {selectedTimeData.congestionLevel}
                    </div>
                    <div className="stat-pill">
                      예상 인구: {selectedTimeData.avgPeople.toLocaleString()}명
                    </div>
                  </div>
                </div>
              )}
              
              <div className="forecast-chart" style={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={futureForecast}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    onClick={(data) => {
                      if (data && data.activePayload) {
                        setSelectedTimePoint(data.activePayload[0].payload.timeRaw);
                      }
                    }}
                  >
                    <defs>
                      {/* 혼잡도에 따른 그라데이션 정의 */}
                      <linearGradient id={getCongestionGradientId()} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fill: '#4b5563' }}
                    />
                    <YAxis 
                      label={{ 
                        value: '예상 인구 (명)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: '#4b5563' }
                      }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'avgPeople') {
                          return [`${value.toLocaleString()}명`, '예상 인구'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(time) => `${time} 예상`}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px'
                      }}
                    />
                    
                    {/* 최적 방문 시간 표시선 */}
                    {optimalTimeFormatted && (
                      <ReferenceLine 
                        x={optimalTimeFormatted.time} 
                        stroke={optimalTimeFormatted.color}
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        label={{ 
                          value: '추천', 
                          position: 'top',
                          fill: optimalTimeFormatted.color,
                          fontSize: 12
                        }}
                      />
                    )}
                    
                    {/* 영역 차트로 인구 표시 */}
                    <Area 
                      type="monotone" 
                      dataKey="avgPeople"
                      name="예상 인구"
                      stroke="#8884d8" 
                      fill={`url(#${getCongestionGradientId()})`} 
                      activeDot={{ 
                        r: 8,
                        stroke: '#fff',
                        strokeWidth: 2,
                        onClick: (props) => {
                          setSelectedTimePoint(props.payload.timeRaw);
                        }
                      }}
                    />
                    
                    {/* 현재 선택된 시간 포인트 강조 */}
                    {selectedTimePoint && (
                      <ReferenceLine 
                        x={selectedTimeData?.time} 
                        stroke="#000"
                        strokeWidth={1}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* 혼잡도 색상 범례 */}
              <div className="congestion-legend">
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
              
              {/* 시간별 혼잡도 바 차트 (추가) */}
              <div className="congestion-bar-chart" style={{ height: 80, marginTop: 20 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {/* 시간별 혼잡도 바 차트 (수정됨) */}
                  <BarChart 
                    data={futureForecast}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barSize={20}
                    onClick={(data) => {
                      if (data && data.activePayload) {
                        setSelectedTimePoint(data.activePayload[0].payload.timeRaw);
                      }
                    }}
                  >
                    <XAxis 
                      dataKey="time" 
                      scale="band"
                      tick={{ fontSize: 10 }}
                      height={30}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        return [value, '혼잡도 레벨'];
                      }}
                      labelFormatter={(time) => `${time}`}
                    />
                    {/* 수정: fill 속성을 한 번만 사용 */}
                    <Bar 
                      dataKey="congestionLevel" 
                      name="혼잡도"
                      radius={[4, 4, 0, 0]}
                      // 동적으로 각 바의 색상 지정
                      fill={(data) => data.color}
                    />
                    
                    {/* 최적 시간 표시 */}
                    {optimalTimeFormatted && (
                      <ReferenceLine 
                        x={optimalTimeFormatted.time} 
                        stroke={optimalTimeFormatted.color}
                        strokeWidth={2}
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
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
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetail;