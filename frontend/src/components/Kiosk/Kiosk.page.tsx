import { Fragment, useEffect, useState } from "react";

import { useMenusSuspense } from "@/hooks/useMenu";
import type { CartItem } from "@/types/cart";
import { MenuSection } from "../Menu/Menu.page";
import { KioskOrderBottomBar } from "./KioskOrderBar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import {
  InactiveContextProvider,
  useInactiveDectector,
} from "./inactive.context";

export function KioskPageInner({ tableId }: { tableId: string }) {
  const { data: menus } = useMenusSuspense();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAdOpen, setIsAdOpen] = useState(true);

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

  // 1분동안 사용자 조작이 없을 시 setIsAdOpen(true)
  const inactiveDetector = useInactiveDectector({
    idleTimeoutSecond: 60 * 1000,
    idleWarningTimeoutSecond: 45 * 1000,
    onIdle: () => setIsAdOpen(true),
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
    <InactiveContextProvider
      start={inactiveDetector.start}
      stop={inactiveDetector.stop}
    >
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
      <div className="max-w-md mx-auto px-2">
        <div className="flex flex-col gap-0">
          {menuGroups.map((group) => (
            <MenuSection
              key={group.title}
              title={group.title}
              menus={group.items}
              cart={cart}
              onCartChange={setCart}
              className={group.className}
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
    </InactiveContextProvider>
  );
}
