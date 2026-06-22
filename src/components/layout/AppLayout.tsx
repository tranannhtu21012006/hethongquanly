import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  Settings,
  LogOut,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AppLayout = () => {
  const { auth, logout, config } = useAppStore();
  const location = useLocation();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Mặt hàng', path: '/products', icon: Package },
    { name: 'Kho hàng', path: '/inventory', icon: ArrowRightLeft },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-transparent flex relative">
      {/* Sidebar */}
      <aside className="w-64 bg-background/40 backdrop-blur-xl border-r flex flex-col hidden md:flex shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 relative">
        <div className="p-6 border-b">
          <Link to="/" className="flex items-center gap-3 font-bold text-xl tracking-tight text-primary hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-xl flex items-center justify-center shadow-sm">
              <Store size={22} />
            </div>
            {config.shopName || 'Clothes Shop'}
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 translate-x-1"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1"
                )}
              >
                <Icon size={20} className={isActive ? "opacity-100" : "opacity-70"} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t bg-muted/10">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl border-none shadow-md relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 animate-gradient-xy opacity-80"></div>
            <div className="absolute inset-[1px] bg-background/60 backdrop-blur-md rounded-[11px] transition-colors group-hover:bg-background/40"></div>
            <div className="relative flex items-center gap-3 w-full z-10">
              {config.avatarUrl ? (
                <img src={config.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold ring-2 ring-primary/30">
                  {config.ownerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate text-foreground">{config.nickname || config.ownerName}</p>
                <p className="text-xs text-foreground/70 truncate font-medium">Administrator</p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 transition-colors rounded-xl" onClick={logout}>
            <LogOut size={18} className="mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent">
        {/* Mobile Header here if needed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
