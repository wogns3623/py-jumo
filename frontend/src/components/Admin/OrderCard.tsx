import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, ShoppingCart } from "lucide-react";
import type { OrderPublic, OrderWithPaymentInfo } from "@/client/types.gen";
import {
  getOrderStatusText,
  getOrderStatusBadgeVariant,
  formatPrice,
  formatKoreanDateTime,
} from "@/utils/order";
import { MultipleGroupedMenuDisplay } from "./OrderMenuDisplay";

interface OrderCardProps {
  order: OrderPublic | OrderWithPaymentInfo;
  formatDateTime?: (dateString: string) => string;
  variant?: "simple" | "detailed";
  showDialog?: boolean;
}

export function OrderCard({
  order,
  formatDateTime = formatKoreanDateTime,
  variant = "simple",
  showDialog = true,
}: OrderCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const orderCard = (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
      <div className="space-y-1">
        <div className="text-sm font-medium">
          주문 #{order.no}
          {variant === "detailed" && (
            <span className="ml-2 text-muted-foreground">
              ({order.id.slice(-8)})
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {order.created_at
            ? formatDateTime(order.created_at)
            : "시간 정보 없음"}
        </div>
      </div>
      <Badge variant={getOrderStatusBadgeVariant(order.status)}>
        {getOrderStatusText(order.status)}
      </Badge>
    </div>
  );

  if (!showDialog) {
    return orderCard;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>{orderCard}</DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            주문 상세 정보 #{order.no}
            {variant === "detailed" && (
              <span className="ml-2 text-muted-foreground">
                ({order.id.slice(-8)})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-4 w-4" />
              {order.created_at
                ? formatDateTime(order.created_at)
                : "시간 정보 없음"}
              <Badge
                variant={getOrderStatusBadgeVariant(order.status)}
                className="ml-2"
              >
                {getOrderStatusText(order.status)}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* 주문 요약 정보 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    총 주문 금액:
                  </span>
                  <div className="text-lg font-bold">
                    {formatPrice(order.total_price)}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    최종 결제 금액:
                  </span>
                  <div className="text-lg font-bold">
                    {formatPrice(order.final_price)}
                  </div>
                  {order.total_price !== order.final_price && (
                    <div className="text-xs text-green-600">
                      ({order.total_price - order.final_price}원 할인)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 결제 정보 */}
            {order.payment && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">결제 정보</h4>
                <div className="text-sm space-y-1">
                  <div>결제 ID: {order.payment.id}</div>
                  <div>결제 금액: {formatPrice(order.payment.amount)}</div>
                  {order.payment.transaction_by && (
                    <div>입금자: {order.payment.transaction_by}</div>
                  )}
                  {order.payment.created_at && (
                    <div>
                      입금 시간: {formatDateTime(order.payment.created_at)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 결제 정보 (OrderWithPaymentInfo용) */}
            {"payment_info" in order && order.payment_info && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">결제 정보</h4>
                <div className="text-sm space-y-1">
                  <div>은행: {order.payment_info.bank_name}</div>
                  <div>계좌번호: {order.payment_info.bank_account_no}</div>
                  <div>입금 금액: {formatPrice(order.final_price)}</div>
                </div>
              </div>
            )}

            {/* 주문 메뉴 목록 */}
            <div className="space-y-3">
              <h4 className="font-medium">
                주문 메뉴 ({order.grouped_ordered_menus.length}종류)
              </h4>

              <MultipleGroupedMenuDisplay
                groupedOrderedMenus={order.grouped_ordered_menus}
                order={order as OrderWithPaymentInfo}
                variant="detailed"
                formatDateTime={formatDateTime}
              />
            </div>

            {/* 거부 사유 */}
            {order.reject_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">
                  주문 거부 사유
                </h4>
                <p className="text-red-700">{order.reject_reason}</p>
              </div>
            )}

            {/* 완료 시간 */}
            {order.finished_at && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">주문 완료</h4>
                <p className="text-green-700">
                  완료 시간: {formatDateTime(order.finished_at)}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
