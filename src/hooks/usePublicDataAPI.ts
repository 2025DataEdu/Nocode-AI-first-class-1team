import { useQuery } from '@tanstack/react-query';

interface PublicDataItem {
  datasetNm: string;
  categoryNm: string;
  providerNm: string;
  updateCycle: string;
  dataFormat: string;
  downloadCnt: number;
  inquiryCnt: number;
  registDt: string;
  serviceStts: string;
  datasetId: string;
  created_at?: string;
  next_registration_date?: string;
}

interface PublicDataResponse {
  data: PublicDataItem[];
  currentCount: number;
  totalCount: number;
  matchCount?: number; // 국토교통부 데이터 개수
}

// 공공데이터포털 dataset API (더 정확한 데이터)
const API_BASE_URL = 'https://api.odcloud.kr/api/15077093/v1/dataset';
const API_KEY = 'oV%2B46tfJ4OXQwIoLnlilg2wCXoxrwHY2%2BAWuK60otTY8aXinFk%2FK2%2F%2Fcp7zPL6n61Sz91HCrZEyZohIaAH24pw%3D%3D';

export const usePublicData = (page: number = 1, perPage: number = 1000) => {
  return useQuery({
    queryKey: ['publicData', page, perPage],
    queryFn: async (): Promise<PublicDataResponse> => {
      try {
        console.log('공공데이터포털 dataset API 호출 시작...');
        
        // 국토교통부 데이터만 필터링하는 API 호출 (title LIKE 국토교통부)
        const response = await fetch(
          `${API_BASE_URL}?page=${page}&perPage=${perPage}&cond%5Btitle%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${API_KEY}`
        );
        
        console.log('API 응답 상태:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API 에러 응답:', errorText);
          
          // API 실패 시 목업 데이터 반환
          console.log('목업 데이터로 대체합니다.');
          return getMockData();
        }
        
        const result = await response.json();
        console.log('API 성공 응답:', result);
        console.log('matchCount (국토교통부 데이터 수):', result.matchCount);
        console.log('totalCount (전체 공공데이터 수):', result.totalCount);
        
        // API 응답을 변환
        return {
          data: result.data || [],
          currentCount: result.currentCount || 0,
          totalCount: result.totalCount || 0,
          matchCount: result.matchCount || 0 // 국토교통부 데이터 개수
        };
      } catch (error) {
        console.error('API 호출 중 오류:', error);
        console.log('목업 데이터로 대체합니다.');
        return getMockData();
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
    retry: 1
  });
};

// 목업 데이터 함수
const getMockData = (): PublicDataResponse => {
  return {
    data: [
      {
        datasetNm: "국토교통부_도로명주소 전체 분류별 주소",
        categoryNm: "주택/토지",
        providerNm: "국토교통부",
        updateCycle: "월 1회",
        dataFormat: "JSON",
        downloadCnt: 15423,
        inquiryCnt: 89234,
        registDt: "2025-01-15 09:30:00",
        serviceStts: "서비스",
        datasetId: "road-address-2025-001"
      },
      {
        datasetNm: "국토교통부_건축물대장 표제부",
        categoryNm: "주택/토지", 
        providerNm: "국토교통부",
        updateCycle: "월 1회",
        dataFormat: "JSON",
        downloadCnt: 12890,
        inquiryCnt: 67521,
        registDt: "2025-01-12 14:20:00",
        serviceStts: "서비스",
        datasetId: "building-register-2025-002"
      },
      {
        datasetNm: "국토교통부_부동산 실거래가 정보",
        categoryNm: "주택/토지",
        providerNm: "국토교통부", 
        updateCycle: "월 1회",
        dataFormat: "JSON",
        downloadCnt: 28945,
        inquiryCnt: 156789,
        registDt: "2025-01-10 11:45:00",
        serviceStts: "서비스",
        datasetId: "real-estate-transaction-2025-003"
      },
      {
        datasetNm: "국토교통부_교통카드 통계정보",
        categoryNm: "교통",
        providerNm: "국토교통부",
        updateCycle: "주 1회", 
        dataFormat: "JSON",
        downloadCnt: 9876,
        inquiryCnt: 45632,
        registDt: "2025-01-08 16:15:00",
        serviceStts: "서비스",
        datasetId: "traffic-card-stats-2025-004"
      },
      {
        datasetNm: "국토교통부_철도역 정보",
        categoryNm: "교통",
        providerNm: "국토교통부",
        updateCycle: "분기 1회",
        dataFormat: "JSON", 
        downloadCnt: 5432,
        inquiryCnt: 23456,
        registDt: "2025-01-05 10:30:00",
        serviceStts: "서비스",
        datasetId: "railway-station-info-2025-005"
      },
      {
        datasetNm: "국토교통부_항공운항통계", 
        categoryNm: "교통",
        providerNm: "국토교통부",
        updateCycle: "월 1회",
        dataFormat: "JSON",
        downloadCnt: 7654,
        inquiryCnt: 34567,
        registDt: "2025-01-03 13:20:00", 
        serviceStts: "서비스",
        datasetId: "aviation-stats-2025-006"
      },
      {
        datasetNm: "국토교통부_도시계획시설 정보",
        categoryNm: "주택/토지",
        providerNm: "국토교통부",
        updateCycle: "분기 1회",
        dataFormat: "JSON",
        downloadCnt: 4321,
        inquiryCnt: 19876,
        registDt: "2024-12-28 15:45:00",
        serviceStts: "서비스", 
        datasetId: "urban-planning-facilities-2024-007"
      },
      {
        datasetNm: "국토교통부_공동주택 관리정보",
        categoryNm: "주택/토지",
        providerNm: "국토교통부",
        updateCycle: "월 1회",
        dataFormat: "JSON",
        downloadCnt: 11234,
        inquiryCnt: 56789,
        registDt: "2024-12-25 09:10:00",
        serviceStts: "서비스",
        datasetId: "apartment-management-2024-008"
      }
    ],
    currentCount: 8,
    totalCount: 95775,  // 공공데이터포털 전체 데이터셋
    matchCount: 1481    // 국토교통부 데이터셋
  };
};
