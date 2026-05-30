'use client';

import { EmployeeAccessPanel } from '@/components/admin/employee-access-panel';
import { MainLayout } from '@/components/layout/main-layout';

export default function EmployeeAccessPage() {
  return (
    <MainLayout>
      <EmployeeAccessPanel />
    </MainLayout>
  );
}
