import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Transaction, ShopConfig, UserAuth, InventoryCheck } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
  // Auth
  auth: UserAuth;
  login: (username: string) => void;
  logout: () => void;

  // Config
  config: ShopConfig;
  updateConfig: (config: Partial<ShopConfig>) => void;
  
  // UI Settings
  currency: 'VND' | 'JPY';
  toggleCurrency: () => void;

  // Loading
  isLoading: boolean;

  // Categories
  categories: string[];
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  deleteTransactions: (transactionIds: string[]) => void;
  
  // Inventory Checks
  inventoryChecks: InventoryCheck[];
  addInventoryCheck: (check: InventoryCheck) => void;

  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => boolean;

  // Sync
  fetchAllData: () => Promise<void>;
}

const defaultConfig: ShopConfig = {
  shopName: 'My Fashion Shop',
  ownerName: 'Admin',
  nickname: '',
  avatarUrl: '',
  coverUrl: '',
  address: '',
  description: '',
  contact: '',
  exchangeRate: 165,
};

// Helper: Convert DB row to Product with nested variants
function assembleProducts(
  dbProducts: any[],
  dbVariants: any[]
): Product[] {
  return dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || '',
    imageUrl: p.image_url || '',
    createdAt: p.created_at,
    variants: dbVariants
      .filter(v => v.product_id === p.id)
      .map(v => ({
        id: v.id,
        size: v.size,
        color: v.color,
        price: Number(v.price),
        stock: v.stock,
      })),
  }));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      auth: { isAuthenticated: false, username: '' },
      login: (username) => set({ auth: { isAuthenticated: true, username } }),
      logout: () => set({ auth: { isAuthenticated: false, username: '' } }),

      config: defaultConfig,
      updateConfig: (newConfig) => {
        set((state) => ({ config: { ...state.config, ...newConfig } }));
        // Sync to Supabase
        const merged = { ...get().config, ...newConfig };
        supabase.from('shop_config').update({
          shop_name: merged.shopName,
          owner_name: merged.ownerName,
          nickname: merged.nickname,
          avatar_url: merged.avatarUrl,
          cover_url: merged.coverUrl,
          address: merged.address,
          description: merged.description,
          contact: merged.contact,
          exchange_rate: merged.exchangeRate,
          updated_at: new Date().toISOString(),
        }).not('id', 'is', null).then(({ error }) => {
          if (error) console.error('Failed to sync config:', error);
        });
      },

      currency: 'VND',
      toggleCurrency: () => set((state) => ({ currency: state.currency === 'VND' ? 'JPY' : 'VND' })),

      isLoading: true,

      categories: [],
      addCategory: (category) => {
        set((state) => ({ categories: [...state.categories, category] }));
        supabase.from('categories').insert({ name: category }).then(({ error }) => {
          if (error) console.error('Failed to add category:', error);
        });
      },
      deleteCategory: (category) => {
        set((state) => ({ categories: state.categories.filter(c => c !== category) }));
        supabase.from('categories').delete().eq('name', category).then(({ error }) => {
          if (error) console.error('Failed to delete category:', error);
        });
      },

      products: [],
      addProduct: async (product) => {
        // Optimistic UI update
        set((state) => ({ products: [...state.products, product] }));
        
        // Insert product
        const { error: pErr } = await supabase.from('products').insert({
          id: product.id,
          name: product.name,
          category: product.category || '',
          image_url: product.imageUrl,
          created_at: product.createdAt,
        });
        if (pErr) { console.error('Failed to add product:', pErr); return; }

        // Insert variants
        if (product.variants.length > 0) {
          const variantRows = product.variants.map(v => ({
            id: v.id,
            product_id: product.id,
            size: v.size,
            color: v.color,
            price: v.price,
            stock: v.stock,
          }));
          const { error: vErr } = await supabase.from('product_variants').insert(variantRows);
          if (vErr) console.error('Failed to add variants:', vErr);
        }
      },
      updateProduct: (id, updatedData) => {
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, ...updatedData } : p)
        }));
        // Sync relevant fields
        const dbUpdate: any = {};
        if (updatedData.name !== undefined) dbUpdate.name = updatedData.name;
        if (updatedData.category !== undefined) dbUpdate.category = updatedData.category;
        if (updatedData.imageUrl !== undefined) dbUpdate.image_url = updatedData.imageUrl;
        if (Object.keys(dbUpdate).length > 0) {
          supabase.from('products').update(dbUpdate).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to update product:', error);
          });
        }
      },
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter(p => p.id !== id)
        }));
        // CASCADE will delete variants too
        supabase.from('products').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Failed to delete product:', error);
        });
      },

      transactions: [],
      addTransaction: async (transaction) => {
        // Optimistic: update state immediately
        set((state) => {
          const newProducts = state.products.map(p => {
            if (p.id === transaction.productId) {
              return {
                ...p,
                variants: p.variants.map(v => {
                  if (v.id === transaction.variantId) {
                    const stockChange = transaction.type === 'IN' ? transaction.quantity : -transaction.quantity;
                    return { ...v, stock: v.stock + stockChange };
                  }
                  return v;
                })
              };
            }
            return p;
          });
          return {
            transactions: [...state.transactions, transaction],
            products: newProducts,
          };
        });

        // Sync transaction to Supabase
        const { error: txErr } = await supabase.from('transactions').insert({
          id: transaction.id,
          type: transaction.type,
          product_id: transaction.productId,
          variant_id: transaction.variantId,
          quantity: transaction.quantity,
          price: transaction.price,
          discount: transaction.discount,
          total: transaction.total,
          created_at: transaction.date,
        });
        if (txErr) console.error('Failed to add transaction:', txErr);

        // Update stock in DB
        const variant = get().products
          .find(p => p.id === transaction.productId)
          ?.variants.find(v => v.id === transaction.variantId);
        if (variant) {
          await supabase.from('product_variants')
            .update({ stock: variant.stock })
            .eq('id', transaction.variantId);
        }
      },
      
      deleteTransactions: async (transactionIds) => {
        const state = get();
        const txsToDelete = state.transactions.filter(t => transactionIds.includes(t.id));
        let newProducts = [...state.products];
        
        // Build stock changes map for DB update
        const stockUpdates: Record<string, number> = {};
        
        txsToDelete.forEach(tx => {
          newProducts = newProducts.map(p => {
            if (p.id === tx.productId) {
              return {
                ...p,
                variants: p.variants.map(v => {
                  if (v.id === tx.variantId) {
                    const stockChange = tx.type === 'IN' ? -tx.quantity : tx.quantity;
                    const newStock = v.stock + stockChange;
                    stockUpdates[v.id] = newStock;
                    return { ...v, stock: newStock };
                  }
                  return v;
                })
              };
            }
            return p;
          });
        });

        set({
          transactions: state.transactions.filter(t => !transactionIds.includes(t.id)),
          products: newProducts,
        });

        // Sync to Supabase
        await supabase.from('transactions').delete().in('id', transactionIds);
        
        // Update stock for each affected variant
        for (const [variantId, newStock] of Object.entries(stockUpdates)) {
          await supabase.from('product_variants').update({ stock: newStock }).eq('id', variantId);
        }
      },

      inventoryChecks: [],
      addInventoryCheck: async (check) => {
        set((state) => {
          const newProducts = state.products.map(p => {
            const hasChanges = check.items.some(item => item.productId === p.id);
            if (!hasChanges) return p;
            
            return {
              ...p,
              variants: p.variants.map(v => {
                const checkItem = check.items.find(item => item.variantId === v.id);
                if (checkItem) {
                  return { ...v, stock: checkItem.actualStock };
                }
                return v;
              })
            };
          });

          return {
            inventoryChecks: [check, ...state.inventoryChecks],
            products: newProducts,
          };
        });

        const { error } = await supabase.from('inventory_checks').insert({
          id: check.id,
          created_at: check.createdAt,
          note: check.note,
          items: check.items,
        });
        if (error) console.error('Failed to add inventory check:', error);
        
        for (const item of check.items) {
          if (item.diff !== 0) {
             await supabase.from('product_variants').update({ stock: item.actualStock }).eq('id', item.variantId);
          }
        }
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          config: state.config,
          products: state.products,
          transactions: state.transactions,
          categories: state.categories,
          inventoryChecks: state.inventoryChecks,
        });
      },
      importData: (jsonData: string) => {
        try {
          const data = JSON.parse(jsonData);
          set((state) => ({
            ...state,
            config: data.config || state.config,
            products: data.products || [],
            transactions: data.transactions || [],
            categories: data.categories || state.categories,
            inventoryChecks: data.inventoryChecks || [],
          }));
          return true;
        } catch (error) {
          console.error("Failed to import data", error);
          return false;
        }
      },

      // Fetch all data from Supabase on app startup
      fetchAllData: async () => {
        set({ isLoading: true });
        try {
          const [
            { data: configRows },
            { data: categoryRows },
            { data: productRows },
            { data: variantRows },
            { data: transactionRows },
            { data: checkRows },
          ] = await Promise.all([
            supabase.from('shop_config').select('*').limit(1),
            supabase.from('categories').select('*').order('name'),
            supabase.from('products').select('*').order('name'),
            supabase.from('product_variants').select('*'),
            supabase.from('transactions').select('*').order('created_at', { ascending: true }),
            supabase.from('inventory_checks').select('*').order('created_at', { ascending: false }),
          ]);

          const cfg = configRows?.[0];
          const config: ShopConfig = cfg ? {
            shopName: cfg.shop_name || 'My Fashion Shop',
            ownerName: cfg.owner_name || 'Admin',
            nickname: cfg.nickname || '',
            avatarUrl: cfg.avatar_url || '',
            coverUrl: cfg.cover_url || '',
            address: cfg.address || '',
            description: cfg.description || '',
            contact: cfg.contact || '',
            exchangeRate: Number(cfg.exchange_rate) || 165,
          } : defaultConfig;

          const categories = (categoryRows || []).map((c: any) => c.name);
          const products = assembleProducts(productRows || [], variantRows || []);
          const transactions: Transaction[] = (transactionRows || []).map((t: any) => ({
            id: t.id,
            type: t.type as 'IN' | 'OUT',
            productId: t.product_id,
            variantId: t.variant_id,
            quantity: t.quantity,
            price: Number(t.price),
            discount: Number(t.discount),
            total: Number(t.total),
            date: t.created_at,
          }));

          const inventoryChecks: InventoryCheck[] = (checkRows || []).map((c: any) => ({
            id: c.id,
            createdAt: c.created_at,
            note: c.note,
            items: c.items,
          }));

          set({ config, categories, products, transactions, inventoryChecks, isLoading: false });
        } catch (err) {
          console.error('Failed to fetch data from Supabase:', err);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'clothes-shop-storage',
      // Only persist auth and currency locally (UI settings)
      partialize: (state) => ({
        auth: state.auth,
        currency: state.currency,
      } as any),
    }
  )
);
