import { useEffect, useState } from 'react';
import { Users, MapPin, Route, MessageSquare, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '@/services/api';

interface Stats {
    totalUsers: number;
    totalRoutes: number;
    totalStops: number;
    totalReviews: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalRoutes: 0,
        totalStops: 0,
        totalReviews: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await getAdminStats() as Stats;
                setStats(data);
            } catch (err: any) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Tổng người dùng',
            value: stats.totalUsers,
            icon: Users,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            link: '/admin/users',
        },
        {
            title: 'Tuyến xe buýt',
            value: stats.totalRoutes,
            icon: Route,
            color: 'bg-green-500',
            lightColor: 'bg-green-50',
            textColor: 'text-green-600',
            link: '/admin/routes',
        },
        {
            title: 'Điểm dừng',
            value: stats.totalStops,
            icon: MapPin,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            link: '/admin/stops',
        },
        {
            title: 'Đánh giá',
            value: stats.totalReviews,
            icon: MessageSquare,
            color: 'bg-orange-500',
            lightColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            link: '#',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-navy mb-2">Dashboard</h1>
                <p className="text-gray-600">Tổng quan hệ thống HustBus</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.title}
                            to={stat.link}
                            className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-lg ${stat.lightColor}`}>
                                    <Icon className={`h-6 w-6 ${stat.textColor}`} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                                {loading ? (
                                    <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                                ) : (
                                    <p className="text-3xl font-bold text-navy">{stat.value.toLocaleString()}</p>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 text-navy" />
                    <h2 className="text-lg font-bold text-navy">Thao tác nhanh</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/admin/users"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange/5 transition-all group"
                    >
                        <Users className="h-8 w-8 text-gray-400 group-hover:text-orange mb-2" />
                        <h3 className="font-semibold text-navy mb-1">Quản lý người dùng</h3>
                        <p className="text-sm text-gray-600">Xem và quản lý tài khoản</p>
                    </Link>
                    <Link
                        to="/admin/routes"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange/5 transition-all group"
                    >
                        <Route className="h-8 w-8 text-gray-400 group-hover:text-orange mb-2" />
                        <h3 className="font-semibold text-navy mb-1">Quản lý tuyến đường</h3>
                        <p className="text-sm text-gray-600">Thêm, sửa, xóa tuyến</p>
                    </Link>
                    <Link
                        to="/admin/stops"
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange hover:bg-orange/5 transition-all group"
                    >
                        <MapPin className="h-8 w-8 text-gray-400 group-hover:text-orange mb-2" />
                        <h3 className="font-semibold text-navy mb-1">Quản lý điểm dừng</h3>
                        <p className="text-sm text-gray-600">Quản lý trạm xe buýt</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
