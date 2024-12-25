'use client';

import { Order } from '@/types/order';
import { useEffect } from 'react';

interface PrintableOrdersProps {
  orders: Order[];
  onPrintComplete: () => void;
}

export default function PrintableOrders({ orders, onPrintComplete }: PrintableOrdersProps) {
  useEffect(() => {
    let printListener: () => void;
    
    const timeoutId = setTimeout(() => {
      printListener = () => {
        onPrintComplete();
        window.removeEventListener('afterprint', printListener);
      };
      window.addEventListener('afterprint', printListener);
      window.print();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (printListener) {
        window.removeEventListener('afterprint', printListener);
      }
    };
  }, [onPrintComplete]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPickupTime = (time: string) => {
    return time === '12:00:00' ? 'Lunch' : time === '18:00:00' ? 'Dinner' : time;
  };

  return (
    <div className="printable-content" style={{ display: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-content,
          .printable-content * {
            visibility: visible !important;
          }
          .printable-content {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 20mm;
            size: auto;
          }
        }
      `}} />

      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">New Orders</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">Total Orders: {orders.length}</p>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b-2 border-gray-300">Order #</th>
              <th className="text-left p-2 border-b-2 border-gray-300">Customer</th>
              <th className="text-left p-2 border-b-2 border-gray-300">Items</th>
              <th className="text-left p-2 border-b-2 border-gray-300">Pickup Details</th>
              <th className="text-right p-2 border-b-2 border-gray-300">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200">
                <td className="p-2">
                  <div className="font-semibold">#{order.id}</div>
                  <div className="text-sm text-gray-500">{formatDate(order.created_at)}</div>
                </td>
                <td className="p-2">
                  <div>{order.customer_email}</div>
                  <div className="text-sm text-gray-500">{order.customer_phone}</div>
                </td>
                <td className="p-2">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-medium">{item.quantity}x</span>{' '}
                      {item.meal?.title || `Meal #${item.meal_id}`}
                    </div>
                  ))}
                </td>
                <td className="p-2">
                  {order.order_items.map((item, idx) => (
                    <div key={idx} className="mb-1">
                      {formatDate(item.pickup_date)}{' '}
                      <span className="text-gray-500">({formatPickupTime(item.pickup_time)})</span>
                    </div>
                  ))}
                </td>
                <td className="p-2 text-right">
                  <div className="font-semibold">${order.total_amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{order.status}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
