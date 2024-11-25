'use client';

import React, { createContext, useContext, useState } from 'react';
import { Meal } from '@/types/meal';

export interface CartItem {
  meal: Meal;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (meal: Meal, quantity: number) => void;
  removeFromCart: (mealId: number) => void;
  updateQuantity: (mealId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (meal: Meal, quantity: number) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.meal.id === meal.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.meal.id === meal.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...currentItems, { meal, quantity }];
    });
  };

  const removeFromCart = (mealId: number) => {
    setItems(currentItems => currentItems.filter(item => item.meal.id !== mealId));
  };

  const updateQuantity = (mealId: number, quantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.meal.id === mealId ? { ...item, quantity } : item
      )
    );
  };
 
  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.meal.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 