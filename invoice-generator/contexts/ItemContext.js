"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchItems = useCallback(async (force = false, reset = false) => {
    if (!isLoaded || !user) {
      console.log("ItemContext: User not loaded or not authenticated", {
        isLoaded,
        user: !!user,
      });
      setLoading(false);
      return;
    }

    // Check cache validity for initial load
    const now = Date.now();
    if (!force && !reset && lastFetch && (now - lastFetch) < CACHE_DURATION && items.length > 0) {
      console.log("ItemContext: Using cached data");
      return;
    }

    try {
      const isInitialLoad = reset || items.length === 0;
      if (isInitialLoad) {
        console.log("ItemContext: Fetching items from API");
        setLoading(true);
        setPagination(prev => ({ ...prev, page: 1 }));
      }
      
      setError(null);
      const page = reset ? 1 : pagination.page;
      const response = await axios.get(`/api/items?page=${page}&limit=${pagination.limit}`);
      console.log("ItemContext: Received items:", response.data);
      
      if (reset || isInitialLoad) {
        setItems(response.data.items);
      } else {
        setItems(prev => [...prev, ...response.data.items]);
      }
      
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages,
        hasMore: response.data.pagination.hasMore,
      });
      
      setLastFetch(now);
    } catch (err) {
      console.error("ItemContext: Error fetching items:", err);
      setError(err.response?.data?.error || "Failed to fetch items");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, lastFetch, CACHE_DURATION]);

  const loadMoreItems = useCallback(async () => {
    let currentPagination = null;
    let isCurrentlyLoading = false;
    
    // Get current state values using functional updates
    setPagination(prev => {
      currentPagination = prev;
      return prev;
    });
    
    setLoadingMore(prev => {
      isCurrentlyLoading = prev;
      return prev;
    });
    
    if (!currentPagination.hasMore || isCurrentlyLoading) return;

    try {
      setLoadingMore(true);
      setError(null);
      const nextPage = currentPagination.page + 1;
      const response = await axios.get(`/api/items?page=${nextPage}&limit=${currentPagination.limit}`);
      
      setItems(prev => [...prev, ...response.data.items]);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages,
        hasMore: response.data.pagination.hasMore,
      });
    } catch (err) {
      console.error("ItemContext: Error loading more items:", err);
      setError("Failed to load more items");
    } finally {
      setLoadingMore(false);
    }
  }, []);

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
    fetchItems(true, true); // force refresh and reset pagination
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
    loadingMore,
    error,
    pagination,
    addItem,
    updateItem,
    deleteItem,
    getItemById,
    getItemsForClient,
    refreshItems,
    fetchItems,
    loadMoreItems,
  };

  return <ItemContext.Provider value={value}>{children}</ItemContext.Provider>;
}
