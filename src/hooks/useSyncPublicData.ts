import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSyncPublicData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('공공데이터 동기화 시작...');
      
      const { data, error } = await supabase.functions.invoke('sync-public-data', {
        method: 'POST',
      });

      if (error) {
        console.error('동기화 오류:', error);
        throw error;
      }

      console.log('동기화 결과:', data);
      return data;
    },
    onSuccess: () => {
      // 동기화 성공 후 관련 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['monthlyStats'] });
      queryClient.invalidateQueries({ queryKey: ['publicData'] });
    },
  });
};
