-- 1. openData 테이블: 공공데이터 목록
CREATE TABLE public."openData" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "목록명" TEXT,
  "분류체계" TEXT,
  "차기등록 예정일" DATE,
  "제공기관" TEXT,
  "갱신주기" TEXT,
  "데이터형식" TEXT,
  "조회수" INTEGER DEFAULT 0,
  "다운로드수" INTEGER DEFAULT 0,
  "등록일" DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. api_call 테이블: API 호출 데이터
CREATE TABLE public.api_call (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "목록명" TEXT,
  "호출건수" INTEGER DEFAULT 0,
  "통계일자" DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. files_download 테이블: 파일 다운로드 데이터
CREATE TABLE public.files_download (
  "ID" SERIAL PRIMARY KEY,
  "통계일자" DATE,
  "목록명" TEXT,
  "다운로드수" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. monthly_stats 테이블: 월별 통계 데이터
CREATE TABLE public.monthly_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  total_datasets INTEGER DEFAULT 0,
  national_transport_datasets INTEGER DEFAULT 0,
  total_downloads INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  updated_datasets INTEGER DEFAULT 0,
  outdated_datasets INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(year, month)
);

-- RLS 활성화 (공개 데이터로 누구나 읽을 수 있도록 설정)
ALTER TABLE public."openData" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_call ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files_download ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_stats ENABLE ROW LEVEL SECURITY;

-- 읽기 전용 공개 정책 생성
CREATE POLICY "Anyone can view openData" ON public."openData" FOR SELECT USING (true);
CREATE POLICY "Anyone can view api_call" ON public.api_call FOR SELECT USING (true);
CREATE POLICY "Anyone can view files_download" ON public.files_download FOR SELECT USING (true);
CREATE POLICY "Anyone can view monthly_stats" ON public.monthly_stats FOR SELECT USING (true);