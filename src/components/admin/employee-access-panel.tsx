'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ADMIN_ACCESS } from '@/lib/auth';
import { useRecords } from '@/lib/use-records';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Employee = {
  id: string;
  username: string;
  role: string;
  access: string[];
};

const ACCESS_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  tours: 'Tours',
  bookings: 'Bookings',
  travelers: 'Travelers',
  payments: 'Ops Payments',
  'customer-payments': 'Customer Payments',
  operations: 'Operations',
  documents: 'Documents',
  settings: 'Settings',
};

const emptyForm = {
  username: '',
  password: '',
  access: ['dashboard'],
};

export function EmployeeAccessPanel() {
  const [employees, setEmployees] = useRecords<Employee[]>('/api/admin/employees', []);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function reloadEmployees() {
    const response = await fetch('/api/admin/employees', { cache: 'no-store' });

    if (response.ok) {
      setEmployees(await response.json());
    }
  }

  function toggleFormAccess(key: string) {
    setForm((current) => ({
      ...current,
      access: current.access.includes(key)
        ? current.access.filter((item) => item !== key)
        : [...current.access, key],
    }));
  }

  async function handleCreateEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    const response = await fetch('/api/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message || 'Unable to add employee.');
      return;
    }

    setForm(emptyForm);
    setMessage('Employee added successfully.');
    await reloadEmployees();
  }

  async function updateEmployeeAccess(employee: Employee, access: string[]) {
    await fetch(`/api/admin/employees/${employee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access }),
    });

    await reloadEmployees();
  }

  async function deleteEmployee(employee: Employee) {
    await fetch(`/api/admin/employees/${employee.id}`, { method: 'DELETE' });
    await reloadEmployees();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Employee Access</h2>
        <p className="mt-1 text-sm text-gray-600">Add employees and choose which CRM pages they can open.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Employee
            </CardTitle>
            <CardDescription>Create a dashboard login and set access control.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" autoComplete="off" onSubmit={handleCreateEmployee}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="employeeUsername">Username</Label>
                  <Input
                    id="employeeUsername"
                    autoComplete="off"
                    value={form.username}
                    onChange={(event) => setForm({ ...form, username: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeePassword">Password</Label>
                  <Input
                    id="employeePassword"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Access</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ADMIN_ACCESS.map((key) => (
                    <label key={key} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.access.includes(key)}
                        onChange={() => toggleFormAccess(key)}
                      />
                      {ACCESS_LABELS[key]}
                    </label>
                  ))}
                </div>
              </div>

              {message ? <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div> : null}
              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? 'Adding...' : 'Add employee'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>Change page access or remove employee accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee) => (
                <div key={employee.id} className="rounded-md border bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-950">{employee.username}</h3>
                      <p className="text-sm text-gray-600">Employee account</p>
                    </div>
                    <Button variant="destructive" size="sm" className="gap-2" onClick={() => deleteEmployee(employee)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                    {ADMIN_ACCESS.map((key) => {
                      const checked = employee.access.includes(key);
                      const nextAccess = checked
                        ? employee.access.filter((item) => item !== key)
                        : [...employee.access, key];

                      return (
                        <label key={key} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => updateEmployeeAccess(employee, nextAccess)}
                          />
                          {ACCESS_LABELS[key]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
              {!employees.length ? (
                <div className="rounded-md border bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                  No employees added yet.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
