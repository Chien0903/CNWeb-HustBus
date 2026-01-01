import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";

const MainLayout = () => {
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    // Redirect admin users to admin area
    useEffect(() => {
        if (isAdmin) {
            navigate('/admin', { replace: true });
        }
    }, [isAdmin, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased">
            <Header />
            <main className="flex-1 w-full">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
