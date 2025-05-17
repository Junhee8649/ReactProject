// serverless/api/population.js
export default async function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // API 인증키 설정
    const API_KEY = process.env.SEOUL_API_KEY;
    if (!API_KEY) {
      throw new Error("SEOUL_API_KEY 환경 변수가 설정되지 않았습니다.");
    }
    
    // 요청 파라미터 처리
    const { area } = req.query;
    
    // 기본 URL 구성
    let apiUrl;
    
    if (area) {
      // 특정 지역이 요청된 경우
      apiUrl = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/citydata_ppltn/1/5/${encodeURIComponent(area)}`;
    } else {
      // 지역이 지정되지 않은 경우 몇 개의 기본 지역 데이터를 가져옴
      apiUrl = `http://openapi.seoul.go.kr:8088/${API_KEY}/json/citydata_ppltn/1/5/강남 MICE 관광특구`;
    }
    
    console.log(`Calling Seoul API: ${apiUrl}`);
    
    // 실제 API 호출
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log("API Response Keys:", Object.keys(rawData));
    
    // API 응답 확인
    if (rawData.RESULT && rawData.RESULT["RESULT.CODE"] !== "INFO-000") {
      throw new Error(`API Error: ${rawData.RESULT["RESULT.MESSAGE"]}`);
    }
    
    // 응답 데이터 구조 변환
    const dataArray = rawData["SeoulRtd.citydata_ppltn"] || [];
    console.log("Data Array Length:", dataArray.length);
    
    const processedData = {
      timestamp: new Date().toISOString(),
      totalCount: dataArray.length,
      places: dataArray.map(place => ({
        id: place.AREA_CD,
        name: place.AREA_NM,
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
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "서울시 인구 데이터를 불러오는 중 오류가 발생했습니다.",
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      time: new Date().toISOString()
    });
  }
}

// 대략적인 좌표 데이터
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
    '강남역': [37.4982, 127.0279],
    '홍대입구역': [37.5574, 126.9245],
    '서울역': [37.5561, 126.9715],
    '사당역': [37.4766, 126.9816],
    '잠실역': [37.5132, 127.1001],
    // 기본 좌표 (서울 시청)
    'default': [37.5665, 126.9780]
  };
  
  // 이름으로 찾고 없으면 기본 좌표 사용
  const coordinates = placeCoordinates[placeName];
  if (coordinates) return coordinates;
  
  // 이름으로 못찾았으면 서울 시내에 랜덤하게 위치 생성
  const seoulCenter = placeCoordinates['default'];
  const randomOffset = () => (Math.random() - 0.5) * 0.05; // ±0.025도 (약 2~3km)
  
  return [
    seoulCenter[0] + randomOffset(),
    seoulCenter[1] + randomOffset()
  ];
}