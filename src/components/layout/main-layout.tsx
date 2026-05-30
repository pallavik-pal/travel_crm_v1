'use client';

import React from 'react';
import { Sidebar } from './sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen max-w-full overflow-x-hidden bg-gray-50">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden lg:ml-64">
        <div className="min-w-0 max-w-full p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
