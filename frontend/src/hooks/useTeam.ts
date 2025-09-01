import { useMutation, useQuery } from "@tanstack/react-query";
import { TeamsService } from "@/client";
import type { TeamsCreateTeamData } from "@/client";

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
      const response = await TeamsService.readOrdersByTeam({ teamId });
      return response;
    },
    enabled: !!teamId,
  });
}
