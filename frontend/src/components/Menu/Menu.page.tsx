import { Fragment } from "react";
import { useLocalStorage } from "usehooks-ts";

import { MenuSectionGroup } from "@/components/shared/MenuSectionGroup";
import { toast } from "@/components/ui/sonner";
import { useMenusSuspense } from "@/hooks/useMenu";
import type { CartItem } from "@/types/cart";
import { OrderBottomBar } from "./OrderBar";

export function MenuPageInner({ tableId }: { tableId: string | null }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useLocalStorage<CartItem[]>("cart", []);

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
      toast.error("Something went wrong!", {
        description: `${removedNames}이(가) 품절되어 장바구니에서 제거되었습니다.`,
      });
    }

    setCart(validCart);
  }

  return (
    <Fragment>
      {/* 메뉴 섹션들 */}
      <MenuSectionGroup
        menus={menus}
        cart={validCart}
        onCartChange={setCart}
        canOrder={tableId !== null}
        showBottomImage={true}
      />

      {/* 하단 주문 바 */}
      {tableId && (
        <OrderBottomBar tableId={tableId} cart={validCart} setCart={setCart} />
      )}
    </Fragment>
  );
}
