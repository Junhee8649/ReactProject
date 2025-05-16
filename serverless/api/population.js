// 서울시 실시간 인구 데이터 API 연동 함수
export default async function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 요청 파라미터 처리
  const { area } = req.query;

  try {
    // API 인증키 및 설정
    const API_KEY = process.env.SEOUL_API_KEY;
    
    // 기본 URL 구성
    let apiUrl = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/citydata_ppltn/1/50/`;
    
    // 특정 지역이 요청되었을 경우
    if (area) {
      apiUrl = `${apiUrl}${encodeURIComponent(area)}`;
    }
    
    console.log(`Calling Seoul API: ${apiUrl}`);
    
    // 실제 API 호출
    const response = await fetch(apiUrl);
    const rawData = await response.json();
    
    // API 응답 확인
    if (rawData.RESULT && rawData.RESULT.CODE !== "INFO-000") {
      throw new Error(`API Error: ${rawData.RESULT.MESSAGE}`);
    }
    
    // 응답 데이터 구조 변환
    const processedData = {
      timestamp: new Date().toISOString(),
      totalCount: rawData.citydata_ppltn.list_total_count || 0,
      places: rawData.citydata_ppltn.row.map(place => ({
        id: place.AREA_CD,
        name: place.AREA_NM,
        // 실제 좌표는 API에서 제공하지 않음, 대략적인 위치 사용
        coordinates: getCoordinatesForPlace(place.AREA_NM, place.AREA_CD),
        congestionLevel: place.AREA_CONGEST_LVL,
        congestionMessage: place.AREA_CONGEST_MSG,
        populationMin: parseInt(place.AREA_PPLTN_MIN || 0),
        populationMax: parseInt(place.AREA_PPLTN_MAX || 0),
        gender: {
          male: parseFloat(place.MALE_PPLTN_RATE || 0),
          female: parseFloat(place.FEMALE_PPLTN_RATE || 0)
        },
        ageGroups: {
          '0': parseFloat(place.PPLTN_RATE_0 || 0),
          '10s': parseFloat(place.PPLTN_RATE_10 || 0),
          '20s': parseFloat(place.PPLTN_RATE_20 || 0),
          '30s': parseFloat(place.PPLTN_RATE_30 || 0),
          '40s': parseFloat(place.PPLTN_RATE_40 || 0),
          '50s': parseFloat(place.PPLTN_RATE_50 || 0),
          '60s': parseFloat(place.PPLTN_RATE_60 || 0),
          '70s': parseFloat(place.PPLTN_RATE_70 || 0)
        },
        updatedAt: place.PPLTN_TIME,
        hasForecast: place.FCST_YN === "Y"
      }))
    };
    
    // 데이터 반환
    res.status(200).json(processedData);
  } catch (error) {
    console.error("Error fetching population data:", error);
    res.status(500).json({ 
      error: "서울시 인구 데이터를 불러오는 중 오류가 발생했습니다.",
      message: error.message
    });
  }
}

// 대략적인 좌표 데이터 (실제론 별도 매핑 정보 필요)
function getCoordinatesForPlace(placeName, placeCode) {
  // 대략적인 상징적 장소들의 좌표만 제공
  const placeCoordinates = {
    '강남 MICE 관광특구': [37.5065, 127.0617],
    '동대문 관광특구': [37.5655, 127.0077],
    '명동 관광특구': [37.5634, 126.9830],
    '이태원 관광특구': [37.5347, 126.9941],
    '홍대 관광특구': [37.5552, 126.9206],
    '경복궁': [37.5769, 126.9769],
    '광화문광장': [37.5725, 126.9769],
    '남산공원': [37.5512, 126.9882],
    '여의도공원': [37.5249, 126.9237],
    '올림픽공원': [37.5221, 127.1214],
    // 기본 좌표 (서울 시청)
    'default': [37.5665, 126.9780]
  };
  
  // 이름으로 찾고 없으면 기본 좌표 사용
  const coordinates = placeCoordinates[placeName];
  if (coordinates) return coordinates;
  
  // 이름으로 못찾았으면 서울 시내에 랜덤하게 위치 생성 (시각화 목적)
  // 실제 앱에서는 정확한 좌표 데이터를 사용해야 함
  const seoulCenter = placeCoordinates['default'];
  const randomOffset = () => (Math.random() - 0.5) * 0.05; // ±0.025도 (약 2~3km)
  
  return [
    seoulCenter[0] + randomOffset(),
    seoulCenter[1] + randomOffset()
  ];
}