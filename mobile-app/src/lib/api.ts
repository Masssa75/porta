import axios from 'axios';

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://portax.netlify.app';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'mobile_app_key_here';

// Create axios instance with defaults
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API endpoints
export const endpoints = {
  // Auth
  register: '/api-auth/register',
  login: '/api-auth/login',
  telegramVerify: '/api-auth/telegram-verify',
  profile: '/api-auth/profile',
  
  // Projects
  projects: '/api-projects',
  searchProjects: '/api-projects/search',
  
  // Alerts
  alerts: '/api/alerts',
  alertPreferences: '/api/alerts/preferences',
  
  // Referrals
  referrals: '/api/referrals',
  createReferral: '/api/referrals/create',
  
  // Premium
  verifyPayment: '/api/premium/verify-payment',
  features: '/api/premium/features',
  walletBalance: '/api/premium/wallet-balance',
};

// Helper functions
export const authAPI = {
  async register(data: any) {
    const response = await api.post(endpoints.register, data);
    return response.data;
  },
  
  async telegramAuth(token: string, chatId: string) {
    const response = await api.post(endpoints.telegramVerify, { token, chatId });
    return response.data;
  },
};

export const projectsAPI = {
  async list() {
    const response = await api.get(endpoints.projects);
    return response.data;
  },
  
  async add(project: { coingeckoId: string; name: string; symbol: string; image?: string }) {
    const response = await api.post(endpoints.projects, {
      coingeckoId: project.coingeckoId,
      name: project.name,
      symbol: project.symbol,
      image: project.image
    });
    return response.data;
  },
  
  async remove(projectId: string) {
    const response = await api.delete(`${endpoints.projects}/${projectId}`);
    return response.data;
  },
  
  async search(query: string) {
    const response = await api.get(`${endpoints.searchProjects}?q=${query}`);
    return response.data;
  },
};

export const referralsAPI = {
  async getStatus() {
    const response = await api.get(endpoints.referrals);
    return response.data;
  },
  
  async createLink() {
    const response = await api.post(endpoints.createReferral);
    return response.data;
  },
};

export default api;