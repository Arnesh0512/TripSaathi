import { Platform } from 'react-native';
import { DEV_MACHINE_IP } from '../constants/theme';

export const LOCAL_BACKEND_URL = Platform.OS === 'web' 
  ? 'http://localhost:7000' 
  : `http://${DEV_MACHINE_IP}:7000`;

// Primary live backend deployed on Railway
export const PRIMARY_BACKEND_URL = 'https://tripsaathi-production.up.railway.app';

/**
 * Universal backend caller with automatic fallback:
 * Calls Railway first; if unreachable, falls back seamlessly to Localhost / LAN.
 */
export async function callBackend(endpoint, options = {}, timeoutMs = 4500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${PRIMARY_BACKEND_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    console.warn(`[TripSaathi] Primary Railway (${PRIMARY_BACKEND_URL}) unavailable. Falling back to local (${LOCAL_BACKEND_URL}). Error: ${e.message}`);
  }

  // Fallback to local machine
  return await fetch(`${LOCAL_BACKEND_URL}${endpoint}`, options);
}

// Authentication API
export const authApi = {
  exchangeGoogleToken: async (googleToken) => {
    return await callBackend('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken }),
    });
  },
};

// User Profile API
export const userApi = {
  getProfile: async (jwtToken) => {
    return await callBackend('/user/profile', {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
  },
  updateProfile: async (profileData, jwtToken) => {
    return await callBackend('/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify(profileData),
    });
  },
};

// Trip Management API
export const tripApi = {
  createExistingTrip: async (tripData, jwtToken = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/existing', {
      method: 'POST',
      headers,
      body: JSON.stringify(tripData),
    });
  },
  createPlannedTrip: async (tripData, jwtToken = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/plan', {
      method: 'POST',
      headers,
      body: JSON.stringify(tripData),
    });
  },
  getMyTrips: async (jwtToken = null) => {
    const headers = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/my-trips', {
      method: 'GET',
      headers,
    });
  },
  deleteTrip: async (tripId, jwtToken = null) => {
    const headers = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend(`/trip/${tripId}`, {
      method: 'DELETE',
      headers,
    });
  },
  getActiveDisruption: async (jwtToken = null) => {
    const headers = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/active-disruption', {
      method: 'GET',
      headers,
    });
  },
  toggleDisruptionTodo: async (todoId, done, jwtToken = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/active-disruption/toggle-todo', {
      method: 'POST',
      headers,
      body: JSON.stringify({ todo_id: todoId, done }),
    });
  },
  parseTicketPdf: async (formData, jwtToken = null) => {
    const headers = {};
    if (jwtToken) {
      headers.Authorization = `Bearer ${jwtToken}`;
    }
    return await callBackend('/trip/parse-ticket-pdf', {
      method: 'POST',
      headers,
      body: formData,
    }, 15000);
  },
};
