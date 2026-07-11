"use client";

import { createContext, useContext, useMemo, useState } from "react";

interface CategoryContextValue {
  categories: string[];
  selectedCategory: string;
  setCategories: (categories: string[]) => void;
  setSelectedCategory: (category: string) => void;
}

const CategoryContext = createContext<CategoryContextValue | null>(null);

/// Dentro de CategoryShell.tsx
const DEFAULT_CATEGORIES = [
  "Todas",
  "Hortalizas",
  "Aromáticas",
  "Suculentas",
  "Medicinales",
  "Árboles Frutales",
  "Flores",
  "Interior",
];

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  // ✨ Modificado: El estado ahora nace con la lista completa
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  const value = useMemo(
    () => ({
      categories,
      selectedCategory,
      setCategories,
      setSelectedCategory,
    }),
    [categories, selectedCategory]
  );

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategoryShell() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategoryShell must be used within CategoryProvider");
  }
  return context;
}
