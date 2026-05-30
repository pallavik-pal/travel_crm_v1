'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">PRAPANCHA PRAVASA TOURS PRIVATE LIMITED</h1>
        <p className="text-gray-600 mt-2">Opening login...</p>
      </div>
    </main>
  );
}
