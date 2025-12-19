import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 공공데이터포털 API URLs
const OPEN_DATA_LIST_URL = 'https://api.odcloud.kr/api/15077093/v1/open-data-list'
const DATASET_URL = 'https://api.odcloud.kr/api/15077093/v1/dataset'
const API_KEY = 'oV+46tfJ4OXQwIoLnlilg2wCXoxrwHY2+AWuK60otTY8aXinFk/K2//cp7zPL6n61Sz91HCrZEyZohIaAH24pw=='

interface ApiListItem {
  list_title: string
  request_cnt: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('공공데이터포털 API 호출 시작...')

    const encodedApiKey = encodeURIComponent(API_KEY)
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    
    // 1. open-data-list API에서 전체 페이지 데이터 가져오기 (국토교통부 API 목록)
    console.log('open-data-list API 전체 페이지 호출 시작...')
    
    // 먼저 총 페이지 수 확인
    const firstPageUrl = `${OPEN_DATA_LIST_URL}?page=1&perPage=10&cond%5Blist_title%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
    const firstPageResponse = await fetch(firstPageUrl)
    if (!firstPageResponse.ok) {
      throw new Error(`open-data-list API 호출 실패: ${firstPageResponse.status}`)
    }
    const firstPageResult = await firstPageResponse.json()
    
    const totalCount = firstPageResult.totalCount || 0
    const matchCount = firstPageResult.matchCount || 0
    const perPage = 10
    const totalPages = Math.ceil(matchCount / perPage)
    
    console.log(`총 ${matchCount}개 API, ${totalPages} 페이지`)

    // 모든 API 목록 수집
    const allApiItems: ApiListItem[] = []
    let totalApiCalls = 0
    
    // 1~68페이지까지 순차적으로 가져오기 (병렬 처리시 API 제한에 걸릴 수 있음)
    for (let page = 1; page <= Math.min(totalPages, 68); page++) {
      try {
        const pageUrl = `${OPEN_DATA_LIST_URL}?page=${page}&perPage=${perPage}&cond%5Blist_title%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
        const pageResponse = await fetch(pageUrl)
        
        if (pageResponse.ok) {
          const pageData = await pageResponse.json()
          if (pageData.data && Array.isArray(pageData.data)) {
            for (const item of pageData.data) {
              if (item.list_title && item.list_title.includes('국토교통부')) {
                allApiItems.push({
                  list_title: item.list_title,
                  request_cnt: item.request_cnt || 0
                })
                totalApiCalls += (item.request_cnt || 0)
              }
            }
          }
        }
        
        // API 제한 방지를 위한 딜레이
        if (page < totalPages) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      } catch (pageError) {
        console.error(`페이지 ${page} 호출 오류:`, pageError)
      }
    }

    console.log(`수집된 API 항목: ${allApiItems.length}개, 총 호출 건수: ${totalApiCalls}`)

    // 2. api_call 테이블에 데이터 저장/업데이트
    console.log('api_call 테이블 업데이트 시작...')
    
    for (const item of allApiItems) {
      // 기존 레코드 확인 (목록명과 통계일자로 검색)
      const { data: existingRecord, error: selectError } = await supabase
        .from('api_call')
        .select('*')
        .eq('목록명', item.list_title)
        .eq('통계일자', todayStr)
        .maybeSingle()

      if (selectError) {
        console.error('api_call 조회 오류:', selectError)
        continue
      }

      if (existingRecord) {
        // 기존 레코드 업데이트
        const { error: updateError } = await supabase
          .from('api_call')
          .update({ 호출건수: item.request_cnt })
          .eq('id', existingRecord.id)

        if (updateError) {
          console.error('api_call 업데이트 오류:', updateError)
        }
      } else {
        // 새 레코드 삽입
        const { error: insertError } = await supabase
          .from('api_call')
          .insert({
            목록명: item.list_title,
            통계일자: todayStr,
            호출건수: item.request_cnt
          })

        if (insertError) {
          console.error('api_call 삽입 오류:', insertError)
        }
      }
    }

    console.log('api_call 테이블 업데이트 완료')

    // 3. dataset API 호출 (파일 데이터셋) - 통계용
    const datasetUrl = `${DATASET_URL}?page=1&perPage=1&cond%5Btitle%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
    const datasetResponse = await fetch(datasetUrl)
    if (!datasetResponse.ok) {
      throw new Error(`dataset API 호출 실패: ${datasetResponse.status}`)
    }
    const datasetResult = await datasetResponse.json()

    // 4. 합계 계산 (공공데이터포털 전체 = totalCount 합계, 국토교통부 = matchCount 합계)
    const totalPublicData = (totalCount || 0) + (datasetResult.totalCount || 0)
    const totalMolit = matchCount + (datasetResult.matchCount || 0)
    
    console.log('합계 계산:', {
      totalPublicData,
      totalMolit,
      totalApiCalls
    })

    // 5. monthly_stats 테이블 업데이트
    const { data: existingStats, error: selectError } = await supabase
      .from('monthly_stats')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (selectError) {
      console.error('monthly_stats 조회 오류:', selectError)
      throw selectError
    }

    const statsData = {
      year,
      month,
      total_datasets: totalPublicData,
      national_transport_datasets: totalMolit,
      total_api_calls: totalApiCalls,
    }

    console.log('저장할 통계 데이터:', statsData)

    if (existingStats) {
      const { error: updateError } = await supabase
        .from('monthly_stats')
        .update({
          total_datasets: statsData.total_datasets,
          national_transport_datasets: statsData.national_transport_datasets,
          total_api_calls: statsData.total_api_calls,
        })
        .eq('id', existingStats.id)

      if (updateError) {
        console.error('monthly_stats 업데이트 오류:', updateError)
        throw updateError
      }
      console.log('monthly_stats 업데이트 완료:', existingStats.id)
    } else {
      const { error: insertError } = await supabase
        .from('monthly_stats')
        .insert(statsData)

      if (insertError) {
        console.error('monthly_stats 삽입 오류:', insertError)
        throw insertError
      }
      console.log('monthly_stats 새 레코드 삽입 완료')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          apiListCount: allApiItems.length,
          totalApiCalls,
          openDataList: {
            totalCount,
            matchCount
          },
          dataset: {
            totalCount: datasetResult.totalCount,
            matchCount: datasetResult.matchCount
          },
          combined: {
            totalPublicData,
            totalMolit
          },
          year,
          month
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('동기화 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
