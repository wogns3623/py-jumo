import * as React from "react";

import { NavMain } from "@/components/ui/nav";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "대시보드",
      url: "/admin/dashboard",
    },
    {
      title: "메뉴 관리",
      url: "/admin/menus",
    },
    {
      title: "주문 관리",
      url: "/admin/orders",
    },
    {
      title: "결제 관리",
      url: "/admin/payments",
    },
    {
      title: "테이블 관리",
      url: "/admin/tables",
    },
    {
      title: "키오스크 열기",
      url: "/kiosk?table=70c60d6a-4f19-47ac-a218-b0cc30820c3c",
    },
    {
      title: "설정",
      url: "/admin/settings",
    },
  ],
};

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminSidebarHeader({ title }: { title: string }) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
