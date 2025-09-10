import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/menus")({
  component: () => <div>Hello /admin/menus!</div>,
});
