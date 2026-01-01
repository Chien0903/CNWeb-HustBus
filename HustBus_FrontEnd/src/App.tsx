import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePage from "./pages/HomePage";
import BusLinesPage from "./pages/BusLinesPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import RouteDetailPage from "./pages/RouteDetailPage";
import SavedRouteDetailPage from "./pages/SavedRouteDetailPage";
import { AuthProvider } from "./contexts/AuthContext";
import ProfilePage from "./pages/ProfilePage";
import AdminBusLinesPage from "./pages/admin/AdminBusLinesPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import StopsPage from "./pages/StopsPage";
import AdminStopsPage from "./pages/admin/AdminStopsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MapSearchPage from "./pages/MapSearchPage";
import StopSearchPage from "./pages/StopSearchPage";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>

                <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/routes" element={<AdminBusLinesPage />} />
                    <Route path="/admin/stops" element={<AdminStopsPage />} />
                </Route>

                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/map" element={<MapSearchPage />} />
                    <Route path="/results" element={<SearchResultsPage />} />
                    <Route path="/lines" element={<BusLinesPage />} />
                    <Route path="/stops" element={<StopSearchPage />} />
                    <Route path="/stops/reviews" element={<StopsPage />} />
                    <Route path="/route-detail" element={<RouteDetailPage />} />
                    <Route path="/saved-route/:id" element={<SavedRouteDetailPage />} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
