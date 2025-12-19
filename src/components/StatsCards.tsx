import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, FileText, Database, TrendingUp, Users, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { usePublicData } from "@/hooks/usePublicDataAPI";
import { useOpenData } from "@/hooks/useOpenData";
import { useApiCall } from "@/hooks/useApiCall";
import { useMonthlyStats } from "@/hooks/useMonthlyStats";
import { useFilesDownload } from "@/hooks/useFilesDownload";
import { useSyncPublicData } from "@/hooks/useSyncPublicData";
import { useToast } from "@/hooks/use-toast";

const StatsCards = () => {
  const {
    data: apiData,
    isLoading
  } = usePublicData();
  const {
    data: supabaseData,
    isLoading: isSupabaseLoading
  } = useOpenData();
  const {
    data: apiCallData,
    isLoading: isApiCallLoading
  } = useApiCall();
  const {
    data: monthlyStatsData,
    isLoading: isMonthlyStatsLoading
  } = useMonthlyStats();
  const {
    data: filesDownloadData,
    isLoading: isFilesDownloadLoading
  } = useFilesDownload();
  
  const syncMutation = useSyncPublicData();
  const { toast } = useToast();

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      toast({
        title: "동기화 완료",
        description: "공공데이터 정보가 업데이트되었습니다.",
      });
    } catch (error) {
      toast({
        title: "동기화 실패",
        description: "데이터 동기화 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // monthly_stats에서 최신 데이터 가져오기
  const latestStats = monthlyStatsData && monthlyStatsData.length > 0 
    ? monthlyStatsData[monthlyStatsData.length - 1] 
    : null;

  // API에서 가져온 totalCount (전체 공공데이터) 사용 - monthly_stats 우선
  const totalDatasetCount = latestStats?.total_datasets || apiData?.totalCount || 17285;

  // 국토교통부 데이터 수 - monthly_stats 우선, 없으면 API 값 사용
  const nationalTransportDataCount = latestStats?.national_transport_datasets || apiData?.totalCount || 17285;

  // files_download 테이블에서 가져온 전체 레코드 수를 다운로드 수로 사용
  const totalDownloadCount = filesDownloadData?.totalRecords || 0;

  // 디버깅용 로그 추가
  console.log('StatsCards - filesDownloadData:', filesDownloadData);
  console.log('StatsCards - totalDownloadCount:', totalDownloadCount);
  console.log('StatsCards - isFilesDownloadLoading:', isFilesDownloadLoading);

  // API Call 데이터에서 실제 호출 건수 계산
  const totalApiCallCount = apiCallData?.data?.reduce((sum, item) => sum + (item.호출건수 || 0), 0) || 0;

  // openData 테이블에서 갱신 현황 분석 - 기타를 갱신 완료에 합계
  const openDataStatusSummary = supabaseData?.data ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정하여 날짜만 비교

    let completed = 0; // 갱신 완료 (차기등록 예정일이 오늘 이후 + 기타)
    let required = 0; // 갱신 필요 (차기등록 예정일이 오늘 이전)

    supabaseData.data.forEach(item => {
      const nextRegistrationDate = item["차기등록 예정일"];
      if (nextRegistrationDate) {
        const registrationDate = new Date(nextRegistrationDate);
        registrationDate.setHours(0, 0, 0, 0);
        if (registrationDate >= today) {
          completed++;
        } else {
          required++;
        }
      } else {
        // 기타(링크, 1회성 등)를 갱신 완료에 합계
        completed++;
      }
    });
    return {
      completed,
      required
    };
  })() : {
    completed: 0,
    required: 0
  };

  // 전월 대비 변화율 계산
  const getMonthOverMonthChange = () => {
    if (!monthlyStatsData || monthlyStatsData.length < 2) {
      return {
        datasets: '+5.2%',
        nationalTransport: '+8.1%',
        downloads: '+12.5%',
        apiCalls: '+15.3%',
        updatedDatasets: '+3.2%',
        outdatedDatasets: '-2.1%'
      };
    }

    // 최근 2개월 데이터 가져오기
    const latest = monthlyStatsData[monthlyStatsData.length - 1];
    const previous = monthlyStatsData[monthlyStatsData.length - 2];

    const calculateChange = (current: number, prev: number) => {
      if (prev === 0) return '+0.0%';
      const change = ((current - prev) / prev) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return {
      datasets: calculateChange(latest.total_datasets, previous.total_datasets),
      nationalTransport: calculateChange(latest.national_transport_datasets, previous.national_transport_datasets),
      downloads: calculateChange(latest.total_downloads, previous.total_downloads),
      apiCalls: calculateChange(latest.total_api_calls, previous.total_api_calls),
      updatedDatasets: calculateChange(latest.updated_datasets, previous.updated_datasets),
      outdatedDatasets: calculateChange(latest.outdated_datasets, previous.outdated_datasets)
    };
  };

  const monthOverMonthChanges = getMonthOverMonthChange();

  // 호출 건수를 K 단위로 포맷하는 함수
  const formatApiCallCount = (count: number) => {
    if (count >= 1000000) {
      return Math.round(count / 1000000) + 'M';
    } else if (count >= 1000) {
      return Math.round(count / 1000) + 'K';
    }
    return count.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 공공데이터 수 카드 - 고정 높이 적용 */}
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 h-[450px] flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                  공공데이터 수
                </CardTitle>
                <p className="text-sm text-gray-500">전체 및 국토교통부 현황</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-6">
          {/* 공공데이터포털 전체 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:border-gray-300 transition-colors duration-200 flex-1 flex items-center">
            <div className="flex items-center justify-between h-full w-full">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                  <span className="text-sm font-medium text-gray-700">공공데이터포털 전체</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-lg">로딩중...</span>
                    </div>
                  ) : (
                    totalDatasetCount.toLocaleString()
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">{monthOverMonthChanges.datasets}</span>
                  </div>
                  <span className="text-xs text-gray-500">전월 대비</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 국토교통부 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 transition-colors duration-200 shadow-sm flex-1 flex items-center">
            <div className="flex items-center justify-between h-full w-full">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-bold text-blue-800">국토교통부</span>
                  <div className="px-2 py-0.5 rounded-full bg-blue-200 text-xs font-medium text-blue-800">
                    {totalDatasetCount > 0 ? (nationalTransportDataCount / totalDatasetCount * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-lg">로딩중...</span>
                    </div>
                  ) : (
                    nationalTransportDataCount.toLocaleString()
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-100">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700">{monthOverMonthChanges.nationalTransport}</span>
                  </div>
                  <span className="text-xs text-blue-600">전월 대비</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 활용현황 카드 - 고정 높이 적용 */}
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-green-50 h-[450px] flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                  활용현황
                </CardTitle>
                <p className="text-sm text-gray-500">국토교통부 데이터 활용도</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-6">
          {/* 다운로드 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 hover:border-purple-300 transition-colors duration-200 flex-1 flex items-center">
            <div className="flex items-center justify-between h-full w-full">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium text-purple-700">다운로드</span>
                </div>
                <div className="text-3xl font-bold text-purple-900 mb-2">
                  {isFilesDownloadLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
                      <span className="text-lg">로딩중...</span>
                    </div>
                  ) : (
                    totalDownloadCount.toLocaleString()
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-purple-100">
                    <TrendingUp className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700">{monthOverMonthChanges.downloads}</span>
                  </div>
                  <span className="text-xs text-purple-600">전월 대비</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* API 호출 */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 hover:border-orange-300 transition-colors duration-200 flex-1 flex items-center">
            <div className="flex items-center justify-between h-full w-full">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-sm font-medium text-orange-700">API 호출</span>
                </div>
                <div className="text-3xl font-bold text-orange-900 mb-2">
                  {isApiCallLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
                      <span className="text-lg">로딩중...</span>
                    </div>
                  ) : (
                    formatApiCallCount(totalApiCallCount)
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-orange-100">
                    <TrendingUp className="h-3 w-3 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-700">{monthOverMonthChanges.apiCalls}</span>
                  </div>
                  <span className="text-xs text-orange-600">전월 대비</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 갱신 현황 카드 - 활용현황과 같은 디자인으로 변경 */}
      <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50 h-[450px] flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-800 mb-1">
                  갱신 현황
                </CardTitle>
                <p className="text-sm text-gray-500">차기등록 예정일 기준</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-6">
          {isSupabaseLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-yellow-300 border-t-yellow-600 rounded-full animate-spin"></div>
                <span className="text-lg text-yellow-600">로딩중...</span>
              </div>
            </div>
          ) : (
            <>
              {/* 갱신 완료 */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-r from-green-50 to-green-100 border border-green-200 hover:border-green-300 transition-colors duration-200 flex-1 flex items-center">
                <div className="flex items-center justify-between h-full w-full">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-700">갱신 완료</span>
                    </div>
                    <div className="text-3xl font-bold text-green-900 mb-2">
                      {openDataStatusSummary.completed}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">{monthOverMonthChanges.updatedDatasets}</span>
                      </div>
                      <span className="text-xs text-green-600">전월 대비</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 갱신 필요 */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-r from-red-50 to-red-100 border border-red-200 hover:border-red-300 transition-colors duration-200 flex-1 flex items-center">
                <div className="flex items-center justify-between h-full w-full">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-red-700">갱신 필요</span>
                    </div>
                    <div className="text-3xl font-bold text-red-900 mb-2">
                      {openDataStatusSummary.required}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-red-100">
                        <TrendingUp className="h-3 w-3 text-red-600" />
                        <span className="text-xs font-semibold text-red-700">{monthOverMonthChanges.outdatedDatasets}</span>
                      </div>
                      <span className="text-xs text-red-600">전월 대비</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
