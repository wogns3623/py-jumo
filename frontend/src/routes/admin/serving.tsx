import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import { MenuImage } from "@/components/shared/MenuImage";
import { AdminService } from "@/client";
import type { OrderedMenuForServing } from "@/client/types.gen";
import { CheckCircle, Clock, ChefHat, MapPin } from "lucide-react";

export const Route = createFileRoute("/admin/serving")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();

  // 조리 완료된 메뉴 목록 조회
  const {
    data: orderedMenus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "serving", "cooked-menus"],
    queryFn: async () => {
      const response = await AdminService.getCookedOrderedMenus();
      return response as OrderedMenuForServing[];
    },
    refetchInterval: 3000, // 3초마다 자동 새로고침
  });

  // 서빙 완료 처리 mutation
  const serveMenuMutation = useMutation({
    mutationFn: async (orderedMenuId: string) => {
      return await AdminService.serveOrderedMenu({ orderedMenuId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "serving", "cooked-menus"],
      });
      toast.success("서빙이 완료되었습니다.");
    },
    onError: (error) => {
      toast.error("서빙 완료 처리에 실패했습니다.");
      console.error("Serve menu error:", error);
    },
  });

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWaitingTime = (cookStartedAt: string) => {
    const startTime = new Date(cookStartedAt);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - startTime.getTime()) / (1000 * 60)
    );
    return diffMinutes;
  };

  const getWaitingTimeColor = (minutes: number) => {
    if (minutes >= 15) return "text-red-600";
    if (minutes >= 10) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <>
      <AdminSidebarHeader title="서빙 관리" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              서빙 대기 목록
            </h2>
            <p className="text-muted-foreground">
              조리가 완료된 메뉴들을 서빙 완료 처리하세요
            </p>
          </div>
          <Badge variant="outline" className="text-sm whitespace-nowrap">
            총 {orderedMenus?.length || 0}개 대기중
          </Badge>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-16 w-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : orderedMenus && orderedMenus.length > 0 ? (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden lg:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>메뉴</TableHead>
                      <TableHead className="w-20">수량</TableHead>
                      <TableHead className="w-24">테이블</TableHead>
                      <TableHead className="w-20">주문번호</TableHead>
                      <TableHead className="w-24">조리시작</TableHead>
                      <TableHead className="w-24">대기시간</TableHead>
                      <TableHead className="w-28">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderedMenus.map((orderedMenu) => {
                      const waitingMinutes = getWaitingTime(
                        orderedMenu.cook_started_at!
                      );
                      return (
                        <TableRow
                          key={orderedMenu.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell>
                            <MenuImage
                              src={orderedMenu.menu.image || ""}
                              alt={orderedMenu.menu.name}
                              bgColor={orderedMenu.menu.bg_color || undefined}
                              className="w-12 h-12 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {orderedMenu.menu.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {orderedMenu.menu.desc}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {orderedMenu.amount}개
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              <MapPin className="w-3 h-3 mr-1" />
                              {orderedMenu.table_no}번
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            #{orderedMenu.order_no}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatTime(orderedMenu.cook_started_at!)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-sm font-medium ${getWaitingTimeColor(
                                waitingMinutes
                              )}`}
                            >
                              <Clock className="w-3 h-3 inline mr-1" />
                              {waitingMinutes}분
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() =>
                                serveMenuMutation.mutate(orderedMenu.id)
                              }
                              disabled={serveMenuMutation.isPending}
                              size="sm"
                              className="w-full"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              서빙완료
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* 모바일 카드 리스트 뷰 */}
            <div className="lg:hidden space-y-3">
              {orderedMenus.map((orderedMenu) => {
                const waitingMinutes = getWaitingTime(
                  orderedMenu.cook_started_at!
                );
                return (
                  <Card key={orderedMenu.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* 메뉴 이미지 */}
                        <MenuImage
                          src={orderedMenu.menu.image || ""}
                          alt={orderedMenu.menu.name}
                          bgColor={orderedMenu.menu.bg_color || undefined}
                          className="w-16 h-16 object-cover rounded flex-shrink-0"
                        />

                        {/* 메뉴 정보 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {orderedMenu.menu.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">
                              수량: {orderedMenu.amount}개
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs font-mono"
                            >
                              <MapPin className="w-2 h-2 mr-1" />
                              {orderedMenu.table_no}번
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              주문#{orderedMenu.order_no}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(orderedMenu.cook_started_at!)}
                            </span>
                            <span
                              className={`text-xs font-medium ${getWaitingTimeColor(
                                waitingMinutes
                              )}`}
                            >
                              <Clock className="w-2 h-2 inline mr-1" />
                              {waitingMinutes}분
                            </span>
                          </div>
                        </div>

                        {/* 서빙 버튼 */}
                        <Button
                          onClick={() =>
                            serveMenuMutation.mutate(orderedMenu.id)
                          }
                          disabled={serveMenuMutation.isPending}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          서빙완료
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <ChefHat className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  서빙 대기중인 메뉴가 없습니다
                </h3>
                <p className="text-sm text-muted-foreground">
                  조리가 완료된 메뉴가 있으면 여기에 표시됩니다
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
