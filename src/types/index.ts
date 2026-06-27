export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  price: number; // Giá bán
  stock: number; // Số lượng tồn kho
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  imageUrl: string;
  variants: ProductVariant[];
  createdAt: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  type: TransactionType;
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // IN: Giá nhập, OUT: Giá bán (đã trừ chiết khấu nếu tính trên đơn vị)
  discount: number; // OUT: Chiết khấu tổng cộng của giao dịch
  total: number; // Tổng giá trị giao dịch (đã trừ chiết khấu nếu OUT)
  date: string;
}

export interface ShopConfig {
  shopName: string;
  ownerName: string;
  nickname: string;
  avatarUrl: string;
  coverUrl: string;
  address: string;
  description: string;
  contact: string;
  exchangeRate: number; // 1 JPY = ? VND
}

export interface UserAuth {
  isAuthenticated: boolean;
  username: string;
}

export interface InventoryCheckItem {
  productId: string;
  variantId: string;
  expectedStock: number;
  actualStock: number;
  diff: number;
}

export interface InventoryCheck {
  id: string;
  createdAt: string;
  note: string;
  items: InventoryCheckItem[];
}
