import { KioskPageInner } from "@/components/Kiosk/Kiosk.page";
import { Button } from "@/components/ui/button";
import { uuidRegex } from "@/hooks/useTableSession";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import {
  createFileRoute,
  redirect,
  SearchSchemaInput,
  useSearch,
} from "@tanstack/react-router";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/kiosk")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: KioskPage,
  validateSearch: (search: { table?: string } & SearchSchemaInput) => {
    return { table: search.table || null };
  },
});

function KioskPage() {
  const { table: tableId } = useSearch({ from: "/kiosk" });

  const onLoadComponent = (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">로딩 중...</h2>
      <p>메뉴를 불러오고 있습니다...</p>
    </div>
  );

  // 테이블 ID가 없는 경우
  if (tableId === null || !uuidRegex.test(tableId)) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">잘못된 접근입니다</h2>
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
              <KioskPageInner tableId={tableId} />
            </Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    </div>
  );
}
