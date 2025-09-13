import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import { OrderWithPaymentInfo } from "@/client";
import { getPaymentUrl } from "@/utils/payment";
import { ConfirmModal } from "@/components/shared";
import { useCancelKioskOrder, useOrder } from "@/hooks/useOrder";
import { Button } from "@/components/ui/button";

export function PaymentAnnounceDialog({
  order,
  onConfirm,
  onCancel,
}: {
  order: OrderWithPaymentInfo;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"text" | "qr" | null>(
    null
  );

  const cancelOrder = useCancelKioskOrder();

  const orderStatus = useOrder(order.id, {
    refetchInterval: 2500,
  });

  useEffect(() => {
    if (!orderStatus.data) return;
    if (orderStatus.data.status === "paid") {
      onConfirm();
    }
  }, [orderStatus]);

  return (
    <ConfirmModal
      title="결제"
      titleDescription="QR 코드를 스캔하거나 화면의 계좌번호로 입금해주세요."
      open={true}
      cancel={
        paymentMethod === null
          ? {
              text: "취소하기",
              onClick: () => {
                setIsConfirmModalOpen(true);
              },
            }
          : { text: "돌아가기", onClick: () => setPaymentMethod(null) }
      }
    >
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        {!paymentMethod && (
          <div className="flex flex-col flex-1 items-center justify-center space-y-4">
            <Button
              className="w-full bg-blue-400 text-white hover:bg-blue-500"
              variant="default"
              onClick={() => setPaymentMethod("qr")}
            >
              토스로 결제할게요
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setPaymentMethod("text")}
            >
              계좌번호로 입금할게요
            </Button>
          </div>
        )}
        {paymentMethod === "text" && <PaymentInfoCard order={order} />}
        {paymentMethod === "qr" && <PaymentQRCode order={order} />}
      </div>

      <ConfirmModal
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        title={"정말 취소하시겠어요?"}
        confirm={{
          text: "네, 취소할게요",
          onClick: async () => {
            // order 취소처리
            await cancelOrder.mutateAsync(order.id);
            onCancel?.();
          },
        }}
        cancel={{ text: "아니요, 계속할게요" }}
      >
        <div>
          <p className="text-center">취소하시면 장바구니가 비워지고</p>
          <p className="text-center">처음부터 다시 주문하셔야 해요.</p>
        </div>
      </ConfirmModal>
    </ConfirmModal>
  );
}

function PaymentQRCode({ order }: { order: OrderWithPaymentInfo }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <QRCode
        size={256}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={encodeURI(getPaymentUrl(order))}
        viewBox={`0 0 256 256`}
      />
    </div>
  );
}

function PaymentInfoCard({ order }: { order: OrderWithPaymentInfo }) {
  return (
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
  );
}
