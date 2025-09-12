import { createFileRoute } from "@tanstack/react-router";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";

export const Route = createFileRoute("/admin/orders")({
  component: Page,
});

function Page() {
  return (
    <>
      <AdminSidebarHeader title={"주문 관리"} />
      <div className="flex flex-1 flex-col"></div>
    </>
  );
}
