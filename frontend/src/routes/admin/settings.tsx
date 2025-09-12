import { createFileRoute } from "@tanstack/react-router";

import { AdminSidebarHeader } from "@/components/Admin/admin-sidebar";

export const Route = createFileRoute("/admin/settings")({
  component: Page,
});

function Page() {
  return (
    <>
      <AdminSidebarHeader title={"설정"} />
      <div className="flex flex-1 flex-col"></div>
    </>
  );
}
