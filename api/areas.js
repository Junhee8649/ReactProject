import { areaList, processAreasWithKeywords, categories } from './data/area-list';

export default function handler(req, res) {
  // GET 요청만 허용
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 키워드 처리된 지역 목록 생성
    const areas = processAreasWithKeywords(areaList);
    
    // 키워드별 지역 매핑 생성 (검색 최적화용)
    const keywordMap = {};
    areas.forEach(area => {
      if (area.keywords) {
        area.keywords.forEach(keyword => {
          if (!keywordMap[keyword]) {
            keywordMap[keyword] = [];
          }
          if (!keywordMap[keyword].includes(area.id)) {
            keywordMap[keyword].push(area.id);
          }
        });
      }
    });
    
    // 지역 목록과 카테고리 정보 함께 반환
    res.status(200).json({ 
      areas, 
      categories,
      keywordMap
    });
  } catch (error) {
    console.error("Error in areas API:", error);
    res.status(500).json({ 
      error: "지역 목록을 처리하는 중 오류가 발생했습니다.", 
      message: error.message 
    });
  }
}