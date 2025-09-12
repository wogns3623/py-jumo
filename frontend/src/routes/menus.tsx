import { MenuPage } from "@/components/Menu/MenuPage";
import { createFileRoute, SearchSchemaInput } from "@tanstack/react-router";

export const Route = createFileRoute("/menus")({
  component: Menus,
  validateSearch: (search: { table?: string } & SearchSchemaInput) => {
    return {
      table: search.table || null,
    };
  },
});

function Menus() {
  return (
    <div className="min-h-screen bg-[#F3EFE7] flex-col items-center justify-center">
      <MenuPage />
    </div>
  );
}
