'use client';

import AdminLayout from "@/components/AdminLayout";
import OrdersTable from '@/components/admin/OrdersTable';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-8">
        {/* Orders Tables */}
        <div className="mb-12">
          <OrdersTable />
        </div>
      </div>
    </AdminLayout>
  );
}
