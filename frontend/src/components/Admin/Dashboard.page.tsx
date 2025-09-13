import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminService, RestaurantsService } from "@/client";

export function AdminDashboardPage() {
  // 테이블 현황 조회
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: async () => {
      const response = await AdminService.readTables();
      return response;
    },
  });

  // 레스토랑 정보 조회
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const response = await RestaurantsService.readRestaurants();
      return response;
    },
  });

  // 결제 목록 조회 (매출 계산용)
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const response = await AdminService.readPayments();
      return response;
    },
  });

  // 주문 목록 조회 (기본 통계용)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const response = await AdminService.readOrders();
      return response;
    },
  });

  // 통계 계산
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // 결제 기반 매출 계산
  const todayPayments =
    payments?.filter((payment) => {
      if (!payment.created_at) return false;
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= startOfDay && !payment.refunded_at; // 환불되지 않은 결제만
    }) || [];

  const monthPayments =
    payments?.filter((payment) => {
      if (!payment.created_at) return false;
      const paymentDate = new Date(payment.created_at);
      return paymentDate >= startOfMonth && !payment.refunded_at; // 환불되지 않은 결제만
    }) || [];

  const todaySales = todayPayments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );
  const monthSales = monthPayments.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  );

  // 주문 수 계산
  const todayOrdersCount =
    orders?.filter((order) => {
      if (!order.created_at) return false;
      const orderDate = new Date(order.created_at);
      return orderDate >= startOfDay;
    }).length || 0;

  const totalOrdersCount = orders?.length || 0;

  // 테이블 통계
  const tableStats =
    tables?.reduce((acc, table) => {
      const status = table.status || "idle";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

  const totalTables = tables?.length || 0;
  const occupiedTables = tableStats["in_use"] || 0;
  const reservedTables = tableStats["reserved"] || 0;
  const idleTables = tableStats["idle"] || 0;

  const isLoading =
    tablesLoading || restaurantLoading || paymentsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          대시보드
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {restaurant?.name || "레스토랑"}의 현재 상황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* 오늘의 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-sm font-medium">오늘의 매출</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent className="px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">
              {todaySales.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground">
              {todayPayments.length}건의 결제
            </p>
          </CardContent>
        </Card>

        {/* 이달의 매출 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-sm font-medium">이달의 매출</CardTitle>
            <span className="text-lg">📊</span>
          </CardHeader>
          <CardContent className="px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">
              {monthSales.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground">
              {monthPayments.length}건의 결제
            </p>
          </CardContent>
        </Card>

        {/* 오늘의 주문 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-sm font-medium">오늘의 주문</CardTitle>
            <span className="text-lg">📝</span>
          </CardHeader>
          <CardContent className="px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">
              {todayOrdersCount}건
            </div>
            <p className="text-xs text-muted-foreground">
              총 {totalOrdersCount}건의 주문
            </p>
          </CardContent>
        </Card>

        {/* 테이블 사용률 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-sm font-medium">테이블 사용률</CardTitle>
            <span className="text-lg">🪑</span>
          </CardHeader>
          <CardContent className="px-4 pb-3 sm:px-6 sm:pb-4">
            <div className="text-xl sm:text-2xl font-bold">
              {totalTables > 0
                ? Math.round((occupiedTables / totalTables) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {occupiedTables}/{totalTables} 테이블 사용 중
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 테이블 현황 상세 */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">테이블 현황</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">사용 중</span>
                <Badge variant="destructive">{occupiedTables}개</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">예약됨</span>
                <Badge variant="secondary">{reservedTables}개</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">사용 가능</span>
                <Badge variant="default">{idleTables}개</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 py-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">최근 결제 현황</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {todayPayments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      결제 #{payment.id?.slice(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleTimeString()
                        : "시간 미상"}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
                    <span className="text-sm font-medium">
                      {(payment.amount || 0).toLocaleString()}원
                    </span>
                    <Badge
                      variant={!payment.refunded_at ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {!payment.refunded_at ? "완료" : "환불"}
                    </Badge>
                  </div>
                </div>
              ))}
              {todayPayments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  오늘 결제가 없습니다
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
