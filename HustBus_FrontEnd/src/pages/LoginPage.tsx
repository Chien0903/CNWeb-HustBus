import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Button } from '../components/ui/button.tsx';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            setLoading(true);

            const response = await login(form);

            // Redirect based on user role from backend
            const isAdmin = response.user?.role === 'admin';
            const redirectTo = isAdmin ? '/admin' : ((location.state as any)?.from || '/profile');
            navigate(redirectTo, { replace: true });
        } catch (err: any) {
            // Show exact error message from backend
            const errorMessage = err?.response?.data?.message || err?.message || 'Không thể đăng nhập. Vui lòng thử lại.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-orange text-white">
                    <LogIn className="h-4 w-4" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-navy">Đăng nhập</h1>
                    <p className="text-sm text-gray-500">Đồng bộ lộ trình và lịch sử tìm kiếm của bạn.</p>
                </div>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="text"
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
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    <span className="ml-2">Đăng nhập</span>
                </Button>
            </form>

            <p className="text-sm text-gray-500 mt-6 text-center">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="text-orange font-semibold hover:underline">Đăng ký ngay</Link>
            </p>
        </div>
    );
}
