import AdminBusRouteList from '@/components/admin/AdminBusRouteList';
import { LayoutDashboard } from 'lucide-react';

export default function AdminBusLinesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center">
            <LayoutDashboard className="mr-2 h-6 w-6 text-orange" />
            Quản lý tuyến buýt
          </h1>
        </div>
      </div>

      <AdminBusRouteList />
    </div>
  );
}
