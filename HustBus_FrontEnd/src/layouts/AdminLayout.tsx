import { Outlet, NavLink, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
    Users,
    MapPin,
    Route,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useState } from "react";

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const adminNavLinks = [
        { to: "/admin/users", label: "Quản lý người dùng", icon: Users },
        { to: "/admin/stops", label: "Quản lý điểm dừng", icon: MapPin },
        { to: "/admin/routes", label: "Quản lý tuyến đường", icon: Route },
    ];

    const handleLogout = () => {
        logout();
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-navy text-white transition-all duration-300 z-50 ${sidebarOpen ? "w-64" : "w-20"
                    }`}
            >
                {/* Logo & Toggle */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                    <Link to="/admin" className={`flex items-center gap-2 group ${!sidebarOpen && "justify-center w-full"}`}>
                        <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center font-bold text-white shadow-sm group-hover:bg-orange-hover transition-colors">
                            H
                        </div>
                        {sidebarOpen && (
                            <span className="text-lg font-bold tracking-tight">
                                Hust<span className="text-orange">Bus</span>
                            </span>
                        )}
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${!sidebarOpen && "hidden"}`}
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {adminNavLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                        ? "bg-orange text-white shadow-lg"
                                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    } ${!sidebarOpen && "justify-center"}`
                                }
                                title={!sidebarOpen ? link.label : undefined}
                            >
                                <Icon size={20} />
                                {sidebarOpen && <span>{link.label}</span>}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div
                className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"
                    }`}
            >
                {/* Top Bar */}
                <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
                    <div className="h-full px-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {!sidebarOpen && (
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <Menu size={20} />
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-navy">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                                <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-xs font-bold text-white">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-sm font-medium text-navy">{user?.name || user?.email}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-navy border-gray-300 hover:bg-gray-50"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} className="mr-2" />
                                Đăng xuất
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
