import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined
    return data?.error?.message ?? error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return '请求失败，请稍后重试'
}
