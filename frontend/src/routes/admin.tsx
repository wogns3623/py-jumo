import { AdminSidebar } from "@/components/Admin/Sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

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
    <SidebarProvider>
      <AdminSidebar />

      <SidebarInset>
        <header></header>

        <main className="w-full min-h-screen bg-[#F3EFE7] flex-col items-center justify-center">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  ),
});
