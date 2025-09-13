import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

import { OrderConfirmDialog } from "@/components/Menu/OrderConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateKioskOrder } from "@/hooks/useOrder";
import type { CartItem } from "@/types/cart";
import { PhoneInputDialog } from "./PhoneInputDialog";
import { getPaymentUrl } from "@/utils/payment";
import { OrderWithPaymentInfo } from "@/client";

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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
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
      setIsPaymentDialogOpen(true);
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
        onConfirm={() => setIsPhoneInputDialogOpen(true)}
        isSubmitting={createOrder.isPending}
      />

      <PhoneInputDialog
        open={isPhoneInputDialogOpen}
        onOpenChange={setIsPhoneInputDialogOpen}
        onConfirm={(phone) => handleConfirmOrder(phone)}
        onCancel={() => setIsOrderDialogOpen(true)}
        isSubmitting={false}
      />

      <Dialog open={isPaymentDialogOpen}>
        {/* show qr code */}
        <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] bg-white flex flex-col">
          <DialogHeader className="bg-gray-50 -m-6 p-6 mb-0 rounded-t-lg flex-shrink-0">
            <DialogTitle className="text-gray-900">결제</DialogTitle>
            <DialogDescription className="text-gray-600">
              QR 코드를 스캔하거나 화면의 계좌번호로 입금해주세요.
            </DialogDescription>
            <DialogTrigger />
          </DialogHeader>

          {order && (
            <div className="flex flex-col flex-1 min-h-0 space-y-4">
              {/* 계좌 정보 */}
              <div className="p-4 space-y-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">은행</span>
                  <span className="font-medium text-gray-900">
                    {order.payment_info.bank_name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">계좌번호</span>
                  <span className="font-medium text-gray-900">
                    {order.payment_info.bank_account_no}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-900">입금액</span>
                    <span className="text-lg text-blue-600">
                      {order.final_price.toLocaleString()}원
                    </span>
                  </div>
                  <p className="text-right text-xs text-gray-500">
                    ({order.total_price - order.final_price}원 할인해드렸어요!)
                  </p>
                </div>
              </div>

              {/* QR코드 */}
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={encodeURI(getPaymentUrl(order))}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
