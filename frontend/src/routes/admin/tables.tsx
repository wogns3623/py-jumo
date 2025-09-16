import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { AdminService } from "@/client";
import type { TableBasic } from "@/client/types.gen";
import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { TableCard } from "@/components/Admin/Table.page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/tables")({
  component: Page,
});

function Page() {
  // 테이블 목록 조회 (기본 정보만, 성능 최적화)
  const {
    data: tables,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "tables"],
    queryFn: async (): Promise<TableBasic[]> => {
      const response = await AdminService.readTables();
      return response;
    },
    refetchInterval: 5000,
  });

  const normalTables = useMemo(() => {
    return tables?.filter((table) => table.type === "normal") || [];
  }, [tables]);

  const kioskTables = useMemo(() => {
    return tables?.filter((table) => table.type === "kiosk") || [];
  }, [tables]);

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

        <div>
          <h3 className="text-lg font-semibold mb-2">일반 테이블</h3>
          <div className="grid grid-cols-7 gap-3 sm:gap-4">
            {normalTables?.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">키오스크</h3>
          <div className="grid grid-cols-7 gap-3 sm:gap-4">
            {kioskTables?.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
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
