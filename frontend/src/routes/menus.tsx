import { MenuPageInner } from "@/components/Menu/Menu.page";
import { Button } from "@/components/ui/button";
import { useTeamInitialization } from "@/hooks/useTeamInitialization";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import {
  createFileRoute,
  SearchSchemaInput,
  useSearch,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/menus")({
  component: MenuPage,
  validateSearch: (search: { table?: string } & SearchSchemaInput) => {
    return {
      table: search.table || null,
    };
  },
});

function MenuPage() {
  const { table } = useSearch({ from: "/menus" });

  const { teamId, isInitialized, isCreatingTeam, createTeamError } =
    useTeamInitialization(table);

  const onLoadComponent = (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">로딩 중...</h2>
      <p>메뉴를 불러오고 있습니다...</p>
    </div>
  );

  // 로딩 상태
  if (!isInitialized || isCreatingTeam) {
    return onLoadComponent;
  }

  // 테이블 ID가 없는 경우
  if (createTeamError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">잘못된 접근입니다</h2>
        <p>QR 코드를 통해 접근해주세요.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3EFE7] flex-col items-center justify-center">
      {/* 헤더 영역 */}
      <div className="w-full bg-gray-300 opacity-80 rounded-b-2xl overflow-hidden mb-4">
        <img
          src="/assets/images/menu_header.png"
          alt="Header Image"
          className="w-full h-full object-contain"
        />
      </div>

      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={reset}
            fallbackRender={({ error, resetErrorBoundary }) => {
              return (
                <div className="flex flex-col items-center gap-4">
                  <h2 className="text-xl font-semibold text-red-500">
                    오류가 발생했습니다
                  </h2>

                  <p className="text-red-500">
                    메뉴 로딩 실패: {error?.message}
                  </p>

                  <Button onClick={() => resetErrorBoundary()}>재시도</Button>
                </div>
              );
            }}
          >
            <Suspense fallback={onLoadComponent}>
              <MenuPageInner teamId={teamId} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}
