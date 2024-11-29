'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminLayout from './AdminLayout';
import { Utensils, MapPin } from "lucide-react";

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
    <AdminLayout>
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
    </AdminLayout>
  );
}
