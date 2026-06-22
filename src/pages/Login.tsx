import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAppStore((state) => state.login);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <Card className="w-full max-w-md bg-background/60 backdrop-blur-xl border-border/50 shadow-2xl">
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
              />
            </div>
            {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
