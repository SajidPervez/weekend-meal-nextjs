'use client';

import { Suspense, useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface SessionData {
  session: {
    status: string;
    customer_details?: {
      email?: string;
      name?: string;
    };
    amount_total?: number;
  };
}

function SuccessContent() {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    // Only check session once
    if (!sessionId || hasCheckedSession) {
      if (!sessionId) {
        setError('No session ID found');
        setStatus('error');
      }
      return;
    }

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/get-session?session_id=${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch session details');
        }

        setSessionData(data);
        clearCart();
        setStatus('success');
      } catch (err) {
        console.error('Error processing order:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setStatus('error');
      } finally {
        setHasCheckedSession(true);
      }
    };

    checkSession();
  }, [searchParams, clearCart, hasCheckedSession]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        {status === 'loading' ? (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Processing your order...</p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 mb-4">
              <p>Error: {error}</p>
            </div>
            <Link 
              href="/"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Thank You for Your Order!</h1>
            {sessionData?.session.customer_details?.name && (
              <p className="text-gray-700 mb-2">
                Hi {sessionData.session.customer_details.name}!
              </p>
            )}
            <p className="text-gray-600 mb-2">
              Your order has been confirmed and is being processed.
            </p>
            {sessionData?.session.customer_details?.email && (
              <p className="text-gray-600 mb-8">
                We've sent a confirmation email to {sessionData.session.customer_details.email}.
              </p>
            )}
            <Link 
              href="/"
              className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}