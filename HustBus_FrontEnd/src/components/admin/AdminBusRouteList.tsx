import { useState, useEffect } from 'react';
import { searchBusRoutes, deleteBusRoute } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Plus, Search, Loader2 } from 'lucide-react';
import AdminBusRouteForm from './AdminBusRouteForm';

export default function AdminBusRouteList() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchRoutes = async (query = '') => {
    setLoading(true);
    try {
      const q = query || ' ';
      const data = await searchBusRoutes(q) as any[];
      setRoutes(data);
    } catch (error) {
      console.error("Failed to fetch routes", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchRoutes('');
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa tuyến "${name}" không?`)) {
      try {
        await deleteBusRoute(id);
        fetchRoutes(searchQuery);
      } catch (error) {
        console.error("Failed to delete route", error);
        alert("Xóa thất bại!");
      }
    }
  };

  const handleSuccess = () => {
    setEditingRoute(null);
    setIsCreating(false);
    fetchRoutes(searchQuery);
  };

  if (isCreating || editingRoute) {
    return (
      <AdminBusRouteForm
        initialData={editingRoute}
        onSuccess={handleSuccess}
        onCancel={() => {
          setEditingRoute(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex gap-2 w-full max-w-sm">
          <Input
            placeholder="Tìm tuyến..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRoutes(searchQuery)}
          />
          <Button variant="ghost" size="icon" onClick={() => fetchRoutes(searchQuery)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsCreating(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Thêm tuyến
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
            <tr>
              <th className="p-4">Tên tuyến</th>
              <th className="p-4 hidden md:table-cell">Mô tả / ID</th>
              <th className="p-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  <Loader2 className="animate-spin h-6 w-6 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  Chưa có dữ liệu. Hãy thử tìm kiếm.
                </td>
              </tr>
            ) : (
              routes.map((route: any, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-navy">{route.name}</td>
                  <td className="p-4 hidden md:table-cell text-gray-600">{route.sampleId || route.id}</td>
                  <td className="p-4 text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRoute(route)}
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-red-50 border-red-200"
                      onClick={() => handleDelete(route.sampleId || route.id, route.name)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
