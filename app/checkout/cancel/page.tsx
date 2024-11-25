import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="container mx-auto p-8 text-center">
      <div className="max-w-md mx-auto">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Order Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your order has been cancelled. No charges have been made.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-md hover:bg-emerald-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
} 