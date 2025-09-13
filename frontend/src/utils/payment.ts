import { OrderWithPaymentInfo } from "@/client";
import { toast } from "sonner";

export function getPaymentUrl(order: OrderWithPaymentInfo) {
  return `supertoss://send?amount=${order.final_price}&bank=${order.payment_info.bank_name}&accountNo=${order.payment_info.bank_account_no}&origin=qr`;
}

export function requestPayment(order: OrderWithPaymentInfo) {
  const paymentUrl = getPaymentUrl(order);

  setTimeout(() => {
    document.execCommand(
      "copy",
      false,
      `${order.payment_info.bank_name} ${order.payment_info.bank_account_no} ${order.final_price}원`
    );
    toast.success(
      "계좌번호 복사 완료! 이체 앱으로 이동하여 결제를 완료해주세요."
    );
  }, 100);

  window.location.href = paymentUrl;
}
