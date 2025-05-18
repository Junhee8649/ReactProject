// frontend/src/components/PopulationMap.jsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePopulationStore from '../store/populationStore';

// Leaflet 아이콘 설정 (코드 유지)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 상수 정의
const SEOUL_CENTER = [37.5665, 126.9780];
const DEFAULT_ZOOM = 12;

// 유틸리티 함수: 좌표 유효성 검사 (반복 코드 제거)
const isValidCoordinate = (coord) => {
  return Array.isArray(coord) && 
         coord.length === 2 && 
         typeof coord[0] === 'number' && 
         !isNaN(coord[0]) &&
         typeof coord[1] === 'number' && 
         !isNaN(coord[1]) &&
         // 서울 영역 대략적 범위 검사
         coord[0] >= 37.4 && coord[0] <= 37.7 && 
         coord[1] >= 126.8 && coord[1] <= 127.2;
};

// 지도 센터 변경 컴포넌트 (최적화)
const MapCenterUpdater = React.memo(({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (isValidCoordinate(center)) {
      try {
        map.setView(center, zoom);
      } catch (error) {
        console.error("Map update error:", error);
        map.setView(SEOUL_CENTER, DEFAULT_ZOOM);
      }
    } else {
      console.warn("잘못된 좌표가 전달됨:", center);
      map.setView(SEOUL_CENTER, DEFAULT_ZOOM);
    }
  }, [center, zoom, map]);
  
  return null;
});

// 지역 원 컴포넌트 (분리하여 관리)
const AreaCircle = React.memo(({ area, onSelectArea }) => {
  if (!isValidCoordinate(area.coordinates)) return null;
  
  return (
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
        click: () => onSelectArea(area.id)
      }}
    >
      <Tooltip>{area.name}</Tooltip>
    </Circle>
  );
});

// 인구 데이터 원 컴포넌트 (분리하여 관리)
const PopulationCircle = React.memo(({ 
  place, 
  selectedPlace, 
  selectedAgeGroup, 
  getCongestionColor, 
  onSelectPlace 
}) => {
  if (!isValidCoordinate(place.coordinates)) return null;
  
  // 원 스타일 계산
  let circleColor;
  let circleRadius;
  
  if (selectedAgeGroup === 'all') {
    circleColor = getCongestionColor(place.congestionLevel);
    circleRadius = 200; 
  } else {
    const percentage = place.ageGroups[selectedAgeGroup];
    circleColor = '#3b82f6';
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
        click: () => onSelectPlace(place.id)
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
});

// 메인 지도 컴포넌트
function PopulationMap() {
  // 상태 선택적 구독 - 개별 구독으로 최적화
  const filteredData = usePopulationStore(state => state.filteredData);
  const selectedPlace = usePopulationStore(state => state.selectedPlace);
  const selectedArea = usePopulationStore(state => state.selectedArea);
  const selectedAgeGroup = usePopulationStore(state => state.selectedAgeGroup);
  const availableAreas = usePopulationStore(state => state.availableAreas);
  const isLoading = usePopulationStore(state => state.isLoading);
  const error = usePopulationStore(state => state.error);
  
  // 액션 함수들 - useCallback으로 메모이제이션
  const selectPlace = usePopulationStore(state => state.selectPlace);
  const selectArea = usePopulationStore(state => state.selectArea);
  const getCongestionColor = usePopulationStore(state => state.getCongestionColor);
  const fetchData = usePopulationStore(state => state.fetchData);
  const fetchAreas = usePopulationStore(state => state.fetchAreas);
  
  // 컴포넌트 마운트시 데이터 로드 (한 번만)
  useEffect(() => {
    // 이미 데이터가 있는지 확인
    if (!filteredData) {
      fetchData();
    }
    if (availableAreas.length === 0) {
      fetchAreas();
    }
  }, [fetchData, fetchAreas, filteredData, availableAreas.length]);

  // 지도 중심 계산 (메모이제이션)
  const mapCenter = useMemo(() => {
    if (selectedPlace && isValidCoordinate(selectedPlace.coordinates)) {
      return selectedPlace.coordinates;
    }
    
    if (selectedArea) {
      const areaObj = availableAreas.find(a => a.id === selectedArea);
      if (areaObj && isValidCoordinate(areaObj.coordinates)) {
        return areaObj.coordinates;
      }
    }
    
    return SEOUL_CENTER;
  }, [selectedPlace, selectedArea, availableAreas]);

  // 줌 레벨 계산 (메모이제이션)
  const mapZoom = useMemo(() => {
    return (selectedPlace || selectedArea) ? 15 : DEFAULT_ZOOM;
  }, [selectedPlace, selectedArea]);

  // 로딩 상태 처리
  if (isLoading && !filteredData) {
    return <div className="loading-container">데이터를 로딩 중입니다...</div>;
  }

  // 에러 상태 처리
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
        
        {/* 지역 원 */}
        {availableAreas.length > 0 && availableAreas.map(area => (
          <AreaCircle 
            key={area.id} 
            area={area} 
            onSelectArea={selectArea} 
          />
        ))}
        
        {/* 인구 데이터 원 */}
        {filteredData && filteredData.map(place => (
          <PopulationCircle
            key={place.id}
            place={place}
            selectedPlace={selectedPlace}
            selectedAgeGroup={selectedAgeGroup}
            getCongestionColor={getCongestionColor}
            onSelectPlace={selectPlace}
          />
        ))}
        
        {/* 선택된 장소 마커 */}
        {selectedPlace && isValidCoordinate(selectedPlace.coordinates) && (
          <Marker 
            position={selectedPlace.coordinates}
            icon={new L.Icon({
              iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
              iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
              className: 'custom-marker-icon'
            })}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default React.memo(PopulationMap);