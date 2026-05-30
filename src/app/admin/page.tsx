'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ShieldCheck, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function AdminPage() {
  const router = useRouter();
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUsername, password: adminPassword }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError('Invalid admin login or password.');
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-10">
        <Card className="w-full border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>Sign in to open the full CRM and manage employees below the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleAdminLogin}>
              <div className="space-y-2">
                <Label htmlFor="adminUsername">Admin username</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="adminUsername"
                    className="pl-9"
                    value={adminUsername}
                    onChange={(event) => setAdminUsername(event.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminPassword">Admin password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="adminPassword"
                    type="password"
                    className="pl-9"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                  />
                </div>
              </div>
              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <ShieldCheck className="h-4 w-4" />
                {isSubmitting ? 'Signing in...' : 'Open CRM'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
