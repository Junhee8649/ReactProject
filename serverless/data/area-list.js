// serverless/data/area-list.js
export const areaList = [
  // 관광특구
  { id: "강남 MICE 관광특구", name: "강남 MICE 관광특구", category: "tourist", coordinates: [37.5065, 127.0617] },
  { id: "동대문 관광특구", name: "동대문 관광특구", category: "tourist", coordinates: [37.5655, 127.0077] },
  { id: "명동 관광특구", name: "명동 관광특구", category: "tourist", coordinates: [37.5634, 126.9830] },
  { id: "이태원 관광특구", name: "이태원 관광특구", category: "tourist", coordinates: [37.5347, 126.9941] },
  { id: "잠실 관광특구", name: "잠실 관광특구", category: "tourist", coordinates: [37.5132, 127.1001] },
  { id: "종로·청계 관광특구", name: "종로·청계 관광특구", category: "tourist", coordinates: [37.5704, 126.9922] },
  { id: "홍대 관광특구", name: "홍대 관광특구", category: "tourist", coordinates: [37.5552, 126.9206] },
  
  // 고궁·문화유산
  { id: "경복궁", name: "경복궁", category: "heritage", coordinates: [37.5769, 126.9769] },
  { id: "광화문·덕수궁", name: "광화문·덕수궁", category: "heritage", coordinates: [37.5725, 126.9769] },
  { id: "보신각", name: "보신각", category: "heritage", coordinates: [37.5695, 126.9837] },
  { id: "서울 암사동 유적", name: "서울 암사동 유적", category: "heritage", coordinates: [37.5570, 127.1279] },
  { id: "창덕궁·종묘", name: "창덕궁·종묘", category: "heritage", coordinates: [37.5792, 126.9911] },
  
  // 인구밀집지역 (역)
  { id: "가산디지털단지역", name: "가산디지털단지역", category: "station", coordinates: [37.4819, 126.8822] },
  { id: "강남역", name: "강남역", category: "station", coordinates: [37.4982, 127.0279] },
  { id: "건대입구역", name: "건대입구역", category: "station", coordinates: [37.5407, 127.0694] },
  { id: "고덕역", name: "고덕역", category: "station", coordinates: [37.5546, 127.1544] },
  { id: "고속터미널역", name: "고속터미널역", category: "station", coordinates: [37.5046, 127.0047] },
  { id: "교대역", name: "교대역", category: "station", coordinates: [37.4935, 127.0142] },
  { id: "구로디지털단지역", name: "구로디지털단지역", category: "station", coordinates: [37.4858, 126.9014] },
  { id: "구로역", name: "구로역", category: "station", coordinates: [37.5033, 126.8819] },
  { id: "군자역", name: "군자역", category: "station", coordinates: [37.5572, 127.0793] },
  { id: "대림역", name: "대림역", category: "station", coordinates: [37.4913, 126.8953] },
  { id: "동대문역", name: "동대문역", category: "station", coordinates: [37.5710, 127.0097] },
  { id: "뚝섬역", name: "뚝섬역", category: "station", coordinates: [37.5474, 127.0474] },
  { id: "미아사거리역", name: "미아사거리역", category: "station", coordinates: [37.6134, 127.0300] },
  { id: "발산역", name: "발산역", category: "station", coordinates: [37.5581, 126.8387] },
  { id: "사당역", name: "사당역", category: "station", coordinates: [37.4766, 126.9816] },
  { id: "삼각지역", name: "삼각지역", category: "station", coordinates: [37.5344, 126.9729] },
  { id: "서울대입구역", name: "서울대입구역", category: "station", coordinates: [37.4813, 126.9524] },
  { id: "서울식물원·마곡나루역", name: "서울식물원·마곡나루역", category: "station", coordinates: [37.5669, 126.8275] },
  { id: "서울역", name: "서울역", category: "station", coordinates: [37.5561, 126.9715] },
  { id: "선릉역", name: "선릉역", category: "station", coordinates: [37.5045, 127.0486] },
  { id: "성신여대입구역", name: "성신여대입구역", category: "station", coordinates: [37.5926, 127.0163] },
  { id: "수유역", name: "수유역", category: "station", coordinates: [37.6366, 127.0256] },
  { id: "신논현역·논현역", name: "신논현역·논현역", category: "station", coordinates: [37.5045, 127.0215] },
  { id: "신도림역", name: "신도림역", category: "station", coordinates: [37.5090, 126.8912] },
  { id: "신림역", name: "신림역", category: "station", coordinates: [37.4840, 126.9295] },
  { id: "신촌·이대역", name: "신촌·이대역", category: "station", coordinates: [37.5568, 126.9421] },
  { id: "양재역", name: "양재역", category: "station", coordinates: [37.4847, 127.0346] },
  { id: "역삼역", name: "역삼역", category: "station", coordinates: [37.5008, 127.0362] },
  { id: "연신내역", name: "연신내역", category: "station", coordinates: [37.6191, 126.9212] },
  { id: "오목교역·목동운동장", name: "오목교역·목동운동장", category: "station", coordinates: [37.5245, 126.8757] },
  { id: "왕십리역", name: "왕십리역", category: "station", coordinates: [37.5615, 127.0370] },
  { id: "용산역", name: "용산역", category: "station", coordinates: [37.5301, 126.9651] },
  { id: "이태원역", name: "이태원역", category: "station", coordinates: [37.5347, 126.9941] },
  { id: "장지역", name: "장지역", category: "station", coordinates: [37.4794, 127.1270] },
  { id: "장한평역", name: "장한평역", category: "station", coordinates: [37.5614, 127.0645] },
  { id: "천호역", name: "천호역", category: "station", coordinates: [37.5390, 127.1234] },
  { id: "총신대입구(이수)역", name: "총신대입구(이수)역", category: "station", coordinates: [37.4864, 126.9821] },
  { id: "충정로역", name: "충정로역", category: "station", coordinates: [37.5599, 126.9637] },
  { id: "합정역", name: "합정역", category: "station", coordinates: [37.5500, 126.9136] },
  { id: "혜화역", name: "혜화역", category: "station", coordinates: [37.5820, 127.0016] },
  { id: "홍대입구역(2호선)", name: "홍대입구역(2호선)", category: "station", coordinates: [37.5574, 126.9245] },
  { id: "회기역", name: "회기역", category: "station", coordinates: [37.5899, 127.0568] },
  { id: "쌍문역", name: "쌍문역", category: "station", coordinates: [37.6489, 127.0348] },
  { id: "신정네거리역", name: "신정네거리역", category: "station", coordinates: [37.5123, 126.8532] },
  { id: "잠실새내역", name: "잠실새내역", category: "station", coordinates: [37.5113, 127.0861] },
  { id: "잠실역", name: "잠실역", category: "station", coordinates: [37.5132, 127.1001] },
  
  // 발달상권
  { id: "가락시장", name: "가락시장", category: "shopping", coordinates: [37.4934, 127.1185] },
  { id: "가로수길", name: "가로수길", category: "shopping", coordinates: [37.5218, 127.0232] },
  { id: "광장(전통)시장", name: "광장(전통)시장", category: "shopping", coordinates: [37.5350, 127.0912] },
  { id: "김포공항", name: "김포공항", category: "shopping", coordinates: [37.5583, 126.8024] },
  { id: "노량진", name: "노량진", category: "shopping", coordinates: [37.5132, 126.9421] },
  { id: "덕수궁길·정동길", name: "덕수궁길·정동길", category: "shopping", coordinates: [37.5652, 126.9744] },
  { id: "북촌한옥마을", name: "북촌한옥마을", category: "shopping", coordinates: [37.5811, 126.9846] },
  { id: "서촌", name: "서촌", category: "shopping", coordinates: [37.5790, 126.9710] },
  { id: "성수카페거리", name: "성수카페거리", category: "shopping", coordinates: [37.5466, 127.0476] },
  { id: "압구정로데오거리", name: "압구정로데오거리", category: "shopping", coordinates: [37.5274, 127.0388] },
  { id: "여의도", name: "여의도", category: "shopping", coordinates: [37.5249, 126.9237] },
  { id: "연남동", name: "연남동", category: "shopping", coordinates: [37.5626, 126.9252] },
  { id: "영등포 타임스퀘어", name: "영등포 타임스퀘어", category: "shopping", coordinates: [37.5172, 126.9033] },
  { id: "용리단길", name: "용리단길", category: "shopping", coordinates: [37.5320, 126.9654] },
  { id: "이태원 앤틱가구거리", name: "이태원 앤틱가구거리", category: "shopping", coordinates: [37.5340, 126.9933] },
  { id: "인사동", name: "인사동", category: "shopping", coordinates: [37.5744, 126.9856] },
  { id: "창동 신경제 중심지", name: "창동 신경제 중심지", category: "shopping", coordinates: [37.6540, 127.0495] },
  { id: "청담동 명품거리", name: "청담동 명품거리", category: "shopping", coordinates: [37.5240, 127.0531] },
  { id: "청량리 제기동 일대 전통시장", name: "청량리 제기동 일대 전통시장", category: "shopping", coordinates: [37.5802, 127.0377] },
  { id: "해방촌·경리단길", name: "해방촌·경리단길", category: "shopping", coordinates: [37.5381, 126.9911] },
  { id: "DDP(동대문디자인플라자)", name: "DDP(동대문디자인플라자)", category: "shopping", coordinates: [37.5676, 127.0093] },
  { id: "DMC(디지털미디어시티)", name: "DMC(디지털미디어시티)", category: "shopping", coordinates: [37.5812, 126.8928] },
  { id: "북창동 먹자골목", name: "북창동 먹자골목", category: "shopping", coordinates: [37.5638, 126.9775] },
  { id: "남대문시장", name: "남대문시장", category: "shopping", coordinates: [37.5592, 126.9777] },
  { id: "익선동", name: "익선동", category: "shopping", coordinates: [37.5741, 126.9883] },
  { id: "잠실롯데타워 일대", name: "잠실롯데타워 일대", category: "shopping", coordinates: [37.5123, 127.1025] },
  { id: "송리단길·호수단길", name: "송리단길·호수단길", category: "shopping", coordinates: [37.5168, 127.0979] },
  { id: "신촌 스타광장", name: "신촌 스타광장", category: "shopping", coordinates: [37.5567, 126.9367] },

  // 공원
  { id: "강서한강공원", name: "강서한강공원", category: "park", coordinates: [37.5881, 126.8170] },
  { id: "고척돔", name: "고척돔", category: "park", coordinates: [37.4982, 126.8668] },
  { id: "광나루한강공원", name: "광나루한강공원", category: "park", coordinates: [37.5452, 127.1203] },
  { id: "광화문광장", name: "광화문광장", category: "park", coordinates: [37.5725, 126.9769] },
  { id: "국립중앙박물관·용산가족공원", name: "국립중앙박물관·용산가족공원", category: "park", coordinates: [37.5240, 126.9800] },
  { id: "난지한강공원", name: "난지한강공원", category: "park", coordinates: [37.5623, 126.8775] },
  { id: "남산공원", name: "남산공원", category: "park", coordinates: [37.5512, 126.9882] },
  { id: "노들섬", name: "노들섬", category: "park", coordinates: [37.5175, 126.9567] },
  { id: "뚝섬한강공원", name: "뚝섬한강공원", category: "park", coordinates: [37.5290, 127.0686] },
  { id: "망원한강공원", name: "망원한강공원", category: "park", coordinates: [37.5504, 126.9013] },
  { id: "반포한강공원", name: "반포한강공원", category: "park", coordinates: [37.5102, 126.9973] },
  { id: "북서울꿈의숲", name: "북서울꿈의숲", category: "park", coordinates: [37.6206, 127.0414] },
  { id: "서리풀공원·몽마르뜨공원", name: "서리풀공원·몽마르뜨공원", category: "park", coordinates: [37.4831, 127.0078] },
  { id: "서울광장", name: "서울광장", category: "park", coordinates: [37.5651, 126.9782] },
  { id: "서울대공원", name: "서울대공원", category: "park", coordinates: [37.4273, 127.0165] },
  { id: "서울숲공원", name: "서울숲공원", category: "park", coordinates: [37.5443, 127.0379] },
  { id: "아차산", name: "아차산", category: "park", coordinates: [37.5658, 127.1059] },
  { id: "양화한강공원", name: "양화한강공원", category: "park", coordinates: [37.5461, 126.8968] },
  { id: "어린이대공원", name: "어린이대공원", category: "park", coordinates: [37.5491, 127.0748] },
  { id: "여의도한강공원", name: "여의도한강공원", category: "park", coordinates: [37.5283, 126.9317] },
  { id: "월드컵공원", name: "월드컵공원", category: "park", coordinates: [37.5684, 126.8829] },
  { id: "응봉산", name: "응봉산", category: "park", coordinates: [37.5489, 127.0316] },
  { id: "이촌한강공원", name: "이촌한강공원", category: "park", coordinates: [37.5203, 126.9664] },
  { id: "잠실종합운동장", name: "잠실종합운동장", category: "park", coordinates: [37.5140, 127.0734] },
  { id: "잠실한강공원", name: "잠실한강공원", category: "park", coordinates: [37.5167, 127.0932] },
  { id: "잠원한강공원", name: "잠원한강공원", category: "park", coordinates: [37.5148, 127.0119] },
  { id: "청계산", name: "청계산", category: "park", coordinates: [37.4239, 127.0562] },
  { id: "청와대", name: "청와대", category: "park", coordinates: [37.5866, 126.9777] },
  { id: "보라매공원", name: "보라매공원", category: "park", coordinates: [37.4931, 126.9195] },
  { id: "서대문독립공원", name: "서대문독립공원", category: "park", coordinates: [37.5723, 126.9601] },
  { id: "안양천", name: "안양천", category: "park", coordinates: [37.5171, 126.8904] },
  { id: "여의서로", name: "여의서로", category: "park", coordinates: [37.5264, 126.9197] },
  { id: "올림픽공원", name: "올림픽공원", category: "park", coordinates: [37.5221, 127.1214] },
  { id: "홍제폭포", name: "홍제폭포", category: "park", coordinates: [37.5954, 126.9507] }
];

// 카테고리 정의
export const categories = [
  { id: "tourist", name: "관광특구" },
  { id: "heritage", name: "고궁·문화유산" },
  { id: "station", name: "주요역" },
  { id: "shopping", name: "발달상권" },
  { id: "park", name: "공원" }
];

// 키워드 자동 생성 (메모리에만 존재, 저장X)
export const processAreasWithKeywords = (areas) => {
  return areas.map(area => {
    const keywords = new Set([area.name.toLowerCase()]);
    
    // 공백, 특수문자 등으로 분리하여 키워드 추가
    area.name.split(/[\s·\(\)]+/).forEach(part => {
      if (part && part.length > 1) keywords.add(part.toLowerCase());
    });
    
    // 특별 케이스 추가
    const specialMappings = {
      "강남": ["강남역", "강남구", "강남구청", "강남 MICE"],
      "홍대": ["홍대입구역", "홍대입구", "홍익대", "홍익대학교"],
      "명동": ["명동역", "명동입구"],
      "이태원": ["이태원역", "이태원입구"],
      "동대문": ["동대문역", "동대문역사문화공원", "동대문디자인플라자"],
      "잠실": ["잠실역", "잠실새내", "잠실롯데타워", "롯데월드타워"],
      "종로": ["종로구", "종각역", "종로1가", "종로2가", "종로3가", "종로5가"],
      "청계": ["청계천", "청계광장"],
      "광화문": ["광화문역", "광화문광장", "광화문사거리"],
      "서울역": ["서울스퀘어", "남대문"]
    };
    
    // 이름에 특정 키워드가 포함되면 매핑 추가
    Object.entries(specialMappings).forEach(([key, values]) => {
      if (area.name.toLowerCase().includes(key.toLowerCase())) {
        values.forEach(v => keywords.add(v.toLowerCase()));
      }
    });
    
    return { ...area, keywords: Array.from(keywords) };
  });
};