import { createFileRoute } from "@tanstack/react-router";
import { MenuPage } from "@/components/Menu";

export const Route = createFileRoute("/menus")({
  component: Menus,
  validateSearch: (search?: { table?: string }) => {
    return {
      table: search?.table || null,
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
