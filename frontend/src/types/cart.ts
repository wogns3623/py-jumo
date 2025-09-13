import type { MenuPublic } from "@/client";

export interface CartItem {
  menuId: string;
  menu: MenuPublic;
  quantity: number;
}
