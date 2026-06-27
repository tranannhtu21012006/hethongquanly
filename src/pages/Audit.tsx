import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ClipboardCheck, History, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { InventoryCheck, InventoryCheckItem } from '@/types';
import { cn } from '@/lib/utils';

export const Audit = () => {
  const { products, inventoryChecks, addInventoryCheck } = useAppStore();
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [note, setNote] = useState('');
  
  // Initialize draft items with current stock (re-sync khi products tải xong)
  const [draftItems, setDraftItems] = useState<InventoryCheckItem[]>([]);

  useEffect(() => {
    if (products.length === 0) return;
    setDraftItems(() => {
      const items: InventoryCheckItem[] = [];
      products.forEach(p => {
        p.variants.forEach(v => {
          items.push({
            productId: p.id,
            variantId: v.id,
            expectedStock: v.stock,
            actualStock: v.stock,
            diff: 0
          });
        });
      });
      return items;
    });
  }, [products]);

  const [selectedHistory, setSelectedHistory] = useState<InventoryCheck | null>(null);

  const handleActualStockChange = (variantId: string, value: string) => {
    const actual = parseInt(value) || 0;
    setDraftItems(prev => prev.map(item => {
      if (item.variantId === variantId) {
        return {
          ...item,
          actualStock: actual,
          diff: actual - item.expectedStock
        };
      }
      return item;
    }));
  };

  const handleSubmit = () => {
    if (!confirm('Bạn có chắc chắn muốn chốt phiếu kiểm kho này? Số lượng tồn kho hệ thống sẽ bị ghi đè bằng số lượng thực tế!')) return;

    const newCheck: InventoryCheck = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      note,
      items: draftItems
    };

    addInventoryCheck(newCheck);
    
    // Reset form
    setNote('');
    alert('Đã chốt phiếu kiểm kho thành công!');
    setActiveTab('HISTORY');
  };

  const totalExpected = draftItems.reduce((acc, item) => acc + item.expectedStock, 0);
  const totalActual = draftItems.reduce((acc, item) => acc + item.actualStock, 0);
  const totalDiff = totalActual - totalExpected;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">Kiểm kho</h1>
          <p className="text-muted-foreground mt-1">Quản lý và đối soát số lượng tồn kho thực tế.</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-xl w-fit">
          <button 
            onClick={() => { setActiveTab('NEW'); setSelectedHistory(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'NEW' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ClipboardCheck size={16} /> Phiếu kiểm mới
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'HISTORY' ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History size={16} /> Lịch sử kiểm kho
          </button>
        </div>
      </div>

      {activeTab === 'NEW' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Tạo phiếu kiểm kho</CardTitle>
              <p className="text-sm text-muted-foreground">Nhập số lượng thực tế đếm được trong kho. Hệ thống sẽ tự tính chênh lệch.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Mặt hàng</th>
                      <th className="px-6 py-4 font-semibold">Phân loại</th>
                      <th className="px-6 py-4 font-semibold text-center">Tồn hệ thống</th>
                      <th className="px-6 py-4 font-semibold text-center w-40">Tồn thực tế</th>
                      <th className="px-6 py-4 font-semibold text-center">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map(product => (
                      product.variants.map((variant, vIdx) => {
                        const item = draftItems.find(i => i.variantId === variant.id);
                        if (!item) return null;
                        
                        return (
                          <tr key={variant.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-6 py-4">
                              {vIdx === 0 && (
                                <div className="flex items-center gap-3">
                                  {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                      {product.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="font-semibold text-foreground">{product.name}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              <span className="bg-secondary px-2 py-1 rounded-md text-xs">{variant.size} - {variant.color}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-muted-foreground font-mono">
                              {item.expectedStock}
                            </td>
                            <td className="px-6 py-4">
                              <Input 
                                type="number" 
                                value={item.actualStock} 
                                onChange={(e) => handleActualStockChange(variant.id, e.target.value)}
                                className={cn(
                                  "text-center font-bold",
                                  item.diff !== 0 ? "border-primary bg-primary/5 text-primary" : ""
                                )}
                              />
                            </td>
                            <td className="px-6 py-4 text-center font-bold">
                              {item.diff > 0 ? (
                                <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">+{item.diff}</span>
                              ) : item.diff < 0 ? (
                                <span className="text-destructive bg-destructive/10 px-2 py-1 rounded-md">{item.diff}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-muted/20 border-t space-y-4">
                <div className="flex justify-between items-center p-4 bg-background rounded-xl border shadow-sm">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Tổng tồn hệ thống</p>
                    <p className="text-2xl font-bold font-mono">{totalExpected}</p>
                  </div>
                  <div className="space-y-1 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Tổng tồn thực tế</p>
                    <p className="text-2xl font-bold font-mono text-primary">{totalActual}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-muted-foreground">Tổng chênh lệch</p>
                    <p className={cn("text-2xl font-bold font-mono", totalDiff > 0 ? "text-emerald-500" : totalDiff < 0 ? "text-destructive" : "text-muted-foreground")}>
                      {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú (Tùy chọn)</label>
                  <Input 
                    placeholder="VD: Kiểm kho định kỳ cuối tháng 6..." 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full text-lg h-12 shadow-lg shadow-primary/25" size="lg">
                  <Save className="mr-2" /> Chốt phiếu kiểm kho
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {!selectedHistory ? (
            <Card>
              <CardHeader>
                <CardTitle>Lịch sử các lần kiểm kho</CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryChecks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Chưa có phiếu kiểm kho nào.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inventoryChecks.map(check => {
                      const totalDiff = check.items.reduce((acc, i) => acc + i.diff, 0);
                      const hasDiscrepancy = check.items.some(i => i.diff !== 0);
                      
                      return (
                        <div 
                          key={check.id} 
                          onClick={() => setSelectedHistory(check)}
                          className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              hasDiscrepancy ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {hasDiscrepancy ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                Kiểm kho ngày {format(new Date(check.createdAt), 'dd/MM/yyyy HH:mm')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {check.note || 'Không có ghi chú'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Tổng chênh lệch</p>
                            <p className={cn("font-bold font-mono", totalDiff > 0 ? "text-emerald-500" : totalDiff < 0 ? "text-destructive" : "text-muted-foreground")}>
                              {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Chi tiết phiếu kiểm</CardTitle>
                  <p className="text-sm text-muted-foreground">Ngày: {format(new Date(selectedHistory.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedHistory(null)}>
                  Quay lại lịch sử
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 bg-muted/10 border-b">
                  <p className="text-sm font-medium">Ghi chú: <span className="font-normal text-muted-foreground">{selectedHistory.note || 'Không có'}</span></p>
                </div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Phân loại</th>
                      <th className="px-6 py-4 font-semibold text-center">Hệ thống</th>
                      <th className="px-6 py-4 font-semibold text-center">Thực tế</th>
                      <th className="px-6 py-4 font-semibold text-center">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedHistory.items.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      const variant = product?.variants.find(v => v.id === item.variantId);
                      
                      return (
                        <tr key={idx} className="hover:bg-muted/10">
                          <td className="px-6 py-4">
                            <p className="font-semibold">{product?.name || 'Sản phẩm đã xóa'}</p>
                            <p className="text-xs text-muted-foreground">{variant?.size} - {variant?.color}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground font-mono">
                            {item.expectedStock}
                          </td>
                          <td className="px-6 py-4 text-center font-bold font-mono">
                            {item.actualStock}
                          </td>
                          <td className="px-6 py-4 text-center font-bold">
                            {item.diff > 0 ? (
                              <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">+{item.diff}</span>
                            ) : item.diff < 0 ? (
                              <span className="text-destructive bg-destructive/10 px-2 py-1 rounded-md">{item.diff}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
