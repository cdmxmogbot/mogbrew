import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import '../styles.css';

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
      { title: 'MOGBREW' },
      { name: 'theme-color', content: '#09090b' },
    ],
  }),
  component: RootComponent,
});

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        <Link
          to="/"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === '/' ? 'text-green-500' : 'text-zinc-400'
          }`}
        >
          <span className="text-2xl">🍺</span>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          to="/insights"
          className={`flex flex-col items-center justify-center w-full h-full ${
            pathname === '/insights' ? 'text-green-500' : 'text-zinc-400'
          }`}
        >
          <span className="text-2xl">📊</span>
          <span className="text-xs mt-1">Insights</span>
        </Link>
      </div>
    </nav>
  );
}

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen pb-20">
        <Outlet />
        <BottomNav />
        <Scripts />
      </body>
    </html>
  );
}
