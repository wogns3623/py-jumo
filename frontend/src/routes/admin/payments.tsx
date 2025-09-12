import { createFileRoute } from "@tanstack/react-router";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";

export const Route = createFileRoute("/admin/payments")({
  component: Page,
});

function Page() {
  return (
    <>
      <AdminSidebarHeader title={"결제 관리"} />
      <div className="flex flex-1 flex-col"></div>
    </>
  );
}
