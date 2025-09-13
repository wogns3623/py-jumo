import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCountdown } from "usehooks-ts";

import { OrderWithPaymentInfo } from "@/client";
import { OrderConfirmDialog } from "@/components/Menu/OrderConfirmDialog";
import { Button } from "@/components/ui/button";
import { useCreateKioskOrder } from "@/hooks/useOrder";
import type { CartItem } from "@/types/cart";
import { PaymentAnnounceDialog } from "./PaymentAnnounceDialog";
import { PhoneInputDialog } from "./PhoneInputDialog";
import { ConfirmModal } from "../shared";

export function KioskOrderBottomBar({
  tableId,
  cart,
  setCart,
}: {
  tableId: string;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}) {
  return (
    <ConfirmOrderBottomBar tableId={tableId} cart={cart} setCart={setCart} />
  );
}

function ConfirmOrderBottomBar({
  tableId,
  cart,
  setCart,
}: {
  tableId: string;
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
}) {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isPhoneInputDialogOpen, setIsPhoneInputDialogOpen] = useState(false);
  const [isFinalConfirmOpen, setIsFinalConfirmOpen] = useState(false);
  const [order, setOrder] = useState<OrderWithPaymentInfo | null>(null);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menu.price * item.quantity,
    0
  );

  const createOrder = useCreateKioskOrder();

  const handleConfirmOrder = async (phone: string) => {
    try {
      const order = await createOrder.mutateAsync({
        table_id: tableId,
        phone,
        ordered_menus: cart.map((item) => ({
          menu_id: item.menuId,
          amount: item.quantity,
        })),
      });

      setCart([]);

      console.log("주문 및 결제 정보:", order);
      setOrder(order);
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

      <Button
        className="ml-2"
        size="sm"
        variant="ghost"
        disabled={totalItems === 0}
        onClick={() => setCart([])}
      >
        전체 취소
      </Button>

      {/* 주문 확인 다이얼로그 */}
      <OrderConfirmDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        cart={cart}
        onCartChange={setCart}
        onConfirm={() => setIsPhoneInputDialogOpen(true)}
      />

      <PhoneInputDialog
        open={isPhoneInputDialogOpen}
        onOpenChange={setIsPhoneInputDialogOpen}
        onConfirm={(phone) => handleConfirmOrder(phone)}
        onCancel={() => setIsOrderDialogOpen(true)}
        isSubmitting={createOrder.isPending}
      />

      {order && (
        <PaymentAnnounceDialog
          order={order}
          onConfirm={() => {
            setIsFinalConfirmOpen(true);
            setOrder(null);
          }}
          onCancel={() => {
            setOrder(null);
          }}
        />
      )}

      <FinalConfirmModal
        open={isFinalConfirmOpen}
        onOpenChange={setIsFinalConfirmOpen}
      />
    </div>
  );
}

function FinalConfirmModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [timer, controller] = useCountdown({
    countStart: 15,
    intervalMs: 1000,
  });

  useEffect(() => {
    if (open) controller.startCountdown();
  }, [open]);

  useEffect(() => {
    if (timer === 0) {
      controller.resetCountdown();
      controller.stopCountdown();
    }
  }, [timer]);

  return (
    <ConfirmModal
      title="결제 완료!"
      open={open}
      onOpenChange={onOpenChange}
      confirm={{ text: "확인" }}
    >
      <div className="flex flex-col items-center justify-center gap-4 py-4">
        <h2 className="text-lg font-semibold">결제가 완료되었습니다!</h2>
        <p className="text-center text-sm text-gray-600">
          조리가 완료되면 카카오 알림톡을 보내드려요!
        </p>

        <p className="text-center text-sm text-gray-600">
          창이 <span className="font-semibold">{timer}</span>초 후에 자동으로
          닫힙니다.
        </p>
      </div>
    </ConfirmModal>
  );
}
