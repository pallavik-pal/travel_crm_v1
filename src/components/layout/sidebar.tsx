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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const sidebarItems = [
  {
    name: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
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
  },
  {
    name: 'Settings',
    href: ROUTES.SETTINGS,
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

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
        } lg:translate-x-0 fixed left-0 top-0 z-40 w-64 h-screen bg-gray-900 text-white transition-transform duration-300 overflow-y-auto`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Prapancha Pravasa Tours Private Limited</h1>
          <p className="text-sm text-gray-400 mt-1">Tour Operation CRM</p>
        </div>

        <nav className="space-y-2 p-4">
          {sidebarItems.map((item) => {
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
            onClick={() => {
              // Handle logout
            }}
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
