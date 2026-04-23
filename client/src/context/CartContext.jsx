import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { computeCartTotals } from '../utils/constants';

const CartContext = createContext(null);
const STORAGE_KEY = 'clinipay_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let nextLineId = Date.now();

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addToCart = useCallback((pkg) => {
    setItems((prev) => [
      ...prev,
      {
        lineId: nextLineId++,
        packageId: pkg.id,
        snapshot: {
          name_es: pkg.name_es,
          name_en: pkg.name_en,
          description_es: pkg.description_es,
          description_en: pkg.description_en,
          price: pkg.price,
          currency: pkg.currency || 'USD',
          discount_percentage: Number(pkg.discount_percentage) || 0,
        },
      },
    ]);
  }, []);

  const removeFromCart = useCallback((lineId) => {
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.length;

  const totals = useMemo(() => computeCartTotals(items), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal: totals.subtotal,
        cartDiscount: totals.discount,
        cartTax: totals.tax,
        cartTotal: totals.total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
