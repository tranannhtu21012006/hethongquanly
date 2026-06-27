import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Product, ProductVariant } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, PackageSearch, Upload, ChevronDown, ChevronUp, AlertTriangle, Settings2, X } from 'lucide-react';

export const Products = () => {
  const { products, addProduct, deleteProduct, currency, config, categories, addCategory, deleteCategory } = useAppStore();
  
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [variants, setVariants] = useState<Omit<ProductVariant, 'id' | 'stock'>[]>([
    { size: '', color: '', price: 0 }
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setImageUrl(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { size: '', color: '', price: 0 }]);
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleRemoveVariantRow = (index: number) => {
    if (variants.length > 1) {
      const newVariants = [...variants];
      newVariants.splice(index, 1);
      setVariants(newVariants);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || variants.some(v => !v.size || !v.color || v.price <= 0)) {
      alert("Vui lòng điền đầy đủ thông tin Tên sản phẩm, Danh mục, Size, Màu và Giá bán (>0)");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name,
      category,
      imageUrl,
      createdAt: new Date().toISOString(),
      variants: variants.map(v => ({
        id: crypto.randomUUID(),
        ...v,
        stock: 0,
      }))
    };

    addProduct(newProduct);
    setIsAdding(false);
    setName('');
    setCategory('');
    setImageUrl('');
    setVariants([{ size: '', color: '', price: 0 }]);
  };

  const handleDelete = (id: string, productName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" không? Mọi dữ liệu tồn kho liên quan có thể bị ảnh hưởng.`)) {
      deleteProduct(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedProducts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const displayPrice = (priceVnd: number) => {
    if (currency === 'JPY') {
      return `¥${Math.round(priceVnd / config.exchangeRate).toLocaleString()}`;
    }
    return `${priceVnd.toLocaleString()} đ`;
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !categories.includes(newCategoryName.trim())) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    if (confirm(`Xóa danh mục "${cat}"? Các sản phẩm thuộc danh mục này sẽ không bị xóa nhưng sẽ mất phân loại.`)) {
      deleteCategory(cat);
      if (selectedCategory === cat) setSelectedCategory('Tất cả');
    }
  };

  // Get unique sizes and colors for filters
  const { uniqueSizes, uniqueColors } = useMemo(() => {
    const sizes = new Set<string>();
    const colors = new Set<string>();
    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.size) sizes.add(v.size);
        if (v.color) colors.add(v.color);
      });
    });
    return { uniqueSizes: Array.from(sizes).sort(), uniqueColors: Array.from(colors).sort() };
  }, [products]);

  // Lọc và Sắp xếp Alphabet
  const filteredProducts = products
    .filter(p => {
      // Name search
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      // Category filter
      if (selectedCategory !== 'Tất cả' && p.category !== selectedCategory) return false;
      // Size & Color filter
      if (selectedSize || selectedColor) {
        const hasMatchingVariant = p.variants.some(v => {
          const matchSize = selectedSize ? v.size === selectedSize : true;
          const matchColor = selectedColor ? v.color === selectedColor : true;
          return matchSize && matchColor;
        });
        if (!hasMatchingVariant) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Quản lý Mặt hàng</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="transition-transform hover:scale-105 shadow-sm">
          {isAdding ? "Hủy" : <><Plus className="mr-2 h-4 w-4" /> Thêm mặt hàng</>}
        </Button>
      </div>

      {/* Category Pills */}
      <div className="bg-card p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            variant={selectedCategory === 'Tất cả' ? 'default' : 'outline'} 
            onClick={() => setSelectedCategory('Tất cả')}
            className="rounded-full px-6"
          >
            Tất cả
          </Button>
          {categories.map(cat => (
            <div key={cat} className="relative group">
              <Button 
                variant={selectedCategory === cat ? 'default' : 'outline'} 
                onClick={() => setSelectedCategory(cat)}
                className="rounded-full px-6 pr-8"
              >
                {cat}
              </Button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          {isAddingCategory ? (
            <div className="flex items-center gap-2">
              <Input 
                className="w-32 h-9 rounded-full px-3 text-sm" 
                placeholder="Tên danh mục" 
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Button size="sm" onClick={handleAddCategory} className="rounded-full">Lưu</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingCategory(false)} className="rounded-full">Hủy</Button>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setIsAddingCategory(true)} className="rounded-full text-muted-foreground hover:text-primary border border-dashed">
              <Plus className="h-4 w-4 mr-1" /> Thêm
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border/50">
          <div className="relative w-full sm:w-64">
            <PackageSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mặt hàng..."
              className="pl-8 bg-muted/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              className="h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm flex-1 sm:w-32"
              value={selectedSize}
              onChange={e => setSelectedSize(e.target.value)}
            >
              <option value="">Lọc Size</option>
              {uniqueSizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select 
              className="h-10 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm flex-1 sm:w-32"
              value={selectedColor}
              onChange={e => setSelectedColor(e.target.value)}
            >
              <option value="">Lọc Màu</option>
              {uniqueColors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isAdding && (
        <Card className="border-primary/50 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <CardTitle>Thêm mặt hàng mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên mặt hàng *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Áo Thun Cổ Tròn" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Danh mục *</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Hình ảnh</label>
                  <div className="flex gap-2">
                    <label className="flex flex-1 items-center justify-center bg-secondary hover:bg-secondary/80 text-secondary-foreground h-10 px-4 rounded-md cursor-pointer transition-colors border">
                      <Upload className="h-4 w-4 mr-2" /> Tải lên
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {imageUrl && (
                      <div className="w-10 h-10 rounded-md border overflow-hidden shrink-0">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Danh sách Biến thể (Size/Màu) *</label>
                {variants.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2">
                    <Input placeholder="Size (S, M...)" value={v.size} onChange={e => handleVariantChange(idx, 'size', e.target.value)} required />
                    <Input placeholder="Màu sắc" value={v.color} onChange={e => handleVariantChange(idx, 'color', e.target.value)} required />
                    <Input type="number" placeholder="Giá bán (JPY)" value={v.price || ''} onChange={e => handleVariantChange(idx, 'price', Number(e.target.value))} required />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveVariantRow(idx)} disabled={variants.length === 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddVariantRow} className="mt-2 border-dashed">
                  <Plus className="mr-2 h-4 w-4" /> Thêm biến thể
                </Button>
              </div>
              <Button type="submit" className="w-full font-bold text-lg h-12 mt-4 shadow hover:shadow-lg transition-all">Xác nhận Thêm</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Redesigned Compact List */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-muted/10">
            <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-20" />
            Không tìm thấy mặt hàng nào.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredProducts.map(product => {
              // Apply filters to variants if size/color filter is active
              const displayVariants = product.variants.filter(v => {
                const matchSize = selectedSize ? v.size === selectedSize : true;
                const matchColor = selectedColor ? v.color === selectedColor : true;
                return matchSize && matchColor;
              });

              // Check if any displayed variant is out of stock
              const hasOutOfStock = displayVariants.some(v => v.stock <= 0);
              const totalStock = displayVariants.reduce((acc, v) => acc + v.stock, 0);
              const isExpanded = expandedProducts[product.id];
              
              return (
                <div 
                  key={product.id} 
                  className={`transition-colors duration-200 ${
                    hasOutOfStock 
                      ? 'bg-red-50 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/40' 
                      : 'bg-transparent hover:bg-muted/30'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 sm:h-16 sm:w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center overflow-hidden border bg-background">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-medium text-center">No Image</span>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                              {product.category || 'Khác'}
                            </span>
                            {hasOutOfStock && (
                              <span className="flex items-center text-xs font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Hết hàng
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-lg text-foreground truncate">{product.name}</h3>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                            <span>Tồn kho: <strong className={hasOutOfStock ? 'text-destructive' : 'text-foreground'}>{totalStock}</strong></span>
                            <span>•</span>
                            <span>{displayVariants.length} phân loại</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className={`hidden sm:flex ${isExpanded ? 'bg-muted' : ''}`}
                            onClick={() => toggleExpand(product.id)}
                          >
                            <Settings2 className="h-4 w-4 mr-2" />
                            {isExpanded ? 'Đóng' : 'Quản lý size/màu'}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(product.id, product.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Mobile Expand Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-3 sm:hidden"
                        onClick={() => toggleExpand(product.id)}
                      >
                        {isExpanded ? 'Đóng chi tiết' : 'Xem chi tiết size/màu'}
                        {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Variants Table */}
                  {isExpanded && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                      <div className="ml-0 sm:ml-20 bg-background rounded-lg border overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                            <tr>
                              <th className="px-4 py-2">Size</th>
                              <th className="px-4 py-2">Màu sắc</th>
                              <th className="px-4 py-2 text-right">Giá bán</th>
                              <th className="px-4 py-2 text-right">Tồn kho</th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayVariants.map(variant => {
                              const isOutOfStock = variant.stock <= 0;
                              return (
                                <tr key={variant.id} className={`border-t ${isOutOfStock ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                  <td className={`px-4 py-2 font-medium ${isOutOfStock ? 'text-destructive' : ''}`}>{variant.size}</td>
                                  <td className={`px-4 py-2 ${isOutOfStock ? 'text-destructive' : ''}`}>{variant.color}</td>
                                  <td className="px-4 py-2 text-right font-medium text-primary">{displayPrice(variant.price)}</td>
                                  <td className="px-4 py-2 text-right">
                                    <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded ${isOutOfStock ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                                      {variant.stock}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
