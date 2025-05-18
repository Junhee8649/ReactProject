// frontend/src/components/PopulationMap.jsx
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import usePopulationStore from '../store/populationStore';

// Marker 아이콘 설정 (기존 코드 유지)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// 상수 정의 (기존 코드 유지)
const SEOUL_CENTER = [37.5665, 126.9780];
const DEFAULT_ZOOM = 12;

// 지도 센터 변경 컴포넌트 (기존 코드 유지)
const MapCenterUpdater = React.memo(({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    // 유효한 좌표인지 엄격하게 확인 후 적용
    const isValidCoordinate = (coord) => {
      return Array.isArray(coord) && 
             coord.length === 2 && 
             typeof coord[0] === 'number' && 
             !isNaN(coord[0]) &&
             typeof coord[1] === 'number' && 
             !isNaN(coord[1]) &&
             // 서울 영역 대략적 범위 검사 추가
             coord[0] >= 37.4 && coord[0] <= 37.7 && 
             coord[1] >= 126.8 && coord[1] <= 127.2;
    };
    
    if (isValidCoordinate(center)) {
      try {
        console.log(`지도 중심 이동: ${center[0]}, ${center[1]} (줌: ${zoom})`);
        map.setView(center, zoom);
      } catch (error) {
        console.error("Map update error:", error);
        // 오류 발생 시 기본값으로
        map.setView(SEOUL_CENTER, DEFAULT_ZOOM);
      }
    } else {
      console.warn("잘못된 좌표가 전달됨:", center);
      // 잘못된 좌표가 전달된 경우 기본값 사용
      map.setView(SEOUL_CENTER, DEFAULT_ZOOM);
    }
  }, [center, zoom, map]);
  
  return null;
});

function PopulationMap() {
  // 데이터 로드 상태 - 한 번만 실행하기 위한 플래그
  const hasLoaded = React.useRef(false);
  
  // 필요한 상태만 개별적으로 구독 (무한 루프 방지를 위한 핵심 변경)
  const filteredData = usePopulationStore(state => state.filteredData);
  const selectedPlace = usePopulationStore(state => state.selectedPlace);
  const selectedArea = usePopulationStore(state => state.selectedArea);
  const selectedAgeGroup = usePopulationStore(state => state.selectedAgeGroup);
  const availableAreas = usePopulationStore(state => state.availableAreas);
  const isLoading = usePopulationStore(state => state.isLoading);
  const error = usePopulationStore(state => state.error);
  
  // 함수들은 직접 참조하지 않고 getState()로 필요할 때 접근
  const selectPlace = (placeId) => {
    usePopulationStore.getState().selectPlace(placeId);
  };
  
  const selectArea = (areaId) => {
    usePopulationStore.getState().selectArea(areaId);
  };
  
  const getCongestionColor = (level) => {
    return usePopulationStore.getState().getCongestionColor(level);
  };
  
  // 컴포넌트 마운트시 한 번만 데이터 로드 (무한 루프 방지를 위한 중요 변경)
  useEffect(() => {
    if (!hasLoaded.current) {
      // 직접 함수를 참조하지 않고 getState()로 접근
      const store = usePopulationStore.getState();
      store.fetchData();
      store.fetchAreas();
      hasLoaded.current = true;
    }
  }, []);

  // 안전한 좌표 처리 로직 (기존 코드 유지)
  const mapCenter = useMemo(() => {
    // 좌표 유효성 검사 함수
    const isValidCoordinate = (coord) => {
      return Array.isArray(coord) && 
             coord.length === 2 && 
             typeof coord[0] === 'number' && 
             !isNaN(coord[0]) &&
             typeof coord[1] === 'number' && 
             !isNaN(coord[1]) &&
             coord[0] >= 37.4 && coord[0] <= 37.7 && 
             coord[1] >= 126.8 && coord[1] <= 127.2;
    };
    
    // 선택된 장소가 있고 유효한 좌표가 있는 경우
    if (selectedPlace && isValidCoordinate(selectedPlace.coordinates)) {
      return selectedPlace.coordinates;
    }
    
    // 선택된 지역이 있는 경우
    if (selectedArea) {
      const areaObj = availableAreas.find(a => a.id === selectedArea);
      if (areaObj && isValidCoordinate(areaObj.coordinates)) {
        return areaObj.coordinates;
      }
    }
    
    // 항상 기본값 반환 (안전장치)
    return SEOUL_CENTER;
  }, [selectedPlace, selectedArea, availableAreas]);

  const mapZoom = useMemo(() => {
    return (selectedPlace || selectedArea) ? 15 : DEFAULT_ZOOM;
  }, [selectedPlace, selectedArea]);

  if (isLoading && !filteredData) {
    return <div className="loading-container">데이터를 로딩 중입니다...</div>;
  }

  if (error && !filteredData) {
    return <div className="error-container">{error}</div>;
  }

  // 나머지 렌더링 로직은 원래 코드와 거의 동일하게 유지
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
        
        {/* 지역 마커 표시 */}
        {availableAreas.length > 0 && availableAreas.map(area => {
          // 좌표 유효성 확인
          if (!area.coordinates || 
              !Array.isArray(area.coordinates) || 
              area.coordinates.length !== 2 ||
              !area.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) ||
              area.coordinates[0] < 37.4 || area.coordinates[0] > 37.7 ||
              area.coordinates[1] < 126.8 || area.coordinates[1] > 127.2) {
            return null;
          }
          
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
                click: () => selectArea(area.id)
              }}
            >
              <Tooltip>{area.name}</Tooltip>
            </Circle>
          );
        })}
        
        {/* 필터링된 인구 데이터 표시 */}
        {filteredData && filteredData.map(place => {
          // 좌표 유효성 확인 (코드 유지)
          if (!place.coordinates || 
              !Array.isArray(place.coordinates) || 
              place.coordinates.length !== 2 ||
              !place.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) ||
              place.coordinates[0] < 37.4 || place.coordinates[0] > 37.7 ||
              place.coordinates[1] < 126.8 || place.coordinates[1] > 127.2) {
            return null;
          }
          
          // 원 스타일 계산 (코드 유지)
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
        
        {/* 선택된 장소 마커 */}
        {selectedPlace && Array.isArray(selectedPlace.coordinates) && 
         selectedPlace.coordinates.length === 2 &&
         selectedPlace.coordinates.every(coord => typeof coord === 'number' && !isNaN(coord)) &&
         selectedPlace.coordinates[0] >= 37.4 && selectedPlace.coordinates[0] <= 37.7 &&
         selectedPlace.coordinates[1] >= 126.8 && selectedPlace.coordinates[1] <= 127.2 && (
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