import axios from 'axios'

interface ErrorMessageOptions {
  context?:
    | 'login'
    | 'logout'
    | 'load'
    | 'create'
    | 'update'
    | 'delete'
    | 'approve'
    | 'reject'
    | 'cancel'
    | 'stock'
  fallback?: string
}

interface ApiErrorPayload {
  message?: string
  error?: string
}

const contextFallbacks: Record<NonNullable<ErrorMessageOptions['context']>, string> = {
  login: 'Unable to sign in right now. Please check your credentials and try again.',
  logout: 'Unable to sign out right now. Please try again.',
  load: 'Unable to load data right now. Please refresh and try again.',
  create: 'Unable to complete this action right now. Please try again.',
  update: 'Unable to save your changes right now. Please try again.',
  delete: 'Unable to complete this action right now. Please try again.',
  approve: 'Unable to approve this request right now. Please try again.',
  reject: 'Unable to reject this request right now. Please try again.',
  cancel: 'Unable to cancel this request right now. Please try again.',
  stock: 'Unable to update stock right now. Please try again.',
}

function isLikelyErrorCode(message: string) {
  return /^[A-Z0-9_]+$/.test(message) || /\b(ERR_|E[A-Z0-9_]{2,})\b/.test(message)
}

function sanitizeMessage(message: unknown) {
  if (typeof message !== 'string') {
    return null
  }

  const normalized = message.trim()
  if (!normalized || isLikelyErrorCode(normalized)) {
    return null
  }

  return normalized
}

export function getErrorMessage(error: unknown, options: ErrorMessageOptions = {}) {
  const fallback = options.fallback ?? (options.context ? contextFallbacks[options.context] : contextFallbacks.load)

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Network error. Please check your connection and try again.'
    }

    const status = error.response.status
    const data = error.response.data as ApiErrorPayload | undefined
    const apiMessage = sanitizeMessage(data?.message) ?? sanitizeMessage(data?.error)

    if (options.context === 'login' && (status === 400 || status === 401)) {
      return 'Invalid email or password. Please try again.'
    }

    if (status === 401) {
      return 'Your session has expired. Please sign in again.'
    }

    if (status === 403) {
      return 'You do not have permission to perform this action.'
    }

    if (status === 404) {
      return 'The requested resource could not be found.'
    }

    if (status >= 500) {
      return 'Server error. Please try again in a moment.'
    }

    if (apiMessage) {
      return apiMessage
    }

    return fallback
  }

  if (error instanceof Error) {
    return sanitizeMessage(error.message) ?? fallback
  }

  return fallback
}
