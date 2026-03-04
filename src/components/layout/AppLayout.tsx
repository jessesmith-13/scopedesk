import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Workflow, 
  Mail, 
  FileText, 
  Receipt, 
  Users, 
  FolderOpen,
  BarChart3,
  MessageSquare,
  Settings,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { path: '/', label: 'Lead Discovery', icon: LayoutDashboard, section: 'main' },
  { path: '/pipeline', label: 'CRM Pipeline', icon: Workflow, section: 'main' },
  { path: '/email', label: 'Email Center', icon: Mail, section: 'main', badge: 3 },
  { path: '/proposals', label: 'Proposals', icon: FileText, section: 'main' },
  { path: '/invoices', label: 'Invoices', icon: Receipt, section: 'main' },
  { path: '/contacts', label: 'Contacts', icon: Users, section: 'main' },
  { path: '/documents', label: 'Documents', icon: FolderOpen, section: 'main' },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, section: 'bottom' },
  { path: '/templates', label: 'Templates', icon: MessageSquare, section: 'bottom' },
  { path: '/settings', label: 'Settings', icon: Settings, section: 'bottom' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  const mainNavItems = navigationItems.filter(item => item.section === 'main');
  const bottomNavItems = navigationItems.filter(item => item.section === 'bottom');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Freelance CRM</h1>
          <p className="text-xs text-gray-500 mt-1">Local Business Outreach</p>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
            
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User Avatar Placeholder */}
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">JD</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}