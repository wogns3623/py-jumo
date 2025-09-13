import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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

  const handleConfirmOrder = (phone: string) => {
    onConfirm(phone);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (isSubmitting) return;
        if (!isOpen) onCancel?.();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] bg-white flex flex-col">
        <DialogHeader className="bg-gray-50 -m-6 p-6 mb-0 rounded-t-lg flex-shrink-0">
          <DialogTitle className="text-gray-900">전화번호 입력</DialogTitle>
          <DialogDescription className="text-gray-600">
            전화번호를 입력해주시면 조리 후 알림을 드립니다.
          </DialogDescription>
        </DialogHeader>

        {/* 전화번호 입력 UI 직접 구현, 3*4 버튼 배열 */}
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

        <DialogFooter className="gap-2 bg-gray-50 -m-6 p-6 mt-0 rounded-b-lg flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
            className="bg-white hover:bg-gray-50"
          >
            돌아가기
          </Button>

          <Button
            onClick={() => handleConfirmOrder(phone)}
            disabled={isSubmitting}
            className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "주문 중..." : "주문하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
