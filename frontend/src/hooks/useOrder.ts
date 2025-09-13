import { AdminService, TeamsService } from "@/client";
import type { KioskOrderCreate, OrderCreate } from "@/client";
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

export function useCreateKioskOrder() {
  return useMutation({
    mutationKey: ["create-kiosk-order"],
    mutationFn: async (data: KioskOrderCreate) => {
      const response = await AdminService.createKioskOrder({
        requestBody: data,
      });
      return response;
    },
  });
}
