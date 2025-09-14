import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminService } from "@/client";
import { ChefHatIcon, LoaderIcon } from "lucide-react";

export const Route = createFileRoute("/admin/kitchen")({
  component: Page,
});

function Page() {
  const {
    data: cookingQueue,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["cooking-queue"],
    queryFn: () => AdminService.getCookingQueue(),
    refetchInterval: 5000, // 5초마다 자동 갱신
  });

  const cookMutation = useMutation({
    mutationFn: (menuId: string) => AdminService.cookOneMenu({ menuId }),
    onSuccess: () => {
      refetch();
    },
  });

  if (error) {
    return (
      <>
        <AdminSidebarHeader title="주방 관리" />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebarHeader title="주방 관리" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              주방 관리
            </h2>
            <p className="text-muted-foreground">
              조리가 필요한 메뉴들의 대기열 관리
            </p>
          </div>
          <Badge variant="outline" className="text-sm whitespace-nowrap">
            마지막 업데이트: {new Date().toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul" })}
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {cookingQueue?.map((item) => (
              <Card key={item.menu_id} className="relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{item.menu_name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {item.total_pending_count}개
                      </div>
                      <p className="text-xs text-muted-foreground">대기 중</p>
                    </div>
                    <Button
                      onClick={() => cookMutation.mutate(item.menu_id)}
                      disabled={
                        cookMutation.isPending || item.total_pending_count === 0
                      }
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {cookMutation.isPending ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        <>
                          <ChefHatIcon className="mr-2 h-4 w-4" />
                          조리 완료
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && (!cookingQueue || cookingQueue.length === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <ChefHatIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  현재 조리 대기 중인 메뉴가 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
