import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { AdminService, RestaurantsService } from "@/client";
import type { RestaurantUpdate } from "@/client/types.gen";

export const Route = createFileRoute("/admin/settings")({
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RestaurantUpdate>({});

  // 레스토랑 정보 조회
  const {
    data: restaurant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const response = await RestaurantsService.readRestaurants();
      return response;
    },
  });

  // 레스토랑 정보 업데이트
  const updateRestaurantMutation = useMutation({
    mutationFn: async (updates: RestaurantUpdate) => {
      return await AdminService.updateRestaurant({
        requestBody: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant"] });
      toast.success("레스토랑 설정이 업데이트되었습니다.");
      setIsEditing(false);
      setFormData({});
    },
    onError: (error) => {
      toast.error("레스토랑 설정 업데이트에 실패했습니다.");
      console.error("Restaurant update error:", error);
    },
  });

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      break_start_time: restaurant?.break_start_time || null,
      break_end_time: restaurant?.break_end_time || null,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = () => {
    updateRestaurantMutation.mutate(formData);
  };

  const handleInputChange = (
    field: keyof RestaurantUpdate,
    value: string | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }));
  };

  if (error) {
    return (
      <>
        <AdminSidebarHeader title={"설정"} />
        <div className="flex flex-1 flex-col items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-600">
                레스토랑 정보를 불러오는데 실패했습니다.
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
        <AdminSidebarHeader title={"설정"} />
        <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminSidebarHeader title={"설정"} />
      <div className="flex flex-1 flex-col p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            레스토랑 설정
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {/* 기본 정보 (읽기 전용) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>레스토랑 이름</Label>
                <Input
                  value={restaurant?.name || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  레스토랑 이름은 현재 수정할 수 없습니다.
                </p>
              </div>

              <div className="space-y-2">
                <Label>운영 시간</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Input
                    value={restaurant?.open_time || ""}
                    disabled
                    className="bg-gray-50 flex-1"
                  />
                  <span className="hidden sm:block">~</span>
                  <span className="sm:hidden text-sm text-muted-foreground">
                    부터
                  </span>
                  <Input
                    value={restaurant?.close_time || ""}
                    disabled
                    className="bg-gray-50 flex-1"
                  />
                  <span className="sm:hidden text-sm text-muted-foreground">
                    까지
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  운영 시간은 현재 수정할 수 없습니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 브레이크 타임 설정 (수정 가능) */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl">
                브레이크 타임 설정
              </CardTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  onClick={handleEdit}
                  className="self-start sm:self-center"
                >
                  수정
                </Button>
              ) : (
                <div className="flex gap-2 self-start sm:self-center">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateRestaurantMutation.isPending}
                    size="sm"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateRestaurantMutation.isPending}
                    size="sm"
                  >
                    저장
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>브레이크 타임 시작</Label>
                <Input
                  type="time"
                  value={
                    isEditing
                      ? formData.break_start_time || ""
                      : restaurant?.break_start_time || ""
                  }
                  onChange={(e) =>
                    handleInputChange("break_start_time", e.target.value)
                  }
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label>브레이크 타임 종료</Label>
                <Input
                  type="time"
                  value={
                    isEditing
                      ? formData.break_end_time || ""
                      : restaurant?.break_end_time || ""
                  }
                  onChange={(e) =>
                    handleInputChange("break_end_time", e.target.value)
                  }
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>

              <div className="text-xs text-muted-foreground">
                {!restaurant?.break_start_time && !restaurant?.break_end_time
                  ? "브레이크 타임이 설정되지 않았습니다."
                  : `현재 브레이크 타임: ${
                      restaurant?.break_start_time || "미설정"
                    } ~ ${restaurant?.break_end_time || "미설정"}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">시스템 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>레스토랑 ID</Label>
                <Input
                  value={restaurant?.id || ""}
                  disabled
                  className="bg-gray-50 font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>생성일</Label>
                <Input
                  value={
                    restaurant?.created_at
                      ? new Date(restaurant.created_at).toLocaleString()
                      : ""
                  }
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 추가 설정 안내 */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">추가 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              현재 API에서는 브레이크 타임만 수정할 수 있습니다. 레스토랑 이름,
              운영시간 등 다른 설정을 수정하려면 추가 API가 필요합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
