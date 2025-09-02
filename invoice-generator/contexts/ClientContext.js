"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchClients = async (force = false) => {
    // Skip if not authenticated or still loading
    if (!isLoaded || !user) {
      console.log("ClientContext: User not loaded or not authenticated", {
        isLoaded,
        user: !!user,
      });
      setLoading(false);
      return;
    }

    // Check if we have fresh data and don't need to force refresh
    if (!force && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      console.log("ClientContext: Using cached data");
      return;
    }

    try {
      console.log("ClientContext: Fetching clients from API");
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/clients");
      console.log("ClientContext: Received clients:", response.data);
      setClients(response.data);
      setLastFetch(Date.now());
    } catch (err) {
      console.error("ClientContext: Error fetching clients:", err);
      console.error("ClientContext: Error response:", err.response?.data);
      setError(err.message);
      // Keep existing clients on error to avoid empty state
    } finally {
      setLoading(false);
    }
  };

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
    return fetchClients(true);
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
    error,
    fetchClients,
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
