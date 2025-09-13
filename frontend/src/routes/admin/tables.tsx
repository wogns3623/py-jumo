import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { AdminService } from "@/client";
import type { TableStatus, Tables } from "@/client/types.gen";

export const Route = createFileRoute("/admin/tables")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<Tables | null>(null);
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // 테이블 목록 조회
  const {
    data: tables,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: async () => {
      const response = await AdminService.readTables();
      return response;
    },
  });

  // 테이블 상태 업데이트
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
      toast.success("테이블 상태가 업데이트되었습니다.");
      setOpenPopover(null);
      setSelectedTable(null);
    },
    onError: (error) => {
      toast.error("테이블 상태 업데이트에 실패했습니다.");
      console.error("Table update error:", error);
    },
  });

  const handleTableClick = (table: Tables) => {
    setSelectedTable(table);
    setOpenPopover(table.id || null);
  };

  const handleStatusChange = (newStatus: TableStatus) => {
    if (selectedTable && selectedTable.id) {
      updateTableMutation.mutate({
        tableId: selectedTable.id,
        status: newStatus,
      });
    }
  };

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

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"테이블 관리"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-destructive">
                테이블 목록을 불러오는데 실패했습니다.
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

  if (isLoading) {
    return (
      <>
        <AdminSidebarHeader title={"테이블 관리"} />
        <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-wrap gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={i}
                className="flex-shrink-0 w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(16.666%-0.833rem)] aspect-square"
              >
                <CardContent className="flex items-center justify-center h-full p-4">
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebarHeader title={"테이블 관리"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            테이블 관리
          </h2>
          <Badge
            variant="outline"
            className="text-sm self-start sm:self-center"
          >
            총 {tables?.length || 0}개 테이블
          </Badge>
        </div>

        {/* 통합된 Flex 기반 테이블 목록 */}
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {tables?.map((table) => {
            // 한 줄에 (전체 테이블 개수)/2 개가 들어가도록 계산
            const totalTables = tables?.length || 1;
            const tablesPerRow = Math.ceil((totalTables + 2) / 2);
            const widthPercentage = 100 / tablesPerRow;
            const gapSize = 0.75; // gap-3 = 0.75rem, gap-4 = 1rem
            const tableWidth = `calc(${widthPercentage}% - ${gapSize}rem)`;

            return (
              <Popover
                key={table.id}
                open={openPopover === table.id}
                onOpenChange={(open) => {
                  if (open) {
                    handleTableClick(table);
                  } else {
                    setOpenPopover(null);
                    setSelectedTable(null);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    className="cursor-pointer transition-all hover:shadow-md flex-shrink-0"
                    style={{ width: tableWidth }}
                  >
                    <Card
                      className={`border-2 transition-colors aspect-square ${getStatusBackgroundColor(
                        table.status
                      )}`}
                    >
                      <CardContent className="flex items-center justify-center h-full p-4">
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-center">
                          {table.no}
                        </CardTitle>
                      </CardContent>
                    </Card>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">
                        테이블 {table.no}
                      </h4>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">테이블 ID:</span>{" "}
                          {table.id?.slice(0, 8)}...
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            현재 상태:
                          </span>
                          <Badge variant={getStatusBadgeVariant(table.status)}>
                            {getStatusText(table.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">상태 변경</label>
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
                        <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
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
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {tables && tables.length === 0 && (
          <Card className="py-8 sm:py-12">
            <CardContent className="text-center">
              <p className="text-muted-foreground">등록된 테이블이 없습니다.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
