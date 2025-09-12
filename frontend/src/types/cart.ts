import type { Menus } from "@/client";

export interface CartItem {
  menuId: string;
  menu: Menus;
  quantity: number;
}
