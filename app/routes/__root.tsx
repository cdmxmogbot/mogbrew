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
import { UserProvider, useUser } from '~/lib/user-context';
import { UserPicker, UserChip } from '~/components/UserPicker';

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

  const tabs = [
    { to: '/', icon: '🍺', label: 'Home' },
    { to: '/history', icon: '📅', label: 'History' },
    { to: '/insights', icon: '📊', label: 'Insights' },
    { to: '/leaderboard', icon: '🏆', label: 'Board' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === tab.to ? 'text-green-500' : 'text-zinc-400'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs mt-0.5">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-800 z-40 safe-area-pt">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold">🍺 MOGBREW</h1>
        <UserChip />
      </div>
    </header>
  );
}

function AppContent() {
  const { showPicker } = useUser();

  if (showPicker) {
    return <UserPicker />;
  }

  return (
    <>
      <Header />
      <div className="pt-14 pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

function RootComponent() {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen">
        <UserProvider>
          <AppContent />
        </UserProvider>
        <Scripts />
      </body>
    </html>
  );
}
