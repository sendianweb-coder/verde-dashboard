import axios from 'axios'

import { useAuthStore } from '@/store/authStore'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  },
)
