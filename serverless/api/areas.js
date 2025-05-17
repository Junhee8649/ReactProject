// serverless/api/areas.js
export default function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 서울시 주요 지역 목록 (카테고리별로 구성)
    const areas = [
      // 관광특구
      { id: '강남 MICE 관광특구', name: '강남 MICE 관광특구', category: 'tourist', coordinates: [37.5065, 127.0617] },
      { id: '동대문 관광특구', name: '동대문 관광특구', category: 'tourist', coordinates: [37.5655, 127.0077] },
      { id: '명동 관광특구', name: '명동 관광특구', category: 'tourist', coordinates: [37.5634, 126.9830] },
      { id: '이태원 관광특구', name: '이태원 관광특구', category: 'tourist', coordinates: [37.5347, 126.9941] },
      { id: '홍대 관광특구', name: '홍대 관광특구', category: 'tourist', coordinates: [37.5552, 126.9206] },
      
      // 주요 역
      { id: '강남역', name: '강남역', category: 'station', coordinates: [37.4982, 127.0279] },
      { id: '홍대입구역', name: '홍대입구역', category: 'station', coordinates: [37.5574, 126.9245] },
      { id: '서울역', name: '서울역', category: 'station', coordinates: [37.5561, 126.9715] },
      { id: '사당역', name: '사당역', category: 'station', coordinates: [37.4766, 126.9816] },
      { id: '잠실역', name: '잠실역', category: 'station', coordinates: [37.5132, 127.1001] },
      
      // 공원
      { id: '남산공원', name: '남산공원', category: 'park', coordinates: [37.5512, 126.9882] },
      { id: '여의도공원', name: '여의도공원', category: 'park', coordinates: [37.5249, 126.9237] },
      { id: '올림픽공원', name: '올림픽공원', category: 'park', coordinates: [37.5221, 127.1214] },
      
      // 쇼핑
      { id: '동대문 시장', name: '동대문 시장', category: 'shopping', coordinates: [37.5712, 127.0075] },
      { id: '명동', name: '명동', category: 'shopping', coordinates: [37.5634, 126.9830] },
      { id: '가로수길', name: '가로수길', category: 'shopping', coordinates: [37.5218, 127.0232] },
      { id: '코엑스', name: '코엑스', category: 'shopping', coordinates: [37.5124, 127.0587] },
      
      // 추가 지역들
      { id: '경복궁', name: '경복궁', category: 'landmark', coordinates: [37.5769, 126.9769] },
      { id: '광화문광장', name: '광화문광장', category: 'landmark', coordinates: [37.5725, 126.9769] },
    ];
    
    // 카테고리 정보
    const categories = [
      { id: 'tourist', name: '관광특구' },
      { id: 'station', name: '주요역' },
      { id: 'park', name: '공원' },
      { id: 'shopping', name: '쇼핑' },
      { id: 'landmark', name: '랜드마크' },
    ];
    
    // 지역 목록과 카테고리 정보 함께 반환
    res.status(200).json({ areas, categories });
  } catch (error) {
    console.error("Error in areas API:", error);
    res.status(500).json({ 
      error: "지역 목록을 처리하는 중 오류가 발생했습니다.", 
      message: error.message 
    });
  }
}