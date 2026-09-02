import { WifiOff, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useState } from 'react';

interface OfflineBannerProps {
  onRetry: () => void;
}

export const OfflineBanner = ({ onRetry }: OfflineBannerProps) => {
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await onRetry();
    // Small delay for UX
    setTimeout(() => setIsRetrying(false), 1500);
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return 'chưa có';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'không xác định';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
      <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <WifiOff size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              ⚠️ Đang hiển thị dữ liệu offline
            </p>
            <p className="text-xs opacity-90 truncate">
              Supabase hiện không khả dụng • Đồng bộ lần cuối: {formatLastSync(lastSyncedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Đang thử...' : 'Thử lại'}
        </button>
      </div>
    </div>
  );
};
