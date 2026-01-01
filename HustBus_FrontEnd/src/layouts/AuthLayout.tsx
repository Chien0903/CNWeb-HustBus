import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Bus, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';

export default function AuthLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, isAdmin } = useAuth();
    const isLogin = location.pathname === '/login' || location.state?.mode === 'login';

    // Redirect authenticated users away from login/register pages
    useEffect(() => {
        if (isAuthenticated) {
            // Admin users go to admin dashboard, regular users go to home
            const redirectTo = isAdmin ? '/admin' : '/';
            navigate(redirectTo, { replace: true });
        }
    }, [isAuthenticated, isAdmin, navigate]);

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy via-navy to-blue-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-orange rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/assets/web-icon/web-icon.png" alt="HustBus Logo" className="w-12 h-12" />
                        <span className="text-2xl font-bold tracking-tight">
                            Hust<span className="text-orange">Bus</span>
                        </span>
                    </Link>

                    {/* Main Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl font-bold mb-4 leading-tight">
                                Hệ thống giao thông<br />thông minh cho bạn
                            </h1>
                            <p className="text-lg text-gray-300 leading-relaxed">
                                Tìm kiếm lộ trình xe buýt nhanh chóng, chính xác và tiện lợi nhất
                            </p>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                                    <Bus className="text-orange" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Tìm tuyến</h3>
                                    <p className="text-sm text-gray-300">Nhanh chóng</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                                    <MapPin className="text-orange" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Điểm dừng</h3>
                                    <p className="text-sm text-gray-300">Chính xác</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                                    <Clock className="text-orange" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Thời gian</h3>
                                    <p className="text-sm text-gray-300">Thực tế</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                                <div className="w-10 h-10 bg-orange/20 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="text-orange" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Tối ưu</h3>
                                    <p className="text-sm text-gray-300">Hành trình</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-sm text-gray-400">
                        © {new Date().getFullYear()} HustBus. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-3 group">
                            <div className="w-12 h-12 bg-orange rounded-xl flex items-center justify-center font-bold text-white text-2xl shadow-lg group-hover:bg-orange-hover transition-all duration-300">
                                T
                            </div>
                            <span className="text-2xl font-bold tracking-tight text-navy">
                                Transit<span className="text-orange">Smart</span>
                            </span>
                        </Link>
                    </div>

                    {/* Welcome Text */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-navy">
                            {isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {isLogin
                                ? 'Đăng nhập để tiếp tục sử dụng dịch vụ'
                                : 'Đăng ký để trải nghiệm đầy đủ tính năng'
                            }
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
