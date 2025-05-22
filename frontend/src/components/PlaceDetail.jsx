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
  
  // 모든 예측 데이터 표시하도록 변경 (시간 필터링 제거)
  const currentTime = new Date();

  // 전체 예측 데이터를 시간 순으로 정렬
  const sortedForecast = forecastData.sort((a, b) => {
    const timeA = new Date(a.timeRaw);
    const timeB = new Date(b.timeRaw);
    return timeA - timeB;
  });

  // 현재 시간 전후 표시용 마커를 위해 현재 시간 정보는 유지
  const futureForecast = sortedForecast;
  
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
  
  // 혼잡도에 따른 배경색 밝기 조정
  const getBackgroundOpacity = (level) => {
    switch(level) {
      case '여유': return '0.1';
      case '보통': return '0.15';
      case '약간 붐빔': return '0.2';
      case '붐빔': return '0.25';
      case '매우 붐빔': return '0.3';
      default: return '0.15';
    }
  };
  
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
          <div className="optimal-header">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              방문 추천 시간
            </h3>
            <div className="recommendation-badge">AI 추천</div>
          </div>
          
          <div className="optimal-time-container">
            <div 
              className="optimal-time pulse-card"
              style={{ 
                borderColor: optimalTimeFormatted.color,
                backgroundColor: `${optimalTimeFormatted.color}${getBackgroundOpacity(optimalTimeFormatted.congestionLevel)}`
              }}
            >
              <div className="optimal-time-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={optimalTimeFormatted.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            
            <div className="optimal-reason">
              <div className="reason-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="reason-text">
                <p>이 시간에 가장 붐비지 않을 것으로 예상됩니다</p>
                <small>향후 6시간 내 최적 방문 시간</small>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="last-updated">
        <small>마지막 업데이트: {selectedPlace.updatedAt}</small>
      </div>

      {/* 예측 데이터 없음 안내 메시지 */}
      {!hasForecast && (
        <div className="forecast-unavailable">
          <h3>시간대별 예측 데이터 미제공</h3>
          <p>이 장소는 현재 시간대별 예측 데이터를 제공하지 않습니다.</p>
          <p>서울시 데이터에 따르면 이 장소에 대한 미래 혼잡도 예측이 제공되지 않습니다.</p>
        </div>
      )}
      
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
          
          {showForecast && (
            <div className="forecast-chart-container">
              {futureForecast.length <= 1 ? (
                <div className="limited-forecast-warning">
                  <p>현재 시점에 표시할 수 있는 예측 데이터가 제한적입니다.</p>
                  <p>데이터를 업데이트하려면 새로고침 버튼을 클릭하거나 나중에 다시 확인해주세요.</p>
                </div>
              ) : (
                <>
                  {/* 추천 시간 범례를 추가한 차트 헤더 */}
                  <div className="forecast-chart-header">
                    <h3>시간대별 예상 인구</h3>
                    {optimalTimeFormatted && (
                      <div className="optimal-time-legend">
                        <div className="optimal-line-sample" 
                            style={{ backgroundColor: optimalTimeFormatted.color }}></div>
                        <div className="optimal-legend-text">
                          <span className="legend-label">추천 시간 : </span>
                          <span className="legend-value" 
                                style={{ color: optimalTimeFormatted.color }}>
                            {optimalTimeFormatted.time} ({optimalTimeFormatted.congestionLevel})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 선택된 시간 정보 표시 */}
                  {selectedTimeData && (
                    <div className="selected-time-info">
                      <h4>{selectedTimeData.time} 예상 상황</h4>
                      <div className="selected-time-stats">
                        <div className="stat-pill" style={{ backgroundColor: selectedTimeData.color, color: 'white' }}>
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
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fill: '#4b5563', fontSize: 12 }}
                          axisLine={{ stroke: '#d1d5db' }}
                          tickLine={{ stroke: '#d1d5db' }}
                        />
                        <YAxis 
                          label={{ 
                            value: '예상 인구 (명)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fill: '#4b5563', fontSize: 12 }
                          }}
                          tick={{ fill: '#4b5563', fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'avgPeople') {
                              return [`${value.toLocaleString()}명`, '예상 인구'];
                            }
                            return [value, name];
                          }}
                          labelFormatter={(time) => {
                            // 툴팁 헤더 - 시간과 혼잡도 함께 표시
                            const item = futureForecast.find(d => d.time === time);
                            return (
                              <span>
                                <span style={{ fontWeight: 'bold', marginBottom: '3px' }}>{time}</span>
                                <span style={{ 
                                  color: item ? item.color : '#666',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {item ? item.congestionLevel : ''}
                                </span>
                              </span>
                            );
                          }}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
                            padding: '8px 12px'
                          }}
                        />
                        
                        {/* 최적 방문 시간 표시선 */}
                        {optimalTimeFormatted && (
                          <ReferenceLine 
                            x={optimalTimeFormatted.time} 
                            stroke={optimalTimeFormatted.color}
                            strokeWidth={2.5}
                            className="recommended-time-marker"
                          />
                        )}
                        
                        {/* 영역 차트로 인구 표시 */}
                        <Area 
                          type="monotone" 
                          dataKey="avgPeople"
                          name="예상 인구"
                          stroke="#3b82f6" 
                          fill={`url(#${getCongestionGradientId()})`} 
                          activeDot={{ 
                            r: (dot) => {
                              if (optimalTimeFormatted && dot.payload.time === optimalTimeFormatted.time) {
                                return 10; // 추천 시간 점 크기 증가
                              }
                              return 8;
                            },
                            fill: (dot) => {
                              if (optimalTimeFormatted && dot.payload.time === optimalTimeFormatted.time) {
                                return optimalTimeFormatted.color; // 추천 시간 점 색상 변경
                              }
                              return '#3b82f6';
                            },
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
                            strokeDasharray="3 3"
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 시간별 혼잡도 바 차트 (추가) - 더 명확한 혼잡도 시각화 */}
                  <div className="congestion-bar-chart" style={{ height: 80, marginTop: 20 }}>
                    <ResponsiveContainer width="100%" height="100%">
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
                            if (name === 'congestionIndex') {
                              const levels = ['여유', '보통', '약간 붐빔', '붐빔', '매우 붐빔'];
                              return [levels[value-1], '혼잡도'];
                            }
                            return [value, name];
                          }}
                        />
                        {/* 혼잡도 레벨을 숫자 인덱스로 변환하여 바 높이 조절 */}
                        <Bar 
                          dataKey={(data) => {
                            const levels = ['여유', '보통', '약간 붐빔', '붐빔', '매우 붐빔'];
                            return levels.indexOf(data.congestionLevel) + 1;
                          }}
                          name="congestionIndex"
                          radius={[4, 4, 0, 0]}
                          fill={(data) => data.color} // 동적 색상 지정
                        />
                        
                        {/* 최적 시간 표시 */}
                        {optimalTimeFormatted && (
                          <ReferenceLine 
                            x={optimalTimeFormatted.time} 
                            stroke={optimalTimeFormatted.color}
                            strokeWidth={2}
                            className="recommended-time-marker"
                          />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 혼잡도 색상 범례 */}
                  <div className="congestion-legend">
                    <div className="legend-title">혼잡도 레벨</div>
                    <div className="legend-items">
                      {['여유', '보통', '약간 붐빔', '붐빔', '매우 붐빔'].map(level => (
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
                </>
              )}
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