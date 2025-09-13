import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      setSelectedTable(null);
    },
    onError: (error) => {
      toast.error("테이블 상태 업데이트에 실패했습니다.");
      console.error("Table update error:", error);
    },
  });

  const handleTableClick = (table: Tables) => {
    setSelectedTable(table);
  };

  const handleStatusChange = (status: TableStatus) => {
    if (selectedTable && selectedTable.id) {
      updateTableMutation.mutate({
        tableId: selectedTable.id,
        status,
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

  const getStatusColor = (status?: TableStatus) => {
    switch (status) {
      case "idle":
        return "bg-green-100 border-green-300 hover:bg-green-200";
      case "in_use":
        return "bg-red-100 border-red-300 hover:bg-red-200";
      case "reserved":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
      default:
        return "bg-gray-100 border-gray-300 hover:bg-gray-200";
    }
  };

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"테이블 관리"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-600">
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
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  // 모바일에서는 단순한 그리드, 데스크톱에서는 2줄 배열
  const tablesPerRow = Math.ceil((tables?.length || 0) / 2);
  const firstRow = tables?.slice(0, tablesPerRow) || [];
  const secondRow = tables?.slice(tablesPerRow) || [];

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

        {/* 모바일: 단순 그리드 */}
        <div className="block lg:hidden">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tables?.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all ${getStatusColor(
                  table.status
                )} ${
                  selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleTableClick(table)}
              >
                <CardHeader className="pb-2 px-3 py-3">
                  <CardTitle className="text-base sm:text-lg">
                    테이블 {table.no}
                  </CardTitle>
                  <Badge
                    variant={getStatusBadgeVariant(table.status)}
                    className="w-fit text-xs"
                  >
                    {getStatusText(table.status)}
                  </Badge>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground">
                    ID: {table.id?.slice(0, 8)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 데스크톱: 2줄 배열 */}
        <div className="hidden lg:block space-y-4">
          {/* 첫 번째 줄 */}
          <div className="grid grid-cols-6 gap-4">
            {firstRow.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer transition-all ${getStatusColor(
                  table.status
                )} ${
                  selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleTableClick(table)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">테이블 {table.no}</CardTitle>
                  <Badge
                    variant={getStatusBadgeVariant(table.status)}
                    className="w-fit"
                  >
                    {getStatusText(table.status)}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    ID: {table.id?.slice(0, 8)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 두 번째 줄 */}
          {secondRow.length > 0 && (
            <div className="grid grid-cols-6 gap-4">
              {secondRow.map((table) => (
                <Card
                  key={table.id}
                  className={`cursor-pointer transition-all ${getStatusColor(
                    table.status
                  )} ${
                    selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => handleTableClick(table)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">테이블 {table.no}</CardTitle>
                    <Badge
                      variant={getStatusBadgeVariant(table.status)}
                      className="w-fit"
                    >
                      {getStatusText(table.status)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      ID: {table.id?.slice(0, 8)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 테이블 제어 패널 */}
        {selectedTable && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="px-4 py-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">
                테이블 {selectedTable.no} 상태 변경
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-2">
                    현재 상태:{" "}
                    <span className="font-medium">
                      {getStatusText(selectedTable.status)}
                    </span>
                  </p>
                  <Select
                    value={selectedTable.status || "idle"}
                    onValueChange={(value: TableStatus) =>
                      handleStatusChange(value)
                    }
                    disabled={updateTableMutation.isPending}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md z-50">
                      <SelectItem value="idle">사용 가능</SelectItem>
                      <SelectItem value="in_use">사용 중</SelectItem>
                      <SelectItem value="reserved">예약됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTable(null)}
                  className="w-full sm:w-auto"
                >
                  취소
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
