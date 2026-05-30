'use client';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import {
    BarChart3,
    CreditCard,
    FileCheck,
    FileText,
    LayoutDashboard,
    LogOut,
    MapPin,
    Menu,
    Plane,
    Settings,
    Users,
    X,
    UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const sidebarItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    name: 'Employee Access',
    href: ROUTES.EMPLOYEE_ACCESS,
    icon: UserCog,
    adminOnly: true,
  },
  {
    name: 'Tours',
    href: ROUTES.TOURS,
    icon: Plane,
  },
  {
    name: 'Bookings',
    href: ROUTES.BOOKINGS,
    icon: FileText,
  },
  {
    name: 'Travelers',
    href: ROUTES.TRAVELERS,
    icon: Users,
  },
  {
    name: 'Ops Payments',
    href: ROUTES.PAYMENTS,
    icon: CreditCard,
  },
  {
    name: 'Customer Payments',
    href: ROUTES.CUSTOMER_PAYMENTS,
    icon: CreditCard,
  },
  {
    name: 'Operations',
    href: ROUTES.OPERATIONS,
    icon: MapPin,
  },
  {
    name: 'Documents',
    href: ROUTES.DOCUMENTS,
    icon: FileCheck,
  },
  {
    name: 'Reports',
    href: ROUTES.REPORTS,
    icon: BarChart3,
    adminOnly: true,
  },
  {
    name: 'Settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load session');
        }

        return response.json();
      })
      .then((session) => {
        if (active) {
          setIsAdmin(session.role === 'admin');
        }
      })
      .catch(() => {
        if (active) {
          setIsAdmin(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } scrollbar-hidden lg:translate-x-0 fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-hidden bg-gray-900 text-white transition-transform duration-300`}
      >
        <div className="shrink-0 p-6">
          <h1 className="text-2xl font-bold">Prapancha Pravasa Tours Private Limited</h1>
          <p className="text-sm text-gray-400 mt-1">Tour Operation CRM</p>
        </div>

        <nav className="scrollbar-hidden min-h-0 flex-1 space-y-2 overflow-y-scroll p-4">
          {sidebarItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-gray-800 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
