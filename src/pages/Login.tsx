import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';
import $ from 'jquery';

if (typeof window !== 'undefined') {
  (window as any).$ = (window as any).jQuery = $;
}
import 'jquery.ripples';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize WebGL Water Ripple Effect on the login background
    if (rippleRef.current) {
      try {
        ($(rippleRef.current) as any).ripples({
          resolution: 512,
          dropRadius: 20,
          perturbance: 0.04,
        });
      } catch (e) {
        console.error('Ripple init failed', e);
      }
    }

    return () => {
      if (rippleRef.current) {
        try {
          ($(rippleRef.current) as any).ripples('destroy');
        } catch (e) {}
      }
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (username === envUsername && password === envPassword) {
      login(username);
      navigate('/');
    } else {
      setError('Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  const greeting = "こんにちは、社長";

  return (
    <div 
      ref={rippleRef}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Animated Dropdown Greeting */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex gap-[2px] md:gap-1 z-10 select-none pointer-events-none">
        {greeting.split('').map((char, i) => (
          <span 
            key={i} 
            className="text-3xl md:text-5xl font-serif text-foreground/80 font-bold tracking-widest drop-shadow-sm"
            style={{ 
              animation: `slideDown 1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0,
              transform: 'translateY(-40px)' 
            }}
          >
            {char}
          </span>
        ))}
      </div>

      <Card className="w-full max-w-md bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl z-20 hover:shadow-emerald-500/10 transition-shadow duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <Store size={24} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Quản lý cửa hàng</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập để vào hệ thống</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tài khoản</label>
              <Input
                type="text"
                placeholder="Nhập tên tài khoản..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-background/50 border-border/50 focus:bg-background/80 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mật khẩu</label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50 border-border/50 focus:bg-background/80 transition-colors"
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full transition-transform hover:-translate-y-0.5 active:scale-95 duration-200">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
