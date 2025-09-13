import { TeamsService } from "@/client";
import type { TeamsCreateTeamData } from "@/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// 팀 생성 훅
export function useCreateTeam() {
  return useMutation({
    mutationFn: async (data: TeamsCreateTeamData) => {
      const response = await TeamsService.createTeam(data);
      return response;
    },
    onSuccess: (team) => {
      // 생성된 팀 ID를 로컬 스토리지에 저장
      localStorage.setItem("teamId", team.id!);
    },
  });
}

// 팀별 주문 내역 조회 훅
export function useTeamOrders(teamId: string) {
  return useQuery({
    queryKey: ["team-orders", teamId],
    queryFn: async () => {
      try {
        const response = await TeamsService.readOrdersByTeam({ teamId });
        return response;
      } catch (error) {
        // 404 오류인 경우 (팀이 종료되었거나 찾을 수 없는 경우)
        if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
          // 로컬 스토리지의 팀 정보 삭제
          localStorage.removeItem('team');
          throw new Error('팀 세션이 종료되었습니다.');
        }
        throw error;
      }
    },
    enabled: !!teamId,
    refetchInterval: 5000, // 5초마다 자동 갱신
  });
}

export function useTeamOrdersInvalidate(teamId: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["team-orders", teamId] });
  }, [queryClient, teamId]);
}
