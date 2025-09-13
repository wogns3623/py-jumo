import { AdminService, OrdersService } from "@/client";
import type { KioskOrderCreate, TableOrderCreate } from "@/client";
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

// 테이블 기반 주문 생성 훅 (팀도 함께 생성)
export function useCreateTableOrder() {
  return useMutation({
    mutationKey: ["create-table-order"],
    mutationFn: async (data: TableOrderCreate) => {
      const response = await OrdersService.createOrder({
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
