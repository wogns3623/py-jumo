import { TeamsService } from "@/client";
import type { OrderCreate } from "@/client";
import { useMutation } from "@tanstack/react-query";

// 주문 생성 훅
export function useCreateOrder(teamId: string) {
  return useMutation({
    mutationKey: ["create-order", teamId],
    mutationFn: async (data: OrderCreate) => {
      const response = await TeamsService.createOrder({
        teamId,
        requestBody: data,
      });
      return response;
    },
  });
}
