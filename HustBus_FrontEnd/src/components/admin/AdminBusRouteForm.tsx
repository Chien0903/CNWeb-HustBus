import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBusRoute, updateBusRoute } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface AdminBusRouteFormProps {
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminBusRouteForm({ initialData, onSuccess, onCancel }: AdminBusRouteFormProps) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    short_name: '',
    long_name: '',
    type: 'bus',
    fare: 7000,
    forward_direction: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.route_id || initialData.id,
        short_name: initialData.short_name || '',
        long_name: initialData.name || initialData.long_name || '',
        type: initialData.type || 'bus',
        fare: initialData.fare || 7000,
        forward_direction: initialData.forward_direction !== undefined ? initialData.forward_direction : true
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isEdit) {
        await updateBusRoute(formData.id, formData);
      } else {
        await createBusRoute(formData);
      }
      onSuccess();
    } catch (error: any) {
      console.error("Failed to save bus route", error);
      setErrorMsg(error?.message || "Lỗi khi lưu tuyến buýt. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-bold mb-4">{isEdit ? 'Cập nhật tuyến' : 'Thêm tuyến mới'}</h3>
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Mã tuyến (ID)</label>
          <Input
            name="id"
            value={formData.id}
            onChange={handleChange}
            disabled={isEdit}
            placeholder="VD: 01_1"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tên ngắn (Số hiệu)</label>
          <Input
            name="short_name"
            value={formData.short_name}
            onChange={handleChange}
            placeholder="VD: 01"
            required
          />
        </div>

        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Tên dài</label>
          <Input
            name="long_name"
            value={formData.long_name}
            onChange={handleChange}
            placeholder="VD: Tuyến 01"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Giá vé</label>
          <Input
            name="fare"
            type="number"
            value={formData.fare}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Loại xe</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange/20 focus:border-orange"
          >
            <option value="bus">Bus</option>
            <option value="minibus">Minibus</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Hủy</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
