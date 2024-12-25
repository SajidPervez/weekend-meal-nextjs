'use client';

import { useEffect } from 'react';
import { Order } from '@/types/order';

interface PrintableOrdersProps {
  orders: Order[];
  onClose: () => void;
}

export default function PrintableOrders({ orders, onClose }: PrintableOrdersProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString === '12:00:00' ? 'Lunch' : 
           timeString === '18:00:00' ? 'Dinner' : 
           timeString;
  };

  useEffect(() => {
    const printTimeout = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = () => {
      onClose();
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(printTimeout);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onClose]);

  // Group orders by meal without duplicating orders
  const ordersByMeal = orders.reduce((acc, order) => {
    // Get unique meals from order items
    const uniqueMeals = Array.from(new Set(order.order_items.map(item => item.meal?.title || `Meal #${item.meal_id}`)));
    
    // For each unique meal, add the order under that meal's group
    uniqueMeals.forEach(mealTitle => {
      if (!acc[mealTitle]) {
        acc[mealTitle] = [];
      }
      
      // Find the pickup details for this meal
      const item = order.order_items.find(item => 
        (item.meal?.title || `Meal #${item.meal_id}`) === mealTitle
      );
      
      acc[mealTitle].push({
        ...order,
        pickup: {
          date: item?.pickup_date || '',
          time: item?.pickup_time || ''
        }
      });
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="print-wrapper">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }

          body * {
            visibility: hidden;
          }

          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          .print-wrapper * {
            visibility: visible;
          }

          .meal-group {
            page-break-inside: avoid;
            margin-bottom: 2rem;
          }

          .order-item {
            page-break-inside: avoid;
            border-bottom: 1px solid #eee;
            padding: 0.5rem 0;
          }

          .order-item:last-child {
            border-bottom: none;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }

          th {
            font-weight: bold;
            background-color: #f9fafb;
          }
        }

        @media screen {
          .print-wrapper {
            display: none;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Active Orders</h1>
          <p className="text-gray-600 mt-1">Generated on {formatDate(new Date().toISOString())}</p>
          <p className="text-gray-500">Total Orders: {orders.length}</p>
        </div>

        {Object.entries(ordersByMeal).map(([mealTitle, mealOrders]) => (
          <div key={mealTitle} className="meal-group mb-8">
            <h2 className="text-xl font-bold mb-4">{mealTitle}</h2>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Pickup Date</th>
                  <th>Time</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {mealOrders.map((order) => (
                  <tr key={order.id} className="order-item">
                    <td>{order.id.slice(-8)}</td>
                    <td>
                      {order.customer_email}
                      {order.customer_phone && <div className="text-sm text-gray-500">{order.customer_phone}</div>}
                    </td>
                    <td>{formatDate(order.pickup.date)}</td>
                    <td>{formatTime(order.pickup.time)}</td>
                    <td>${order.total_amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
