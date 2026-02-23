import { StartClient } from '@tanstack/react-start-client';
import { hydrateRoot } from 'react-dom/client';
import { getRouter } from './router';
import { ErrorBoundary, installGlobalErrorHandlers } from './components/ErrorBoundary';

installGlobalErrorHandlers();

const router = getRouter();

hydrateRoot(
  document,
  <ErrorBoundary>
    <StartClient router={router} />
  </ErrorBoundary>,
);
