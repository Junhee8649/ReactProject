import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePopulationStore from '../store/populationStore';

// Marker 아이콘 문제 해결 (Leaflet의 기본 아이콘 관련 이슈)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 지도 중앙 위치를 서울로 설정
const SEOUL_CENTER = [37.5665, 126.9780];
const DEFAULT_ZOOM = 12;

// 지도 센터 변경을 위한 컴포넌트
function MapCenterUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
}

function PopulationMap() {
  const { 
    filteredData, 
    selectedPlace,
    selectedArea,
    selectedAgeGroup,
    availableAreas,
    fetchData,
    fetchAreas,
    selectPlace,
    selectArea,
    getCongestionColor,
    isLoading,
    error
  } = usePopulationStore();
  
  // 컴포넌트 마운트시 데이터 및 지역 목록 로드
  useEffect(() => {
    fetchData();
    fetchAreas();
  }, [fetchData, fetchAreas]);

  // 선택된 장소나 지역으로 지도 중심 이동
  const mapCenter = selectedPlace 
    ? selectedPlace.coordinates 
    : selectedArea 
      ? availableAreas.find(a => a.id === selectedArea)?.coordinates
      : SEOUL_CENTER;
  
  const mapZoom = (selectedPlace || selectedArea) ? 15 : DEFAULT_ZOOM;

  if (isLoading && !filteredData) {
    return <div className="loading-container">데이터를 로딩 중입니다...</div>;
  }

  if (error && !filteredData) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="map-container">
      <MapContainer
        center={SEOUL_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
        
        {/* 모든 가용 지역 마커 표시 (작은 크기) */}
        {availableAreas.length > 0 && availableAreas.map(area => (
          <Circle
            key={`area-${area.id}`}
            center={area.coordinates}
            radius={80}
            pathOptions={{
              fillColor: '#6b7280',
              color: '#6b7280',
              fillOpacity: 0.3,
              weight: 1
            }}
            eventHandlers={{
              click: () => selectArea(area.id)
            }}
          >
            <Tooltip>{area.name}</Tooltip>
          </Circle>
        ))}
        
        {/* 필터링된, 더 자세한 인구 데이터가 있는 지역 표시 */}
        {filteredData && filteredData.map(place => {
          // 선택된 나이대 또는 혼잡도 기준 시각화
          let circleColor;
          let circleRadius;
          
          if (selectedAgeGroup === 'all') {
            // 전체 선택시 혼잡도 기준으로 표시
            circleColor = getCongestionColor(place.congestionLevel);
            circleRadius = 200; // 기본 크기
          } else {
            // 나이대 선택시 해당 비율 기준으로 표시 (파란색 계열, 강도는 비율에 따라)
            const percentage = place.ageGroups[selectedAgeGroup];
            circleColor = '#3b82f6'; // 기본 파란색
            // 비율에 따라 크기 조정 (최소 100, 최대 500)
            circleRadius = 100 + (percentage * 8); 
          }
          
          return (
            <Circle
              key={place.id}
              center={place.coordinates}
              radius={circleRadius}
              pathOptions={{
                fillColor: circleColor,
                color: selectedPlace?.id === place.id ? '#000' : circleColor,
                fillOpacity: 0.6,
                weight: selectedPlace?.id === place.id ? 3 : 1
              }}
              eventHandlers={{
                click: () => selectPlace(place.id)
              }}
            >
              <Tooltip>
                <div>
                  <h3>{place.name}</h3>
                  <p>혼잡도: <span style={{ color: getCongestionColor(place.congestionLevel) }}>{place.congestionLevel}</span></p>
                  {selectedAgeGroup !== 'all' && (
                    <p>
                      {selectedAgeGroup} 비율: {place.ageGroups[selectedAgeGroup].toFixed(1)}%
                    </p>
                  )}
                </div>
              </Tooltip>
            </Circle>
          );
        })}
        
        {selectedPlace && (
          <Marker position={selectedPlace.coordinates} />
        )}
      </MapContainer>
    </div>
  );
}

export default PopulationMap;