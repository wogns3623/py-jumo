import { Fragment, useState } from "react";

import { useMenusSuspense } from "@/hooks/useMenu";
import type { CartItem } from "@/types/cart";
import { MenuSection } from "../Menu/Menu.page";
import { KioskOrderBottomBar } from "./KioskOrderBar";

export function KioskPageInner({ tableId }: { tableId: string }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useState<CartItem[]>([]);

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

        <div>
          <img
            src="/assets/images/menu_bottom.png"
            alt="Bottom Decoration"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 하단 주문 바 */}
      <KioskOrderBottomBar tableId={tableId} cart={cart} setCart={setCart} />
    </Fragment>
  );
}
