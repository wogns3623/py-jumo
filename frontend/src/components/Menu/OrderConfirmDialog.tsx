import { MenuImage, QuantityControl, ConfirmModal } from "@/components/shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/types/cart";

interface OrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// 주문 아이템 컴포넌트
function OrderItem({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-lg border border-gray-100 shadow-lg bg-accent p-2">
      <div className="flex items-start gap-3">
        <div className="h-16 w-36 bg-white rounded-lg">
          {item.menu.image && (
            <MenuImage
              src={item.menu.image}
              alt={item.menu.name}
              className="w-full h-full"
              bgColor={item.menu.bg_color || undefined}
              useEdgeBackground={false}
              objectFit="cover"
            />
          )}
        </div>
        <div>
          <h4 className="font-medium text-sm text-gray-900 truncate">
            {item.menu.name.split(" : ")[0]}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5 w-36 break-keep">
            {item.menu.desc}
          </p>
        </div>
      </div>

      <div className="w-full flex items-center justify-end gap-2">
        <span className="text-sm font-medium text-gray-900">
          {item.menu.price.toLocaleString()}원
        </span>
        <QuantityControl
          quantity={item.quantity}
          onIncrease={() => onQuantityChange(item.quantity + 1)}
          onDecrease={() => {
            if (item.quantity === 1) {
              onRemove();
            } else {
              onQuantityChange(item.quantity - 1);
            }
          }}
          size="sm"
        />
      </div>
    </div>
  );
}

export function OrderConfirmDialog({
  open,
  onOpenChange,
  cart,
  onCartChange,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: OrderConfirmDialogProps) {
  // 장바구니 총계 계산
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.menu.price * item.quantity,
    0
  );

  // 수량 변경 핸들러
  const updateQuantity = (menuId: string, newQuantity: number) => {
    const newCart = cart.map((item) =>
      item.menuId === menuId ? { ...item, quantity: newQuantity } : item
    );
    onCartChange(newCart);
  };

  // 아이템 제거 핸들러
  const removeItem = (menuId: string) => {
    const newCart = cart.filter((item) => item.menuId !== menuId);
    onCartChange(newCart);
  };

  // 주문 확인 핸들러
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (isSubmitting) return;
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <ConfirmModal
      title="주문 확인"
      titleDescription="선택하신 메뉴를 확인하고 주문을 완료해주세요."
      open={open}
      onOpenChange={onOpenChange}
      confirm={{ text: "주문하기", onClick: handleConfirm }}
      cancel={{ text: "돌아가기", onClick: handleCancel }}
      className="min-h-[80vh]"
    >
      {cart.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mx-6 my-4">
          장바구니가 비어있습니다.
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 space-y-4">
          {/* 주문 목록 */}
          <div className="flex-1 relative w-full h-full shadow-inner">
            <ScrollArea
              className="flex flex-col w-full h-full"
              style={{ position: "absolute" }}
            >
              <div className="space-y-2 w-full">
                {cart.map((item) => (
                  <OrderItem
                    key={item.menuId}
                    item={item}
                    onQuantityChange={(quantity) =>
                      updateQuantity(item.menuId, quantity)
                    }
                    onRemove={() => removeItem(item.menuId)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator className="bg-gray-200" />

          {/* 주문 요약 */}
          <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex-shrink-0">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">총 수량</span>
              <span className="font-medium text-gray-900">{totalItems}개</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-gray-900">총 금액</span>
              <span className="text-lg text-blue-600">
                {totalPrice.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>
      )}
    </ConfirmModal>
  );
}
