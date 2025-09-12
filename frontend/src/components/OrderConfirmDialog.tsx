import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { QuantityControl, MenuImage } from "@/components/shared";
import type { CartItem } from "@/types/cart";

interface OrderConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  onConfirmOrder: () => void;
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
    <div className="flex items-start gap-3 py-2 px-3 bg-gray-50 rounded-lg border border-gray-100">
      {/* 메뉴 이미지 - 더 컴팩트한 크기 */}
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

      {/* 메뉴 정보 */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-900 truncate">
          {item.menu.name}
        </h4>
        <p className="text-xs text-gray-600 mt-0.5 w-36 break-keep">
          {item.menu.desc}
        </p>
        <div className="flex items-center justify-between mt-2">
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
    </div>
  );
}

export function OrderConfirmDialog({
  open,
  onOpenChange,
  cart,
  onCartChange,
  onConfirmOrder,
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
  const handleConfirmOrder = () => {
    onConfirmOrder();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] max-h-[90vh] bg-white flex flex-col">
        <DialogHeader className="bg-gray-50 -m-6 p-6 mb-0 rounded-t-lg flex-shrink-0">
          <DialogTitle className="text-gray-900">주문 확인</DialogTitle>
          <DialogDescription className="text-gray-600">
            선택하신 메뉴를 확인하고 주문을 완료해주세요.
          </DialogDescription>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mx-6 my-4">
            장바구니가 비어있습니다.
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* 주문 목록 */}
            <ScrollArea className="h-96">
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

            <Separator className="bg-gray-200" />

            {/* 주문 요약 */}
            <div className="space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex-shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">총 수량</span>
                <span className="font-medium text-gray-900">
                  {totalItems}개
                </span>
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

        <DialogFooter className="gap-2 bg-gray-50 -m-6 p-6 mt-0 rounded-b-lg flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="bg-white hover:bg-gray-50"
          >
            돌아가기
          </Button>
          <Button
            onClick={handleConfirmOrder}
            disabled={cart.length === 0 || isSubmitting}
            className="min-w-[100px] bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "주문 중..." : "주문하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
