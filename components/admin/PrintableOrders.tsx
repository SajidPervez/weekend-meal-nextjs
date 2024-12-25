'use client';

import { useEffect, useState } from 'react';

interface Order {
  id: number;
  created_at: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  order_items: OrderItem[];
}

interface OrderItem {
  id: number;
  order_id: number;
  meal_id: number;
  quantity: number;
  price: number;
  pickup_date: string;
  pickup_time: string;
  meal?: {
    id: number;
    title: string;
  };
}

interface GroupedOrders {
  [key: string]: {
    mealTitle: string;
    orders: Order[];
  };
}

interface PrintableOrdersProps {
  orders: Order[];
  onClose: () => void;
}

export default function PrintableOrders({ orders, onClose }: PrintableOrdersProps) {
  const [isPrinting, setIsPrinting] = useState(false);

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

  // Group orders by meal
  const groupedOrders = orders.reduce((groups: GroupedOrders, order) => {
    order.order_items.forEach((item) => {
      if (!item.meal?.title) return;

      const key = `${item.meal.title}_${item.pickup_date}_${item.pickup_time}`;
      if (!groups[key]) {
        groups[key] = {
          mealTitle: item.meal.title,
          orders: []
        };
      }
      groups[key].orders.push(order);
    });
    return groups;
  }, {});

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

        {Object.entries(groupedOrders).map(([key, group]) => (
          <div key={key} className="meal-group mb-8">
            <h2 className="text-xl font-bold mb-4">{group.mealTitle}</h2>
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
                {group.orders.map((order) => (
                  <tr key={order.id} className="order-item">
                    <td>{order.id.slice(-8)}</td>
                    <td>
                      {order.customer_email}
                      {order.customer_phone && <div className="text-sm text-gray-500">{order.customer_phone}</div>}
                    </td>
                    <td>{formatDate(order.order_items[0].pickup_date)}</td>
                    <td>{formatTime(order.order_items[0].pickup_time)}</td>
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
