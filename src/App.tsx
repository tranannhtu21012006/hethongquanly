import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Inventory } from '@/pages/Inventory';
import { Settings } from '@/pages/Settings';
import { useAppStore } from '@/store/useAppStore';

import { Effects } from '@/components/ui/Effects';

function App() {
  const fetchAllData = useAppStore((s) => s.fetchAllData);
  const isLoading = useAppStore((s) => s.isLoading);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Effects />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
