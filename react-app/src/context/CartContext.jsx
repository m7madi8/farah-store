/**
 * CartContext — global cart state (product ID, quantity, price, total).
 * Cart is stored in memory; optionally persist to backend via API later.
 */

import { createContext, useContext, useReducer, useCallback } from 'react';
import { getCartLineKey, resolveCartLineKey } from '@/lib/cartLineKey';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'farah-cart';

function loadCart() {
  try {
    const s = localStorage.getItem(CART_STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function cartReducer(state, action) {
  let next;
  switch (action.type) {
    case 'ADD': {
      const { productId, name, price, quantity = 1, productSlug, variantKey, lineKey } = action.payload;
      const key = lineKey ?? getCartLineKey(productId, variantKey);
      const existing = state.find((i) => resolveCartLineKey(i) === key);
      if (existing) {
        next = state.map((i) =>
          resolveCartLineKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        next = [
          ...state,
          {
            productId,
            name,
            price,
            quantity,
            lineKey: key,
            ...(variantKey ? { variantKey } : {}),
            ...(productSlug ? { productSlug } : {}),
          },
        ];
      }
      break;
    }
    case 'REMOVE': {
      const index = typeof action.payload === 'number' ? action.payload : state.findIndex((i) => i.productId === action.payload);
      next = index >= 0 ? state.filter((_, i) => i !== index) : state;
      break;
    }
    case 'SET_QUANTITY': {
      const { index, quantity } = action.payload;
      if (quantity <= 0) {
        next = state.filter((_, i) => i !== index);
      } else {
        next = state.map((item, i) => (i === index ? { ...item, quantity } : item));
      }
      break;
    }
    case 'CLEAR':
      next = [];
      break;
    case 'HYDRATE':
      next = Array.isArray(action.payload) ? action.payload : [];
      break;
    default:
      return state;
  }
  saveCart(next);
  return next;
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], (initial) => {
    const loaded = loadCart();
    return loaded.length ? loaded : initial;
  });

  const addItem = useCallback((product) => {
    const variantKey = product.variantKey ?? null;
    const productId = product.id;
    dispatch({
      type: 'ADD',
      payload: {
        productId,
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        quantity: 1,
        variantKey,
        lineKey: getCartLineKey(productId, variantKey),
      },
    });
  }, []);

  const removeItem = useCallback((indexOrProductId) => {
    dispatch({ type: 'REMOVE', payload: indexOrProductId });
  }, []);

  const setQuantity = useCallback((index, quantity) => {
    dispatch({ type: 'SET_QUANTITY', payload: { index, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const total = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  const value = {
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
