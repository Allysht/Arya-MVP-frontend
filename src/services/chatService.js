import axios from 'axios';
import { getAuth } from 'firebase/auth';
import config from '../config';

// Create axios instance
const api = axios.create({
  baseURL: config.API_URL
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
  }
  return config;
});

// Chat API functions
export const chatAPI = {
  // Get all user chats
  getChats: async () => {
    const response = await api.get('/api/chats');
    return response.data;
  },

  // Get specific chat by ID
  getChat: async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}`);
    return response.data;
  },

  // Create new chat
  createChat: async (title, message) => {
    const response = await api.post('/api/chats', { title, message });
    return response.data;
  },

  // Add message to chat
  addMessage: async (chatId, role, content) => {
    const response = await api.post(`/api/chats/${chatId}/messages`, {
      role,
      content
    });
    return response.data;
  },

  // Update chat title
  updateChatTitle: async (chatId, title) => {
    const response = await api.patch(`/api/chats/${chatId}/title`, { title });
    return response.data;
  },

  // Delete chat
  deleteChat: async (chatId) => {
    const response = await api.delete(`/api/chats/${chatId}`);
    return response.data;
  },

  // Generate itinerary from trip data (TRIP_READY)
  generateItinerary: async (tripData, conversationHistory = [], userPreferences = {}, userId = 'anonymous', tripProgressId = null) => {
    const response = await api.post('/api/chat/generate-itinerary', {
      tripData,
      conversationHistory,
      userPreferences,
      userId,
      tripProgressId
    });
    return response.data;
  }
};

// Itinerary API functions
export const itineraryAPI = {
  // Get all user itineraries
  getItineraries: async () => {
    const response = await api.get('/api/itineraries');
    return response.data;
  },

  // Get specific itinerary by ID
  getItinerary: async (itineraryId) => {
    const response = await api.get(`/api/itineraries/${itineraryId}`);
    return response.data;
  },

  // Create new itinerary
  createItinerary: async (data) => {
    const response = await api.post('/api/itineraries', data);
    return response.data;
  },

  // Update itinerary
  updateItinerary: async (itineraryId, data) => {
    const response = await api.put(`/api/itineraries/${itineraryId}`, data);
    return response.data;
  },

  // Delete itinerary
  deleteItinerary: async (itineraryId) => {
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

// Trip Progress API functions
export const tripProgressAPI = {
  // Get trip progress for a user
  getProgress: async (userId, chatId = null) => {
    const params = new URLSearchParams({ userId });
    if (chatId) params.append('chatId', chatId);
    const response = await api.get(`/api/trip-progress?${params}`);
    return response.data;
  },

  // Get trip progress by ID
  getProgressById: async (progressId) => {
    const response = await api.get(`/api/trip-progress/${progressId}`);
    return response.data;
  },

  // Create or update trip progress
  updateProgress: async (userId, chatId, fields) => {
    const response = await api.post('/api/trip-progress', {
      userId,
      chatId,
      ...fields
    });
    return response.data;
  },

  // Update specific fields
  patchProgress: async (progressId, fields) => {
    const response = await api.patch(`/api/trip-progress/${progressId}`, fields);
    return response.data;
  },

  // Reset trip progress
  resetProgress: async (progressId) => {
    const response = await api.post(`/api/trip-progress/${progressId}/reset`);
    return response.data;
  },

  // Mark trip as complete
  completeProgress: async (progressId) => {
    const response = await api.post(`/api/trip-progress/${progressId}/complete`);
    return response.data;
  }
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
