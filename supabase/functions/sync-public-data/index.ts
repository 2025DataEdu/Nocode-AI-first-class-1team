import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 공공데이터포털 dataset API (더 정확한 데이터)
const API_URL = 'https://api.odcloud.kr/api/15077093/v1/dataset'
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

    console.log('공공데이터포털 dataset API 호출 시작...')

    // 국토교통부 데이터 조회 API 호출 (title LIKE 국토교통부)
    const encodedApiKey = encodeURIComponent(API_KEY)
    const apiUrl = `${API_URL}?page=1&perPage=1&cond%5Btitle%3A%3ALIKE%5D=%EA%B5%AD%ED%86%A0%EA%B5%90%ED%86%B5%EB%B6%80&serviceKey=${encodedApiKey}`
    
    console.log('API URL:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API 응답 오류:', errorText)
      throw new Error(`API 호출 실패: ${response.status}`)
    }

    const result = await response.json()
    console.log('API 응답:', { 
      totalCount: result.totalCount,   // 공공데이터포털 전체 데이터셋
      matchCount: result.matchCount,   // 국토교통부 데이터셋
      currentCount: result.currentCount 
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
      total_datasets: result.totalCount || 95775,           // 공공데이터포털 전체
      national_transport_datasets: result.matchCount || 1481, // 국토교통부 데이터셋
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
          totalCount: result.totalCount,      // 공공데이터포털 전체
          matchCount: result.matchCount,      // 국토교통부 데이터셋
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
