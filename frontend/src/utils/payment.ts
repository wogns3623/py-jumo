import { OrderWithPaymentInfo } from "@/client";
import { toast } from "sonner";

export function getPaymentUrl(order: OrderWithPaymentInfo) {
  return `supertoss://send?amount=${order.final_price}&bank=${order.payment_info.bank_name}&accountNo=${order.payment_info.bank_account_no}&origin=qr`;
}

export function requestPayment(order: OrderWithPaymentInfo) {
  const paymentUrl = getPaymentUrl(order);

  const text = `${order.payment_info.bank_name} ${order.payment_info.bank_account_no} ${order.final_price}원`;

  copyToClipboard(text);
  navigator.clipboard.writeText(text);
  document.execCommand("copy", false, text);
  toast.success(
    "토스가 없으신가요? 대신 계좌번호가 복사되었으니 원하시는 이체 앱으로 이동하여 결제를 완료해주세요!",
    { duration: 10000 }
  );

  window.location.href = paymentUrl;
}

function isOS() {
  return navigator.userAgent.match(/ipad|iphone/i);
}

function copyToClipboard(text: string) {
  const textArea = document.createElement("textArea") as HTMLTextAreaElement;
  textArea.value = text;
  document.body.appendChild(textArea);

  var range;

  if (isOS()) {
    range = document.createRange();
    range.selectNodeContents(textArea);
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
    textArea.setSelectionRange(0, 999999);
  } else {
    textArea.select();
  }

  document.execCommand("copy");
  document.body.removeChild(textArea);
}
