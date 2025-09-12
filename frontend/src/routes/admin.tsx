import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminSidebar } from "@/components/Admin/admin-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export const Route = createFileRoute("/admin")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      });
    }
  },
  component: () => (
    <>
      <AdminSidebar variant="inset" />

      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </>
  ),
});
