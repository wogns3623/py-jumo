import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/waitings")({
  component: () => <div>Hello /admin/waitings!</div>,
});
