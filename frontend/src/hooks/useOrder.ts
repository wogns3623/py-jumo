import { AdminService, TeamsService } from "@/client";
import type { KioskOrderCreate, OrderCreate } from "@/client";
import { useMutation, useQuery, UseQueryOptions } from "@tanstack/react-query";

export function useOrder(
  orderId: string,
  options?: Omit<UseQueryOptions, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const response = await AdminService.readOrder({ orderId });
      return response;
    },
    ...(options as {}),
  });
}

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

export function useCancelKioskOrder() {
  return useMutation({
    mutationKey: ["cancel-order"],
    mutationFn: async (orderId: string) => {
      await AdminService.rejectOrder({ orderId, reason: "사용자 취소" });
    },
  });
}
