import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 공공데이터포털 API URLs
const OPEN_DATA_LIST_URL = 'https://api.odcloud.kr/api/15077093/v1/open-data-list'
const DATASET_URL = 'https://api.odcloud.kr/api/15077093/v1/dataset'
const API_KEY = 'oV+46tfJ4OXQwIoLnlilg2wCXoxrwHY2+AWuK60otTY8aXinFk/K2//cp7zPL6n61Sz91HCrZEyZohIaAH24pw=='

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
    
    // 1. open-data-list API 호출 (오픈 API 목록)
    const openDataListUrl = `${OPEN_DATA_LIST_URL}?page=1&perPage=1&cond%5Blist_title%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
    console.log('open-data-list API 호출:', openDataListUrl)
    
    const openDataListResponse = await fetch(openDataListUrl)
    if (!openDataListResponse.ok) {
      throw new Error(`open-data-list API 호출 실패: ${openDataListResponse.status}`)
    }
    const openDataListResult = await openDataListResponse.json()
    console.log('open-data-list 응답:', { 
      totalCount: openDataListResult.totalCount, 
      matchCount: openDataListResult.matchCount 
    })

    // 2. dataset API 호출 (파일 데이터셋)
    const datasetUrl = `${DATASET_URL}?page=1&perPage=1&cond%5Btitle%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
    console.log('dataset API 호출:', datasetUrl)
    
    const datasetResponse = await fetch(datasetUrl)
    if (!datasetResponse.ok) {
      throw new Error(`dataset API 호출 실패: ${datasetResponse.status}`)
    }
    const datasetResult = await datasetResponse.json()
    console.log('dataset 응답:', { 
      totalCount: datasetResult.totalCount, 
      matchCount: datasetResult.matchCount 
    })

    // 3. 합계 계산
    const totalPublicData = (openDataListResult.totalCount || 0) + (datasetResult.totalCount || 0)
    const totalMolit = (openDataListResult.matchCount || 0) + (datasetResult.matchCount || 0)
    
    console.log('합계 계산:', {
      totalPublicData,   // 공공데이터포털 전체 (17285 + 95775 = 113060)
      totalMolit         // 국토교통부 데이터 (675 + 1481 = 2156)
    })

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // monthly_stats 테이블에 업데이트 또는 삽입
    const { data: existingStats, error: selectError } = await supabase
      .from('monthly_stats')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    if (selectError) {
      console.error('조회 오류:', selectError)
      throw selectError
    }

    const statsData = {
      year,
      month,
      total_datasets: totalPublicData,      // 공공데이터포털 전체 (totalCount 합계)
      national_transport_datasets: totalMolit, // 국토교통부 데이터 (matchCount 합계)
    }

    console.log('저장할 데이터:', statsData)

    if (existingStats) {
      // 기존 레코드 업데이트
      const { error: updateError } = await supabase
        .from('monthly_stats')
        .update({
          total_datasets: statsData.total_datasets,
          national_transport_datasets: statsData.national_transport_datasets,
        })
        .eq('id', existingStats.id)

      if (updateError) {
        console.error('업데이트 오류:', updateError)
        throw updateError
      }
      console.log('monthly_stats 업데이트 완료:', existingStats.id)
    } else {
      // 새 레코드 삽입
      const { error: insertError } = await supabase
        .from('monthly_stats')
        .insert(statsData)

      if (insertError) {
        console.error('삽입 오류:', insertError)
        throw insertError
      }
      console.log('monthly_stats 새 레코드 삽입 완료')
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          openDataList: {
            totalCount: openDataListResult.totalCount,
            matchCount: openDataListResult.matchCount
          },
          dataset: {
            totalCount: datasetResult.totalCount,
            matchCount: datasetResult.matchCount
          },
          combined: {
            totalPublicData,   // 공공데이터포털 전체
            totalMolit         // 국토교통부 데이터
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
