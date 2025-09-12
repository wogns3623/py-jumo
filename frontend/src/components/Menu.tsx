import { useSearch } from "@tanstack/react-router";
import { Fragment, Suspense, useCallback, useEffect, useState } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useLocalStorage } from "usehooks-ts";

import type { Menus, OrderWithPaymentInfo } from "@/client";
import { OrderConfirmDialog } from "@/components/OrderConfirmDialog";
import { MenuImage, QuantityControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMenusSuspense } from "@/hooks/useMenu";
import { useCreateOrder } from "@/hooks/useOrder";
import { useTeamOrders, useTeamOrdersInvalidate } from "@/hooks/useTeam";
import { useTeamInitialization } from "@/hooks/useTeamInitialization";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

// 메뉴 카드 컴포넌트
function MenuCard({
  menu,
  quantity,
  onQuantityChange,
}: {
  menu: Menus;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  return (
    <Card
      className={cn(
        "w-full bg-[#F5F7F6] rounded-2xl border-none text-black",
        menu.no_stock && "opacity-50"
      )}
    >
      <CardContent className="p-0">
        {/* 메뉴 이미지 영역 */}
        <div className="w-full h-[120px] bg-gray-300 opacity-80 rounded-t-2xl overflow-hidden">
          {menu.image ? (
            <MenuImage
              src={menu.image}
              alt={menu.name}
              bgColor={menu.bg_color || undefined}
              useEdgeBackground={false} // true: 생성된 배경, false: 단일 색상
              objectFit="contain"
            />
          ) : (
            <div className="w-full h-full bg-gray-300" />
          )}
        </div>

        {/* 메뉴 정보 */}
        <div className="px-4 py-3">
          <h3 className="text-base font-bold font-inter text-black mb-1">
            {menu.name}
          </h3>
          <p className="text-sm font-normal font-inter text-black mb-2 truncate">
            {menu.desc}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-inter text-black/70">
              {menu.price.toLocaleString()} ₩
            </span>

            {menu.no_stock ? (
              <Badge variant="destructive" className="text-sm font-semibold">
                품절
              </Badge>
            ) : (
              <QuantityControl
                quantity={quantity}
                onIncrease={() => onQuantityChange(quantity + 1)}
                onDecrease={() => onQuantityChange(Math.max(0, quantity - 1))}
                size="md"
                className="gap-0"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 메뉴 섹션 컴포넌트
function MenuSection({
  title,
  menus,
  cart,
  onCartChange,
  className,
}: {
  title: string;
  menus: Menus[];
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  className?: string;
}) {
  const updateQuantity = (menuId: string, newQuantity: number) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;

    let newCart = [...cart];
    const existingItemIndex = newCart.findIndex(
      (item) => item.menuId === menuId
    );

    if (newQuantity === 0) {
      // 수량이 0이면 장바구니에서 제거
      if (existingItemIndex >= 0) {
        newCart.splice(existingItemIndex, 1);
      }
    } else {
      // 수량 업데이트 또는 새 아이템 추가
      if (existingItemIndex >= 0) {
        newCart[existingItemIndex].quantity = newQuantity;
      } else {
        newCart.push({ menuId, menu, quantity: newQuantity });
      }
    }

    onCartChange(newCart);
  };

  return (
    <div className={cn("w-full bg-white rounded-xl p-2 mb-3", className)}>
      <h2 className="text-2xl font-black font-inter mb-2 pl-2">{title}</h2>

      <div className="flex flex-col gap-3">
        {menus.map((menu) => {
          const cartItem = cart.find((item) => item.menuId === menu.id);
          const quantity = cartItem?.quantity || 0;

          return (
            <MenuCard
              key={menu.id}
              menu={menu}
              quantity={quantity}
              onQuantityChange={(newQuantity) =>
                updateQuantity(menu.id!, newQuantity)
              }
            />
          );
        })}
      </div>
    </div>
  );
}

function MenuPageInner({ teamId }: { teamId: string | null }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useLocalStorage<CartItem[]>("cart", []);

  // 메뉴를 카테고리별로 분류 (임시로 메인메뉴와 음료수로 구분)
  const menuGroups = [
    {
      title: "선착순",
      items: menus.filter((menu) => menu.category === "선착순"),
      className: "bg-[#FF7171] text-white",
    },
    {
      title: "메인메뉴",
      items: menus.filter((menu) => menu.category === "메인메뉴"),
    },
    {
      title: "뚱캔들과 생명수",
      items: menus.filter((menu) => menu.category === "뚱캔들과 생명수"),
    },
  ];

  return (
    <Fragment>
      {/* 메뉴 섹션들 */}
      <div className="max-w-md mx-auto px-2">
        <div className="flex flex-col gap-0">
          {menuGroups.map((group) => (
            <MenuSection
              key={group.title}
              title={group.title}
              menus={group.items}
              cart={cart}
              onCartChange={setCart}
              className={group.className || ""}
            />
          ))}
        </div>

        {/*  */}
        <div>
          <img
            src="/assets/images/menu_bottom.png"
            alt="Bottom Decoration"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 하단 주문 바 */}
      {teamId && (
        <OrderBottomBar teamId={teamId} cart={cart} setCart={setCart} />
      )}
    </Fragment>
  );
}

export function MenuPage() {
  const { table } = useSearch({ from: "/menus" });

  const { teamId, isInitialized, isCreatingTeam, createTeamError } =
    useTeamInitialization(table);

  const onLoadComponent = (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">로딩 중...</h2>
      <p>메뉴를 불러오고 있습니다...</p>
    </div>
  );

  // 로딩 상태
  if (!isInitialized || isCreatingTeam) {
    return onLoadComponent;
  }

  // 테이블 ID가 없는 경우
  if (createTeamError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">잘못된 접근입니다</h2>
        <p>QR 코드를 통해 접근해주세요.</p>
      </div>
    );
  }

  return (
    <Fragment>
      {/* 헤더 영역 */}
      <div className="w-full bg-gray-300 opacity-80 rounded-b-2xl overflow-hidden mb-4">
        <img
          src="/assets/images/menu_header.png"
          alt="Header Image"
          className="w-full h-full object-contain"
        />
      </div>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ error, resetErrorBoundary }) => {
              return (
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-xl font-semibold text-red-500">
                    오류가 발생했습니다
                  </h2>

                  <p className="text-red-500">
                    메뉴 로딩 실패: {error?.message}
                  </p>

                  <Button onClick={() => resetErrorBoundary()}>재시도</Button>
                </div>
              );
            }}
          >
            <Suspense fallback={onLoadComponent}>
              <MenuPageInner teamId={teamId} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </Fragment>
  );
}

function OrderBottomBar({
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
    if (!storedLastOrder) {
      setStoredLastOrder(lastOrder);
      return;
    }

    if (storedLastOrder.id !== lastOrder.id) return;
    if (storedLastOrder.status === lastOrder.status) return;
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
  }, [lastOrder, storedLastOrder]);

  useEffect(() => {
    if (!orders.data) return;

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
        teamId={teamId}
        order={lastOrder as OrderWithPaymentInfo}
      />
    );
  }

  return (
    <ConfirmOrderBottomBar teamId={teamId} cart={cart} setCart={setCart} />
  );
}

function LastOrderPaymentInfoBottomBar({
  teamId,
  order,
}: {
  teamId: string;
  order: OrderWithPaymentInfo;
}) {
  const openPaymentUrl = useCallback(() => {
    const paymentUrl = `supertoss://send?amount=${order.final_price}&bank=${order.payment_info.bank_name}&accountNo=${order.payment_info.bank_account_no}&origin=qr`;
    window.location.href = paymentUrl;

    document.execCommand(
      "copy",
      false,
      `${order.payment_info.bank_name} ${order.payment_info.bank_account_no} ${order.final_price}원`
    );
    toast.success(
      "계좌번호 복사 완료! 이체 앱으로 이동하여 결제를 완료해주세요."
    );
  }, [teamId, order.id]);

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
        {order.total_price != order.final_price && (
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
            onClick={openPaymentUrl}
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
        onConfirmOrder={handleConfirmOrder}
        isSubmitting={createOrder.isPending}
      />
    </div>
  );
}
