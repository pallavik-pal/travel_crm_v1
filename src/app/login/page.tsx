'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, LogIn, UserRound } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';

function EmployeeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get('next') || '/dashboard';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError('Invalid employee username or password.');
      return;
    }

    router.replace(nextPath.startsWith('/') ? nextPath : '/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#eef4ff_55%,#fff9e8_100%)]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-8 lg:grid-cols-[minmax(0,1.35fr)_500px] lg:px-12">
        <section className="hidden text-slate-950 lg:block">
          <div className="flex items-center gap-5">
            <Image
              src="/pp-logo.png"
              alt="Prapancha Pravasa Tours Private Limited"
              width={120}
              height={120}
              className="h-28 w-28 rounded-2xl border border-slate-200 object-cover shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Travel Operations CRM
              </p>
              <h1 className="mt-3 max-w-4xl text-6xl font-bold leading-tight text-slate-950">
                Prapancha Pravasa Tours Private Limited
              </h1>
            </div>
          </div>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-slate-600">
            Manage bookings, travelers, payments, documents, and operations from one secure workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium text-slate-700">
            {['Tours', 'Bookings', 'Payments', 'Operations'].map((item) => (
              <span key={item} className="rounded-full border border-white bg-white/80 px-5 py-2 shadow-sm">
                {item}
              </span>
            ))}
          </div>
        </section>

        <Card className="w-full border border-white bg-white/95 shadow-xl backdrop-blur">
          <CardHeader className="p-8 pb-3">
            <div className="flex items-center gap-4">
              <Image
                src="/pp-logo.png"
                alt="Prapancha Pravasa Tours Private Limited"
                width={72}
                height={72}
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover shadow-sm"
              />
              <div>
                <CardDescription className="text-slate-600">
                  Prapancha Pravasa Tours Private Limited
                </CardDescription>
                <CardTitle className="mt-1 text-2xl text-gray-950">Employee Login</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form className="space-y-5" autoComplete="off" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="username"
                    autoComplete="off"
                    className="pl-9"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="pl-9"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <LogIn className="h-4 w-4" />
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <EmployeeLoginForm />
    </Suspense>
  );
}
