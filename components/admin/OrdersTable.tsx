'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Printer } from 'lucide-react';
import PrintableOrders from './PrintableOrders';

interface Meal {
  id: number;
  title: string;
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

interface Order {
  id: number;
  created_at: string;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  session_id?: string;
  payment_status?: string;
  order_items: OrderItem[];
}

interface OrderResponse {
  id: number;
  created_at: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  session_id?: string;
  payment_status?: string;
  order_items: OrderItem[];
}

interface OrdersTableProps {
  showHistorical: boolean;
  searchTerm?: string;
  showRefundButton?: boolean;
}

export default function OrdersTable({ 
  showHistorical, 
  searchTerm: externalSearchTerm = '', 
  showRefundButton = false 
}: OrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Refresh orders after update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleRefund = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order and issue a refund?')) {
      return;
    }

    try {
      setIsProcessing(orderId);

      const response = await fetch('/api/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      // Refresh orders after successful refund
      await fetchOrders();
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch all meals first to create a lookup map
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('id, title');

      if (mealsError) {
        console.error('Error fetching meals:', mealsError);
        throw mealsError;
      }

      const mealsMap = new Map(mealsData?.map(meal => [meal.id, meal]) || []);

      // Determine which status to fetch based on showHistorical
      const statusList = showHistorical ? ['completed', 'cancelled'] : ['pending', 'processing'];
      console.log('Fetching orders with status:', statusList);

      // Fetch orders with all details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items (
            id,
            order_id,
            meal_id,
            quantity,
            price,
            pickup_date,
            pickup_time,
            created_at
          )
        `)
        .in('status', statusList)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      console.log('Raw orders data:', ordersData);

      // Process orders with meal details
      const processedOrders = (ordersData || []).map((order: OrderResponse) => ({
        ...order,
        order_items: order.order_items.map((item: OrderItem) => ({
          ...item,
          meal: mealsMap.get(item.meal_id) || { id: item.meal_id, title: 'Unknown Meal' }
        }))
      }));

      console.log('Processed orders:', processedOrders);
      setOrders(processedOrders);

    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm, showHistorical]);

  // Filter orders based on status and search term
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || 
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_items.some(item => item.meal?.title?.toLowerCase().includes(searchTerm.toLowerCase()));

    const isHistoricalOrder = order.status === 'completed' || order.status === 'cancelled';
    const isActiveOrder = order.status === 'pending' || order.status === 'processing';

    return showHistorical ? (isHistoricalOrder && matchesSearch) : (isActiveOrder && matchesSearch);
  });

  // Sort orders by date, newest first
  filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filter active orders for printing (pending or processing)
  const activeOrders = orders.filter(order => 
    order.status === 'pending' || order.status === 'processing'
  );

  const handlePrint = () => {
    setIsPrinting(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoading && filteredOrders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {showHistorical ? 'No completed or cancelled orders found' : 'No active orders found'}
      </div>
    );
  }

  return (
    <div>
      {/* Search and Print Section - Only show for active orders */}
      {!showHistorical && (
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          {activeOrders.length > 0 && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 whitespace-nowrap"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Orders ({activeOrders.length})
            </button>
          )}
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Meal</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pickup</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
              {!showHistorical && showRefundButton && (
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {order.order_items.map((item, index) => (
                    <div key={index}>
                      {item.meal?.title || `Meal #${item.meal_id}`}
                    </div>
                  ))}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <div>{order.customer_email}</div>
                  <div className="text-gray-400">{order.customer_phone}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {order.order_items.map((item, index) => (
                    <div key={index}>
                      {new Date(item.pickup_date).toLocaleDateString()} - {item.pickup_time === '12:00:00' ? 'Lunch' : 'Dinner'}
                    </div>
                  ))}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  ${order.total_amount.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                {!showHistorical && showRefundButton && (
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      disabled={isProcessing === order.id}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    {showRefundButton && order.session_id && order.payment_status === 'paid' && order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        onClick={() => handleRefund(order.id)}
                        disabled={isProcessing === order.id}
                        className="mt-2 w-full inline-flex justify-center items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing === order.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          'Cancel & Refund'
                        )}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Print Component */}
      {isPrinting && (
        <PrintableOrders
          orders={activeOrders}
          onClose={() => setIsPrinting(false)}
        />
      )}
    </div>
  );
}
