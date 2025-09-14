import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
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
    refetchInterval: 5000, // 5초마다 자동 새로고침
  });

  // 서빙 완료 처리 mutation
  const serveMenuMutation = useMutation({
    mutationFn: async (orderedMenu: OrderedMenuForServing) => {
      return await AdminService.updateMenuOrder({
        menuId: orderedMenu.menu.id,
        orderId: orderedMenu.order_id,
        requestBody: { served_at: new Date().toISOString() },
      });
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

  // 주문별로 메뉴들을 그룹화
  const groupedOrders = React.useMemo(() => {
    if (!orderedMenus) return [];

    const orderMap = new Map<
      number,
      {
        order_no: number;
        table_no: number;
        menus: OrderedMenuForServing[];
        earliestCreated: string;
      }
    >();

    orderedMenus.forEach((menu) => {
      if (!orderMap.has(menu.order_no)) {
        orderMap.set(menu.order_no, {
          order_no: menu.order_no,
          table_no: menu.table_no,
          menus: [],
          earliestCreated: menu.created_at,
        });
      }

      const order = orderMap.get(menu.order_no)!;
      order.menus.push(menu);

      // 가장 이른 주문 생성 시간 업데이트
      if (new Date(menu.created_at) < new Date(order.earliestCreated)) {
        order.earliestCreated = menu.created_at;
      }
    });

    return Array.from(orderMap.values());
  }, [orderedMenus]);

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
            총 {groupedOrders?.length || 0}개 주문 / {orderedMenus?.length || 0}
            개 메뉴 대기중
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
        ) : groupedOrders && groupedOrders.length > 0 ? (
          <>
            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden lg:block space-y-4">
              {groupedOrders.map((order) => {
                const waitingMinutes = getWaitingTime(order.earliestCreated);
                return (
                  <Card key={order.order_no}>
                    <CardContent className="p-0">
                      {/* 주문 헤더 */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                        <div className="flex items-center gap-4">
                          <Badge
                            variant="outline"
                            className="font-mono text-lg px-3 py-1"
                          >
                            주문 #{order.order_no}
                          </Badge>
                          <Badge variant="outline" className="font-mono">
                            <MapPin className="w-3 h-3 mr-1" />
                            {order.table_no}번 테이블
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            주문시간: {formatTime(order.earliestCreated)}
                          </span>
                          <span
                            className={`text-sm font-medium ${getWaitingTimeColor(
                              waitingMinutes
                            )}`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            대기시간: {waitingMinutes}분
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.menus.length}개 메뉴
                        </div>
                      </div>

                      {/* 메뉴 목록 */}
                      <Table>
                        <TableBody>
                          {order.menus.map((orderedMenu) => (
                            <TableRow
                              key={orderedMenu.id}
                              className="hover:bg-muted/50"
                            >
                              <TableCell className="w-16">
                                <MenuImage
                                  src={orderedMenu.menu.image || ""}
                                  alt={orderedMenu.menu.name}
                                  bgColor={
                                    orderedMenu.menu.bg_color || undefined
                                  }
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
                              <TableCell className="w-20 font-medium">
                                {orderedMenu.amount}개
                              </TableCell>
                              <TableCell className="w-28">
                                <Button
                                  onClick={() =>
                                    serveMenuMutation.mutate(orderedMenu)
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
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* 모바일 카드 리스트 뷰 */}
            <div className="lg:hidden space-y-4">
              {groupedOrders.map((order) => {
                const waitingMinutes = getWaitingTime(order.earliestCreated);
                return (
                  <Card key={order.order_no} className="overflow-hidden">
                    <CardContent className="p-0">
                      {/* 주문 헤더 */}
                      <div className="p-4 bg-muted/30 border-b">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="font-mono">
                            주문 #{order.order_no}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            <MapPin className="w-2 h-2 mr-1" />
                            {order.table_no}번
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatTime(order.earliestCreated)}</span>
                          <span
                            className={`font-medium ${getWaitingTimeColor(
                              waitingMinutes
                            )}`}
                          >
                            <Clock className="w-2 h-2 inline mr-1" />
                            {waitingMinutes}분
                          </span>
                          <span>{order.menus.length}개 메뉴</span>
                        </div>
                      </div>

                      {/* 메뉴 목록 */}
                      <div className="p-4 space-y-3">
                        {order.menus.map((orderedMenu) => (
                          <div
                            key={orderedMenu.id}
                            className="flex items-center gap-4"
                          >
                            <MenuImage
                              src={orderedMenu.menu.image || ""}
                              alt={orderedMenu.menu.name}
                              bgColor={orderedMenu.menu.bg_color || undefined}
                              className="w-12 h-12 object-cover rounded flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">
                                {orderedMenu.menu.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                수량: {orderedMenu.amount}개
                              </p>
                            </div>
                            <Button
                              onClick={() =>
                                serveMenuMutation.mutate(orderedMenu)
                              }
                              disabled={serveMenuMutation.isPending}
                              size="sm"
                              className="flex-shrink-0"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              서빙완료
                            </Button>
                          </div>
                        ))}
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
