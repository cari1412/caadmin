import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mobi.prospecttrade.org/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Добавляем токен авторизации к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обрабатываем ошибки авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === ТИПЫ ===
export interface User {
  id: number;
  email: string;
  name: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  pushTokens: Array<{
    id: number;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    deviceId?: string;
    lastUsed: string;
  }>;
  scheduledNotifications: Array<{
    id: string;
    type: string;
    scheduledFor: string;
  }>;
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  ttl?: number;
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
  };
  pushTokens: {
    total: number;
    active: number;
  };
  notifications: {
    scheduled: number;
    logs: Record<string, number>;
  };
  scheduler: {
    activeTasks: number;
    executedToday: number;
    errors: number;
  };
}

// === AUTH API ===
export async function login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const { access_token } = response.data;
  localStorage.setItem('admin_token', access_token);
  return response.data;
}

export async function logout() {
  localStorage.removeItem('admin_token');
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Игнорируем ошибки logout
  }
}

// === DASHBOARD API ===
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await api.get('/admin/dashboard');
  return response.data;
}

// === USERS API ===
export async function fetchUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const response = await api.get('/admin/users', { params });
  return response.data;
}

export async function fetchUserNotifications(userId: number) {
  const response = await api.get(`/admin/users/${userId}/notifications`);
  return response.data;
}

// === NOTIFICATIONS API ===
export async function sendNotificationToUser(userId: number, notification: NotificationData) {
  const response = await api.post(`/admin/notifications/send-to-user/${userId}`, notification);
  return response.data;
}

export async function sendNotificationToAll(notification: NotificationData) {
  const response = await api.post('/admin/notifications/send-to-all', notification);
  return response.data;
}

export async function sendNotificationToSegment(data: {
  notification: NotificationData;
  criteria: {
    platform?: 'IOS' | 'ANDROID';
    registeredAfter?: string;
    registeredBefore?: string;
    hasActiveTokens?: boolean;
  };
}) {
  const response = await api.post('/admin/notifications/send-to-segment', data);
  return response.data;
}

// === SCHEDULER API ===
export async function fetchScheduledNotifications(params: {
  page?: number;
  limit?: number;
  type?: string;
  executed?: boolean;
}) {
  const response = await api.get('/admin/scheduler/notifications', { params });
  return response.data;
}

export async function cancelScheduledNotification(notificationId: string) {
  const response = await api.delete(`/admin/scheduler/notifications/${notificationId}`);
  return response.data;
}

export async function cleanupScheduler() {
  const response = await api.post('/admin/scheduler/cleanup');
  return response.data;
}

// === ANALYTICS API ===
export async function fetchNotificationAnalytics(days: number = 7) {
  const response = await api.get('/admin/analytics/notifications', { 
    params: { days } 
  });
  return response.data;
}

// === SYSTEM API ===
export async function cleanupInactiveTokens() {
  const response = await api.post('/admin/system/cleanup-tokens');
  return response.data;
}

export async function getSystemHealth() {
  const response = await api.get('/admin/system/health');
  return response.data;
}