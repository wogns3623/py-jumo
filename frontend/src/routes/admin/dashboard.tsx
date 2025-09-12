import { createFileRoute } from "@tanstack/react-router";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";

export const Route = createFileRoute("/admin/dashboard")({
  component: Page,
});

function Page() {
  return (
    <>
      <AdminSidebarHeader title={"대시보드"} />
      <div className="flex flex-1 flex-col"></div>
    </>
  );
}
