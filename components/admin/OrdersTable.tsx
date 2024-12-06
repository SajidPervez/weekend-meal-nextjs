'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: number;
  created_at: string;
  status: string;
  total_amount: number;
  customer_email: string;
  customer_phone: string;
  session_id?: string;
  payment_status: string;
  order_items: {
    pickup_date: string;
    pickup_time: string;
  }[];
}

const PAGE_SIZE = 10;

export default function OrdersTable() {
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [recentRevenue, setRecentRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newOrdersPage, setNewOrdersPage] = useState(1);
  const [historyOrdersPage, setHistoryOrdersPage] = useState(1);
  const [totalNewOrders, setTotalNewOrders] = useState(0);
  const [totalHistoryOrders, setTotalHistoryOrders] = useState(0);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [newOrdersSearch, setNewOrdersSearch] = useState('');
  const [historyOrdersSearch, setHistoryOrdersSearch] = useState('');
  const [appliedNewOrdersSearch, setAppliedNewOrdersSearch] = useState('');
  const [appliedHistoryOrdersSearch, setAppliedHistoryOrdersSearch] = useState('');

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

  useEffect(() => {
    fetchOrders();
  }, [newOrdersPage, historyOrdersPage, appliedNewOrdersSearch, appliedHistoryOrdersSearch]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Base query for new orders
      let newOrdersQuery = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .in('status', ['pending', 'processing']);

      // Add search filter for new orders if search term exists
      if (appliedNewOrdersSearch) {
        newOrdersQuery = newOrdersQuery.or(`customer_email.ilike.%${appliedNewOrdersSearch}%,customer_phone.ilike.%${appliedNewOrdersSearch}%`);
      }

      // Get count for new orders
      const { count: newCount } = await newOrdersQuery;
      setTotalNewOrders(newCount || 0);

      // Base query for history orders
      let historyOrdersQuery = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .in('status', ['completed', 'cancelled']);

      // Add search filter for history orders if search term exists
      if (appliedHistoryOrdersSearch) {
        historyOrdersQuery = historyOrdersQuery.or(`customer_email.ilike.%${appliedHistoryOrdersSearch}%,customer_phone.ilike.%${appliedHistoryOrdersSearch}%`);
      }

      // Get count for history orders
      const { count: historyCount } = await historyOrdersQuery;
      setTotalHistoryOrders(historyCount || 0);

      // Fetch paginated new orders with search
      let newOrdersDataQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            pickup_date,
            pickup_time
          )
        `)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (appliedNewOrdersSearch) {
        newOrdersDataQuery = newOrdersDataQuery.or(`customer_email.ilike.%${appliedNewOrdersSearch}%,customer_phone.ilike.%${appliedNewOrdersSearch}%`);
      }

      const { data: newOrdersData, error: newOrdersError } = await newOrdersDataQuery
        .range((newOrdersPage - 1) * PAGE_SIZE, newOrdersPage * PAGE_SIZE - 1);

      if (newOrdersError) throw newOrdersError;
      setNewOrders(newOrdersData || []);

      // Fetch paginated history orders with search
      let historyOrdersDataQuery = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            pickup_date,
            pickup_time
          )
        `)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (appliedHistoryOrdersSearch) {
        historyOrdersDataQuery = historyOrdersDataQuery.or(`customer_email.ilike.%${appliedHistoryOrdersSearch}%,customer_phone.ilike.%${appliedHistoryOrdersSearch}%`);
      }

      const { data: historyOrdersData, error: historyOrdersError } = await historyOrdersDataQuery
        .range((historyOrdersPage - 1) * PAGE_SIZE, historyOrdersPage * PAGE_SIZE - 1);

      if (historyOrdersError) throw historyOrdersError;
      setHistoryOrders(historyOrdersData || []);

      // Calculate recent revenue (last 7 days)
      const { data: recentOrdersData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const recentTotal = recentOrdersData?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      setRecentRevenue(recentTotal || 0);

      // Calculate monthly revenue (last 30 days)
      const { data: monthlyOrdersData } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const monthlyTotal = monthlyOrdersData?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      setMonthlyRevenue(monthlyTotal || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const canRefund = (order: Order) => {
    return (
      order.session_id && // Must have a session ID
      order.payment_status === 'paid' && // Must be paid
      order.status !== 'cancelled' && // Not already cancelled
      order.status !== 'completed' // Not completed
    );
  };

  const renderOrdersTable = (orders: Order[], title: string, statuses: string[]) => {
    const filteredOrders = orders.filter(order => statuses.includes(order.status));
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-emerald-700">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-emerald-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Pickup Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Pickup Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-emerald-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.order_items?.[0]?.pickup_date ? formatDate(order.order_items[0].pickup_date) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.order_items?.[0]?.pickup_time ? formatPickupTime(order.order_items[0].pickup_time) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer_phone || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                    {canRefund(order) && (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPagination = (currentPage: number, totalItems: number, setPage: (page: number) => void, label: string) => {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-md mt-4">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              {label} - Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">First</span>
                ««
              </button>
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                «
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                »
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Last</span>
                »»
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const handleSearch = (type: 'new' | 'history') => {
    if (type === 'new') {
      setNewOrdersPage(1); // Reset to first page
      setAppliedNewOrdersSearch(newOrdersSearch);
    } else {
      setHistoryOrdersPage(1); // Reset to first page
      setAppliedHistoryOrdersSearch(historyOrdersSearch);
    }
  };

  const clearSearch = (type: 'new' | 'history') => {
    if (type === 'new') {
      setNewOrdersSearch('');
      setAppliedNewOrdersSearch('');
      setNewOrdersPage(1);
    } else {
      setHistoryOrdersSearch('');
      setAppliedHistoryOrdersSearch('');
      setHistoryOrdersPage(1);
    }
  };

  const renderSearchInput = (
    value: string, 
    onChange: (value: string) => void, 
    onSearch: () => void,
    onClear: () => void,
    placeholder: string
  ) => (
    <div className="mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch();
              }
            }}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
        >
          Search
        </button>
        {value && (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
          <h3 className="text-lg font-semibold text-emerald-700">Recent Revenue (7 Days)</h3>
          <p className="text-2xl font-bold text-emerald-600">${recentRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-emerald-500">
          <h3 className="text-lg font-semibold text-emerald-700">Monthly Revenue (30 Days)</h3>
          <p className="text-2xl font-bold text-emerald-600">${monthlyRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* New Orders Table */}
      <div>
        {renderSearchInput(
          newOrdersSearch,
          setNewOrdersSearch,
          () => handleSearch('new'),
          () => clearSearch('new'),
          "Search new orders by email or phone..."
        )}
        {renderOrdersTable(newOrders, "New Orders", ['pending', 'processing'])}
        {renderPagination(newOrdersPage, totalNewOrders, setNewOrdersPage, "New Orders")}
      </div>

      {/* Completed Orders Table */}
      <div>
        {renderSearchInput(
          historyOrdersSearch,
          setHistoryOrdersSearch,
          () => handleSearch('history'),
          () => clearSearch('history'),
          "Search order history by email or phone..."
        )}
        {renderOrdersTable(historyOrders, "Order History", ['completed', 'cancelled'])}
        {renderPagination(historyOrdersPage, totalHistoryOrders, setHistoryOrdersPage, "Order History")}
      </div>
    </div>
  );
}
