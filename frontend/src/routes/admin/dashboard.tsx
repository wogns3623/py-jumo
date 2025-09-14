import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import React from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminService } from "@/client";
import {
  DollarSign,
  Users,
  Calendar,
  Clock,
  ChefHat,
  MapPin,
  User,
} from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: Page,
});

function Page() {
  // 주문 데이터 가져오기 (실제 처리된 주문만)
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => AdminService.readOrders(),
    refetchInterval: 5000, // 5초마다 새로고침
  });

  // 웨이팅 데이터 가져오기
  const { data: waitings, isLoading: waitingsLoading } = useQuery({
    queryKey: ["admin", "waitings"],
    queryFn: () => AdminService.readWaitings(),
    refetchInterval: 5000, // 5초마다 새로고침
  });

  // 테이블 데이터 가져오기
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: () => AdminService.readTables(),
    refetchInterval: 5000, // 5초마다 새로고침
  });

  // 통계 계산
  const statistics = React.useMemo(() => {
    if (!orders || !waitings || !tables) {
      return {
        todaySales: 0,
        monthSales: 0,
        todayVisitors: 0,
        activeOrders: 0,
        occupiedTables: 0,
        waitingCustomers: 0,
        completedOrdersToday: 0,
        averageOrderValue: 0,
      };
    }

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 실제 처리된 주문들만 필터링 (paid, finished 상태)
    const processedOrders = orders.filter(
      (order) => order.status === "paid" || order.status === "finished"
    );

    // 오늘 매출 (완료된 주문들의 총 가격)
    const todayOrders = processedOrders.filter(
      (order) => order.created_at && new Date(order.created_at) >= todayStart
    );
    const todaySales = todayOrders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );

    // 이번달 매출
    const monthOrders = processedOrders.filter(
      (order) => order.created_at && new Date(order.created_at) >= monthStart
    );
    const monthSales = monthOrders.reduce(
      (sum, order) => sum + order.total_price,
      0
    );

    // 오늘 방문자 수 (오늘 웨이팅에 들어온 사람들)
    const todayWaitings = waitings.filter(
      (waiting) =>
        waiting.created_at && new Date(waiting.created_at) >= todayStart
    );
    const todayVisitors = todayWaitings.length; // 웨이팅 건수를 방문자 수로 계산

    // 현재 활성 주문 수 (ordered, paid 상태)
    const activeOrders = orders.filter(
      (order) => order.status === "ordered" || order.status === "paid"
    ).length;

    // 점유 테이블 수 (in_use 상태인 테이블)
    const occupiedTables = tables.filter(
      (table) => table.status === "in_use"
    ).length;

    // 현재 대기중인 고객 수 (rejected_at이 없고 entered_at이 없는 웨이팅)
    const waitingCustomers = waitings.filter(
      (waiting) => !waiting.rejected_at && !waiting.entered_at
    ).length;

    // 오늘 완료된 주문 수
    const completedOrdersToday = todayOrders.length;

    // 평균 주문 가격
    const averageOrderValue =
      todayOrders.length > 0 ? todaySales / todayOrders.length : 0;

    return {
      todaySales,
      monthSales,
      todayVisitors,
      activeOrders,
      occupiedTables,
      waitingCustomers,
      completedOrdersToday,
      averageOrderValue,
    };
  }, [orders, waitings, tables]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const isLoading = ordersLoading || waitingsLoading || tablesLoading;

  if (ordersError) {
    return (
      <>
        <AdminSidebarHeader title="대시보드" />
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
      <AdminSidebarHeader title="대시보드" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              대시보드
            </h2>
            <p className="text-muted-foreground">
              실시간 매장 현황과 통계를 확인하세요
            </p>
          </div>
          <Badge variant="outline" className="text-sm whitespace-nowrap">
            마지막 업데이트: {new Date().toLocaleTimeString("ko-KR")}
          </Badge>
        </div>

        {/* 주요 통계 카드들 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 오늘 매출 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 매출</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics.todaySales)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-3 w-16" />
                ) : (
                  `${statistics.completedOrdersToday}건 완료`
                )}
              </p>
            </CardContent>
          </Card>

          {/* 이번달 매출 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이번달 매출</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics.monthSales)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  `평균 ${formatCurrency(statistics.averageOrderValue)}/건`
                )}
              </p>
            </CardContent>
          </Card>

          {/* 오늘 방문자 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 방문자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {statistics.todayVisitors}명
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  `현재 ${statistics.waitingCustomers}명 대기중`
                )}
              </p>
            </CardContent>
          </Card>

          {/* 현재 주문 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 주문</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {statistics.activeOrders}건
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-3 w-20" />
                ) : (
                  `${statistics.occupiedTables}/${
                    tables?.length || 0
                  } 테이블 사용중`
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 실시간 현황 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 현재 테이블 상황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                테이블 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : tables && tables.length > 0 ? (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {tables.map((table) => (
                    <div
                      key={table.id}
                      className={`p-3 rounded-lg border text-center ${
                        table.status === "idle"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : "bg-red-50 border-red-200 text-red-800"
                      }`}
                    >
                      <div className="font-medium">{table.no}번</div>
                      <div className="text-xs">
                        {table.status === "idle"
                          ? "사용가능"
                          : table.status === "in_use"
                          ? "사용중"
                          : "예약됨"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  테이블 정보가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>

          {/* 현재 대기 현황 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                대기 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : waitings &&
                waitings.filter((w) => !w.rejected_at && !w.entered_at).length >
                  0 ? (
                <div className="space-y-3">
                  {waitings
                    .filter(
                      (waiting) => !waiting.rejected_at && !waiting.entered_at
                    )
                    .slice(0, 5)
                    .map((waiting, index) => (
                      <div
                        key={waiting.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}번째
                          </Badge>
                          <span className="text-sm font-medium">
                            {waiting.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {waiting.phone}
                        </div>
                      </div>
                    ))}
                  {waitings.filter((w) => !w.rejected_at && !w.entered_at)
                    .length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      외{" "}
                      {waitings.filter((w) => !w.rejected_at && !w.entered_at)
                        .length - 5}
                      팀 대기중
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  현재 대기중인 고객이 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
