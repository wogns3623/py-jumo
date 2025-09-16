import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

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
import { toast } from "@/components/ui/sonner";
import { AdminService } from "@/client";
import type { OrderStatus } from "@/client/types.gen";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatKoreanDateTime, formatKoreanDate } from "@/utils/datetime";
import {
  getOrderStatusLabel,
  getOrderStatusBadgeVariantForLabel,
  formatPrice,
  isKioskOrder,
} from "@/utils/order";
import { MultipleGroupedMenuDisplay } from "@/components/Admin/OrderMenuDisplay";

export const Route = createFileRoute("/admin/orders")({
  component: Page,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      orderId: (search.orderId as string) || undefined,
    };
  },
});

function Page() {
  const { orderId } = Route.useSearch();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(
    orderId ? new Set([orderId]) : new Set()
  );
  const scrollOnce = useRef(false);

  // 주문 목록 조회
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "orders", statusFilter],
    queryFn: async () => {
      const response = await AdminService.readOrders(
        statusFilter === "all" ? {} : { status: statusFilter }
      );
      return response;
    },
    refetchInterval: 5000,
  });

  // 특정 주문 ID가 있을 때 해당 주문으로 스크롤
  useEffect(() => {
    if (scrollOnce.current) return; // 이미 스크롤했으면 무시

    if (orderId && orders) {
      scrollOnce.current = true; // 스크롤 시도 완료 표시
      const targetOrder = orders.find((order) => order.id === orderId);
      if (targetOrder) {
        // 주문이 로드된 후 약간의 지연을 두고 스크롤
        setTimeout(() => {
          const element = document.getElementById(`order-${orderId}`);
          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
    }
  }, [orderId, orders]);

  // 주문 거절
  const rejectOrderMutation = useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      return await AdminService.rejectOrder({
        orderId,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success("주문이 거절되었습니다.");
    },
    onError: (error) => {
      toast.error("주문 거절에 실패했습니다.");
      console.error("Order reject error:", error);
    },
  });

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"주문 관리"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                주문 목록을 불러오는데 실패했습니다.
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
      <AdminSidebarHeader title={"주문 관리"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            주문 목록
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as OrderStatus | "all")
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="ordered">주문</SelectItem>
                <SelectItem value="paid">결제완료</SelectItem>
                <SelectItem value="finished">완료</SelectItem>
                <SelectItem value="rejected">거절</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-sm whitespace-nowrap">
              총 {orders?.length || 0}개 주문
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block lg:hidden space-y-4">
              {orders?.map((order) => (
                <Card
                  key={order.id}
                  className={`overflow-hidden ${
                    orderId === order.id
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  }`}
                  id={`order-${order.id}`}
                >
                  <CardContent className="p-0">
                    <div className="space-y-3">
                      {/* 헤더 - 클릭 가능한 영역 */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => toggleOrderExpansion(order.id!)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-lg">
                            #{order.no}
                          </span>
                          <Badge
                            variant={getOrderStatusBadgeVariantForLabel(order)}
                            className="text-xs"
                          >
                            {getOrderStatusLabel(order)}
                          </Badge>
                          {isKioskOrder(order) && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-800 text-xs"
                            >
                              키오스크
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center">
                          {expandedOrders.has(order.id!) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 gap-2 text-sm px-4">
                        <div>
                          <span className="text-muted-foreground">
                            주문 유형:
                          </span>
                          <p className="font-medium">
                            {isKioskOrder(order) ? "키오스크" : "일반 주문"}
                            {isKioskOrder(order) && order.team?.phone && (
                              <span className="text-xs text-muted-foreground ml-1">
                                ({order.team.phone})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">테이블:</span>
                          <p className="font-medium">
                            {order.team?.table?.no
                              ? `${order.team.table.no}번`
                              : "미상"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            생성일시:
                          </span>
                          <p className="font-medium">
                            {order.created_at
                              ? formatKoreanDate(order.created_at)
                              : "미상"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            총 금액:
                          </span>
                          <p className="font-medium">
                            {formatPrice(order.total_price)}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            결제 금액:
                          </span>
                          <p className="font-medium">
                            {formatPrice(order.final_price)}
                          </p>
                        </div>
                      </div>

                      {/* 키오스크 주문 안내 */}
                      {isKioskOrder(order) && (
                        <div className="px-4 pb-2">
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-800">
                              📱 키오스크 주문 - 조리 완료 시 고객에게 자동
                              알림톡 발송
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 액션 */}
                      <div className="flex items-center justify-end gap-2 px-4 pb-4">
                        {order.status === "ordered" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectOrderMutation.mutate({
                                orderId: order.id!,
                                reason: "관리자 거절",
                              });
                            }}
                            disabled={rejectOrderMutation.isPending}
                          >
                            거절
                          </Button>
                        )}
                        {order.status === "rejected" && order.reject_reason && (
                          <span className="text-xs text-muted-foreground">
                            거절됨: {order.reject_reason}
                          </span>
                        )}
                      </div>

                      {/* 확장된 상세 정보 */}
                      {expandedOrders.has(order.id!) && (
                        <div className="mt-4 pt-4 border-t bg-muted -mx-4 px-4 pb-4">
                          <h4 className="font-medium mb-3 text-sm">
                            주문 상세 정보
                          </h4>

                          {/* 주문 메뉴 목록 */}
                          <div className="mb-4">
                            <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                              주문 메뉴
                            </h5>
                            <MultipleGroupedMenuDisplay
                              groupedOrderedMenus={order.grouped_ordered_menus}
                              order={order}
                              variant="simple"
                              formatDateTime={formatKoreanDateTime}
                            />
                          </div>

                          {/* 결제 및 주문 요약 정보 (간소화) */}
                          {order.payment && (
                            <div className="mb-4">
                              <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                                결제 정보
                              </h5>
                              <div className="bg-white rounded border p-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-muted-foreground">
                                      결제 금액:
                                    </span>
                                    <p className="font-medium">
                                      {formatPrice(order.payment.amount)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      상태:
                                    </span>
                                    <p className="font-medium">
                                      {order.payment.refunded_at
                                        ? "환불됨"
                                        : "결제완료"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                      <TableHead></TableHead>
                      <TableHead>주문번호</TableHead>
                      <TableHead>주문 유형</TableHead>
                      <TableHead>테이블</TableHead>
                      <TableHead>생성일시</TableHead>
                      <TableHead>총 금액</TableHead>
                      <TableHead>결제 금액</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.map((order) => (
                      <>
                        <TableRow
                          key={order.id}
                          className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                            orderId === order.id
                              ? "bg-primary/10 ring-2 ring-primary ring-offset-2"
                              : ""
                          }`}
                          onClick={() => toggleOrderExpansion(order.id!)}
                          id={`order-${order.id}`}
                        >
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {expandedOrders.has(order.id!) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            #{order.no}
                          </TableCell>
                          <TableCell>
                            {isKioskOrder(order) ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-100 text-blue-800"
                                >
                                  키오스크
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {order.team?.phone}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline">일반 주문</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.team?.table?.no
                              ? `${order.team.table.no}번 테이블`
                              : "테이블 미상"}
                          </TableCell>
                          <TableCell>
                            {order.created_at
                              ? formatKoreanDateTime(order.created_at)
                              : "시간 미상"}
                          </TableCell>
                          <TableCell>
                            {formatPrice(order.total_price)}
                          </TableCell>
                          <TableCell>
                            {formatPrice(order.final_price)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getOrderStatusBadgeVariantForLabel(
                                order
                              )}
                            >
                              {getOrderStatusLabel(order)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {order.status === "ordered" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="font-medium"
                                  onClick={() =>
                                    rejectOrderMutation.mutate({
                                      orderId: order.id!,
                                      reason: "관리자 거절",
                                    })
                                  }
                                  disabled={rejectOrderMutation.isPending}
                                >
                                  거절
                                </Button>
                              )}
                              {order.status === "rejected" &&
                                order.reject_reason && (
                                  <span className="text-sm text-muted-foreground">
                                    거절됨: {order.reject_reason}
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedOrders.has(order.id!) && (
                          <TableRow>
                            <TableCell colSpan={9}>
                              <div className="p-4 bg-muted rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">
                                    주문 상세 정보
                                  </h4>
                                  {isKioskOrder(order) && (
                                    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1">
                                      <span className="text-xs text-blue-800 font-medium">
                                        📱 키오스크 주문 - 조리 완료 시 자동
                                        알림톡 발송
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* 주문 메뉴 목록 */}
                                <div className="mb-4">
                                  <h5 className="text-sm font-medium mb-2">
                                    주문 메뉴
                                  </h5>
                                  <MultipleGroupedMenuDisplay
                                    groupedOrderedMenus={
                                      order.grouped_ordered_menus
                                    }
                                    order={order}
                                    variant="detailed"
                                  />
                                </div>

                                {/* 결제 정보 */}
                                {order.payment && (
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium mb-2">
                                      결제 정보
                                    </h5>
                                    <div className="bg-white rounded border p-3">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <span className="text-sm text-muted-foreground">
                                            결제 금액:
                                          </span>
                                          <p className="font-medium">
                                            {formatPrice(order.payment.amount)}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-sm text-muted-foreground">
                                            결제 상태:
                                          </span>
                                          <p className="font-medium">
                                            {order.payment.refunded_at
                                              ? "환불됨"
                                              : "결제완료"}
                                          </p>
                                        </div>
                                        {order.payment.transaction_by && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">
                                              결제 처리자:
                                            </span>
                                            <p className="font-medium">
                                              {order.payment.transaction_by}
                                            </p>
                                          </div>
                                        )}
                                        {order.payment.refunded_at && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">
                                              환불일시:
                                            </span>
                                            <p className="font-medium">
                                              {formatKoreanDateTime(
                                                order.payment.refunded_at
                                              )}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* 기타 정보 */}
                                <div>
                                  <h5 className="text-sm font-medium mb-2">
                                    주문 요약
                                  </h5>
                                  <div className="bg-white rounded border p-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <span className="text-sm text-muted-foreground">
                                          주문 ID:
                                        </span>
                                        <p className="font-mono text-xs">
                                          {order.id}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">
                                          총 주문 금액:
                                        </span>
                                        <p className="font-medium">
                                          {formatPrice(order.total_price)}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">
                                          실제 결제 금액:
                                        </span>
                                        <p className="font-medium">
                                          {formatPrice(order.final_price)}
                                        </p>
                                      </div>
                                      {order.final_price <
                                        order.total_price && (
                                        <div>
                                          <span className="text-sm text-muted-foreground">
                                            할인 금액:
                                          </span>
                                          <p className="font-medium text-destructive">
                                            -
                                            {formatPrice(
                                              order.total_price -
                                                order.final_price
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      {order.finished_at && (
                                        <div>
                                          <span className="text-sm text-muted-foreground">
                                            완료일시:
                                          </span>
                                          <p className="font-medium">
                                            {formatKoreanDateTime(
                                              order.finished_at
                                            )}
                                          </p>
                                        </div>
                                      )}
                                      {order.reject_reason && (
                                        <div className="col-span-2">
                                          <span className="text-sm text-muted-foreground">
                                            거절 사유:
                                          </span>
                                          <p className="font-medium text-destructive">
                                            {order.reject_reason}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))}
                  </TableBody>
                </Table>

                {orders && orders.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">주문이 없습니다.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 모바일에서 빈 목록 표시 */}
            {orders && orders.length === 0 && (
              <div className="block lg:hidden text-center py-12">
                <p className="text-muted-foreground">주문이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
