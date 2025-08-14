import axios from 'axios';

// Use environment variable for production, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = 'your-secret-api-key';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

export interface Venue {
  id: number;
  name: string;
  description: string;
  base_url?: string;
}

export interface Event {
  id: number;
  name: string;
  url: string;
  venue_id: number;
  event_id?: string;
  date?: string;
  time?: string;
}

export interface SearchResult {
  venues: Venue[];
  events: Event[];
}

export const venueApi = {
  getAll: () => api.get<Venue[]>('/venues/'),
  create: (data: Omit<Venue, 'id'>) => api.post<Venue>('/venues/', data),
  createBulk: (data: { bulk_input: string }) => api.post<Venue[]>('/venues/bulk', data),
  update: (id: number, data: Omit<Venue, 'id'>) => api.put<Venue>(`/venues/${id}`, data),
  delete: (id: number) => api.delete(`/venues/${id}`),
};

export const eventApi = {
  getByVenue: (venueId: number) => api.get<Event[]>(`/venues/${venueId}/events/`),
  create: (data: Omit<Event, 'id'>) => api.post<Event>('/events/', data),
  createBulk: (data: { venue_id: number; bulk_input: string }) => api.post<Event[]>('/events/bulk', data),
  update: (id: number, data: Omit<Event, 'id'>) => api.put<Event>(`/events/${id}`, data),
  delete: (id: number) => api.delete(`/events/${id}`),
};

export const searchApi = {
  search: (query: string) => api.get<SearchResult>(`/search?q=${encodeURIComponent(query)}`),
};

// Authentication interfaces
export interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  session_token: string;
  message: string;
}

// Create a separate API instance for auth (no API key required)
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userApi = {
  register: (data: UserRegistration) => authApi.post<User>('/auth/register', data),
  login: (data: UserLogin) => authApi.post<LoginResponse>('/auth/login', data),
  logout: (sessionToken: string) => authApi.post('/auth/logout', { session_token: sessionToken }),
  verifySession: (sessionToken: string) => authApi.get(`/auth/verify-session?session_token=${sessionToken}`),
};