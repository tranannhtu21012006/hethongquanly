import React, { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowDownToLine, ArrowUpFromLine, History, Trash2 } from 'lucide-react';

export const Inventory = () => {
  const { products, addTransaction, deleteTransactions, transactions, currency, config } = useAppStore();
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT' | 'HISTORY'>('IN');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [importPrice, setImportPrice] = useState(0); // For IN
  const [importCurrency, setImportCurrency] = useState<'VND' | 'JPY'>('VND');
  const [discount, setDiscount] = useState(0); // For OUT
  const [discountCurrency, setDiscountCurrency] = useState<'VND' | 'JPY'>('VND');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(v => v.id === selectedVariantId);

  const displayPrice = (priceVnd: number) => {
    if (currency === 'JPY') {
      return `¥${Math.round(priceVnd / config.exchangeRate).toLocaleString()}`;
    }
    return `${priceVnd.toLocaleString()} JPY`;
  };

  const calculateTotalOut = () => {
    if (!selectedVariant) return 0;
    const subtotal = selectedVariant.price * quantity;
    // Allow applying discount in either currency, but save in VND
    const discountInVnd = discountCurrency === 'JPY' ? discount * config.exchangeRate : discount;
    return Math.max(0, subtotal - discountInVnd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !selectedVariantId || quantity <= 0) {
      alert("Vui lòng chọn sản phẩm, biến thể và nhập số lượng hợp lệ.");
      return;
    }

    if (activeTab === 'OUT') {
      if (!selectedVariant || selectedVariant.stock < quantity) {
        alert("Số lượng tồn kho không đủ để xuất hàng!");
        return;
      }
    }

    const discountInVnd = discountCurrency === 'JPY' ? discount * config.exchangeRate : discount;
    const importPriceInVnd = importCurrency === 'JPY' ? importPrice * config.exchangeRate : importPrice;

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      type: activeTab as 'IN' | 'OUT',
      productId: selectedProductId,
      variantId: selectedVariantId,
      quantity,
      price: activeTab === 'IN' ? importPriceInVnd : (selectedVariant?.price || 0),
      discount: activeTab === 'OUT' ? discountInVnd : 0,
      total: activeTab === 'IN' ? importPriceInVnd * quantity : calculateTotalOut(),
      date: new Date().toISOString(),
    };

    addTransaction(transaction);
    alert(`${activeTab === 'IN' ? 'Nhập' : 'Xuất'} kho thành công!`);
    
    // Reset
    setQuantity(1);
    setImportPrice(0);
    setDiscount(0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Quản lý Kho hàng</h2>

      <div className="flex gap-2 border-b pb-2">
        <Button variant={activeTab === 'IN' ? 'default' : 'ghost'} onClick={() => setActiveTab('IN')}>
          <ArrowDownToLine className="mr-2 h-4 w-4" /> Nhập kho
        </Button>
        <Button variant={activeTab === 'OUT' ? 'default' : 'ghost'} onClick={() => setActiveTab('OUT')}>
          <ArrowUpFromLine className="mr-2 h-4 w-4" /> Xuất kho (Bán hàng)
        </Button>
        <Button variant={activeTab === 'HISTORY' ? 'default' : 'ghost'} onClick={() => setActiveTab('HISTORY')}>
          <History className="mr-2 h-4 w-4" /> Lịch sử Giao dịch
        </Button>
      </div>

      {(activeTab === 'IN' || activeTab === 'OUT') && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{activeTab === 'IN' ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho (Bán hàng)'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Chọn Sản phẩm</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    setSelectedVariantId('');
                  }}
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chọn Size / Màu</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn biến thể --</option>
                    {selectedProduct.variants.map(v => (
                      <option key={v.id} value={v.id}>
                        Size {v.size} - Màu {v.color} (Tồn: {v.stock} | Giá: {displayPrice(v.price)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Số lượng</label>
                  <Input 
                    type="number" min="1" 
                    value={quantity === 0 ? '' : quantity} 
                    onChange={e => setQuantity(e.target.value === '' ? 0 : Number(e.target.value))} 
                    required 
                  />
                </div>

                {activeTab === 'IN' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Giá nhập</label>
                      <select 
                        className="text-xs border rounded px-1 py-0.5 bg-muted"
                        value={importCurrency}
                        onChange={(e) => setImportCurrency(e.target.value as 'VND' | 'JPY')}
                      >
                        <option value="VND">VND</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                    <Input 
                      type="number" min="0" 
                      value={importPrice === 0 ? '' : importPrice} 
                      onChange={e => setImportPrice(e.target.value === '' ? 0 : Number(e.target.value))} 
                      placeholder={`Nhập giá theo ${importCurrency}`}
                    />
                  </div>
                )}
                
                {activeTab === 'OUT' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Chiết khấu</label>
                      <select 
                        className="text-xs border rounded px-1 py-0.5 bg-muted"
                        value={discountCurrency}
                        onChange={(e) => setDiscountCurrency(e.target.value as 'VND' | 'JPY')}
                      >
                        <option value="VND">VND</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                    <Input 
                      type="number" min="0" 
                      value={discount === 0 ? '' : discount} 
                      onChange={e => setDiscount(e.target.value === '' ? 0 : Number(e.target.value))} 
                      placeholder={`Nhập chiết khấu theo ${discountCurrency}`}
                    />
                  </div>
                )}
              </div>

              {activeTab === 'OUT' && selectedVariant && (
                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <span className="font-semibold">Tổng tiền thanh toán:</span>
                  <span className="text-xl font-bold text-primary">
                    {displayPrice(calculateTotalOut())}
                  </span>
                </div>
              )}

              {activeTab === 'IN' && (
                <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
                  <span className="font-semibold">Tổng chi phí nhập:</span>
                  <span className="text-xl font-bold text-destructive">
                    {displayPrice((importCurrency === 'JPY' ? importPrice * config.exchangeRate : importPrice) * quantity)}
                  </span>
                </div>
              )}

              <Button type="submit" className="w-full">
                {activeTab === 'IN' ? 'Xác nhận Nhập kho' : 'Xác nhận Xuất kho'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'HISTORY' && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Lịch sử Giao dịch</CardTitle>
            {selectedTxIds.length > 0 && (
              <Button variant="destructive" onClick={() => {
                if (confirm(`Bạn có chắc muốn xóa ${selectedTxIds.length} giao dịch này? Hệ thống sẽ tự động hoàn tác số lượng tồn kho tương ứng.`)) {
                  deleteTransactions(selectedTxIds);
                  setSelectedTxIds([]);
                }
              }}>
                <Trash2 className="mr-2 h-4 w-4" /> Xóa {selectedTxIds.length} mục
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300"
                        checked={transactions.length > 0 && selectedTxIds.length === transactions.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTxIds(transactions.map(t => t.id));
                          else setSelectedTxIds([]);
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Sản phẩm</th>
                    <th className="px-4 py-3">Phân loại</th>
                    <th className="px-4 py-3 text-right">Số lượng</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Tổng giá trị</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice().reverse().map(tx => {
                    const product = products.find(p => p.id === tx.productId);
                    const variant = product?.variants.find(v => v.id === tx.variantId);
                    const isSelected = selectedTxIds.includes(tx.id);
                    
                    return (
                      <tr key={tx.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="px-4 py-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTxIds([...selectedTxIds, tx.id]);
                              else setSelectedTxIds(selectedTxIds.filter(id => id !== tx.id));
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {new Date(tx.date).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          <span className={tx.type === 'IN' ? 'text-destructive' : 'text-green-600'}>
                            {tx.type === 'IN' ? 'NHẬP' : 'XUẤT'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{product?.name || 'Sản phẩm đã xóa'}</td>
                        <td className="px-4 py-3">{variant ? `${variant.size} / ${variant.color}` : '-'}</td>
                        <td className="px-4 py-3 text-right font-medium">{tx.quantity}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{displayPrice(tx.price)}</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={tx.type === 'IN' ? 'text-destructive' : 'text-green-600'}>
                            {tx.type === 'IN' ? '-' : '+'}{displayPrice(tx.total)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                        Chưa có giao dịch nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
