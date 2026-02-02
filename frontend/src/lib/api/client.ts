import axios, { type AxiosInstance, type AxiosError } from 'axios';

/**
 * Client API configuré pour le backend NestJS
 * Le proxy Vite redirige /api vers http://localhost:3000
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message =
      (error.response?.data as { message?: string })?.message || error.message;
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);
