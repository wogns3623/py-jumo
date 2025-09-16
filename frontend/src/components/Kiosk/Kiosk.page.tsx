import { useState } from "react";

import { useMenusSuspense } from "@/hooks/useMenu";
import type { CartItem } from "@/types/cart";
import { MenuSectionGroup } from "@/components/shared/MenuSectionGroup";
import { KioskOrderBottomBar } from "./KioskOrderBar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  InactiveContextProvider,
  useInactiveDetector,
} from "./inactive.context";

export function KioskPageInner({ tableId }: { tableId: string }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdOpen, setIsAdOpen] = useState(true);

  // 1분동안 사용자 조작이 없을 시 setIsAdOpen(true)
  const inactiveDetector = useInactiveDetector({
    idleTimeoutSecond: 60 * 1000,
    idleWarningTimeoutSecond: 45 * 1000,
    onIdle: () => {
      setCart([]);
      setIsAdOpen(true);
    },
    onWarningBeforeIdle: () => {
      toast.warning(
        "15초 뒤 광고 화면으로 되돌아갑니다. 만약 사용중이시라면 화면을 터치해주세요!",
        { duration: 15000 }
      );
    },
  });

  if (isAdOpen) {
    return (
      <Button
        variant="ghost"
        className="w-full h-screen px-2 flex flex-col justify-center space-y-8"
        onClick={() => setIsAdOpen(false)}
      >
        <img src="/assets/images/kiosk_ad.png" />

        <div className="w-full flex justify-center items-center">
          <h2 className="text-4xl">
            테이크아웃 키오스크를 여시려면 아무 곳이나 눌러주세요
          </h2>
        </div>
      </Button>
    );
  }

  return (
    <InactiveContextProvider detector={inactiveDetector}>
      <div className="w-full bg-gray-300 opacity-80 rounded-b-2xl overflow-hidden mb-4">
        <img
          src="/assets/images/menu_header.png"
          alt="Header Image"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="w-full flex justify-center p-4">
        <h2 className="text-6xl font-serif font-extrabold">테이크아웃</h2>
      </div>

      {/* 메뉴 섹션들 */}
      <MenuSectionGroup
        menus={menus}
        cart={cart}
        onCartChange={setCart}
        canOrder={true}
        showBottomImage={true}
      />

      {/* 하단 주문 바 */}
      <KioskOrderBottomBar tableId={tableId} cart={cart} setCart={setCart} />
    </InactiveContextProvider>
  );
}
