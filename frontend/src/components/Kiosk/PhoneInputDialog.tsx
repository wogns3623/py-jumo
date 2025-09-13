import { useEffect, useRef, useState } from "react";

import { ConfirmModal } from "@/components/shared/Modal";

interface PhoneInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (phone: string) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function PhoneInputDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PhoneInputDialogProps) {
  const [phone, setPhone] = useState("");
  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (!prevOpenRef.current && open) setPhone("");
    prevOpenRef.current = open;
  }, [open]);

  const handleConfirm = (phone: string) => {
    onConfirm(phone);
    onOpenChange(false);
  };

  return (
    <ConfirmModal
      title="전화번호 입력"
      titleDescription="전화번호를 입력해주시면 조리 후 알림을 드립니다."
      open={open}
      onOpenChange={onOpenChange}
      confirm={{ text: "주문하기", onClick: () => handleConfirm(phone) }}
      cancel={{
        text: "돌아가기",
        onClick: onCancel,
      }}
    >
      <div className="flex flex-col flex-1 min-h-0 space-y-4">
        <div className="flex flex-col items-center justify-center flex-1">
          <input
            type="text"
            className="w-3/4 border border-gray-300 rounded-md p-2 text-center text-2xl mb-4"
            placeholder="전화번호 입력"
            disabled={isSubmitting}
            value={phone}
            readOnly
          />
          <div className="grid grid-cols-3 gap-4 w-3/4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "초기화", 0, "<-"].map((num) => {
              if (num === "초기화") {
                return (
                  <button
                    key={num}
                    className="bg-red-200 rounded-full h-16 flex items-center justify-center text-lg hover:bg-red-300"
                    disabled={isSubmitting}
                    onClick={() => setPhone("")}
                  >
                    {num}
                  </button>
                );
              }
              if (num === "<-") {
                return (
                  <button
                    key={num}
                    className="bg-yellow-200 rounded-full h-16 flex items-center justify-center text-lg hover:bg-yellow-300"
                    disabled={isSubmitting}
                    onClick={() =>
                      setPhone((prev) => prev.slice(0, prev.length - 1))
                    }
                  >
                    {num}
                  </button>
                );
              }
              return (
                <button
                  key={num}
                  className="bg-gray-200 rounded-full h-16 flex items-center justify-center text-2xl hover:bg-gray-300"
                  disabled={isSubmitting}
                  onClick={() => setPhone((prev) => prev + num)}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
}
