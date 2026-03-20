import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Restaurants from "./pages/Restaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import UsersRoles from "./pages/UsersRoles";
import FloorsAndTables from "./pages/FloorsAndTables";
import MenuManagement from "./pages/MenuManagement";
import Orders from "./pages/Orders";
import Kitchen from "./pages/Kitchen";
import Inventory from "./pages/Inventory";
import TaxAndDiscounts from "./pages/TaxAndDiscounts";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import { FirebaseTokenManager } from "@/components/FirebaseTokenManager";
import { NotificationProvider } from "@/contexts/NotificationContext";

import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  // Only allow admin role in this app
  if (user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationProvider>
          <FirebaseTokenManager />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
            <Route path="/restaurants/:id" element={<ProtectedRoute><RestaurantDetails /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><UsersRoles /></ProtectedRoute>} />
            <Route path="/floors" element={<ProtectedRoute><FloorsAndTables /></ProtectedRoute>} />
            <Route path="/menu" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/kitchen" element={<ProtectedRoute><Kitchen /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/tax" element={<ProtectedRoute><TaxAndDiscounts /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </NotificationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
