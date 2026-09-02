import { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Products } from '@/pages/Products';
import { Inventory } from '@/pages/Inventory';
import { Audit } from '@/pages/Audit';
import { Settings } from '@/pages/Settings';
import { useAppStore } from '@/store/useAppStore';

import { Effects } from '@/components/ui/Effects';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

// Keep-alive interval: ping Supabase every 4 hours to prevent project pausing
const KEEP_ALIVE_INTERVAL = 4 * 60 * 60 * 1000;

function App() {
  const fetchAllData = useAppStore((s) => s.fetchAllData);
  const keepAlive = useAppStore((s) => s.keepAlive);
  const isLoading = useAppStore((s) => s.isLoading);
  const isOffline = useAppStore((s) => s.isOffline);

  // Fetch data on startup
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Keep-alive ping: runs every 4 hours while the app is open
  useEffect(() => {
    const interval = setInterval(() => {
      keepAlive();
    }, KEEP_ALIVE_INTERVAL);

    return () => clearInterval(interval);
  }, [keepAlive]);

  // Retry connection when user clicks retry
  const handleRetry = useCallback(() => {
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
      {isOffline && <OfflineBanner onRetry={handleRetry} />}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="audit" element={<Audit />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
