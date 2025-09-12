import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  loader: () => {
    return redirect({ to: "/admin/dashboard" });
  },
});
