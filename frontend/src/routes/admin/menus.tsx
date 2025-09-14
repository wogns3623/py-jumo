import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { MenuImage } from "@/components/shared/MenuImage";
import { AdminService, MenusService } from "@/client";
import type { MenuPublic } from "@/client/types.gen";

export const Route = createFileRoute("/admin/menus")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();

  // 메뉴 목록 조회
  const {
    data: menus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menus"],
    queryFn: async () => {
      const response = await MenusService.readMenus();
      return response;
    },
    refetchInterval: 5000,
  });

  // 메뉴 상태 업데이트 mutation
  const updateMenuMutation = useMutation({
    mutationFn: async ({
      menuId,
      no_stock,
    }: {
      menuId: string;
      no_stock: boolean;
    }) => {
      return await AdminService.updateMenu({
        menuId,
        requestBody: { no_stock },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      toast.success("메뉴 상태가 업데이트되었습니다.");
    },
    onError: (error) => {
      toast.error("메뉴 상태 업데이트에 실패했습니다.");
      console.error("Menu update error:", error);
    },
  });

  const handleStockToggle = (menu: MenuPublic) => {
    updateMenuMutation.mutate({
      menuId: menu.id,
      no_stock: !menu.no_stock,
    });
  };

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"메뉴 관리"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                메뉴 목록을 불러오는데 실패했습니다.
              </p>
              <Button
                className="w-full mt-4"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebarHeader title={"메뉴 관리"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            메뉴 목록
          </h2>
          <Badge
            variant="outline"
            className="text-sm self-start sm:self-center"
          >
            총 {menus?.length || 0}개 메뉴
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-32 sm:h-48 w-full rounded-t-lg" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {menus?.map((menu) => (
              <Card key={menu.id} className="relative overflow-hidden">
                {/* 메뉴 이미지 */}
                <div className="relative h-32 sm:h-48 w-full">
                  {menu.image ? (
                    <MenuImage
                      src={menu.image}
                      alt={menu.name}
                      className="h-full w-full"
                      bgColor={menu.bg_color || undefined}
                      useEdgeBackground={false}
                      objectFit="contain"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">이미지 없음</span>
                    </div>
                  )}
                  {/* 품절 오버레이 */}
                  {menu.no_stock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge
                        variant="destructive"
                        className="text-sm font-semibold"
                      >
                        품절
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg font-medium truncate">
                    {menu.name}
                  </CardTitle>
                  <Badge
                    variant={menu.no_stock ? "destructive" : "default"}
                    className="text-xs whitespace-nowrap ml-2"
                  >
                    {menu.no_stock ? "품절" : "판매중"}
                  </Badge>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-3">
                    {menu.desc && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {menu.desc}
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-base sm:text-lg font-semibold">
                        {menu.price.toLocaleString()}원
                      </span>
                      {menu.category && (
                        <Badge
                          variant="outline"
                          className="text-xs self-start sm:self-center"
                        >
                          {menu.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">재고 상태</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {menu.no_stock ? "품절" : "판매중"}
                        </span>
                        <Switch
                          checked={!menu.no_stock}
                          onCheckedChange={() => handleStockToggle(menu)}
                          disabled={updateMenuMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {menus && menus.length === 0 && (
          <Card className="py-8 sm:py-12">
            <CardContent className="text-center">
              <p className="text-muted-foreground">등록된 메뉴가 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
