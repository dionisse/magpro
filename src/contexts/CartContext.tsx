import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { CartItem, Product } from '../lib/database.types';

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = 'magasinpro_cart_v1';

export function getEffectivePrice(product: Product, quantity: number, priceModifier = 0): number {
  const base = (product.bulk_quantity > 0 && quantity >= product.bulk_quantity && product.bulk_price > 0)
    ? product.bulk_price
    : product.price;
  return Math.max(0, base + priceModifier);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);

  function addToCart(product: Product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) => it.product.id === product.id
          ? { ...it, quantity: Math.min(it.quantity + quantity, product.stock) }
          : it);
      }
      return [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  function removeFromCart(productId: string) {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) { removeFromCart(productId); return; }
    setItems((prev) => prev.map((it) => it.product.id === productId
      ? { ...it, quantity: Math.min(quantity, it.product.stock) }
      : it));
  }

  function clearCart() { setItems([]); }

  const itemCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = items.reduce((acc, it) => acc + getEffectivePrice(it.product, it.quantity) * it.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
