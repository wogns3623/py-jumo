import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/Menu";

export const Route = createFileRoute("/menus")({
  component: MenuPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      table: (search.table as string) || null,
    };
  },
});
