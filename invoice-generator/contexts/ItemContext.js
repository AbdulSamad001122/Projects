"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

const ItemContext = createContext();

export function useItems() {
  const context = useContext(ItemContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemProvider");
  }
  return context;
}

export function ItemProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchItems = async (force = false) => {
    // Skip if not authenticated or still loading
    if (!isLoaded || !user) {
      console.log("ItemContext: User not loaded or not authenticated", {
        isLoaded,
        user: !!user,
      });
      setLoading(false);
      return;
    }

    // Check if we have fresh data and don't need to force refresh
    if (!force && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      console.log("ItemContext: Using cached data");
      return;
    }

    try {
      console.log("ItemContext: Fetching items from API");
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/items");
      console.log("ItemContext: Received items:", response.data);
      setItems(response.data);
      setLastFetch(Date.now());
    } catch (err) {
      console.error("ItemContext: Error fetching items:", err);
      setError(err.response?.data?.error || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (itemData) => {
    try {
      setError(null);
      const response = await axios.post("/api/items", itemData);
      const newItem = response.data;
      setItems((prevItems) => [newItem, ...prevItems]);
      setLastFetch(Date.now());
      return newItem;
    } catch (err) {
      console.error("ItemContext: Error adding item:", err);
      const errorMessage = err.response?.data?.error || "Failed to add item";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateItem = async (itemId, itemData) => {
    try {
      setError(null);
      const response = await axios.put(`/api/items/${itemId}`, itemData);
      const updatedItem = response.data;
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? updatedItem : item))
      );
      setLastFetch(Date.now());
      return updatedItem;
    } catch (err) {
      console.error("ItemContext: Error updating item:", err);
      const errorMessage = err.response?.data?.error || "Failed to update item";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      setError(null);
      await axios.delete(`/api/items/${itemId}`);
      setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
      setLastFetch(Date.now());
    } catch (err) {
      console.error("ItemContext: Error deleting item:", err);
      const errorMessage = err.response?.data?.error || "Failed to delete item";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getItemById = (itemId) => {
    return items.find((item) => item.id === itemId);
  };

  const getItemsForClient = async (clientId) => {
    try {
      setError(null);
      const response = await axios.get(`/api/items/client/${clientId}`);
      return response.data;
    } catch (err) {
      console.error("ItemContext: Error fetching items for client:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to fetch items for client";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshItems = () => {
    fetchItems(true);
  };

  // Fetch items when user is loaded
  useEffect(() => {
    if (isLoaded) {
      fetchItems();
    }
  }, [isLoaded, user]);

  const value = {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getItemsForClient,
    refreshItems,
    fetchItems,
  };

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}
