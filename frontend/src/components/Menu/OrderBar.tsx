import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

import type { OrderWithPaymentInfo } from "@/client";
import { OrderConfirmDialog } from "@/components/Menu/OrderConfirmDialog";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/hooks/useOrder";
import { useTeamOrders, useTeamOrdersInvalidate } from "@/hooks/useTeam";
import type { CartItem } from "@/types/cart";
import { requestPayment } from "@/utils/payment";

export function OrderBottomBar({
  teamId,
  cart,
  setCart,
}: {
  teamId: string;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}) {
  const orders = useTeamOrders(teamId);
  const [storedLastOrder, setStoredLastOrder] =
    useLocalStorage<OrderWithPaymentInfo | null>("last_order", null);
  const [lastOrder, setLastOrder] = useState<OrderWithPaymentInfo | null>(null);

  useEffect(() => {
    if (!lastOrder) return;
    if (!storedLastOrder || storedLastOrder.id !== lastOrder.id) {
      console.log("New lastOrder detected:", lastOrder.id);
      setStoredLastOrder(lastOrder);
      return;
    }

    if (storedLastOrder.status !== lastOrder.status) {
      console.log("lastOrder status changed:", lastOrder.status);

      if (lastOrder.status === "paid") {
        toast.success("결제가 완료되었습니다! 조리중입니다.");
      } else if (lastOrder.status === "finished") {
        toast.success("주문이 완료되었습니다! 맛있게 드세요.");
      } else if (lastOrder.status === "rejected") {
        toast.error(
          `주문이 거절되었습니다. 사유: ${lastOrder.reject_reason || "없음"}`
        );
      }
      setStoredLastOrder(lastOrder);
    }
  }, [lastOrder, storedLastOrder]);

  useEffect(() => {
    if (!orders.data) return;
    // console.log("Orders data updated:", orders.data);

    if (orders.data.length > 0) {
      setLastOrder(orders.data[0] as OrderWithPaymentInfo);
    } else {
      setLastOrder(null);
    }
  }, [orders.data]);

  if (orders.isLoading) return;

  if (lastOrder && lastOrder.status === "ordered" && lastOrder.payment_info) {
    // 결제 정보 보여줌
    return (
      <LastOrderPaymentInfoBottomBar
        order={lastOrder as OrderWithPaymentInfo}
      />
    );
  }

  return (
    <ConfirmOrderBottomBar teamId={teamId} cart={cart} setCart={setCart} />
  );
}

function LastOrderPaymentInfoBottomBar({
  order,
}: {
  order: OrderWithPaymentInfo;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full h-[73px] bg-white border-t border-gray-200 flex items-center px-4 z-10">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-sf-pro">주문 완료</span>
      </div>

      <div className="flex-1" />

      <div className="flex-col items-center gap-2">
        <span className="text-[15px] font-sf-pro">
          총 {order.final_price.toLocaleString()}원
        </span>
        {order.total_price !== order.final_price && (
          <p className="text-xs text-gray-500 mt-0.5">{`(${
            order.total_price - order.final_price
          }원 빼드렸어요!)`}</p>
        )}
      </div>

      {order.status === "ordered" ? (
        <>
          <Button
            className="ml-4"
            size="sm"
            variant="outline"
            onClick={() => requestPayment(order)}
          >
            이체하기
          </Button>
        </>
      ) : order.status === "paid" ? (
        <Button className="ml-4" size="sm" variant="outline" disabled>
          결제 완료! 조리중입니다
        </Button>
      ) : null}
    </div>
  );
}

function ConfirmOrderBottomBar({
  teamId,
  cart,
  setCart,
}: {
  teamId: string;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}) {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menu.price * item.quantity,
    0
  );

  const createOrder = useCreateOrder(teamId);
  const invalidateOrders = useTeamOrdersInvalidate(teamId);

  const handleConfirmOrder = async () => {
    try {
      const order = await createOrder.mutateAsync({
        ordered_menus: cart.map((item) => ({
          menu_id: item.menuId,
          amount: item.quantity,
        })),
      });

      setCart([]);

      console.log("주문 및 결제 정보:", order);
      invalidateOrders();
      toast.success("주문이 완료되었습니다!");
      requestPayment(order);
    } catch (error) {
      console.error("주문 실패:", error);
      toast.error("주문 처리 중 오류가 발생했습니다.");
    }
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full h-[73px] bg-white border-t border-gray-200 flex items-center px-4 z-10">
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-sf-pro">{totalItems}개</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <span className="text-[15px] font-sf-pro">
          총 {totalPrice.toLocaleString()}원
        </span>
      </div>

      <Button
        className="ml-4"
        size="sm"
        variant="outline"
        disabled={totalItems === 0}
        onClick={() => setIsOrderDialogOpen(true)}
      >
        주문하기
      </Button>

      {/* 주문 확인 다이얼로그 */}
      <OrderConfirmDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        cart={cart}
        onCartChange={setCart}
        onConfirm={handleConfirmOrder}
        isSubmitting={createOrder.isPending}
      />
    </div>
  );
}
