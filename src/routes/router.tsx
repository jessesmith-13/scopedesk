import { createBrowserRouter } from 'react-router';
import Dashboard from '@/pages/Dashboard';
import Analytics from '@/pages/Analytics';
import Templates from '@/pages/Templates';
import Pipeline from '@/pages/Pipeline';
import EmailCenter from '@/pages/EmailCenter';
import Proposals from '@/pages/Proposals';
import Invoices from '@/pages/Invoices';
import Contacts from '@/pages/Contacts';
import Documents from '@/pages/Documents';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/pipeline',
    element: (
      <ProtectedRoute>
        <Pipeline />
      </ProtectedRoute>
    )
  },
  {
    path: '/email',
    element: (
      <ProtectedRoute>
        <EmailCenter />
      </ProtectedRoute>
    )
  },
  {
    path: '/proposals',
    element: (
      <ProtectedRoute>
        <Proposals />
      </ProtectedRoute>
    )
  },
  {
    path: '/invoices',
    element: (
      <ProtectedRoute>
        <Invoices />
      </ProtectedRoute>
    )
  },
  {
    path: '/contacts',
    element: (
      <ProtectedRoute>
        <Contacts />
      </ProtectedRoute>
    )
  },
  {
    path: '/documents',
    element: (
      <ProtectedRoute>
        <Documents />
      </ProtectedRoute>
    )
  },
  {
    path: '/analytics',
    element: (
      <ProtectedRoute>
        <Analytics />
      </ProtectedRoute>
    )
  },
  {
    path: '/templates',
    element: (
      <ProtectedRoute>
        <Templates />
      </ProtectedRoute>
    )
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    )
  }
]);