import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // 결제 목록 조회
  const {
    data: payments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "payments"],
    queryFn: async () => {
      const response = await AdminService.readPayments();
      return response;
    },
  });

  // 결제 환불
  const refundPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await AdminService.refundPayment({ paymentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      toast.success("결제가 환불되었습니다.");
    },
    onError: (error) => {
      toast.error("결제 환불에 실패했습니다.");
      console.error("Payment refund error:", error);
    },
  });

  const handleViewOrder = () => {
    // 결제와 연결된 주문을 찾아 주문 페이지로 이동
    // 실제로는 payment에서 order_id를 가져와야 하지만, 현재 API 구조상 어려움
    navigate({ to: "/admin/orders" });
    toast.info("주문 관리 페이지로 이동합니다.");
  };

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"결제 관리"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                결제 목록을 불러오는데 실패했습니다.
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
      <AdminSidebarHeader title={"결제 관리"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            결제 목록
          </h2>
          <Badge
            variant="outline"
            className="text-sm self-start sm:self-center"
          >
            총 {payments?.length || 0}개 결제
          </Badge>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block lg:hidden space-y-4">
              {payments?.map((payment) => (
                <Card key={payment.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 헤더 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            결제 ID: {payment.id?.slice(0, 8)}
                          </span>
                        </div>
                        <Badge
                          variant={
                            !payment.refunded_at ? "default" : "destructive"
                          }
                          className="text-xs"
                        >
                          {!payment.refunded_at ? "완료" : "환불"}
                        </Badge>
                      </div>

                      {/* 기본 정보 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            결제 금액:
                          </span>
                          <p className="font-semibold text-lg">
                            {(payment.amount || 0).toLocaleString()}원
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            결제일시:
                          </span>
                          <p className="font-medium">
                            {payment.created_at
                              ? new Date(
                                  payment.created_at
                                ).toLocaleDateString()
                              : "미상"}
                          </p>
                        </div>
                        {payment.refunded_at && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">
                              환불일시:
                            </span>
                            <p className="font-medium text-destructive">
                              {new Date(payment.refunded_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 액션 */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrder()}
                          className="w-full sm:w-auto"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          주문 보기
                        </Button>
                        {!payment.refunded_at && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              refundPaymentMutation.mutate(payment.id!)
                            }
                            disabled={refundPaymentMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            환불
                          </Button>
                        )}
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
                      <TableHead>결제 ID</TableHead>
                      <TableHead>금액</TableHead>
                      <TableHead>결제일시</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>환불일시</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.id?.slice(0, 8)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {(payment.amount || 0).toLocaleString()}원
                        </TableCell>
                        <TableCell>
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleString()
                            : "시간 미상"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              !payment.refunded_at ? "default" : "destructive"
                            }
                          >
                            {!payment.refunded_at ? "완료" : "환불"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.refunded_at
                            ? new Date(payment.refunded_at).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrder()}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              주문 보기
                            </Button>
                            {!payment.refunded_at && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() =>
                                  refundPaymentMutation.mutate(payment.id!)
                                }
                                disabled={refundPaymentMutation.isPending}
                              >
                                환불
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {payments && payments.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      결제 내역이 없습니다.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 모바일에서 빈 목록 표시 */}
            {payments && payments.length === 0 && (
              <div className="block lg:hidden text-center py-12">
                <p className="text-muted-foreground">결제 내역이 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
