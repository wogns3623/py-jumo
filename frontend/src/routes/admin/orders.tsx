import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/orders")({
  component: () => <div>Hello /admin/orders!</div>,
});
