import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  AuthTokens,
  Equipment,
  CampusEvent as Event,
  Hall,
  Notification,
  User,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT access token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token interceptor on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid looping on auth endpoints
    if (
      originalRequest &&
      originalRequest.url?.includes('/auth/') &&
      !originalRequest.url?.includes('/auth/me/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        isRefreshing = false;
        // Fallback for public GET endpoints (like /events/ and /halls/) without auth header
        if (originalRequest.method?.toUpperCase() === 'GET' && originalRequest.headers) {
          delete originalRequest.headers.Authorization;
          return apiClient(originalRequest);
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<AuthTokens>(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        // If public GET request, retry without credentials
        if (originalRequest.method?.toUpperCase() === 'GET' && originalRequest.headers) {
          delete originalRequest.headers.Authorization;
          return apiClient(originalRequest);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth Service
export const authApi = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    return res.data;
  },
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    first_name?: string;
    last_name?: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register/', userData);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me/');
    return res.data;
  },
  updateMe: async (data: Partial<User>): Promise<User> => {
    const res = await apiClient.patch<User>('/auth/me/', data);
    return res.data;
  },
};

// Halls Service
export const hallsApi = {
  list: async (): Promise<Hall[]> => {
    const res = await apiClient.get<Hall[]>('/halls/');
    return res.data;
  },
  get: async (id: number): Promise<Hall> => {
    const res = await apiClient.get<Hall>(`/halls/${id}/`);
    return res.data;
  },
  create: async (data: Partial<Hall>): Promise<Hall> => {
    const res = await apiClient.post<Hall>('/halls/', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Hall>): Promise<Hall> => {
    const res = await apiClient.patch<Hall>(`/halls/${id}/`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/halls/${id}/`);
  },
};

// Equipment Service
export const equipmentApi = {
  list: async (): Promise<Equipment[]> => {
    const res = await apiClient.get<Equipment[]>('/equipment/');
    return res.data;
  },
  checkAvailability: async (
    start: string,
    end: string,
    excludeEventId?: number
  ): Promise<Equipment[]> => {
    const params: Record<string, string | number> = { start, end };
    if (excludeEventId) params.exclude_event = excludeEventId;
    const res = await apiClient.get<Equipment[]>('/equipment/availability/', { params });
    return res.data;
  },
  create: async (data: Partial<Equipment>): Promise<Equipment> => {
    const res = await apiClient.post<Equipment>('/equipment/', data);
    return res.data;
  },
  update: async (id: number, data: Partial<Equipment>): Promise<Equipment> => {
    const res = await apiClient.patch<Equipment>(`/equipment/${id}/`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/equipment/${id}/`);
  },
};

// Events Service
export interface EventQueryParams {
  date?: string;
  start_after?: string;
  end_before?: string;
  status?: string;
  hall?: number;
  organizer?: number;
  search?: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  hall: number;
  start: string;
  end: string;
  expected_attendees: number;
  requested_equipment?: Array<{ equipment: number; quantity: number }>;
}

export const eventsApi = {
  list: async (params?: EventQueryParams): Promise<Event[]> => {
    const res = await apiClient.get<Event[]>('/events/', { params });
    return res.data;
  },
  get: async (id: number): Promise<Event> => {
    const res = await apiClient.get<Event>(`/events/${id}/`);
    return res.data;
  },
  create: async (payload: CreateEventPayload): Promise<Event> => {
    const res = await apiClient.post<Event>('/events/', payload);
    return res.data;
  },
  update: async (id: number, payload: Partial<CreateEventPayload>): Promise<Event> => {
    const res = await apiClient.patch<Event>(`/events/${id}/`, payload);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/events/${id}/`);
  },
  approve: async (id: number): Promise<Event> => {
    const res = await apiClient.post<Event>(`/events/${id}/approve/`);
    return res.data;
  },
  reject: async (id: number): Promise<Event> => {
    const res = await apiClient.post<Event>(`/events/${id}/reject/`);
    return res.data;
  },
  cancel: async (id: number): Promise<Event> => {
    const res = await apiClient.post<Event>(`/events/${id}/cancel/`);
    return res.data;
  },
  register: async (id: number): Promise<{ detail: string; event: Event }> => {
    const res = await apiClient.post<{ detail: string; event: Event }>(`/events/${id}/register/`);
    return res.data;
  },
  unregister: async (id: number): Promise<{ detail: string; event: Event }> => {
    const res = await apiClient.post<{ detail: string; event: Event }>(`/events/${id}/unregister/`);
    return res.data;
  },
};

// Notifications Service
export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>('/notifications/');
    return res.data;
  },
  markRead: async (id: number): Promise<Notification> => {
    const res = await apiClient.post<Notification>(`/notifications/${id}/mark-read/`);
    return res.data;
  },
  markAllRead: async (): Promise<{ detail: string }> => {
    const res = await apiClient.post<{ detail: string }>('/notifications/mark-all-read/');
    return res.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ unread_count: number }>('/notifications/unread-count/');
    return res.data.unread_count;
  },
};
