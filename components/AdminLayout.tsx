'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div>
      <nav className="bg-stone-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">Admin Dashboard</div>
          <div className="space-x-4">
            <Link 
              href="/admin" 
              className="text-white hover:text-stone-300"
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/meals" 
              className="text-white hover:text-stone-300"
            >
              Add Meal
            </Link>
            <button
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto">
        {children}
      </main>
    </div>
  );
}
