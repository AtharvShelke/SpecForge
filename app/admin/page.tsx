import { Suspense } from 'react';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

function AdminFallback() {
  return <div className="min-h-screen bg-stone-50" />;
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
