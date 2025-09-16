import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { AdminService } from "@/client";
import type {
  TableBasic,
  TableStatus,
  TeamWithOrders,
  OrderPublic,
} from "@/client/types.gen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Clock, Users, ShoppingCart, Phone } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { formatKoreanDateTime } from "@/utils/order";

const getStatusBadgeVariant = (status?: TableStatus) => {
  switch (status) {
    case "idle":
      return "default";
    case "in_use":
      return "destructive";
    case "reserved":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusBackgroundColor = (status?: TableStatus) => {
  switch (status) {
    case "idle":
      return "bg-green-300 border-green-200 hover:bg-green-400";
    case "in_use":
      return "bg-red-500 border-red-200 hover:bg-red-700";
    case "reserved":
      return "bg-yellow-300 border-yellow-200 hover:bg-yellow-400";
    default:
      return "bg-gray-50 border-gray-200 hover:bg-gray-100";
  }
};

const getStatusText = (status?: TableStatus) => {
  switch (status) {
    case "idle":
      return "사용 가능";
    case "in_use":
      return "사용 중";
    case "reserved":
      return "예약됨";
    default:
      return "미상";
  }
};

// 기본 테이블 카드 (목록용 - 성능 최적화)
export function TableBasicCard({ table }: { table: TableBasic }) {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 테이블 상세 정보 조회 (모달 열릴 때만)
  const {
    data: tableDetail,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ["admin", "table", table.id],
    queryFn: async () => {
      const response = await AdminService.readTable({ tableId: table.id });
      return response;
    },
    enabled: isSheetOpen, // 모달이 열릴 때만 쿼리 실행
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({
      tableId,
      status,
    }: {
      tableId: string;
      status: TableStatus;
    }) => {
      return await AdminService.updateTable({
        tableId,
        requestBody: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "table", table.id] });
      toast.success("테이블 상태가 업데이트되었습니다.");
    },
    onError: (error) => {
      toast.error("테이블 상태 업데이트에 실패했습니다.");
      console.error("Table update error:", error);
    },
  });

  const handleStatusChange = (newStatus: TableStatus) => {
    updateTableMutation.mutate({
      tableId: table.id,
      status: newStatus,
    });
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer transition-all hover:shadow-md flex-shrink-0"
          onClick={() => setIsSheetOpen(true)}
        >
          <Card
            className={`border-2 transition-colors aspect-square ${getStatusBackgroundColor(
              table.status
            )}`}
          >
            <CardContent className="flex flex-col items-center justify-center h-full p-4 relative">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                {table.no}
              </CardTitle>
              {table.teams_count && table.teams_count > 0 && (
                <div className="absolute top-1 right-1">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {table.teams_count}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetTrigger>

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>테이블 {table.no} 관리</SheetTitle>
          <SheetDescription>
            {table.type === "kiosk" ? "키오스크 테이블" : "일반 테이블"} ·{" "}
            {getStatusText(table.status)}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 pt-0 space-y-4 flex flex-col h-full">
          <div className="flex">
            {/* 기본 정보 및 버튼 섹션 */}
            <div className="flex-1 space-y-2">
              <h4 className="font-medium">테이블 정보</h4>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">테이블 ID:</span>{" "}
                  {table.id?.slice(0, 8)}...
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">현재 상태:</span>
                  <Badge variant={getStatusBadgeVariant(table.status)}>
                    {getStatusText(table.status)}
                  </Badge>
                </div>
              </div>

              <div>
                {table.type === "kiosk" ? (
                  <Link to={`/kiosk`} search={{ table: table.id }}>
                    <Button>키오스크 열기</Button>
                  </Link>
                ) : (
                  <Link to={`/menus`} search={{ table: table.id }}>
                    <Button>메뉴 열기</Button>
                  </Link>
                )}
              </div>
            </div>

            {/* 상태 변경 섹션 (키오스크가 아닌 경우만) */}
            {table.type !== "kiosk" && (
              <div className="flex-1 space-y-2">
                <h4 className="font-medium">테이블 상태</h4>
                <Select
                  value={table.status || "idle"}
                  onValueChange={(value: TableStatus) =>
                    handleStatusChange(value)
                  }
                  disabled={updateTableMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idle">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        사용 가능
                      </div>
                    </SelectItem>
                    <SelectItem value="in_use">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        사용 중
                      </div>
                    </SelectItem>
                    <SelectItem value="reserved">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        예약됨
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* 팀-주문 목록 섹션 */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">활성 팀 & 주문</h4>
              <Badge variant="outline">
                {isDetailLoading
                  ? "로딩 중..."
                  : `${tableDetail?.teams?.length || 0}개 팀`}
              </Badge>
            </div>

            <div className="relative w-full h-full shadow-inner">
              <ScrollArea
                className="flex flex-col w-full h-full pb-8"
                style={{ position: "absolute" }}
              >
                {isDetailLoading ? (
                  <div className="flex flex-col items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-muted-foreground mt-2">
                      팀 정보를 불러오는 중...
                    </p>
                  </div>
                ) : detailError ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <p>팀 정보를 불러오는데 실패했습니다.</p>
                  </div>
                ) : tableDetail?.teams && tableDetail.teams.length > 0 ? (
                  <div className="space-y-4">
                    {tableDetail.teams.map((team: TeamWithOrders) => (
                      <div
                        key={team.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">
                              팀 {team.id.slice(-8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatKoreanDateTime(team.created_at)}
                          </div>
                        </div>

                        {team.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {team.phone}
                          </div>
                        )}

                        {/* 주문 목록 */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            <span className="font-medium">
                              주문 ({team.orders.length})
                            </span>
                          </div>

                          {team.orders.length > 0 ? (
                            <div className="space-y-2 ml-6">
                              {team.orders.map((order: OrderPublic) => (
                                <OrderCard key={order.id} order={order} />
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground ml-6">
                              주문이 없습니다
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Users className="h-8 w-8 mb-2" />
                    <p>활성 팀이 없습니다</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// 기존 TableCard를 TableBasicCard로 대체
export const TableCard = TableBasicCard;
