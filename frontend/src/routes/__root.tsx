import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React, { Suspense } from "react";

import NotFound from "@/components/Common/NotFound";
import { AuthState } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

interface MyRouterContext {
  auth: AuthState;
}

const loadDevtools = () =>
  Promise.all([
    import("@tanstack/router-devtools"),
    import("@tanstack/react-query-devtools"),
  ]).then(([routerDevtools, reactQueryDevtools]) => {
    return {
      default: () => (
        <>
          <routerDevtools.TanStackRouterDevtools />
          <reactQueryDevtools.ReactQueryDevtools />
        </>
      ),
    };
  });

const TanStackDevtools =
  process.env.NODE_ENV === "production" ? () => null : React.lazy(loadDevtools);

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: () => (
    <>
      <Outlet />
      {/* <Suspense>
        <TanStackDevtools />
      </Suspense> */}
      <Toaster position="top-center" />
    </>
  ),
  notFoundComponent: () => <NotFound />,
});
