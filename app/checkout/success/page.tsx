'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  const { clearCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  const handleReturnHome = () => {
    console.log('handleReturnHome: Redirecting to home');
    console.log('Current router status:', router);
    router.push('/');
  };

  return (
    <div className="container mx-auto p-8 text-center">
      <div className="max-w-md mx-auto">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Thank You for Your Order!</h1>
        <p className="text-gray-600 mb-8">
          We&apos;ve received your order and will send you a confirmation email shortly.
        </p>
        <button
          onClick={handleReturnHome}
          className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 