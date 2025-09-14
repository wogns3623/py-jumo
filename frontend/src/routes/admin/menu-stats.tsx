import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminService } from "@/client";
import type { MenuSalesStats } from "@/client/types.gen";
import { TrendingUp, DollarSign, Package, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/menu-stats")({
  component: Page,
});

function Page() {
  const [daysFilter, setDaysFilter] = useState<number>(30);

  // 메뉴 판매 통계 조회
  const {
    data: menuStats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "menu-stats", daysFilter],
    queryFn: async () => {
      const response = await AdminService.getMenuSalesStats({
        days: daysFilter,
      });
      return response as MenuSalesStats[];
    },
    refetchInterval: 30000, // 30초마다 새로고침
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ko-KR").format(price) + "원";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "주문 없음";
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const getSuccessRate = (served: number, ordered: number) => {
    if (ordered === 0) return 0;
    return Math.round((served / ordered) * 100);
  };

  const getCategoryBadgeVariant = (category: string | null) => {
    switch (category) {
      case "메인":
        return "default";
      case "사이드":
        return "secondary";
      case "음료":
        return "outline";
      default:
        return "outline";
    }
  };

  // 총 통계 계산
  const totalStats = menuStats?.reduce(
    (acc, menu) => ({
      totalOrdered: acc.totalOrdered + menu.total_ordered,
      totalServed: acc.totalServed + menu.total_served,
      totalRejected: acc.totalRejected + menu.total_rejected,
      totalRevenue: acc.totalRevenue + menu.total_revenue,
    }),
    { totalOrdered: 0, totalServed: 0, totalRejected: 0, totalRevenue: 0 }
  );

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"메뉴 판매 통계"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                판매 통계를 불러오는데 실패했습니다.
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
      <AdminSidebarHeader title={"메뉴 판매 통계"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            메뉴 판매 통계
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Select
              value={daysFilter.toString()}
              onValueChange={(value) => setDaysFilter(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                <SelectItem value="7">최근 7일</SelectItem>
                <SelectItem value="30">최근 30일</SelectItem>
                <SelectItem value="90">최근 90일</SelectItem>
                <SelectItem value="365">최근 1년</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-sm whitespace-nowrap">
              {daysFilter}일간 데이터
            </Badge>
          </div>
        </div>

        {/* 전체 통계 요약 카드 */}
        {totalStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">총 주문</p>
                    <p className="text-2xl font-bold">
                      {totalStats.totalOrdered}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">완료</p>
                    <p className="text-2xl font-bold">
                      {totalStats.totalServed}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">거절</p>
                    <p className="text-2xl font-bold">
                      {totalStats.totalRejected}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">총 매출</p>
                    <p className="text-2xl font-bold">
                      {formatPrice(totalStats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block lg:hidden space-y-4">
              {menuStats?.map((menu, index) => (
                <Card key={menu.menu_id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더 */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground">
                              #{index + 1}
                            </span>
                            <h3 className="font-medium">{menu.menu_name}</h3>
                            {menu.menu_category && (
                              <Badge
                                variant={getCategoryBadgeVariant(
                                  menu.menu_category
                                )}
                                className="text-xs"
                              >
                                {menu.menu_category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            단가: {formatPrice(menu.menu_price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg">
                            {menu.total_ordered}개
                          </p>
                          <p className="text-xs text-muted-foreground">
                            총 주문
                          </p>
                        </div>
                      </div>

                      {/* 통계 그리드 */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-muted-foreground">완료:</span>
                          <p className="font-medium text-green-600">
                            {menu.total_served}개
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">거절:</span>
                          <p className="font-medium text-red-600">
                            {menu.total_rejected}개
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">성공률:</span>
                          <p className="font-medium">
                            {getSuccessRate(
                              menu.total_served,
                              menu.total_ordered
                            )}
                            %
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground">일평균:</span>
                          <p className="font-medium">
                            {menu.avg_daily_sales}개
                          </p>
                        </div>
                      </div>

                      {/* 매출 및 마지막 주문 */}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-muted-foreground">
                              총 매출:
                            </span>
                            <p className="font-medium">
                              {formatPrice(menu.total_revenue)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">
                              마지막 주문:
                            </span>
                            <p className="text-xs">
                              {formatDate(menu.last_ordered_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 데스크톱 테이블 뷰 */}
            <Card className="hidden lg:block">
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>순위</TableHead>
                      <TableHead>메뉴명</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>단가</TableHead>
                      <TableHead>총 주문</TableHead>
                      <TableHead>완료</TableHead>
                      <TableHead>거절</TableHead>
                      <TableHead>성공률</TableHead>
                      <TableHead>일평균</TableHead>
                      <TableHead>총 매출</TableHead>
                      <TableHead>마지막 주문</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {menuStats?.map((menu, index) => (
                      <TableRow key={menu.menu_id}>
                        <TableCell className="font-medium">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {menu.menu_name}
                        </TableCell>
                        <TableCell>
                          {menu.menu_category && (
                            <Badge
                              variant={getCategoryBadgeVariant(
                                menu.menu_category
                              )}
                              className="text-xs"
                            >
                              {menu.menu_category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatPrice(menu.menu_price)}</TableCell>
                        <TableCell className="font-medium">
                          {menu.total_ordered}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {menu.total_served}
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          {menu.total_rejected}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              getSuccessRate(
                                menu.total_served,
                                menu.total_ordered
                              ) >= 90
                                ? "default"
                                : getSuccessRate(
                                    menu.total_served,
                                    menu.total_ordered
                                  ) >= 70
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {getSuccessRate(
                              menu.total_served,
                              menu.total_ordered
                            )}
                            %
                          </Badge>
                        </TableCell>
                        <TableCell>{menu.avg_daily_sales}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(menu.total_revenue)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(menu.last_ordered_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {menuStats && menuStats.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      해당 기간에 판매된 메뉴가 없습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 모바일에서 빈 목록 표시 */}
            {menuStats && menuStats.length === 0 && (
              <div className="block lg:hidden text-center py-12">
                <p className="text-muted-foreground">
                  해당 기간에 판매된 메뉴가 없습니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
