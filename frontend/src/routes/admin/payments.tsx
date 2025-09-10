import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/payments")({
  component: () => <div>Hello /admin/payments!</div>,
});
