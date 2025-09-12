import { createFileRoute } from "@tanstack/react-router";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";

export const Route = createFileRoute("/admin/menus")({
  component: Page,
});

function Page() {
  return (
    <>
      <AdminSidebarHeader title={"메뉴 관리"} />
      <div className="flex flex-1 flex-col"></div>
    </>
  );
}
