import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePopulationStore from '../store/populationStore';

// Leaflet 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 중요 지역 목록 - 항상 표시해야할 지역 목록
const importantAreas = [
  '강남 MICE 관광특구', '명동 관광특구', '홍대 관광특구', 
  '동대문 관광특구', '이태원 관광특구', '잠실 관광특구',
  '광화문·덕수궁', '경복궁', '서울역', '강남역', '홍대입구역(2호선)'
];

// 상수 정의
const SEOUL_CENTER = [37.5665, 126.9780];
const DEFAULT_ZOOM = 12;

// 유틸리티 함수: 좌표 유효성 검사
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

// 지도 중심 변경 컴포넌트 메모이제이션 개선
const MapCenterUpdater = React.memo(({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (isValidCoordinate(center)) {
      try {
        // 현재 중심과 새 중심이 거의 같으면 불필요한 업데이트 스킵
        const currentCenter = map.getCenter();
        const isSameLocation = 
          Math.abs(currentCenter.lat - center[0]) < 0.0001 && 
          Math.abs(currentCenter.lng - center[1]) < 0.0001 &&
          map.getZoom() === zoom;
          
        if (!isSameLocation) {
          map.setView(center, zoom, { animate: true, duration: 0.5 });
        }
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
}, (prevProps, nextProps) => {
  // 이전 props와 다음 props를 비교하여 최적화
  return (
    prevProps.zoom === nextProps.zoom &&
    Array.isArray(prevProps.center) && 
    Array.isArray(nextProps.center) &&
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1]
  );
});

// 지역 원 컴포넌트
const AreaCircle = React.memo(({ area, onSelectArea, isSelected }) => {
  if (!isValidCoordinate(area.coordinates)) return null;
  
  // 선택된 지역에는 다른 스타일 적용
  const circleStyle = isSelected ? {
    fillColor: '#6b7280',
    color: '#374151',
    fillOpacity: 0.2,
    weight: 2
  } : {
    fillColor: '#6b7280',
    color: '#6b7280',
    fillOpacity: 0.3,
    weight: 1
  };
  
  return (
    <Circle
      key={`area-${area.id}`}
      center={area.coordinates}
      radius={80}
      pathOptions={circleStyle}
      eventHandlers={{
        click: () => onSelectArea(area.id)
      }}
    >
      <Tooltip>{area.name}</Tooltip>
    </Circle>
  );
});

// 인구 데이터 원 컴포넌트 (개선)
const PopulationCircle = React.memo(({ 
  place, 
  selectedPlace, 
  selectedAgeGroup, 
  getCongestionColor, 
  onSelectPlace 
}) => {
  if (!isValidCoordinate(place.coordinates)) return null;
  
  // 선택된 장소인지 확인
  const isSelected = selectedPlace?.id === place.id;
  
  // 선택된 장소는 표시하지 않음 (마커로 대체)
  if (isSelected) return null;
  
  // 원 스타일 계산 (개선: 더 명확한 시각화)
  let circleColor;
  let circleRadius;
  let fillOpacity = 0.6;
  
  if (selectedAgeGroup === 'all') {
    circleColor = getCongestionColor(place.congestionLevel);
    circleRadius = 200;
    
    // 혼잡도에 따라 투명도 조정
    if (place.congestionLevel === '매우 붐빔') {
      fillOpacity = 0.8;
    } else if (place.congestionLevel === '붐빔') {
      fillOpacity = 0.7;
    }
  } else {
    const percentage = place.ageGroups[selectedAgeGroup];
    // 비율에 따라 색상 그라데이션 (더 명확한 시각화)
    circleColor = percentage > 30 ? '#3b82f6' :
                 percentage > 20 ? '#60a5fa' :
                 percentage > 10 ? '#93c5fd' : '#bfdbfe';
    circleRadius = 100 + (percentage * 8);
  }
  
  const circleStyle = {
    fillColor: circleColor,
    color: circleColor,
    fillOpacity: fillOpacity,
    weight: 1
  };
  
  return (
    <Circle
      key={place.id}
      center={place.coordinates}
      radius={circleRadius}
      pathOptions={circleStyle}
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
              {selectedAgeGroup} 비율: <strong>{place.ageGroups[selectedAgeGroup].toFixed(1)}%</strong>
            </p>
          )}
        </div>
      </Tooltip>
    </Circle>
  );
});

// 선택된 장소 컴포넌트 (마커와 원 통합)
const SelectedPlaceView = React.memo(({ place, selectedAgeGroup, getCongestionColor }) => {
  if (!place || !isValidCoordinate(place.coordinates)) return null;

  // 원 스타일 계산 (개선: 더 명확한 시각화)
  let circleColor;
  let circleRadius;
  let fillOpacity = 0.4;
  
  if (selectedAgeGroup === 'all') {
    circleColor = getCongestionColor(place.congestionLevel);
    circleRadius = 200; 
    
    // 혼잡도에 따라 투명도 조정
    if (place.congestionLevel === '매우 붐빔') {
      fillOpacity = 0.6;
    } else if (place.congestionLevel === '붐빔') {
      fillOpacity = 0.5;
    }
  } else {
    const percentage = place.ageGroups[selectedAgeGroup];
    // 비율에 따라 색상 그라데이션
    circleColor = percentage > 30 ? '#3b82f6' :
                percentage > 20 ? '#60a5fa' :
                percentage > 10 ? '#93c5fd' : '#bfdbfe';
    circleRadius = 100 + (percentage * 8); 
  }

  // 선택된 장소의 원 스타일
  const circleStyle = {
    fillColor: circleColor,
    color: '#000',
    fillOpacity: fillOpacity,
    weight: 2
  };

  // 눈에 더 잘 띄는 커스텀 마커 아이콘
  const markerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'selected-marker-icon'
  });

  return (
    <>
      {/* 선택된 장소의 원 - 펄스 애니메이션 추가 */}
      <Circle
        center={place.coordinates}
        radius={circleRadius}
        pathOptions={circleStyle}
        className="pulse-circle"
      />
      
      {/* 선택된 장소의 마커 */}
      <Marker 
        position={place.coordinates}
        icon={markerIcon}
        zIndexOffset={1000}
      >
        <Tooltip permanent direction="top" offset={[0, -20]} className="selected-place-tooltip">
          {place.name}
          <span className="tooltip-congestion" style={{ color: getCongestionColor(place.congestionLevel) }}>
            {' - '}{place.congestionLevel}
          </span>
        </Tooltip>
      </Marker>
    </>
  );
});

// 메인 지도 컴포넌트
function PopulationMap() {
  // 상태 선택적 구독
  const filteredData = usePopulationStore(state => state.filteredData);
  const selectedPlace = usePopulationStore(state => state.selectedPlace);
  const selectedArea = usePopulationStore(state => state.selectedArea);
  const selectedAgeGroup = usePopulationStore(state => state.selectedAgeGroup);
  const availableAreas = usePopulationStore(state => state.availableAreas);
  const isLoading = usePopulationStore(state => state.isLoading);
  const error = usePopulationStore(state => state.error);
  
  // 액션 함수들
  const selectPlace = usePopulationStore(state => state.selectPlace);
  const selectArea = usePopulationStore(state => state.selectArea);
  const getCongestionColor = usePopulationStore(state => state.getCongestionColor);
  const fetchData = usePopulationStore(state => state.fetchData);
  const fetchAreas = usePopulationStore(state => state.fetchAreas);
  
  // 선택된 지역 객체 가져오기
  const selectedAreaObj = useMemo(() => {
    if (!selectedArea || !availableAreas.length) return null;
    return availableAreas.find(a => a.id === selectedArea);
  }, [selectedArea, availableAreas]);

  // 컴포넌트 마운트시 데이터 로드
  useEffect(() => {
    if (!filteredData) {
      fetchData();
    }
    if (availableAreas.length === 0) {
      fetchAreas();
    }
  }, [fetchData, fetchAreas, filteredData, availableAreas.length]);

  // 지도 중심 계산
  const mapCenter = useMemo(() => {
    if (selectedPlace && isValidCoordinate(selectedPlace.coordinates)) {
      return selectedPlace.coordinates;
    }
    
    if (selectedAreaObj && isValidCoordinate(selectedAreaObj.coordinates)) {
      return selectedAreaObj.coordinates;
    }
    
    return SEOUL_CENTER;
  }, [selectedPlace, selectedAreaObj]);

  // 줌 레벨 계산
  const mapZoom = useMemo(() => {
    return (selectedPlace || selectedAreaObj) ? 15 : DEFAULT_ZOOM;
  }, [selectedPlace, selectedAreaObj]);

  // 줌 레벨에 따라 표시할 마커 최적화
  const visibleMarkers = useMemo(() => {
    if (!filteredData) return [];
    
    // 선택된 장소가 있을 때는 로딩 표시 대신 즉시 보여주기
    if (selectedPlace && isLoading) {
      return [selectedPlace];
    }
    
    // 줌 아웃 상태일 때 마커 수 제한
    if (mapZoom < 13) {
      // 핵심 장소만 표시
      return filteredData.filter(place => 
        importantAreas.includes(place.name)
      ).slice(0, 10);
    }
    
    // 중간 줌 레벨에서 더 많은 장소 표시
    if (mapZoom < 15) {
      return filteredData.slice(0, 25);
    }
    
    // 이미 로드된 데이터만 표시 (더 많은 데이터는 백그라운드에서 로드)
    return filteredData;
  }, [filteredData, selectedPlace, isLoading, mapZoom]);

  // 로딩 상태 처리
  if (isLoading && !filteredData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>데이터를 로딩 중입니다...</p>
      </div>
    );
  }

  // 에러 상태 처리
  if (error && !filteredData) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={() => fetchData()} className="retry-button">다시 시도</button>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer
        center={SEOUL_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '500px', width: '100%' }}
        preferCanvas={true} // 성능 최적화를 위한 캔버스 렌더링
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
            isSelected={area.id === selectedArea}
          />
        ))}
        
        {/* 인구 데이터 원 (선택되지 않은 장소만) - 최적화된 마커 렌더링 */}
        {visibleMarkers.map(place => (
          <PopulationCircle
            key={place.id}
            place={place}
            selectedPlace={selectedPlace}
            selectedAgeGroup={selectedAgeGroup}
            getCongestionColor={getCongestionColor}
            onSelectPlace={selectPlace}
          />
        ))}
        
        {/* 선택된 장소 표시 (원과 마커 통합) */}
        {selectedPlace && (
          <SelectedPlaceView 
            place={selectedPlace}
            selectedAgeGroup={selectedAgeGroup}
            getCongestionColor={getCongestionColor}
          />
        )}
      </MapContainer>
      
      {/* 지도 범례 */}
      <div className="map-legend">
        <div className="legend-title">혼잡도 범례</div>
        <div className="legend-items">
          {Object.entries(congestionColors).map(([level, color]) => (
            <div key={level} className="legend-item">
              <span className="legend-color" style={{ backgroundColor: color }}></span>
              <span className="legend-label">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 혼잡도 레벨에 따른 색상 맵핑 (범례용)
const congestionColors = {
  '여유': '#10b981', // 녹색
  '보통': '#f59e0b', // 노랑/주황
  '약간 붐빔': '#f97316', // 주황
  '붐빔': '#ef4444', // 빨강
  '매우 붐빔': '#b91c1c'  // 진한 빨강
};

export default React.memo(PopulationMap);