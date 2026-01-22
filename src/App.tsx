import { useEffect, useState } from 'react';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { ScrollArea } from './components/ui/scroll-area';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { initializeSampleData } from './lib/storage';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import QuotationsPage from './pages/QuotationsPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import InvoicesPage from './pages/InvoicesPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import CustomersPage from './pages/CustomersPage';
import SuppliersPage from './pages/SuppliersPage';
import ProductsPage from './pages/ProductsPage';
import ReportsPage from './pages/ReportsPage';
import NotFound from './pages/NotFound';
import SalesPersonsPage from './pages/SalesPersonPage';
import CategoriesPage from './pages/CategoriesPage';
import PrintDeliveryReceiptPage from "@/pages/PrintDeliveryReceiptPage";

import LoginPage from './auth/LoginPage';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage'; // create this
import Register from './pages/Register';
import UsersPage from './pages/UsersPage';
import ChangePasswordPage from "./auth/ChangePasswordPage";


const queryClient = new QueryClient();

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initializeSampleData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <BrowserRouter basename="/"> 
            <Routes>
              {/* ---------- PUBLIC ROUTES ---------- */}
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />


              {/* ---------- PROTECTED ROUTES ---------- */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={['Admin', 'Secretary', 'Sales']}>
                    <div className="flex h-screen bg-gray-50">
                      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
                        <Header />
                        <ScrollArea className="flex-1">
                          <main className="p-6">
                            <Routes>
                              <Route index element={<Dashboard />} />
                              <Route path="/dashboard" element={<Dashboard />} />
                              <Route path="/quotations" element={<QuotationsPage />} />
                              <Route path="/sales-orders" element={<SalesOrdersPage />} />
                              <Route path="/invoices" element={<InvoicesPage />} />
                              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                              <Route path="/customers" element={<CustomersPage />} />
                              <Route path="/suppliers" element={<SuppliersPage />} />
                              <Route path="/products" element={<ProductsPage />} />
                              <Route path="/reports" element={<ReportsPage />} />
                              <Route path="/sales-persons" element={<SalesPersonsPage />} />
                              <Route path="/categories" element={<CategoriesPage />} />
                              <Route path="/print/delivery-receipt/:id" element={<PrintDeliveryReceiptPage />} />
                              <Route path="/unauthorized" element={<UnauthorizedPage />} />

                              {/* ✅ Admin-only route */}
                              <Route
                                path="/users"
                                element={
                                  <ProtectedRoute allowedRoles={['Admin']}>
                                    <UsersPage />
                                  </ProtectedRoute>
                                }
                              />

                              {/* ---------- 404 NOT FOUND ---------- */}
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </main>
                        </ScrollArea>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* ---------- FALLBACK ---------- */}
              <Route path="*" element={<Navigate to="login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
