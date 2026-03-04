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

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Dashboard
  },
  {
    path: '/pipeline',
    Component: Pipeline
  },
  {
    path: '/email',
    Component: EmailCenter
  },
  {
    path: '/proposals',
    Component: Proposals
  },
  {
    path: '/invoices',
    Component: Invoices
  },
  {
    path: '/contacts',
    Component: Contacts
  },
  {
    path: '/documents',
    Component: Documents
  },
  {
    path: '/analytics',
    Component: Analytics
  },
  {
    path: '/templates',
    Component: Templates
  },
  {
    path: '/settings',
    Component: Settings
  }
]);
