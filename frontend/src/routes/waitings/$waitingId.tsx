import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { WaitingsService } from "@/client";
import { formatKoreanDateTime, formatRelativeTime } from "@/utils/datetime";
import { Clock, Users, Phone, CheckCircle, X, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/waitings/$waitingId")({
  component: WaitingDetailPage,
});

function WaitingDetailPage() {
  const { waitingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);

  // 웨이팅 정보 조회
  const {
    data: waiting,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["waiting", waitingId],
    queryFn: () => WaitingsService.getWaiting({ waitingId }),
    retry: 1,
  });

  // 웨이팅 취소 뮤테이션
  const cancelMutation = useMutation({
    mutationFn: () =>
      WaitingsService.cancelWaitingById({
        waitingId,
      }),
    onSuccess: () => {
      toast.success("웨이팅이 취소되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["waiting", waitingId] });
      // 3초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate({ to: "/" });
      }, 3000);
    },
    onError: (error: any) => {
      toast.error(error?.detail || "웨이팅 취소에 실패했습니다.");
      setIsConfirming(false);
    },
  });

  const handleCancel = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }
    cancelMutation.mutate();
  };

  const getWaitingStatus = (waiting: any) => {
    if (waiting.rejected_at) return "cancelled";
    if (waiting.entered_at) return "seated";
    return "waiting";
  };

  const getStatusBadge = (waiting: any) => {
    const status = getWaitingStatus(waiting);
    switch (status) {
      case "waiting":
        return <Badge variant="default">대기 중</Badge>;
      case "seated":
        return <Badge variant="secondary">입장 완료</Badge>;
      case "cancelled":
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (waiting: any) => {
    const status = getWaitingStatus(waiting);
    switch (status) {
      case "waiting":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "seated":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <Skeleton className="h-8 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !waiting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-red-500">
              <AlertCircle className="h-full w-full" />
            </div>
            <CardTitle>웨이팅을 찾을 수 없습니다</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              요청하신 웨이팅 정보가 존재하지 않거나 이미 처리되었습니다.
            </p>
            <Button onClick={() => navigate({ to: "/" })} className="w-full">
              메인으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isWaitingActive = getWaitingStatus(waiting) === "waiting";
  const isAlreadyCancelled = getWaitingStatus(waiting) === "cancelled";
  const isSeated = getWaitingStatus(waiting) === "seated";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">{getStatusIcon(waiting)}</div>
          <div>
            <CardTitle className="text-2xl">레스토랑</CardTitle>
            <p className="text-muted-foreground">웨이팅 상태 확인</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 웨이팅 정보 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{waiting.name}님</p>
                  <p className="text-sm text-muted-foreground">웨이팅 등록</p>
                </div>
              </div>
              {getStatusBadge(waiting)}
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">연락처</p>
                <p className="text-sm text-muted-foreground">{waiting.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">등록 시간</p>
                <p className="text-sm text-muted-foreground">
                  {waiting.created_at &&
                    formatKoreanDateTime(waiting.created_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {waiting.created_at && formatRelativeTime(waiting.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* 상태별 메시지 */}
          {isWaitingActive && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 text-sm">
                현재 대기 중입니다. 순서가 가까워지면 알림톡으로 안내해
                드릴게요.
              </p>
            </div>
          )}

          {isSeated && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                입장이 완료되었습니다. 즐거운 시간 되세요!
              </p>
            </div>
          )}

          {isAlreadyCancelled && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-800 text-sm">이미 취소된 웨이팅입니다.</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="space-y-3">
            {isWaitingActive && (
              <Button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                variant={isConfirming ? "destructive" : "outline"}
                className="w-full"
              >
                {cancelMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    취소 중...
                  </>
                ) : isConfirming ? (
                  "정말로 취소하시겠습니까?"
                ) : (
                  "웨이팅 취소하기"
                )}
              </Button>
            )}

            {isConfirming && (
              <Button
                onClick={() => setIsConfirming(false)}
                variant="outline"
                className="w-full"
              >
                돌아가기
              </Button>
            )}

            {(isAlreadyCancelled || isSeated) && (
              <Button onClick={() => navigate({ to: "/" })} className="w-full">
                메인으로 돌아가기
              </Button>
            )}
          </div>

          {/* 추가 안내 */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              문의사항이 있으시면 매장으로 직접 연락해 주세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
