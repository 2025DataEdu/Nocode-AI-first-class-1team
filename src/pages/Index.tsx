import { useState, useMemo } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCards from "@/components/StatsCards";
import DataCharts from "@/components/DataCharts";
import DataTable from "@/components/DataTable";
import FilterPanel from "@/components/FilterPanel";
import TopUtilizationRanking from "@/components/TopUtilizationRanking";
import ChatBot from "@/components/ChatBot";
import CompactDownloadButtons from "@/components/CompactDownloadButtons";
import { useOpenDataCategories } from "@/hooks/useOpenDataCategories";
import { useOpenData } from "@/hooks/useOpenData";
import { useApiCall } from "@/hooks/useApiCall";
import { DownloadData } from "@/utils/downloadUtils";
const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");

  // 다운로드용 데이터를 준비
  const {
    categories
  } = useOpenDataCategories();
  const {
    data: openDataResult
  } = useOpenData();
  const {
    data: apiCallData
  } = useApiCall();
  const downloadData: DownloadData = useMemo(() => {
    // 통계 데이터
    const totalDatasets = openDataResult?.data?.length || 0;
    const totalApiCalls = apiCallData?.data?.reduce((sum, item) => sum + (item.호출건수 || 0), 0) || 0;
    const totalDownloads = 150000; // 임시값

    // 카테고리 데이터 (전체 제외)
    const categoryData = categories.slice(1).map(cat => ({
      name: cat.name,
      count: cat.count
    }));

    // 연간 추이 데이터
    const baseApiCalls = Math.floor(totalApiCalls * 0.7);
    const yearlyTrend = [{
      year: "2019",
      downloads: Math.floor(totalDownloads * 0.6),
      apiCalls: Math.floor(baseApiCalls * 0.5)
    }, {
      year: "2020",
      downloads: Math.floor(totalDownloads * 0.75),
      apiCalls: Math.floor(baseApiCalls * 0.65)
    }, {
      year: "2021",
      downloads: Math.floor(totalDownloads * 0.85),
      apiCalls: Math.floor(baseApiCalls * 0.78)
    }, {
      year: "2022",
      downloads: Math.floor(totalDownloads * 0.92),
      apiCalls: Math.floor(baseApiCalls * 0.88)
    }, {
      year: "2023",
      downloads: Math.floor(totalDownloads * 0.98),
      apiCalls: Math.floor(baseApiCalls * 0.95)
    }, {
      year: "2024",
      downloads: totalDownloads,
      apiCalls: totalApiCalls
    }];

    // 테이블 데이터
    const tableData = openDataResult?.data?.slice(0, 10).map(item => ({
      목록명: (item.목록명 || '목록명 없음').replace(/^국토교통부[_\s]*/, ''),
      담당부서: item.담당부서 || '담당부서 없음',
      목록타입: item.목록타입 || '타입 없음',
      분류체계: item.분류체계 || '기타',
      등록일: item.등록일 ? new Date(item.등록일).toLocaleDateString() : '날짜 없음',
      마지막수정일: item.마지막수정일 ? new Date(item.마지막수정일).toLocaleDateString() : '날짜 없음'
    })) || [];

    // TOP 10 데이터
    const apiTopData = apiCallData?.data?.filter(item => item.호출건수 && item.호출건수 > 0)?.sort((a, b) => (b.호출건수 || 0) - (a.호출건수 || 0))?.slice(0, 10)?.map((item, index) => ({
      rank: index + 1,
      name: item.목록명 || '데이터명 없음',
      institution: '국토교통부',
      usage: item.호출건수 || 0,
      change: `+${(Math.random() * 20 + 1).toFixed(1)}%`
    })) || [];
    const fileTopData = [{
      rank: 1,
      name: "부동산 실거래가 데이터",
      institution: "국토교통부",
      usage: 45892,
      change: "+18.3%"
    }, {
      rank: 2,
      name: "교통사고 통계 데이터",
      institution: "도로교통공단",
      usage: 38421,
      change: "+14.7%"
    }, {
      rank: 3,
      name: "건축물 대장 데이터",
      institution: "건축도시공간연구소",
      usage: 32156,
      change: "+11.9%"
    }, {
      rank: 4,
      name: "지적도 Shape 파일",
      institution: "국토지리정보원",
      usage: 28734,
      change: "+9.8%"
    }, {
      rank: 5,
      name: "항만 물동량 통계",
      institution: "해양수산부",
      usage: 25683,
      change: "+8.4%"
    }, {
      rank: 6,
      name: "철도역 정보 데이터",
      institution: "한국철도공사",
      usage: 22457,
      change: "+7.1%"
    }, {
      rank: 7,
      name: "공항 시설정보",
      institution: "한국공항공사",
      usage: 19832,
      change: "+6.3%"
    }, {
      rank: 8,
      name: "도로명 주소 데이터",
      institution: "행정안전부",
      usage: 17596,
      change: "+5.2%"
    }, {
      rank: 9,
      name: "건설공사 현황",
      institution: "대한건설협회",
      usage: 15284,
      change: "+4.6%"
    }, {
      rank: 10,
      name: "교통량 조사 데이터",
      institution: "한국도로공사",
      usage: 13947,
      change: "+3.8%"
    }];
    return {
      stats: {
        totalDatasets,
        totalDownloads,
        totalApiCalls
      },
      categoryData,
      yearlyTrend,
      tableData,
      topUtilization: {
        api: apiTopData,
        file: fileTopData
      }
    };
  }, [categories, openDataResult, apiCallData]);
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <DashboardHeader />
      
      <div id="dashboard-content" className="container mx-auto px-4 py-6 space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <h1 className="text-4xl font-bold text-gray-800">기관별 공공데이터 현황</h1>
            <CompactDownloadButtons data={downloadData} />
          </div>
          <p className="text-lg text-gray-600">공공데이터포털에 등록된 국토교통부 개방데이터의 현황 및 활용도를 한 눈에 확인할 수 있습니다.</p>
        </div>

        {/* 상단 3개 카드 - 공공데이터 수, 활용현황, 갱신현황 */}
        <StatsCards />
        
        {/* 챗봇 검색창 */}
        <ChatBot />
        
        {/* 중간 2개 카드 - 분류체계별 데이터 + 연간 추이 */}
        <DataCharts selectedCategory={selectedCategory} />
        
        {/* 하단 좌측 사이드바 + 우측 메인 콘텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 좌측 사이드바 - 보류목록 + 필터 */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
          
          {/* 우측 메인 콘텐츠 - 국토교통부 최신 등록 데이터셋 */}
          <div className="lg:col-span-3 space-y-6">
            <DataTable selectedCategory={selectedCategory} searchTerm={searchTerm} />
          </div>
        </div>
        
        {/* 하단 활용도 TOP 10 */}
        <TopUtilizationRanking />
      </div>
    </div>;
};
export default Index;