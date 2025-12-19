-- api_call 테이블에 INSERT/UPDATE 권한 추가 (서비스 롤 키로 동기화하기 위함)
ALTER TABLE public.api_call ENABLE ROW LEVEL SECURITY;

-- 서비스 롤이 INSERT 할 수 있도록 정책 추가
CREATE POLICY "Service role can insert api_call"
ON public.api_call
FOR INSERT
WITH CHECK (true);

-- 서비스 롤이 UPDATE 할 수 있도록 정책 추가  
CREATE POLICY "Service role can update api_call"
ON public.api_call
FOR UPDATE
USING (true);

-- 서비스 롤이 DELETE 할 수 있도록 정책 추가
CREATE POLICY "Service role can delete api_call"
ON public.api_call
FOR DELETE
USING (true);

-- monthly_stats 테이블에도 INSERT/UPDATE 권한 추가
CREATE POLICY "Service role can insert monthly_stats"
ON public.monthly_stats
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update monthly_stats"
ON public.monthly_stats
FOR UPDATE
USING (true);