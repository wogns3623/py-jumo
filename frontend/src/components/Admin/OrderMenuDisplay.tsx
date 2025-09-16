import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { AdminService } from "@/client";
import type {
  OrderedMenuGrouped,
  OrderedMenuPublic,
  OrderWithPaymentInfo,
  OrderedMenuStatus,
} from "@/client/types.gen";
import {
  getMenuStatusText,
  getMenuStatusBadgeVariant,
  formatPrice,
} from "@/utils/order";

interface OrderedMenuItemProps {
  orderedMenu: OrderedMenuPublic;
  index: number;
  order: OrderWithPaymentInfo;
  formatDateTime?: (dateString: string) => string;
  showActions?: boolean;
  onUpdateStatus?: (orderedMenuId: string, status: string) => void;
  onReject?: (orderedMenuId: string, reason: string) => void;
  isUpdating?: boolean;
}

export function OrderedMenuItem({
  orderedMenu,
  index,
  order,
  formatDateTime,
  showActions = false,
  onUpdateStatus,
  onReject,
  isUpdating = false,
}: OrderedMenuItemProps) {
  return (
    <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">#{index + 1}</span>
        <Badge
          variant={getMenuStatusBadgeVariant(orderedMenu.status)}
          className="text-xs"
        >
          {getMenuStatusText(orderedMenu.status)}
        </Badge>
        {orderedMenu.reject_reason && (
          <span className="text-destructive text-xs">
            ({orderedMenu.reject_reason})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {orderedMenu.served_at && formatDateTime && (
          <span className="text-xs text-muted-foreground mr-2">
            서빙: {formatDateTime(orderedMenu.served_at)}
          </span>
        )}

        {/* 개별 메뉴 상태 변경 버튼들 */}
        {showActions &&
          order.status !== "rejected" &&
          orderedMenu.status !== "rejected" &&
          orderedMenu.status !== "served" && (
            <div className="flex gap-1">
              {orderedMenu.status === "ordered" && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs px-1 py-0.5 h-auto font-medium"
                    onClick={() => onUpdateStatus?.(orderedMenu.id, "cooked")}
                    disabled={!order.payment || isUpdating}
                  >
                    {!order.payment ? "결제 대기중" : "조리완료"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs px-1 py-0.5 h-auto font-medium"
                    onClick={() => onReject?.(orderedMenu.id, "재료 부족")}
                    disabled={isUpdating}
                  >
                    거절
                  </Button>
                </>
              )}
              {orderedMenu.status === "cooked" && (
                <Button
                  size="sm"
                  variant="default"
                  className="text-xs px-1 py-0.5 h-auto font-medium"
                  onClick={() => onUpdateStatus?.(orderedMenu.id, "served")}
                  disabled={!order.payment || isUpdating}
                >
                  {!order.payment ? "결제 대기중" : "서빙완료"}
                </Button>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

interface GroupedMenuDisplayProps {
  groupedMenu: OrderedMenuGrouped;
  order: OrderWithPaymentInfo;
  variant?: "simple" | "detailed";
  showActions?: boolean;
  formatDateTime?: (dateString: string) => string;
}

export function GroupedMenuDisplay({
  groupedMenu,
  order,
  variant = "simple",
  showActions = false,
  formatDateTime,
}: GroupedMenuDisplayProps) {
  const queryClient = useQueryClient();

  // 주문 메뉴 상태 업데이트
  const updateMenuOrderMutation = useMutation({
    mutationFn: async ({
      orderedMenuId,
      status,
    }: {
      orderedMenuId: string;
      status: OrderedMenuStatus;
    }) => {
      return await AdminService.updateMenuOrder({
        orderedMenuId,
        requestBody: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success("메뉴 상태가 업데이트되었습니다.");
    },
    onError: (error) => {
      toast.error("메뉴 상태 업데이트에 실패했습니다.");
      console.error("Menu order update error:", error);
    },
  });

  // 주문 메뉴 거절
  const rejectMenuOrderMutation = useMutation({
    mutationFn: async ({
      orderedMenuId,
      reason,
    }: {
      orderedMenuId: string;
      reason: string;
    }) => {
      return await AdminService.rejectMenuOrder({
        orderedMenuId,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "tables"] });
      toast.success("메뉴가 거절되었습니다.");
    },
    onError: (error) => {
      toast.error("메뉴 거절에 실패했습니다.");
      console.error("Menu order reject error:", error);
    },
  });

  const handleUpdateStatus = (orderedMenuId: string, status: string) => {
    updateMenuOrderMutation.mutate({
      orderedMenuId,
      status: status as OrderedMenuStatus,
    });
  };

  const handleReject = (orderedMenuId: string, reason: string) => {
    rejectMenuOrderMutation.mutate({
      orderedMenuId,
      reason,
    });
  };
  return (
    <div
      className={
        variant === "detailed"
          ? "border rounded-lg p-4"
          : "bg-white rounded border p-3"
      }
    >
      {/* 메뉴 헤더 */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="font-medium text-sm">{groupedMenu.menu.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              총 {groupedMenu.amount}개
              {(groupedMenu.cooked_count || 0) > 0 && (
                <span className="text-green-600 ml-1">
                  (조리완료: {groupedMenu.cooked_count || 0})
                </span>
              )}
            </span>
            <Badge
              variant={getMenuStatusBadgeVariant(groupedMenu.status)}
              className="text-xs"
            >
              {getMenuStatusText(groupedMenu.status)}
            </Badge>
          </div>
        </div>
        <span className="font-medium text-sm">
          {formatPrice(groupedMenu.menu.price * groupedMenu.amount)}
        </span>
      </div>

      {/* 메뉴 설명 (detailed variant에서만) */}
      {variant === "detailed" && groupedMenu.menu.desc && (
        <p className="text-sm text-muted-foreground mb-3">
          {groupedMenu.menu.desc}
        </p>
      )}

      {/* 개별 메뉴 아이템들 */}
      {(variant === "detailed" || groupedMenu.ordered_menus.length > 1) && (
        <div className="space-y-1 pl-2 border-l-2 border-gray-200">
          {groupedMenu.ordered_menus.map((orderedMenu, index) => (
            <OrderedMenuItem
              key={orderedMenu.id}
              orderedMenu={orderedMenu}
              index={index}
              order={order}
              formatDateTime={formatDateTime}
              showActions={showActions}
              onUpdateStatus={handleUpdateStatus}
              onReject={handleReject}
              isUpdating={
                updateMenuOrderMutation.isPending ||
                rejectMenuOrderMutation.isPending
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface MultipleGroupedMenuDisplayProps {
  groupedOrderedMenus: OrderedMenuGrouped[];
  order: OrderWithPaymentInfo;
  variant?: "simple" | "detailed";
  formatDateTime?: (dateString: string) => string;
}

export function MultipleGroupedMenuDisplay({
  groupedOrderedMenus,
  order,
  variant = "simple",
  formatDateTime,
}: MultipleGroupedMenuDisplayProps) {
  return (
    <div className="space-y-2">
      {groupedOrderedMenus.map((groupedMenu) => (
        <GroupedMenuDisplay
          key={groupedMenu.menu.id}
          groupedMenu={groupedMenu}
          order={order}
          variant={variant}
          showActions={true}
          formatDateTime={formatDateTime}
        />
      ))}
    </div>
  );
}
