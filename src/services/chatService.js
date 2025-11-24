import axios from 'axios';
import config from '../config';
import { useAuth } from '@clerk/clerk-react';

// Get auth token from Clerk
const getAuthToken = async () => {
  // This will be called from components that have access to useAuth
  return null; // Placeholder, will be passed as parameter
};

// Create axios instance with auth interceptor
const createAuthAxios = (getToken) => {
  const instance = axios.create({
    baseURL: config.API_URL
  });

  // Add auth token to all requests
  instance.interceptors.request.use(
    async (config) => {
      if (getToken) {
        const token = await getToken();
        console.log('🔐 Auth token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        console.warn('⚠️ getToken function not provided');
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return instance;
};

// Chat API functions
export const chatAPI = {
  // Get all user chats
  getChats: async (getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.get('/api/chats');
    return response.data;
  },

  // Get specific chat by ID
  getChat: async (chatId, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Create new chat
  createChat: async (title, message, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.post('/api/chats', { title, message });
    return response.data;
  },

  // Add message to chat
  addMessage: async (chatId, role, content, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.post(`/api/chats/${chatId}/messages`, {
      role,
      content
    });
    return response.data;
  },

  // Update chat title
  updateChatTitle: async (chatId, title, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.patch(`/api/chats/${chatId}/title`, { title });
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  }
};

// Itinerary API functions
export const itineraryAPI = {
  // Get all user itineraries
  getItineraries: async (getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.get('/api/itineraries');
    return response.data;
  },

  // Get specific itinerary by ID
  getItinerary: async (itineraryId, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.get(`/api/itineraries/${itineraryId}`);
    return response.data;
  },

  // Create new itinerary
  createItinerary: async (data, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.post('/api/itineraries', data);
    return response.data;
  },

  // Update itinerary
  updateItinerary: async (itineraryId, data, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.put(`/api/itineraries/${itineraryId}`, data);
    return response.data;
  },

  // Delete itinerary
  deleteItinerary: async (itineraryId, getToken) => {
    const api = createAuthAxios(getToken);
    const response = await api.delete(`/api/itineraries/${itineraryId}`);
    return response.data;
  }
};

// Helper to extract itinerary summary from data
export const extractItinerarySummary = (itineraryData) => {
  if (!itineraryData || !itineraryData.itinerary) {
    return null;
  }

  const cities = new Set();
  const highlights = [];

  itineraryData.itinerary.forEach((day) => {
    if (day.activities) {
      day.activities.forEach((activity) => {
        if (activity.name && highlights.length < 5) {
          highlights.push(activity.name);
        }
      });
    }
  });

  return {
    totalDays: itineraryData.itinerary.length,
    cities: Array.from(cities),
    highlights: highlights.slice(0, 5)
  };
};

// Generate a smart chat title from trip details
export const generateChatTitle = (message, destination, duration) => {
  // Try to extract key info from the message or provided details
  if (destination && duration) {
    const cleanDest = destination.replace(/\s+(for|from|-).*$/i, '').trim();
    return `${cleanDest} - ${duration}`;
  }
  
  // Try to extract from message
  const destMatch = message.match(/(?:to|in|visit)\s+([A-Z][a-zA-Z\s]+?)(?:\s+for|\s+from|,|\.|$)/i);
  const durationMatch = message.match(/(\d+\s*(?:day|night|week)s?)/i);
  
  if (destMatch && durationMatch) {
    const dest = destMatch[1].trim();
    const dur = durationMatch[1].trim();
    return `${dest} - ${dur}`;
  } else if (destMatch) {
    return destMatch[1].trim();
  }
  
  // Fallback: use first 50 chars of message
  return message.length > 50 ? message.substring(0, 47) + '...' : message;
};

