import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatKoreanTime, getTimeDifferenceInMinutes } from "@/utils/datetime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { AdminService } from "@/client";
import type { Waitings } from "@/client/types.gen";
import {
  Clock,
  Phone,
  CheckCircle,
  X,
  Users,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/admin/waitings")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [selectedWaiting, setSelectedWaiting] = React.useState<Waitings | null>(
    null
  );

  // 웨이팅 데이터 가져오기
  const {
    data: waitings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "waitings"],
    queryFn: () => AdminService.readWaitings(),
    refetchInterval: 5000, // 5초마다 새로고침
  });

  // 웨이팅 거절 처리
  const rejectWaitingMutation = useMutation({
    mutationFn: ({
      waitingId,
      reason,
    }: {
      waitingId: string;
      reason: string;
    }) => AdminService.rejectWaiting({ waitingId, reason }),
    onSuccess: () => {
      toast.success("웨이팅이 거절되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["admin", "waitings"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedWaiting(null);
    },
    onError: (error) => {
      console.error("웨이팅 거절 실패:", error);
      toast.error("웨이팅 거절에 실패했습니다.");
    },
  });

  // 일괄 입장 처리
  const dequeueWaitingsMutation = useMutation({
    mutationFn: (dequeueCount: number) =>
      AdminService.dequeueWaitings({ dequeueCount }),
    onSuccess: (data) => {
      toast.success(`${data.length}팀이 입장 처리되었습니다.`);
      queryClient.invalidateQueries({ queryKey: ["admin", "waitings"] });
    },
    onError: (error) => {
      console.error("일괄 입장 처리 실패:", error);
      toast.error("일괄 입장 처리에 실패했습니다.");
    },
  });

  const handleRejectWaiting = (waiting: Waitings) => {
    setSelectedWaiting(waiting);
    setRejectDialogOpen(true);
  };

  const confirmRejectWaiting = () => {
    if (selectedWaiting && rejectReason.trim()) {
      rejectWaitingMutation.mutate({
        waitingId: selectedWaiting.id!,
        reason: rejectReason.trim(),
      });
    } else {
      toast.error("거절 사유를 입력해주세요.");
    }
  };

  const formatTime = (dateString: string) => {
    return formatKoreanTime(dateString);
  };

  const getWaitingTime = (createdAt: string) => {
    return getTimeDifferenceInMinutes(createdAt);
  };

  const getWaitingTimeColor = (minutes: number) => {
    if (minutes < 10) return "text-green-600";
    if (minutes < 30) return "text-yellow-600";
    return "text-red-600";
  };

  // 현재 대기중인 웨이팅들만 필터링
  const activeWaitings = React.useMemo(() => {
    if (!waitings) return [];
    return waitings.filter(
      (waiting) => !waiting.rejected_at && !waiting.entered_at
    );
  }, [waitings]);

  // 처리된 웨이팅들 (입장 또는 거절)
  const processedWaitings = React.useMemo(() => {
    if (!waitings) return [];
    return waitings
      .filter((waiting) => waiting.rejected_at || waiting.entered_at)
      .slice(0, 10); // 최근 10개만
  }, [waitings]);

  if (error) {
    return (
      <>
        <AdminSidebarHeader title="웨이팅 관리" />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  데이터를 불러오는 중 오류가 발생했습니다.
                </p>
                <Button
                  onClick={() => refetch()}
                  className="mt-4"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebarHeader title="웨이팅 관리" />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              웨이팅 관리
            </h2>
            <p className="text-muted-foreground">
              대기중인 고객들을 관리하세요
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm whitespace-nowrap">
              대기중 {activeWaitings.length}팀
            </Badge>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              새로고침
            </Button>
          </div>
        </div>

        {/* 일괄 처리 버튼들 */}
        {activeWaitings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">일괄 처리</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => dequeueWaitingsMutation.mutate(1)}
                  disabled={dequeueWaitingsMutation.isPending}
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  1팀 입장
                </Button>
                <Button
                  onClick={() => dequeueWaitingsMutation.mutate(2)}
                  disabled={
                    dequeueWaitingsMutation.isPending ||
                    activeWaitings.length < 2
                  }
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  2팀 입장
                </Button>
                <Button
                  onClick={() => dequeueWaitingsMutation.mutate(3)}
                  disabled={
                    dequeueWaitingsMutation.isPending ||
                    activeWaitings.length < 3
                  }
                  size="sm"
                >
                  <Users className="w-4 h-4 mr-2" />
                  3팀 입장
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 현재 대기중인 웨이팅 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              현재 대기중 ({activeWaitings.length}팀)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 py-3">
                    <Skeleton className="h-8 w-8" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : activeWaitings.length > 0 ? (
              <>
                {/* 데스크톱 테이블 뷰 */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">순번</TableHead>
                        <TableHead>고객명</TableHead>
                        <TableHead>연락처</TableHead>
                        <TableHead className="w-24">등록시간</TableHead>
                        <TableHead className="w-24">대기시간</TableHead>
                        <TableHead className="w-32">상태</TableHead>
                        <TableHead className="w-48">액션</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeWaitings.map((waiting, index) => {
                        const waitingMinutes = getWaitingTime(
                          waiting.created_at!
                        );
                        return (
                          <TableRow
                            key={waiting.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {waiting.name}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {waiting.phone}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTime(waiting.created_at!)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-sm font-medium ${getWaitingTimeColor(
                                  waitingMinutes
                                )}`}
                              >
                                {waitingMinutes}분
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">대기중</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleRejectWaiting(waiting)}
                                  disabled={rejectWaitingMutation.isPending}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  거절
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* 모바일 카드 뷰 */}
                <div className="md:hidden space-y-3">
                  {activeWaitings.map((waiting, index) => {
                    const waitingMinutes = getWaitingTime(waiting.created_at!);
                    return (
                      <Card key={waiting.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant="outline"
                                className="font-mono text-lg"
                              >
                                {index + 1}
                              </Badge>
                              <div>
                                <h3 className="font-semibold">
                                  {waiting.name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  {waiting.phone}
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">대기중</Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>등록: {formatTime(waiting.created_at!)}</span>
                            <span
                              className={`font-medium ${getWaitingTimeColor(
                                waitingMinutes
                              )}`}
                            >
                              대기시간: {waitingMinutes}분
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleRejectWaiting(waiting)}
                              disabled={rejectWaitingMutation.isPending}
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                            >
                              <X className="w-3 h-3 mr-1" />
                              거절
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  현재 대기중인 고객이 없습니다
                </h3>
                <p className="text-sm text-muted-foreground">
                  새로운 웨이팅이 등록되면 여기에 표시됩니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 최근 처리된 웨이팅 목록 */}
        {processedWaitings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                최근 처리 내역 (최근 {processedWaitings.length}건)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processedWaitings.map((waiting) => (
                  <div
                    key={waiting.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="font-medium">{waiting.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {waiting.phone}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {waiting.entered_at && (
                        <Badge variant="default">
                          입장 - {formatTime(waiting.entered_at)}
                        </Badge>
                      )}
                      {waiting.rejected_at && (
                        <Badge variant="destructive">
                          거절 - {formatTime(waiting.rejected_at)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 웨이팅 거절 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              웨이팅 거절
            </DialogTitle>
            <DialogDescription>
              {selectedWaiting?.name}님의 웨이팅을 거절하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">거절 사유</Label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
                setSelectedWaiting(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRejectWaiting}
              disabled={rejectWaitingMutation.isPending || !rejectReason.trim()}
            >
              {rejectWaitingMutation.isPending ? "처리중..." : "거절"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
