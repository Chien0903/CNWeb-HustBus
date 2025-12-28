import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Button } from '../components/ui/button.tsx';
import { Loader2, UserPlus } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            setLoading(true);
            await register(form);
            navigate('/profile', { replace: true });
        } catch (err: any) {
            // Show exact error message from backend
            const errorMessage = err?.response?.data?.message || err?.message || 'Không thể đăng ký. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-orange text-white">
                    <UserPlus className="h-4 w-4" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-navy">Tạo tài khoản</h1>
                    <p className="text-sm text-gray-500">Lưu lộ trình, đánh giá trạm và đồng bộ lịch sử.</p>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="name">Họ tên</label>
                    <input
                        id="name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:border-orange"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:border-orange"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">Mật khẩu</label>
                    <input
                        id="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/20 focus-visible:border-orange"
                    />
                </div>

                <Button type="submit" className="w-full bg-orange hover:bg-orange-hover text-white" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    <span className="ml-2">Đăng ký</span>
                </Button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-orange font-semibold hover:underline">Đăng nhập</Link>
            </p>
        </div>
    );
}
