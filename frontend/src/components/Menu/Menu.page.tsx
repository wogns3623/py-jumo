import { Fragment } from "react";
import { useLocalStorage } from "usehooks-ts";

import type { MenuPublic } from "@/client";
import { MenuImage, QuantityControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMenusSuspense } from "@/hooks/useMenu";
import useCustomToast from "@/hooks/useCustomToast";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import { OrderBottomBar } from "./OrderBar";

// 메뉴 카드 컴포넌트
export function MenuCard({
  menu,
  canOrder = true,
  quantity,
  onQuantityChange,
}: {
  menu: MenuPublic;
  canOrder: boolean;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}) {
  const { showErrorToast } = useCustomToast();

  const handleSoldOutClick = () => {
    showErrorToast(`${menu.name}은(는) 현재 품절입니다.`);
  };

  return (
    <Card
      className={cn(
        "p-0 w-full bg-[#F5F7F6] rounded-2xl border-none text-black relative transition-all duration-200",
        menu.no_stock && "bg-gray-100 cursor-not-allowed"
      )}
      onClick={menu.no_stock ? handleSoldOutClick : undefined}
    >
      <CardContent className="p-0">
        {/* 메뉴 이미지 영역 */}
        <div
          className={cn(
            "w-full h-[120px] bg-gray-300 opacity-80 rounded-t-2xl overflow-hidden relative",
            menu.no_stock && "opacity-40"
          )}
        >
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

          {/* 품절 오버레이 */}
          {menu.no_stock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-t-2xl">
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                SOLD OUT
              </div>
            </div>
          )}
        </div>

        {/* 메뉴 정보 */}
        <div className="px-4 py-3">
          <h3
            className={cn(
              "text-base font-bold font-inter mb-1",
              menu.no_stock ? "text-gray-500 line-through" : "text-black"
            )}
          >
            {menu.name}
          </h3>
          <p
            className={cn(
              "text-sm font-normal font-inter mb-2 truncate",
              menu.no_stock ? "text-gray-400" : "text-black"
            )}
          >
            {menu.desc}
          </p>

          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-bold font-inter",
                menu.no_stock ? "text-gray-400" : "text-black/70"
              )}
            >
              {menu.price.toLocaleString()} ₩
            </span>

            {menu.no_stock ? (
              <Badge
                variant="destructive"
                className="text-sm font-semibold bg-red-500 hover:bg-red-500"
              >
                품절
              </Badge>
            ) : (
              canOrder && (
                <QuantityControl
                  quantity={quantity}
                  onIncrease={() => onQuantityChange(quantity + 1)}
                  onDecrease={() => onQuantityChange(Math.max(0, quantity - 1))}
                  size="md"
                  className="gap-0"
                />
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 메뉴 섹션 컴포넌트
export function MenuSection({
  title,
  menus,
  canOrder = true,
  cart,
  onCartChange,
  className,
}: {
  title: string;
  menus: MenuPublic[];
  canOrder: boolean;
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  className?: string;
}) {
  const updateQuantity = (menuId: string, newQuantity: number) => {
    const menu = menus.find((m) => m.id === menuId);
    if (!menu) return;

    // 품절된 메뉴는 수량 변경 불가
    if (menu.no_stock) return;

    const newCart = [...cart];
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
              canOrder={canOrder}
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

export function MenuPageInner({ tableId }: { tableId: string | null }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useLocalStorage<CartItem[]>("cart", []);
  const { showErrorToast } = useCustomToast();

  // 품절된 메뉴를 장바구니에서 자동 제거
  const validCart = cart.filter((item) => {
    const menu = menus.find((m) => m.id === item.menuId);
    return menu && !menu.no_stock;
  });

  // 장바구니가 변경되었으면 업데이트 및 알림
  if (validCart.length !== cart.length) {
    const removedItems = cart.filter((item) => {
      const menu = menus.find((m) => m.id === item.menuId);
      return menu && menu.no_stock;
    });

    if (removedItems.length > 0) {
      const removedNames = removedItems
        .map((item) => item.menu.name)
        .join(", ");
      showErrorToast(
        `${removedNames}이(가) 품절되어 장바구니에서 제거되었습니다.`
      );
    }

    setCart(validCart);
  }

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
              canOrder={tableId !== null}
              cart={validCart}
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
      {tableId && (
        <OrderBottomBar tableId={tableId} cart={validCart} setCart={setCart} />
      )}
    </Fragment>
  );
}
