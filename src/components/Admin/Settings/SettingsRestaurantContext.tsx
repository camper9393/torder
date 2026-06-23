"use client";

import React from "react";

const STORAGE_KEY = "torder-settings-restaurant-id";

export type SettingsRestaurantContextValue = {
  restaurantId: string | null;
  isPlatformOwner: boolean;
  requiresRestaurantSelection: boolean;
  setSelectedRestaurantId: (id: string) => void;
};

const SettingsRestaurantContext =
  React.createContext<SettingsRestaurantContextValue | null>(null);

export function SettingsRestaurantProvider({
  isPlatformOwner,
  sessionRestaurantId,
  children,
}: {
  isPlatformOwner: boolean;
  sessionRestaurantId: string | null;
  children: React.ReactNode;
}) {
  const [selectedRestaurantId, setSelectedRestaurantIdState] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (!isPlatformOwner) return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedRestaurantIdState(stored);
    }
  }, [isPlatformOwner]);

  const setSelectedRestaurantId = React.useCallback((id: string) => {
    setSelectedRestaurantIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const restaurantId = isPlatformOwner
    ? selectedRestaurantId
    : sessionRestaurantId;

  const requiresRestaurantSelection =
    isPlatformOwner && !selectedRestaurantId;

  const value = React.useMemo(
    () => ({
      restaurantId,
      isPlatformOwner,
      requiresRestaurantSelection,
      setSelectedRestaurantId,
    }),
    [
      restaurantId,
      isPlatformOwner,
      requiresRestaurantSelection,
      setSelectedRestaurantId,
    ]
  );

  return (
    <SettingsRestaurantContext.Provider value={value}>
      {children}
    </SettingsRestaurantContext.Provider>
  );
}

export function useSettingsRestaurantContext(): SettingsRestaurantContextValue {
  const ctx = React.useContext(SettingsRestaurantContext);
  if (!ctx) {
    throw new Error(
      "useSettingsRestaurantContext must be used within SettingsRestaurantProvider"
    );
  }
  return ctx;
}

export function useSettingsRestaurantId(): string | null {
  return useSettingsRestaurantContext().restaurantId;
}
