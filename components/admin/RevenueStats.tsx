'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Clock, Receipt } from 'lucide-react';

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  monthlyRevenue: number;
  recentRevenue: number;
  totalGST: number;
  monthlyGST: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
}

export default function RevenueStats() {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    monthlyRevenue: 0,
    recentRevenue: 0,
    totalGST: 0,
    monthlyGST: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Get current date and start of month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch all orders
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders')
        .select('total_amount, created_at, status');

      if (allOrdersError) throw allOrdersError;

      // Calculate total revenue and orders
      const totalRevenue = allOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalOrders = allOrders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Calculate monthly revenue
      const monthlyRevenue = allOrders
        .filter(order => order.created_at >= startOfMonth)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // Calculate recent revenue (last 24 hours)
      const recentRevenue = allOrders
        .filter(order => order.created_at >= last24Hours)
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      // Calculate total GST and monthly GST
      const totalGST = totalRevenue * 0.1;
      const monthlyGST = monthlyRevenue * 0.1;

      // Calculate pending, completed and cancelled orders
      const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
      const completedOrders = allOrders.filter(order => order.status === 'completed').length;
      const cancelledOrders = allOrders.filter(order => order.status === 'cancelled').length;

      setRevenueData({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        monthlyRevenue,
        recentRevenue,
        totalGST,
        monthlyGST,
        pendingOrders,
        completedOrders,
        cancelledOrders,
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-hidden">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 overflow-y-auto max-h-[calc(100%-3rem)]">
        <div className="p-3 bg-emerald-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total GST Collected</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.totalGST)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.monthlyRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-indigo-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Monthly GST</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.monthlyGST)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Pending Orders, Completed Orders and Cancelled Orders</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{revenueData.pendingOrders} pending, {revenueData.completedOrders} completed, {revenueData.cancelledOrders} cancelled</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-pink-50 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-pink-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Average Order Value</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-orange-50 rounded-lg col-span-2 sm:col-span-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Last 24h Revenue</p>
              <p className="text-sm sm:text-base font-semibold text-gray-900">{formatCurrency(revenueData.recentRevenue)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
