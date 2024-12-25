'use client';

import AdminLayout from "@/components/AdminLayout";
import OrdersTable from '@/components/admin/OrdersTable';
import PopularMealsChart from '@/components/admin/PopularMealsChart';
import RevenueStats from '@/components/admin/RevenueStats';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Stats and Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="w-full min-h-[400px]">
            <PopularMealsChart />
          </div>
          <div className="w-full min-h-[400px]">
            <RevenueStats />
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Active Orders</h2>
            </div>
          </div>
          <div className="p-6">
            <OrdersTable 
              searchTerm={searchTerm} 
              showHistorical={false}
              showRefundButton={true}
            />
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Order History</h2>
              <div className="relative flex-grow sm:flex-grow-0 sm:min-w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search orders..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="p-6">
            <OrdersTable showHistorical={true} searchTerm={searchTerm} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
