import { useMemo } from "react";

import type { MenuPublic } from "@/client";
import { MenuImage, QuantityControl } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types/cart";

// 메뉴 카드 컴포넌트
function MenuCard({
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
  const handleSoldOutClick = () => {
    toast.error(`${menu.name}은(는) 현재 품절입니다.`);
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
              "text-sm font-normal font-inter mb-2",
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
function MenuSection({
  title,
  menus,
  canOrder = true,
  cart,
  onCartChange,
  className,
}: {
  title: string;
  menus: MenuPublic[];
  canOrder?: boolean;
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

// 카테고리 설정 (공통)
const categoryDesigns: Record<string, string> = {
  선착순: "bg-[#FF7171] text-white",
  "스페셜 메뉴": "bg-[#FEC702] text-white",
};

const categoryOrder = ["선착순", "스페셜 메뉴"];

// menuGroups 생성 로직 (공통)
export function createMenuGroups(menus: MenuPublic[]) {
  const groups: { title: string; items: MenuPublic[]; className?: string }[] =
    [];
  const categoryMap: Record<string, MenuPublic[]> = {};

  menus.forEach((menu) => {
    if (!menu.category) menu.category = "기타";
    if (!categoryMap[menu.category]) {
      categoryMap[menu.category] = [];
    }
    categoryMap[menu.category].push(menu);
  });

  // 미리 정의된 카테고리 순서대로 그룹화
  categoryOrder.forEach((category) => {
    if (categoryMap[category]) {
      groups.push({
        title: category,
        items: categoryMap[category],
        className: categoryDesigns[category] || undefined,
      });
      delete categoryMap[category]; // 이미 추가한 카테고리는 제거
    }
  });

  // 나머지 카테고리들은 뒤에 추가
  for (const category in categoryMap) {
    groups.push({
      title: category,
      items: categoryMap[category],
      className: categoryDesigns[category] || undefined,
    });
  }

  return groups;
}

interface MenuSectionGroupProps {
  menus: MenuPublic[];
  cart: CartItem[];
  onCartChange: (cart: CartItem[]) => void;
  canOrder?: boolean;
  showBottomImage?: boolean;
}

export function MenuSectionGroup({
  menus,
  cart,
  onCartChange,
  canOrder = true,
  showBottomImage = true,
}: MenuSectionGroupProps) {
  const menuGroups = useMemo(() => createMenuGroups(menus), [menus]);

  return (
    <div className="max-w-md mx-auto px-2">
      <div className="flex flex-col gap-0">
        {menuGroups.map((group) => (
          <MenuSection
            key={group.title}
            title={group.title}
            menus={group.items}
            canOrder={canOrder}
            cart={cart}
            onCartChange={onCartChange}
            className={group.className || ""}
          />
        ))}
      </div>

      {showBottomImage && (
        <div>
          <img
            src="/assets/images/menu_bottom.png"
            alt="Bottom Decoration"
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
