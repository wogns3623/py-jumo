import { useMutation } from "@tanstack/react-query";
import { TeamsService } from "@/client";
import type { TeamsCreateOrderData } from "@/client";

// 주문 생성 훅
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: TeamsCreateOrderData) => {
      const response = await TeamsService.createOrder(data);
      return response;
    },
  });
}
