'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Utensils } from "lucide-react";
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AdminLayoutWrapper: Starting authentication check');
    checkAuth();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const checkAuth = async () => {
    try {
      console.log('AdminLayoutWrapper: Checking session');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('AdminLayoutWrapper: No session found, redirecting to login');
        router.push('/login');
        return;
      }
      
      console.log('AdminLayoutWrapper: Session found, user is authenticated');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AdminLayoutWrapper: Auth error:', error);
      router.push('/login');
    } finally {
      console.log('AdminLayoutWrapper: Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center justify-between bg-white border-b">
        <Link href="/admin" className="flex items-center text-emerald-600">
          <Utensils className="h-6 w-6" />
          <span className="ml-2 text-xl font-bold">Tasty Bites</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href="/admin"
            className="text-gray-600 hover:text-emerald-600"
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/meals"
            className="text-gray-600 hover:text-emerald-600"
          >
            Manage Meals
          </Link>
          <button 
            onClick={handleSignOut}
            className="text-gray-600 hover:text-emerald-600"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 pt-14">
        {children}
      </main>
    </div>
  );
}
