import { Fragment } from "react";
import { useLocalStorage } from "usehooks-ts";

import type { Menus } from "@/client";
import { MenuImage, QuantityControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMenusSuspense } from "@/hooks/useMenu";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";
import { OrderBottomBar } from "./OrderBar";

// 메뉴 카드 컴포넌트
export function MenuCard({
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
export function MenuSection({
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

export function MenuPageInner({ teamId }: { teamId: string | null }) {
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
