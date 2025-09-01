import { useQuery } from "@tanstack/react-query";
import { MenusService } from "@/client";

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
