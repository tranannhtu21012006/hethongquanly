import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload, Save, Check, User } from 'lucide-react';

export const Settings = () => {
  const { config, updateConfig, exportData, importData } = useAppStore();
  const [formData, setFormData] = useState(config);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        setFormData(prev => ({ ...prev, avatarUrl: canvas.toDataURL('image/jpeg', 0.8) }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'exchangeRate' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    updateConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const dataStr = exportData();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shop-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (importData(content)) {
          alert('Khôi phục dữ liệu thành công!');
          window.location.reload(); // Reload to refresh state properly
        } else {
          alert('Lỗi: File dữ liệu không hợp lệ!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Cửa hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Cửa hàng</label>
              <Input name="shopName" value={formData.shopName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên Chủ Shop</label>
              <Input name="ownerName" value={formData.ownerName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Biệt danh</label>
              <Input name="nickname" value={formData.nickname} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ảnh Đại diện</label>
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div className="w-16 h-16 shrink-0 rounded-full border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {/* Upload from device */}
                  <label className="inline-flex items-center justify-center gap-2 cursor-pointer text-sm font-medium h-9 px-4 rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground border transition-colors w-full">
                    <Upload className="h-4 w-4" />
                    {formData.avatarUrl ? 'Đổi ảnh từ máy' : 'Tải ảnh lên từ máy'}
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  {/* Or paste URL */}
                  <Input
                    name="avatarUrl"
                    value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                    onChange={handleChange}
                    placeholder="Hoặc dán link URL ảnh..."
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tỉ giá JPY sang VND</label>
              <Input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleChange} />
            </div>
            <Button onClick={handleSave} className="w-full mt-4">
              {saved ? <><Check className="mr-2 h-4 w-4" /> Đã lưu</> : <><Save className="mr-2 h-4 w-4" /> Lưu cấu hình</>}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sao lưu & Phục hồi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Vì dữ liệu được lưu trên trình duyệt (LocalStorage), bạn nên thường xuyên tải xuống bản sao lưu để phòng ngừa mất dữ liệu khi xóa lịch sử web.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống Bản Sao Lưu
                </Button>
                
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button variant="secondary" onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Khôi phục từ File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
