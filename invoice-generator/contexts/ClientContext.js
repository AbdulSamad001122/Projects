"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

const ClientContext = createContext();

export function useClients() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error("useClients must be used within a ClientProvider");
  }
  return context;
}

export function ClientProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchClients = useCallback(async (force = false, reset = false) => {
    if (!isLoaded || !user) return;

    // Check cache validity for initial load
    const now = Date.now();
    if (!force && !reset && lastFetch && (now - lastFetch) < CACHE_DURATION && clients.length > 0) {
      setLoading(false);
      return;
    }

    try {
      const isInitialLoad = reset || clients.length === 0;
      if (isInitialLoad) {
        setLoading(true);
        setPagination(prev => ({ ...prev, page: 1 }));
      }
      
      setError(null);
      const page = reset ? 1 : pagination.page;
      const response = await axios.get(`/api/clients?page=${page}&limit=${pagination.limit}`);
      
      if (reset || isInitialLoad) {
        setClients(response.data.clients);
      } else {
        setClients(prev => [...prev, ...response.data.clients]);
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
      console.error('Error fetching clients:', err);
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user, lastFetch, CACHE_DURATION]);

  const loadMoreClients = useCallback(async () => {
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
      const response = await axios.get(`/api/clients?page=${nextPage}&limit=${currentPagination.limit}`);
      
      setClients(prev => [...prev, ...response.data.clients]);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalCount: response.data.pagination.totalCount,
        totalPages: response.data.pagination.totalPages,
        hasMore: response.data.pagination.hasMore,
      });
    } catch (err) {
      console.error('Error loading more clients:', err);
      setError('Failed to load more clients');
    } finally {
      setLoadingMore(false);
    }
  }, []);

  const addClient = async (clientData) => {
    try {
      const response = await axios.post("/api/clients", clientData);
      const newClient = response.data;

      // Optimistically update the client list
      setClients((prev) => [...prev, newClient]);
      setLastFetch(Date.now());

      return newClient;
    } catch (err) {
      console.error("Error adding client:", err);
      throw err;
    }
  };

  const updateClient = async (
    clientId,
    clientData,
    updateOption = "fromNow"
  ) => {
    try {
      const response = await axios.put("/api/clients", {
        id: clientId,
        ...clientData,
        updateOption,
      });
      const updatedClient = response.data;

      // Optimistically update the client list
      setClients((prev) =>
        prev.map((client) => (client.id === clientId ? updatedClient : client))
      );
      setLastFetch(Date.now());

      return updatedClient;
    } catch (err) {
      console.error("Error updating client:", err);
      throw err;
    }
  };

  const deleteClient = async (clientId) => {
    try {
      await axios.delete(`/api/clients?id=${clientId}`);

      // Optimistically update the client list
      setClients((prev) => prev.filter((client) => client.id !== clientId));
      setLastFetch(Date.now());
    } catch (err) {
      console.error("Error deleting client:", err);
      throw err;
    }
  };

  const getClientById = (clientId) => {
    return clients.find((client) => client.id === clientId);
  };

  const refreshClients = () => {
    fetchClients(true, true); // force refresh and reset pagination
  };

  // Initial fetch when user is loaded
  useEffect(() => {
    if (isLoaded && user) {
      fetchClients();
    }
  }, [isLoaded, user]);

  const value = {
    clients,
    loading,
    loadingMore,
    error,
    pagination,
    fetchClients,
    loadMoreClients,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    refreshClients,
    lastFetch,
  };

  return (
    <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
  );
}
