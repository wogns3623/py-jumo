import { MenusService } from "@/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

// 메뉴 목록 조회 훅
export function useMenus() {
  return useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await MenusService.readMenus();
      return response;
    },
  });
}

export function useMenusSuspense() {
  return useSuspenseQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await MenusService.readMenus();
      return response;
    },
  });
}
